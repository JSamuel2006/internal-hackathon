import React from 'react';
import { Warehouse, Clock, Activity } from 'lucide-react';

export default function HospitalIntelligenceDashboard() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 font-mono text-xs text-slate-700">
      <div className="flex justify-between items-center border-b border-slate-200 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-500/10 rounded-xl text-indigo-400 border border-indigo-500/20">
            <Warehouse className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900 uppercase">Hospital Occupancy & Bed Intelligence</h2>
            <p className="text-[10px] text-slate-500">Live bed occupancy, ICU availability, and triage queues</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-center">
        <div className="bg-white border border-slate-200 shadow-sm p-4 rounded-xl border border-slate-200">
          <span className="text-[10px] text-slate-500 block uppercase">Total General Beds</span>
          <strong className="text-xl text-slate-900 font-bold block mt-1">1,240 / 1,500</strong>
        </div>
        <div className="bg-white border border-slate-200 shadow-sm p-4 rounded-xl border border-slate-200">
          <span className="text-[10px] text-slate-500 block uppercase">ICU Availability</span>
          <strong className="text-xl text-emerald-400 font-bold block mt-1">42 Beds Open</strong>
        </div>
        <div className="bg-white border border-slate-200 shadow-sm p-4 rounded-xl border border-slate-200">
          <span className="text-[10px] text-slate-500 block uppercase">Avg Waiting Time</span>
          <strong className="text-xl text-amber-500 font-bold block mt-1">18 Minutes</strong>
        </div>
        <div className="bg-white border border-slate-200 shadow-sm p-4 rounded-xl border border-slate-200">
          <span className="text-[10px] text-slate-500 block uppercase">Emergency Volume</span>
          <strong className="text-xl text-rose-455 font-bold block mt-1">Moderate</strong>
        </div>
      </div>

      <div className="bg-white border border-slate-200 shadow-sm p-5 rounded-xl border border-slate-200 space-y-4">
        <span className="font-bold text-slate-800 block uppercase">Regional Bed Allocation Matrix</span>
        <div className="space-y-2">
          <div className="p-3 bg-white rounded border border-slate-200 flex justify-between items-center">
            <span>Sassoon General Hospital Pune</span>
            <span className="text-emerald-450 font-bold">12 ICU Open</span>
          </div>
          <div className="p-3 bg-white rounded border border-slate-200 flex justify-between items-center">
            <span>Deenanath Mangeshkar Hospital</span>
            <span className="text-rose-455 font-bold">0 ICU Open</span>
          </div>
        </div>
      </div>
    </div>
  );
}
