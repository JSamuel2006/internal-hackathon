import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Award, ShieldCheck, HelpCircle, CheckCircle, ExternalLink, Bot, Landmark, FileText } from 'lucide-react';

const SCHEMES = [
  {
    id: 'sch-pmjay',
    name: 'Ayushman Bharat PM-JAY',
    description: 'Provides cashless treatment coverage up to ₹5 Lakh per year for eligible families at empanelled secondary and tertiary care hospitals.',
    benefits: ['₹5 Lakh annual coverage per family', 'Cashless admission and diagnostics', 'Includes pre/post-hospitalization expense coverage'],
    status: 'ACTIVE_LINKED',
    website: 'https://pmjay.gov.in'
  },
  {
    id: 'sch-cmchis',
    name: 'Chief Minister Comprehensive Health Insurance Scheme (CMCHIS)',
    description: 'Financial assistance for patients living below the poverty line who are suffering from major life-threatening diseases.',
    benefits: ['One-time financial grant for super-specialty treatment', 'Direct transfer to government hospital account'],
    status: 'ELIGIBLE_APPLY_NOW',
    website: 'https://cmchistn.com'
  },
  {
    id: 'sch-ran',
    name: 'Rashtriya Arogya Nidhi (RAN)',
    description: 'Provides free rapid diagnostic tests (RDTs), insecticide-treated bed nets, and first-line anti-malarial therapies at local sub-centres.',
    benefits: ['Free testing & treatments at PHC', 'Complimentary LLIN distribution'],
    status: 'AVAILABLE_AT_PHC',
    website: 'https://mohfw.gov.in'
  },
];

export default function CitizenSchemesPage() {
  const navigate = useNavigate();

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-rose-500/10 rounded-lg text-rose-455 border border-rose-500/20">
          <Award className="w-5 h-5 glow-pill" />
        </div>
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-100">National Healthcare Schemes</h2>
          <p className="text-xs text-slate-455 mt-0.5">Explore coverage benefits and verify eligibility through your ABHA Link</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {SCHEMES.map((sch) => (
          <div key={sch.id} className="glass-panel p-6 rounded-2xl border border-slate-900 flex flex-col justify-between min-h-[360px]">
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-slate-200 text-sm">{sch.name}</h3>
                {sch.status === 'ACTIVE_LINKED' ? (
                  <span className="text-[9px] font-mono bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/20 flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" />
                    LINKED TO ABHA
                  </span>
                ) : (
                  <span className="text-[9px] font-mono bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded border border-indigo-500/20">
                    VERIFIED ELIGIBLE
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 leading-relaxed mb-4">{sch.description}</p>
              <div className="space-y-1.5 mb-4">
                <span className="text-[10px] font-mono text-slate-550 uppercase">Key Coverage Benefits</span>
                <ul className="text-xs text-slate-400 space-y-1 pl-1">
                  {sch.benefits.map((b, i) => (
                    <li key={i} className="flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Enhanced Interactive Action Panel */}
            <div className="grid grid-cols-2 gap-2 border-t border-slate-900 pt-4">
              <button
                onClick={() => navigate(`/citizen/schemes/${sch.id}`)}
                className="py-2 bg-slate-900 hover:bg-slate-850 border border-slate-800 text-[10px] font-bold text-slate-202 rounded-lg flex items-center justify-center gap-1 transition-all"
              >
                <Landmark className="w-3 h-3" />
                <span>View details</span>
              </button>
              <button
                onClick={() => navigate(`/citizen/hospitals`)}
                className="py-2 bg-slate-900 hover:bg-slate-850 border border-slate-800 text-[10px] font-bold text-slate-202 rounded-lg flex items-center justify-center gap-1 transition-all"
              >
                <HelpCircle className="w-3 h-3" />
                <span>Empanelled clinics</span>
              </button>
              <button
                onClick={() => navigate(`/citizen/schemes/${sch.id}`)}
                className="py-2 bg-slate-900 hover:bg-slate-850 border border-slate-800 text-[10px] font-bold text-slate-202 rounded-lg flex items-center justify-center gap-1 transition-all"
              >
                <FileText className="w-3 h-3" />
                <span>check Documents</span>
              </button>
              <button
                onClick={() => navigate(`/citizen/schemes/${sch.id}`)}
                className="py-2 bg-slate-900 hover:bg-slate-850 border border-slate-800 text-[10px] font-bold text-slate-202 rounded-lg flex items-center justify-center gap-1 transition-all"
              >
                <CheckCircle className="w-3 h-3" />
                <span>Check Eligibility</span>
              </button>
              <button
                onClick={() => navigate(`/citizen/assistant`)}
                className="py-2 bg-slate-900 hover:bg-slate-850 border border-slate-800 text-[10px] font-bold text-slate-202 rounded-lg flex items-center justify-center gap-1 transition-all col-span-2"
              >
                <Bot className="w-3.5 h-3.5 text-rose-400" />
                <span>Ask ArogyaMitra About This Scheme</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
