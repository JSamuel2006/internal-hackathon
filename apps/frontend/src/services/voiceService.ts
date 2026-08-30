import { I18nService } from '../i18n';
export type VoiceLanguageCode = 'en' | 'ta' | 'hi' | 'mr' | string;

export const voiceService = {
  getLocaleCode(lang: VoiceLanguageCode): string {
    const localeMap: Record<string, string> = {
      en: 'en-IN',
      ta: 'ta-IN',
      hi: 'hi-IN',
      mr: 'mr-IN'
    };
    return localeMap[lang] || 'en-IN';
  },

  isSpeechSupported(): boolean {
    return ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window);
  },

  createRecognition(
    onResult: (text: string) => void,
    onStateChange: (state: 'IDLE' | 'LISTENING' | 'PROCESSING' | 'SUCCESS' | 'ERROR' | 'UNSUPPORTED') => void,
    langCode: VoiceLanguageCode = I18nService.getLanguage()
  ): any {
    if (!this.isSpeechSupported()) {
      onStateChange('UNSUPPORTED');
      return null;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = this.getLocaleCode(langCode);

    recognition.onstart = () => {
      onStateChange('LISTENING');
    };

    recognition.onerror = (event: any) => {
      console.error('[SPEECH_RECOGNITION_ERROR]', event.error);
      onStateChange('ERROR');
    };

    recognition.onend = () => {
      // Handled via onresult state transition or fallback
    };

    recognition.onresult = (event: any) => {
      onStateChange('PROCESSING');
      if (event.results && event.results[0] && event.results[0][0]) {
        const transcript = event.results[0][0].transcript;
        onResult(transcript);
        onStateChange('SUCCESS');
      } else {
        onStateChange('ERROR');
      }
    };

    return recognition;
  }
};
