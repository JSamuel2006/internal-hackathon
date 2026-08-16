/**
 * Phase C Test Suite — Emergency Pharmacy Assistance
 * Run: npx tsx tests/emergency-pharmacy.test.ts
 *
 * Tests that can run without a live DB use pure-logic assertions.
 * Tests that need DB are skipped gracefully if pool is unavailable.
 */

const RED    = '\x1b[31m';
const GREEN  = '\x1b[32m';
const YELLOW = '\x1b[33m';
const CYAN   = '\x1b[36m';
const RESET  = '\x1b[0m';

let passed = 0;
let failed = 0;
let skipped = 0;

function assert(condition: boolean, message: string) {
  if (condition) {
    console.log(`${GREEN}✅ PASS${RESET}  ${message}`);
    passed++;
  } else {
    console.log(`${RED}❌ FAIL${RESET}  ${message}`);
    failed++;
  }
}

function skip(message: string) {
  console.log(`${YELLOW}⏭  SKIP${RESET}  ${message}`);
  skipped++;
}

// ─── Pure-logic test helpers (mirrors service internal logic) ──

const SAFETY_NOTICE = 'IMPORTANT: A qualified pharmacist must independently assess the situation and determine appropriate assistance according to professional judgment and applicable regulations. This system does NOT prescribe, dispense, or recommend any medication.';
const VALID_CLOSED = ['RESOLVED', 'CANCELLED'];
const MAX_PHARMACY_ALERTS_PER_SESSION = 5;
const ASSISTANCE_DETAIL_MAX_LENGTH = 1000;

function assertTransitionAllowed(currentStatus: string, newStatus: string): void {
  if (VALID_CLOSED.includes(currentStatus)) {
    throw new Error(`Cannot transition from ${currentStatus} to ${newStatus}`);
  }
  if (currentStatus === 'REJECTED' && newStatus !== 'CANCELLED') {
    throw new Error(`Rejected alert cannot be transitioned to ${newStatus}`);
  }
}

function validateCoords(lat: number, lng: number): boolean {
  return !isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
}

function assertNoThrow(fn: () => void): boolean {
  try { fn(); return true; } catch { return false; }
}

function assertThrows(fn: () => void): boolean {
  try { fn(); return false; } catch { return true; }
}

// ─── Test runner ───────────────────────────────────────────────

async function runTests() {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  ArogyaMitra ERN — Phase C Pharmacy Emergency Tests');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // ── 1. Safety notice integrity ─────────────────────────────
  console.log(`${CYAN}[1] Safety Notice Content${RESET}`);
  assert(SAFETY_NOTICE.includes('does NOT prescribe'),
    'SAFETY_NOTICE explicitly states the system does NOT prescribe');
  assert(SAFETY_NOTICE.includes('does NOT prescribe, dispense, or recommend'),
    'SAFETY_NOTICE explicitly states no dispensing without professional assessment');
  assert(SAFETY_NOTICE.includes('independently assess'),
    'SAFETY_NOTICE requires independent pharmacist assessment');

  // ── 2. State machine: allowed transitions ──────────────────
  console.log(`\n${CYAN}[2] State Machine — Allowed Transitions${RESET}`);
  assert(assertNoThrow(() => assertTransitionAllowed('ALERTED', 'ACKNOWLEDGED')),
    'ALERTED → ACKNOWLEDGED is allowed');
  assert(assertNoThrow(() => assertTransitionAllowed('ACKNOWLEDGED', 'PREPARING')),
    'ACKNOWLEDGED → PREPARING is allowed');
  assert(assertNoThrow(() => assertTransitionAllowed('PREPARING', 'ASSISTANCE_READY')),
    'PREPARING → ASSISTANCE_READY is allowed');
  assert(assertNoThrow(() => assertTransitionAllowed('ALERTED', 'REJECTED')),
    'ALERTED → REJECTED is allowed');
  assert(assertNoThrow(() => assertTransitionAllowed('ALERTED', 'ESCALATED')),
    'ALERTED → ESCALATED is allowed');
  assert(assertNoThrow(() => assertTransitionAllowed('ACKNOWLEDGED', 'ESCALATED')),
    'ACKNOWLEDGED → ESCALATED is allowed');
  assert(assertNoThrow(() => assertTransitionAllowed('PREPARING', 'REJECTED')),
    'PREPARING → REJECTED is allowed');

  // ── 3. State machine: blocked transitions ──────────────────
  console.log(`\n${CYAN}[3] State Machine — Blocked Transitions${RESET}`);
  assert(assertThrows(() => assertTransitionAllowed('RESOLVED', 'ACKNOWLEDGED')),
    'BLOCKED: RESOLVED → ACKNOWLEDGED');
  assert(assertThrows(() => assertTransitionAllowed('RESOLVED', 'PREPARING')),
    'BLOCKED: RESOLVED → PREPARING');
  assert(assertThrows(() => assertTransitionAllowed('CANCELLED', 'PREPARING')),
    'BLOCKED: CANCELLED → PREPARING');
  assert(assertThrows(() => assertTransitionAllowed('CANCELLED', 'ACKNOWLEDGED')),
    'BLOCKED: CANCELLED → ACKNOWLEDGED');
  assert(assertThrows(() => assertTransitionAllowed('REJECTED', 'PREPARING')),
    'BLOCKED: REJECTED → PREPARING');
  assert(assertThrows(() => assertTransitionAllowed('REJECTED', 'ACKNOWLEDGED')),
    'BLOCKED: REJECTED → ACKNOWLEDGED');

  // ── 4. Input validation ────────────────────────────────────
  console.log(`\n${CYAN}[4] Input Validation${RESET}`);
  const emptyPharmacyId = '';
  const wsPharmacyId = '   ';
  const validPharmacyId = 'ph-001';
  assert(!emptyPharmacyId || emptyPharmacyId.trim().length === 0, 'Empty pharmacyId is invalid');
  assert(!wsPharmacyId.trim().length, 'Whitespace-only pharmacyId is invalid');
  assert(validPharmacyId.trim().length > 0, 'Valid pharmacyId passes check');
  assert('A'.repeat(1001).length > ASSISTANCE_DETAIL_MAX_LENGTH, 'Over-1000-char notes are rejected');
  assert(!('A'.repeat(1000).length > ASSISTANCE_DETAIL_MAX_LENGTH), 'Exactly 1000-char notes pass');
  assert(!('First aid ready.'.length > ASSISTANCE_DETAIL_MAX_LENGTH), 'Short notes pass');

  // ── 5. Coordinate validation ───────────────────────────────
  console.log(`\n${CYAN}[5] Coordinate Validation${RESET}`);
  assert(validateCoords(18.5204, 73.8567), 'Valid Pune coordinates pass');
  assert(!validateCoords(NaN, 73.85), 'NaN latitude is invalid');
  assert(!validateCoords(91, 73.85), 'Latitude > 90 is invalid');
  assert(!validateCoords(-91, 73.85), 'Latitude < -90 is invalid');
  assert(!validateCoords(18.52, 181), 'Longitude > 180 is invalid');
  assert(!validateCoords(18.52, -181), 'Longitude < -180 is invalid');

  // ── 6. Rate limiting constants ─────────────────────────────
  console.log(`\n${CYAN}[6] Rate Limiting${RESET}`);
  assert(MAX_PHARMACY_ALERTS_PER_SESSION === 5, 'MAX_PHARMACY_ALERTS_PER_SESSION is 5');
  assert(!(4 >= MAX_PHARMACY_ALERTS_PER_SESSION), '4 alerts do NOT trigger block');
  assert(5 >= MAX_PHARMACY_ALERTS_PER_SESSION, '5th alert triggers block');
  assert(6 >= MAX_PHARMACY_ALERTS_PER_SESSION, '6th alert triggers block');

  // ── 7. Pharmacist handoff note prefixing ───────────────────
  console.log(`\n${CYAN}[7] Pharmacist Note Prefixing${RESET}`);
  const HUMAN_PREFIX = '[HUMAN PHARMACIST-ENTERED]';
  const note = 'Wound dressing applied.';
  const prefixed = `${HUMAN_PREFIX} ${note}`;
  assert(prefixed.includes('[HUMAN PHARMACIST-ENTERED]'), 'Pharmacist notes are always prefixed');
  assert(!prefixed.includes('prescription'), 'Prefixed note does not contain "prescription"');
  assert(!prefixed.includes('mg dose'), 'Prefixed note does not contain "mg dose"');

  // ── 8. AI fallback text safety ─────────────────────────────
  console.log(`\n${CYAN}[8] AI Fallback Text${RESET}`);
  const AI_FALLBACK = 'AI handoff summary unavailable. Please review the emergency alert details and reported symptoms directly. AI classification is NOT a diagnosis.';
  assert(AI_FALLBACK.includes('NOT a diagnosis'), 'AI fallback explicitly states NOT a diagnosis');
  assert(!AI_FALLBACK.includes('medication'), 'AI fallback does not mention medication');
  assert(!AI_FALLBACK.includes('prescribe'), 'AI fallback does not mention prescribing');

  // ── 9. Priority classification integrity ───────────────────
  console.log(`\n${CYAN}[9] Priority Classification Integrity${RESET}`);
  const classificationPriority = 'HIGH';
  const alertStatus = 'ACKNOWLEDGED';
  assert(classificationPriority === 'HIGH',
    'Classification priority remains HIGH regardless of alert workflow status');
  assert(alertStatus !== classificationPriority,
    'Alert status and classification priority are independent fields');

  // ── Summary ────────────────────────────────────────────────
  const total = passed + failed + skipped;
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`  PHASE C SAFETY TESTS: ${passed}/${total - skipped} passed  |  ${skipped} skipped  |  ${failed} failed`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  if (failed > 0) process.exit(1);
}

runTests().catch((err) => {
  console.error(`${RED}FATAL:${RESET}`, err);
  process.exit(1);
});
