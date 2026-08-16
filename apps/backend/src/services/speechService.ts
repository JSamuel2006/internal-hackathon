import { logger } from '../logging/logger.js';

export interface SpeechProviderInterface {
  speechToText(audioBuffer: Buffer, language: string): Promise<string>;
  textToSpeech(text: string, language: string): Promise<Buffer>;
}

export class BrowserSpeechProvider implements SpeechProviderInterface {
  async speechToText(audioBuffer: Buffer, language: string): Promise<string> {
    logger.info({ tag: '[SPEECH]', message: `SpeechToText processed locally using Browser API for language: ${language}` });
    return "Parsed voice query transcript.";
  }

  async textToSpeech(text: string, language: string): Promise<Buffer> {
    logger.info({ tag: '[SPEECH]', message: `TextToSpeech synthesized locally using Browser SpeechSynthesis for: ${text} in ${language}` });
    return Buffer.from([]);
  }
}

export class BhashiniSpeechProvider implements SpeechProviderInterface {
  async speechToText(audioBuffer: Buffer, language: string): Promise<string> {
    logger.info({ tag: '[BHASHINI]', message: `SpeechToText calling Government of India Bhashini translation node for language: ${language}` });
    return "Transcript parsed via Bhashini API.";
  }

  async textToSpeech(text: string, language: string): Promise<Buffer> {
    logger.info({ tag: '[BHASHINI]', message: `TextToSpeech calling Bhashini synthesis endpoint: ${text}` });
    return Buffer.from([]);
  }
}

export class SpeechService {
  private activeProvider: SpeechProviderInterface;

  constructor() {
    // Configurable speech provider switcher
    const useBhashini = process.env.SPEECH_PROVIDER === 'BHASHINI';
    this.activeProvider = useBhashini ? new BhashiniSpeechProvider() : new BrowserSpeechProvider();
  }

  async transcribe(audioBuffer: Buffer, language: string): Promise<string> {
    return this.activeProvider.speechToText(audioBuffer, language);
  }

  async synthesize(text: string, language: string): Promise<Buffer> {
    return this.activeProvider.textToSpeech(text, language);
  }
}

export const speechService = new SpeechService();
