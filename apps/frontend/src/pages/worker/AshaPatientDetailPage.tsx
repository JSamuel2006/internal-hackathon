import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  User, ShieldCheck, HeartPulse, Activity, FileText, Calendar, 
  AlertTriangle, CheckCircle2, ChevronLeft, MapPin, Phone, Stethoscope, 
  Pill, Clock, AlertCircle, Plus, Send, RefreshCw, Check
} from 'lucide-react';
import { useI18n } from '../../i18n';
import { api } from '../../services/api';

interface PatientProfile {
  id: string;
  name: string;
  abhaId: string;
  age: number;
  gender: string;
  village: string;
  jurisdiction: string;
  phone: string;
  emergency_contact: string;
  riskStatus: string;
  lastScreeningDate: string;
  careStatus: string;
  assignedAsha: string;
}

interface HealthSummary {
  vitals: {
    bloodPressure: string;
    pulse: string;
    spo2: string;
    temperature: string;
    glucose: string;
    lastVitalsDate: string;
  };
  conditions: string[];
  medicines: string[];
  allergies: string[];
  labResults: Array<{
    testName: string;
    status: string;
    result: string;
    labName: string;
    date: string;
  }>;
  recentConsultations: Array<{
    id: string;
    date: string;
    doctor: string;
    specialty: string;
    diagnosis: string;
    recommendation: string;
  }>;
}

interface ProactiveCareCard {
  id: string;
  level: 'GREEN' | 'AMBER' | 'RED';
  title: string;
  reason: string;
  recommendedAction: string;
  source: string;
}

export default function AshaPatientDetailPage() {
  const { lang, t } = useI18n();
  const { patientId } = useParams<{ patientId: string }>();
  const navigate = useNavigate();

  const [profile, setProfile] = useState<PatientProfile | null>(null);
  const [summary, setSummary] = useState<HealthSummary | null>(null);
  const [proactiveCare, setProactiveCare] = useState<ProactiveCareCard[]>([]);
  const [timeline, setTimeline] = useState<any[]>([]);
  
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Modal / Action feedback state
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const localeMap: Record<string, string> = { en: 'en-IN', ta: 'ta-IN', hi: 'hi-IN', mr: 'mr-IN' };
  const currentLocale = localeMap[lang] || 'en-IN';

  const fetchData = async () => {
    if (!patientId) return;
    setLoading(true);
    setError(null);
    try {
      // 1. Fetch Profile
      const profRes = await api.get(`/worker/patients/${patientId}`);
      if (profRes.data?.success) {
        setProfile(profRes.data.data);
      } else {
        throw new Error(profRes.data?.message || t('unable_to_load_timeline'));
      }

      // 2. Fetch Health Summary
      const sumRes = await api.get(`/worker/patients/${patientId}/summary`);
      if (sumRes.data?.success) {
        setSummary(sumRes.data.data);
      }

      // 3. Fetch Proactive Care
      const careRes = await api.get(`/worker/patients/${patientId}/proactive-care`);
      if (careRes.data?.success) {
        setProactiveCare(careRes.data.data || []);
      }

      // 4. Fetch Timeline
      const timeRes = await api.get(`/worker/citizen/${patientId}/history`);
      if (timeRes.data?.success) {
        setTimeline(timeRes.data.data || []);
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
    fetchData();
  }, [patientId]);

  const handleActionClick = (actionName: string) => {
    setActionSuccess(`${actionName} ${t('recorded_successfully')}`);
    setTimeout(() => setActionSuccess(null), 4000);
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto py-12 px-4 text-center space-y-3 font-sans">
        <RefreshCw className="w-8 h-8 text-teal-600 animate-spin mx-auto" />
        <p className="text-xs font-mono text-slate-500">{t('loading_patient_history')}</p>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="max-w-3xl mx-auto py-12 px-4 font-sans">
        <div className="bg-rose-50 border border-rose-200 p-8 rounded-2xl text-center space-y-4">
          <AlertTriangle className="w-10 h-10 text-rose-500 mx-auto" />
          <h2 className="text-base font-bold text-rose-900">{t('access_denied_jurisdiction')}</h2>
          <p className="text-xs text-rose-700 max-w-md mx-auto">{error || t('access_denied_jurisdiction')}</p>
          <button
            onClick={() => navigate('/worker/patients')}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-all cursor-pointer"
          >
            {t('return_to_patients')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16 font-sans">
      {/* Top Back Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/worker/patients')}
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-teal-700 transition-colors cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>{t('back_to_my_patients')}</span>
        </button>

        <span className="text-[10px] font-mono bg-teal-50 text-teal-700 border border-teal-200 px-3 py-1 rounded-full font-bold">
          {t('abha_authorized_access')}
        </span>
      </div>

      {actionSuccess && (
        <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl text-emerald-800 text-xs font-semibold flex items-center gap-2 animate-fade-in">
          <Check className="w-4 h-4 text-emerald-600" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Patient Overview Card */}
      <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-xs space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-teal-50 border border-teal-200 rounded-2xl flex items-center justify-center text-teal-700 font-bold text-xl shadow-xs">
              {profile.name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-slate-900 tracking-tight">{profile.name}</h1>
                <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                  profile.riskStatus === 'URGENT' || profile.riskStatus === 'PRIORITY'
                    ? 'bg-rose-100 text-rose-700 border border-rose-200'
                    : 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                }`}>
                  {profile.riskStatus === 'URGENT' || profile.riskStatus === 'PRIORITY'
                    ? t('urgent_attention')
                    : t('routine_care')}
                </span>
              </div>
              <p className="text-xs font-mono text-slate-500 mt-0.5">{profile.abhaId}</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => handleActionClick(t('record_field_visit'))}
              className="px-3.5 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{t('record_field_visit')}</span>
            </button>
            <button
              onClick={() => handleActionClick(t('log_vitals'))}
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer border border-slate-200"
            >
              <HeartPulse className="w-3.5 h-3.5 text-teal-600" />
              <span>{t('log_vitals')}</span>
            </button>
          </div>
        </div>

        {/* Demographics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
            <span className="text-[10px] font-mono text-slate-400 block uppercase">{t('age_gender')}</span>
            <span className="font-bold text-slate-800 mt-0.5 block">{profile.age} yrs • {profile.gender}</span>
          </div>
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
            <span className="text-[10px] font-mono text-slate-400 block uppercase">{t('village_jurisdiction')}</span>
            <span className="font-bold text-slate-800 mt-0.5 block truncate flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-teal-600 shrink-0" />
              <span>{profile.village}</span>
            </span>
          </div>
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
            <span className="text-[10px] font-mono text-slate-400 block uppercase">{t('assigned_asha')}</span>
            <span className="font-bold text-slate-800 mt-0.5 block truncate">{profile.assignedAsha}</span>
          </div>
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
            <span className="text-[10px] font-mono text-slate-400 block uppercase">{t('care_status')}</span>
            <span className="font-bold text-teal-700 mt-0.5 block truncate">{profile.careStatus}</span>
          </div>
        </div>
      </div>

      {/* Proactive Care / Follow-ups Section */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-teal-600" />
          <h2 className="text-base font-bold text-slate-900 tracking-tight">{t('proactive_care_recommendations')}</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {proactiveCare.map(card => (
            <div
              key={card.id}
              className={`p-5 rounded-2xl border flex flex-col justify-between space-y-3 shadow-xs ${
                card.level === 'RED'
                  ? 'bg-rose-50/50 border-rose-200 text-rose-950'
                  : card.level === 'AMBER'
                  ? 'bg-amber-50/50 border-amber-200 text-amber-950'
                  : 'bg-emerald-50/50 border-emerald-200 text-emerald-950'
              }`}
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider ${
                    card.level === 'RED'
                      ? 'bg-rose-600 text-white'
                      : card.level === 'AMBER'
                      ? 'bg-amber-600 text-white'
                      : 'bg-emerald-600 text-white'
                  }`}>
                    {card.level === 'RED'
                      ? t('urgent_attention')
                      : card.level === 'AMBER'
                      ? t('follow_up_recommended')
                      : t('routine_care')}
                  </span>
                  <span className="text-[9px] font-mono text-slate-500">{card.source}</span>
                </div>

                <h3 className="text-sm font-bold leading-tight">{card.title}</h3>
                <p className="text-xs text-slate-600 leading-relaxed">{card.reason}</p>
              </div>

              <div className="border-t border-slate-200/60 pt-3 space-y-1.5">
                <span className="text-[9px] font-mono uppercase text-slate-500 block">{t('recommended_asha_action')}</span>
                <p className="text-xs font-semibold text-slate-800">{card.recommendedAction}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Health Summary Grid */}
      {summary && (
        <div className="space-y-4">
          <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Activity className="w-5 h-5 text-teal-600" />
            <span>{t('health_summary')}</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Vitals Summary Card */}
            <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs space-y-3">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2.5 flex items-center justify-between">
                <span>{t('latest_vitals')}</span>
                <HeartPulse className="w-4 h-4 text-teal-600" />
              </h3>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">{t('blood_pressure')}:</span>
                  <span className="font-bold text-slate-800">{summary.vitals.bloodPressure}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">{t('pulse')}:</span>
                  <span className="font-bold text-slate-800">{summary.vitals.pulse}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">{t('spo2')}:</span>
                  <span className="font-bold text-slate-800">{summary.vitals.spo2}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">{t('temperature')}:</span>
                  <span className="font-bold text-slate-800">{summary.vitals.temperature}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">{t('blood_glucose')}:</span>
                  <span className="font-bold text-slate-800">{summary.vitals.glucose}</span>
                </div>
              </div>
            </div>

            {/* Conditions & Allergies Card */}
            <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs space-y-3">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2.5 flex items-center justify-between">
                <span>{t('conditions_and_allergies')}</span>
                <Stethoscope className="w-4 h-4 text-teal-600" />
              </h3>

              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-[10px] font-mono text-slate-400 block uppercase mb-1">{t('known_conditions')}</span>
                  <div className="flex flex-wrap gap-1">
                    {summary.conditions.map((c, i) => (
                      <span key={i} className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-[10px] font-semibold border border-slate-200">
                        {c}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <span className="text-[10px] font-mono text-slate-400 block uppercase mb-1">{t('known_allergies')}</span>
                  <div className="flex flex-wrap gap-1">
                    {summary.allergies.map((a, i) => (
                      <span key={i} className="px-2 py-0.5 bg-rose-50 text-rose-700 rounded text-[10px] font-semibold border border-rose-200">
                        {a}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Active Medications Card */}
            <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs space-y-3">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2.5 flex items-center justify-between">
                <span>{t('current_medications')}</span>
                <Pill className="w-4 h-4 text-teal-600" />
              </h3>

              <div className="space-y-2 text-xs">
                {summary.medicines.map((m, i) => (
                  <div key={i} className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg border border-slate-100 text-slate-800 font-semibold">
                    <Pill className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                    <span>{m}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Chronological Health Timeline */}
      <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-xs space-y-4">
        <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2 border-b border-slate-100 pb-3">
          <Calendar className="w-5 h-5 text-teal-600" />
          <span>{t('health_timeline')}</span>
        </h2>

        {timeline.length === 0 ? (
          <p className="text-xs text-slate-500 text-center py-6">{t('no_health_activities')}</p>
        ) : (
          <div className="space-y-3">
            {timeline.map((item, index) => (
              <div key={index} className="p-4 rounded-xl bg-slate-50 border border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] text-slate-400">
                      {new Date(item.screening_date || item.created_at || Date.now()).toLocaleDateString(currentLocale)}
                    </span>
                    <span className="px-2 py-0.5 bg-teal-100 text-teal-800 font-bold text-[9px] rounded uppercase font-mono">
                      {item.risk_level || 'ASHA VISIT'}
                    </span>
                  </div>
                  <h4 className="font-bold text-slate-900">{t('community_screening_by_asha')}</h4>
                  <p className="text-slate-600 text-[11px]">
                    {t('recorded_by_asha_worker')} {item.systolic}/{item.diastolic} mmHg, SPO2: {item.spo2}%.
                  </p>
                </div>

                <div className="text-[10px] font-mono text-slate-500 border-t md:border-t-0 md:border-l border-slate-200 pt-2 md:pt-0 md:pl-4 min-w-[130px]">
                  <span className="block uppercase text-slate-400 text-[9px]">{t('facility_provider')}</span>
                  <span className="font-semibold text-slate-700">{profile.assignedAsha}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ASHA Quick Action Bar */}
      <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs space-y-3">
        <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">{t('asha_actions')}</h3>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => handleActionClick(t('add_care_note'))}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-xl border border-slate-200 cursor-pointer transition-all"
          >
            {t('add_care_note')}
          </button>
          <button
            onClick={() => handleActionClick(t('schedule_follow_up'))}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-xl border border-slate-200 cursor-pointer transition-all"
          >
            {t('schedule_follow_up')}
          </button>
          <button
            onClick={() => handleActionClick(t('refer_to_doctor'))}
            className="px-3.5 py-2 bg-teal-50 hover:bg-teal-100 text-teal-800 text-xs font-bold rounded-xl border border-teal-200 cursor-pointer transition-all"
          >
            {t('refer_to_doctor')}
          </button>
        </div>
      </div>
    </div>
  );
}
