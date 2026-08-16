/**
 * PharmacyEmergencyPage.tsx
 * Phase C — ArogyaMitra Pharmacy Emergency Assistance Dashboard
 *
 * SAFETY RULES displayed in UI:
 *  - Never auto-prescribe / auto-dispense
 *  - Pharmacist makes ALL clinical decisions
 *  - AI summary is for context only — not a diagnosis
 *  - HIGH priority always shown with call-112 banner
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  AlertCircle,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  ArrowUpCircle,
  PackageOpen,
  Shield,
  RefreshCcw,
  ChevronDown,
  ChevronUp,
  Sparkles,
  PhoneCall,
} from 'lucide-react';
import { emergencyNetworkService } from '../../services/api';

// ─── Constants ────────────────────────────────────────────────

// Demo pharmacy ID — in production this comes from JWT
const DEMO_PHARMACY_ID = 'ph-001';

const PRIORITY_COLOR: Record<string, string> = {
  HIGH:   'text-rose-400 border-rose-500/40 bg-rose-500/10',
  MEDIUM: 'text-amber-400 border-amber-500/40 bg-amber-500/10',
  LOW:    'text-emerald-400 border-emerald-500/40 bg-emerald-500/10',
};

const STATUS_META: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  ALERTED:          { label: 'Awaiting Review',   icon: <AlertCircle className="w-4 h-4" />,     color: 'text-amber-400' },
  ACKNOWLEDGED:     { label: 'Acknowledged',       icon: <CheckCircle className="w-4 h-4" />,     color: 'text-sky-400' },
  PREPARING:        { label: 'Preparing',          icon: <PackageOpen className="w-4 h-4" />,     color: 'text-violet-400' },
  ASSISTANCE_READY: { label: 'Ready',              icon: <CheckCircle className="w-4 h-4" />,     color: 'text-emerald-400' },
  REJECTED:         { label: 'Rejected',           icon: <XCircle className="w-4 h-4" />,         color: 'text-slate-400' },
  ESCALATED:        { label: 'Escalated — Call 112', icon: <PhoneCall className="w-4 h-4" />,   color: 'text-rose-400' },
  RESOLVED:         { label: 'Resolved',           icon: <CheckCircle className="w-4 h-4" />,     color: 'text-slate-500' },
};

// ─── Types ────────────────────────────────────────────────────

interface PharmacyAlert {
  id: string;
  emergencyId: string;
  pharmacyId: string;
  status: string;
  assistanceDetails: string;
  pharmacistId?: string;
  notifiedAt: string;
  acknowledgedAt?: string;
  preparedAt?: string;
  rejectedAt?: string;
  escalatedAt?: string;
  resolvedAt?: string;
  classification?: { category: string; priority: string };
  symptoms?: string[];
  warnings?: string[];
  safetyNotice: string;
}

// ─── Subcomponents ────────────────────────────────────────────

function SafetyBanner() {
  return (
    <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 mb-6">
      <Shield className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
      <div>
        <p className="text-amber-400 font-bold text-xs uppercase tracking-wider mb-1">
          Pharmacist Responsibility Notice
        </p>
        <p className="text-slate-400 text-[11px] leading-relaxed">
          Each request requires your <strong className="text-amber-300">independent professional assessment</strong>. This
          system does <strong className="text-rose-400">NOT prescribe, recommend, or authorize any medication</strong>.
          AI summaries are context aids only — not diagnoses. Final decisions rest solely with the pharmacist.
        </p>
      </div>
    </div>
  );
}

function PriorityBadge({ priority }: { priority: string }) {
  return (
    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${PRIORITY_COLOR[priority] || 'text-slate-400 border-slate-700 bg-slate-800'}`}>
      {priority}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const meta = STATUS_META[status] || { label: status, icon: <Clock className="w-3 h-3" />, color: 'text-slate-400' };
  return (
    <span className={`flex items-center gap-1.5 text-[11px] font-semibold ${meta.color}`}>
      {meta.icon}
      {meta.label}
    </span>
  );
}

function TimeSince({ ts }: { ts: string }) {
  const diff = Date.now() - new Date(ts).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return <span className="text-rose-400 font-bold animate-pulse">Just now</span>;
  if (mins < 60) return <span className="text-amber-400">{mins}m ago</span>;
  const hrs = Math.floor(mins / 60);
  return <span className="text-slate-400">{hrs}h {mins % 60}m ago</span>;
}

// ─── Alert Card ───────────────────────────────────────────────

interface AlertCardProps {
  alert: PharmacyAlert;
  onAction: (alertId: string, action: string, details?: string) => Promise<void>;
  loadingAlert: string | null;
}

function AlertCard({ alert, onAction, loadingAlert }: AlertCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [assistanceInput, setAssistanceInput] = useState('');
  const [inputError, setInputError] = useState('');

  const isLoading = loadingAlert === alert.id;
  const isHigh = alert.classification?.priority === 'HIGH';

  const fetchAISummary = useCallback(async () => {
    setAiLoading(true);
    try {
      const res = await emergencyNetworkService.getPharmacyAIHandoff(DEMO_PHARMACY_ID, alert.id);
      if (res.success) setAiSummary(res.data.summary);
    } catch {
      setAiSummary('AI summary unavailable. Please review alert details directly.');
    } finally {
      setAiLoading(false);
    }
  }, [alert.id]);

  const handleAction = async (action: string) => {
    if ((action === 'preparing' || action === 'ready') && assistanceInput.length > 1000) {
      setInputError('Notes must not exceed 1000 characters');
      return;
    }
    setInputError('');
    await onAction(alert.id, action, assistanceInput.trim() || undefined);
  };

  return (
    <div className={`rounded-xl border ${isHigh ? 'border-rose-500/40 bg-rose-500/5' : 'border-slate-800 bg-slate-900/60'} overflow-hidden transition-all`}>
      {/* HIGH priority sticky banner */}
      {isHigh && (
        <div className="flex items-center gap-2 px-4 py-2 bg-rose-500/20 border-b border-rose-500/30">
          <PhoneCall className="w-4 h-4 text-rose-400 animate-pulse" />
          <span className="text-rose-300 text-xs font-bold uppercase tracking-wide">
            HIGH PRIORITY — Consider calling 112 if beyond pharmacy scope
          </span>
        </div>
      )}

      {/* Card header */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <PriorityBadge priority={alert.classification?.priority || 'LOW'} />
              <span className="text-slate-500 text-[10px]">
                {alert.classification?.category || 'GENERAL'} emergency
              </span>
              <span className="text-slate-600 text-[10px]">•</span>
              <TimeSince ts={alert.notifiedAt} />
            </div>

            <div className="flex flex-wrap gap-1.5 mb-3">
              {(alert.symptoms || []).slice(0, 4).map((s, i) => (
                <span key={i} className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 text-[10px] border border-slate-700">
                  {s}
                </span>
              ))}
              {(alert.symptoms || []).length > 4 && (
                <span className="text-slate-500 text-[10px] flex items-center">
                  +{(alert.symptoms || []).length - 4} more
                </span>
              )}
            </div>

            <StatusBadge status={alert.status} />
          </div>

          <button
            onClick={() => setExpanded(!expanded)}
            className="text-slate-500 hover:text-slate-300 transition-colors flex-shrink-0 mt-0.5"
            aria-label="Toggle alert details"
          >
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>

        {/* Action buttons — always visible */}
        {!['RESOLVED', 'REJECTED', 'ESCALATED'].includes(alert.status) && (
          <div className="mt-3 flex flex-wrap gap-2">
            {alert.status === 'ALERTED' && (
              <ActionButton
                label="Acknowledge"
                icon={<CheckCircle className="w-3.5 h-3.5" />}
                color="sky"
                onClick={() => handleAction('acknowledge')}
                disabled={isLoading}
              />
            )}
            {alert.status === 'ACKNOWLEDGED' && (
              <ActionButton
                label="Start Preparing"
                icon={<PackageOpen className="w-3.5 h-3.5" />}
                color="violet"
                onClick={() => handleAction('preparing')}
                disabled={isLoading}
              />
            )}
            {alert.status === 'PREPARING' && (
              <ActionButton
                label="Assistance Ready"
                icon={<CheckCircle className="w-3.5 h-3.5" />}
                color="emerald"
                onClick={() => handleAction('ready')}
                disabled={isLoading}
              />
            )}
            {alert.status === 'ASSISTANCE_READY' && (
              <ActionButton
                label="Mark Resolved"
                icon={<CheckCircle className="w-3.5 h-3.5" />}
                color="slate"
                onClick={() => handleAction('resolve')}
                disabled={isLoading}
              />
            )}
            {['ALERTED', 'ACKNOWLEDGED', 'PREPARING'].includes(alert.status) && (
              <>
                <ActionButton
                  label="Reject"
                  icon={<XCircle className="w-3.5 h-3.5" />}
                  color="slate"
                  onClick={() => handleAction('reject')}
                  disabled={isLoading}
                />
                <ActionButton
                  label="Escalate (Call 112)"
                  icon={<ArrowUpCircle className="w-3.5 h-3.5" />}
                  color="rose"
                  onClick={() => handleAction('escalate')}
                  disabled={isLoading}
                />
              </>
            )}
            {isLoading && (
              <span className="text-slate-400 text-[11px] flex items-center gap-1.5">
                <RefreshCcw className="w-3 h-3 animate-spin" /> Updating…
              </span>
            )}
          </div>
        )}
      </div>

      {/* Expanded panel */}
      {expanded && (
        <div className="border-t border-slate-800 px-4 pb-4 pt-3 space-y-4">
          {/* Assistance notes input (for preparing/ready states) */}
          {['ACKNOWLEDGED', 'PREPARING'].includes(alert.status) && (
            <div>
              <label className="text-[10px] text-slate-400 uppercase tracking-wider block mb-1.5">
                Pharmacist Notes <span className="text-slate-600">(optional, max 1000 chars — do NOT include medication instructions)</span>
              </label>
              <textarea
                id={`assistance-notes-${alert.id}`}
                value={assistanceInput}
                onChange={(e) => setAssistanceInput(e.target.value)}
                maxLength={1000}
                rows={3}
                placeholder="e.g. First aid supplies ready. Patient should also be seen by physician."
                className="w-full bg-slate-800 border border-slate-700 rounded-lg text-slate-200 text-xs p-3 resize-none focus:outline-none focus:border-slate-500 placeholder:text-slate-600"
              />
              {inputError && <p className="text-rose-400 text-[10px] mt-1">{inputError}</p>}
            </div>
          )}

          {/* Alert details */}
          <div>
            <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1.5">Emergency Context</p>
            <p className="text-slate-300 text-[11px] leading-relaxed whitespace-pre-wrap bg-slate-800/60 rounded-lg p-3 border border-slate-700/50">
              {alert.assistanceDetails}
            </p>
          </div>

          {/* Warnings */}
          {(alert.warnings || []).length > 0 && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400 flex-shrink-0 mt-0.5" />
              <div>
                {(alert.warnings || []).map((w, i) => (
                  <p key={i} className="text-amber-300 text-[11px]">{w}</p>
                ))}
              </div>
            </div>
          )}

          {/* AI handoff summary */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3 h-3 text-violet-400" />
                AI Context Summary
              </p>
              {!aiSummary && (
                <button
                  id={`ai-handoff-btn-${alert.id}`}
                  onClick={fetchAISummary}
                  disabled={aiLoading}
                  className="text-[10px] text-violet-400 hover:text-violet-300 flex items-center gap-1 disabled:opacity-50"
                >
                  {aiLoading ? (
                    <><RefreshCcw className="w-3 h-3 animate-spin" /> Loading…</>
                  ) : (
                    <>Load summary</>
                  )}
                </button>
              )}
            </div>
            {aiSummary && (
              <div className="bg-violet-500/5 border border-violet-500/20 rounded-lg p-3">
                <p className="text-slate-300 text-[11px] leading-relaxed whitespace-pre-wrap">{aiSummary}</p>
                <p className="text-violet-400/70 text-[10px] mt-2 italic">
                  AI context only. NOT a diagnosis. Independent pharmacist assessment required.
                </p>
              </div>
            )}
          </div>

          {/* Timeline */}
          <div>
            <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-2">Timeline</p>
            <div className="space-y-1">
              <TimelineItem label="Received" ts={alert.notifiedAt} />
              {alert.acknowledgedAt && <TimelineItem label="Acknowledged" ts={alert.acknowledgedAt} color="sky" />}
              {alert.preparedAt && <TimelineItem label="Preparing started" ts={alert.preparedAt} color="violet" />}
              {alert.rejectedAt && <TimelineItem label="Rejected" ts={alert.rejectedAt} color="slate" />}
              {alert.escalatedAt && <TimelineItem label="Escalated" ts={alert.escalatedAt} color="rose" />}
              {alert.resolvedAt && <TimelineItem label="Resolved" ts={alert.resolvedAt} color="emerald" />}
            </div>
          </div>

          {/* Safety notice */}
          <p className="text-[10px] text-slate-600 leading-relaxed border-t border-slate-800 pt-3">
            {alert.safetyNotice}
          </p>
        </div>
      )}
    </div>
  );
}

function TimelineItem({ label, ts, color = 'amber' }: { label: string; ts: string; color?: string }) {
  return (
    <div className="flex items-center gap-3 text-[11px]">
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 bg-${color}-400`} />
      <span className="text-slate-400 w-32">{label}</span>
      <span className="text-slate-500">{new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
    </div>
  );
}

function ActionButton({ label, icon, color, onClick, disabled }: {
  label: string;
  icon: React.ReactNode;
  color: string;
  onClick: () => void;
  disabled: boolean;
}) {
  const colorMap: Record<string, string> = {
    sky:     'bg-sky-500/10 border-sky-500/30 text-sky-400 hover:bg-sky-500/20',
    violet:  'bg-violet-500/10 border-violet-500/30 text-violet-400 hover:bg-violet-500/20',
    emerald: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20',
    rose:    'bg-rose-500/10 border-rose-500/30 text-rose-400 hover:bg-rose-500/20',
    slate:   'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700',
  };
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[11px] font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${colorMap[color] || colorMap.slate}`}
    >
      {icon}
      {label}
    </button>
  );
}

// ─── Main Page ────────────────────────────────────────────────

export default function PharmacyEmergencyPage() {
  const [alerts, setAlerts] = useState<PharmacyAlert[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingAlert, setLoadingAlert] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);
  const [toastMsg, setToastMsg] = useState('');

  const fetchAlerts = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await emergencyNetworkService.getPharmacyAlerts(DEMO_PHARMACY_ID);
      if (res.success) {
        setAlerts(res.data || []);
        setLastRefreshed(new Date());
      }
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Failed to load emergency queue');
    } finally {
      setLoading(false);
    }
  }, []);

  // Poll every 30 seconds
  useEffect(() => {
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 30000);
    return () => clearInterval(interval);
  }, [fetchAlerts]);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3500);
  };

  const handleAction = useCallback(async (alertId: string, action: string, details?: string) => {
    setLoadingAlert(alertId);
    try {
      const pharmacyId = DEMO_PHARMACY_ID;
      let res: any;
      switch (action) {
        case 'acknowledge': res = await emergencyNetworkService.acknowledgePharmacyAlert(pharmacyId, alertId); break;
        case 'preparing':   res = await emergencyNetworkService.markPharmacyPreparing(pharmacyId, alertId, details); break;
        case 'ready':       res = await emergencyNetworkService.markPharmacyReady(pharmacyId, alertId, details); break;
        case 'reject':      res = await emergencyNetworkService.rejectPharmacyAlert(pharmacyId, alertId); break;
        case 'escalate':    res = await emergencyNetworkService.escalatePharmacyAlert(pharmacyId, alertId); break;
        case 'resolve':     res = await emergencyNetworkService.resolvePharmacyAlert(pharmacyId, alertId); break;
      }
      if (res?.success) {
        showToast(res.message || 'Alert updated');
        await fetchAlerts(); // Refresh queue after action
      }
    } catch (e: any) {
      showToast(e?.response?.data?.message || `Failed to ${action} alert`);
    } finally {
      setLoadingAlert(null);
    }
  }, [fetchAlerts]);

  // Grouping
  const activeAlerts = alerts.filter((a) => !['RESOLVED', 'REJECTED'].includes(a.status));
  const closedAlerts = alerts.filter((a) => ['RESOLVED', 'REJECTED'].includes(a.status));
  const highPriorityCount = activeAlerts.filter((a) => a.classification?.priority === 'HIGH').length;

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6 font-mono">
      {/* Header */}
      <div className="border-b border-slate-900 pb-4 flex items-start justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-100 uppercase tracking-wider flex items-center gap-2">
            <PackageOpen className="w-5 h-5 text-violet-400" />
            Emergency Pharmacy Assistance
          </h2>
          <p className="text-[10px] text-slate-500 mt-1">
            Phase C — ArogyaMitra Emergency Response Network
          </p>
        </div>
        <div className="flex items-center gap-3">
          {highPriorityCount > 0 && (
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 text-[11px] font-bold animate-pulse">
              <AlertCircle className="w-3.5 h-3.5" />
              {highPriorityCount} HIGH priority
            </span>
          )}
          <button
            id="refresh-pharmacy-queue"
            onClick={fetchAlerts}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-400 text-[11px] hover:bg-slate-700 transition-colors disabled:opacity-40"
          >
            <RefreshCcw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Safety Banner */}
      <SafetyBanner />

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30">
          <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
          <p className="text-rose-400 text-xs">{error}</p>
        </div>
      )}

      {/* Stats bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Active',     value: activeAlerts.length,                   color: 'text-amber-400' },
          { label: 'High',       value: highPriorityCount,                     color: 'text-rose-400' },
          { label: 'Ready',      value: alerts.filter((a) => a.status === 'ASSISTANCE_READY').length, color: 'text-emerald-400' },
          { label: 'Resolved',   value: closedAlerts.filter((a) => a.status === 'RESOLVED').length,   color: 'text-slate-400' },
        ].map((stat) => (
          <div key={stat.label} className="bg-slate-900/60 border border-slate-800 rounded-xl p-3 text-center">
            <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
            <p className="text-[10px] text-slate-500 uppercase tracking-wider mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Active queue */}
      <section>
        <h3 className="text-[10px] text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
          <AlertCircle className="w-3 h-3" />
          Active Requests ({activeAlerts.length})
          {lastRefreshed && (
            <span className="text-slate-600 font-normal">
              — last updated {lastRefreshed.toLocaleTimeString()}
            </span>
          )}
        </h3>

        {loading && alerts.length === 0 ? (
          <div className="flex items-center justify-center py-12 text-slate-500 gap-2 text-sm">
            <RefreshCcw className="w-4 h-4 animate-spin" />
            Loading emergency queue…
          </div>
        ) : activeAlerts.length === 0 ? (
          <div className="text-center py-12 text-slate-600 text-sm">
            <PackageOpen className="w-8 h-8 mx-auto mb-3 text-slate-700" />
            No active emergency requests
          </div>
        ) : (
          <div className="space-y-3">
            {/* HIGH priority first */}
            {[...activeAlerts]
              .sort((a, b) => {
                const pOrder: Record<string, number> = { HIGH: 0, MEDIUM: 1, LOW: 2 };
                return (pOrder[a.classification?.priority || 'LOW'] ?? 3) - (pOrder[b.classification?.priority || 'LOW'] ?? 3);
              })
              .map((alert) => (
                <AlertCard
                  key={alert.id}
                  alert={alert}
                  onAction={handleAction}
                  loadingAlert={loadingAlert}
                />
              ))}
          </div>
        )}
      </section>

      {/* Closed / resolved */}
      {closedAlerts.length > 0 && (
        <section>
          <h3 className="text-[10px] text-slate-600 uppercase tracking-wider mb-3 flex items-center gap-2">
            <CheckCircle className="w-3 h-3" />
            Resolved / Closed ({closedAlerts.length})
          </h3>
          <div className="space-y-2">
            {closedAlerts.slice(0, 5).map((alert) => (
              <div
                key={alert.id}
                className="flex items-center justify-between px-4 py-3 rounded-xl bg-slate-900/40 border border-slate-800"
              >
                <div className="flex items-center gap-3">
                  <PriorityBadge priority={alert.classification?.priority || 'LOW'} />
                  <span className="text-slate-500 text-[11px]">{alert.classification?.category || 'GENERAL'}</span>
                </div>
                <StatusBadge status={alert.status} />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Toast */}
      {toastMsg && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 text-sm shadow-2xl flex items-center gap-2 animate-fade-in">
          <CheckCircle className="w-4 h-4 text-emerald-400" />
          {toastMsg}
        </div>
      )}
    </div>
  );
}
