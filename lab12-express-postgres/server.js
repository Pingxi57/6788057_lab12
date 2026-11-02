const express = require('express');
const { Pool } = require('pg');
const app = express();
const pool = new Pool({ max: 5, connectionTimeoutMillis: 3000, idleTimeoutMillis: 10000 });
const port = Number(process.env.PORT || 3000);
app.use(express.json({ limit: '8kb' }));
pool.on('error', () => console.warn('Database connection interrupted; a later request will reconnect.'));

app.get('/', (_req, res) => res.json({ message: 'Lab 12: Express + PostgreSQL', lab: 12 }));
app.get('/health', async (_req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok', database: 'connected', framework: 'express' });
  } catch {
    res.status(503).json({ status: 'error', database: 'unavailable', framework: 'express' });
  }
});
app.get('/notes', async (_req, res) => {
  try {
    const result = await pool.query('SELECT id, student_id, body, created_at FROM notes ORDER BY id LIMIT 1000');
    res.json(result.rows);
  } catch {
    res.status(503).json({ error: 'Database unavailable; retry after it recovers.' });
  }
});
app.post('/notes', async (req, res) => {
  const studentId = typeof req.body?.student_id === 'string' ? req.body.student_id.trim() : '';
  const body = typeof req.body?.body === 'string' ? req.body.body.trim() : '';
  if (!/^[A-Za-z0-9_-]{1,30}$/.test(studentId) || body.length < 1 || body.length > 200) {
    return res.status(400).json({ error: 'Use student_id (1-30 letters/digits/_/-) and body (1-200 characters).' });
  }
  try {
    const result = await pool.query(
      'INSERT INTO notes (student_id, body) VALUES ($1, $2) RETURNING id, student_id, body, created_at',
      [studentId, body]
    );
    res.status(201).json(result.rows[0]);
  } catch {
    res.status(503).json({ error: 'Database unavailable; retry after it recovers.' });
  }
});
app.use((error, _req, res, _next) => {
  res.status(error instanceof SyntaxError ? 400 : 500).json({ error: 'Invalid request.' });
});

let server;
let stopping = false;
async function stop() {
  if (stopping) return;
  stopping = true;
  const timer = setTimeout(() => process.exit(1), 8000).unref();
  if (server) await new Promise(resolve => server.close(resolve));
  await pool.end();
  clearTimeout(timer);
  process.exit(0);
}
process.on('SIGTERM', stop);
process.on('SIGINT', stop);
async function start() {
  for (let attempt = 1; attempt <= 15; attempt += 1) {
    try {
      await pool.query('SELECT 1');
      server = app.listen(port, '0.0.0.0', () => console.log(`Express listening on port ${port}; database ready.`));
      return;
    } catch {
      if (attempt === 15) throw new Error('Database did not become available within the startup retry budget.');
      console.log(`Waiting for database (${attempt}/15).`);
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
}
start().catch(async () => {
  console.error('Startup failed: check database service and PG environment variables.');
  await pool.end();
  process.exit(1);
});
