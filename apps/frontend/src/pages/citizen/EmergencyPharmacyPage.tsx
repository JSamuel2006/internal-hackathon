/**
 * EmergencyPharmacyPage.tsx
 * Phase C — Citizen view: Choose nearby pharmacy & request emergency assistance
 *
 * Safety:
 *  - No medication is ever recommended or prescribed here
 *  - Pharmacist makes ALL clinical decisions
 *  - Patient is always advised to call 112 for life-threatening emergencies
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  MapPin,
  ShieldAlert,
  CheckCircle,
  AlertCircle,
  Clock,
  PhoneCall,
  RefreshCcw,
  ArrowRight,
  Package,
  AlertTriangle,
} from 'lucide-react';
import { useParams, Link } from 'react-router-dom';
import { emergencyNetworkService } from '../../services/api';

// ─── Types ────────────────────────────────────────────────────

interface Pharmacy {
  id: string;
  name: string;
  address?: string;
  distanceKm?: number;
  emergencyAvailable: boolean;
}

interface PharmacyAlertStatus {
  alertId: string;
  pharmacyId: string;
  pharmacyName: string;
  status: string;
  notifiedAt: string;
  acknowledgedAt?: string;
  resolvedAt?: string;
}

const STATUS_LABELS: Record<string, { label: string; color: string; desc: string }> = {
  ALERTED:          { label: 'Notified',      color: 'text-amber-400',   desc: 'Pharmacy has been notified. Awaiting pharmacist review.' },
  ACKNOWLEDGED:     { label: 'Acknowledged',  color: 'text-sky-400',     desc: 'Pharmacist is reviewing your request.' },
  PREPARING:        { label: 'Preparing',     color: 'text-violet-400',  desc: 'Pharmacist is preparing assistance.' },
  ASSISTANCE_READY: { label: '✓ Ready',       color: 'text-emerald-400', desc: 'Head to the pharmacy — assistance is ready.' },
  REJECTED:         { label: 'Declined',      color: 'text-slate-600',   desc: 'Pharmacy unable to assist. Try another or call 112.' },
  ESCALATED:        { label: '⚠ Escalated',   color: 'text-rose-400',    desc: 'Pharmacist recommends immediate emergency care. Call 112 now.' },
  RESOLVED:         { label: 'Resolved',      color: 'text-slate-500',   desc: 'Assistance completed.' },
};

// ─── Helpers ──────────────────────────────────────────────────

function SafetyCallout() {
  return (
    <div className="flex items-start gap-3 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30">
      <PhoneCall className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
      <div>
        <p className="text-rose-300 font-bold text-xs uppercase tracking-wider mb-0.5">
          Life-Threatening Emergency? Call 112 First.
        </p>
        <p className="text-slate-600 text-[11px] leading-relaxed">
          Pharmacy assistance is for non-life-threatening situations. If the patient is unconscious,
          cannot breathe, or is in cardiac arrest — <strong className="text-rose-300">call 112 immediately</strong>.
        </p>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const meta = STATUS_LABELS[status] || { label: status, color: 'text-slate-600', desc: '' };
  return (
    <div>
      <span className={`font-bold text-sm ${meta.color}`}>{meta.label}</span>
      {meta.desc && <p className="text-slate-600 text-[11px] mt-0.5">{meta.desc}</p>}
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────

export default function EmergencyPharmacyPage() {
  // sessionId comes from the URL: /citizen/emergency/:sessionId/pharmacy
  const { sessionId } = useParams<{ sessionId: string }>();

  const [step, setStep] = useState<'choose' | 'sent'>('choose');
  const [pharmacies, setPharmacies] = useState<Pharmacy[]>([]);
  const [pharmacyLoading, setPharmacyLoading] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState('');
  const [alertStatuses, setAlertStatuses] = useState<PharmacyAlertStatus[]>([]);
  const [statusLoading, setStatusLoading] = useState(false);

  // Fetch nearby pharmacies
  useEffect(() => {
    (async () => {
      setPharmacyLoading(true);
      try {
        // Use demo coords — production would get from geolocation API
        const res = await emergencyNetworkService.getNearbyEmergencyPharmacies(18.5204, 73.8567, 5);
        if (res.success) setPharmacies(res.data || []);
      } catch {
        // If endpoint fails, show empty list gracefully
        setPharmacies([]);
      } finally {
        setPharmacyLoading(false);
      }
    })();
  }, []);

  // Poll alert statuses if we already sent one
  const fetchStatuses = useCallback(async () => {
    if (!sessionId) return;
    setStatusLoading(true);
    try {
      const res = await emergencyNetworkService.getSessionPharmacyStatus(sessionId);
      if (res.success) setAlertStatuses(res.data || []);
    } catch {
      /* non-fatal */
    } finally {
      setStatusLoading(false);
    }
  }, [sessionId]);

  // On mount, check if alerts already exist for this session
  useEffect(() => {
    fetchStatuses();
  }, [fetchStatuses]);

  // Poll every 20 seconds when on "sent" step
  useEffect(() => {
    if (step !== 'sent') return;
    const interval = setInterval(fetchStatuses, 20000);
    return () => clearInterval(interval);
  }, [step, fetchStatuses]);

  // Jump to sent step if existing alerts found
  useEffect(() => {
    if (alertStatuses.length > 0 && step === 'choose') {
      setStep('sent');
    }
  }, [alertStatuses]);

  const handleSend = async () => {
    if (!selectedId || !sessionId) return;
    setSending(true);
    setSendError('');
    try {
      const res = await emergencyNetworkService.sendPharmacyAlert(sessionId, selectedId);
      if (res.success) {
        setStep('sent');
        fetchStatuses();
      } else {
        setSendError(res.message || 'Failed to send request');
      }
    } catch (e: any) {
      setSendError(e?.response?.data?.message || 'Failed to send request. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const selectedPharmacy = pharmacies.find((p) => p.id === selectedId);

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6 font-mono text-sm">
      {/* Header */}
      <div className="border-b border-slate-200 pb-4">
        <h2 className="text-lg font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
          <Package className="w-5 h-5 text-violet-400" />
          Emergency Pharmacy Assistance
        </h2>
        <p className="text-[10px] text-slate-500 mt-1">
          Request first-aid assistance from a nearby participating pharmacy
        </p>
        {sessionId && (
          <p className="text-[10px] text-slate-600 mt-0.5">Session: {sessionId}</p>
        )}
      </div>

      {/* Safety callout */}
      <SafetyCallout />

      {/* ── Step 1: Choose pharmacy ── */}
      {step === 'choose' && (
        <section className="space-y-4">
          <div>
            <h3 className="text-[10px] text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <MapPin className="w-3 h-3" />
              Nearby Participating Pharmacies
            </h3>

            {pharmacyLoading ? (
              <div className="flex items-center gap-2 text-slate-500 text-xs py-8 justify-center">
                <RefreshCcw className="w-4 h-4 animate-spin" />
                Locating nearby pharmacies…
              </div>
            ) : pharmacies.length === 0 ? (
              <div className="text-center py-8 text-slate-600 text-xs">
                <MapPin className="w-6 h-6 mx-auto mb-2 text-slate-700" />
                No participating pharmacies found nearby.
                <br />Please call 112 for emergency assistance.
              </div>
            ) : (
              <div className="space-y-2">
                {pharmacies.map((p) => (
                  <button
                    key={p.id}
                    id={`pharmacy-select-${p.id}`}
                    onClick={() => setSelectedId(p.id)}
                    className={`w-full text-left p-4 rounded-xl border transition-all ${
                      selectedId === p.id
                        ? 'border-violet-500/60 bg-violet-500/10'
                        : 'border-slate-200 bg-white hover:border-slate-700 hover:bg-white'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-slate-800 font-semibold text-sm">{p.name}</p>
                        {p.address && <p className="text-slate-500 text-[11px] mt-0.5">{p.address}</p>}
                      </div>
                      <div className="text-right flex-shrink-0">
                        {p.distanceKm !== undefined && (
                          <p className="text-emerald-400 text-[11px] font-semibold">{p.distanceKm} km away</p>
                        )}
                        {p.emergencyAvailable && (
                          <p className="text-violet-400 text-[10px] mt-0.5">Emergency ✓</p>
                        )}
                      </div>
                    </div>
                    {selectedId === p.id && (
                      <div className="mt-2 flex items-center gap-1.5 text-violet-400 text-[11px]">
                        <CheckCircle className="w-3.5 h-3.5" />
                        Selected
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {selectedPharmacy && (
            <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-3">
              <p className="text-[10px] text-slate-500 uppercase tracking-wider">You are requesting assistance from:</p>
              <p className="text-slate-800 font-bold">{selectedPharmacy.name}</p>
              <p className="text-[11px] text-amber-300 leading-relaxed">
                A pharmacist will review your emergency context and independently determine appropriate assistance.
                <strong className="text-rose-300"> No medication will be dispensed without professional assessment.</strong>
              </p>
            </div>
          )}

          {sendError && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30">
              <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
              <p className="text-rose-400 text-xs">{sendError}</p>
            </div>
          )}

          <button
            id="send-pharmacy-request"
            onClick={handleSend}
            disabled={!selectedId || sending || !sessionId}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-violet-500 text-white font-bold text-sm hover:bg-violet-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {sending ? (
              <><RefreshCcw className="w-4 h-4 animate-spin" /> Sending…</>
            ) : (
              <><ShieldAlert className="w-4 h-4" /> Send Emergency Request</>
            )}
          </button>

          {!sessionId && (
            <p className="text-amber-400 text-[11px] text-center">
              Please start an emergency session first to send a pharmacy request.
              <Link to="/citizen/emergency" className="text-violet-400 ml-1 underline">Go to Emergency Mode</Link>
            </p>
          )}
        </section>
      )}

      {/* ── Step 2: Status tracking ── */}
      {step === 'sent' && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-[10px] text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="w-3 h-3" />
              Request Status
            </h3>
            <button
              onClick={fetchStatuses}
              disabled={statusLoading}
              className="flex items-center gap-1 text-[10px] text-slate-600 hover:text-slate-700"
            >
              <RefreshCcw className={`w-3 h-3 ${statusLoading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>

          {alertStatuses.length === 0 ? (
            <div className="flex items-center gap-2 py-8 text-slate-500 justify-center">
              <RefreshCcw className="w-4 h-4 animate-spin" />
              Loading status…
            </div>
          ) : (
            <div className="space-y-3">
              {alertStatuses.map((s) => (
                <div
                  key={s.alertId}
                  className={`p-4 rounded-xl border ${
                    s.status === 'ASSISTANCE_READY'
                      ? 'border-emerald-500/40 bg-emerald-500/10'
                      : s.status === 'ESCALATED'
                      ? 'border-rose-500/40 bg-rose-500/10'
                      : 'border-slate-200 bg-white'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-slate-800 font-semibold text-sm mb-1">{s.pharmacyName}</p>
                      <StatusBadge status={s.status} />
                    </div>
                    <div className="text-right text-[10px] text-slate-500 flex-shrink-0">
                      <p>Sent: {new Date(s.notifiedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                      {s.acknowledgedAt && (
                        <p className="text-sky-400">Ack: {new Date(s.acknowledgedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                      )}
                    </div>
                  </div>

                  {s.status === 'ESCALATED' && (
                    <div className="mt-3 flex items-center gap-2 p-3 rounded-lg bg-rose-500/20 border border-rose-500/30">
                      <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                      <p className="text-rose-300 text-xs font-bold">
                        Call 112 immediately — pharmacist has escalated this case.
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Option to add another pharmacy */}
          <button
            id="add-another-pharmacy"
            onClick={() => setStep('choose')}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-slate-700 text-slate-600 text-xs hover:bg-slate-800 transition-colors"
          >
            <ArrowRight className="w-3.5 h-3.5" />
            Request from Another Pharmacy
          </button>

          {/* Back to emergency session */}
          {sessionId && (
            <div className="flex gap-2">
              <Link
                to={`/citizen/emergency/${sessionId}/doctor-chat`}
                className="flex-1 text-center py-2.5 rounded-xl border border-slate-200 text-slate-500 text-xs hover:text-slate-700 hover:bg-white transition-colors"
              >
                Doctor Chat
              </Link>
              <Link
                to="/citizen/emergency"
                className="flex-1 text-center py-2.5 rounded-xl border border-slate-200 text-slate-500 text-xs hover:text-slate-700 hover:bg-white transition-colors"
              >
                Emergency Mode
              </Link>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
