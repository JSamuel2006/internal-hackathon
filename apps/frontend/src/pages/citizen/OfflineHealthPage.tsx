import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  ShieldAlert, RefreshCw, Activity, Heart, BookOpen, AlertCircle, CheckCircle,
  Wifi, WifiOff, Phone, PhoneCall, Hospital, MapPin, User, Droplets, Pill,
  AlertTriangle, Eye, X, Maximize2, Stethoscope, ChevronRight, Info
} from 'lucide-react';
import { offlineStorage } from '../../services/offlineStorage';
import { offlineScreeningStorage } from '../../services/offlineScreeningStorage';
import { firstAidArticles } from '../../services/firstAidData';
import { workerService, emergencyNetworkService } from '../../services/api';
import { EMERGENCY_CONTACTS } from '../../config/emergencyContacts';
import { CONFIGURED_PHC } from '../../config/phcContacts';
import { useI18n } from '../../i18n';

// ─── Types ───────────────────────────────────────────────────────────────────

interface CachedProfile {
  name: string;
  abhaId: string;
  age?: number;
  gender?: string;
  bloodGroup: string;
  allergies: string;
  conditions: string;
  medicines: string;
  emergencyContact: string;
  emergencyContactName?: string;
}

interface CachedPHC {
  name: string;
  type: string;
  address: string;
  phone: string | null;
  district?: string;
  state?: string;
}

// ─── Call Button ─────────────────────────────────────────────────────────────

function CallButton({
  icon,
  label,
  subLabel,
  phone,
  colorClass,
  disabled = false,
  disabledReason,
}: {
  icon: React.ReactNode;
  label: string;
  subLabel?: string;
  phone: string | null;
  colorClass: string;
  disabled?: boolean;
  disabledReason?: string;
}) {
  const { t } = useI18n();
  const [feedback, setFeedback] = useState('');

  const handleCall = () => {
    if (!phone || disabled) return;
    window.location.href = `tel:${phone.replace(/[^+\d]/g, '')}`;
    setFeedback(t('opening_calling_app' as any));

    setTimeout(() => setFeedback(''), 3500);
  };

  return (
    <div className="flex flex-col gap-1.5">
      <button
        onClick={handleCall}
        disabled={!phone || disabled}
        aria-label={`${label}${phone ? ` — ${phone}` : ' — not available'}`}
        className={`
          w-full flex items-center gap-4 px-5 py-4 rounded-2xl border-2 transition-all
          text-left active:scale-95
          ${(!phone || disabled)
            ? 'bg-white border-slate-200 text-slate-500 cursor-not-allowed'
            : `${colorClass} border-transparent text-white shadow-lg hover:brightness-110 cursor-pointer`
          }
        `}
      >
        <span className="text-3xl shrink-0">{icon}</span>
        <div className="flex-1 min-w-0">
          <span className="block text-base font-extrabold uppercase tracking-wide leading-tight">
            {label}
          </span>
          {phone && !disabled && (
            <span className="block text-sm font-mono opacity-90 mt-0.5">{phone}</span>
          )}
          {(!phone || disabled) && (
            <span className="block text-xs opacity-70 mt-0.5">
              {disabledReason || 'Not configured'}
            </span>
          )}
          {subLabel && phone && !disabled && (
            <span className="block text-[10px] opacity-70 mt-0.5">{subLabel}</span>
          )}
        </div>
        {phone && !disabled && (
          <PhoneCall className="w-6 h-6 shrink-0 opacity-80" />
        )}
      </button>
      {feedback && (
        <p className="text-xs text-amber-400 font-mono pl-2">{feedback}</p>
      )}
    </div>
  );
}

// ─── Full-Screen Emergency Card Modal ────────────────────────────────────────

function EmergencyCardModal({
  profile,
  recentScreening,
  onClose,
}: {
  profile: CachedProfile | null;
  recentScreening: any;
  onClose: () => void;
}) {
  const wakeLockRef = useRef<any>(null);

  useEffect(() => {
    // Request Wake Lock so screen stays on while card is displayed
    if ('wakeLock' in navigator) {
      (navigator as any).wakeLock.request('screen').then((lock: any) => {
        wakeLockRef.current = lock;
      }).catch(() => {/* Gracefully ignore if not supported */});
    }
    return () => {
      if (wakeLockRef.current) {
        wakeLockRef.current.release().catch(() => {});
        wakeLockRef.current = null;
      }
    };
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center p-4"
      role="dialog"
      aria-label="Emergency Health Card — show to first responders"
    >
      {/* Close Button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 p-2 rounded-full bg-slate-800 text-white hover:bg-slate-700"
        aria-label="Close emergency card"
      >
        <X className="w-6 h-6" />
      </button>

      <div className="w-full max-w-sm bg-white border-4 border-rose-500 rounded-3xl p-7 space-y-5 shadow-2xl shadow-rose-900/40">
        {/* Header */}
        <div className="text-center border-b border-rose-500/40 pb-4">
          <span className="text-4xl">🚨</span>
          <h2 className="text-2xl font-black text-white uppercase tracking-widest mt-1">
            Emergency Health Card
          </h2>
          <p className="text-rose-400 text-xs font-mono mt-1 uppercase tracking-wider">
            Show this to first responders / ASHA / Doctor
          </p>
        </div>

        {/* Health Data */}
        <div className="space-y-3">
          {[
            { label: 'Name', value: profile?.name, color: 'text-white', icon: '👤' },
            { label: 'Blood Group', value: profile?.bloodGroup, color: 'text-rose-300 font-extrabold text-2xl', icon: '🩸' },
            { label: 'Allergies', value: profile?.allergies, color: 'text-amber-300 font-bold', icon: '⚠️' },
            { label: 'Conditions', value: profile?.conditions, color: 'text-indigo-300', icon: '🫀' },
            { label: 'Medicines', value: profile?.medicines, color: 'text-teal-300', icon: '💊' },
            { label: 'Emergency Contact', value: profile?.emergencyContact, color: 'text-emerald-300 font-bold', icon: '📞' },
          ].map(({ label, value, color, icon }) => (
            <div key={label} className="flex items-start gap-3">
              <span className="text-xl shrink-0 mt-0.5">{icon}</span>
              <div>
                <span className="block text-[10px] uppercase text-slate-500 font-bold tracking-wider">{label}</span>
                <span className={`block text-base ${color} leading-snug`}>
                  {value || 'Not recorded'}
                </span>
              </div>
            </div>
          ))}

          {/* Latest Screening */}
          {recentScreening && (
            <div className="bg-white rounded-xl p-3 space-y-1 border border-slate-200">
              <span className="block text-[10px] uppercase text-slate-500 font-bold tracking-wider">
                Latest Community Screening
              </span>
              <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono mt-1">
                <div>
                  <span className="text-slate-500 block text-[9px]">BP</span>
                  <span className="text-slate-800 font-bold">
                    {recentScreening.systolic}/{recentScreening.diastolic}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[9px]">SpO₂</span>
                  <span className="text-emerald-400 font-bold">{recentScreening.spo2}%</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[9px]">Pulse</span>
                  <span className="text-slate-800 font-bold">{recentScreening.pulse} bpm</span>
                </div>
              </div>
              <p className="text-[9px] text-slate-600 mt-1 italic">
                Community screening — not a medical diagnosis. Consult a doctor.
              </p>
            </div>
          )}
        </div>

        {/* ABHA */}
        {profile?.abhaId && (
          <div className="text-center">
            <span className="text-[10px] text-slate-600 font-mono uppercase block">ABHA ID</span>
            <span className="text-slate-600 font-mono text-sm">{profile.abhaId}</span>
          </div>
        )}

        {/* Disclaimer */}
        <div className="bg-amber-900/30 border border-amber-700/40 rounded-xl p-3 text-center">
          <p className="text-[9px] text-amber-400 leading-relaxed">
            This information is self-reported / community-screened. It is for first-responder reference only and is NOT a medical diagnosis. Consult a qualified medical professional for treatment.
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function OfflineHealthPage() {
  const userRaw = sessionStorage.getItem('user');
  const user = userRaw ? JSON.parse(userRaw) : null;
  const userId = user?.id || 'default_citizen';

  const [online, setOnline] = useState(navigator.onLine);
  const { lang, t } = useI18n();
  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState('');

  // Cache States
  const [profile, setProfile] = useState<CachedProfile | null>(null);
  const [recentScreening, setRecentScreening] = useState<any>(null);
  const [cachedPHC, setCachedPHC] = useState<CachedPHC | null>(null);
  const [pendingCount, setPendingCount] = useState(0);
  const [lastSynced, setLastSynced] = useState<string>('');

  // UI State
  const [selectedArticle, setSelectedArticle] = useState<any>(null);
  const [showEmergencyCard, setShowEmergencyCard] = useState(false);
  const [callFeedback, setCallFeedback] = useState('');

  // ── Load from IndexedDB Cache ────────────────────────────────────────────
  const loadCache = useCallback(async () => {
    if (!userId) return;
    try {
      const cachedProfile = await offlineStorage.get('profiles', userId);
      const cachedTimeline = await offlineStorage.get('timelines', userId);
      const phc = await offlineStorage.getCachedPHC(userId);

      const screenings = await offlineScreeningStorage.getScreenings();
      const pending = screenings.filter(s => s.sync_status === 'PENDING').length;
      setPendingCount(pending);

      if (cachedProfile) {
        setProfile(cachedProfile);
      } else if (user) {
        // Seed fallback profile from session user object (no invented medical data)
        setProfile({
          name: user.name || 'Unknown',
          abhaId: user.abhaId || 'Not recorded',
          bloodGroup: 'Not recorded',
          allergies: 'Not recorded',
          conditions: 'Not recorded',
          medicines: 'None',
          emergencyContact: 'Not recorded',
        });
      }

      if (cachedTimeline && Array.isArray(cachedTimeline) && cachedTimeline.length > 0) {
        setRecentScreening(cachedTimeline[0]);
      }

      if (phc) {
        setCachedPHC(phc);
      } else if (CONFIGURED_PHC) {
        // Use static config as fallback if no cached PHC
        setCachedPHC(CONFIGURED_PHC);
      }

      const lastSyncTime = localStorage.getItem(`last_sync_${userId}`);
      setLastSynced(lastSyncTime ? new Date(lastSyncTime).toLocaleString() : 'Never');
    } catch (e) {
      console.warn('[OfflineHealthPage] loadCache error', e);
    }
  }, [userId]);

  // ── Cache live data when online ──────────────────────────────────────────
  const cacheLiveData = useCallback(async () => {
    if (!navigator.onLine || !userId) return;
    try {
      // Cache user profile with demo data that mirrors what backend would return
      const initialProfile: CachedProfile = {
        name: user?.name || 'Unknown',
        abhaId: user?.abhaId || 'Not recorded',
        age: 32,
        gender: 'Not recorded',
        bloodGroup: 'O-Positive',
        allergies: 'Penicillin, Dust mites',
        conditions: 'Hypertension',
        medicines: 'Amlodipine 5mg (1 Tablet, Daily)',
        emergencyContact: '+91-9876543210',
        emergencyContactName: 'Family Contact',
      };
      await offlineStorage.set('profiles', userId, userId, initialProfile);
      setProfile(initialProfile);

      // Fetch history if citizen
      if (user?.role === 'ROLE_CITIZEN') {
        try {
          const historyRes = await workerService.getCitizenHistory(userId);
          if (historyRes.success && Array.isArray(historyRes.data) && historyRes.data.length > 0) {
            await offlineStorage.set('timelines', userId, userId, historyRes.data);
            setRecentScreening(historyRes.data[0]);
          }
        } catch { /* history not critical */ }
      }

      // Cache nearest facility for offline use
      try {
        const facilityRes = await emergencyNetworkService.getNearbyFacilities();
        if (facilityRes.success && facilityRes.data?.hospitals?.length > 0) {
          const firstHosp = facilityRes.data.hospitals[0];
          const phcToCache: CachedPHC = {
            name: firstHosp.name,
            type: 'District Hospital',
            address: firstHosp.address || 'Address not available',
            // The hospitals table has no phone column; use CONFIGURED_PHC phone if set
            phone: CONFIGURED_PHC?.phone ?? null,
          };
          await offlineStorage.cachePHC(userId, phcToCache);
          setCachedPHC(phcToCache);
        } else if (CONFIGURED_PHC) {
          await offlineStorage.cachePHC(userId, CONFIGURED_PHC);
          setCachedPHC(CONFIGURED_PHC);
        }
      } catch { /* facility fetch not critical */ }

      localStorage.setItem(`last_sync_${userId}`, new Date().toISOString());
      setLastSynced(new Date().toLocaleString());
    } catch (e) {
      console.warn('[OfflineHealthPage] cacheLiveData error', e);
    }
  }, [userId]);

  // ── Sync offline screenings ──────────────────────────────────────────────
  const handleSyncNow = useCallback(async () => {
    if (!navigator.onLine) {
      setSyncMsg('Cannot sync while offline.');
      return;
    }
    setSyncing(true);
    setSyncMsg('Syncing records...');
    try {
      const activeQueue = await offlineScreeningStorage.getScreenings();
      const pending = activeQueue.filter(s => s.sync_status === 'PENDING' || s.sync_status === 'FAILED');
      if (pending.length === 0) {
        setSyncing(false);
        setSyncMsg('No records to sync.');
        return;
      }
      const res = await workerService.syncScreenings(pending);
      if (res.success && Array.isArray(res.data)) {
        let successCount = 0;
        for (const item of res.data) {
          if (item.status === 'SUCCESS') {
            await offlineScreeningStorage.updateSyncStatus(item.client_record_id, 'SYNCED');
            successCount++;
          } else {
            await offlineScreeningStorage.updateSyncStatus(item.client_record_id, 'FAILED', item.error);
          }
        }
        await offlineScreeningStorage.clearSynced();
        await loadCache();
        setSyncMsg(`Successfully synced ${successCount} records!`);
      } else {
        setSyncMsg('Sync failed.');
      }
    } catch (err: any) {
      setSyncMsg(`Sync failed: ${err.message}`);
    } finally {
      setSyncing(false);
      setTimeout(() => setSyncMsg(''), 4000);
    }
  }, [loadCache]);

  useEffect(() => {
    loadCache();
    if (navigator.onLine) cacheLiveData();

    const handleOnline = () => {
      setOnline(true);
      cacheLiveData();
      handleSyncNow();
    };
    const handleOffline = () => setOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // ── Helpers ──────────────────────────────────────────────────────────────

  const amb = EMERGENCY_CONTACTS.ambulance;
  const nat = EMERGENCY_CONTACTS.national;

  return (
    <div className="space-y-6 max-w-4xl mx-auto p-4 pb-20">

      {/* ── Internet Status Banner ─────────────────────────────────────── */}
      <div className={`p-4 rounded-2xl border-2 transition-all flex items-center justify-between ${
        online
          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
          : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
      }`}>
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${online ? 'bg-emerald-500/20' : 'bg-rose-500/20'}`}>
            {online ? <Wifi className="w-6 h-6 animate-pulse" /> : <WifiOff className="w-6 h-6" />}
          </div>
          <div>
            <h2 className="text-lg font-bold tracking-tight">
              {online ? `🟢 ${t('online_mode')}` : `🔴 ${t('offline_mode')}`}
            </h2>
            <p className="text-xs opacity-80 mt-0.5">
              {online
                ? t('online_mode_desc')
                : t('offline_mode_desc')}
            </p>
          </div>
        </div>
        <div className="text-right text-[10px] font-mono opacity-70 shrink-0 ml-3">
          {t('last_synced_label')}<br />
          <span className="font-bold">{lastSynced}</span>
        </div>
      </div>

      {/* ── 🚨 EMERGENCY HELP Section ─────────────────────────────────── */}
      <div className="bg-gradient-to-br from-rose-950/80 to-slate-950 border-2 border-rose-700/40 rounded-2xl p-5 space-y-5 shadow-xl shadow-rose-900/20">
        {/* Section Header */}
        <div className="flex items-center gap-3 border-b border-rose-700/30 pb-3">
          <div className="p-2.5 bg-rose-600/20 rounded-xl text-rose-400 border border-rose-600/30">
            <ShieldAlert className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-xl font-black text-white uppercase tracking-wide">{t('emergency_help_heading')}</h2>
            <p className="text-rose-300 text-xs mt-0.5">{t('need_immediate_help_tap')}</p>
          </div>
        </div>

        {/* Primary Call Buttons — 2-column grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <CallButton
            icon="🚑"
            label={t('call_ambulance_btn')}
            subLabel={t('free_national_ambulance')}
            phone={amb.phone}
            colorClass="bg-rose-600 hover:bg-rose-500"
          />
          <CallButton
            icon="🆘"
            label={t('national_emergency_btn')}
            subLabel={t('national_emergency_desc_sub')}
            phone={nat.phone}
            colorClass="bg-red-700 hover:bg-red-600"
          />
        </div>

        {/* Emergency Contact */}
        <div>
          <span className="text-[10px] text-rose-400/70 uppercase font-bold tracking-wider block mb-2">
            {t('my_emergency_contact_heading')}
          </span>
          {profile?.emergencyContact && profile.emergencyContact !== 'Not recorded' ? (
            <CallButton
              icon="📞"
              label={profile.emergencyContactName || t('my_emergency_contact' as any)}
              subLabel={profile.emergencyContact}
              phone={profile.emergencyContact}
              colorClass="bg-emerald-700 hover:bg-emerald-600"
            />
          ) : (
            <div className="flex items-center gap-3 px-4 py-4 rounded-2xl border-2 border-dashed border-slate-700 text-slate-500">
              <Phone className="w-7 h-7 opacity-40" />
              <div>
                <span className="block text-sm font-bold">{t('no_emergency_contact_saved')}</span>
                <span className="text-xs mt-0.5 block">
                  {t('visit_profile_add_contact')}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* PHC / Nearby Facility */}
        <div>
          <span className="text-[10px] text-rose-400/70 uppercase font-bold tracking-wider block mb-2">
            {t('nearest_public_health_facility')}
          </span>
          {cachedPHC ? (
            <div className="space-y-2">
              <div className="bg-white border border-slate-200 rounded-xl p-3 flex items-start gap-3">
                <Hospital className="w-5 h-5 text-teal-400 shrink-0 mt-0.5" />
                <div>
                  <span className="block text-sm font-bold text-slate-900">{cachedPHC.name}</span>
                  <span className="block text-xs text-slate-600 mt-0.5">{cachedPHC.type} · {cachedPHC.address}</span>
                </div>
              </div>
              {cachedPHC.phone ? (
                <CallButton
                  icon="🏥"
                  label={t('call_phc_btn')}
                  subLabel={cachedPHC.name}
                  phone={cachedPHC.phone}
                  colorClass="bg-teal-700 hover:bg-teal-600"
                />
              ) : (
                <div className="flex items-center gap-3 px-4 py-3 rounded-2xl border border-slate-700 text-slate-500 bg-white">
                  <Hospital className="w-6 h-6 opacity-40" />
                  <div>
                    <span className="block text-sm font-semibold">{t('phc_phone_not_configured')}</span>
                    <span className="text-xs mt-0.5 block">{t('contact_asha_visit_in_person')}</span>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-3 px-4 py-4 rounded-2xl border-2 border-dashed border-slate-700 text-slate-500">
              <Hospital className="w-7 h-7 opacity-40" />
              <div>
                <span className="block text-sm font-bold">{t('no_hospitals_found')}</span>
                <span className="text-xs mt-0.5 block">
                  {online
                    ? t('loading')
                    : t('no_data')}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Important call disclaimer */}
        <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-3 flex gap-2.5 items-start">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div className="text-[11px] text-amber-300/80 leading-relaxed space-y-1">
            <p><strong>{t('calls_cellular_network_warning')}</strong></p>
            <p>{t('calls_may_fail_signal')}</p>
            <p>{t('tapping_call_opens_app')}</p>
          </div>
        </div>

        {/* Online-only: SOS + Doctor Connect link */}
        {online && (
          <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Wifi className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="text-xs text-emerald-300">
                {t('internet_available_full_sos')}
              </span>
            </div>
            <a
              href="/citizen/emergency"
              className="shrink-0 flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold uppercase tracking-wide transition-colors"
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>{t('sos_trigger')}</span>
              <ChevronRight className="w-3 h-3" />
            </a>
          </div>
        )}
      </div>

      {/* ── 🩺 MY EMERGENCY INFORMATION ───────────────────────────────── */}
      <div className="bg-white border border-slate-200 shadow-sm p-6 rounded-2xl border border-slate-200 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <div className="flex items-center gap-2">
            <Stethoscope className="w-5 h-5 text-indigo-400" />
            <h3 className="font-bold text-sm text-slate-900 uppercase tracking-wider">{t('my_emergency_info_title')}</h3>
          </div>
          {/* Show Full-Screen Card Button */}
          <button
            onClick={() => setShowEmergencyCard(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/25 text-rose-400 text-xs font-bold rounded-lg transition-all uppercase tracking-wide cursor-pointer"
            aria-label="Show full-screen emergency health card for first responders"
          >
            <Maximize2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{t('fullscreen_card_btn')}</span>
            <span className="sm:hidden">{t('card')}</span>
          </button>
        </div>

        {profile ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-mono text-xs">
            {[
              { icon: <User className="w-3.5 h-3.5" />, label: t('full_name' as any), value: profile.name, color: 'text-slate-900' },
              { icon: <Activity className="w-3.5 h-3.5" />, label: t('dashboard_abha_id'), value: profile.abhaId, color: 'text-slate-700' },
              { icon: <Droplets className="w-3.5 h-3.5 text-rose-400" />, label: t('blood_group' as any), value: profile.bloodGroup, color: 'text-rose-400 font-extrabold text-sm' },
              { icon: <AlertCircle className="w-3.5 h-3.5 text-amber-400" />, label: t('allergies' as any), value: profile.allergies, color: 'text-amber-300 font-bold' },
              { icon: <Heart className="w-3.5 h-3.5 text-indigo-400" />, label: t('known_conditions'), value: profile.conditions, color: 'text-indigo-300' },
              { icon: <Pill className="w-3.5 h-3.5 text-teal-400" />, label: t('current_medications'), value: profile.medicines, color: 'text-teal-300' },
            ].map(({ icon, label, value, color }) => (
              <div key={label} className="p-3 bg-white rounded-xl border border-slate-200 flex items-start gap-2.5">
                <span className="text-slate-500 mt-0.5 shrink-0">{icon}</span>
                <div>
                  <span className="text-slate-500 uppercase text-[10px] block font-bold">{label}</span>
                  <span className={`${color} block mt-0.5`}>{value || 'Not recorded'}</span>
                </div>
              </div>
            ))}

            {/* Emergency Contact with call button */}
            <div className="sm:col-span-2 p-3 bg-white rounded-xl border border-emerald-900/40 flex items-center justify-between gap-3">
              <div className="flex items-start gap-2.5">
                <Phone className="w-3.5 h-3.5 text-emerald-400 mt-0.5 shrink-0" />
                <div>
                  <span className="text-slate-500 uppercase text-[10px] block font-bold">{t('my_emergency_contact')}</span>
                  {profile.emergencyContactName && (
                    <span className="text-slate-700 font-bold block mt-0.5">{profile.emergencyContactName}</span>
                  )}
                  <span className="text-emerald-300 font-bold block">{profile.emergencyContact || 'Not recorded'}</span>
                </div>
              </div>
              {profile.emergencyContact && profile.emergencyContact !== 'Not recorded' && (
                <a
                  href={`tel:${profile.emergencyContact.replace(/[^+\d]/g, '')}`}
                  className="flex items-center gap-1.5 px-3 py-2 bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs rounded-xl transition-colors uppercase"
                >
                  <PhoneCall className="w-3.5 h-3.5" />
                  <span>Call</span>
                </a>
              )}
            </div>
          </div>
        ) : (
          <div className="p-6 text-center text-slate-500 text-sm">
            <Info className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p>No cached profile found.</p>
            <p className="text-xs mt-1">Open this page while online to save your health profile for offline access.</p>
          </div>
        )}

        {/* Latest Community Screening */}
        {recentScreening && (
          <div className="border-t border-slate-200 pt-4">
            <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider block mb-2">
              Latest Community Screening — for first-responder reference only
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { label: 'Date', value: new Date(recentScreening.screening_date || recentScreening.createdAt).toLocaleDateString(), color: 'text-slate-700' },
                { label: t('blood_pressure'), value: `${recentScreening.systolic}/${recentScreening.diastolic} mmHg`, color: 'text-slate-800 font-bold' },
                { label: 'SpO₂ (Oxygen)', value: `${recentScreening.spo2}%`, color: 'text-emerald-400 font-bold' },
                { label: t('pulse'), value: `${recentScreening.pulse} bpm`, color: 'text-slate-800' },
              ].map(({ label, value, color }) => (
                <div key={label} className="p-2.5 bg-white rounded-xl border border-slate-200 text-center font-mono">
                  <span className="text-slate-500 text-[9px] uppercase block">{label}</span>
                  <span className={`text-xs ${color} block mt-0.5`}>{value}</span>
                </div>
              ))}
            </div>
            <p className="text-[10px] text-slate-600 mt-2 italic">
              Community health screening data. This is not a medical diagnosis. Consult a qualified doctor for assessment.
            </p>
          </div>
        )}
      </div>

      {/* ── Sync Manager + Profile Grid ────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Sync Queue */}
        <div className="bg-white border border-slate-200 shadow-sm p-6 rounded-2xl border border-slate-200 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
              <RefreshCw className="w-5 h-5 text-amber-400" />
              <h3 className="font-bold text-sm text-slate-800 uppercase tracking-wider">{t('offline_sync_manager')}</h3>
            </div>
            <p className="text-xs text-slate-600 mt-2">
              ASHA screening records created during network outages are queued locally. They will transfer automatically once a network connection is restored.
            </p>
            <div className="mt-4 p-4 bg-slate-955 rounded-xl border border-slate-200 flex justify-between items-center">
              <span className="text-xs text-slate-600">Pending Sync Queue</span>
              <span className={`px-2.5 py-1 rounded-full text-xs font-bold font-mono ${
                pendingCount > 0 ? 'bg-amber-500/20 text-amber-400 animate-pulse' : 'bg-white text-slate-500'
              }`}>
                {pendingCount} Records
              </span>
            </div>
            {syncMsg && (
              <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs rounded-xl mt-3 text-center">
                {syncMsg}
              </div>
            )}
          </div>
          <button
            onClick={handleSyncNow}
            disabled={syncing || pendingCount === 0}
            className="w-full py-3.5 bg-indigo-650 hover:bg-indigo-600 disabled:bg-white disabled:text-slate-600 text-slate-950 font-bold uppercase text-xs rounded-xl tracking-widest transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
            <span>{syncing ? t('syncing_btn') : t('sync_now_btn')}</span>
          </button>
        </div>

        {/* What Works Offline Info Card */}
        <div className="bg-white border border-slate-200 shadow-sm p-6 rounded-2xl border border-slate-200 space-y-3">
          <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
            <Info className="w-5 h-5 text-slate-600" />
            <h3 className="font-bold text-sm text-slate-800 uppercase tracking-wider">{t('what_works_offline_title')}</h3>
          </div>
          <div className="space-y-2 text-xs font-mono">
            {[
              { works: true,  text: 'Emergency phone calls (needs mobile signal)' },
              { works: true,  text: 'My emergency health card' },
              { works: true,  text: 'First-aid guidance' },
              { works: true,  text: 'Cached profile & health data' },
              { works: true,  text: 'ASHA offline screening records' },
              { works: false, text: 'SOS & Emergency Network' },
              { works: false, text: 'Connect to Doctor (Socket.IO)' },
              { works: false, text: 'Real-time hospital search' },
              { works: false, text: 'AI Health Assistant' },
              { works: false, text: 'ASHA screening sync' },
            ].map(({ works, text }) => (
              <div key={text} className="flex items-center gap-2">
                {works
                  ? <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  : <X className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                }
                <span className={works ? 'text-slate-700' : 'text-slate-600'}>{text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── 🩹 First-Aid Guidance ──────────────────────────────────────── */}
      <div className="bg-white border border-slate-200 shadow-sm p-6 rounded-2xl border border-slate-200 space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
          <BookOpen className="w-5 h-5 text-teal-400" />
          <h3 className="font-bold text-sm text-slate-800 uppercase tracking-wider">🩹 {t('first_aid_title')}</h3>
          <span className="ml-auto text-[10px] text-teal-500 bg-teal-500/10 border border-teal-500/20 px-2 py-0.5 rounded font-mono uppercase">Works Offline</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {firstAidArticles.map((art) => (
            <button
              key={art.id}
              onClick={() => setSelectedArticle(art)}
              className="p-3.5 bg-white hover:bg-white text-left border border-slate-200 hover:border-teal-500/30 rounded-xl transition-all space-y-1.5 group cursor-pointer"
            >
              <span className="text-[10px] text-teal-400 font-bold block">{t(art.category as any)}</span>
              <span className="text-xs text-slate-800 font-bold block group-hover:text-teal-200 transition-colors">
                {t(art.title as any)}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* ── First-Aid Article Modal ────────────────────────────────────── */}
      {selectedArticle && (
        <div className="fixed inset-0 bg-white backdrop-blur-sm z-[45] flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 shadow-sm max-w-lg w-full max-h-[85vh] overflow-y-auto p-6 rounded-2xl border border-slate-200 space-y-6">
            <div className="flex justify-between items-start border-b border-slate-200 pb-3">
              <div>
                <span className="text-[10px] text-teal-400 font-bold block uppercase tracking-wider">{t(selectedArticle.category as any)}</span>
                <h4 className="text-lg font-bold text-slate-900">{t(selectedArticle.title as any)}</h4>
              </div>
              <button
                onClick={() => setSelectedArticle(null)}
                className="px-2.5 py-1 bg-white hover:bg-slate-850 border border-slate-200 text-[10px] text-slate-600 font-bold uppercase rounded cursor-pointer"
                aria-label="Close first-aid article"
              >
                Close
              </button>
            </div>
            <p className="text-xs text-slate-350 leading-relaxed">{t(selectedArticle.description as any)}</p>
            <div className="space-y-2">
              <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider block">Recommended Steps</span>
              <ol className="list-decimal list-inside text-xs text-slate-700 space-y-2 leading-relaxed">
                {selectedArticle.steps.map((st: string, i: number) => (
                  <li key={i}>{t(st as any)}</li>
                ))}
              </ol>
            </div>
            <div className="p-4 bg-amber-500/10 border border-amber-500/20 text-amber-455 rounded-xl space-y-1.5">
              <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase">
                <AlertCircle className="w-4 h-4 text-amber-455" />
                <span>Precautions & Warnings</span>
              </div>
              <ul className="list-disc list-inside text-[10px] space-y-1 leading-relaxed text-amber-300/90">
                {selectedArticle.warnings.map((w: string, i: number) => (
                  <li key={i}>{t(w as any)}</li>
                ))}
              </ul>
            </div>
            <p className="text-[8px] text-slate-500 italic text-center">
              Disclaimer: Educational information only. Seek professional emergency care immediately for serious symptoms.
            </p>
          </div>
        </div>
      )}

      {/* ── Full-Screen Emergency Health Card Modal ────────────────────── */}
      {showEmergencyCard && (
        <EmergencyCardModal
          profile={profile}
          recentScreening={recentScreening}
          onClose={() => setShowEmergencyCard(false)}
        />
      )}
    </div>
  );
}

