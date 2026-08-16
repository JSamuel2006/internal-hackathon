/**
 * Phase A Safety Rule + Classification Tests
 * Run: npx ts-node --esm tests/phase-a-safety-test.ts
 */
import { classifyEmergency } from '../src/services/emergencyService.js';

interface TestCase {
  name: string;
  symptoms: string[];
  expectedPriority: string;
  expectedCategory?: string;
  desc: string;
}

const RED = '\x1b[31m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const RESET = '\x1b[0m';

const tests: TestCase[] = [
  // ── Safety Rule Tests (MUST always trigger) ────────────────
  {
    name: 'T01 — Chest pain + breathing difficulty',
    symptoms: ['severe chest pain', 'difficulty breathing'],
    expectedPriority: 'HIGH',
    expectedCategory: 'CARDIAC',
    desc: 'Cardiac emergency — must be HIGH',
  },
  {
    name: 'T02 — Unconsciousness',
    symptoms: ['unconscious', 'not responding'],
    expectedPriority: 'HIGH',
    expectedCategory: 'CARDIAC',
    desc: 'Loss of consciousness — must be HIGH',
  },
  {
    name: 'T03 — Severe bleeding',
    symptoms: ['severe bleeding from leg', 'uncontrolled bleeding'],
    expectedPriority: 'HIGH',
    expectedCategory: 'TRAUMA',
    desc: 'Haemorrhage — must be HIGH',
  },
  {
    name: 'T04 — Stroke-like symptoms (FAST)',
    symptoms: ['facial drooping', 'arm weakness', 'speech difficulty'],
    expectedPriority: 'HIGH',
    expectedCategory: 'NEUROLOGICAL',
    desc: 'Stroke FAST signs — must be HIGH',
  },
  {
    name: 'T05 — Seizure',
    symptoms: ['convulsion', 'seizure', 'collapsed'],
    expectedPriority: 'HIGH',
    expectedCategory: 'NEUROLOGICAL',
    desc: 'Seizure — must be HIGH',
  },
  {
    name: 'T06 — Choking / airway blocked',
    symptoms: ['choking', 'can\'t breathe', 'airway blocked'],
    expectedPriority: 'HIGH',
    expectedCategory: 'RESPIRATORY',
    desc: 'Airway obstruction — must be HIGH',
  },
  {
    name: 'T07 — Anaphylaxis',
    symptoms: ['severe allergic reaction', 'throat swelling'],
    expectedPriority: 'HIGH',
    expectedCategory: 'METABOLIC',
    desc: 'Anaphylaxis — must be HIGH',
  },
  {
    name: 'T08 — Mild headache (non-emergency)',
    symptoms: ['mild headache', 'tired'],
    expectedPriority: 'LOW',
    desc: 'Non-emergency — must be LOW or INFORMATIONAL',
  },
  {
    name: 'T09 — No symptoms provided',
    symptoms: [],
    expectedPriority: 'INFORMATIONAL',
    desc: 'Empty symptoms — must return INFORMATIONAL',
  },
  {
    name: 'T10 — Breathing difficulty alone (MEDIUM)',
    symptoms: ['shortness of breath', 'difficulty breathing'],
    expectedPriority: 'MEDIUM',
    desc: 'Breathing difficulty without cardiac indicators — MEDIUM',
  },
];

// Security tests (pure logic — not HTTP)
const securityTests = [
  {
    name: 'S01 — Disclaimer always present',
    test: () => {
      const result = classifyEmergency(['chest pain']);
      return result.disclaimer.includes('NOT clinically validated');
    },
    desc: 'Every result must include the safety disclaimer',
  },
  {
    name: 'S02 — HIGH priority never downgraded by ML absence',
    test: () => {
      // Even with no ML model, deterministic rules must fire
      const result = classifyEmergency(['unconscious', 'not breathing', 'cardiac arrest']);
      return result.priority === 'HIGH';
    },
    desc: 'Deterministic safety rule must produce HIGH even without ML model',
  },
  {
    name: 'S03 — Warnings present on HIGH priority',
    test: () => {
      const result = classifyEmergency(['severe chest pain', 'difficulty breathing']);
      return result.warnings.length > 0;
    },
    desc: 'HIGH priority results must always include safety warnings',
  },
  {
    name: 'S04 — Source field is set',
    test: () => {
      const result = classifyEmergency(['seizure']);
      return ['DETERMINISTIC_SAFETY_RULE', 'ML_CLASSIFIER', 'COMBINED'].includes(result.source);
    },
    desc: 'Source of classification must always be declared',
  },
];

let passed = 0;
let failed = 0;

console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('  ArogyaMitra ERN — Phase A Safety Rule Tests');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

for (const tc of tests) {
  const result = classifyEmergency(tc.symptoms);
  const priorityOk = result.priority === tc.expectedPriority;
  const categoryOk = !tc.expectedCategory || result.category === tc.expectedCategory;
  const ok = priorityOk && categoryOk;

  if (ok) {
    console.log(`${GREEN}✅ PASS${RESET}  ${tc.name}`);
    console.log(`        Priority: ${result.priority} | Category: ${result.category} | Source: ${result.source}`);
    passed++;
  } else {
    console.log(`${RED}❌ FAIL${RESET}  ${tc.name}`);
    console.log(`        Expected Priority: ${tc.expectedPriority}${tc.expectedCategory ? ` / Category: ${tc.expectedCategory}` : ''}`);
    console.log(`        Got     Priority: ${result.priority} / Category: ${result.category}`);
    console.log(`        Warnings: ${result.warnings.join('; ')}`);
    failed++;
  }
  console.log(`        ${YELLOW}${tc.desc}${RESET}\n`);
}

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('  Security Invariant Tests');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

for (const st of securityTests) {
  const ok = st.test();
  if (ok) {
    console.log(`${GREEN}✅ PASS${RESET}  ${st.name}`);
    passed++;
  } else {
    console.log(`${RED}❌ FAIL${RESET}  ${st.name}`);
    failed++;
  }
  console.log(`        ${YELLOW}${st.desc}${RESET}\n`);
}

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log(`  Results: ${GREEN}${passed} passed${RESET}  ${failed > 0 ? `${RED}${failed} failed${RESET}` : `${GREEN}0 failed${RESET}`}`);
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

if (failed > 0) {
  process.exit(1);
}
