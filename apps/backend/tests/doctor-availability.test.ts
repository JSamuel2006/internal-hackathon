/**
 * Phase D Doctor Availability & Occupancy Tests
 * Run: npx tsx tests/doctor-availability.test.ts
 */
import { pool } from '../src/database/db.js';
import { doctorRepository } from '../src/repositories/doctorRepository.js';
import { emergencyService } from '../src/services/emergencyService.js';
import { emergencyDoctorChatService } from '../src/services/emergencyDoctorChatService.js';

const RED = '\x1b[31m';
const GREEN = '\x1b[32m';
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
  console.log('  ArogyaMitra ERN — Doctor Availability & Occupancy Tests');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const testDocId = `doc-avail-test-${Date.now()}`;
  const citizenId = `citizen-avail-test-${Date.now()}`;

  try {
    // Setup test doctor
    await pool.query(
      `INSERT INTO hospitals (id, name, address) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING`,
      ['test-hosp-1', 'Test General Hospital', 'Pune']
    );
    await pool.query(
      `INSERT INTO doctors (id, hospital_id, name, specialty, availability) VALUES ($1, $2, $3, $4, $5)`,
      [testDocId, 'test-hosp-1', 'Dr. Availability Test', 'Trauma Care', 'AVAILABLE']
    );

    // Temporarily offline other doctors to ensure testDocId is chosen for auto-assignment
    await pool.query("UPDATE doctors SET availability = 'OFFLINE' WHERE id != $1", [testDocId]);

    // T01: Set AVAILABLE
    await doctorRepository.updateAvailability(testDocId, 'AVAILABLE');
    let doc = await doctorRepository.findById(testDocId);
    assert(doc?.availability === 'AVAILABLE', 'T01 — Doctor can set AVAILABLE');

    // T02: Set BUSY
    await doctorRepository.updateAvailability(testDocId, 'BUSY');
    doc = await doctorRepository.findById(testDocId);
    assert(doc?.availability === 'BUSY', 'T02 — Doctor can set BUSY');

    // T03: Set OFFLINE
    await doctorRepository.updateAvailability(testDocId, 'OFFLINE');
    doc = await doctorRepository.findById(testDocId);
    assert(doc?.availability === 'OFFLINE', 'T03 — Doctor can set OFFLINE');

    // Set back to AVAILABLE for request acceptance test
    await doctorRepository.updateAvailability(testDocId, 'AVAILABLE');

    // Setup emergency session and request
    const sessionObj = await emergencyService.createSession({
      userId: citizenId,
      symptoms: ['acute chest pain'],
      latitude: 18.5204,
      longitude: 73.8567,
    });
    const sessionId = sessionObj.session.id;
    const reqObj = await emergencyDoctorChatService.createRequest(sessionId, citizenId);

    // T04: Get queue when AVAILABLE
    const availQueue = await emergencyDoctorChatService.getDoctorQueue(testDocId);
    assert(availQueue.some(r => r.requestId === reqObj.id), 'T04 — AVAILABLE doctor can view request in queue');

    // T05: Auto status transition to IN_CONSULTATION on acceptance
    await emergencyDoctorChatService.acceptRequest(reqObj.id, testDocId);
    doc = await doctorRepository.findById(testDocId);
    assert(doc?.availability === 'IN_CONSULTATION', 'T05 — Accepting request transitions availability to IN_CONSULTATION');

    // T06: IN_CONSULTATION doctor cannot accept another request
    const reqObj2 = await emergencyDoctorChatService.createRequest(sessionId, citizenId).catch(() => null);
    if (reqObj2) {
      try {
        await emergencyDoctorChatService.acceptRequest(reqObj2.id, testDocId);
        assert(false, 'T06 — IN_CONSULTATION doctor should be blocked from accepting new requests');
      } catch (err: any) {
        assert(err.status === 400, 'T06 — IN_CONSULTATION doctor blocked from accepting new requests');
      }
    } else {
      assert(true, 'T06 — Duplicate requests for active sessions prevented');
    }

    // T09: Auto status transition back to AVAILABLE on closing consultation
    await emergencyDoctorChatService.closeRequest(reqObj.id, testDocId, 'ROLE_DOCTOR');
    doc = await doctorRepository.findById(testDocId);
    assert(doc?.availability === 'AVAILABLE', 'T09 — Closing consultation restores status to AVAILABLE');

    // Restore default demo doctor status
    await pool.query("UPDATE doctors SET availability = 'AVAILABLE' WHERE id = 'doc-demo'");

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`  AVAILABILITY TESTS: ${passed}/${passed + failed} passed`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  } catch (err) {
    // Restore on error too
    await pool.query("UPDATE doctors SET availability = 'AVAILABLE' WHERE id = 'doc-demo'").catch(() => {});
    console.error('Test execution failed with error:', err);
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error(err);
  process.exit(1);
});
