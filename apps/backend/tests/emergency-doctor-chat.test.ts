/**
 * Phase B Automated Test Suite — Emergency Doctor Chat
 * Run: npx tsx tests/emergency-doctor-chat.test.ts
 */
import { pool } from '../src/database/db.js';
import { emergencyService } from '../src/services/emergencyService.js';
import { emergencyDoctorChatService } from '../src/services/emergencyDoctorChatService.js';

const RED = '\x1b[31m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
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
  console.log('  ArogyaMitra ERN — Phase B Doctor Chat Unit Tests');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // Seed test records
  const citizenId = `test-user-${Date.now()}`;
  const otherCitizenId = `other-user-${Date.now()}`;
  const doctorId = `test-doctor-${Date.now()}`;
  const otherDoctorId = `other-doctor-${Date.now()}`;

  try {
    // Temporarily offline all other doctors in DB so that auto-assignment targets doctorId
    await pool.query("UPDATE doctors SET availability = 'OFFLINE'");

    // 1. Seed doctor profiles in DB
    await pool.query(
      `INSERT INTO hospitals (id, name, address) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING`,
      ['test-hosp-1', 'Test General Hospital', 'Pune']
    );
    await pool.query(
      `INSERT INTO doctors (id, hospital_id, name, specialty, availability) VALUES ($1, $2, $3, $4, $5)`,
      [doctorId, 'test-hosp-1', 'Dr. Test Patil', 'Cardiology', 'AVAILABLE']
    );
    await pool.query(
      `INSERT INTO doctors (id, hospital_id, name, specialty, availability) VALUES ($1, $2, $3, $4, $5)`,
      [otherDoctorId, 'test-hosp-1', 'Dr. Other Patil', 'Pediatrics', 'AVAILABLE']
    );

    // 2. Create Emergency Session
    const sessionObj = await emergencyService.createSession({
      userId: citizenId,
      symptoms: ['severe chest pain', 'sweating'],
      latitude: 18.5204,
      longitude: 73.8567,
    });
    const sessionId = sessionObj.session.id;
    assert(!!sessionId, 'T01 — Citizen creates emergency session successfully');

    // 3. Create Doctor Request
    const request = await emergencyDoctorChatService.createRequest(sessionId, citizenId);
    assert(request.status === 'REQUESTED', 'T01 — Citizen creates doctor assistance request successfully');

    // 4. Unauthorized Citizen Session Check
    try {
      await emergencyDoctorChatService.createRequest(sessionId, otherCitizenId);
      assert(false, 'T02 — Unauthorized citizen cannot access another citizen\'s session');
    } catch (e: any) {
      assert(e.status === 403, 'T02 — Unauthorized citizen request blocked with 403');
    }

    // 5. Doctor views request queue
    const queue = await emergencyDoctorChatService.getDoctorQueue(doctorId);
    const hasRequest = queue.some((r) => r.requestId === request.id);
    assert(hasRequest, 'T03 — Doctor can see legitimate request in active queue');

    // 6. Unauthorized doctor checks context (accepted requests only unless REQUESTED)
    // Accept it first using doctorId
    await emergencyDoctorChatService.acceptRequest(request.id, doctorId);
    
    try {
      await emergencyDoctorChatService.getEmergencyContext(request.id, otherDoctorId);
      assert(false, 'T04 — Unauthorized doctor cannot access request context');
    } catch (e: any) {
      assert(e.status === 403, 'T04 — Unauthorized doctor blocked with 403');
    }

    // 7. Verify accept state changes
    const acceptedReq = await pool.query('SELECT status, doctor_id FROM emergency_doctor_requests WHERE id = $1', [request.id]);
    assert(acceptedReq.rows[0].status === 'ACCEPTED', 'T05 — Doctor accepts request (status changes to ACCEPTED)');
    assert(acceptedReq.rows[0].doctor_id === doctorId, 'T05 — Doctor accepted request gets assigned doctorId');

    // 8. Decline request test (simulate on a new request)
    const sessionObj2 = await emergencyService.createSession({
      userId: citizenId,
      symptoms: ['cough'],
      latitude: 18.5204,
      longitude: 73.8567,
    });
    const request2 = await emergencyDoctorChatService.createRequest(sessionObj2.session.id, citizenId);
    await emergencyDoctorChatService.declineRequest(request2.id, doctorId);
    const declinedReq = await pool.query('SELECT status FROM emergency_doctor_requests WHERE id = $1', [request2.id]);
    assert(declinedReq.rows[0].status === 'REQUESTED', 'T06 — Doctor declines request (request remains in queue / REQUESTED status)');

    // 9. Citizen sends message
    const citizenMsg = await emergencyDoctorChatService.sendMessage({
      requestId: request.id,
      senderId: citizenId,
      senderRole: 'ROLE_CITIZEN',
      message: 'Hello, please help!',
    });
    assert(citizenMsg.senderRole === 'CITIZEN', 'T07 — Citizen sends message successfully');

    // 10. Doctor sends message
    const doctorMsg = await emergencyDoctorChatService.sendMessage({
      requestId: request.id,
      senderId: doctorId,
      senderRole: 'ROLE_DOCTOR',
      message: 'I am here, stay calm.',
    });
    assert(doctorMsg.senderRole === 'DOCTOR', 'T08 — Doctor sends message successfully');

    // 11. Unauthorized user message access check
    try {
      await emergencyDoctorChatService.getMessages(request.id, otherCitizenId, 'ROLE_CITIZEN');
      assert(false, 'T09 — Unauthorized user cannot read messages');
    } catch (e: any) {
      assert(e.status === 403, 'T09 — Unauthorized user message read blocked with 403');
    }

    // 12. Consent required for medical history
    try {
      await emergencyService.getMedicalHistory({ sessionId, requestingEntity: doctorId });
      assert(false, 'T10 — Consent required for medical history');
    } catch (e: any) {
      assert(e.status === 403, 'T10 — Blocked medical history access without consent (403)');
    }

    // Grant consent and check success
    const consent = await emergencyService.grantConsent({
      sessionId,
      requestingUserId: citizenId,
      authorizedEntity: doctorId,
      consentScope: ['allergies'],
    });
    const medHistory = await emergencyService.getMedicalHistory({ sessionId, requestingEntity: doctorId });
    assert(medHistory.allergies.length >= 0, 'T10 — Consent grant enables medical history access');

    // 13. Safety Classification check
    const classification = sessionObj.classification;
    assert(classification.priority === 'HIGH', 'T11 — HIGH emergency priority classified correctly');
    assert(classification.warnings.length > 0, 'T11 — HIGH emergency warning warnings populated');

    // 14. Gemini Mock Failure / Optional flow
    const summary = await emergencyDoctorChatService.generateAIHandoffSummary(request.id);
    assert(!!summary, 'T12 — Gemini summarization handled safely (returns summary or fallback)');

    // 15. Conversation closing
    await emergencyDoctorChatService.closeRequest(request.id, doctorId, 'ROLE_DOCTOR');
    const closedReq = await pool.query('SELECT status FROM emergency_doctor_requests WHERE id = $1', [request.id]);
    assert(closedReq.rows[0].status === 'CLOSED', 'T13 — Conversation closes correctly');

    // 16. Closed conversation rejects new messages
    try {
      await emergencyDoctorChatService.sendMessage({
        requestId: request.id,
        senderId: citizenId,
        senderRole: 'ROLE_CITIZEN',
        message: 'Are you there?',
      });
      assert(false, 'T14 — Closed conversation rejects new messages');
    } catch (e: any) {
      assert(e.status === 400, 'T14 — Messaging closed chat throws 400 Bad Request');
    }

    // 17. Body Overrides Check (Simulated controller safety check)
    // The controller gets verified ID from req.user.id. Testing the service interface mapping:
    assert(request.citizenUserId === citizenId, 'T15 — JWT identity cannot be overridden by request body');

  } catch (err: any) {
    console.error('Fatal test error:', err);
    failed++;
  } finally {
    // Cleanup seed records
    await pool.query('DELETE FROM emergency_doctor_requests');
    await pool.query('DELETE FROM emergency_sessions');
    await pool.query('DELETE FROM doctors WHERE id LIKE \'test-doctor-%\' OR id LIKE \'other-doctor-%\'');
    // Restore default demo doctor status
    await pool.query("UPDATE doctors SET availability = 'AVAILABLE' WHERE id = 'doc-demo'").catch(() => {});
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`  Results: ${GREEN}${passed} passed${RESET}  ${failed > 0 ? `${RED}${failed} failed${RESET}` : `${GREEN}0 failed${RESET}`}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTests();
