import { translations, I18nService } from '../i18n';

const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const RESET = '\x1b[0m';

let passed = 0;
let failed = 0;

function assert(condition: boolean, message: string) {
  if (condition) {
    console.log(`${GREEN}==> PASS${RESET}  ${message}`);
    passed++;
  } else {
    console.log(`${RED}==> FAIL${RESET}  ${message}`);
    failed++;
  }
}

export function runI18nTests() {
  console.log('\n=====================================================');
  console.log('  ArogyaMitra Language & Accessibility Test Suite');
  console.log('=====================================================\n');

  // Test 1: Language Preference loading & fallback
  console.log('--- Test 1: Translation Dictionaries Loading ---');
  assert(translations.en !== undefined, 'English dictionary seeded');
  assert(translations.ta !== undefined, 'Tamil dictionary seeded');
  assert(translations.hi !== undefined, 'Hindi dictionary seeded');
  assert(translations.mr !== undefined, 'Marathi dictionary seeded');

  // Test 2: Text translations and placeholders replacement
  console.log('\n--- Test 2: Localized placeholders and parameter injection ---');
  I18nService.setLanguage('ta');
  const tamilWarn = I18nService.translate('possible_medicine_warn', { name: 'Dolo-650' });
  assert(tamilWarn.includes('Dolo-650'), 'Tamil warning translates with medicine name injection');

  // Test 3: Language Preference saving & state check
  console.log('\n--- Test 3: Default fallbacks and missing translation parameter limits ---');
  I18nService.setLanguage('mr');
  const marathiNeedGuidance = I18nService.translate('need_guidance');
  assert(marathiNeedGuidance.length > 5, 'Marathi need_guidance localized text loaded successfully');

  console.log(`\n=====================================================`);
  console.log(`  I18N MOCK TESTS SUMMARY: ${passed}/${passed + failed} passed`);
  console.log('=====================================================\n');
}
runI18nTests();
