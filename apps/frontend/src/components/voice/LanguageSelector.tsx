import React, { useState, useEffect } from 'react';
import { Globe, Accessibility } from 'lucide-react';
import { I18nService, type LanguageCode } from '../../i18n';

export const LanguageSelector: React.FC = () => {
  const [currentLang, setCurrentLang] = useState<LanguageCode>(I18nService.getLanguage());
  const [accessSettings, setAccessSettings] = useState(I18nService.getAccessibilitySettings());
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const unsub = I18nService.subscribe((lang: LanguageCode) => {
      setCurrentLang(lang);
      setAccessSettings(I18nService.getAccessibilitySettings());
    });
    return unsub;
  }, []);

  const handleLangChange = (lang: LanguageCode) => {
    I18nService.setLanguage(lang);
  };

  const handleAccessToggle = (key: 'largeText' | 'voiceAssistance' | 'simpleLanguage') => {
    const nextVal = !accessSettings[key];
    I18nService.updateAccessibilitySettings({ [key]: nextVal });
  };

  const languages: { code: LanguageCode; label: string }[] = [
    { code: 'en', label: 'English' },
    { code: 'ta', label: 'தமிழ்' },
    { code: 'hi', label: 'हिन्दी' },
    { code: 'mr', label: 'मराठी' }
  ];

  return (
    <div className="relative print:hidden">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-2 bg-slate-900/60 hover:bg-slate-900 border border-slate-800 rounded-xl text-xs font-semibold text-slate-300 transition-all cursor-pointer"
      >
        <Globe className="w-4 h-4 text-slate-400" />
        <span>🌐 {languages.find(l => l.code === currentLang)?.label || 'Language'}</span>
      </button>

      {open && (
        <div className="absolute left-0 bottom-full mb-2 w-64 bg-slate-950 border border-slate-850 rounded-2xl p-4 shadow-xl z-50 space-y-4">
          {/* Language Preference */}
          <div className="space-y-1.5">
            <span className="text-[10px] font-mono tracking-wider text-slate-500 uppercase block font-bold">
              {I18nService.translate('select_language')}
            </span>
            <div className="grid grid-cols-2 gap-2">
              {languages.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => handleLangChange(lang.code)}
                  className={`px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                    currentLang === lang.code
                      ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                      : 'bg-slate-900/50 hover:bg-slate-900 text-slate-400 border border-transparent'
                  }`}
                >
                  {lang.label}
                </button>
              ))}
            </div>
          </div>

          {/* Accessibility Settings */}
          <div className="border-t border-slate-900 pt-3 space-y-2">
            <span className="text-[10px] font-mono tracking-wider text-slate-500 uppercase block font-bold flex items-center gap-1.5">
              <Accessibility className="w-3.5 h-3.5 text-slate-400" />
              {I18nService.translate('accessibility_mode')}
            </span>
            <div className="space-y-2 text-xs">
              <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                <input
                  type="checkbox"
                  checked={accessSettings.largeText}
                  onChange={() => handleAccessToggle('largeText')}
                  className="rounded border-slate-800 bg-slate-900 text-rose-500 focus:ring-0 w-4 h-4"
                />
                <span>{I18nService.translate('large_text')}</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                <input
                  type="checkbox"
                  checked={accessSettings.voiceAssistance}
                  onChange={() => handleAccessToggle('voiceAssistance')}
                  className="rounded border-slate-800 bg-slate-900 text-rose-500 focus:ring-0 w-4 h-4"
                />
                <span>{I18nService.translate('voice_assistance')}</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                <input
                  type="checkbox"
                  checked={accessSettings.simpleLanguage}
                  onChange={() => handleAccessToggle('simpleLanguage')}
                  className="rounded border-slate-800 bg-slate-900 text-rose-500 focus:ring-0 w-4 h-4"
                />
                <span>{I18nService.translate('simple_language')}</span>
              </label>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default LanguageSelector;
