import { Request, Response, NextFunction } from 'express';
import { geminiService } from '../services/ai-services/geminiService.js';
import { logger } from '../logging/logger.js';

export async function runSymptomAssessment(req: Request, res: Response, next: NextFunction) {
  try {
    const { symptoms, history } = req.body;

    const systemInstruction = `You are an expert AI Triage Assistant.
Analyze symptoms, assess clinical risks (Low | Medium | High | Emergency), and outline next actions.
Return JSON ONLY:
{
  "riskLevel": "Low | Medium | High | Emergency",
  "explanation": "string (Why this risk score)",
  "recommendedAction": "Home Care | Clinic Visit | Hospital Visit | Immediate Emergency Care",
  "recommendedSpecialist": "string",
  "confidenceScore": number,
  "followUpQuestions": ["string"]
}`;

    const prompt = `Symptoms: ${symptoms}. Previous history: ${history || 'None'}.`;

    let result: any;
    try {
      logger.info({ tag: '[TRIAGE]', message: 'Symptom assessment triggered', symptoms });
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
        riskLevel: 'Medium',
        explanation: 'Non-emergency symptom checkup.',
        recommendedAction: 'Clinic Visit',
        recommendedSpecialist: 'General Physician',
        confidenceScore: 90,
        followUpQuestions: ['Have you recorded a temperature reading?']
      };
    }

    return res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}
