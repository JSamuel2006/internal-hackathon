import { Request, Response, NextFunction } from 'express';
import { conversationRepository } from '../repositories/conversationRepository.js';
import { buildAIResponse } from '../services/ai-services/medicalKnowledgeBase.js';
import { bhashiniService } from '../services/ai-services/bhashiniService.js';
import { piiRedactor } from '../services/ai-services/piiRedactor.js';
import { geminiService } from '../services/ai-services/geminiService.js';
import { patientContextService } from '../services/patientContextService.js';

// POST /api/v1/assistant/sessions — Create a new conversation session
export async function createSession(req: Request, res: Response, next: NextFunction) {
  try {
    const { userId = 'usr-901', language = 'en' } = req.body;
    const session = await conversationRepository.createSession(userId, language);
    return res.status(201).json({ success: true, data: { session } });
  } catch (error) {
    next(error);
  }
}

// GET /api/v1/assistant/sessions — Get all sessions for a user
export async function getSessions(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = (req.query.userId as string) || 'usr-901';
    const sessions = await conversationRepository.getSessionsByUser(userId);
    return res.status(200).json({ success: true, data: { sessions } });
  } catch (error) {
    next(error);
  }
}

// GET /api/v1/assistant/sessions/:id — Get a specific session with messages
export async function getSession(req: Request, res: Response, next: NextFunction) {
  try {
    const session = await conversationRepository.getSession(req.params.id);
    if (!session) {
      return res.status(404).json({ success: false, message: 'Session not found' });
    }
    return res.status(200).json({ success: true, data: { session } });
  } catch (error) {
    next(error);
  }
}

// DELETE /api/v1/assistant/sessions/:id — Delete a session
export async function deleteSession(req: Request, res: Response, next: NextFunction) {
  try {
    const deleted = await conversationRepository.deleteSession(req.params.id);
    return res.status(200).json({ success: true, data: { deleted } });
  } catch (error) {
    next(error);
  }
}

// POST /api/v1/assistant/sessions/:id/messages — Send a message and get AI response
export async function sendMessage(req: Request, res: Response, next: NextFunction) {
  try {
    const { sessionId } = req.params;
    const { content, language = 'en', userId = 'usr-901' } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ success: false, message: 'Message content is required.' });
    }

    // 1. Validate session exists — create if not
    let session = await conversationRepository.getSession(sessionId);
    if (!session) {
      session = await conversationRepository.createSession(userId, language);
    }

    // 2. Sanitize PII from user input
    const sanitizedContent = piiRedactor.stripPII(content.trim());

    // 3. Translate to English if needed for knowledge lookup
    const langCode = typeof language === 'object' ? (language as any).code : language;
    const langName = typeof language === 'object' ? (language as any).name : 'English';

    const englishQuery =
      langCode !== 'en' && langCode !== 'en-US'
        ? await bhashiniService.translateText(sanitizedContent, langCode, 'en')
        : sanitizedContent;

    // 4. Store user message
    const userMessage = await conversationRepository.addMessage(session.id, {
      role: 'user',
      content: sanitizedContent,
      language: langCode,
      category: 'GENERAL',
      isFavorite: false,
    });

    // 5. Gather Patient Context
    const patientContext = await patientContextService.getContextForUser(userId);

    // 6. Build the custom context-aware system prompt
    const systemPrompt = `You are ArogyaMitra AI.
Use ONLY the patient's medical history provided below.
Use ONLY the selected language.
Selected Language: ${langName}
Language Code: ${langCode}

Patient Context:
${JSON.stringify(patientContext, null, 2)}

Rules:
Never answer in English unless English is selected.
Translate headings, bullet points, warnings, medicine instructions, recovery advice, and lifestyle guidance.
Keep medicine names, laboratory names, medical terminology, and drug names in English.
Never invent medical history.
Never hallucinate diseases.
If allergy information exists, always consider it.
If Digital Twin risk exists, consider it.
If laboratory abnormalities exist, explain them.
If kidney or liver function is abnormal, warn before recommending medicines.
Never prescribe medicines.
Never discontinue medicines.
Always remind the user that this is AI guidance and not a confirmed medical diagnosis.
Escalate emergency symptoms immediately.`;

    let responseText: string;
    let aiCategory = 'GENERAL';
    let aiSources = ['ICMR National Guidelines', 'Patient Context Profile'];
    let isEmergency = false;
    let confidence = 0.95;
    let usedGemini = false;

    try {
      responseText = await geminiService.generateText(englishQuery, systemPrompt);
      usedGemini = true;

      // Detect emergency keywords in Gemini response for escalation flag
      const emergencyKeywords = ['call 108', 'emergency', 'immediately', 'urgent', 'hospital'];
      isEmergency = emergencyKeywords.some(k => responseText.toLowerCase().includes(k));
    } catch (geminiError) {
      // Fallback
      const fallbackResponse = buildAIResponse(englishQuery);
      responseText = formatResponseText(fallbackResponse);
      isEmergency = fallbackResponse.isEmergency;
    }

    // 7. Translate response back if needed
    const localizedResponse =
      langCode !== 'en' && langCode !== 'en-US'
        ? await bhashiniService.translateText(responseText, 'en', langCode)
        : responseText;

    // 8. Store assistant message
    const assistantMessage = await conversationRepository.addMessage(session.id, {
      role: 'assistant',
      content: localizedResponse,
      language: langCode,
      category: aiCategory as any,
      isFavorite: false,
      sources: aiSources,
      confidence,
      isEmergency,
      disclaimer: 'This guidance is AI-generated and is not a confirmed medical diagnosis.',
    });

    return res.status(200).json({
      success: true,
      data: {
        userMessage,
        assistantMessage,
        sessionId: session.id,
        meta: { poweredBy: usedGemini ? geminiService.getActiveModel() : 'icmr-knowledge-base', isEmergency },
      },
    });
  } catch (error) {
    next(error);
  }
}

// POST /api/v1/assistant/sessions/:sessionId/messages/:messageId/favorite — Toggle favorite
export async function toggleFavorite(req: Request, res: Response, next: NextFunction) {
  try {
    const { sessionId, messageId } = req.params;
    const isFavorite = await conversationRepository.toggleFavorite(sessionId, messageId);
    return res.status(200).json({ success: true, data: { isFavorite } });
  } catch (error) {
    next(error);
  }
}

// POST /api/v1/assistant/sessions/:sessionId/messages/:messageId/feedback — Submit feedback
export async function submitFeedback(req: Request, res: Response, next: NextFunction) {
  try {
    const { sessionId, messageId } = req.params;
    const { feedback } = req.body;
    await conversationRepository.submitFeedback(sessionId, messageId, feedback);
    return res.status(200).json({ success: true, data: { message: 'Feedback recorded. Thank you.' } });
  } catch (error) {
    next(error);
  }
}

export async function renameSession(req: Request, res: Response, next: NextFunction) {
  try {
    const { title } = req.body;
    await conversationRepository.renameSession(req.params.id, title);
    return res.status(200).json({ success: true, message: 'Session renamed successfully' });
  } catch (error) {
    next(error);
  }
}

// Helper: Format AI response as readable markdown text
function formatResponseText(resp: import('../services/ai-services/medicalKnowledgeBase.js').StructuredAIResponse): string {
  if (resp.isEmergency && resp.emergencyMessage) {
    return `## 🚨 ${resp.summary}\n\n${resp.detailedExplanation}\n\n### Immediate Actions:\n${resp.recommendedPrecautions.map((p) => `- ${p}`).join('\n')}\n\n---\n*${resp.disclaimer}*`;
  }

  const parts: string[] = [
    `## ${resp.summary}`,
    `\n${resp.detailedExplanation}`,
  ];

  if (resp.preventiveMeasures.length > 0) {
    parts.push(`\n### 🛡️ Preventive Measures\n${resp.preventiveMeasures.map((p) => `- ${p}`).join('\n')}`);
  }

  if (resp.recommendedPrecautions.length > 0) {
    parts.push(`\n### ⚠️ Recommended Precautions\n${resp.recommendedPrecautions.map((p) => `- ${p}`).join('\n')}`);
  }

  if (resp.govtResources.length > 0) {
    parts.push(`\n### 🏛️ Government Resources\n${resp.govtResources.map((r) => `- ${r}`).join('\n')}`);
  }

  parts.push(`\n### ✅ Next Recommended Action\n${resp.nextRecommendedAction}`);
  parts.push(`\n---\n*Confidence: ${Math.round(resp.confidence * 100)}% | Sources: ${resp.sources.slice(0, 2).join(', ')}*`);
  parts.push(`\n> ⚕️ **${resp.disclaimer}**`);

  return parts.join('\n');
}
