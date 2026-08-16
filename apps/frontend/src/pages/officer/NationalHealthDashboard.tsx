import React, { useState, useEffect } from 'react';
import { Activity, Shield, MapPin, RefreshCw, BarChart2, Award } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function NationalHealthDashboard() {
  const [loading, setLoading] = useState(false);
  const [nationalScore, setNationalScore] = useState(84.2);

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 font-mono text-xs text-slate-300">
      <div className="flex justify-between items-center border-b border-slate-900 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-500/10 rounded-xl text-indigo-400 border border-indigo-500/20">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-100 uppercase">National Health Intelligence Platform</h2>
            <p className="text-[10px] text-slate-500">Government Ministry and administrative healthcare oversight portal</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-panel p-5 rounded-xl border border-slate-900 text-center space-y-2">
          <span className="text-[10px] text-slate-500 block uppercase">National Health Index</span>
          <strong className="text-2xl text-emerald-400 font-bold block">{nationalScore}%</strong>
          <span className="text-[9px] text-slate-500">Target score: 90% (WHO Standard)</span>
        </div>
        <div className="glass-panel p-5 rounded-xl border border-slate-900 text-center space-y-2">
          <span className="text-[10px] text-slate-500 block uppercase">Average Hospital Bed Occupancy</span>
          <strong className="text-2xl text-amber-500 font-bold block">74.2%</strong>
          <span className="text-[9px] text-slate-500">Available: 25.8%</span>
        </div>
        <div className="glass-panel p-5 rounded-xl border border-slate-900 text-center space-y-2">
          <span className="text-[10px] text-slate-500 block uppercase">Medicine Availability Rate</span>
          <strong className="text-2xl text-indigo-400 font-bold block">94.8%</strong>
          <span className="text-[9px] text-slate-500">Jan Aushadhi Stocks</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-panel p-5 rounded-xl border border-slate-900 space-y-4">
          <span className="font-bold text-slate-200 block uppercase">State Health Rankings</span>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={[
                { state: 'Kerala', score: 88 },
                { state: 'Maharashtra', score: 84 },
                { state: 'Tamil Nadu', score: 82 },
                { state: 'Karnataka', score: 79 },
                { state: 'Gujarat', score: 78 }
              ]}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="state" stroke="#64748b" fontSize={10} />
                <YAxis stroke="#64748b" fontSize={10} />
                <Tooltip contentStyle={{ backgroundColor: '#020617', borderColor: '#1e293b' }} />
                <Bar dataKey="score" fill="#4f46e5" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-panel p-5 rounded-xl border border-slate-900 space-y-4">
          <span className="font-bold text-slate-200 block uppercase">District Health Alerts</span>
          <div className="space-y-2">
            <div className="p-3 bg-slate-950 rounded border border-slate-900 flex justify-between items-center">
              <span>Haveli, Pune (Maharashtra)</span>
              <span className="px-2 py-0.5 bg-rose-500/10 text-rose-400 text-[9px] font-bold rounded uppercase">Dengue Outbreak Alert</span>
            </div>
            <div className="p-3 bg-slate-950 rounded border border-slate-900 flex justify-between items-center">
              <span>Burdwan (West Bengal)</span>
              <span className="px-2 py-0.5 bg-amber-500/10 text-amber-400 text-[9px] font-bold rounded uppercase">Heatwave Risk</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
