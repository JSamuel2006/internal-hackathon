import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Bot, ScanLine, History, Award, HeartPulse, 
  Thermometer, User, Compass, Calendar, ArrowUpRight, Clock, Pill, Brain, FileText, ChevronRight
} from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { api } from '../../services/api';

const mockHealthData = [
  { day: 'Mon', bpm: 72, temp: 98.4 },
  { day: 'Tue', bpm: 75, temp: 98.6 },
  { day: 'Wed', bpm: 82, temp: 99.1 },
  { day: 'Thu', bpm: 68, temp: 98.0 },
  { day: 'Fri', bpm: 70, temp: 98.2 },
  { day: 'Sat', bpm: 74, temp: 98.5 },
  { day: 'Sun', bpm: 72, temp: 98.4 },
];

export default function CitizenDashboard() {
  const userRaw = sessionStorage.getItem('user');
  const user = userRaw ? JSON.parse(userRaw) : { name: 'Rahul Verma', abhaId: 'ABHA-91-8842-1029-4410' };
  
  const [recentActivities, setRecentActivities] = useState<any[]>([]);
  const [loadingActivities, setLoadingActivities] = useState(true);

  useEffect(() => {
    const fetchRecent = async () => {
      try {
        const response = await api.get('/health/timeline', {
          params: { page: 1, limit: 3 }
        });
        if (response.data?.success) {
          setRecentActivities(response.data.data || []);
        }
      } catch (err) {
        console.error('Failed to load dashboard activities', err);
      } finally {
        setLoadingActivities(false);
      }
    };
    fetchRecent();
  }, []);

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Top Banner with Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-panel p-6 rounded-2xl border border-slate-900 flex items-center justify-between col-span-1 md:col-span-2">
          <div className="space-y-2">
            <h2 className="text-xl md:text-2xl font-bold tracking-tight text-slate-100">
              Welcome back, {user.name}
            </h2>
            <p className="text-xs text-slate-400 max-w-md">
              Need medical guidance? Consult ArogyaMitra, your localized AI assistant, or scan a medicine strip using your phone's camera.
            </p>
            <div className="flex gap-3 pt-2">
              <Link
                to="/citizen/assistant"
                className="px-4 py-2 rounded-lg text-xs font-semibold bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 flex items-center gap-1.5 transition-all"
              >
                <Bot className="w-3.5 h-3.5" />
                <span>Talk to AI</span>
              </Link>
              <Link
                to="/citizen/scanner"
                className="px-4 py-2 rounded-lg text-xs font-semibold bg-slate-900 hover:bg-slate-850 text-slate-200 border border-slate-800 flex items-center gap-1.5 transition-all"
              >
                <ScanLine className="w-3.5 h-3.5" />
                <span>Scan Medicine</span>
              </Link>
            </div>
          </div>
          <div className="hidden sm:block p-4 bg-rose-500/10 rounded-2xl text-rose-455">
            <HeartPulse className="w-12 h-12 glow-pill" />
          </div>
        </div>

        {/* Vital stats card */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-900 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono tracking-wider text-slate-450 uppercase">Vitals Telemetry</span>
            <span className="text-[9px] bg-emerald-500/10 text-emerald-450 px-2 py-0.5 rounded font-mono">LIVE</span>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 bg-slate-900/50 rounded-xl border border-slate-850">
              <div className="flex items-center gap-2 text-rose-400 mb-1">
                <HeartPulse className="w-4 h-4" />
                <span className="text-[10px] text-slate-450 uppercase font-mono">Pulse</span>
              </div>
              <p className="text-xl font-bold font-mono">72 <span className="text-xs font-normal text-slate-500">BPM</span></p>
            </div>
            <div className="p-3 bg-slate-900/50 rounded-xl border border-slate-850">
              <div className="flex items-center gap-2 text-cyan-400 mb-1">
                <Thermometer className="w-4 h-4" />
                <span className="text-[10px] text-slate-450 uppercase font-mono">Temp</span>
              </div>
              <p className="text-xl font-bold font-mono">98.4 <span className="text-xs font-normal text-slate-500">°F</span></p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Recharts Vitals Trend & ABHA Details */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Recharts Vital Trend */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-900 col-span-1 md:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-205">Weekly Health telemetry</h3>
            <span className="text-xs text-slate-400">Heart Rate & Temperature</span>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={mockHealthData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorBpm" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                <XAxis dataKey="day" stroke="#6b7280" fontSize={11} tickLine={false} />
                <YAxis stroke="#6b7280" fontSize={11} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #374151', borderRadius: '8px' }}
                  labelStyle={{ color: '#9ca3af' }}
                />
                <Area type="monotone" dataKey="bpm" stroke="#f43f5e" fillOpacity={1} fill="url(#colorBpm)" name="Heart Rate (BPM)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* ABHA card & Immunizations */}
        <div className="space-y-6">
          {/* Detailed ABHA */}
          <div className="glass-panel p-6 rounded-2xl border border-slate-900 bg-gradient-to-br from-slate-900 to-slate-950 flex flex-col justify-between h-48 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/5 rounded-full blur-2xl"></div>
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[9px] font-mono tracking-widest text-slate-400 block uppercase">National Digital Health Mission</span>
                <span className="text-xs font-bold text-rose-400 mt-1 block">ABHA Health Locker ID</span>
              </div>
              <Compass className="w-5 h-5 text-rose-400" />
            </div>
            <div>
              <p className="text-lg font-bold tracking-wide text-slate-100">{user.name}</p>
              <p className="text-xs font-mono text-slate-400 mt-0.5">{user.abhaId}</p>
            </div>
            <div className="flex items-center justify-between border-t border-slate-800 pt-3">
              <span className="text-[10px] text-slate-500 font-mono">STATUS: VERIFIED</span>
              <span className="text-[9px] text-emerald-450 bg-emerald-500/10 px-2 py-0.5 rounded font-mono flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                ACTIVE
              </span>
            </div>
          </div>

          {/* Immunization reminder */}
          <div className="glass-panel p-6 rounded-2xl border border-slate-900 space-y-4">
            <h4 className="text-xs font-mono tracking-wider text-slate-400 uppercase font-bold">Upcoming Immunizations</h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-lg bg-slate-900/60 border border-slate-850">
                <div>
                  <p className="text-xs font-semibold text-slate-200">Tdap (Tetanus Booster)</p>
                  <p className="text-[10px] text-slate-500 font-mono mt-0.5">Primary health centre, Pune</p>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-rose-455 font-mono">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Aug 24</span>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Activity Widget */}
          <div className="glass-panel p-6 rounded-2xl border border-slate-900 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-900 pb-2">
              <h4 className="text-xs font-mono tracking-wider text-slate-400 uppercase font-bold">Recent Activity</h4>
              <Link to="/citizen/timeline" className="text-[10px] text-rose-455 hover:underline flex items-center gap-0.5 font-semibold font-mono">
                View Full Timeline →
              </Link>
            </div>
            <div className="space-y-3">
              {loadingActivities ? (
                <div className="space-y-2">
                  <div className="h-10 bg-slate-900 rounded-xl animate-pulse"></div>
                  <div className="h-10 bg-slate-900 rounded-xl animate-pulse"></div>
                </div>
              ) : recentActivities.length === 0 ? (
                <p className="text-[11px] text-slate-500 text-center py-2">No recent activities found.</p>
              ) : (
                recentActivities.map((act) => {
                  let Icon = FileText;
                  if (act.type === 'MEDICINE_SCAN') Icon = Pill;
                  else if (act.type === 'DISEASE_PREDICTION') Icon = Brain;
                  else if (act.type === 'APPOINTMENT') Icon = Calendar;
                  else if (act.type === 'USER_PROFILE' || act.type === 'HEALTH_SIMULATION') Icon = HeartPulse;

                  return (
                    <div key={act.id} className="flex items-center justify-between p-2.5 rounded-lg bg-slate-900/40 border border-slate-850">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="p-1.5 bg-slate-950 rounded-lg border border-slate-850 shrink-0">
                          <Icon className="w-3.5 h-3.5 text-slate-350" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-slate-200 truncate">{act.title}</p>
                          <p className="text-[9px] text-slate-500 font-mono mt-0.5">
                            {new Date(act.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                      <span className="text-[9px] font-mono text-emerald-450 bg-emerald-500/10 px-1.5 py-0.5 rounded font-bold shrink-0">
                        ✓ Processed
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
