import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Bot, ScanLine, History, Award, HeartPulse, 
  Thermometer, User, Compass, Calendar, ArrowUpRight, Clock, Pill, Brain, FileText, ChevronRight
} from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { api } from '../../services/api';
import { t, I18nService } from '../../i18n';

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
  const [currentLang, setCurrentLang] = useState(I18nService.getLanguage());

  useEffect(() => {
    const unsub = I18nService.subscribe((lang) => {
      setCurrentLang(lang);
    });
    return unsub;
  }, []);

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
        <div className="bg-white border border-slate-200 shadow-sm p-6 rounded-2xl flex items-center justify-between col-span-1 md:col-span-2">
          <div className="space-y-3">
            <h2 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900">
              {t('dashboard_welcome', { name: user.name })}
            </h2>
            <p className="text-xs text-slate-600 max-w-md leading-relaxed">
              {t('dashboard_need_guidance')}
            </p>
            <div className="flex flex-wrap gap-3 pt-1">
              <Link
                to="/citizen/assistant"
                className="px-4 py-2.5 rounded-xl text-xs font-bold bg-teal-600 hover:bg-teal-700 text-white shadow-xs flex items-center gap-2 transition-all cursor-pointer"
              >
                <Bot className="w-4 h-4" />
                <span>{t('dashboard_talk_to_ai')}</span>
              </Link>
              <Link
                to="/citizen/scanner"
                className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-slate-50 hover:bg-slate-100 text-slate-800 border border-slate-200 flex items-center gap-2 transition-all cursor-pointer"
              >
                <ScanLine className="w-4 h-4 text-slate-500" />
                <span>{t('dashboard_scan_medicine')}</span>
              </Link>
            </div>
          </div>
          <div className="hidden sm:block p-4 bg-teal-50 rounded-2xl text-teal-600 border border-teal-100">
            <HeartPulse className="w-12 h-12" />
          </div>
        </div>

        {/* Vital stats card */}
        <div className="bg-white border border-slate-200 shadow-sm p-6 rounded-2xl space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold tracking-wider text-slate-500 uppercase">{t('dashboard_vitals_telemetry')}</span>
            <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 rounded-full font-bold uppercase">{t('dashboard_live')}</span>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
              <div className="flex items-center gap-2 text-rose-600 mb-1">
                <HeartPulse className="w-4 h-4" />
                <span className="text-[10px] text-slate-500 uppercase font-bold">{t('dashboard_pulse')}</span>
              </div>
              <p className="text-xl font-extrabold text-slate-900">72 <span className="text-xs font-normal text-slate-500">BPM</span></p>
            </div>
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
              <div className="flex items-center gap-2 text-teal-600 mb-1">
                <Thermometer className="w-4 h-4" />
                <span className="text-[10px] text-slate-500 uppercase font-bold">{t('dashboard_temp')}</span>
              </div>
              <p className="text-xl font-extrabold text-slate-900">98.4 <span className="text-xs font-normal text-slate-500">°F</span></p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Recharts Vitals Trend & ABHA Details */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Recharts Vital Trend */}
        <div className="bg-white border border-slate-200 shadow-sm p-6 rounded-2xl col-span-1 md:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900">{t('dashboard_weekly_telemetry')}</h3>
            <span className="text-xs text-slate-500">{t('dashboard_heart_rate_temp')}</span>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={mockHealthData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorBpm" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0D9488" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#0D9488" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                <XAxis dataKey="day" stroke="#64748B" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748B" fontSize={11} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: '12px', color: '#0F172A' }}
                  labelStyle={{ color: '#64748B' }}
                />
                <Area type="monotone" dataKey="bpm" stroke="#0D9488" fillOpacity={1} fill="url(#colorBpm)" name="Heart Rate (BPM)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* ABHA card & Immunizations */}
        <div className="space-y-6">
          {/* Detailed ABHA */}
          <div className="bg-[#EEF7FA] border border-teal-200/80 p-6 rounded-2xl flex flex-col justify-between h-48 relative overflow-hidden shadow-xs">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-bold tracking-widest text-teal-800 block uppercase">{t('dashboard_national_health_mission')}</span>
                <span className="text-xs font-bold text-teal-700 mt-1 block">{t('dashboard_abha_id')}</span>
              </div>
              <Compass className="w-5 h-5 text-teal-600" />
            </div>
            <div>
              <p className="text-xl font-extrabold tracking-wide text-slate-900">{user.name}</p>
              <p className="text-xs font-mono text-slate-600 font-bold mt-0.5">{user.abhaId}</p>
            </div>
            <div className="flex items-center justify-between border-t border-teal-200/60 pt-3">
              <span className="text-[10px] text-slate-600 font-bold uppercase">{t('dashboard_status_verified')}</span>
              <span className="text-[10px] text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-emerald-600 rounded-full animate-pulse"></span>
                {t('dashboard_status_active')}
              </span>
            </div>
          </div>

          {/* Immunization reminder */}
          <div className="bg-white border border-slate-200 shadow-sm p-6 rounded-2xl space-y-4">
            <h4 className="text-xs tracking-wider text-slate-500 uppercase font-bold">{t('dashboard_upcoming_immunizations')}</h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                <div>
                  <p className="text-xs font-bold text-slate-900">Tdap (Tetanus Booster)</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">Primary health centre, Pune</p>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-rose-700 font-bold bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-200">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Aug 24</span>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Activity Widget */}
          <div className="bg-white border border-slate-200 shadow-sm p-6 rounded-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h4 className="text-xs tracking-wider text-slate-500 uppercase font-bold">{t('dashboard_recent_activity')}</h4>
              <Link to="/citizen/timeline" className="text-[11px] text-teal-700 hover:underline flex items-center gap-0.5 font-bold">
                {t('dashboard_view_full_timeline')}
              </Link>
            </div>
            <div className="space-y-3">
              {loadingActivities ? (
                <div className="space-y-2">
                  <div className="h-10 bg-slate-50 rounded-xl animate-pulse"></div>
                  <div className="h-10 bg-slate-50 rounded-xl animate-pulse"></div>
                </div>
              ) : recentActivities.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-2">{t('dashboard_no_activities')}</p>
              ) : (
                recentActivities.map((act) => {
                  let Icon = FileText;
                  if (act.type === 'MEDICINE_SCAN') Icon = Pill;
                  else if (act.type === 'DISEASE_PREDICTION') Icon = Brain;
                  else if (act.type === 'APPOINTMENT') Icon = Calendar;
                  else if (act.type === 'USER_PROFILE' || act.type === 'HEALTH_SIMULATION') Icon = HeartPulse;

                  return (
                    <div key={act.id} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="p-1.5 bg-white rounded-lg border border-slate-200 shrink-0">
                          <Icon className="w-3.5 h-3.5 text-slate-600" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-900 truncate">{act.title}</p>
                          <p className="text-[10px] text-slate-500 mt-0.5">
                            {new Date(act.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                      <span className="text-[10px] text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full font-bold shrink-0">
                        ✓ {t('dashboard_processed')}
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
