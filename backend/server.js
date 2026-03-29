const http = require('http');
const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const { getDiagram, saveDiagram, updateDiagram, deleteDiagram, listDiagrams } = require('./db');
const { authMiddleware, register, login, me } = require('./auth');
const { setup: setupWs } = require('./ws');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Attach req.user on every request (soft — never rejects)
app.use(authMiddleware);

// ─── Auth routes ──────────────────────────────────────────────────────────────

app.post('/auth/register', register);
app.post('/auth/login', login);
app.get('/auth/me', me);

// ─── Health check ─────────────────────────────────────────────────────────────

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
app.post('/diagram', (req, res) => {
  try {
    const { nodes = [], edges = [], title = '' } = req.body;
    const id = uuidv4();
    const userId = req.user?.id ?? null;
    const diagram = saveDiagram(id, title, { nodes, edges }, userId);
    console.log(`Created diagram: ${id}`);
    res.status(201).json({ id: diagram.id, ...diagram.data });
  } catch (err) {
    console.error('POST /diagram error:', err);
    res.status(500).json({ error: 'Failed to create diagram' });
  }
});

// GET /diagram/:id — retrieve a diagram
app.get('/diagram/:id', (req, res) => {
  try {
    const diagram = getDiagram(req.params.id);
    if (!diagram) return res.status(404).json({ error: 'Diagram not found' });
    if (!canAccess(diagram, req)) return res.status(403).json({ error: 'Access denied' });
    res.status(200).json({ id: diagram.id, ...diagram.data });
  } catch (err) {
    console.error('GET /diagram/:id error:', err);
    res.status(500).json({ error: 'Failed to retrieve diagram' });
  }
});

// PUT /diagram/:id — update an existing diagram
app.put('/diagram/:id', (req, res) => {
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
    console.log(`Updated diagram: ${req.params.id}`);
    res.status(200).json({ id: diagram.id, ...diagram.data });
  } catch (err) {
    console.error('PUT /diagram/:id error:', err);
    res.status(500).json({ error: 'Failed to update diagram' });
  }
});

// DELETE /diagram/:id — delete a diagram
app.delete('/diagram/:id', (req, res) => {
  try {
    const diagram = getDiagram(req.params.id);
    if (!diagram) return res.status(404).json({ error: 'Diagram not found' });
    if (!canAccess(diagram, req)) return res.status(403).json({ error: 'Access denied' });

    deleteDiagram(req.params.id);
    console.log(`Deleted diagram: ${req.params.id}`);
    res.status(200).json({ message: 'Diagram deleted' });
  } catch (err) {
    console.error('DELETE /diagram/:id error:', err);
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
    console.error('GET /diagrams error:', err);
    res.status(500).json({ error: 'Failed to list diagrams' });
  }
});

const server = http.createServer(app);
setupWs(server);

server.listen(PORT, () => {
  console.log(`Server started on http://localhost:${PORT}`);
});
