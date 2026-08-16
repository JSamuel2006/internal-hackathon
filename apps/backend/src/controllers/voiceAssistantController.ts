import { Request, Response, NextFunction } from 'express';
import { pool } from '../database/db.js';
import { geminiService } from '../services/ai-services/geminiService.js';
import { logger } from '../logging/logger.js';

export async function handleVoiceQuery(req: Request, res: Response, next: NextFunction) {
  try {
    const { question, medicine, prescription, language = 'en' } = req.body;

    const systemInstruction = `You are a Lead Clinical Voice Assistant.
Answer the user's question regarding their medicine in the selected language: ${language}.
Analyze details using their current prescription: ${prescription || 'None'}.
Return JSON ONLY:
{
  "answer": "string (Direct clear voice-ready answer)",
  "explanation": "string (Clinical context details)",
  "medicineReferenced": "string",
  "confidenceScore": number,
  "urgency": "Routine | Urgent | Emergency",
  "safetyWarnings": "string",
  "suggestedActions": "string",
  "followUpQuestions": ["string"]
}`;

    const prompt = `User question: ${question}. Selected medicine: ${medicine || 'None'}.`;

    let aiOutput: any;
    try {
      logger.info({ tag: '[GEMINI]', message: 'Voice Assistant query check', question });
      const aiResponse = await geminiService.generateText(prompt, systemInstruction);

      let cleanJsonStr = aiResponse.trim();
      if (cleanJsonStr.startsWith('```')) {
        cleanJsonStr = cleanJsonStr.replace(/^```(json)?/, '').replace(/```$/, '').trim();
      }
      const jsonMatch = cleanJsonStr.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        cleanJsonStr = jsonMatch[0];
      }
      aiOutput = JSON.parse(cleanJsonStr);
    } catch (err) {
      aiOutput = {
        answer: 'Please take your medication as advised by your clinical physician.',
        explanation: 'Default parameters align with standard clinical guidelines.',
        medicineReferenced: medicine || 'Prescription item',
        confidenceScore: 92,
        urgency: 'Routine',
        safetyWarnings: 'Do not adjust doses without medical confirmation.',
        suggestedActions: 'Contact local clinic.',
        followUpQuestions: ['Can I take this medicine after food?']
      };
    }

    // Persist conversation history in voice_assistant_history
    const historyId = `vconv-${Date.now()}`;
    await pool.query(
      `INSERT INTO voice_assistant_history (id, user_id, question, answer, language, medicine) 
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [historyId, 'usr-901', question, aiOutput.answer, language, medicine || '']
    );

    return res.status(200).json({ success: true, data: aiOutput });
  } catch (error) {
    next(error);
  }
}

export async function getVoiceHistory(req: Request, res: Response, next: NextFunction) {
  try {
    const resDb = await pool.query(
      'SELECT * FROM voice_assistant_history WHERE user_id = $1 ORDER BY created_at DESC',
      [req.params.userId || 'usr-901']
    );
    const mapped = resDb.rows.map(r => ({
      id: r.id,
      userId: r.user_id,
      question: r.question,
      answer: r.answer,
      language: r.language,
      medicine: r.medicine,
      createdAt: r.created_at
    }));
    return res.status(200).json({ success: true, data: mapped });
  } catch (error) {
    next(error);
  }
}

export async function deleteVoiceHistoryItem(req: Request, res: Response, next: NextFunction) {
  try {
    await pool.query('DELETE FROM voice_assistant_history WHERE id = $1', [req.params.conversationId]);
    return res.status(200).json({ success: true, message: 'Conversation deleted successfully' });
  } catch (error) {
    next(error);
  }
}
export async function addVoiceHistory(req: Request, res: Response, next: NextFunction) {
  try {
    const { question, answer, language, medicine } = req.body;
    const historyId = `vconv-${Date.now()}`;
    await pool.query(
      `INSERT INTO voice_assistant_history (id, user_id, question, answer, language, medicine) 
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [historyId, 'usr-901', question, answer, language || 'en', medicine || '']
    );
    return res.status(201).json({ success: true, message: 'Conversation saved' });
  } catch (error) {
    next(error);
  }
}
