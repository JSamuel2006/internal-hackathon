/**
 * ArogyaMitra ERN — Citizen ↔ Doctor End-to-End Integration Tests
 * ================================================================
 * Covers all 17 required regression scenarios.
 *
 * Run: npx tsx tests/citizen-doctor-e2e.test.ts
 *
 * Prerequisites:
 *   - PostgreSQL running with arogyaverse_db accessible
 *   - Backend env vars loaded (DB_URL or defaults)
 */
import { pool, initializeDatabase } from '../src/database/db.js';
import { doctorRepository } from '../src/repositories/doctorRepository.js';
import { emergencyService } from '../src/services/emergencyService.js';
import { emergencyDoctorChatService } from '../src/services/emergencyDoctorChatService.js';

const RED    = '\x1b[31m';
const GREEN  = '\x1b[32m';
const YELLOW = '\x1b[33m';
const RESET  = '\x1b[0m';

let passed = 0;
let failed = 0;
const results: Array<{ id: string; label: string; ok: boolean; note?: string }> = [];

function assert(condition: boolean, id: string, label: string, note?: string) {
  const ok = !!condition;
  results.push({ id, label, ok, note });
  if (ok) {
    console.log(`${GREEN}✅ PASS${RESET}  [${id}] ${label}`);
    passed++;
  } else {
    console.log(`${RED}❌ FAIL${RESET}  [${id}] ${label}${note ? ` — ${note}` : ''}`);
    failed++;
  }
}

async function assertRejects(
  fn: () => Promise<any>,
  expectedStatus: number,
  id: string,
  label: string
) {
  try {
    await fn();
    assert(false, id, label, `Expected error HTTP ${expectedStatus} but call succeeded`);
  } catch (err: any) {
    const status = err?.status ?? err?.response?.status;
    assert(status === expectedStatus, id, label, `Expected HTTP ${expectedStatus}, got ${status}`);
  }
}

async function runTests() {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  ArogyaMitra ERN — Citizen ↔ Doctor End-to-End Tests');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const ts          = Date.now();
  const citizen1Id  = `citizen-e2e-${ts}`;
  const citizen2Id  = `citizen2-e2e-${ts}`;
  const wrongCitizenId = `wrong-citizen-${ts}`;
  const wrongDoctorId  = 'doc-wrong-test';
  const testDocId      = 'doc-demo';

  let session1Id = '';
  let request1Id = '';
  let session2Id = '';
  let request2Id = '';
  // Extra session created during T07 double-booking test
  let extraSessionId = '';
  let extraRequestId = '';

  try {
    // Ensure database tables exist
    await initializeDatabase();

    // ──────────────────────────────────────────────────────────────
    // DATABASE VERIFICATION
    // ──────────────────────────────────────────────────────────────
    console.log(`\n${YELLOW}── Database Verification ──${RESET}`);

    const docRow = await pool.query(
      'SELECT id, hospital_id, name, availability FROM doctors WHERE id = $1',
      [testDocId]
    );
    assert(docRow.rows.length === 1,                  'DB-01', 'doc-demo row exists in PostgreSQL doctors table');
    assert(docRow.rows[0]?.hospital_id === 'hosp-demo', 'DB-02', 'doc-demo.hospital_id = hosp-demo');

    const hospRow = await pool.query('SELECT id FROM hospitals WHERE id = $1', ['hosp-demo']);
    assert(hospRow.rows.length === 1, 'DB-03', 'hosp-demo row exists in PostgreSQL hospitals table');

    // ──────────────────────────────────────────────────────────────
    // T01 — Doctor starts AVAILABLE
    // ──────────────────────────────────────────────────────────────
    console.log(`\n${YELLOW}── Lifecycle Tests ──${RESET}`);

    await doctorRepository.updateAvailability(testDocId, 'AVAILABLE');
    const docInitial = await doctorRepository.findById(testDocId);
    assert(docInitial?.availability === 'AVAILABLE', 'T01', 'T01 — Doctor starts AVAILABLE in PostgreSQL');

    // ──────────────────────────────────────────────────────────────
    // T02 — Citizen 1 creates emergency session
    // ──────────────────────────────────────────────────────────────
    const session1Obj = await emergencyService.createSession({
      userId: citizen1Id,
      symptoms: ['crushing chest pain', 'heavy sweating', 'shortness of breath'],
      latitude: 18.5204,
      longitude: 73.8567,
    });
    session1Id = session1Obj.session.id;
    assert(!!session1Id, 'T02', 'T02 — Citizen 1 creates emergency session successfully');

    const sessionInDb = await pool.query(
      'SELECT id, user_id FROM emergency_sessions WHERE id = $1',
      [session1Id]
    );
    assert(
      sessionInDb.rows.length === 1 && sessionInDb.rows[0].user_id === citizen1Id,
      'T02b',
      'T02b — emergency_sessions.user_id matches Citizen 1 JWT sub in PostgreSQL'
    );

    // ──────────────────────────────────────────────────────────────
    // T03 — Citizen 1 creates Doctor Assistance request
    // ──────────────────────────────────────────────────────────────
    const request1 = await emergencyDoctorChatService.createRequest(session1Id, citizen1Id);
    request1Id = request1.id;
    assert(request1.status === 'REQUESTED', 'T03', 'T03 — Doctor request status is initially REQUESTED');
    assert(
      request1.doctorId === null || request1.doctorId === testDocId,
      'T03b',
      'T03b — Request auto-assigned to doc-demo (AVAILABLE) or NULL'
    );

    const reqInDb = await pool.query(
      'SELECT citizen_user_id, doctor_id, status FROM emergency_doctor_requests WHERE id = $1',
      [request1Id]
    );
    assert(reqInDb.rows.length === 1,                              'T03c', 'T03c — Doctor request row persisted in PostgreSQL');
    assert(reqInDb.rows[0].citizen_user_id === citizen1Id,        'T03d', 'T03d — emergency_doctor_requests.citizen_user_id = Citizen 1 JWT sub');
    assert(reqInDb.rows[0].status === 'REQUESTED',                'T03e', 'T03e — emergency_doctor_requests.status = REQUESTED in PostgreSQL');

    // ──────────────────────────────────────────────────────────────
    // T04 — REQUESTED request appears in AVAILABLE doctor queue
    // ──────────────────────────────────────────────────────────────
    const queue1 = await emergencyDoctorChatService.getDoctorQueue(testDocId);
    const inQueue1 = queue1.some(r => r.requestId === request1Id);
    assert(inQueue1, 'T04', 'T04 — REQUESTED request appears in AVAILABLE doctor queue');

    // ──────────────────────────────────────────────────────────────
    // T05 — Doctor accepts → atomically ACCEPTED + IN_CONSULTATION
    // ──────────────────────────────────────────────────────────────
    const accepted = await emergencyDoctorChatService.acceptRequest(request1Id, testDocId);
    assert(accepted.status === 'ACCEPTED', 'T05', 'T05 — acceptRequest() returns status = ACCEPTED');

    const reqAfterAccept = await pool.query(
      'SELECT status, doctor_id, accepted_at FROM emergency_doctor_requests WHERE id = $1',
      [request1Id]
    );
    assert(reqAfterAccept.rows[0].status    === 'ACCEPTED', 'T05b', 'T05b — PostgreSQL status = ACCEPTED');
    assert(reqAfterAccept.rows[0].doctor_id === testDocId,  'T05c', 'T05c — PostgreSQL doctor_id = doc-demo');
    assert(reqAfterAccept.rows[0].accepted_at !== null,     'T05d', 'T05d — PostgreSQL accepted_at is set');

    const docAfterAccept = await doctorRepository.findById(testDocId);
    assert(
      docAfterAccept?.availability === 'IN_CONSULTATION',
      'T06',
      'T06 — doctors.availability = IN_CONSULTATION in PostgreSQL (atomic transition)'
    );

    // ──────────────────────────────────────────────────────────────
    // T07 — IN_CONSULTATION doctor CANNOT accept a second request
    // ──────────────────────────────────────────────────────────────
    const extraSession = await emergencyService.createSession({
      userId: `extra-citizen-${ts}`,
      symptoms: ['fracture', 'bleeding'],
      latitude: 18.5204,
      longitude: 73.8567,
    });
    extraSessionId = extraSession.session.id;
    const extraRequest = await emergencyDoctorChatService.createRequest(
      extraSessionId,
      `extra-citizen-${ts}`
    );
    extraRequestId = extraRequest.id;

    await assertRejects(
      () => emergencyDoctorChatService.acceptRequest(extraRequestId, testDocId),
      400,
      'T07',
      'T07 — IN_CONSULTATION doctor rejected from accepting second request (HTTP 400)'
    );

    // Extra request must still be REQUESTED in DB (not double-booked)
    const extraReqDb = await pool.query(
      'SELECT status FROM emergency_doctor_requests WHERE id = $1',
      [extraRequestId]
    );
    assert(
      extraReqDb.rows[0].status === 'REQUESTED',
      'T07b',
      'T07b — Second request remains REQUESTED in PostgreSQL (no double-booking)'
    );

    // ──────────────────────────────────────────────────────────────
    // T08 — IN_CONSULTATION doctor queue shows ACCEPTED case only
    // ──────────────────────────────────────────────────────────────
    const queueInConsult = await emergencyDoctorChatService.getDoctorQueue(testDocId);
    const hasOwnAccepted = queueInConsult.some(r => r.requestId === request1Id && r.status === 'ACCEPTED');
    const hasPendingNew  = queueInConsult.some(r => r.requestId === extraRequestId);
    assert(hasOwnAccepted, 'T08',  'T08 — IN_CONSULTATION doctor sees their active ACCEPTED consultation');
    assert(!hasPendingNew, 'T08b', 'T08b — IN_CONSULTATION doctor does NOT see new REQUESTED items');

    // ──────────────────────────────────────────────────────────────
    // T09 / T10 — Citizen ↔ Doctor message exchange
    // ──────────────────────────────────────────────────────────────
    console.log(`\n${YELLOW}── Message Exchange Tests ──${RESET}`);

    const citizenMsg = await emergencyDoctorChatService.sendMessage({
      requestId: request1Id,
      senderId: citizen1Id,
      senderRole: 'ROLE_CITIZEN',
      message: 'Help, experiencing severe palpitations and dizziness.',
    });
    assert(citizenMsg.message === 'Help, experiencing severe palpitations and dizziness.', 'T09',  'T09 — Citizen message stored in emergency_chat_messages');
    assert(citizenMsg.senderRole === 'CITIZEN',                                             'T09b', 'T09b — sender_role = CITIZEN');

    const doctorMsg = await emergencyDoctorChatService.sendMessage({
      requestId: request1Id,
      senderId: testDocId,
      senderRole: 'ROLE_DOCTOR',
      message: 'Stay calm. Keep breathing slowly. Help is on its way.',
    });
    assert(doctorMsg.message === 'Stay calm. Keep breathing slowly. Help is on its way.', 'T10',  'T10 — Doctor message stored in emergency_chat_messages');
    assert(doctorMsg.senderRole === 'DOCTOR',                                             'T10b', 'T10b — sender_role = DOCTOR');

    // Verify sender_user_id in PostgreSQL
    const chatMsgs = await pool.query(
      `SELECT sender_user_id, sender_role FROM emergency_chat_messages
       WHERE conversation_id = $1 AND sender_role != 'SYSTEM'
       ORDER BY created_at`,
      [request1Id]
    );
    assert(chatMsgs.rows.length >= 2,                          'T10c', 'T10c — At least 2 non-system messages in PostgreSQL');
    assert(chatMsgs.rows[0].sender_user_id === citizen1Id,     'T10d', 'T10d — sender_user_id = citizen1Id for citizen message');
    assert(chatMsgs.rows[1].sender_user_id === testDocId,      'T10e', 'T10e — sender_user_id = doc-demo for doctor message');
    assert(chatMsgs.rows[0].sender_role    === 'CITIZEN',      'T10f', 'T10f — sender_role = CITIZEN');
    assert(chatMsgs.rows[1].sender_role    === 'DOCTOR',       'T10g', 'T10g — sender_role = DOCTOR');

    // ──────────────────────────────────────────────────────────────
    // T11 — Unauthorized doctor cannot read another conversation
    // ──────────────────────────────────────────────────────────────
    console.log(`\n${YELLOW}── Authorization Tests ──${RESET}`);

    await assertRejects(
      () => emergencyDoctorChatService.getMessages(request1Id, wrongDoctorId, 'ROLE_DOCTOR'),
      403,
      'T11',
      'T11 — Wrong doctor cannot read another doctor\'s conversation (HTTP 403)'
    );

    // ──────────────────────────────────────────────────────────────
    // T12 — Unauthorized citizen cannot read another citizen's chat
    // ──────────────────────────────────────────────────────────────
    await assertRejects(
      () => emergencyDoctorChatService.getMessages(request1Id, wrongCitizenId, 'ROLE_CITIZEN'),
      403,
      'T12',
      'T12 — Wrong citizen cannot read another citizen\'s conversation (HTTP 403)'
    );

    // ──────────────────────────────────────────────────────────────
    // T13 — Duplicate Doctor Assistance request → 409
    // ──────────────────────────────────────────────────────────────
    await assertRejects(
      () => emergencyDoctorChatService.createRequest(session1Id, citizen1Id),
      409,
      'T13',
      'T13 — Duplicate Doctor Assistance request for same session returns HTTP 409'
    );

    // ──────────────────────────────────────────────────────────────
    // T14 — Doctor closes consultation → CLOSED
    // ──────────────────────────────────────────────────────────────
    console.log(`\n${YELLOW}── Close & Recovery Tests ──${RESET}`);

    await emergencyDoctorChatService.closeRequest(request1Id, testDocId, 'ROLE_DOCTOR');

    const closedReq = await pool.query(
      'SELECT status, closed_at FROM emergency_doctor_requests WHERE id = $1',
      [request1Id]
    );
    assert(closedReq.rows[0].status    === 'CLOSED', 'T14',  'T14 — Request status = CLOSED in PostgreSQL');
    assert(closedReq.rows[0].closed_at !== null,     'T14b', 'T14b — closed_at is set in PostgreSQL');

    // ──────────────────────────────────────────────────────────────
    // T15 — Doctor becomes AVAILABLE again
    // ──────────────────────────────────────────────────────────────
    const docAfterClose = await doctorRepository.findById(testDocId);
    assert(
      docAfterClose?.availability === 'AVAILABLE',
      'T15',
      'T15 — doctors.availability = AVAILABLE in PostgreSQL after close'
    );

    // ──────────────────────────────────────────────────────────────
    // T16 — Second Citizen creates new request post-close
    // ──────────────────────────────────────────────────────────────
    const session2Obj = await emergencyService.createSession({
      userId: citizen2Id,
      symptoms: ['trauma', 'head injury', 'confusion'],
      latitude: 18.5204,
      longitude: 73.8567,
    });
    session2Id = session2Obj.session.id;

    const request2Obj = await emergencyDoctorChatService.createRequest(session2Id, citizen2Id);
    request2Id = request2Obj.id;
    assert(request2Obj.status === 'REQUESTED', 'T16', 'T16 — Second Citizen Doctor Assistance request created (REQUESTED)');

    // ──────────────────────────────────────────────────────────────
    // T17 — Second request visible in AVAILABLE doctor queue
    // ──────────────────────────────────────────────────────────────
    const queue2 = await emergencyDoctorChatService.getDoctorQueue(testDocId);
    const inQueue2 = queue2.some(r => r.requestId === request2Id);
    assert(inQueue2, 'T17', 'T17 — Second Citizen\'s REQUESTED request is visible in AVAILABLE doctor queue');

    const req2Db = await pool.query(
      'SELECT status, doctor_id FROM emergency_doctor_requests WHERE id = $1',
      [request2Id]
    );
    assert(req2Db.rows[0].status === 'REQUESTED', 'T17b', 'T17b — Second request confirmed REQUESTED in PostgreSQL');
    console.log(`      → Second request doctor_id: ${req2Db.rows[0].doctor_id ?? 'NULL'}`);

  } catch (err) {
    console.error(`\n${RED}❌ Test suite crashed:${RESET}`, err);
    process.exitCode = 1;
  } finally {
    // ── Cleanup ────────────────────────────────────────────────────
    console.log(`\n${YELLOW}── Cleanup ──${RESET}`);
    try {
      if (request2Id)    await pool.query('DELETE FROM emergency_doctor_requests WHERE id = $1', [request2Id]);
      if (session2Id)    await pool.query('DELETE FROM emergency_sessions WHERE id = $1', [session2Id]);
      if (extraRequestId) await pool.query('DELETE FROM emergency_doctor_requests WHERE id = $1', [extraRequestId]);
      if (extraSessionId) await pool.query('DELETE FROM emergency_sessions WHERE id = $1', [extraSessionId]);
      await doctorRepository.updateAvailability(testDocId, 'AVAILABLE');
      console.log('  ✅ Test data cleaned up. doc-demo reset to AVAILABLE.');
    } catch (cleanupErr) {
      console.warn('  ⚠️  Cleanup error (non-fatal):', cleanupErr);
    }

    await pool.end();

    // ── Summary ────────────────────────────────────────────────────
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`  RESULT: ${passed}/${passed + failed} passed`);
    if (failed > 0) {
      console.log(`\n${RED}  Failed tests:${RESET}`);
      results.filter(r => !r.ok).forEach(r => {
        console.log(`    ✗ [${r.id}] ${r.label}${r.note ? ` (${r.note})` : ''}`);
      });
    }
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    if (failed > 0) process.exitCode = 1;
  }
}

runTests().catch(err => {
  console.error(err);
  process.exit(1);
});


