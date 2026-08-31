import React from 'react';
import { History, ShieldCheck, FileText, Search, Activity } from 'lucide-react';

const HISTORICAL_ENTRIES = [
  {
    id: 'ent-1',
    date: 'August 04, 2026',
    title: 'Fever & Joint Pain Consultation',
    provider: 'ArogyaMitra AI Advisor',
    details: 'Symptoms triage indicated mild Dengue risk based on local spikes in Pune district. Recommended NS1 antigen test and paracetamol.',
    type: 'AI_CONSULT',
  },
  {
    id: 'ent-2',
    date: 'July 28, 2026',
    title: 'Paracetamol 500mg Strip Scan',
    provider: 'Smart OCR Scanner',
    details: 'Scanned strip package: Paracetamol 500mg formulation. Extracted manufacturer specs, children safety guidelines, and liver warnings.',
    type: 'SCAN',
  },
  {
    id: 'ent-3',
    date: 'June 12, 2026',
    title: 'CBC & Platelet Count Lab Sync',
    provider: 'Pune District Hospital (via ABHA)',
    details: 'Platelet count: 210,000/μL. Hemoglobin: 14.2 g/dL. All parameters within standard physiological range.',
    type: 'ABHA_SYNC',
  },
];

export default function CitizenHistoryPage() {
  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-rose-500/10 rounded-lg text-rose-455 border border-rose-500/20">
            <History className="w-5 h-5 glow-pill" />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight text-slate-900">Medical History Timeline</h2>
            <p className="text-xs text-slate-455 mt-0.5">Historical consultations, prescriptions scans, and synced lab reports</p>
          </div>
        </div>
        <div className="flex items-center gap-2 border-l border-slate-200 pl-4">
          <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
          <span className="text-[10px] font-mono text-emerald-450 uppercase">ABHA Synchronized</span>
        </div>
      </div>

      <div className="space-y-4">
        {HISTORICAL_ENTRIES.map((entry) => (
          <div key={entry.id} className="bg-white border border-slate-200 shadow-sm p-5 rounded-2xl border border-slate-200 flex flex-col md:flex-row md:items-start justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-mono text-slate-500">{entry.date}</span>
                <span className={`text-[9px] font-mono px-2 py-0.5 rounded border ${
                  entry.type === 'AI_CONSULT'
                    ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                    : entry.type === 'SCAN'
                    ? 'bg-teal-500/10 text-teal-400 border-teal-500/20'
                    : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
                }`}>
                  {entry.type}
                </span>
              </div>
              <h3 className="text-sm font-bold text-slate-800">{entry.title}</h3>
              <p className="text-xs text-slate-500 leading-relaxed">{entry.details}</p>
            </div>
            <div className="text-[10px] font-mono text-slate-500 border-t md:border-t-0 md:border-l border-slate-200 pt-2.5 md:pt-0 md:pl-4 min-w-[150px]">
              <span className="block uppercase text-[9px] text-slate-550 mb-0.5">Facility/Provider</span>
              <span className="text-slate-350 font-semibold">{entry.provider}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
