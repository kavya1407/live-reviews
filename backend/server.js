const http = require('http');
const express = require('express');
const cors = require('cors');
const { WebSocketServer, WebSocket } = require('ws');
const db = require('./db');

const app = express();
const server = http.createServer(app);

// Middlewares
app.use(cors());
app.use(express.json());

// WebSocket Server
const wss = new WebSocketServer({ server });

/**
 * Broadcast message to all connected clients
 */
function broadcast(event, data) {
  const payload = JSON.stringify({
    event,
    action: event,
    data,
    timestamp: new Date().toISOString(),
  });

  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      try {
        client.send(payload);
      } catch (err) {
        console.error('[WS] Send error:', err.message);
      }
    }
  });
}

wss.on('connection', (ws) => {
  console.log('[WS] Client connected. Total clients:', wss.clients.size);

  // Send initial handshake
  ws.send(
    JSON.stringify({
      event: 'CONNECTED',
      action: 'CONNECTED',
      message: 'Connected to Live Reviews WebSocket server',
      timestamp: new Date().toISOString(),
    })
  );

  ws.on('close', () => {
    console.log('[WS] Client disconnected. Total clients:', wss.clients.size);
  });

  ws.on('error', (err) => {
    console.error('[WS] Client error:', err.message);
  });
});

// REST API Endpoints

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 1. Get all reviews (latest first)
app.get('/api/reviews', (req, res) => {
  try {
    const reviews = db.getAll();
    res.json(reviews);
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve reviews', details: err.message });
  }
});

// 2. Get single review by id
app.get('/api/reviews/:id', (req, res) => {
  try {
    const review = db.getById(req.params.id);
    if (!review) {
      return res.status(404).json({ error: 'Review not found' });
    }
    res.json(review);
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve review', details: err.message });
  }
});

// 3. Create new review (or restore with existing id/date)
app.post('/api/reviews', (req, res) => {
  try {
    const { title, content, id, date_time } = req.body;

    if (!title || typeof title !== 'string' || !title.trim()) {
      return res.status(400).json({ error: 'Title is required' });
    }
    if (!content || typeof content !== 'string' || !content.trim()) {
      return res.status(400).json({ error: 'Content is required' });
    }

    const newReview = db.create({
      title: title.trim(),
      content: content.trim(),
      id,
      date_time,
    });

    // Broadcast creation
    broadcast('REVIEW_ADDED', newReview);

    res.status(201).json(newReview);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create review', details: err.message });
  }
});

// 4. Update existing review
app.put('/api/reviews/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { title, content } = req.body;

    if (!title || typeof title !== 'string' || !title.trim()) {
      return res.status(400).json({ error: 'Title is required' });
    }
    if (!content || typeof content !== 'string' || !content.trim()) {
      return res.status(400).json({ error: 'Content is required' });
    }

    const updated = db.update(id, {
      title: title.trim(),
      content: content.trim(),
    });

    if (!updated) {
      return res.status(404).json({ error: 'Review not found' });
    }

    // Broadcast update
    broadcast('REVIEW_EDITED', updated);

    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update review', details: err.message });
  }
});

// 5. Delete review
app.delete('/api/reviews/:id', (req, res) => {
  try {
    const { id } = req.params;
    const deleted = db.deleteById(id);

    if (!deleted) {
      return res.status(404).json({ error: 'Review not found' });
    }

    // Broadcast deletion
    broadcast('REVIEW_DELETED', deleted);

    res.json(deleted);
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete review', details: err.message });
  }
});

const PORT = process.env.PORT || 5000;

if (require.main === module) {
  server.listen(PORT, () => {
    console.log(`[Backend] Live Reviews server running on http://localhost:${PORT}`);
    console.log(`[Backend] WebSocket server listening on ws://localhost:${PORT}`);
  });
}

module.exports = { app, server, wss, broadcast };
