import React, { useState } from 'react';
import { Volume2, PlayCircle, EyeOff, Info } from 'lucide-react';
import { speechService } from '../../services/speechService';
import { I18nService } from '../../i18n';

interface TextToSpeechButtonProps {
  text: string;
  langCode?: any;
}

export const TextToSpeechButton: React.FC<TextToSpeechButtonProps> = ({ text, langCode }) => {
  const [errorMsg, setErrorMsg] = useState('');
  const currentLang = langCode || I18nService.getLanguage();

  const handleSpeak = () => {
    setErrorMsg('');
    speechService.speak(
      text,
      currentLang,
      (err) => {
        setErrorMsg(I18nService.translate('voice_playback_unavailable'));
        setTimeout(() => setErrorMsg(''), 4000);
      }
    );
  };

  return (
    <div className="inline-flex flex-col gap-1 print:hidden">
      <button
        type="button"
        onClick={handleSpeak}
        className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:text-rose-400 rounded-lg text-slate-600 transition-colors text-[10px] uppercase font-mono font-bold cursor-pointer"
        title="Speak this content"
      >
        <Volume2 className="w-3.5 h-3.5" />
        <span>🔊 Listen</span>
      </button>
      {errorMsg && (
        <span className="text-[9px] text-rose-600 font-mono animate-pulse block">
          ⚠ {errorMsg}
        </span>
      )}
    </div>
  );
};
