import { GoogleGenerativeAI } from '@google/generative-ai';
import { env } from '../../configuration/environment.js';
import winston from 'winston';

// Logger definition
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console()
  ]
});

// Model fallback chain — tries each in order until one succeeds
const MODEL_FALLBACK_CHAIN = [
  'gemini-3.6-flash',
  'gemini-3.5-flash',
  'gemini-2.0-flash',
  'gemini-2.0-flash-lite',
  'gemini-2.0-flash-001',
];

export class GeminiService {
  private genAI: GoogleGenerativeAI | null = null;
  private activeModel: string = MODEL_FALLBACK_CHAIN[0];

  constructor() {
    this.initialize();
  }

  private initialize() {
    try {
      if (!env.GEMINI_API_KEY) {
        throw new Error('GEMINI_API_KEY is not defined in environment variables.');
      }
      this.genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);
      logger.info({ message: 'Google Gemini SDK initialized successfully', model: this.activeModel });
    } catch (error: any) {
      logger.error({ message: 'Google Gemini SDK initialization failed', error: error.message });
      this.genAI = null;
    }
  }

  /**
   * Attempts generateContent with model fallback chain.
   * If a model hits quota (429) or is unavailable (404/503), it automatically
   * tries the next model in the chain.
   */
  private async tryGenerateWithFallback(
    prompt: string,
    systemInstruction?: string,
    timeoutMs: number = 20000
  ): Promise<{ text: string; model: string }> {
    if (!this.genAI) throw new Error('Google Gemini API client is unavailable.');

    let lastError: Error = new Error('All models exhausted.');

    for (const modelName of MODEL_FALLBACK_CHAIN) {
      try {
        const model = this.genAI.getGenerativeModel({
          model: modelName,
          systemInstruction: systemInstruction,
        });

        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error(`Gemini API call timed out after ${timeoutMs}ms`)), timeoutMs)
        );

        const result = await Promise.race([
          model.generateContent({
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
          }),
          timeoutPromise,
        ]);

        if (!result || !result.response) {
          throw new Error('Received an empty or invalid response from Gemini API.');
        }

        const text = result.response.text();
        if (!text) throw new Error('Gemini returned an empty text block.');

        // Update activeModel to the one that worked
        this.activeModel = modelName;

        logger.info({
          message: 'Gemini request succeeded',
          model: modelName,
          promptLength: prompt.length,
          responseLength: text.length,
        });

        return { text, model: modelName };
      } catch (err: any) {
        const msg = err.message || '';
        const isRetryable =
          msg.includes('429') ||
          msg.includes('quota') ||
          msg.includes('ResourceExhausted') ||
          msg.includes('503') ||
          msg.includes('unavailable') ||
          msg.includes('Overloaded') ||
          msg.includes('NOT_FOUND') ||
          msg.includes('not found') ||
          msg.includes('no longer available');

        logger.warn({ message: `Model ${modelName} failed, trying next`, reason: msg.substring(0, 120) });

        if (isRetryable) {
          lastError = err;
          continue; // try next model
        }

        // Non-retryable errors (auth failure, bad prompt) — throw immediately
        throw err;
      }
    }

    throw lastError;
  }

  /**
   * Generates text content using Gemini API with automatic model fallback,
   * timing, logging, and error handling.
   * @param prompt The input prompt string
   * @param systemInstruction Optional context/system guidelines for the model
   */
  public async generateText(prompt: string, systemInstruction?: string, timeoutMs: number = 20000): Promise<string> {
    if (!prompt || prompt.trim() === '') {
      throw new Error('Prompt cannot be empty.');
    }

    if (!this.genAI) {
      logger.warn({ message: 'Gemini service not initialized. Attempting re-initialization...' });
      this.initialize();
      if (!this.genAI) {
        throw new Error('Google Gemini API client is unavailable.');
      }
    }

    const start = performance.now();
    try {
      const { text, model } = await this.tryGenerateWithFallback(prompt, systemInstruction, timeoutMs);
      const duration = Math.round(performance.now() - start);

      logger.info({
        message: 'generateText completed',
        model,
        durationMs: duration,
      });

      return text;
    } catch (error: any) {
      const duration = Math.round(performance.now() - start);
      const errorMessage = error.message || '';

      logger.error({
        message: 'All Gemini models failed',
        durationMs: duration,
        error: errorMessage,
        prompt: prompt.substring(0, 100) + '...',
      });

      // User-friendly error mappings
      if (errorMessage.includes('API key not valid') || errorMessage.includes('API_KEY_INVALID')) {
        throw new Error('Authentication failure: The provided GEMINI_API_KEY is invalid.');
      }
      if (errorMessage.includes('429') || errorMessage.includes('quota') || errorMessage.includes('ResourceExhausted')) {
        throw new Error('Rate limit exceeded: All Gemini models quota exhausted. The fallback knowledge base will be used.');
      }
      if (errorMessage.includes('timed out')) {
        throw new Error('Network timeout: Gemini API failed to respond within 20 seconds.');
      }

      throw new Error(`AI generation error: ${errorMessage || 'Unknown error'}`);
    }
  }

  /**
   * Generates text content with media attachments (e.g. image or PDF) using Gemini API with fallback.
   */
  public async generateFromMedia(
    prompt: string,
    mimeType: string,
    fileBuffer: Buffer,
    systemInstruction?: string,
    timeoutMs: number = 35000
  ): Promise<string> {
    if (!prompt || prompt.trim() === '') {
      throw new Error('Prompt cannot be empty.');
    }

    if (!this.genAI) {
      this.initialize();
      if (!this.genAI) {
        throw new Error('Google Gemini API client is unavailable.');
      }
    }

    const start = performance.now();
    try {
      let lastError: Error = new Error('All models exhausted.');
      const base64Data = fileBuffer.toString('base64');

      for (const modelName of MODEL_FALLBACK_CHAIN) {
        try {
          const model = this.genAI.getGenerativeModel({
            model: modelName,
            systemInstruction: systemInstruction,
          });

          const timeoutPromise = new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error(`Gemini API call timed out after ${timeoutMs}ms`)), timeoutMs)
          );

          const result = await Promise.race([
            model.generateContent({
              contents: [
                {
                  role: 'user',
                  parts: [
                    { text: prompt },
                    {
                      inlineData: {
                        data: base64Data,
                        mimeType: mimeType
                      }
                    }
                  ]
                }
              ],
            }),
            timeoutPromise,
          ]);

          if (!result || !result.response) {
            throw new Error('Received an empty or invalid response from Gemini API.');
          }

          const text = result.response.text();
          if (!text) throw new Error('Gemini returned an empty text block.');

          this.activeModel = modelName;
          logger.info({
            message: 'Gemini media request succeeded',
            model: modelName,
            mimeType,
            responseLength: text.length,
          });

          const duration = Math.round(performance.now() - start);
          logger.info({
            message: 'generateFromMedia completed',
            model: modelName,
            durationMs: duration,
          });

          return text;
        } catch (err: any) {
          logger.warn({ message: `Model ${modelName} failed on media request, trying next`, reason: err.message });
          lastError = err;
        }
      }
      throw lastError;
    } catch (error: any) {
      logger.error({
        message: 'All Gemini models failed on media request',
        error: error.message,
      });
      throw new Error(`AI report analysis error: ${error.message || 'Unknown error'}`);
    }
  }

  /** Returns the currently active (working) model name */
  public getActiveModel(): string {
    return this.activeModel;
  }
}

export const geminiService = new GeminiService();
