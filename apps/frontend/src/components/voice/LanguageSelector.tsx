import React, { useState, useEffect, useRef } from 'react';
import { Globe, Check, ChevronDown } from 'lucide-react';
import { I18nService, type LanguageCode } from '../../i18n';

export const LanguageSelector: React.FC = () => {
  const [currentLang, setCurrentLang] = useState<LanguageCode>(I18nService.getLanguage());
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsub = I18nService.subscribe((lang: LanguageCode) => {
      setCurrentLang(lang);
    });
    return unsub;
  }, []);

  // Handle Click Outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLangChange = (lang: LanguageCode) => {
    I18nService.setLanguage(lang);
    setOpen(false);
  };

  const languages: { code: LanguageCode; label: string; flag: string }[] = [
    { code: 'en', label: 'English', flag: '🇬🇧' },
    { code: 'ta', label: 'தமிழ்', flag: '🇮🇳' },
    { code: 'hi', label: 'हिन्दी', flag: '🇮🇳' },
    { code: 'mr', label: 'मराठी', flag: '🇮🇳' }
  ];

  const currentObj = languages.find(l => l.code === currentLang) || languages[0];

  return (
    <div className="relative print:hidden inline-block text-left" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-full text-xs font-bold text-white shadow-sm transition-all cursor-pointer"
        aria-label="Select Language"
        aria-expanded={open}
      >
        <Globe className="w-3.5 h-3.5 text-teal-400" />
        <span>{currentObj.flag} {currentObj.label}</span>
        <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Menu */}
      {open && (
        <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 p-2 space-y-1 animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono border-b border-slate-100 mb-1">
            {I18nService.translate('select_language')}
          </div>

          {languages.map((langItem) => {
            const isSelected = currentLang === langItem.code;
            return (
              <button
                key={langItem.code}
                onClick={() => handleLangChange(langItem.code)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all text-left ${
                  isSelected
                    ? 'bg-teal-50 text-teal-700 border border-teal-200/80 shadow-xs'
                    : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900 border border-transparent'
                }`}
              >
                <span className="flex items-center gap-2">
                  <span>{langItem.flag}</span>
                  <span>{langItem.label}</span>
                </span>
                {isSelected && <Check className="w-4 h-4 text-teal-600 shrink-0" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default LanguageSelector;
