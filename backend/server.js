require('dotenv').config();

const http = require('http');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const pinoHttp = require('pino-http');
const { v4: uuidv4 } = require('uuid');
const logger = require('./logger');
const { db, getDiagram, saveDiagram, updateDiagram, deleteDiagram, listDiagrams } = require('./db');
const { authMiddleware, register, login, me } = require('./auth');
const { setup: setupWs } = require('./ws');
const { generalLimiter, authLimiter, diagramSaveLimiter } = require('./middleware/rateLimiter');
const {
  validateRegister,
  validateLogin,
  validateDiagramCreate,
  validateDiagramUpdate,
  validateDiagramId,
} = require('./middleware/validators');

const app = express();
const PORT = process.env.PORT ?? 3001;
const isProd = process.env.NODE_ENV === 'production';

if (isProd) {
  app.disable('x-powered-by');
}

// ─── Security headers (Helmet) ────────────────────────────────────────────────

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        ...helmet.contentSecurityPolicy.getDefaultDirectives(),
        'connect-src': ["'self'", 'ws:', 'wss:'],
      },
    },
  }),
);

// ─── CORS ─────────────────────────────────────────────────────────────────────

const allowedOrigins = (process.env.CORS_ORIGIN ?? 'http://localhost:5173')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. curl, server-to-server)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      callback(new Error(`CORS: origin '${origin}' not allowed`));
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  }),
);

// ─── Request logging middleware ───────────────────────────────────────────────

app.use(
  pinoHttp({
    logger,
    customSuccessMessage: (req, res) => `${req.method} ${req.url} ${res.statusCode}`,
    customErrorMessage: (req, res, err) => `${req.method} ${req.url} ${res.statusCode} - ${err.message}`,
    customAttributeKeys: { responseTime: 'responseTime' },
    serializers: {
      req: (req) => ({ method: req.method, url: req.url }),
      res: (res) => ({ statusCode: res.statusCode }),
    },
  }),
);

// ─── Body parsing (2 MB limit for large diagrams) ────────────────────────────

app.use(express.json({ limit: '2mb' }));

// ─── General rate limit (all routes) ─────────────────────────────────────────

app.use(generalLimiter);

// Attach req.user on every request (soft — never rejects)
app.use(authMiddleware);

// ─── Auth routes ──────────────────────────────────────────────────────────────

app.post('/auth/register', authLimiter, validateRegister, register);
app.post('/auth/login', authLimiter, validateLogin, login);
app.get('/auth/me', me);

// ─── Health check ─────────────────────────────────────────────────────────────

app.get('/health', (_req, res) => {
  let dbStatus = 'connected';
  try {
    db.prepare('SELECT 1').get();
  } catch {
    dbStatus = 'error';
  }

  res.json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: Date.now(),
    version: process.env.npm_package_version,
    db: dbStatus,
  });
});

app.get('/', (_req, res) => {
  res.json({ message: 'Diagram Node.js SQLite Backend Running.' });
});

// ─── Ownership helper ─────────────────────────────────────────────────────────

/**
 * Returns true if the authenticated user (or anonymous) may access the diagram.
 * Rules:
 *   - diagram.user_id === null  → accessible by everyone (legacy / anonymous)
 *   - authenticated             → must match diagram.user_id
 *   - not authenticated         → only if diagram.user_id is null
 */
function canAccess(diagram, req) {
  if (diagram.user_id === null || diagram.user_id === undefined) return true;
  return req.user && req.user.id === diagram.user_id;
}

// ─── Diagram routes ───────────────────────────────────────────────────────────

// POST /diagram — create a new diagram
app.post('/diagram', diagramSaveLimiter, validateDiagramCreate, (req, res) => {
  try {
    const { nodes = [], edges = [], title = '' } = req.body;
    const id = uuidv4();
    const userId = req.user?.id ?? null;
    const diagram = saveDiagram(id, title, { nodes, edges }, userId);
    logger.info({ diagramId: id }, 'Created diagram');
    res.status(201).json({ id: diagram.id, ...diagram.data });
  } catch (err) {
    logger.error({ err }, 'POST /diagram error');
    res.status(500).json({ error: 'Failed to create diagram' });
  }
});

// GET /diagram/:id — retrieve a diagram
app.get('/diagram/:id', validateDiagramId, (req, res) => {
  try {
    const diagram = getDiagram(req.params.id);
    if (!diagram) return res.status(404).json({ error: 'Diagram not found' });
    if (!canAccess(diagram, req)) return res.status(403).json({ error: 'Access denied' });
    res.status(200).json({ id: diagram.id, ...diagram.data });
  } catch (err) {
    logger.error({ err }, 'GET /diagram/:id error');
    res.status(500).json({ error: 'Failed to retrieve diagram' });
  }
});

// PUT /diagram/:id — update an existing diagram
app.put('/diagram/:id', diagramSaveLimiter, validateDiagramUpdate, (req, res) => {
  try {
    const existing = getDiagram(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Diagram not found' });
    if (!canAccess(existing, req)) return res.status(403).json({ error: 'Access denied' });

    const { nodes, edges, title } = req.body;
    const changes = {};
    if (title !== undefined) changes.title = title;
    if (nodes !== undefined || edges !== undefined) {
      changes.data = {
        nodes: nodes !== undefined ? nodes : existing.data.nodes,
        edges: edges !== undefined ? edges : existing.data.edges,
      };
    }

    const diagram = updateDiagram(req.params.id, changes);
    logger.info({ diagramId: req.params.id }, 'Updated diagram');
    res.status(200).json({ id: diagram.id, ...diagram.data });
  } catch (err) {
    logger.error({ err }, 'PUT /diagram/:id error');
    res.status(500).json({ error: 'Failed to update diagram' });
  }
});

// DELETE /diagram/:id — delete a diagram
app.delete('/diagram/:id', validateDiagramId, (req, res) => {
  try {
    const diagram = getDiagram(req.params.id);
    if (!diagram) return res.status(404).json({ error: 'Diagram not found' });
    if (!canAccess(diagram, req)) return res.status(403).json({ error: 'Access denied' });

    deleteDiagram(req.params.id);
    logger.info({ diagramId: req.params.id }, 'Deleted diagram');
    res.status(200).json({ message: 'Diagram deleted' });
  } catch (err) {
    logger.error({ err }, 'DELETE /diagram/:id error');
    res.status(500).json({ error: 'Failed to delete diagram' });
  }
});

// GET /diagrams — list diagrams (filtered by user when authenticated)
app.get('/diagrams', (req, res) => {
  try {
    const userId = req.user?.id ?? null;
    const diagrams = listDiagrams(userId);
    res.status(200).json(
      diagrams.map((d) => ({
        id: d.id,
        title: d.title,
        created_at: d.created_at,
        updated_at: d.updated_at,
      })),
    );
  } catch (err) {
    logger.error({ err }, 'GET /diagrams error');
    res.status(500).json({ error: 'Failed to list diagrams' });
  }
});

// ─── Global error handlers ────────────────────────────────────────────────────

process.on('unhandledRejection', (reason) => {
  logger.error({ reason }, 'Unhandled promise rejection');
});

process.on('uncaughtException', (err) => {
  logger.error({ err }, 'Uncaught exception — shutting down');
  process.exit(1);
});

const server = http.createServer(app);
setupWs(server);

server.listen(PORT, () => {
  logger.info({ port: PORT }, 'Server started');
});
