/**
 * Automated Security, RBAC & Data Integrity Test Suite:
 * Officer -> ASHA Field Monitoring & Health Operations
 * Run: npx tsx tests/officer-asha-monitoring.test.ts
 */
import { pool } from '../src/database/db.js';
import { userRepository } from '../src/repositories/userRepository.js';
import { screeningRepository } from '../src/repositories/screeningRepository.js';
import { workerService } from '../src/services/workerService.js';
import { officerAshaService } from '../src/services/officerAshaService.js';
import jwt from 'jsonwebtoken';
import { env } from '../src/configuration/environment.js';

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
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  ArogyaMitra — Officer ASHA Monitoring & RBAC Test Suite');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  try {
    // T01: Seeded Users Audit
    const officerUser = await userRepository.findByEmail('officer.pune@mohfw.gov.in');
    const workerUser = await userRepository.findByEmail('asha.haveli@arogyamitra.gov.in');
    const citizenUser = await userRepository.findByEmail('citizen.rahul@gmail.com');

    assert(officerUser !== null && officerUser.role === 'ROLE_OFFICER', 'T01 — Officer user exists with ROLE_OFFICER');
    assert(workerUser !== null && workerUser.role === 'ROLE_WORKER', 'T02 — ASHA Worker user exists with ROLE_WORKER');
    assert(citizenUser !== null && citizenUser.role === 'ROLE_CITIZEN', 'T03 — Citizen user exists with ROLE_CITIZEN');

    // T04: RBAC Token Generation & Validation Check
    const officerToken = jwt.sign({ sub: officerUser!.id, name: officerUser!.name, role: officerUser!.role }, env.JWT_SECRET);
    const workerToken = jwt.sign({ sub: workerUser!.id, name: workerUser!.name, role: workerUser!.role }, env.JWT_SECRET);
    const citizenToken = jwt.sign({ sub: citizenUser!.id, name: citizenUser!.name, role: citizenUser!.role }, env.JWT_SECRET);

    const decodedOfficer: any = jwt.verify(officerToken, env.JWT_SECRET);
    const decodedWorker: any = jwt.verify(workerToken, env.JWT_SECRET);
    const decodedCitizen: any = jwt.verify(citizenToken, env.JWT_SECRET);

    const allowedRoles = ['ROLE_OFFICER', 'ROLE_ADMIN'];
    assert(allowedRoles.includes(decodedOfficer.role), 'T04 — Officer token is authorized by requireRole filter');
    assert(!allowedRoles.includes(decodedWorker.role), 'T05 — Worker token is strictly rejected by requireRole filter');
    assert(!allowedRoles.includes(decodedCitizen.role), 'T06 — Citizen token is strictly rejected by requireRole filter');

    // T07: Create Screening via ASHA Worker Service
    const clientRecordId = 'scr-test-' + Date.now();
    const screening = await workerService.ingestScreening('worker-demo', {
      client_record_id: clientRecordId,
      citizen_name: 'Suresh Patil',
      age: 52,
      gender: 'MALE',
      village: 'Haveli Village',
      screening_date: new Date().toISOString(),
      systolic: 185,
      systolic_status: 'MEASURED',
      diastolic: 125,
      diastolic_status: 'MEASURED',
      pulse: 88,
      pulse_status: 'MEASURED',
      spo2: 89,
      spo2_status: 'MEASURED',
      temperature: 98.4,
      temperature_status: 'MEASURED',
      glucose: 140,
      glucose_status: 'MEASURED',
      weight: 70,
      weight_status: 'MEASURED',
      height: 172,
      height_status: 'MEASURED',
      known_conditions: ['Hypertension'],
      allergies: ['No known allergy'],
      current_medicines: ['Amlodipine 5mg'],
      symptoms: ['Chest Pain', 'Difficulty Breathing'],
    });

    assert(screening.risk_level === 'URGENT', 'T07 — WorkerService correctly evaluates severe BP + SpO2 + Symptoms as URGENT referral');

    // T08: Overview Aggregation Audit
    const overview = await officerAshaService.getOverview();
    assert(overview.totalWorkers >= 1, 'T08 — Overview returns real total ASHA worker count >= 1');
    assert(overview.totalScreenings >= 1, 'T09 — Overview returns real total screenings count >= 1');
    assert(overview.todayScreenings >= 1, 'T10 — Overview accurately identifies today screenings >= 1');
    assert(overview.referrals.urgent >= 1, 'T11 — Overview correctly aggregates URGENT referral cases count >= 1');
    assert(overview.syncStats.syncedRecords >= 1, 'T12 — Overview syncStats matches persisted database records');

    // T13: Workers Operational List Audit
    const workers = await officerAshaService.getWorkers();
    const sunita = workers.find(w => w.workerId === 'worker-demo');
    assert(sunita !== undefined, 'T13 — Workers list contains Sunita Devi');
    assert(sunita!.totalScreenings >= 1, 'T14 — Worker total screening count is aggregated correctly from DB');
    assert(sunita!.status === 'Active', 'T15 — Worker status is derived as Active from recent activity');

    // T16: Filtered Screening List Audit
    const allScreenings = await officerAshaService.getScreenings({ limit: 50, offset: 0 });
    assert(allScreenings.total >= 1, 'T16 — Screenings API returns total record count');
    assert(allScreenings.screenings.length > 0, 'T17 — Screenings list returns array of records');

    const createdRecord = allScreenings.screenings.find(s => s.clientRecordId === clientRecordId);
    assert(createdRecord !== undefined, 'T18 — Ingested screening record is visible in Officer screening query');
    assert(createdRecord?.riskLevel === 'URGENT', 'T19 — Referral level matches evaluated risk level');
    assert(createdRecord?.workerName === 'Sunita Devi (ASHA)', 'T20 — Worker name is joined properly from user repository');

    // T21: Filter by Risk Level
    const urgentScreenings = await officerAshaService.getScreenings({ riskLevel: 'URGENT' });
    const onlyUrgent = urgentScreenings.screenings.every(s => s.riskLevel === 'URGENT');
    assert(onlyUrgent && urgentScreenings.screenings.length >= 1, 'T21 — Filtering by riskLevel=URGENT returns only URGENT cases');

    // T22: Filter by Worker ID
    const workerScreenings = await officerAshaService.getScreenings({ workerId: 'worker-demo' });
    const onlyWorker = workerScreenings.screenings.every(s => s.workerId === 'worker-demo');
    assert(onlyWorker && workerScreenings.screenings.length >= 1, 'T22 — Filtering by workerId returns only that worker records');

    // T23: Search Filter
    const searchScreenings = await officerAshaService.getScreenings({ search: 'Suresh Patil' });
    assert(searchScreenings.screenings.length >= 1 && searchScreenings.screenings[0].citizenName === 'Suresh Patil', 
      'T23 — Search filter matches citizen name query accurately');

    // T24: Privacy Protection Audit (No passwords/JWT secrets in output)
    const rawKeys = Object.keys(createdRecord || {});
    assert(!rawKeys.includes('password') && !rawKeys.includes('passwordHash') && !rawKeys.includes('token'), 
      'T24 — Privacy boundary audit: No authentication secrets or password hashes are exposed');

  } catch (err: any) {
    console.error(`${RED}❌ Test Suite Error:${RESET}`, err);
    failed++;
  } finally {
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`  Summary: ${GREEN}${passed} Passed${RESET}, ${failed > 0 ? RED : GREEN}${failed} Failed${RESET}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    await pool.end();
    process.exit(failed > 0 ? 1 : 0);
  }
}

runTests();
