import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, Search, Filter, ShieldCheck, ChevronRight, AlertTriangle, 
  CheckCircle2, Clock, MapPin, HeartPulse, RefreshCw, UserCheck
} from 'lucide-react';
import { useI18n } from '../../i18n';
import { api } from '../../services/api';

interface Patient {
  id: string;
  name: string;
  abhaId: string;
  age: number;
  gender: string;
  village: string;
  jurisdiction: string;
  riskStatus: string;
  lastScreeningDate: string;
  careStatus: string;
  assignedAsha: string;
}

export default function AshaPatientsPage() {
  const { lang, t } = useI18n();
  const navigate = useNavigate();

  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [riskFilter, setRiskFilter] = useState<string>('ALL');

  const fetchPatients = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/worker/patients', {
        params: { query: searchQuery }
      });
      if (res.data?.success) {
        setPatients(res.data.data || []);
      } else {
        throw new Error(res.data?.message || t('unable_to_load_timeline'));
      }
    } catch (err: any) {
      if (err.response?.status === 403) {
        setError(t('access_denied_jurisdiction'));
      } else {
        setError(err.response?.data?.message || t('unable_to_load_timeline'));
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, [searchQuery]);

  const filteredPatients = patients.filter(p => {
    if (riskFilter === 'ALL') return true;
    if (riskFilter === 'URGENT') return p.riskStatus === 'URGENT' || p.riskStatus === 'PRIORITY';
    if (riskFilter === 'NORMAL') return p.riskStatus === 'NORMAL' || !p.riskStatus;
    return true;
  });

  const localeMap: Record<string, string> = { en: 'en-IN', ta: 'ta-IN', hi: 'hi-IN', mr: 'mr-IN' };
  const currentLocale = localeMap[lang] || 'en-IN';

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12 font-sans">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3.5">
          <div className="p-3 bg-teal-500/10 rounded-xl text-teal-600 border border-teal-500/20">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">{t('assigned_patients')}</h1>
            <p className="text-xs text-slate-500 mt-0.5">{t('assigned_patients_desc')}</p>
          </div>
        </div>

        <button
          onClick={fetchPatients}
          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs flex items-center gap-2 transition-all cursor-pointer border border-slate-200 self-start md:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>{t('refresh')}</span>
        </button>
      </div>

      {/* Filters & Search Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="sm:col-span-2 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder={t('search_patients_placeholder')}
            className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-teal-500 font-mono shadow-xs"
          />
        </div>

        <div className="relative">
          <Filter className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <select
            value={riskFilter}
            onChange={e => setRiskFilter(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-700 focus:outline-none focus:border-teal-500 font-medium shadow-xs appearance-none"
          >
            <option value="ALL">{t('all_risk_statuses')}</option>
            <option value="URGENT">{t('urgent_attention')}</option>
            <option value="NORMAL">{t('routine_care')}</option>
          </select>
        </div>
      </div>

      {/* Content State Handling */}
      {loading ? (
        <div className="bg-white border border-slate-200 p-12 rounded-2xl text-center space-y-3 shadow-xs">
          <RefreshCw className="w-8 h-8 text-teal-600 animate-spin mx-auto" />
          <p className="text-xs font-mono text-slate-500">{t('loading_patients')}</p>
        </div>
      ) : error ? (
        <div className="bg-rose-50 border border-rose-200 p-8 rounded-2xl text-center space-y-3">
          <AlertTriangle className="w-8 h-8 text-rose-500 mx-auto" />
          <h3 className="text-sm font-bold text-rose-900">{t('access_denied_jurisdiction')}</h3>
          <p className="text-xs text-rose-700 max-w-md mx-auto">{error}</p>
          <button
            onClick={fetchPatients}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
          >
            {t('retry_connection')}
          </button>
        </div>
      ) : filteredPatients.length === 0 ? (
        <div className="bg-white border border-slate-200 p-12 rounded-2xl text-center space-y-3 shadow-xs">
          <Users className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="text-sm font-bold text-slate-800">{t('no_patients_found')}</h3>
          <p className="text-xs text-slate-500">{t('no_patients_found_desc')}</p>
        </div>
      ) : (
        /* Patient Cards Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPatients.map(patient => (
            <div
              key={patient.id}
              onClick={() => navigate(`/worker/patients/${patient.id}`)}
              className="bg-white border border-slate-200 hover:border-teal-500/50 p-5 rounded-2xl shadow-xs transition-all cursor-pointer flex flex-col justify-between space-y-4 hover:shadow-md group"
            >
              <div className="space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 group-hover:text-teal-700 transition-colors">
                      {patient.name}
                    </h3>
                    <p className="text-[10px] font-mono text-slate-500 mt-0.5">{patient.abhaId}</p>
                  </div>

                  <span className={`px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                    patient.riskStatus === 'URGENT' || patient.riskStatus === 'PRIORITY'
                      ? 'bg-rose-100 text-rose-700 border border-rose-200'
                      : 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                  }`}>
                    {patient.riskStatus === 'URGENT' || patient.riskStatus === 'PRIORITY'
                      ? t('urgent_attention')
                      : t('routine_care')}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <div>
                    <span className="text-[9px] text-slate-400 block uppercase font-mono">{t('age_gender')}</span>
                    <span className="font-semibold text-slate-800">{patient.age} yrs • {patient.gender}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-400 block uppercase font-mono">{t('location')}</span>
                    <span className="font-semibold text-slate-800 flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-teal-600 shrink-0" />
                      <span className="truncate">{patient.village}</span>
                    </span>
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-100 pt-3 flex items-center justify-between text-[10px] font-mono text-slate-500">
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>{new Date(patient.lastScreeningDate).toLocaleDateString(currentLocale)}</span>
                </div>

                <div className="flex items-center gap-1 text-teal-600 font-bold group-hover:translate-x-0.5 transition-transform">
                  <span>{t('view_profile')}</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
