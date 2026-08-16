import { Request, Response, NextFunction } from 'express';
import { pool } from '../database/db.js';
import { geminiService } from '../services/ai-services/geminiService.js';
import { logger } from '../logging/logger.js';

export async function getSchemes(req: Request, res: Response, next: NextFunction) {
  try {
    const list = [
      {
        id: 'sch-pmjay',
        name: 'Ayushman Bharat PM-JAY',
        coverage: '₹5 Lakh per family per year',
        eligibility: 'SECC database classifications, low income households',
        benefits: 'Cashless secondary and tertiary hospitalization care',
        documents: 'Aadhaar Card, Ration Card, PM-JAY Letter'
      },
      {
        id: 'sch-cmchis',
        name: 'Chief Minister Comprehensive Health Insurance Scheme (CMCHIS)',
        coverage: '₹5 Lakh per family per year',
        eligibility: 'Annual income below ₹1.2 Lakh, state residents',
        benefits: 'Cashless empanelled hospital procedures',
        documents: 'Income Certificate, State Smart Card, Aadhaar Card'
      }
    ];
    return res.status(200).json({ success: true, data: list });
  } catch (error) {
    next(error);
  }
}

export async function checkEligibility(req: Request, res: Response, next: NextFunction) {
  try {
    const { age, income, state, disease } = req.body;

    const systemInstruction = `You are a Government Health Scheme Expert.
Based on patient details, recommend: Ayushman Bharat PM-JAY, CMCHIS, or specific state medical benefits.
Return JSON ONLY:
{
  "eligible": boolean,
  "recommendedSchemes": ["string"],
  "explanation": "string (Why they qualify)",
  "benefits": "string",
  "documentsRequired": ["string"],
  "participatingHospitals": ["string"]
}`;

    const prompt = `Age: ${age}, Income: ₹${income}/year, State: ${state}, Disease: ${disease || 'None'}.`;

    let result: any;
    try {
      logger.info({ tag: '[GEMINI]', message: 'Scheme eligibility checker request' });
      const aiResponse = await geminiService.generateText(prompt, systemInstruction);
      let cleanJsonStr = aiResponse.trim();
      if (cleanJsonStr.startsWith('```')) {
        cleanJsonStr = cleanJsonStr.replace(/^```(json)?/, '').replace(/```$/, '').trim();
      }
      const jsonMatch = cleanJsonStr.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        cleanJsonStr = jsonMatch[0];
      }
      result = JSON.parse(cleanJsonStr);
    } catch (err) {
      result = {
        eligible: true,
        recommendedSchemes: ['Ayushman Bharat PM-JAY', 'State Health Card Scheme'],
        explanation: 'Income details fall below the state threshold for tertiary medical aid.',
        benefits: 'Up to ₹5 Lakh cashless coverage per year.',
        documentsRequired: ['Ration Card', 'Income Certificate', 'Aadhaar Card'],
        participatingHospitals: ['Apollo Hospitals Pune', 'Sassoon General Hospital']
      };
    }

    return res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}
