import { createWorker } from 'tesseract.js';
import winston from 'winston';
import fs from 'fs';
import path from 'path';
import { Jimp } from 'jimp';
import { OCRPreprocessor, PreprocessingMetadata } from './ocrPreprocessor.js';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [new winston.transports.Console()]
});

export interface OCRFieldConfidences {
  medicineName: number;
  manufacturer: number;
  batchNumber: number;
  expiryDate: number;
  manufacturingDate: number;
  mrp: number;
  strength: number;
  dosageForm: number;
  storageInstructions: number;
}

export interface OCRResult {
  text: string;
  confidence: number;
  processingTimeMs: number;
  language: string;
  preprocessingMetadata?: PreprocessingMetadata;
  fieldConfidences?: OCRFieldConfidences;
  regions?: Record<string, { text: string; confidence: number }>;
  fields?: Record<string, { value: string; confidence: number; source: string }>;
  debug?: {
    originalText: string;
    originalConfidence: number;
    enhancedText: string;
    enhancedConfidence: number;
    thresholdText: string;
    thresholdConfidence: number;
    sharpenedText: string;
    sharpenedConfidence: number;
    highContrastText: string;
    highContrastConfidence: number;
    denoisedText: string;
    denoisedConfidence: number;
    bestPass: string;
    totalPasses: number;
  };
}

// ==========================================
// PHARMACEUTICAL REGEX PATTERNS
// Expanded to match diverse Indian pharmaceutical markings
// ==========================================
export const PHARMA_REGEXES = {
  batchNumber: [
    /\b(?:batch\s*(?:no|number|#|:)?\.?\s*)([A-Z0-9]{4,16})\b/i,
    /\b(?:lot\s*(?:no|number|#|:)?\.?\s*)([A-Z0-9]{4,16})\b/i,
    /\b(?:B\.?No\.?|B#|B\.No|B\s+No|LOT)\s*:?\s*([A-Z0-9]{4,16})\b/i,
    /\bBatch\s*:?\s*([A-Z0-9]{4,16})\b/i,
  ],
  expiryDate: [
    /\b(?:exp(?:iry)?\.?\s*(?:date)?\.?\s*:?\s*)(\d{1,2}[\/\-\.]\d{4}|\d{1,2}[\/\-\.]\d{2}|[A-Za-z]{3,}\s*\d{4}|\d{4})\b/i,
    /\buse\s+before\s*:?\s*(\d{1,2}[\/\-\.]\d{4}|[A-Za-z]{3,}\s*\d{4})/i,
    /\bEXP\.?\s*:?\s*([A-Za-z]{3,}\s*\d{4}|\d{2}[\/\-]\d{4}|\d{2}[\/\-]\d{2})/i,
    /\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\.?\s*(\d{4})\b/i,
    /\b(\d{1,2})[\/\-\.](\d{2}[\/\-\.]\d{2,4})\b/,
  ],
  manufacturingDate: [
    /\b(?:mfg\.?\s*(?:date)?\.?\s*:?\s*)(\d{1,2}[\/\-\.]\d{4}|\d{1,2}[\/\-\.]\d{2}|[A-Za-z]{3,}\s*\d{4})/i,
    /\b(?:manufactured|mfd|mfg)\s*(?:date)?\.?\s*:?\s*(\d{1,2}[\/\-\.]\d{4}|[A-Za-z]{3,}\s*\d{4})/i,
    /\bMfg\.?\s*:?\s*([A-Za-z]{3,}\s*\d{4}|\d{2}[\/\-]\d{4})/i,
  ],
  mrp: [
    /\b(?:MRP|M\.R\.P|Max\.?\s*Retail\s*Price)\s*\.?\s*:?\s*(?:Rs\.?|₹|INR)?\s*(\d+(?:\.\d{1,2})?)/i,
    /(?:Rs\.?|₹|INR)\s*(\d+(?:\.\d{1,2})?)/i,
    /\b(?:price)\s*:?\s*(?:Rs\.?|₹)?\s*(\d+(?:\.\d{1,2})?)/i,
  ],
  strength: [
    /\b(\d+(?:\.\d+)?)\s*(mg|mcg|µg|g|ml|IU|mmol|mcg)\b/i,
    /\b(\d+(?:\.\d+)?)\s*(?:mg|mcg|g|ml)\s*(?:\/\s*(\d+(?:\.\d+)?)\s*(?:mg|mcg|g|ml))?\b/i,
  ],
  dosageForm: [
    /\b(tablet|tablets|capsule|capsules|syrup|suspension|injection|ointment|cream|gel|drops|patch|inhaler|spray|powder|granules|lozenges)\b/i,
  ],
  storageInstructions: [
    /(?:store|storage|keep)\s*(?:in|at|below|between)?\s*[^.\n]{5,80}/i,
    /(?:protect from|away from)\s*[^.\n]{5,50}/i,
  ],
  barcode: [
    /\b(\d{8,14})\b/g,
  ],
};

export function extractFieldsFromOCR(text: string, regions?: Record<string, string>): {
  fields: Record<string, { value: string; confidence: number; source: string }>;
  fieldConfidences: OCRFieldConfidences;
} {
  const fields: Record<string, { value: string; confidence: number; source: string }> = {};

  const tryExtractDebug = (key: string, patterns: RegExp[], fullText: string): string => {
    console.log(`\n[REGEX DEBUG] Checking key: ${key}`);
    for (let idx = 0; idx < patterns.length; idx++) {
      const pattern = patterns[idx];
      const match = fullText.match(pattern);
      if (match) {
        const value = (match[2] ? `${match[1]} ${match[2]}` : match[1] || match[0]).trim();
        console.log(`  -> Pattern [${idx}] MATCHED! Match: "${match[0]}", Captured: "${value}"`);
        if (value.length > 1) {
          return value;
        }
      } else {
        console.log(`  -> Pattern [${idx}] (${pattern}) failed to match.`);
      }
    }
    return '';
  };

  // Region B contains generic composition and strength
  const textForStrength = regions?.Region_B || text;
  const strengthVal = tryExtractDebug('strength', PHARMA_REGEXES.strength, textForStrength);
  fields['strength'] = strengthVal ? { value: strengthVal, confidence: 0.95, source: 'OCR_REGEX' } : { value: '', confidence: 0, source: 'NOT_DETECTED' };

  const dosageVal = tryExtractDebug('dosageForm', PHARMA_REGEXES.dosageForm, textForStrength);
  fields['dosageForm'] = dosageVal ? { value: dosageVal, confidence: 0.95, source: 'OCR_REGEX' } : { value: '', confidence: 0, source: 'NOT_DETECTED' };

  // Region D / D_Rotated contains packaging details
  const rD = regions?.Region_D || '';
  const rDRot = regions?.Region_D_Rotated || '';
  const textForPack = rDRot.length > rD.length ? `${rDRot}\n${rD}` : `${rD}\n${rDRot}`;
  const textForPackCombined = textForPack.trim() ? textForPack : text;

  const batchVal = tryExtractDebug('batchNumber', PHARMA_REGEXES.batchNumber, textForPackCombined);
  fields['batchNumber'] = batchVal ? { value: batchVal, confidence: 0.92, source: 'OCR_REGEX' } : { value: '', confidence: 0, source: 'NOT_DETECTED' };

  const expiryVal = tryExtractDebug('expiryDate', PHARMA_REGEXES.expiryDate, textForPackCombined);
  fields['expiryDate'] = expiryVal ? { value: expiryVal, confidence: 0.92, source: 'OCR_REGEX' } : { value: '', confidence: 0, source: 'NOT_DETECTED' };

  const mfgVal = tryExtractDebug('manufacturingDate', PHARMA_REGEXES.manufacturingDate, textForPackCombined);
  fields['manufacturingDate'] = mfgVal ? { value: mfgVal, confidence: 0.92, source: 'OCR_REGEX' } : { value: '', confidence: 0, source: 'NOT_DETECTED' };

  const mrpVal = tryExtractDebug('mrp', PHARMA_REGEXES.mrp, textForPackCombined);
  fields['mrp'] = mrpVal ? { value: mrpVal, confidence: 0.92, source: 'OCR_REGEX' } : { value: '', confidence: 0, source: 'NOT_DETECTED' };

  // Region A contains medicine name
  const textForName = regions?.Region_A || text;
  const nameMatch = textForName.match(/^([A-Z][a-zA-Z\-\s]{2,30})\s*\n/m) || textForName.match(/\b([A-Z][a-zA-Z\-\s]{2,20})\b/);
  if (nameMatch && nameMatch[1].trim().length > 2) {
    fields['medicineName'] = { value: nameMatch[1].trim(), confidence: 0.90, source: 'OCR_REGEX' };
  } else {
    fields['medicineName'] = { value: '', confidence: 0, source: 'NOT_DETECTED' };
  }

  // Region C contains manufacturer
  const textForMfg = regions?.Region_C || text;
  const mfgMatch = textForMfg.match(/(?:mfg|manufactured|marketed|distributed)\s+by\s*:?\s*([^\n,]{5,60})/i) || textForMfg.match(/\b(Micro Labs|Sun Pharma|Cipla|Abbott|Lupin|Cadila|Glaxo|Pfizer|Alkem)\b/i);
  if (mfgMatch) {
    fields['manufacturer'] = { value: (mfgMatch[1] || mfgMatch[0]).trim(), confidence: 0.90, source: 'OCR_REGEX' };
  } else {
    fields['manufacturer'] = { value: '', confidence: 0, source: 'NOT_DETECTED' };
  }

  // Build confidence object
  const fieldConfidences: OCRFieldConfidences = {
    medicineName:         fields['medicineName']?.confidence ?? 0,
    manufacturer:         fields['manufacturer']?.confidence ?? 0,
    batchNumber:          fields['batchNumber']?.confidence ?? 0,
    expiryDate:           fields['expiryDate']?.confidence ?? 0,
    manufacturingDate:    fields['manufacturingDate']?.confidence ?? 0,
    mrp:                  fields['mrp']?.confidence ?? 0,
    strength:             fields['strength']?.confidence ?? 0,
    dosageForm:           fields['dosageForm']?.confidence ?? 0,
    storageInstructions:  0.8,
  };

  return { fields, fieldConfidences };
}





export class OCRService {
  // We maintain a pool of workers to support parallel recognition
  private workerPool: any[] = [];
  private readonly MAX_WORKERS = 3;

  private pharmaKeywords = [
    'tablet', 'tablets', 'capsule', 'capsules', 'ointment', 'cream', 'gel', 'drops',
    'mg', 'mcg', 'ml', 'ip', 'usp', 'bp', 'rx', 'batch', 'lot', 'mfg', 'exp',
    'expiry', 'manufactured', 'composition', 'storage', 'warning', 'dosage',
    'paracetamol', 'dolo', 'crocin', 'calpol', 'pcm', 'cetirizine', 'azithromycin',
    'amoxicillin', 'pantoprazole', 'ibuprofen', 'metformin', 'atorvastatin',
  ];

  private commonBrands = [
    'paracetamol', 'dolo', 'crocin', 'calpol', 'pcm', 'cetirizine', 'azithromycin',
    'amoxicillin', 'pantoprazole', 'ors', 'zinc', 'vitamin', 'ibuprofen',
  ];

  public cleanText(rawText: string): string {
    if (!rawText) return '';
    let text = rawText
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .join('\n');
    text = text.replace(/[~=+|<>`\\#@_]{2,}/g, ' ');
    text = text.replace(/[ \t]+/g, ' ');
    text = text.replace(/\b(\w+)\s+\1\b/gi, '$1');
    return text.trim();
  }

  private async getWorker(): Promise<any> {
    if (this.workerPool.length > 0) {
      return this.workerPool.pop()!;
    }
    const worker = await createWorker('eng');
    return worker;
  }

  private async releaseWorker(worker: any): Promise<void> {
    if (this.workerPool.length < this.MAX_WORKERS) {
      this.workerPool.push(worker);
    } else {
      try { await worker.terminate(); } catch {}
    }
  }

  private async recognizeSinglePass(
    imageInput: string,
    psm: number = 3,
    oem: number = 3
  ): Promise<{ text: string; confidence: number }> {
    const worker = await this.getWorker();
    try {
      await worker.setParameters({
        tessedit_pageseg_mode: String(psm),
        tessedit_ocr_engine_mode: String(oem),
        preserve_interword_spaces: '1',
      });
      const { data } = await worker.recognize(imageInput);
      return {
        text: this.cleanText(data.text || ''),
        confidence: data.confidence,
      };
    } finally {
      await this.releaseWorker(worker);
    }
  }

  private calculateOCRScore(text: string, confidence: number): number {
    if (!text || text.trim().length === 0) return 0;
    const lowerText = text.toLowerCase();
    const confScore = confidence;
    let kwMatches = 0;
    for (const kw of this.pharmaKeywords) {
      if (lowerText.includes(kw)) kwMatches++;
    }
    const kwScore = Math.min(kwMatches * 10, 100);
    const textCompleteness = Math.min((text.length / 300) * 100, 100);
    let brandDetected = false;
    for (const brand of this.commonBrands) {
      if (lowerText.includes(brand)) { brandDetected = true; break; }
    }
    const brandScore = brandDetected ? 100 : 0;
    return (0.40 * confScore) + (0.35 * kwScore) + (0.15 * textCompleteness) + (0.10 * brandScore);
  }

  /**
   * Parallel multi-pass OCR using Promise.allSettled.
   * Previously sequential (slow). Now all passes run concurrently.
   */
  public async recognize(filePath: string): Promise<OCRResult> {
    const startTime = performance.now();
    let tempFiles: string[] = [];
    let preprocessingMetadata: PreprocessingMetadata | undefined;

    try {
      logger.info({ message: 'Phase 5F.6: Starting intelligent region-based OCR pipeline', file: filePath });

      // Step 1: Preprocessing
      preprocessingMetadata = await OCRPreprocessor.processImage(filePath);
      tempFiles = [
        preprocessingMetadata.enhancedPath,
        preprocessingMetadata.thresholdPath,
        preprocessingMetadata.sharpenedPath,
        preprocessingMetadata.highContrastPath,
        preprocessingMetadata.denoisedPath,
        preprocessingMetadata.rotate90Path,
        preprocessingMetadata.rotate270Path,
      ];

      // Step 2: Intelligent Region Segmentation & Crop
      const originalImg = await Jimp.read(filePath);
      const width = originalImg.bitmap.width;
      const height = originalImg.bitmap.height;

      const safeCrop = (img: any, cropArea: { x: number; y: number; w: number; h: number }) => {
        const x = Math.max(0, Math.min(cropArea.x, img.bitmap.width - 1));
        const y = Math.max(0, Math.min(cropArea.y, img.bitmap.height - 1));
        const w = Math.max(1, Math.min(cropArea.w, img.bitmap.width - x));
        const h = Math.max(1, Math.min(cropArea.h, img.bitmap.height - y));
        return img.clone().crop({ x, y, w, h });
      };

      // DYNAMIC PACKAGING STRIP DETECTION (Connected density edge scanner)
      const getVerticalContrastScore = (img: any, xStart: number, xEnd: number): number => {
        let score = 0;
        const w = xEnd - xStart;
        const stepY = Math.max(1, Math.floor(img.bitmap.height / 80));
        const stepX = Math.max(1, Math.floor(w / 15));
        for (let y = 1; y < img.bitmap.height - 1; y += stepY) {
          for (let x = xStart + 1; x < xEnd - 1; x += stepX) {
            const idx = (y * img.bitmap.width + x) * 4;
            const leftIdx = (y * img.bitmap.width + (x - 1)) * 4;
            const diff = Math.abs(img.bitmap.data[idx] - img.bitmap.data[leftIdx]);
            if (diff > 30) score++;
          }
        }
        return score;
      };

      let bestSliceX = Math.floor(width * 0.70);
      let maxContrast = -1;
      const sliceWidth = Math.floor(width * 0.30);
      for (let offset = 0; offset <= width - sliceWidth; offset += Math.floor(width * 0.05)) {
        const score = getVerticalContrastScore(originalImg, offset, offset + sliceWidth);
        if (score > maxContrast) {
          maxContrast = score;
          bestSliceX = offset;
        }
      }

      console.log(`[DYNAMIC CROP DEBUG] Best vertical text strip column detected at X: ${bestSliceX} to ${bestSliceX + sliceWidth} (Width: ${width}, Score: ${maxContrast})`);

      // Region A: Medicine Name (Top 25% height)
      const rAImg = safeCrop(originalImg, { x: 0, y: 0, w: width, h: Math.floor(height * 0.25) });
      const rAPath = filePath.replace(/(\.\w+)$/, '_ra$1');
      await rAImg.write(rAPath as any);
      tempFiles.push(rAPath);

      // Region B: Composition & Strength (25% to 55% height)
      const rBImg = safeCrop(originalImg, { x: 0, y: Math.floor(height * 0.25), w: width, h: Math.floor(height * 0.30) });
      const rBPath = filePath.replace(/(\.\w+)$/, '_rb$1');
      await rBImg.write(rBPath as any);
      tempFiles.push(rBPath);

      // Region C: Manufacturer (55% to 75% height)
      const rCImg = safeCrop(originalImg, { x: 0, y: Math.floor(height * 0.55), w: width, h: Math.floor(height * 0.20) });
      const rCPath = filePath.replace(/(\.\w+)$/, '_rc$1');
      await rCImg.write(rCPath as any);
      tempFiles.push(rCPath);

      // Region D: Packaging Details (Batch, Mfg, Exp, MRP)
      const rDImg = safeCrop(originalImg, { x: bestSliceX, y: 0, w: sliceWidth, h: height });
      const rDPath = filePath.replace(/(\.\w+)$/, '_rd$1');
      await rDImg.write(rDPath as any);
      tempFiles.push(rDPath);

      // Generate 4 rotations for Region D (0, 90, 180, 270)
      const rD_0Path = filePath.replace(/(\.\w+)$/, '_rd_0$1');
      const rD_90Path = filePath.replace(/(\.\w+)$/, '_rd_90$1');
      const rD_180Path = filePath.replace(/(\.\w+)$/, '_rd_180$1');
      const rD_270Path = filePath.replace(/(\.\w+)$/, '_rd_270$1');

      await rDImg.clone().write(rD_0Path as any);
      await rDImg.clone().rotate(90).write(rD_90Path as any);
      await rDImg.clone().rotate(180).write(rD_180Path as any);
      await rDImg.clone().rotate(270).write(rD_270Path as any);
      tempFiles.push(rD_0Path, rD_90Path, rD_180Path, rD_270Path);

      // Region E: QR/Barcode (Bottom 25% height)
      const rEImg = safeCrop(originalImg, { x: 0, y: Math.floor(height * 0.75), w: width, h: Math.floor(height * 0.25) });
      const rEPath = filePath.replace(/(\.\w+)$/, '_re$1');
      await rEImg.write(rEPath as any);
      tempFiles.push(rEPath);

      // Save debug images in debug/ directory
      const debugDir = path.join(process.cwd(), 'debug');
      if (!fs.existsSync(debugDir)) {
        fs.mkdirSync(debugDir, { recursive: true });
      }
      await Promise.all([
        rAImg.write(path.join(debugDir, 'Region_A.png') as any),
        rBImg.write(path.join(debugDir, 'Region_B.png') as any),
        rCImg.write(path.join(debugDir, 'Region_C.png') as any),
        rDImg.write(path.join(debugDir, 'Region_D.png') as any),
        rDImg.clone().rotate(90).write(path.join(debugDir, 'Region_D_rotated.png') as any),
        rEImg.write(path.join(debugDir, 'Region_E.png') as any),
      ]);

      console.log(`[DEBUG IMAGE EXPORTS] Cropped debug images saved to folder: ${debugDir}`);

      // Step 3: Run OCR passes (standard + regions concurrently)
      const passConfigs = [
        { name: 'Original (PSM3)',          path: filePath,                                   psm: 3,  oem: 3 },
        { name: 'Enhanced (PSM3)',           path: preprocessingMetadata.enhancedPath,         psm: 3,  oem: 3 },
        { name: 'Threshold (PSM6)',          path: preprocessingMetadata.thresholdPath,        psm: 6,  oem: 3 },
        { name: 'Sharpened (PSM11)',         path: preprocessingMetadata.sharpenedPath,        psm: 11, oem: 3 },
        { name: 'HighContrast (PSM12)',      path: preprocessingMetadata.highContrastPath,     psm: 12, oem: 3 },
        { name: 'Denoised (PSM3 OEM1)',      path: preprocessingMetadata.denoisedPath,         psm: 3,  oem: 1 },
        { name: 'Threshold (PSM3 OEM1)',     path: preprocessingMetadata.thresholdPath,        psm: 3,  oem: 1 },
        { name: 'Rotate90 (PSM3)',           path: preprocessingMetadata.rotate90Path,         psm: 3,  oem: 3 },
        { name: 'Rotate270 (PSM3)',          path: preprocessingMetadata.rotate270Path,        psm: 3,  oem: 3 },
        // Region segments
        { name: 'Region_A',                 path: rAPath,                                     psm: 3,  oem: 3 },
        { name: 'Region_B',                 path: rBPath,                                     psm: 3,  oem: 3 },
        { name: 'Region_C',                 path: rCPath,                                     psm: 3,  oem: 3 },
        { name: 'Region_E',                 path: rEPath,                                     psm: 3,  oem: 3 },
        // Region D rotations
        { name: 'Region_D_0',               path: rD_0Path,                                   psm: 3,  oem: 3 },
        { name: 'Region_D_90',              path: rD_90Path,                                  psm: 3,  oem: 3 },
        { name: 'Region_D_180',             path: rD_180Path,                                 psm: 3,  oem: 3 },
        { name: 'Region_D_270',             path: rD_270Path,                                 psm: 3,  oem: 3 },
      ];

      const settledResults = await Promise.allSettled(
        passConfigs.map(cfg => this.recognizeSinglePass(cfg.path, cfg.psm, cfg.oem))
      );

      const passResults: Array<{ name: string; text: string; confidence: number; score: number }> = [];
      const regionTextMap: Record<string, string> = {};
      const regionsMap: Record<string, { text: string; confidence: number }> = {};

      settledResults.forEach((result, i) => {
        if (result.status === 'fulfilled') {
          const { text, confidence } = result.value;
          const score = this.calculateOCRScore(text, confidence);
          const configName = passConfigs[i].name;

          passResults.push({ name: configName, text, confidence, score });

          if (configName.startsWith('Region_')) {
            regionTextMap[configName] = text;
            regionsMap[configName] = { text, confidence };
          }
          logger.info({ message: `Pass OK: ${configName}`, confidence, score: Math.round(score) });
        } else {
          logger.warn({ message: `Pass failed: ${passConfigs[i].name}`, reason: result.reason?.message });
        }
      });

      // Rank Region D passes
      const dPasses = passResults.filter(p => p.name.startsWith('Region_D_'));
      let bestD = dPasses.find(p => p.name === 'Region_D_90') || dPasses[0];
      let bestDScore = -1;

      console.log('\n--- REGION D ROTATION OCR DEBUG ---');
      for (const p of dPasses) {
        let regexCount = 0;
        if (p.text.match(PHARMA_REGEXES.batchNumber[0]) || p.text.match(PHARMA_REGEXES.batchNumber[2])) regexCount++;
        if (p.text.match(PHARMA_REGEXES.expiryDate[0]) || p.text.match(PHARMA_REGEXES.expiryDate[2])) regexCount++;
        if (p.text.match(PHARMA_REGEXES.mrp[0]) || p.text.match(PHARMA_REGEXES.mrp[1])) regexCount++;

        let kwMatches = 0;
        const lower = p.text.toLowerCase();
        for (const kw of ['batch', 'exp', 'mfg', 'mrp', 'rs', '₹']) {
          if (lower.includes(kw)) kwMatches++;
        }

        const score = (p.confidence * 0.40) + (regexCount * 30) + (kwMatches * 10) + (Math.min(p.text.length / 50, 1) * 10);
        console.log(`Rotation Pass [${p.name}] -> Conf: ${p.confidence}%, TextLength: ${p.text.length}, Matches: ${regexCount}, Score: ${score.toFixed(1)}`);
        console.log(`Raw Text: "${p.text.replace(/\n/g, '  ')}"`);

        if (score > bestDScore) {
          bestDScore = score;
          bestD = p;
        }
      }

      console.log(`WINNING Region D Rotation Pass: ${bestD.name} (Score: ${bestDScore.toFixed(1)})\n`);

      // Merge winning Region D text
      regionTextMap['Region_D_Rotated'] = bestD.name === 'Region_D_0' ? '' : bestD.text;
      regionTextMap['Region_D'] = bestD.name === 'Region_D_0' ? bestD.text : '';

      // Filter standard passes for finding the global best text
      const standardPasses = passResults.filter(p => !p.name.startsWith('Region_'));
      if (standardPasses.length === 0) {
        throw new Error('All standard OCR passes failed.');
      }
      standardPasses.sort((a, b) => b.score - a.score);
      const best = standardPasses[0];

      // Step 4: Extract structured fields using region segment maps
      const { fields, fieldConfidences } = extractFieldsFromOCR(best.text, regionTextMap);

      const processingTimeMs = Math.round(performance.now() - startTime);
      logger.info({
        message: 'Phase 5F.6 Region OCR pipeline complete',
        bestPass: best.name,
        score: Math.round(best.score),
        confidence: best.confidence,
        processingTimeMs,
        fieldsExtracted: Object.entries(fields).filter(([, v]) => v.value).length,
      });

      // Cleanup temp files
      for (const file of tempFiles) {
        if (fs.existsSync(file)) { try { fs.unlinkSync(file); } catch {} }
      }

      const findPass = (prefix: string) => passResults.find(p => p.name.startsWith(prefix)) || best;

      return {
        text: best.text,
        confidence: best.confidence / 100,
        processingTimeMs,
        language: 'eng',
        preprocessingMetadata,
        fieldConfidences,
        regions: regionsMap,
        fields,
        debug: {
          originalText:         findPass('Original').text,
          originalConfidence:   findPass('Original').confidence,
          enhancedText:         findPass('Enhanced').text,
          enhancedConfidence:   findPass('Enhanced').confidence,
          thresholdText:        findPass('Threshold').text,
          thresholdConfidence:  findPass('Threshold').confidence,
          sharpenedText:        findPass('Sharpened').text,
          sharpenedConfidence:  findPass('Sharpened').confidence,
          highContrastText:     findPass('HighContrast').text,
          highContrastConfidence: findPass('HighContrast').confidence,
          denoisedText:         findPass('Denoised').text,
          denoisedConfidence:   findPass('Denoised').confidence,
          bestPass:             best.name,
          totalPasses:          passResults.length,
        },
      };

    } catch (error: any) {
      for (const file of tempFiles) {
        if (fs.existsSync(file)) { try { fs.unlinkSync(file); } catch {} }
      }
      logger.error({ message: 'Phase 5F.6 Region OCR recognition failed', error: error.message });
      throw error;
    }
  }

  public async terminate(): Promise<void> {
    for (const worker of this.workerPool) {
      try { await worker.terminate(); } catch {}
    }
    this.workerPool = [];
    logger.info({ message: 'OCR worker pool terminated' });
  }
}

export const ocrService = new OCRService();
