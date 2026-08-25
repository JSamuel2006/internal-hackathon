/**
 * ASHA Field Screening Mode Integration Tests
 * Run: npx tsx tests/worker-screening.test.ts
 */
import { pool, initializeDatabase } from '../src/database/db.js';
import { workerService } from '../src/services/workerService.js';
import { screeningRepository } from '../src/repositories/screeningRepository.js';
import { userRepository } from '../src/repositories/userRepository.js';

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
  console.log('  ArogyaMitra ASHA — Field Screening Mode Integration Tests');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  try {
    // Initialize the database tables first
    await initializeDatabase();

    const workerId = 'worker-demo'; // Seeding has this account
    
    // T01: ASHA worker can register a new rural citizen without requiring email/reports
    const citizenData = {
      name: `Kavita Patil ${Date.now()}`,
      age: 28,
      gender: 'Female',
      village: 'Haveli',
      phone: `987654${Math.floor(1000 + Math.random() * 9000)}`
    };
    
    const citizen = await workerService.registerCitizen(citizenData);
    assert(!!citizen.id, 'T01 — ASHA worker can register a new rural citizen');
    assert(citizen.role === 'ROLE_CITIZEN', 'T01.1 — Registered resident has ROLE_CITIZEN role');
    assert(!!citizen.abhaId, 'T01.2 — Citizen has auto-generated ABHA ID');

    // T02: ASHA worker can submit a screening with all measurements available
    const screening1 = {
      client_record_id: `scr-test-1-${Date.now()}`,
      citizen_user_id: citizen.id,
      citizen_name: citizen.name,
      age: citizenData.age,
      gender: citizenData.gender,
      village: citizenData.village,
      phone: citizenData.phone,
      screening_date: new Date().toISOString(),
      systolic: 120,
      systolic_status: 'MEASURED',
      diastolic: 80,
      diastolic_status: 'MEASURED',
      pulse: 72,
      pulse_status: 'MEASURED',
      spo2: 98,
      spo2_status: 'MEASURED',
      temperature: 98.4,
      temperature_status: 'MEASURED',
      glucose: 105,
      glucose_status: 'MEASURED',
      weight: 55,
      weight_status: 'MEASURED',
      height: 160,
      height_status: 'MEASURED',
      known_conditions: ['Pregnancy'],
      allergies: ['No known allergy'],
      current_medicines: [],
      symptoms: []
    };

    const res1 = await workerService.ingestScreening(workerId, screening1);
    assert(!!res1.id, 'T02 — Can ingest complete screening');
    assert(res1.risk_level === 'NORMAL', 'T02.1 — Risk level is NORMAL for healthy vitals');

    // T03: ASHA screening accepts NOT_MEASURED and EQUIPMENT_UNAVAILABLE states
    const screening2 = {
      client_record_id: `scr-test-2-${Date.now()}`,
      citizen_user_id: citizen.id,
      citizen_name: citizen.name,
      age: citizenData.age,
      gender: citizenData.gender,
      village: citizenData.village,
      phone: citizenData.phone,
      screening_date: new Date().toISOString(),
      systolic: null,
      systolic_status: 'NOT_MEASURED',
      diastolic: null,
      diastolic_status: 'NOT_MEASURED',
      pulse: null,
      pulse_status: 'NOT_MEASURED',
      spo2: null,
      spo2_status: 'EQUIPMENT_UNAVAILABLE',
      temperature: null,
      temperature_status: 'NOT_MEASURED',
      glucose: null,
      glucose_status: 'EQUIPMENT_UNAVAILABLE',
      weight: null,
      weight_status: 'NOT_MEASURED',
      height: null,
      height_status: 'NOT_MEASURED',
      known_conditions: [],
      allergies: [],
      current_medicines: [],
      symptoms: ['Fever']
    };

    const res2 = await workerService.ingestScreening(workerId, screening2);
    assert(!!res2.id, 'T03 — Can ingest screening with unmeasured fields');
    assert(res2.systolic === null && res2.spo2 === null, 'T03.1 — Unmeasured/unavailable values are stored as NULL');

    // T04: Risk engine correctly flags severe readings as REFERRALS without diagnosis
    const screening3 = {
      client_record_id: `scr-test-3-${Date.now()}`,
      citizen_user_id: citizen.id,
      citizen_name: citizen.name,
      age: citizenData.age,
      gender: citizenData.gender,
      village: citizenData.village,
      phone: citizenData.phone,
      screening_date: new Date().toISOString(),
      systolic: 145, // Elevated BP + Pregnancy = Priority Assessment referral
      systolic_status: 'MEASURED',
      diastolic: 95,
      diastolic_status: 'MEASURED',
      pulse: 75,
      pulse_status: 'MEASURED',
      spo2: 96,
      spo2_status: 'MEASURED',
      temperature: 98.4,
      temperature_status: 'MEASURED',
      glucose: 120,
      glucose_status: 'MEASURED',
      weight: 56,
      weight_status: 'MEASURED',
      height: 160,
      height_status: 'MEASURED',
      known_conditions: ['Pregnancy'],
      allergies: ['No known allergy'],
      current_medicines: [],
      symptoms: ['Severe Headache']
    };

    const res3 = await workerService.ingestScreening(workerId, screening3);
    assert(res3.risk_level === 'PRIORITY', 'T04 — High BP in pregnancy flags risk as PRIORITY');
    const flags = JSON.parse(res3.risk_flags);
    assert(flags.some((f: string) => f.includes('Priority assessment recommended')), 'T04.1 — Non-diagnostic referral warning generated');

    // T05: Ingestion batch sync handles deduplication correctly
    const batchInput = [
      screening1, // Existing duplicate
      {
        ...screening2,
        client_record_id: `scr-test-batch-${Date.now()}` // New record
      }
    ];

    const syncRes = await workerService.syncScreenings(workerId, batchInput);
    assert(syncRes.length === 2, 'T05 — Synchronized batch returns all result statuses');
    const dupRes = syncRes.find(s => s.client_record_id === screening1.client_record_id);
    assert(dupRes.status === 'SUCCESS', 'T05.1 — Duplicate client_record_id is handled idempotently without database error');

    // T06: Doctor read-only access to screening history
    const history = await screeningRepository.findByCitizenId(citizen.id);
    assert(history.length >= 3, 'T06 — Doctor can query screening history records for patient');

    console.log(`\n${GREEN}Passed: ${passed}/${passed + failed}${RESET}`);
    if (failed > 0) {
      process.exit(1);
    }
  } catch (err: any) {
    console.error(`${RED}FATAL ERROR during test execution:${RESET}`, err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runTests();
