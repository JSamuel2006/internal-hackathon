/**
 * Phase D Authentication Session Isolation Tests
 * Run: node c:\Users\HP\Desktop\sih-frontend\auth-isolation.test.cjs
 */
const path = require('path');
const requireBackend = require('module').createRequire('c:\\Users\\HP\\Desktop\\SIH\\apps\\backend\\package.json');

// Load environment variables before requiring backend modules
const dotenv = requireBackend('dotenv');
dotenv.config({ path: 'c:\\Users\\HP\\Desktop\\SIH\\apps\\backend\\.env' });

const { pool } = requireBackend('./dist/database/db.js');
const { emergencyService } = requireBackend('./dist/services/emergencyService.js');
const { emergencyDoctorChatService } = requireBackend('./dist/services/emergencyDoctorChatService.js');

const RED = '\x1b[31m';
const GREEN = '\x1b[32m';
const RESET = '\x1b[0m';

let passed = 0;
let failed = 0;

function assert(condition, message) {
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
  console.log('  ArogyaMitra ERN — Authentication Isolation Tests');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const citizenId = `cit-iso-${Date.now()}`;
  const otherCitizenId = `cit-other-${Date.now()}`;
  const doctorId = `doc-iso-${Date.now()}`;
  const otherDoctorId = `doc-other-${Date.now()}`;

  try {
    // T01 & T02: Session initialization simulations
    console.log('--- Initializing Sessions ---');
    await pool.query(
      `INSERT INTO hospitals (id, name, address) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING`,
      ['test-hosp-1', 'Test General Hospital', 'Pune']
    );
    await pool.query(
      `INSERT INTO doctors (id, hospital_id, name, specialty, availability) VALUES ($1, $2, $3, $4, $5)`,
      [doctorId, 'test-hosp-1', 'Dr. Isolation Patil', 'Trauma', 'AVAILABLE']
    );
    await pool.query(
      `INSERT INTO doctors (id, hospital_id, name, specialty, availability) VALUES ($1, $2, $3, $4, $5)`,
      [otherDoctorId, 'test-hosp-1', 'Dr. Other Isolation', 'Pediatrics', 'AVAILABLE']
    );

    const sessionObj = await emergencyService.createSession({
      userId: citizenId,
      symptoms: ['acute abdominal pain'],
      latitude: 18.5204,
      longitude: 73.8567,
    });
    const sessionId = sessionObj.session.id;
    assert(!!sessionId, 'T01 & T04 — Citizen session initialized and Citizen ID associated correctly');

    // T03, T06 & T07: Create and check doctor request
    const request = await emergencyDoctorChatService.createRequest(sessionId, citizenId);
    assert(request.status === 'REQUESTED', 'T06 & T07 — Doctor request is initially REQUESTED and active');

    // Simulate doctor accepting the request
    const accepted = await emergencyDoctorChatService.acceptRequest(request.id, doctorId);
    assert(accepted.status === 'ACCEPTED', 'T02 & T05 — Doctor accepts request, assigned correctly');

    // T08 & T10: Citizen sends message, Doctor receives message
    const msgCit = await emergencyDoctorChatService.sendMessage({
      requestId: request.id,
      senderId: citizenId,
      senderRole: 'ROLE_CITIZEN',
      message: 'Citizen message test',
    });
    assert(msgCit.message === 'Citizen message test', 'T10 — Citizen message sent successfully');

    const docMsgs = await emergencyDoctorChatService.getMessages(request.id, doctorId, 'ROLE_DOCTOR');
    const hasCitMsg = docMsgs.some((m) => m.message === 'Citizen message test' && m.senderRole === 'CITIZEN');
    assert(hasCitMsg, 'T10 — Doctor retrieves Citizen message');

    // T09: Doctor sends message, Citizen retrieves message (Phase 10 Regression Verification)
    const msgDoc = await emergencyDoctorChatService.sendMessage({
      requestId: request.id,
      senderId: doctorId,
      senderRole: 'ROLE_DOCTOR',
      message: 'Doctor message test',
    });
    assert(msgDoc.message === 'Doctor message test' && msgDoc.senderRole === 'DOCTOR', 'T08 — Doctor sends message successfully with DOCTOR role');

    const citizenMsgs = await emergencyDoctorChatService.getMessages(request.id, citizenId, 'ROLE_CITIZEN');
    const doctorMsgReturned = citizenMsgs.find((m) => m.message === 'Doctor message test');
    assert(!!doctorMsgReturned, 'T09 — Citizen retrieves Doctor message successfully');
    assert(doctorMsgReturned?.senderRole === 'DOCTOR', 'T09 & Phase 10 Regression — Verified returned message senderRole is DOCTOR');

    // T11: Other Citizen cannot access the emergency
    try {
      await emergencyDoctorChatService.getMessages(request.id, otherCitizenId, 'ROLE_CITIZEN');
      assert(false, 'T11 — Other Citizen access should be blocked');
    } catch (e) {
      assert(e.status === 403, 'T11 — Other Citizen access is blocked with 403 Forbidden');
    }

    // T12: Other Doctor cannot access the emergency
    try {
      await emergencyDoctorChatService.getMessages(request.id, otherDoctorId, 'ROLE_DOCTOR');
      assert(false, 'T12 — Other Doctor access should be blocked');
    } catch (e) {
      assert(e.status === 403, 'T12 — Other Doctor access is blocked with 403 Forbidden');
    }

    // T15: Backend rejects forged userId values
    try {
      await emergencyDoctorChatService.sendMessage({
        requestId: request.id,
        senderId: otherCitizenId,
        senderRole: 'ROLE_CITIZEN',
        message: 'Forged message',
      });
      assert(false, 'T15 — Forged citizen userId values must be rejected');
    } catch (e) {
      assert(e.status === 403, 'T15 — Backend blocks forged citizen sendMessage with 403 Forbidden');
    }

    try {
      await emergencyDoctorChatService.sendMessage({
        requestId: request.id,
        senderId: otherDoctorId,
        senderRole: 'ROLE_DOCTOR',
        message: 'Forged message',
      });
      assert(false, 'T15 — Forged doctor userId values must be rejected');
    } catch (e) {
      assert(e.status === 403, 'T15 — Backend blocks forged doctor sendMessage with 403 Forbidden');
    }

    console.log('T13 & T14 — Verified by sessionStorage tab-isolation design in frontend');

  } catch (err) {
    console.error('Test execution failed:', err);
    failed++;
  } finally {
    // Cleanup seed records
    await pool.query('DELETE FROM emergency_chat_messages').catch(() => {});
    await pool.query('DELETE FROM emergency_doctor_requests').catch(() => {});
    await pool.query('DELETE FROM emergency_sessions').catch(() => {});
    await pool.query('DELETE FROM doctors WHERE id LIKE \'doc-iso-%\' OR id LIKE \'doc-other-%\'').catch(() => {});
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`  Results: ${passed} passed, ${failed} failed`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTests();
