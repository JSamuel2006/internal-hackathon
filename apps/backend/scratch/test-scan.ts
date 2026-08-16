import { handleAnalyzeMedicine } from '../src/controllers/medicineController.js';
import { ocrService } from '../src/services/ocr/ocrService.js';
import { geminiService } from '../src/services/ai-services/geminiService.js';
import { patientContextService } from '../src/services/patientContextService.js';
import { env } from '../src/configuration/environment.js';
import { Request, Response } from 'express';
import fs from 'fs';

// Helper to construct a mock Express Response object
function createMockResponse() {
  const res: any = {};
  res.status = (code: number) => {
    res.statusCode = code;
    return res;
  };
  res.json = (data: any) => {
    res.body = data;
    return res;
  };
  return res as Response & { statusCode: number; body: any };
}

// Backup original services for restoring
const originalRecognize = ocrService.recognize;
const originalGenerateText = geminiService.generateText;
const originalGetContext = patientContextService.getContextForUser;
const originalApiKey = env.GEMINI_API_KEY;

async function runTests() {
  console.log('=== STARTING SCANNER RESILIENCE TESTS ===\n');

  // MOCK FILE CREATION
  const dummyPath = './dummy-strip.jpg';
  fs.writeFileSync(dummyPath, 'fake-image-bytes');

  const defaultFile: any = {
    path: dummyPath,
    filename: 'dummy-strip.jpg',
    mimetype: 'image/jpeg'
  };

  const testCases = [
    {
      name: 'Dolo-650 Scan (Happy Path)',
      ocrText: 'Dolo-650\nBatch: DL9081\nExp: 12/2028\nMfg by: Micro Labs\nMRP: 30.00',
      aiResponse: JSON.stringify({
        medicineName: 'Dolo-650',
        brandName: 'Dolo-650',
        genericName: 'Paracetamol',
        activeIngredients: 'Paracetamol 650mg',
        strength: '650mg',
        medicineType: 'Analgesic',
        dosageForm: 'Tablet',
        clinicalAnalysis: {
          uses: 'Pain relief and fever reduction',
          drugInteractions: ['Warfarin']
        }
      }),
      context: {
        allergies: ['Sulfa'],
        medications: ['Metformin'],
        digitalTwin: { kidneyScore: 90, liverScore: 85 }
      }
    },
    {
      name: 'Crocin Scan with Blurry Image / Low OCR Confidence',
      ocrText: 'Crocin',
      ocrConfidence: 0.35, // Low confidence
      aiResponse: '',
      context: null
    },
    {
      name: 'Combiflam Scan with AI Failure (Service Timeout / Error)',
      ocrText: 'Combiflam\nBatch: CB1122\nExp: 09/2027\nMRP: 45.00',
      aiResponse: null, // Force AI throw
      context: {
        allergies: [],
        medications: [],
        digitalTwin: { kidneyScore: 50, liverScore: 90 } // low kidney score
      }
    },
    {
      name: 'Augmentin Scan with Invalid JSON from AI',
      ocrText: 'Augmentin-625 Duo\nBatch: AG8811\nExp: 05/2026\nMRP: 200.00',
      aiResponse: '```json\nThis is not valid JSON string\n```',
      context: null
    },
    {
      name: 'Empty Image / OCR Failure',
      ocrText: '',
      ocrConfidence: 0.1,
      aiResponse: '',
      context: null
    },
    {
      name: 'Database Save Failure Protection',
      ocrText: 'Dolo-650\nBatch: DL9081\nExp: 12/2028\nMRP: 30.00',
      aiResponse: '{}',
      context: null,
      dbFail: true
    },
    {
      name: 'Patient Context Query Failure Protection',
      ocrText: 'Crocin\nBatch: CR0091\nExp: 11/2028',
      aiResponse: '{}',
      contextFail: true
    }
  ];

  for (const tc of testCases) {
    console.log(`--- Test: ${tc.name} ---`);
    
    // Set up mocks
    ocrService.recognize = async () => ({
      text: tc.ocrText,
      confidence: tc.hasOwnProperty('ocrConfidence') ? (tc as any).ocrConfidence : 0.85,
      processingTimeMs: 150,
      language: 'eng',
      preprocessingMetadata: { blurScore: 12.5, rotationAngle: 0 }
    });

    if (tc.aiResponse === null) {
      geminiService.generateText = async () => {
        throw new Error('AI Generation Timeout / Quota Exhausted');
      };
    } else {
      geminiService.generateText = async () => tc.aiResponse || '';
    }

    if (tc.contextFail) {
      patientContextService.getContextForUser = async () => {
        throw new Error('Database connection failed for patient profile lookup');
      };
    } else {
      patientContextService.getContextForUser = async () => tc.context as any;
    }

    // Mock request
    const req: any = {
      file: defaultFile,
      body: {
        userId: 'usr-901',
        contextConsent: tc.context ? 'true' : 'false'
      },
      ip: '127.0.0.1'
    };

    const res = createMockResponse();

    try {
      // Re-write file if deleted by previous runs
      if (!fs.existsSync(dummyPath)) {
        fs.writeFileSync(dummyPath, 'fake-image-bytes');
      }

      await handleAnalyzeMedicine(req, res, () => {});

      console.log(`Status Code: ${res.statusCode}`);
      console.log(`Success: ${res.body?.success}`);
      console.log(`Partial Results: ${res.body?.partialResults}`);
      console.log(`Warnings: ${JSON.stringify(res.body?.warnings || [])}`);
      if (res.body?.success) {
        console.log(`Scan ID: ${res.body?.scanId}`);
        console.log(`Medicine Name: ${res.body?.data?.medicineName}`);
        console.log(`Batch: ${res.body?.data?.batchNumber}`);
        console.log(`Expiry: ${res.body?.data?.expiryDate}`);
        console.log(`Image Quality: ${res.body?.imageQuality?.qualityRating}`);
        console.log(`Database Status: ${res.body?.dbValidation?.matchStatus}`);
        console.log(`QR Status: ${res.body?.qrBarcodeVerification?.qrStatus}`);
        console.log(`Warnings Generated: ${res.body?.patientWarnings?.length || 0}`);
      }
      console.log('Result: PASS (No 500 error thrown)\n');
    } catch (err: any) {
      console.error('Result: FAIL (Exception thrown at outer scope)');
      console.error(err);
      process.exit(1);
    }
  }

  // Restore original services
  ocrService.recognize = originalRecognize;
  geminiService.generateText = originalGenerateText;
  patientContextService.getContextForUser = originalGetContext;
  env.GEMINI_API_KEY = originalApiKey;

  // Cleanup
  if (fs.existsSync(dummyPath)) {
    fs.unlinkSync(dummyPath);
  }

  console.log('=== ALL TESTS COMPLETED SUCCESSFULLY ===');
}

runTests();
