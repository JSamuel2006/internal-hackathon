import React from 'react';
import { Activity, Award, TrendingUp } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function HealthAnalyticsDashboard() {
  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4 font-mono text-xs text-slate-350">
      <div className="flex justify-between items-center border-b border-slate-200 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-rose-500/10 rounded-xl text-rose-455 border border-rose-500/20">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900 uppercase">Personalized Health Analytics</h2>
            <p className="text-[10px] text-slate-500">Biomarker tracking, digital twin forecast models, and clinical wellness trends</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
        <div className="bg-white border border-slate-200 shadow-sm p-5 rounded-xl border border-slate-200">
          <span className="text-[10px] text-slate-500 block uppercase">Overall Health Score</span>
          <strong className="text-2xl text-emerald-400 font-bold block mt-1">85%</strong>
        </div>
        <div className="bg-white border border-slate-200 shadow-sm p-5 rounded-xl border border-slate-200">
          <span className="text-[10px] text-slate-500 block uppercase">HbA1c Level</span>
          <strong className="text-2xl text-amber-500 font-bold block mt-1">6.2%</strong>
        </div>
        <div className="bg-white border border-slate-200 shadow-sm p-5 rounded-xl border border-slate-200">
          <span className="text-[10px] text-slate-500 block uppercase">Medicine Adherence</span>
          <strong className="text-2xl text-indigo-400 font-bold block mt-1">94%</strong>
        </div>
      </div>

      <div className="bg-white border border-slate-200 shadow-sm p-6 rounded-2xl border border-slate-200 space-y-4">
        <span className="font-bold text-slate-205 uppercase block">HbA1c Level Trend (Last 6 Months)</span>
        <div className="h-52">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={[
              { month: 'Jan', level: 6.8 },
              { month: 'Feb', level: 6.6 },
              { month: 'Mar', level: 6.5 },
              { month: 'Apr', level: 6.3 },
              { month: 'May', level: 6.2 }
            ]}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="month" stroke="#64748b" fontSize={10} />
              <YAxis stroke="#64748b" fontSize={10} />
              <Tooltip contentStyle={{ backgroundColor: '#020617', borderColor: '#1e293b' }} />
              <Area type="monotone" dataKey="level" stroke="#10b981" fill="rgba(16,185,129,0.1)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
export { Activity, Award, TrendingUp };
