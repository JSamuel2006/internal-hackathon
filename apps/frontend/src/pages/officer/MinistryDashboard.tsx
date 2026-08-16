import React from 'react';
import { Award, BarChart2, Activity } from 'lucide-react';

export default function MinistryDashboard() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 font-mono text-xs text-slate-300">
      <div className="flex justify-between items-center border-b border-slate-900 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-500/10 rounded-xl text-indigo-400 border border-indigo-500/20">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-100 uppercase">Ministry Health Administration oversight</h2>
            <p className="text-[10px] text-slate-500">National healthcare quality metrics, ABHA registry, and demographic health indices</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-panel p-5 rounded-xl border border-slate-900 text-center space-y-1">
          <span className="text-[10px] text-slate-500 block uppercase">ABHA Linked Citizens</span>
          <strong className="text-2xl text-emerald-400 font-bold block">42,00,892</strong>
          <span className="text-[9px] text-slate-500">Registry increase: +12% MoM</span>
        </div>
        <div className="glass-panel p-5 rounded-xl border border-slate-900 text-center space-y-1">
          <span className="text-[10px] text-slate-500 block uppercase">National Disease Burden</span>
          <strong className="text-2xl text-amber-500 font-bold block">0.24 DALYs/capita</strong>
          <span className="text-[9px] text-slate-500">Target: 0.18 (SDG Indicator)</span>
        </div>
        <div className="glass-panel p-5 rounded-xl border border-slate-900 text-center space-y-1">
          <span className="text-[10px] text-slate-500 block uppercase">Vaccination Coverage</span>
          <strong className="text-2xl text-indigo-400 font-bold block">98.2%</strong>
          <span className="text-[9px] text-slate-500">Under Mission Indradhanush</span>
        </div>
      </div>
    </div>
  );
}
