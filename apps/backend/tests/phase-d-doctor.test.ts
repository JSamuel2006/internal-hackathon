/**
 * Phase D Automated Safety & RBAC Test Suite — Professional Doctor Portal
 * Run: npx tsx tests/phase-d-doctor.test.ts
 */
import { pool } from '../src/database/db.js';
import { userRepository } from '../src/repositories/userRepository.js';
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
  console.log('  ArogyaMitra ERN — Phase D Doctor Portal Safety Tests');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  try {
    // T01: Seeded Doctor Profile & UserRepository Audit
    const seededUser = await userRepository.findByEmail('doctor@arogyamitra.demo');
    assert(seededUser !== null && seededUser.role === 'ROLE_DOCTOR', 
      'T01 — Seeded Doctor profile user exists with ROLE_DOCTOR');

    const seededDoctor = await doctorRepository.findById('doc-demo');
    assert(seededDoctor !== null && seededDoctor.name === 'Dr. Rajesh Sharma',
      'T02 — Seeded Doctor database entry exists in doctors table');

    // T03 & T04: Role validation check
    const isDoctor = seededUser?.role === 'ROLE_DOCTOR';
    const isCitizen = (await userRepository.findByEmail('citizen.rahul@gmail.com'))?.role === 'ROLE_CITIZEN';
    assert(isDoctor && !isCitizen, 'T03 — Citizen user is distinguished from DOCTOR role');

    // T05: Doctor status availability switcher validation
    await doctorRepository.updateAvailability('doc-demo', 'OFFLINE');
    const offlineDoc = await doctorRepository.findById('doc-demo');
    assert(offlineDoc?.availability === 'OFFLINE', 'T05 — Doctor availability state can be toggled');
    
    // Restore AVAILABLE state
    await doctorRepository.updateAvailability('doc-demo', 'AVAILABLE');

    // Create an Emergency Session and Doctor Request for flow validation
    const citizenId = 'usr-citizen-test';
    const sessionObj = await emergencyService.createSession({
      userId: citizenId,
      symptoms: ['severe chest pain', 'sweating'],
      latitude: 18.5204,
      longitude: 73.8567,
    });
    const sessionId = sessionObj.session.id;

    // T06: Doctor request creation
    const docRequest = await emergencyDoctorChatService.createRequest(sessionId, citizenId);
    assert(docRequest.status === 'REQUESTED', 'T06 — Doctor assistance request created as REQUESTED');

    // T07: Doctor accepts request
    await emergencyDoctorChatService.acceptRequest(docRequest.id, 'doc-demo');
    const acceptedRequest = await pool.query('SELECT status, doctor_id FROM emergency_doctor_requests WHERE id = $1', [docRequest.id]);
    assert(acceptedRequest.rows[0].status === 'ACCEPTED', 'T07 — Accepted request status changes to ACCEPTED');
    assert(acceptedRequest.rows[0].doctor_id === 'doc-demo', 'T07 — Accepted request is assigned to doc-demo');

    // T08: Consent gating check
    try {
      await emergencyService.getMedicalHistory({ sessionId, requestingEntity: 'doc-demo' });
      assert(false, 'T08 — Accessing medical summary without consent should have failed');
    } catch (e: any) {
      assert(e.status === 403, 'T08 — Accessing medical history blocked without consent (403)');
    }

    // Grant consent
    await emergencyService.grantConsent({
      sessionId,
      requestingUserId: citizenId,
      authorizedEntity: 'doc-demo',
      consentScope: ['ALLERGIES', 'MEDICATIONS'],
    });

    // T09: Read medical history after consent
    const medicalHistory = await emergencyService.getMedicalHistory({ sessionId, requestingEntity: 'doc-demo' });
    assert(medicalHistory !== null && Array.isArray(medicalHistory.allergies), 
      'T09 — Medical history accessible after valid patient consent');

    // T10: Message sending
    const msg = await emergencyDoctorChatService.sendMessage({
      requestId: docRequest.id,
      senderId: 'doc-demo',
      senderRole: 'ROLE_DOCTOR',
      message: 'This is an emergency doctor guidance message.',
    });
    assert(msg.message === 'This is an emergency doctor guidance message.', 
      'T10 — Doctor can send messages securely inside session');

    // T11: Close consultation
    await emergencyDoctorChatService.closeRequest(docRequest.id, 'doc-demo', 'ROLE_DOCTOR');
    const closedRequest = await pool.query('SELECT status FROM emergency_doctor_requests WHERE id = $1', [docRequest.id]);
    assert(closedRequest.rows[0].status === 'CLOSED', 'T11 — Closed request status changes to CLOSED');

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`  PHASE D TESTS: ${passed}/${passed + failed} passed`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  } catch (err) {
    console.error('Test execution failed with error:', err);
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error(err);
  process.exit(1);
});
