import React from 'react';
import { ShieldAlert, Activity, ClipboardList } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function AshaDashboard() {
  const highRiskPatients = [
    { id: 1, name: 'Sunita Patil', village: 'Haveli', condition: 'Gestational Diabetes', risk: 'Very High Risk' },
    { id: 2, name: 'Ramesh Shinde', village: 'Khed', condition: 'CKD Stage 3', risk: 'High Risk' }
  ];

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4 font-mono text-xs text-slate-350">
      <div className="border-b border-slate-900 pb-4">
        <h2 className="text-xl font-bold text-slate-100 uppercase tracking-wider">ASHA / Anganwadi Portal</h2>
        <p className="text-[10px] text-slate-500 mt-1">Village healthcare surveys, immunization tracking, and high-risk case oversight</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-5 glass-panel p-6 rounded-2xl border border-slate-900 space-y-4">
          <span className="font-bold text-slate-205 uppercase block">High-Risk Patients Registry</span>
          <div className="space-y-2">
            {highRiskPatients.map((p) => (
              <div key={p.id} className="p-3 bg-slate-950 rounded border border-slate-900 flex justify-between items-center">
                <div>
                  <span className="font-bold text-slate-202 block">{p.name}</span>
                  <span className="text-[10px] text-slate-500">{p.village} | {p.condition}</span>
                </div>
                <span className="px-2 py-0.5 bg-rose-500/10 text-rose-450 text-[9px] font-bold rounded uppercase">{p.risk}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-7 glass-panel p-6 rounded-2xl border border-slate-900 space-y-4">
          <span className="font-bold text-slate-205 uppercase block">Immunization Coverage Index</span>
          <div className="h-44">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={[
                { name: 'Haveli', coverage: 94 },
                { name: 'Khed', coverage: 88 },
                { name: 'Shirur', coverage: 91 }
              ]}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="name" stroke="#64748b" fontSize={10} />
                <YAxis stroke="#64748b" fontSize={10} />
                <Tooltip contentStyle={{ backgroundColor: '#020617', borderColor: '#1e293b' }} />
                <Bar dataKey="coverage" fill="#4f46e5" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
export { ShieldAlert, Activity, ClipboardList };
