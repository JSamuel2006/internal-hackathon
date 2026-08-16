import React, { useState } from 'react';
import { AlertCircle, Calendar, MessageSquare, Bell } from 'lucide-react';

export default function NotificationCenter() {
  const [alerts, setAlerts] = useState<any[]>([
    { id: 1, title: 'Medicine Recall Alert', message: 'Batch 42-A of generic Amoxicillin recalled due to formulation checkups.', type: 'EMERGENCY', time: '10 Mins Ago' },
    { id: 2, title: 'Upcoming Vaccination Due', message: 'Tetanus Toxoid booster TT-2 due next week.', type: 'REMINDER', time: '2 Hours Ago' }
  ]);

  return (
    <div className="space-y-8 max-w-4xl mx-auto px-4 font-mono text-xs text-slate-355">
      <div className="border-b border-slate-900 pb-4">
        <h2 className="text-xl font-bold text-slate-100 uppercase tracking-wider">Enterprise Notification Center</h2>
        <p className="text-[10px] text-slate-500 mt-1">Real-time alerts, critical recalls, and clinical timeline reminders</p>
      </div>

      <div className="space-y-4">
        {alerts.map((a) => (
          <div
            key={a.id}
            className={`p-4 rounded-xl border flex items-start gap-3 transition-colors ${
              a.type === 'EMERGENCY'
                ? 'bg-rose-500/10 border-rose-500/20 text-rose-455'
                : 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400'
            }`}
          >
            <Bell className="w-5 h-5 shrink-0 mt-0.5" />
            <div>
              <strong className="block font-bold text-slate-205">{a.title}</strong>
              <p className="text-slate-400 mt-1 leading-normal">{a.message}</p>
              <span className="text-[9px] text-slate-500 block mt-2">{a.time}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
export { AlertCircle, Calendar, MessageSquare, Bell };
