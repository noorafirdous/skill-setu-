import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const PORT = 3045;
const baseUrl = `http://127.0.0.1:${PORT}`;

function startServer() {
  const child = spawn(process.execPath, ['server.js'], {
    cwd: projectRoot,
    env: {
      ...process.env,
      PORT: String(PORT),
      NODE_ENV: 'test',
      DATABASE_FILE: ':memory:',
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  child.stderr.on('data', (data) => console.error('[SERVER STDERR]', data.toString()));
  return child;
}

async function waitForServer(child) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < 10000) {
    if (child.exitCode !== null) {
      throw new Error(`Server exited with code ${child.exitCode}`);
    }
    try {
      const res = await fetch(`${baseUrl}/api/health`);
      if (res.ok) return;
    } catch {
      await new Promise((r) => setTimeout(r, 150));
    }
  }
  throw new Error('Server timed out starting on port ' + PORT);
}

test('Authentication Flow - Comprehensive Registration, Validation, Database, CORS & 404', async (t) => {
  const server = startServer();
  try {
    await waitForServer(server);

    // 1. Health check
    const health = await fetch(`${baseUrl}/api/health`).then((r) => r.json());
    assert.equal(health.status, 'healthy');

    // 2. Validate empty/invalid name
    const badNameRes = await fetch(`${baseUrl}/api/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'A', email: 'valid@example.edu', password: 'Password123!' }),
    });
    assert.equal(badNameRes.status, 400);
    const badNameData = await badNameRes.json();
    assert.match(badNameData.message, /full name/i);

    // 3. Validate invalid email
    const badEmailRes = await fetch(`${baseUrl}/api/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Valid Name', email: 'invalid-email', password: 'Password123!' }),
    });
    assert.equal(badEmailRes.status, 400);
    const badEmailData = await badEmailRes.json();
    assert.match(badEmailData.message, /valid email/i);

    // 4. Validate short password
    const badPassRes = await fetch(`${baseUrl}/api/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Valid Name', email: 'valid@example.edu', password: 'short' }),
    });
    assert.equal(badPassRes.status, 400);
    const badPassData = await badPassRes.json();
    assert.match(badPassData.message, /8–128 characters/i);

    // 5. Successful student registration
    const email = `student_${Date.now()}@campus.edu`;
    const regRes = await fetch(`${baseUrl}/api/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Origin: 'https://aindrop-075402.netlify.app',
      },
      body: JSON.stringify({
        name: 'Indhumathi Sharma',
        email,
        password: 'SecurePassword123!',
        college: 'IIT Madras',
        degree: 'B.Tech',
        branch: 'Computer Science and Engineering',
      }),
    });
    if (regRes.status !== 201) {
      const errBody = await regRes.text();
      console.error('Registration failed with status:', regRes.status, errBody);
    }
    assert.equal(regRes.status, 201);
    assert.equal(regRes.headers.get('access-control-allow-origin'), 'https://aindrop-075402.netlify.app');
    const regData = await regRes.json();
    assert.equal(regData.user.name, 'Indhumathi Sharma');
    assert.equal(regData.user.email, email);
    assert.equal(regData.user.college, 'IIT Madras');
    assert.equal(regData.user.degree, 'B.Tech');
    assert.equal(regData.user.branch, 'Computer Science and Engineering');
    assert.equal(regData.user.role, 'Student');

    // 6. Duplicate email registration prevention
    const dupRes = await fetch(`${baseUrl}/api/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Another Student',
        email,
        password: 'Password999!',
        college: 'NIT Trichy',
      }),
    });
    assert.equal(dupRes.status, 409);
    const dupData = await dupRes.json();
    assert.match(dupData.message, /already exists/i);

    // 7. Login with newly registered credentials
    const loginRes = await fetch(`${baseUrl}/api/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Origin: 'https://aindrop-075402.netlify.app',
      },
      body: JSON.stringify({
        email,
        password: 'SecurePassword123!',
        remember: true,
      }),
    });
    assert.equal(loginRes.status, 200);
    const loginData = await loginRes.json();
    assert.equal(loginData.user.email, email);
    assert.equal(loginData.user.name, 'Indhumathi Sharma');
    const cookie = loginRes.headers.get('set-cookie');
    assert.ok(cookie && cookie.includes('skillsetu_session='));

    // 8. Verify authenticated session via /api/me
    const meRes = await fetch(`${baseUrl}/api/me`, {
      headers: { Cookie: cookie },
    });
    assert.equal(meRes.status, 200);
    const meData = await meRes.json();
    assert.equal(meData.user.email, email);
    assert.equal(meData.user.college, 'IIT Madras');
    assert.equal(meData.user.branch, 'Computer Science and Engineering');

    // 9. Login with bad password
    const badLoginRes = await fetch(`${baseUrl}/api/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password: 'WrongPassword!' }),
    });
    assert.equal(badLoginRes.status, 401);
    const badLoginData = await badLoginRes.json();
    assert.match(badLoginData.message, /incorrect/i);

    // 10. Unmatched API endpoint returns structured JSON 404
    const notFoundRes = await fetch(`${baseUrl}/api/unknown-route`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    assert.equal(notFoundRes.status, 404);
    const notFoundData = await notFoundRes.json();
    assert.match(notFoundData.message, /not found/i);

    console.log('✔ All Authentication & Registration validation tests passed (100%).');
  } finally {
    server.kill();
  }
});
