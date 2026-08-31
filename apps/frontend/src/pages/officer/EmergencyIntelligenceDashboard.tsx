import React from 'react';
import { AlertCircle, Clock, MapPin } from 'lucide-react';

export default function EmergencyIntelligenceDashboard() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 font-mono text-xs text-slate-700">
      <div className="flex justify-between items-center border-b border-slate-200 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-rose-500/10 rounded-xl text-rose-455 border border-rose-500/20">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900 uppercase">Emergency Healthcare Intelligence</h2>
            <p className="text-[10px] text-slate-500">Live ambulance tracking, emergency room capacity, and active hazard alerts</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white border border-slate-200 shadow-sm p-5 rounded-xl border border-slate-200 space-y-2">
          <span className="text-[10px] text-slate-500 block uppercase">Nearest General Hospital</span>
          <strong className="text-slate-202 text-sm block">Sassoon General Hospital Pune</strong>
          <span className="text-[9px] text-emerald-400">Distance: 1.4 KM | Route: Traffic Clear</span>
        </div>
        <div className="bg-white border border-slate-200 shadow-sm p-5 rounded-xl border border-slate-200 space-y-2">
          <span className="text-[10px] text-slate-500 block uppercase">Ambulance ETA</span>
          <strong className="text-xl text-emerald-450 font-bold block">8 Minutes</strong>
          <span className="text-[9px] text-slate-500">Assigned: Unit MH-12-EQ-80</span>
        </div>
        <div className="bg-white border border-slate-200 shadow-sm p-5 rounded-xl border border-slate-200 space-y-2">
          <span className="text-[10px] text-slate-500 block uppercase">ICU Availability</span>
          <strong className="text-xl text-amber-500 font-bold block">12 Beds Open</strong>
          <span className="text-[9px] text-slate-500">Triage Status: High Activity</span>
        </div>
      </div>
    </div>
  );
}
