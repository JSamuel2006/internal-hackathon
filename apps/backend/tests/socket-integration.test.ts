import http from 'http';
import express from 'express';
import { io as ClientIO } from 'socket.io-client';
import jwt from 'jsonwebtoken';
import { env } from '../src/configuration/environment.js';
import { pool } from '../src/database/db.js';
import { initializeSocketServer } from '../src/socket/socketServer.js';
import { doctorRepository } from '../src/repositories/doctorRepository.js';
import { emergencyService } from '../src/services/emergencyService.js';
import { emergencyDoctorChatService } from '../src/services/emergencyDoctorChatService.js';

const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const RESET = '\x1b[0m';

let passed = 0;
let failed = 0;

function assert(condition: boolean, message: string) {
  if (condition) {
    console.log(`${GREEN}✅ PASS${RESET}  ${message}`);
    passed++;
  } else {
    console.log(`${RED}❌ FAIL${RESET}  ${message}`);
    failed++;
  }
}

async function runTests() {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  ArogyaMitra Socket.IO E2E & Integration Tests');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const app = express();
  const server = http.createServer(app);
  initializeSocketServer(server);

  await new Promise<void>((resolve) => server.listen(4050, resolve));

  const validToken = jwt.sign(
    { sub: 'doc-demo', name: 'Dr. Rajesh Sharma', email: 'doctor@arogyamitra.demo', role: 'ROLE_DOCTOR' },
    env.JWT_SECRET
  );

  const invalidToken = 'invalid-token-value';

  // T01 — Unauthenticated connection is rejected
  try {
    const socket = ClientIO('http://localhost:4050', {
      auth: { token: invalidToken },
      transports: ['websocket'],
    });

    await new Promise<void>((resolve, reject) => {
      socket.on('connect', () => {
        socket.disconnect();
        reject(new Error('Should not have connected'));
      });
      socket.on('connect_error', (err) => {
        assert(err.message.includes('Authentication error'), 'T01 — Unauthenticated socket is rejected');
        socket.disconnect();
        resolve();
      });
    });
  } catch (err: any) {
    assert(false, `T01 — Unauthenticated socket check threw error: ${err.message}`);
  }

  // T02 — Authenticated doctor can connect
  let doctorSocket: any;
  try {
    doctorSocket = ClientIO('http://localhost:4050', {
      auth: { token: validToken },
      transports: ['websocket'],
    });

    await new Promise<void>((resolve, reject) => {
      doctorSocket.on('connect', () => {
        assert(true, 'T02 — Authenticated doctor can connect');
        resolve();
      });
      doctorSocket.on('connect_error', (err) => {
        reject(err);
      });
    });
  } catch (err: any) {
    assert(false, `T02 — Authenticated connection failed: ${err.message}`);
  }

  // T03 — Authenticated citizen can connect
  const citizenToken = jwt.sign(
    { sub: 'usr-citizen-demo', name: 'Rahul Verma', email: 'citizen.rahul@gmail.com', role: 'ROLE_CITIZEN' },
    env.JWT_SECRET
  );
  let citizenSocket: any;
  try {
    citizenSocket = ClientIO('http://localhost:4050', {
      auth: { token: citizenToken },
      transports: ['websocket'],
    });

    await new Promise<void>((resolve) => {
      citizenSocket.on('connect', () => {
        assert(true, 'T03 — Authenticated citizen can connect');
        resolve();
      });
    });
  } catch (err: any) {
    assert(false, `T03 — Citizen connection failed: ${err.message}`);
  }

  // T04 & T05 — Request persistence before emission
  try {
    await doctorRepository.updateAvailability('doc-demo', 'AVAILABLE');

    const sessionObj = await emergencyService.createSession({
      userId: 'usr-citizen-demo',
      symptoms: ['acute pain', 'dizziness'],
      latitude: 18.5204,
      longitude: 73.8567,
    });
    const sessionId = sessionObj.session.id;

    const eventPromise = new Promise<void>((resolve) => {
      doctorSocket.on('emergency_request_created', async (data: any) => {
        const dbRes = await pool.query('SELECT * FROM emergency_doctor_requests WHERE id = $1', [data.requestId]);
        assert(dbRes.rows.length > 0, 'T04 — Request is persisted in database before socket emission');
        assert(dbRes.rows[0].status === 'REQUESTED', 'T05 — Persisted request status is REQUESTED');
        resolve();
      });
    });

    await emergencyDoctorChatService.createRequest(sessionId, 'usr-citizen-demo');
    await eventPromise;

  } catch (err: any) {
    assert(false, `T04/T05 — Failed during persistence test: ${err.message}`);
  }

  // Clean up
  if (doctorSocket) doctorSocket.disconnect();
  if (citizenSocket) citizenSocket.disconnect();
  
  await new Promise<void>((resolve) => server.close(() => resolve()));
  console.log(`\nPassed: ${passed} | Failed: ${failed}`);
  
  // Close database pool specifically for standalone tests
  await pool.end();
  
  if (failed > 0) process.exit(1);
  process.exit(0);
}

runTests().catch(console.error);
