import React from 'react';
import { en } from './translations/en';
import { ta } from './translations/ta';
import { hi } from './translations/hi';
import { mr } from './translations/mr';

export const LanguageCode = {
  en: 'en',
  ta: 'ta',
  hi: 'hi',
  mr: 'mr',
} as const;
export type LanguageCode = keyof typeof LanguageCode;
export type TranslationKey = keyof typeof en;

export const translations: Record<LanguageCode, typeof en> = {
  en,
  ta,
  hi,
  mr
};

export class I18nService {
  private static currentLang: LanguageCode = (typeof localStorage !== 'undefined' ? localStorage.getItem('arogya_language') as LanguageCode : 'en') || 'en';
  private static listeners: Set<(lang: LanguageCode) => void> = new Set();
  
  // Accessibility states
  private static largeText: boolean = typeof localStorage !== 'undefined' ? localStorage.getItem('arogya_accessibility_largeText') === 'true' : false;
  private static voiceAssistance: boolean = typeof localStorage !== 'undefined' ? localStorage.getItem('arogya_accessibility_voice') === 'true' : false;
  private static simpleLanguage: boolean = typeof localStorage !== 'undefined' ? localStorage.getItem('arogya_accessibility_simple') === 'true' : false;

  static getLanguage(): LanguageCode {
    return this.currentLang;
  }

  static setLanguage(lang: LanguageCode) {
    if (translations[lang]) {
      this.currentLang = lang;
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('arogya_language', lang);
      }
      this.listeners.forEach(cb => cb(lang));
    }
  }

  static subscribe(callback: (lang: LanguageCode) => void): () => void {
    this.listeners.add(callback);
    return () => {
      this.listeners.delete(callback);
    };
  }

  static translate(key: TranslationKey, params?: Record<string, string>): string {
    const dict = translations[this.currentLang] || translations['en'];
    let text = dict[key] || translations['en'][key] || String(key);
    
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        text = text.replace(new RegExp(`\\{${k}\\}`, 'g'), v);
      });
    }
    return text;
  }

  // Accessibility helpers
  static getAccessibilitySettings() {
    return {
      largeText: this.largeText,
      voiceAssistance: this.voiceAssistance,
      simpleLanguage: this.simpleLanguage
    };
  }

  static updateAccessibilitySettings(settings: { largeText?: boolean; voiceAssistance?: boolean; simpleLanguage?: boolean }) {
    if (settings.largeText !== undefined) {
      this.largeText = settings.largeText;
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('arogya_accessibility_largeText', String(settings.largeText));
      }
    }
    if (settings.voiceAssistance !== undefined) {
      this.voiceAssistance = settings.voiceAssistance;
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('arogya_accessibility_voice', String(settings.voiceAssistance));
      }
    }
    if (settings.simpleLanguage !== undefined) {
      this.simpleLanguage = settings.simpleLanguage;
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('arogya_accessibility_simple', String(settings.simpleLanguage));
      }
    }
    this.listeners.forEach(cb => cb(this.currentLang));
  }
}

// Global short translator function helper
export const t = (key: TranslationKey, params?: Record<string, string>): string => {
  return I18nService.translate(key, params);
};

// React hook for component-level reactivity to language changes
export function useI18n() {
  const [lang, setLangState] = React.useState<LanguageCode>(I18nService.getLanguage());

  React.useEffect(() => {
    const unsub = I18nService.subscribe((newLang) => {
      setLangState(newLang);
    });
    return unsub;
  }, []);

  return {
    lang,
    t: (key: TranslationKey, params?: Record<string, string>) => I18nService.translate(key, params),
    setLanguage: (newLang: LanguageCode) => I18nService.setLanguage(newLang),
  };
}
