const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('./db');

const JWT_SECRET = process.env.JWT_SECRET || 'flowdiagram-dev-secret-change-in-production';
const JWT_EXPIRES_IN = '7d';
const SALT_ROUNDS = 10;

// ─── JWT helpers ─────────────────────────────────────────────────────────────

function signToken(userId) {
  return jwt.sign({ sub: userId }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN, algorithm: 'HS256' });
}

function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}

// ─── Middleware ───────────────────────────────────────────────────────────────

/**
 * Soft auth middleware — attaches req.user if a valid Bearer token is present.
 * Never rejects; downstream routes decide whether auth is required.
 */
function authMiddleware(req, _res, next) {
  const authHeader = req.headers.authorization ?? '';
  if (authHeader.startsWith('Bearer ')) {
    const token = authHeader.slice(7);
    const payload = verifyToken(token);
    if (payload) {
      req.user = db.getUserById(payload.sub);
    }
  }
  req.user = req.user ?? null;
  next();
}

/**
 * Hard auth guard — returns 401 if req.user is not set.
 */
function requireAuth(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  next();
}

// ─── Route handlers ───────────────────────────────────────────────────────────

async function register(req, res) {
  try {
    const { email, password } = req.body ?? {};

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return res.status(400).json({ error: 'Valid email is required' });
    }
    if (!password || typeof password !== 'string' || password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const existing = db.getUserByEmail(email.toLowerCase().trim());
    if (existing) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    const password_hash = await bcrypt.hash(password, SALT_ROUNDS);
    const user = db.createUser(email.toLowerCase().trim(), password_hash);

    const token = signToken(user.id);
    return res.status(201).json({ token, user: { id: user.id, email: user.email } });
  } catch (err) {
    console.error('POST /auth/register error:', err);
    return res.status(500).json({ error: 'Registration failed' });
  }
}

async function login(req, res) {
  try {
    const { email, password } = req.body ?? {};

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = db.getUserByEmail(email.toLowerCase().trim());
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = signToken(user.id);
    return res.status(200).json({ token, user: { id: user.id, email: user.email } });
  } catch (err) {
    console.error('POST /auth/login error:', err);
    return res.status(500).json({ error: 'Login failed' });
  }
}

function me(req, res) {
  if (!req.user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  return res.status(200).json({ user: { id: req.user.id, email: req.user.email } });
}

module.exports = { authMiddleware, requireAuth, register, login, me, verifyToken };
