import React from 'react';
import { Activity, ShieldCheck, Server, Database, BrainCircuit, AlertCircle, BarChart } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function AdminMonitoringPage() {
  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between border-b border-slate-900 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-400 border border-indigo-500/20">
            <Activity className="w-5 h-5 glow-pill" />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight text-slate-100">Infrastructure Monitoring</h2>
            <p className="text-xs text-slate-455 mt-0.5">Real-time health status of databases, APIs, and AI nodes</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Server & DB health */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-900 space-y-4">
          <h3 className="text-xs font-mono font-bold tracking-wider text-slate-500 uppercase border-b border-slate-900 pb-2">Core Services</h3>
          <div className="space-y-3.5 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-slate-350 flex items-center gap-2">
                <Server className="w-4 h-4 text-indigo-400" />
                Express Web Server (Node.js)
              </span>
              <span className="text-[10px] font-mono text-emerald-450 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                UP (99.98% Uptime)
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-slate-350 flex items-center gap-2">
                <Database className="w-4 h-4 text-teal-400" />
                MongoDB Health Status
              </span>
              <span className="text-[10px] font-mono text-emerald-450 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                CONNECTED (12ms latency)
              </span>
            </div>
          </div>
        </div>

        {/* AI & OCR pipelines */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-900 space-y-4">
          <h3 className="text-xs font-mono font-bold tracking-wider text-slate-500 uppercase border-b border-slate-900 pb-2">AI Micro-Services</h3>
          <div className="space-y-3.5 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-slate-350 flex items-center gap-2">
                <BrainCircuit className="w-4 h-4 text-rose-455" />
                Gemini LLM API Endpoint
              </span>
              <span className="text-[10px] font-mono text-emerald-450 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                OPERATIONAL (0.8s avg response)
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-slate-350 flex items-center gap-2">
                <Activity className="w-4 h-4 text-teal-400" />
                Tesseract OCR Engine
              </span>
              <span className="text-[10px] font-mono text-emerald-450 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                READY (Traineddata loaded)
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* LIS/PMS National Analytics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-mono text-xs">
        <div className="glass-panel p-6 rounded-2xl border border-slate-900 space-y-4">
          <h3 className="text-xs font-bold tracking-wider text-slate-200 uppercase border-b border-slate-900 pb-2">
            National drug Utilization trends (Daily)
          </h3>
          <div className="h-44">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={[
                { name: 'Mon', count: 1200 },
                { name: 'Tue', count: 1450 },
                { name: 'Wed', count: 1600 },
                { name: 'Thu', count: 1350 },
                { name: 'Fri', count: 1900 }
              ]}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="name" stroke="#64748b" fontSize={10} />
                <YAxis stroke="#64748b" fontSize={10} />
                <Tooltip contentStyle={{ backgroundColor: '#020617', borderColor: '#1e293b' }} />
                <Area type="monotone" dataKey="count" stroke="#10b981" fill="rgba(16,185,129,0.1)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-panel p-6 rounded-2xl border border-slate-900 space-y-4">
          <h3 className="text-xs font-bold tracking-wider text-slate-200 uppercase border-b border-slate-900 pb-2">
            Regional Medicine Supply Forecasts
          </h3>
          <div className="h-44">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={[
                { name: 'Zone A', stock: 4500 },
                { name: 'Zone B', stock: 6100 },
                { name: 'Zone C', stock: 3200 },
                { name: 'Zone D', stock: 8500 }
              ]}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="name" stroke="#64748b" fontSize={10} />
                <YAxis stroke="#64748b" fontSize={10} />
                <Tooltip contentStyle={{ backgroundColor: '#020617', borderColor: '#1e293b' }} />
                <Area type="monotone" dataKey="stock" stroke="#6366f1" fill="rgba(99,102,241,0.1)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
