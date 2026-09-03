import React, { useState, useEffect } from 'react';
import { AlertCircle, ShieldAlert, CheckCircle, RefreshCcw } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { emergencyNetworkService } from '../../services/api';
import { useI18n } from '../../i18n';

interface Facility {
  id: string;
  name: string;
  address?: string;
  latitude: number;
  longitude: number;
  emergencyAvailable?: boolean;
}

export default function EmergencyModePage() {
  const navigate = useNavigate();
  const { t } = useI18n();
  const [sessionId, setSessionId] = useState<string | null>(() => sessionStorage.getItem('active_emergency_session_id'));
  const [sosActivated, setSosActivated] = useState<boolean>(() => !!sessionStorage.getItem('active_emergency_session_id'));
  const [alertStatus, setAlertStatus] = useState(() => sessionStorage.getItem('active_emergency_session_id') ? t('sos_sent_title') : '');
  const [eta, setEta] = useState('8 Minutes');
  const [loading, setLoading] = useState(false);

  // Pre-Alert Workflow States
  const [hospitals, setHospitals] = useState<Facility[]>([]);
  const [selectedHospitalId, setSelectedHospitalId] = useState<string>('');
  const [selectedEta, setSelectedEta] = useState<string>('10 Minutes');
  const [preAlertSent, setPreAlertSent] = useState(() => !!sessionStorage.getItem('active_emergency_session_id'));
  const [preAlertLoading, setPreAlertLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Fetch nearby hospitals on mount
  useEffect(() => {
    (async () => {
      try {
        const res = await emergencyNetworkService.getNearbyFacilities();
        if (res.success && res.data) {
          // If backend returns facilities object with hospitals/pharmacies arrays
          const hList = res.data.hospitals || [];
          setHospitals(hList);
          if (hList.length > 0) {
            setSelectedHospitalId(hList[0].id);
          }
        }
      } catch (err) {
        console.error('Failed to load facilities', err);
      }
    })();
  }, []);

  const triggerSOS = async () => {
    setLoading(true);
    setAlertStatus(t('sos_activating'));
    setErrorMsg('');
    try {
      const res = await emergencyNetworkService.createSession({
        symptoms: ['severe chest pain', 'difficulty breathing', 'heavy sweating'],
        latitude: 18.5204,
        longitude: 73.8567,
      });
      if (res && res.success && res.data?.sessionId) {
        const activeId = res.data.sessionId;
        setSessionId(activeId);
        sessionStorage.setItem('active_emergency_session_id', activeId);
        setSosActivated(true);
        setAlertStatus(t('sos_sent_title'));
      } else {
        throw new Error(res?.message || 'Session creation failed');
      }
    } catch (err: any) {
      setSosActivated(false);
      setSessionId(null);
      sessionStorage.removeItem('active_emergency_session_id');
      const errMsg = err?.response?.data?.message || err?.message || 'Unable to activate emergency session';
      setAlertStatus(`SOS Activation Failed: ${errMsg}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSendPreAlert = async () => {
    if (!selectedHospitalId) {
      setErrorMsg(t('select_hospital'));
      return;
    }
    
    let activeSessionId = sessionId;
    setPreAlertLoading(true);
    setErrorMsg('');

    try {
      // 1. If SOS isn't activated, trigger it to get a sessionId
      if (!sosActivated || !activeSessionId) {
        const res = await emergencyNetworkService.createSession({
          symptoms: ['severe chest pain', 'difficulty breathing', 'heavy sweating'],
          latitude: 18.5204,
          longitude: 73.8567,
        });
        if (res && res.success && res.data?.sessionId) {
          activeSessionId = res.data.sessionId;
          setSessionId(activeSessionId);
          sessionStorage.setItem('active_emergency_session_id', activeSessionId as string);
          setSosActivated(true);
          setAlertStatus(t('sos_sent_title'));
        } else {
          throw new Error(res?.message || 'Failed to create emergency session');
        }
      }

      // 2. Dispatch the pre-alert to the selected hospital
      if (activeSessionId) {
        const resAlert = await emergencyNetworkService.sendHospitalAlert(
          activeSessionId,
          selectedHospitalId,
          selectedEta
        );
        if (resAlert.success) {
          setPreAlertSent(true);
          setAlertStatus(t('pre_alert_transmitted'));
        } else {
          setErrorMsg(resAlert.message || 'Failed to dispatch pre-alert.');
        }
      }
    } catch (err: any) {
      setSosActivated(false);
      setSessionId(null);
      sessionStorage.removeItem('active_emergency_session_id');
      const errMsg = err?.response?.data?.message || err?.message || 'Error occurred. Please try again.';
      setErrorMsg(errMsg);
    } finally {
      setPreAlertLoading(false);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto px-4 font-sans text-slate-800">
      {/* ── EMERGENCY CALLOUT CARD ────────────────────────────────────── */}
      <div className="bg-rose-50 border border-rose-200 rounded-3xl p-6 md:p-8 space-y-4 text-center shadow-sm">
        <div className="inline-flex items-center gap-2 text-rose-700 font-extrabold text-lg">
          <ShieldAlert className="w-6 h-6 text-rose-600 animate-pulse" />
          <span>{t('emergency_callout_title')}</span>
        </div>
        <p className="text-xs text-rose-900 leading-relaxed font-sans max-w-xl mx-auto font-medium">
          {t('emergency_callout_desc')}
        </p>
        <div className="flex flex-wrap gap-4 justify-center pt-2">
          <a
            href="tel:108"
            className="px-7 py-3.5 rounded-full bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs uppercase tracking-wider shadow-md flex items-center gap-2 transition-all cursor-pointer"
          >
            <span>📞 {t('call_108')}</span>
          </a>
          <a
            href="tel:112"
            className="px-7 py-3.5 rounded-full bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs uppercase tracking-wider shadow-md flex items-center gap-2 transition-all cursor-pointer"
          >
            <span>📞 {t('call_112')}</span>
          </a>
        </div>
      </div>

      {/* Header */}
      <div className="border-b border-slate-200 pb-4 text-center">
        <h2 className="text-xl font-bold text-slate-900 uppercase tracking-wider flex items-center justify-center gap-2 font-sans">
          <ShieldAlert className="w-6 h-6 text-rose-600" />
          {t('emergency_response_network')}
        </h2>
        <p className="text-xs text-slate-500 mt-1 font-sans">{t('emergency_network_sub')}</p>
      </div>

      {/* SOS Trigger Panel */}
      <div className="py-6 flex flex-col items-center justify-center space-y-4 bg-white border border-slate-200 rounded-2xl p-6">
        <button
          onClick={triggerSOS}
          disabled={sosActivated || loading}
          className={`w-32 h-32 rounded-full font-bold text-slate-950 text-sm uppercase shadow-2xl transition-transform border-4 cursor-pointer ${
            sosActivated 
              ? 'bg-rose-600 border-rose-500 animate-pulse scale-105 cursor-not-allowed text-white'
              : 'bg-rose-500 border-rose-600 hover:scale-105 hover:bg-rose-600 text-white'
          }`}
        >
          {loading ? t('sos_activating') : sosActivated ? t('sos_active') : t('sos_trigger')}
        </button>

        {sosActivated ? (
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-700 text-xs text-left w-full max-w-lg space-y-2">
            <span className="font-bold flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-600" />
              {t('sos_sent_title')}
            </span>
            <p className="text-slate-600">{t('sos_status_label')}: {alertStatus}</p>
            <p className="text-slate-600">{t('sos_ambulance_eta')}: <strong className="text-rose-600 font-bold">{eta}</strong></p>
          </div>
        ) : (
          <p className="text-slate-600 text-center max-w-md text-xs">
            {t('sos_idle_desc')}
          </p>
        )}
      </div>

      {/* Grid of Coordinated Emergency Options */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
        
        {/* OPTION 1: Hospital Pre-Alert */}
        <div className="bg-white border border-slate-200 shadow-sm p-5 rounded-2xl flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-rose-600">
              <span className="text-xl">🚑</span>
              <h3 className="font-bold uppercase tracking-wider text-slate-900">{t('hospital_pre_alert')}</h3>
            </div>
            <p className="text-slate-600 leading-relaxed text-xs">
              {t('hospital_pre_alert_desc')}
            </p>

            {/* Selection Form */}
            {!preAlertSent ? (
              <div className="space-y-2 pt-2 border-t border-slate-200">
                <label className="text-[10px] uppercase font-semibold tracking-wider text-slate-500 block">{t('select_hospital')}</label>
                <select
                  value={selectedHospitalId}
                  onChange={(e) => setSelectedHospitalId(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 font-sans focus:outline-none focus:border-teal-500"
                >
                  {hospitals.length === 0 ? (
                    <option value="">{t('no_hospitals_found')}</option>
                  ) : (
                    hospitals.map((h) => (
                      <option key={h.id} value={h.id}>{h.name}</option>
                    ))
                  )}
                </select>

                <label className="text-[10px] uppercase font-semibold tracking-wider text-slate-500 block mt-2">{t('estimated_arrival')}</label>
                <select
                  value={selectedEta}
                  onChange={(e) => setSelectedEta(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 font-sans focus:outline-none focus:border-teal-500"
                >
                  <option value="5 Minutes">5 Minutes</option>
                  <option value="10 Minutes">10 Minutes</option>
                  <option value="15 Minutes">15 Minutes</option>
                  <option value="20 Minutes">20 Minutes</option>
                  <option value="30+ Minutes">30+ Minutes</option>
                </select>
              </div>
            ) : (
              <div className="pt-2 border-t border-slate-200 flex items-start gap-1.5 text-emerald-600 text-xs">
                <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">{t('pre_alert_transmitted')}</p>
                  <p className="text-slate-500 text-[11px] mt-0.5">{t('hospital_label')}: {hospitals.find(h => h.id === selectedHospitalId)?.name}</p>
                  <p className="text-slate-600 text-[11px]">ETA: {selectedEta}</p>
                </div>
              </div>
            )}

            {errorMsg && <p className="text-rose-600 text-xs mt-1">{errorMsg}</p>}
          </div>

          {!preAlertSent && (
            <button
              onClick={handleSendPreAlert}
              disabled={preAlertLoading}
              className="w-full py-2.5 bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100 disabled:opacity-40 font-extrabold rounded-xl text-xs uppercase tracking-wider transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              {preAlertLoading ? (
                <><RefreshCcw className="w-3.5 h-3.5 animate-spin" /> {t('dispatching')}</>
              ) : (
                t('dispatch_pre_alert')
              )}
            </button>
          )}
        </div>

        {/* OPTION 2: Doctor Assistance */}
        <div className="bg-white border border-slate-200 shadow-sm p-5 rounded-2xl flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-amber-600">
              <span className="text-xl">👨‍⚕️</span>
              <h3 className="font-bold uppercase tracking-wider text-slate-900">{t('doctor_assistance')}</h3>
            </div>
            <p className="text-slate-600 leading-relaxed text-xs">
              {t('doctor_assistance_desc')}
            </p>
          </div>
          {sessionId ? (
            <Link
              to={`/citizen/emergency/${sessionId}/doctor-chat`}
              className="w-full py-2.5 bg-amber-50 border border-amber-200 text-amber-800 hover:bg-amber-100 font-extrabold rounded-xl text-xs uppercase tracking-wider text-center block transition-colors"
            >
              {t('contact_doctor')}
            </Link>
          ) : (
            <button
              onClick={async () => {
                await triggerSOS();
              }}
              className="w-full py-2.5 bg-slate-100 border border-slate-200 text-slate-600 font-bold rounded-xl text-xs uppercase tracking-wider transition-colors cursor-pointer"
            >
              {t('activate_sos_to_contact')}
            </button>
          )}
        </div>

      </div>

      {/* Info Footers */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left pt-4">
        <div className="bg-white border border-slate-200 shadow-sm p-5 rounded-xl border border-slate-200 space-y-2">
          <span className="text-[10px] text-slate-500 block uppercase font-bold tracking-wider">{t('nearest_trauma_center')}</span>
          <strong className="text-slate-900 text-sm block">{t('nearest_trauma_center_val')}</strong>
          <span className="text-[11px] text-emerald-600 font-semibold">{t('nearest_trauma_center_info')}</span>
        </div>
        <div className="bg-white border border-slate-200 shadow-sm p-5 rounded-xl border border-slate-200 space-y-2">
          <span className="text-[10px] text-slate-500 block uppercase font-bold tracking-wider">{t('emergency_health_passport')}</span>
          <p className="text-slate-600 leading-relaxed text-xs">
            {t('emergency_passport_desc')}
          </p>
        </div>
      </div>
    </div>
  );
}
