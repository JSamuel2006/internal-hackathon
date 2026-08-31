import React, { useState, useEffect } from 'react';
import { AlertCircle, Clock, MapPin, ShieldAlert, MessageSquare, Package, HeartPulse, Stethoscope, CheckCircle, RefreshCcw } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { emergencyNetworkService } from '../../services/api';

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
  const [sessionId, setSessionId] = useState<string | null>(() => sessionStorage.getItem('active_emergency_session_id'));
  const [sosActivated, setSosActivated] = useState<boolean>(() => !!sessionStorage.getItem('active_emergency_session_id'));
  const [alertStatus, setAlertStatus] = useState(() => sessionStorage.getItem('active_emergency_session_id') ? 'Trauma pre-alert sent successfully! Emergency Health Passport shared.' : '');
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
    setAlertStatus('Creating active emergency session & notifications...');
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
        setAlertStatus('Trauma pre-alert sent successfully! Emergency Health Passport shared.');
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
      setErrorMsg('Please select a hospital');
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
          setAlertStatus('Trauma pre-alert sent successfully! Emergency Health Passport shared.');
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
          setAlertStatus(`Pre-alert sent to hospital. Receiving bay notified.`);
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
          <span>🚨 Need Immediate Medical Help?</span>
        </div>
        <p className="text-xs text-rose-900 leading-relaxed font-sans max-w-xl mx-auto font-medium">
          If this is a life-threatening emergency, call emergency services immediately or trigger automated trauma pre-alerts.
        </p>
        <div className="flex flex-wrap gap-4 justify-center pt-2">
          <a
            href="tel:108"
            className="px-7 py-3.5 rounded-full bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs uppercase tracking-wider shadow-md flex items-center gap-2 transition-all cursor-pointer"
          >
            <span>📞 CALL 108</span>
          </a>
          <a
            href="tel:112"
            className="px-7 py-3.5 rounded-full bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs uppercase tracking-wider shadow-md flex items-center gap-2 transition-all cursor-pointer"
          >
            <span>📞 CALL 112</span>
          </a>
        </div>
      </div>

      {/* Header */}
      <div className="border-b border-slate-200 pb-4 text-center">
        <h2 className="text-xl font-bold text-slate-900 uppercase tracking-wider flex items-center justify-center gap-2 font-sans">
          <ShieldAlert className="w-6 h-6 text-rose-600" />
          Emergency Response Network
        </h2>
        <p className="text-xs text-slate-500 mt-1 font-sans">Get coordinated emergency assistance. One place for all emergency coordination.</p>
      </div>

      {/* SOS Trigger Panel */}
      <div className="py-6 flex flex-col items-center justify-center space-y-4 bg-white border border-slate-200 rounded-2xl p-6">
        <button
          onClick={triggerSOS}
          disabled={sosActivated || loading}
          className={`w-32 h-32 rounded-full font-bold text-slate-950 text-sm uppercase shadow-2xl transition-transform border-4 ${
            sosActivated 
              ? 'bg-rose-600 border-rose-500 animate-pulse scale-105 cursor-not-allowed'
              : 'bg-rose-500 border-rose-455 hover:scale-105 hover:bg-rose-600'
          }`}
        >
          {loading ? 'Activating...' : sosActivated ? 'SOS Active' : 'SOS Trigger'}
        </button>

        {sosActivated ? (
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-455 text-xs text-left w-full max-w-lg space-y-2">
            <span className="font-bold flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-455" />
              Incoming patient pre-arrival alert sent!
            </span>
            <p className="text-slate-600">Status: {alertStatus}</p>
            <p className="text-slate-600">Ambulance ETA: <strong className="text-rose-400">{eta}</strong></p>
          </div>
        ) : (
          <p className="text-slate-555 text-center max-w-md">
            Tap the red SOS button to broadcast emergency coordinates and health records to the nearest participating hospital.
          </p>
        )}
      </div>

      {/* Grid of the 3 Coordinated Emergency Options */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
        
        {/* OPTION 1: Hospital Pre-Alert */}
        <div className="bg-white border border-slate-200 shadow-sm p-5 rounded-2xl border border-slate-200 bg-white flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-rose-400">
              <span className="text-xl">🚑</span>
              <h3 className="font-bold uppercase tracking-wider text-slate-900">Hospital Pre-Alert</h3>
            </div>
            <p className="text-slate-600 leading-relaxed text-[11px]">
              Alert nearby hospital about your arrival so they can prepare the trauma team.
            </p>

            {/* Selection Form */}
            {!preAlertSent ? (
              <div className="space-y-2 pt-2 border-t border-slate-200">
                <label className="text-[9px] uppercase tracking-wider text-slate-500 block">Select Hospital</label>
                <select
                  value={selectedHospitalId}
                  onChange={(e) => setSelectedHospitalId(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded px-2 py-1.5 text-[10px] text-slate-700 font-mono focus:outline-none"
                >
                  {hospitals.length === 0 ? (
                    <option value="">No Hospitals Found</option>
                  ) : (
                    hospitals.map((h) => (
                      <option key={h.id} value={h.id}>{h.name}</option>
                    ))
                  )}
                </select>

                <label className="text-[9px] uppercase tracking-wider text-slate-500 block mt-2">Estimated Arrival (ETA)</label>
                <select
                  value={selectedEta}
                  onChange={(e) => setSelectedEta(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded px-2 py-1.5 text-[10px] text-slate-700 font-mono focus:outline-none"
                >
                  <option value="5 Minutes">5 Minutes</option>
                  <option value="10 Minutes">10 Minutes</option>
                  <option value="15 Minutes">15 Minutes</option>
                  <option value="20 Minutes">20 Minutes</option>
                  <option value="30+ Minutes">30+ Minutes</option>
                </select>
              </div>
            ) : (
              <div className="pt-2 border-t border-slate-200 flex items-start gap-1.5 text-emerald-450 text-[10px]">
                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">Pre-Alert Transmitted!</p>
                  <p className="text-slate-500 text-[9px] mt-0.5">Hospital: {hospitals.find(h => h.id === selectedHospitalId)?.name}</p>
                  <p className="text-slate-455 text-[9px]">ETA: {selectedEta}</p>
                </div>
              </div>
            )}

            {errorMsg && <p className="text-rose-455 text-[9px] mt-1">{errorMsg}</p>}
          </div>

          {!preAlertSent && (
            <button
              onClick={handleSendPreAlert}
              disabled={preAlertLoading}
              className="w-full py-2 bg-rose-500/20 border border-rose-500/35 text-rose-350 hover:bg-rose-500/30 disabled:opacity-40 font-bold rounded-xl text-[10px] uppercase tracking-wider transition-colors flex items-center justify-center gap-1.5"
            >
              {preAlertLoading ? (
                <><RefreshCcw className="w-3 h-3 animate-spin" /> Dispatching...</>
              ) : (
                '[PRE-ALERT]'
              )}
            </button>
          )}
        </div>

        {/* OPTION 2: Doctor Assistance */}
        <div className="bg-white border border-slate-200 shadow-sm p-5 rounded-2xl border border-slate-200 bg-white flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-amber-400">
              <span className="text-xl">👨‍⚕️</span>
              <h3 className="font-bold uppercase tracking-wider text-slate-900">Doctor Assistance</h3>
            </div>
            <p className="text-slate-600 leading-relaxed text-[11px]">
              Chat with a qualified doctor for real-time emergency guidance while transit is active.
            </p>
          </div>
          {sessionId ? (
            <Link
              to={`/citizen/emergency/${sessionId}/doctor-chat`}
              className="w-full py-2 bg-amber-500/20 border border-amber-500/35 text-amber-350 hover:bg-amber-500/30 font-bold rounded-xl text-[10px] uppercase tracking-wider text-center block transition-colors"
            >
              [CONTACT DOCTOR]
            </Link>
          ) : (
            <button
              onClick={async () => {
                await triggerSOS();
              }}
              className="w-full py-2 bg-slate-800/40 border border-slate-700 text-slate-500 font-bold rounded-xl text-[10px] uppercase tracking-wider transition-colors"
            >
              Activate SOS to Contact
            </button>
          )}
        </div>

        {/* OPTION 3: Pharmacy Assistance */}
        <div className="bg-white border border-slate-200 shadow-sm p-5 rounded-2xl border border-slate-200 bg-white flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-violet-400">
              <span className="text-xl">💊</span>
              <h3 className="font-bold uppercase tracking-wider text-slate-900">Pharmacy Assistance</h3>
            </div>
            <p className="text-slate-600 leading-relaxed text-[11px]">
              Notify a nearby participating pharmacy so a pharmacist can review and prepare first aid assistance.
            </p>
          </div>
          {sessionId ? (
            <Link
              to={`/citizen/emergency/${sessionId}/pharmacy`}
              className="w-full py-2 bg-violet-500/20 border border-violet-500/35 text-violet-300 hover:bg-violet-500/30 font-bold rounded-xl text-[10px] uppercase tracking-wider text-center block transition-colors"
            >
              [CONTACT PHARMACY]
            </Link>
          ) : (
            <Link
              to="/citizen/emergency-pharmacy"
              className="w-full py-2 bg-violet-500/20 border border-violet-500/35 text-violet-300 hover:bg-violet-500/30 font-bold rounded-xl text-[10px] uppercase tracking-wider text-center block transition-colors"
            >
              [CONTACT PHARMACY]
            </Link>
          )}
        </div>

      </div>

      {/* Info Footers */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left pt-4">
        <div className="bg-white border border-slate-200 shadow-sm p-5 rounded-xl border border-slate-200 space-y-2">
          <span className="text-[10px] text-slate-550 block uppercase">Nearest Trauma Center</span>
          <strong className="text-slate-800 text-sm block">Sassoon General Hospital Pune</strong>
          <span className="text-[10px] text-emerald-400">Distance: 1.4 KM | Route: Traffic Clear</span>
        </div>
        <div className="bg-white border border-slate-200 shadow-sm p-5 rounded-xl border border-slate-200 space-y-2">
          <span className="text-[10px] text-slate-550 block uppercase">Emergency Health Passport</span>
          <p className="text-slate-600 leading-relaxed">
            ABHA card details, allergy summaries, and digital twin health telemetry metrics are automatically pre-shared with responding trauma centers once SOS is activated.
          </p>
        </div>
      </div>
    </div>
  );
}
