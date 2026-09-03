import React, { useState } from 'react';
import { Mic, Check, RotateCw, AlertTriangle, Info } from 'lucide-react';
import { voiceService } from '../../services/voiceService';
import { I18nService } from '../../i18n';

interface VoiceInputButtonProps {
  onCapture: (text: string) => void;
  langCode?: any;
}

export const VoiceInputButton: React.FC<VoiceInputButtonProps> = ({ onCapture, langCode }) => {
  const [state, setState] = useState<'IDLE' | 'LISTENING' | 'PROCESSING' | 'SUCCESS' | 'ERROR' | 'UNSUPPORTED'>('IDLE');
  const [recognitionInstance, setRecognitionInstance] = useState<any>(null);
  const [capturedText, setCapturedText] = useState('');
  
  const currentLang = langCode || I18nService.getLanguage();
  const isOnline = navigator.onLine;

  const handleStart = () => {
    if (!isOnline) {
      alert(I18nService.translate('voice_offline_warning'));
      return;
    }

    if (recognitionInstance) {
      try {
        recognitionInstance.stop();
      } catch (e) {}
    }

    const rec = voiceService.createRecognition(
      (text) => {
        setCapturedText(text);
      },
      (newState) => {
        setState(newState);
      },
      currentLang
    );

    if (rec) {
      setRecognitionInstance(rec);
      rec.start();
    } else {
      setState('UNSUPPORTED');
    }
  };

  const handleConfirm = () => {
    if (capturedText) {
      onCapture(capturedText);
      handleReset();
    }
  };

  const handleReset = () => {
    setCapturedText('');
    setState('IDLE');
    setRecognitionInstance(null);
  };

  return (
    <div className="space-y-2 mt-2">
      {state === 'IDLE' && (
        <button
          type="button"
          onClick={handleStart}
          className="flex items-center gap-2 px-4 py-2.5 bg-teal-50 hover:bg-teal-100 text-teal-700 border border-teal-200 rounded-full font-bold text-xs transition-all cursor-pointer shadow-xs"
        >
          <Mic className="w-4 h-4 text-teal-600" />
          <span>Talk to ArogyaMitra</span>
        </button>
      )}

      {state === 'LISTENING' && (
        <button
          type="button"
          onClick={() => { if (recognitionInstance) recognitionInstance.stop(); }}
          className="flex items-center gap-2 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 rounded-xl font-bold uppercase tracking-wider text-[10px] transition-all animate-pulse cursor-pointer"
        >
          <span className="w-2 h-2 bg-red-500 rounded-full animate-ping"></span>
          <span>🔴 Listening...</span>
        </button>
      )}

      {state === 'PROCESSING' && (
        <div className="flex items-center gap-2 px-4 py-2 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-xl font-bold uppercase text-[10px]">
          <span>⏳ Processing...</span>
        </div>
      )}

      {state === 'UNSUPPORTED' && (
        <div className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 text-slate-500 rounded-xl text-[10px]">
          <Info className="w-3.5 h-3.5" />
          <span>ℹ Voice input is not supported on this device.</span>
        </div>
      )}

      {state === 'ERROR' && (
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl text-[10px]">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>⚠ Could not understand speech</span>
          </div>
          <button onClick={handleStart} className="p-1.5 hover:bg-white border border-slate-200 text-slate-600 rounded-lg">
            <RotateCw className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {state === 'SUCCESS' && capturedText && (
        <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-2">
          <p className="text-slate-700 italic text-xs">"{capturedText}"</p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleConfirm}
              className="flex items-center gap-1 px-3 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-600 rounded-lg text-[9px] font-bold uppercase tracking-wider cursor-pointer"
            >
              <Check className="w-3 h-3" />
              <span>✓ Use this</span>
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="flex items-center gap-1 px-3 py-1 bg-white hover:bg-slate-900 border border-slate-200 text-slate-600 rounded-lg text-[9px] font-bold uppercase tracking-wider cursor-pointer"
            >
              <span>✎ Edit</span>
            </button>
            <button
              type="button"
              onClick={handleStart}
              className="flex items-center gap-1 px-3 py-1 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-600 rounded-lg text-[9px] font-bold uppercase tracking-wider cursor-pointer"
            >
              <Mic className="w-3 h-3" />
              <span>🔄 Speak again</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
