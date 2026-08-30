/**
 * Dedicated Medicine Scanner OCR & Verification Tests
 * Run: npx tsx tests/medicine-ocr.test.ts
 */
import { normalizeOcrConfusions, findBestDatabaseMatch } from '../src/services/ocr/ocrNormalization.js';

const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const RESET = '\x1b[0m';

let passed = 0;
let failed = 0;

function assert(condition: boolean, message: string) {
  if (condition) {
    console.log(GREEN + '==> PASS  ' + message + RESET);
    passed++;
  } else {
    console.log(RED + '==> FAIL  ' + message + RESET);
    failed++;
  }
}

async function runTests() {
  console.log('\n=====================================================');
  console.log('  ArogyaMitra OCR & Medicine Consensus Test Suite');
  console.log('=====================================================\n');

  // Test 1: OCR Character Confusion Normalization
  console.log('--- Test 1: Character Confusion Normalization ---');
  const rawConfusedText = 'Dolo-65O mg paracetemol tablets IP 65o';
  const normalized = normalizeOcrConfusions(rawConfusedText);
  assert(normalized.includes('650 mg'), '65O mg normalized correctly to 650 mg');
  assert(normalized.includes('paracetamol'), 'paracetemol normalized to paracetamol');

  // Test 2: Database Match Verification
  console.log('\n--- Test 2: Database Match Consensus ---');
  const doloMatch = findBestDatabaseMatch('dolo 650');
  assert(doloMatch.match !== null, 'Dolo matched successfully against database');
  assert(doloMatch.match?.name === 'Dolo-650', 'Dolo matched correctly to Dolo-650');
  assert(doloMatch.similarity > 0.70, 'Dolo match similarity matches high consensus bar');

  // Test 3: Incorrect Guess Safety Policy (Anti-Fuzzy Overreach)
  console.log('\n--- Test 3: Anti-Fuzzy Safety Verification ---');
  const garbageMatch = findBestDatabaseMatch('ON Do BN');
  assert(garbageMatch.similarity < 0.60, 'Garbage text ON Do BN did not get a false high-confidence match');

  console.log('\\n=====================================================');
  console.log('  OCR TESTS SUMMARY: ' + passed + '/' + (passed + failed) + ' passed');
  console.log('=====================================================\\n');
  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}
runTests();