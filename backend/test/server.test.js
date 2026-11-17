const { test, describe, before, after, beforeEach } = require('node:test');
const assert = require('node:assert');
const http = require('http');
const { WebSocket } = require('ws');
const { app, server, wss } = require('../server');
const db = require('../db');

let testPort = 5055;
let baseUrl = `http://localhost:${testPort}`;
let wsUrl = `ws://localhost:${testPort}`;

function request(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, baseUrl);
    const options = {
      method,
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        let parsed;
        try {
          parsed = JSON.parse(data);
        } catch {
          parsed = data;
        }
        resolve({ status: res.statusCode, headers: res.headers, body: parsed });
      });
    });

    req.on('error', reject);
    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

describe('Live Reviews Backend & WebSocket Tests', () => {
  before(async () => {
    await new Promise((resolve) => server.listen(testPort, resolve));
  });

  after(async () => {
    for (const client of wss.clients) {
      client.terminate();
    }
    await new Promise((resolve) => wss.close(resolve));
    await new Promise((resolve) => server.close(resolve));
  });

  beforeEach(() => {
    db.clearAll();
  });

  test('GET /api/health should return ok', async () => {
    const res = await request('GET', '/api/health');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.status, 'ok');
  });

  test('GET /api/reviews returns empty array initially', async () => {
    const res = await request('GET', '/api/reviews');
    assert.strictEqual(res.status, 200);
    assert.deepStrictEqual(res.body, []);
  });

  test('POST /api/reviews validates required fields', async () => {
    // Missing title
    let res = await request('POST', '/api/reviews', { content: 'Some content' });
    assert.strictEqual(res.status, 400);
    assert.strictEqual(res.body.error, 'Title is required');

    // Empty title
    res = await request('POST', '/api/reviews', { title: '   ', content: 'Some content' });
    assert.strictEqual(res.status, 400);

    // Missing content
    res = await request('POST', '/api/reviews', { title: 'Some title' });
    assert.strictEqual(res.status, 400);
    assert.strictEqual(res.body.error, 'Content is required');
  });

  test('POST /api/reviews creates a review and returns 201', async () => {
    const res = await request('POST', '/api/reviews', {
      title: 'Amazing Product',
      content: 'I really enjoyed using this app.',
    });

    assert.strictEqual(res.status, 201);
    assert.ok(res.body.id);
    assert.strictEqual(res.body.title, 'Amazing Product');
    assert.strictEqual(res.body.content, 'I really enjoyed using this app.');
    assert.ok(res.body.date_time);
  });

  test('GET /api/reviews returns latest review first', async () => {
    db.create({
      title: 'Review 1',
      content: 'Older content',
      date_time: '2026-01-01T10:00:00.000Z',
    });
    db.create({
      title: 'Review 2',
      content: 'Newer content',
      date_time: '2026-01-02T10:00:00.000Z',
    });

    const res = await request('GET', '/api/reviews');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.length, 2);
    assert.strictEqual(res.body[0].title, 'Review 2');
    assert.strictEqual(res.body[1].title, 'Review 1');
  });

  test('GET /api/reviews/:id retrieves single review or 404', async () => {
    const created = db.create({ title: 'Single Test', content: 'Checking getById' });
    
    // Valid ID
    const res1 = await request('GET', `/api/reviews/${created.id}`);
    assert.strictEqual(res1.status, 200);
    assert.strictEqual(res1.body.title, 'Single Test');

    // Invalid ID
    const res2 = await request('GET', '/api/reviews/non-existent-id');
    assert.strictEqual(res2.status, 404);
  });

  test('PUT /api/reviews/:id updates review content', async () => {
    const created = db.create({ title: 'Original', content: 'Original Content' });

    const res = await request('PUT', `/api/reviews/${created.id}`, {
      title: 'Updated Title',
      content: 'Updated Content',
    });

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.title, 'Updated Title');
    assert.strictEqual(res.body.content, 'Updated Content');

    // Verify DB reflection
    const check = db.getById(created.id);
    assert.strictEqual(check.title, 'Updated Title');
  });

  test('DELETE /api/reviews/:id removes review', async () => {
    const created = db.create({ title: 'To Delete', content: 'Content' });

    const res = await request('DELETE', `/api/reviews/${created.id}`);
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.id, created.id);

    // Verify gone
    const check = db.getById(created.id);
    assert.strictEqual(check, null);
  });

  test('WebSocket receives real-time broadcast on CREATE, EDIT, and DELETE', async () => {
    const ws = new WebSocket(wsUrl);
    const messages = [];

    ws.on('message', (data) => {
      messages.push(JSON.parse(data.toString()));
    });

    const waitForMessageCount = (count, timeoutMs = 2000) => {
      return new Promise((resolve, reject) => {
        const start = Date.now();
        const check = () => {
          if (messages.length >= count) {
            resolve();
          } else if (Date.now() - start > timeoutMs) {
            reject(new Error(`Timeout waiting for ${count} messages, got ${messages.length}`));
          } else {
            setTimeout(check, 20);
          }
        };
        check();
      });
    };

    await new Promise((resolve, reject) => {
      ws.on('open', resolve);
      ws.on('error', reject);
    });

    // 1. Handshake message
    await waitForMessageCount(1);
    assert.strictEqual(messages[0].event, 'CONNECTED');

    // 2. Create
    const createRes = await request('POST', '/api/reviews', {
      title: 'WS Test Title',
      content: 'WS Test Content',
    });
    await waitForMessageCount(2);
    assert.strictEqual(messages[1].event, 'REVIEW_ADDED');
    assert.strictEqual(messages[1].data.id, createRes.body.id);

    // 3. Edit
    await request('PUT', `/api/reviews/${createRes.body.id}`, {
      title: 'WS Edited Title',
      content: 'WS Edited Content',
    });
    await waitForMessageCount(3);
    assert.strictEqual(messages[2].event, 'REVIEW_EDITED');
    assert.strictEqual(messages[2].data.title, 'WS Edited Title');

    // 4. Delete
    await request('DELETE', `/api/reviews/${createRes.body.id}`);
    await waitForMessageCount(4);
    assert.strictEqual(messages[3].event, 'REVIEW_DELETED');
    assert.strictEqual(messages[3].data.id, createRes.body.id);

    ws.terminate();
  });
});
