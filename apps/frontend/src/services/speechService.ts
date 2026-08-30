export type SpeechLanguageCode = 'en' | 'ta' | 'hi' | 'mr' | string;

export const speechService = {
  isSynthesisSupported(): boolean {
    return ('speechSynthesis' in window);
  },

  getLocaleCode(lang: SpeechLanguageCode): string {
    const localeMap: Record<string, string> = {
      en: 'en-IN',
      ta: 'ta-IN',
      hi: 'hi-IN',
      mr: 'mr-IN'
    };
    return localeMap[lang] || 'en-IN';
  },

  speak(text: string, lang: SpeechLanguageCode, onError?: (msg: string) => void) {
    if (!this.isSynthesisSupported()) {
      if (onError) onError('Voice playback is not available on this device.');
      return;
    }

    try {
      window.speechSynthesis.cancel();
      // Remove markdown text formatting characters for cleaner audio
      const cleanText = text.replace(/[#*`_]/g, '');
      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.lang = this.getLocaleCode(lang);
      
      utterance.onerror = (e) => {
        console.warn('[SPEECH_SYNTHESIS_WARNING]', e.error);
        if (onError) onError('Voice playback is not available on this device.');
      };

      window.speechSynthesis.speak(utterance);
    } catch (err: any) {
      console.error(err);
      if (onError) onError('Voice playback is not available on this device.');
    }
  }
};
