import React from 'react';
import { AlertTriangle, ShieldCheck, Info } from 'lucide-react';

export default function CitizenAlertCenter() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 font-mono text-xs text-slate-300">
      <div className="flex justify-between items-center border-b border-slate-900 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-500/10 rounded-xl text-indigo-400 border border-indigo-500/20">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-100 uppercase">Citizen Public Health Alerts</h2>
            <p className="text-[10px] text-slate-500">Government notices, epidemic alerts, vaccination drives, and medicine recalls</p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-455 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          <div>
            <strong className="block font-bold text-slate-205">⚠️ epidemic Outbreak Alert: Pune Haveli</strong>
            <p className="text-slate-400 mt-1 leading-normal">
              A vector density spike has been identified. Citizens are advised to verify that all stagnant domestic water sources are covered. Consult a doctor immediately if fever, retro-orbital pain, or joint rash develops.
            </p>
          </div>
        </div>

        <div className="p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-indigo-450 flex items-start gap-3">
          <Info className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
          <div>
            <strong className="block font-bold text-slate-205">📢 National Influenza Vaccination Drive</strong>
            <p className="text-slate-400 mt-1 leading-normal">
              State wellness centers are distributing primary booster shots. Book your slot through the Citizen Portal or visit nearest government health sub-centers.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
