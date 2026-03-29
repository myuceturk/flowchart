const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const { getDiagram, saveDiagram, updateDiagram, deleteDiagram, listDiagrams } = require('./db');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Health check
app.get('/', (req, res) => {
  res.json({ message: 'Diagram Node.js SQLite Backend Running.' });
});

// POST /diagram — create a new diagram
app.post('/diagram', (req, res) => {
  try {
    const { nodes = [], edges = [], title = '' } = req.body;
    const id = uuidv4();
    const diagram = saveDiagram(id, title, { nodes, edges });
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
    res.status(200).json({ id: diagram.id, ...diagram.data });
  } catch (err) {
    console.error('GET /diagram/:id error:', err);
    res.status(500).json({ error: 'Failed to retrieve diagram' });
  }
});

// PUT /diagram/:id — update an existing diagram
app.put('/diagram/:id', (req, res) => {
  try {
    const { nodes, edges, title } = req.body;
    const changes = {};
    if (title !== undefined) changes.title = title;
    if (nodes !== undefined || edges !== undefined) {
      const existing = getDiagram(req.params.id);
      if (!existing) return res.status(404).json({ error: 'Diagram not found' });
      changes.data = {
        nodes: nodes !== undefined ? nodes : existing.data.nodes,
        edges: edges !== undefined ? edges : existing.data.edges,
      };
    }
    const diagram = updateDiagram(req.params.id, changes);
    if (!diagram) return res.status(404).json({ error: 'Diagram not found' });
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
    const deleted = deleteDiagram(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Diagram not found' });
    console.log(`Deleted diagram: ${req.params.id}`);
    res.status(200).json({ message: 'Diagram deleted' });
  } catch (err) {
    console.error('DELETE /diagram/:id error:', err);
    res.status(500).json({ error: 'Failed to delete diagram' });
  }
});

// GET /diagrams — list all diagrams (for future list screen)
app.get('/diagrams', (req, res) => {
  try {
    const diagrams = listDiagrams();
    res.status(200).json(diagrams.map(d => ({ id: d.id, title: d.title, created_at: d.created_at, updated_at: d.updated_at })));
  } catch (err) {
    console.error('GET /diagrams error:', err);
    res.status(500).json({ error: 'Failed to list diagrams' });
  }
});

app.listen(PORT, () => {
  console.log(`Server started on http://localhost:${PORT}`);
});
