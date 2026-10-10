import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { createServer } from 'node:net';
import { once } from 'node:events';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import { fileURLToPath } from 'node:url';
import { mkdtemp, rm } from 'node:fs/promises';
import test from 'node:test';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

async function availablePort() {
  const probe = createServer();
  probe.listen(0, '127.0.0.1');
  await once(probe, 'listening');
  const { port } = probe.address();
  await new Promise((resolve, reject) => probe.close((error) => error ? reject(error) : resolve()));
  return port;
}

async function readJson(response) {
  const text = await response.text();
  return text ? JSON.parse(text) : {};
}

async function api(baseUrl, route, { method = 'GET', body, cookie } = {}) {
  const response = await fetch(`${baseUrl}${route}`, {
    method,
    headers: {
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...(cookie ? { Cookie: cookie } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  return { response, data: await readJson(response) };
}

async function waitForApi(baseUrl, child, output) {
  for (let attempt = 0; attempt < 150; attempt += 1) {
    if (child.exitCode !== null) throw new Error(`API exited during startup with exit code ${child.exitCode}. Logs:\n${output()}`);
    try {
      const response = await fetch(`${baseUrl}/api/me`);
      if (response.status === 200) return;
    } catch {
      await delay(100);
    }
  }
  throw new Error(`API did not become ready at ${baseUrl}. Logs:\n${output()}`);
}

test('AI Technical Interview & Proctoring System end-to-end workflow', { timeout: 60000 }, async () => {
  const directory = await mkdtemp(path.join(tmpdir(), 'skillsetu-interview-'));
  const databasePath = path.join(directory, 'test.db');
  const port = await availablePort();
  const baseUrl = `http://127.0.0.1:${port}`;
  let logs = '';

  const child = spawn(process.execPath, ['server.js'], {
    cwd: root,
    env: {
      ...process.env,
      PORT: String(port),
      DATABASE_PATH: databasePath,
      NODE_ENV: 'test',
      APP_URL: 'http://localhost:5175',
      CORS_ORIGIN: 'http://localhost:5175'
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  child.stdout.on('data', (chunk) => { logs += chunk.toString(); });
  child.stderr.on('data', (chunk) => { logs += chunk.toString(); });

  try {
    await waitForApi(baseUrl, child, () => logs);

    // 1. Register and Login candidate
    const registerRes = await api(baseUrl, '/api/register', {
      method: 'POST',
      body: {
        name: 'Devika Sharma',
        email: 'devika.sharma@example.edu',
        password: 'ValidCandidatePass123!',
        role: 'Student',
        college: 'IIIT Hyderabad',
        degree: 'B.Tech',
        branch: 'Computer Science',
        studyYear: '3rd year',
      },
    });
    assert.equal(registerRes.response.status, 201, 'Candidate registration should succeed');

    const loginRes = await api(baseUrl, '/api/login', {
      method: 'POST',
      body: {
        email: 'devika.sharma@example.edu',
        password: 'ValidCandidatePass123!',
        remember: true,
      },
    });
    assert.equal(loginRes.response.status, 200, 'Candidate login should succeed');
    const cookie = loginRes.response.headers.get('set-cookie')?.split(';')[0];
    assert.ok(cookie, 'Auth cookie must be present');

    // 2. Create Python Technical Interview (20 Questions)
    const createRes = await api(baseUrl, '/api/interviews', {
      method: 'POST',
      cookie,
      body: {
        language: 'Python',
        difficulty: 'Intermediate',
        topics: ['Fundamentals', 'Data Structures', 'OOP', 'DBMS', 'Operating Systems', 'Networks'],
        durationMinutes: 30,
        questionCount: 20,
        mode: 'camera',
        title: 'Python Intermediate Technical Interview',
      },
    });

    assert.equal(createRes.response.status, 201, 'Interview creation must return 201');
    const interviewId = createRes.data.interviewId;
    assert.ok(interviewId, 'Interview ID must be returned');
    assert.ok(createRes.data.questions, 'Questions must be returned');
    assert.ok(createRes.data.questions.length >= 20, `Must generate at least 20 questions, got ${createRes.data.questions.length}`);

    // Verify first question structure
    const q1 = createRes.data.questions[0];
    assert.ok(q1.title, 'Question must have title');
    assert.ok(q1.question_text, 'Question must have question text');
    assert.ok(q1.topic, 'Question must have topic');

    // 3. Fetch active interview workspace
    const fetchRes = await api(baseUrl, `/api/interviews/${interviewId}`, { cookie });
    assert.equal(fetchRes.response.status, 200, 'Workspace fetch must succeed');
    assert.equal(fetchRes.data.session.id, interviewId);
    assert.equal(fetchRes.data.questions.length >= 20, true);

    // 4. Save answers for questions
    const saveAns1 = await api(baseUrl, `/api/interviews/${interviewId}/answers`, {
      method: 'POST',
      cookie,
      body: {
        questionId: q1.id,
        answerText: 'The GIL (Global Interpreter Lock) in CPython is a mutex lock preventing multiple native threads from executing bytecodes concurrently. It allows CPython to have thread-safe reference counting memory management. Multiprocessing or asyncio can bypass it for CPU/IO workloads.',
        codeContent: 'import threading\nlock = threading.Lock()\nwith lock:\n    counter += 1',
        timeSpentSeconds: 45,
        status: 'answered',
      },
    });
    assert.equal(saveAns1.response.status, 200, 'Answer save must succeed');

    const q2 = createRes.data.questions[1];
    const saveAns2 = await api(baseUrl, `/api/interviews/${interviewId}/answers`, {
      method: 'POST',
      cookie,
      body: {
        questionId: q2.id,
        answerText: 'Output is [1], [1, 2], [3], [1, 2, 4] due to mutable default argument list binding in Python definition time.',
        codeContent: '',
        timeSpentSeconds: 30,
        status: 'answered',
      },
    });
    assert.equal(saveAns2.response.status, 200, 'Answer 2 save must succeed');

    // 5. Record proctoring telemetry events
    const act1 = await api(baseUrl, `/api/interviews/${interviewId}/activity`, {
      method: 'POST',
      cookie,
      body: {
        eventType: 'eye_contact_lost',
        severity: 'warning',
        details: 'Gaze drifted away from center for 3 seconds',
      },
    });
    assert.equal(act1.response.status, 201, 'Activity logging must succeed');

    const act2 = await api(baseUrl, `/api/interviews/${interviewId}/activity`, {
      method: 'POST',
      cookie,
      body: {
        eventType: 'tab_switch',
        severity: 'warning',
        details: 'User switched browser tab',
      },
    });
    assert.equal(act2.response.status, 201, 'Tab switch activity logging must succeed');

    // 6. Finalize interview & trigger AI evaluation
    const finishRes = await api(baseUrl, `/api/interviews/${interviewId}/finish`, {
      method: 'POST',
      cookie,
    });
    assert.equal(finishRes.response.status, 200, 'Finish interview must return 200');
    assert.ok(finishRes.data.evaluation, 'Evaluation report must be returned');
    assert.ok(typeof finishRes.data.evaluation.overallScore === 'number', 'Overall score must be a number');
    assert.ok(Array.isArray(finishRes.data.evaluation.strengths), 'Strengths must be an array');
    assert.ok(Array.isArray(finishRes.data.evaluation.weaknesses), 'Weaknesses must be an array');
    assert.ok(finishRes.data.evaluation.topicBreakdown, 'Topic breakdown must exist');
    assert.ok(finishRes.data.evaluation.proctoringSummary, 'Proctoring summary must exist');
    assert.equal(finishRes.data.evaluation.proctoringSummary.tabSwitches, 1, 'Tab switch count must match logged telemetry');

    // 7. Get full evaluation results dashboard
    const resultsRes = await api(baseUrl, `/api/interviews/${interviewId}/results`, { cookie });
    assert.equal(resultsRes.response.status, 200, 'Results fetch must succeed');
    assert.equal(resultsRes.data.session.status, 'completed', 'Session status must be completed');
    assert.ok(resultsRes.data.evaluation.questionFeedback.length >= 20, 'All 20 questions must have evaluation feedback');

    // 8. List interviews history
    const listRes = await api(baseUrl, '/api/interviews', { cookie });
    assert.equal(listRes.response.status, 200, 'List interviews must succeed');
    assert.equal(listRes.data.interviews.length, 1, 'User must have 1 interview session recorded');
    assert.equal(listRes.data.interviews[0].status, 'completed');

    // 9. Unauthorized isolation test: another student cannot access Devika's interview
    await api(baseUrl, '/api/register', {
      method: 'POST',
      body: {
        name: 'Kunal Verma',
        email: 'kunal.v@example.edu',
        password: 'ValidCandidatePass123!',
        role: 'Student',
      },
    });
    const loginOther = await api(baseUrl, '/api/login', {
      method: 'POST',
      body: {
        email: 'kunal.v@example.edu',
        password: 'ValidCandidatePass123!',
      },
    });
    const cookieOther = loginOther.response.headers.get('set-cookie')?.split(';')[0];
    const unauthorizedFetch = await api(baseUrl, `/api/interviews/${interviewId}`, { cookie: cookieOther });
    assert.equal(unauthorizedFetch.response.status, 404, 'Other students must not be able to view another candidate interview');

    // 10. Multi-language interview session generation verification
    const testLanguages = ['JavaScript', 'Java', 'C++', 'C', 'TypeScript', 'Go', 'Rust'];
    for (const lang of testLanguages) {
      const langRes = await api(baseUrl, '/api/interviews', {
        method: 'POST',
        cookie,
        body: {
          language: lang,
          difficulty: 'Advanced',
          topics: ['Fundamentals', 'Data Structures', 'OOP', 'DBMS', 'Operating Systems', 'Complexity'],
          durationMinutes: 45,
          questionCount: 20,
          mode: 'camera',
          title: `${lang} Advanced Technical Assessment`,
        },
      });

      assert.equal(langRes.response.status, 201, `${lang} interview creation must succeed`);
      assert.ok(langRes.data.questions.length >= 20, `${lang} interview must contain at least 20 questions, got ${langRes.data.questions.length}`);
      
      const langQuestions = langRes.data.questions;
      for (const q of langQuestions) {
        assert.ok(q.title, `${lang} question must have a title`);
        assert.ok(q.question_text, `${lang} question must have question text`);
        assert.ok(q.topic, `${lang} question must have a topic`);
      }

      // Finish one of the multi-language interviews to verify evaluation report
      if (lang === 'JavaScript') {
        const jsFinish = await api(baseUrl, `/api/interviews/${langRes.data.interviewId}/finish`, {
          method: 'POST',
          cookie,
        });
        assert.equal(jsFinish.response.status, 200, 'JavaScript interview finish must succeed');
        assert.ok(jsFinish.data.evaluation.questionFeedback.length >= 20, 'JavaScript feedback must cover all 20 questions');
        assert.ok(jsFinish.data.evaluation.totalMaxMarks === 100, 'Total max marks must be 100');
      }
    }

    console.log('>>> ALL AI TECHNICAL INTERVIEW & MULTI-LANGUAGE PROCTORING TESTS PASSED (100%) <<<');
  } finally {
    child.kill('SIGINT');
    await rm(directory, { recursive: true, force: true }).catch(() => {});
  }
});
