import React from 'react';
import { ScrollText, ShieldAlert, Clock, Terminal } from 'lucide-react';

const AUDIT_LOGS = [
  { timestamp: '2026-08-06 12:02:14', event: 'USER_LOGIN', user: 'officer.pune@mohfw.gov.in', ip: '192.168.1.45', status: 'SUCCESS' },
  { timestamp: '2026-08-06 11:58:32', event: 'GEMINI_REPORT_GENERATE', user: 'officer.pune@mohfw.gov.in', ip: '192.168.1.45', status: 'COMPLETED' },
  { timestamp: '2026-08-06 11:54:10', event: 'MEDICINE_OCR_STRIP_SCAN', user: 'citizen.rahul@gmail.com', ip: '157.44.12.89', status: 'SUCCESS' },
  { timestamp: '2026-08-06 11:30:12', event: 'DATABASE_SEED_INITIALIZE', user: 'SYSTEM_DAEMON', ip: 'localhost', status: 'SUCCESS' },
];

export default function AdminLogsPage() {
  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between border-b border-slate-900 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-400 border border-indigo-500/20">
            <ScrollText className="w-5 h-5 glow-pill" />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight text-slate-100">Audit Logs Console</h2>
            <p className="text-xs text-slate-455 mt-0.5">Immutable audit trail of user sessions, AI computations, and OCR runs</p>
          </div>
        </div>
      </div>

      <div className="glass-panel p-6 rounded-2xl border border-slate-900 space-y-4">
        <div className="flex items-center gap-2 text-xs text-slate-500 font-mono">
          <Terminal className="w-4 h-4 text-indigo-400" />
          <span>Real-time System Audit Stream</span>
        </div>

        <div className="space-y-3.5">
          {AUDIT_LOGS.map((log, i) => (
            <div key={i} className="p-4 rounded-xl bg-slate-950/60 border border-slate-900 flex flex-col sm:flex-row sm:items-center justify-between gap-4 font-mono text-[11px] leading-relaxed">
              <div className="space-y-1">
                <div className="flex items-center gap-2.5">
                  <span className="text-slate-500 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {log.timestamp}
                  </span>
                  <span className="text-indigo-400 font-bold">{log.event}</span>
                </div>
                <p className="text-slate-400">Actor: {log.user} | IP: {log.ip}</p>
              </div>
              <span className="text-[10px] text-emerald-450 bg-emerald-500/10 px-2.5 py-0.5 rounded border border-emerald-500/20 uppercase font-bold shrink-0 self-start sm:self-center">
                {log.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
