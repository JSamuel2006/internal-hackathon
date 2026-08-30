/**
 * OCR Text Normalization, Similarity, and Consensus Layer
 * 
 * Performs:
 * 1. Whitespace, newline, and casing normalization.
 * 2. Hyphen and punctuation standardization.
 * 3. Context-aware character confusion correction (e.g. 65O mg -> 650 mg).
 * 4. Candidate matching and similarity calculation (Levenshtein distance).
 */

// Static local database of verified medicines in ArogyaMitra
export const VERIFIED_MEDICINE_DB = [
  { name: 'Dolo-650', genericName: 'Paracetamol', manufacturer: 'Micro Labs', strength: '650mg', dosageForm: 'Tablet' },
  { name: 'Crocin', genericName: 'Paracetamol', manufacturer: 'GSK', strength: '500mg', dosageForm: 'Tablet' },
  { name: 'Combiflam', genericName: 'Ibuprofen & Paracetamol', manufacturer: 'Sanofi', strength: '400mg/325mg', dosageForm: 'Tablet' },
  { name: 'Augmentin-625 Duo', genericName: 'Amoxicillin & Clavulanate', manufacturer: 'GSK', strength: '625mg', dosageForm: 'Tablet' }
];

/**
 * Normalizes text lines to clean out common punctuation noise
 */
export function normalizeLine(text: string): string {
  if (!text) return '';
  return text
    .trim()
    .toLowerCase()
    .replace(/[\s\-_]+/g, ' ') // normalize whitespace, hyphens, underscores to space
    .replace(/[^a-z0-9\s]/g, '') // remove trailing weird characters
    .trim();
}

/**
 * Performs context-aware digit-letter confusion mapping.
 * E.g., matching strength parameters or common typos.
 */
export function normalizeOcrConfusions(text: string): string {
  if (!text) return '';
  let normalized = text.replace(/(\b\d+)[Oo]\s*(mg|mcg|ml|g)\b/g, String.fromCharCode(36) + '10 ' + String.fromCharCode(36) + '2');
  normalized = normalized.replace(/\b([S])(\d+)\b/g, '5' + String.fromCharCode(36) + '2');
  normalized = normalized.replace(/\b(\d+)[S]\b/g, String.fromCharCode(36) + '15');
  normalized = normalized.replace(/\b([B])(\d+)\b/g, '8' + String.fromCharCode(36) + '2');
  normalized = normalized.replace(/\b(\d+)[B]\b/g, String.fromCharCode(36) + '18');
  normalized = normalized.replace(/\bparacetemol\b/g, 'paracetamol');
  normalized = normalized.replace(/\bparacetamal\b/g, 'paracetamol');
  return normalized;
}

export function getLevenshteinDistance(a: string, b: string): number {
  const tmp: number[][] = [];
  for (let i = 0; i <= a.length; i++) {
    tmp[i] = [i];
  }
  for (let j = 0; j <= b.length; j++) {
    tmp[0][j] = j;
  }
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      tmp[i][j] = Math.min(
        tmp[i - 1][j] + 1,
        tmp[i][j - 1] + 1,
        tmp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
      );
    }
  }
  return tmp[a.length][b.length];
}

export function getStringSimilarity(a: string, b: string): number {
  const normA = normalizeLine(a);
  const normB = normalizeLine(b);
  if (normA === normB) return 1.0;
  const maxLength = Math.max(normA.length, normB.length);
  if (maxLength === 0) return 0;
  const distance = getLevenshteinDistance(normA, normB);
  return (maxLength - distance) / maxLength;
}

export function findBestDatabaseMatch(ocrName: string): { match: typeof VERIFIED_MEDICINE_DB[number] | null; similarity: number; } {
  if (!ocrName || ocrName.length < 2) return { match: null, similarity: 0 };
  const target = normalizeLine(ocrName);
  let bestMatch = null;
  let maxSim = 0;
  for (const med of VERIFIED_MEDICINE_DB) {
    const simName = getStringSimilarity(target, med.name);
    const simGeneric = getStringSimilarity(target, med.genericName);
    const isSubstring = target.includes(normalizeLine(med.name)) || normalizeLine(med.name).includes(target);
    const substringSim = isSubstring ? 0.75 : 0;
    const currentMax = Math.max(simName, simGeneric, substringSim);
    if (currentMax > maxSim) {
      maxSim = currentMax;
      bestMatch = med;
    }
  }
  return { match: bestMatch, similarity: maxSim };
}
