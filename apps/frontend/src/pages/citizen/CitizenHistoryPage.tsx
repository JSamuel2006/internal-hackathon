import React from 'react';
import { History, ShieldCheck, FileText, Search, Activity } from 'lucide-react';
import { useI18n } from '../../i18n';

export default function CitizenHistoryPage() {
  const { lang, t } = useI18n();

  const HISTORICAL_ENTRIES = [
    {
      id: 'ent-1',
      date: 'August 04, 2026',
      title: t('fever_joint_pain_consultation'),
      provider: 'ArogyaMitra AI Advisor',
      details: t('fever_joint_details'),
      type: 'AI_CONSULT',
      typeLabel: t('ai_consult')
    },
    {
      id: 'ent-2',
      date: 'July 28, 2026',
      title: t('paracetamol_500mg_strip_scan'),
      provider: 'Smart OCR Scanner',
      details: t('paracetamol_scan_details'),
      type: 'SCAN',
      typeLabel: t('scan')
    },
    {
      id: 'ent-3',
      date: 'June 12, 2026',
      title: t('cbc_platelet_count_lab_sync'),
      provider: 'Pune District Hospital (via ABHA)',
      details: t('cbc_lab_sync_details'),
      type: 'ABHA_SYNC',
      typeLabel: t('abha_sync')
    },
  ];

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-rose-500/10 rounded-lg text-rose-455 border border-rose-500/20">
            <History className="w-5 h-5 glow-pill" />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight text-slate-900">{t('medical_history_timeline')}</h2>
            <p className="text-xs text-slate-455 mt-0.5">{t('historical_consultations_prescriptions_scans')}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 border-l border-slate-200 pl-4">
          <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
          <span className="text-[10px] font-mono text-emerald-450 uppercase">{t('abha_synchronized')}</span>
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
                  {entry.typeLabel}
                </span>
              </div>
              <h3 className="text-sm font-bold text-slate-800">{entry.title}</h3>
              <p className="text-xs text-slate-500 leading-relaxed">{entry.details}</p>
            </div>
            <div className="text-[10px] font-mono text-slate-500 border-t md:border-t-0 md:border-l border-slate-200 pt-2.5 md:pt-0 md:pl-4 min-w-[150px]">
              <span className="block uppercase text-[9px] text-slate-550 mb-0.5">{t('facility_provider')}</span>
              <span className="text-slate-350 font-semibold">{entry.provider}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
