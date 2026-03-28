const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// In-memory storage for diagrams
// Format: { [id]: { id, nodes, edges } }
const diagrams = {};

// --- Endpoints ---

// 1. POST /diagram
// Create a new diagram
app.post('/diagram', (req, res) => {
  const { nodes = [], edges = [] } = req.body;
  const id = uuidv4();
  
  diagrams[id] = { id, nodes, edges };
  console.log(`Created new diagram stored at ID: ${id}`);
  
  res.status(201).json(diagrams[id]);
});

// 2. GET /diagram/:id
// Retrieve an existing diagram
app.get('/diagram/:id', (req, res) => {
  const { id } = req.params;
  const diagram = diagrams[id];
  
  if (!diagram) {
    return res.status(404).json({ error: 'Diagram not found' });
  }
  
  res.status(200).json(diagram);
});

// 3. PUT /diagram/:id
// Update an existing diagram
app.put('/diagram/:id', (req, res) => {
  const { id } = req.params;
  const { nodes, edges } = req.body;
  
  if (!diagrams[id]) {
    return res.status(404).json({ error: 'Diagram not found' });
  }
  
  diagrams[id] = { id, nodes: nodes || [], edges: edges || [] };
  console.log(`Updated diagram ID: ${id}`);
  
  res.status(200).json(diagrams[id]);
});

// Basic Health Check Endpoint
app.get('/', (req, res) => {
  res.json({ message: 'Diagram Node.js Memory Backend Running Perfectly.' });
});

// Start the application locally
app.listen(PORT, () => {
  console.log(`Server successfully started on http://localhost:${PORT}`);
});
