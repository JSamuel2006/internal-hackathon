import { Request, Response, NextFunction } from 'express';
import { conversationRepository } from '../repositories/conversationRepository.js';
import { buildAIResponse } from '../services/ai-services/medicalKnowledgeBase.js';
import { bhashiniService } from '../services/ai-services/bhashiniService.js';
import { piiRedactor } from '../services/ai-services/piiRedactor.js';
import { geminiService } from '../services/ai-services/geminiService.js';
import { patientContextService } from '../services/patientContextService.js';
import { pool } from '../database/db.js';

function normalizeLanguageCode(lang: string): string {
  if (!lang) return 'en';
  const clean = String(lang).toLowerCase().trim();
  if (clean.startsWith('ta')) return 'ta';
  if (clean.startsWith('hi')) return 'hi';
  if (clean.startsWith('mr')) return 'mr';
  if (clean.startsWith('te')) return 'te';
  if (clean.startsWith('bn')) return 'bn';
  if (clean.startsWith('en')) return 'en';
  return clean.split('-')[0] || 'en';
}

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

    // 3. Normalize language code and determine target language name
    const rawLang = typeof language === 'object' ? (language as any).code : language;
    const langCode = normalizeLanguageCode(rawLang);
    
    const langNames: Record<string, string> = {
      ta: 'Tamil',
      hi: 'Hindi',
      mr: 'Marathi',
      te: 'Telugu',
      bn: 'Bengali',
      en: 'English'
    };
    const langName = langNames[langCode] || 'English';

    // Update session language in DB if changed
    if (session.language !== langCode) {
      await pool.query('UPDATE assistant_sessions SET language = $1, updated_at = NOW() WHERE id = $2', [langCode, session.id]);
      session.language = langCode;
    }

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

    // 6. Build the custom context-aware system prompt explicitly specifying output language
    const systemPrompt = `You are ArogyaMitra AI, a compassionate clinical decision support system.
CRITICAL LANGUAGE MANDATE: You MUST write your entire response in ${langName} (${langCode}).
Selected Response Language: ${langName} (${langCode})

Patient Context:
${JSON.stringify(patientContext, null, 2)}

Rules:
1. ALWAYS write your answer in ${langName}. Never answer in English unless English is explicitly requested.
2. Translate all headings, explanations, preventive steps, precautions, and disclaimers into fluent ${langName}.
3. Keep medicine names, laboratory test names (e.g. HbA1c, CBC, ECG), drug names (e.g. Paracetamol, Amoxicillin), hospital names, and numeric lab values in standard medical English terms.
4. If allergy or digital twin warnings apply, highlight them clearly in ${langName}.
5. Remind the user that this guidance is AI-generated and not a confirmed medical diagnosis.`;

    let responseText: string;
    let aiCategory = 'GENERAL';
    let aiSources = ['ICMR National Guidelines', 'Patient Context Profile'];
    let isEmergency = false;
    let confidence = 0.95;
    let usedGemini = false;

    try {
      // Send user query directly to Gemini with target language instruction
      responseText = await geminiService.generateText(sanitizedContent, systemPrompt);
      usedGemini = true;

      // Force-translate if Gemini returned English for non-English target language
      if (langCode !== 'en' && langCode !== 'en-US') {
        responseText = await bhashiniService.translateText(responseText, 'en', langCode);
      }

      // Detect emergency keywords for escalation flag
      const emergencyKeywords = ['call 108', 'emergency', 'immediately', 'urgent', 'hospital', 'ஆபத்து', 'அவசரம்', 'आपातकाल'];
      isEmergency = emergencyKeywords.some(k => responseText.toLowerCase().includes(k));
    } catch (geminiError) {
      // Fallback: Generate structured response and translate to target language
      const fallbackResponse = buildAIResponse(sanitizedContent);
      const englishText = formatResponseText(fallbackResponse, 'en');
      responseText = await bhashiniService.translateText(englishText, 'en', langCode);
      isEmergency = fallbackResponse.isEmergency;
    }

    // Localize disclaimer for non-English outputs
    const disclaimers: Record<string, string> = {
      ta: 'இந்த வழிகாட்டல் AI-ஆல் உருவாக்கப்பட்டது, இது உறுதிப்படுத்தப்பட்ட மருத்துவ அறிக்கை அல்ல.',
      hi: 'यह मार्गदर्शन AI द्वारा उत्पन्न किया गया है और यह कोई नैदानिक चिकित्सा पुष्टि नहीं है।',
      mr: 'हे मार्गदर्शन AI द्वारे तयार केले गेले आहे आणि हे निश्चित वैद्यकीय निदान नाही.',
      en: 'This guidance is AI-generated and is not a confirmed medical diagnosis.'
    };
    const localizedDisclaimer = disclaimers[langCode] || disclaimers.en;

    // 8. Store assistant message
    const assistantMessage = await conversationRepository.addMessage(session.id, {
      role: 'assistant',
      content: responseText,
      language: langCode,
      category: aiCategory as any,
      isFavorite: false,
      sources: aiSources,
      confidence,
      isEmergency,
      disclaimer: localizedDisclaimer,
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

// Helper: Format AI response as readable markdown text with localized headings
function formatResponseText(
  resp: import('../services/ai-services/medicalKnowledgeBase.js').StructuredAIResponse,
  langCode: string = 'en'
): string {
  const headings: Record<string, any> = {
    ta: {
      immediate: 'உடனடி நடவடிக்கைகள்:',
      preventive: '🛡️ தடுப்பு நடவடிக்கைகள்',
      precautions: '⚠️ பரிந்துரைக்கப்பட்ட முன்னெச்சரிக்கைகள்',
      govt: '🏛️ அரசாங்க வளங்கள்',
      nextAction: '✅ அடுத்த பரிந்துரைக்கப்பட்ட நடவடிக்கை',
      confidence: 'நம்பகத்தன்மை',
      sources: 'ஆதாரங்கள்'
    },
    hi: {
      immediate: 'तत्काल कार्रवाई:',
      preventive: '🛡️ निवारक उपाय',
      precautions: '⚠️ अनुशंसित सावधानियां',
      govt: '🏛️ सरकारी संसाधन',
      nextAction: '✅ अगली अनुशंसित कार्रवाई',
      confidence: 'विश्वसनीयता',
      sources: 'स्रोत'
    },
    mr: {
      immediate: 'तात्काळ कृती:',
      preventive: '🛡️ प्रतिबंधात्मक उपाय',
      precautions: '⚠️ शिफारस केलेल्या खबरदारी',
      govt: '🏛️ शासकीय संसाधने',
      nextAction: '✅ पुढील शिफारस केलेली कृती',
      confidence: 'विश्वासार्हता',
      sources: 'स्त्रोत'
    },
    en: {
      immediate: 'Immediate Actions:',
      preventive: '🛡️ Preventive Measures',
      precautions: '⚠️ Recommended Precautions',
      govt: '🏛️ Government Resources',
      nextAction: '✅ Next Recommended Action',
      confidence: 'Confidence',
      sources: 'Sources'
    }
  };

  const h = headings[langCode] || headings.en;

  if (resp.isEmergency && resp.emergencyMessage) {
    return `## 🚨 ${resp.summary}\n\n${resp.detailedExplanation}\n\n### ${h.immediate}\n${resp.recommendedPrecautions.map((p) => `- ${p}`).join('\n')}\n\n---\n*${resp.disclaimer}*`;
  }

  const parts: string[] = [
    `## ${resp.summary}`,
    `\n${resp.detailedExplanation}`,
  ];

  if (resp.preventiveMeasures.length > 0) {
    parts.push(`\n### ${h.preventive}\n${resp.preventiveMeasures.map((p) => `- ${p}`).join('\n')}`);
  }

  if (resp.recommendedPrecautions.length > 0) {
    parts.push(`\n### ${h.precautions}\n${resp.recommendedPrecautions.map((p) => `- ${p}`).join('\n')}`);
  }

  if (resp.govtResources.length > 0) {
    parts.push(`\n### ${h.govt}\n${resp.govtResources.map((r) => `- ${r}`).join('\n')}`);
  }

  parts.push(`\n### ${h.nextAction}\n${resp.nextRecommendedAction}`);
  parts.push(`\n---\n*${h.confidence}: ${Math.round(resp.confidence * 100)}% | ${h.sources}: ${resp.sources.slice(0, 2).join(', ')}*`);
  parts.push(`\n> ⚕️ **${resp.disclaimer}**`);

  return parts.join('\n');
}
