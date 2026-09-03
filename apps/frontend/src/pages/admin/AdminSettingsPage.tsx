import React from 'react';
import { Settings, Save, ShieldAlert, CheckCircle2 } from 'lucide-react';

export default function AdminSettingsPage() {
  const [rateLimit, setRateLimit] = React.useState(15);
  const [saved, setSaved] = React.useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-400 border border-indigo-500/20">
            <Settings className="w-5 h-5 glow-pill" />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight text-slate-900">Console Settings</h2>
            <p className="text-xs text-slate-600 mt-0.5">Configure platform parameters, security policies, and API limits</p>
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 shadow-sm p-6 rounded-2xl border border-slate-200 max-w-2xl">
        <form onSubmit={handleSave} className="space-y-5 text-xs">
          <h3 className="font-bold text-slate-800 border-b border-slate-200 pb-2">Global API Rate Limiter</h3>

          <div>
            <label className="block text-[10px] font-mono text-slate-500 uppercase mb-2">Max requests per minute</label>
            <input
              type="number"
              value={rateLimit}
              onChange={(e) => setRateLimit(parseInt(e.target.value))}
              className="w-full px-3.5 py-2 bg-white border border-slate-200 text-xs rounded-lg text-slate-800 outline-none focus:border-indigo-500/35"
            />
            <p className="text-[10px] text-slate-500 font-mono mt-1">Limits OCR & Gemini sessions per client IP address</p>
          </div>

          {saved && (
            <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 rounded-lg flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Global parameters updated successfully.</span>
            </div>
          )}

          <button
            type="submit"
            className="px-4 py-2.5 bg-indigo-500/10 border border-indigo-500/25 hover:bg-indigo-500/20 text-indigo-400 rounded-lg font-semibold flex items-center gap-1.5 transition-colors ml-auto"
          >
            <Save className="w-4 h-4" />
            <span>Save Configuration</span>
          </button>
        </form>
      </div>
    </div>
  );
}
