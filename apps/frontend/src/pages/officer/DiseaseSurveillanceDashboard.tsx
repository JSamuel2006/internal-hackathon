import React, { useState } from 'react';
import { Activity, ShieldAlert, AlertTriangle } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function DiseaseSurveillanceDashboard() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 font-mono text-xs text-slate-700">
      <div className="flex justify-between items-center border-b border-slate-200 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-rose-500/10 rounded-xl text-rose-455 border border-rose-500/20">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900 uppercase">National Disease Surveillance</h2>
            <p className="text-[10px] text-slate-500">AI Cluster Outbreak Prediction GIS Heatmaps</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white border border-slate-200 shadow-sm p-5 rounded-xl border border-slate-200 space-y-4">
          <span className="font-bold text-slate-800 block uppercase">Outbreak Projection Trend (Next 30 Days)</span>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={[
                { date: 'Week 1', cases: 120 },
                { date: 'Week 2', cases: 240 },
                { date: 'Week 3', cases: 410 },
                { date: 'Week 4', cases: 680 }
              ]}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="date" stroke="#64748b" fontSize={10} />
                <YAxis stroke="#64748b" fontSize={10} />
                <Tooltip contentStyle={{ backgroundColor: '#020617', borderColor: '#1e293b' }} />
                <Area type="monotone" dataKey="cases" stroke="#ef4444" fill="rgba(239,68,68,0.1)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white border border-slate-200 shadow-sm p-5 rounded-xl border border-slate-200 space-y-4">
          <span className="font-bold text-slate-800 block uppercase">Active Hotspots</span>
          <div className="space-y-3">
            <div className="p-3 bg-white rounded border border-rose-500/20">
              <span className="text-rose-400 font-bold block">Pune Haveli Outbreak</span>
              <p className="text-[10px] text-slate-500 mt-0.5">Vector count elevated by 24%. Risk index: HIGH.</p>
            </div>
            <div className="p-3 bg-white rounded border border-slate-200">
              <span className="text-amber-500 font-bold block">Kolkata Dengue Cluster</span>
              <p className="text-[10px] text-slate-500 mt-0.5">Localized reports of high fever spikes in Ward 4.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
