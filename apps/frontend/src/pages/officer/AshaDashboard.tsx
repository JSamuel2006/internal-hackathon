import React, { useState, useEffect, useCallback } from 'react';
import { 
  Users, Activity, ClipboardList, ShieldAlert, 
  RefreshCw, Search, Filter, AlertTriangle, CheckCircle2, 
  Clock, MapPin, ChevronLeft, ChevronRight, Eye, ShieldCheck, HeartPulse, User
} from 'lucide-react';
import { officerAshaService } from '../../services/api';
import { socketService } from '../../services/socketService';

interface OverviewStats {
  totalWorkers: number;
  totalScreenings: number;
  todayScreenings: number;
  thisWeekScreenings: number;
  referrals: {
    urgent: number;
    priority: number;
    needsReview: number;
    normal: number;
  };
  syncStats: {
    syncedRecords: number;
    unresolvedPriorityCases: number;
    syncEngineStatus: string;
  };
}

interface WorkerItem {
  workerId: string;
  name: string;
  email: string;
  village: string;
  jurisdiction: string;
  totalScreenings: number;
  todayScreenings: number;
  lastActivityDate: string | null;
  status: 'Active' | 'Idle';
}

interface ScreeningItem {
  id: string;
  clientRecordId: string;
  workerId: string;
  workerName: string;
  citizenName: string;
  citizenUserId: string;
  village: string;
  screeningDate: string;
  riskLevel: 'URGENT' | 'PRIORITY' | 'NEEDS_REVIEW' | 'NORMAL';
  riskFlags: string[];
  syncStatus: string;
  createdAt?: string;
}

export default function AshaDashboard() {
  const userRaw = sessionStorage.getItem('user');
  const user = userRaw ? JSON.parse(userRaw) : { name: 'Public Health Officer', jurisdiction: 'Pune District' };
  const token = sessionStorage.getItem('token') || '';

  // Data States
  const [overview, setOverview] = useState<OverviewStats | null>(null);
  const [workers, setWorkers] = useState<WorkerItem[]>([]);
  const [screenings, setScreenings] = useState<ScreeningItem[]>([]);
  const [totalScreeningsCount, setTotalScreeningsCount] = useState<number>(0);

  // Filter States
  const [selectedWorkerId, setSelectedWorkerId] = useState<string>('ALL');
  const [selectedRiskLevel, setSelectedRiskLevel] = useState<string>('ALL');
  const [selectedDateRange, setSelectedDateRange] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [page, setPage] = useState<number>(1);
  const pageSize = 10;

  // Selected Worker Drilldown Modal / Filter
  const [inspectedWorker, setInspectedWorker] = useState<WorkerItem | null>(null);

  // Status & UI States
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [lastSyncTime, setLastSyncTime] = useState<string>(new Date().toLocaleTimeString());

  // 1. Fetch Overview & Workers
  const fetchSummaryData = useCallback(async () => {
    try {
      const [overviewRes, workersRes] = await Promise.all([
        officerAshaService.getOverview(),
        officerAshaService.getWorkers()
      ]);

      if (overviewRes.success) {
        setOverview(overviewRes.data);
      }
      if (workersRes.success) {
        setWorkers(workersRes.data);
      }
    } catch (err: any) {
      console.error('[OfficerAsha] Error loading summary data:', err);
      setErrorMsg(err.response?.data?.message || 'Unable to load ASHA summary metrics from database.');
    }
  }, []);

  // 2. Fetch Screenings with active filters
  const fetchScreeningsData = useCallback(async () => {
    try {
      const offset = (page - 1) * pageSize;
      const res = await officerAshaService.getScreenings({
        workerId: selectedWorkerId !== 'ALL' ? selectedWorkerId : undefined,
        riskLevel: selectedRiskLevel !== 'ALL' ? selectedRiskLevel : undefined,
        dateRange: selectedDateRange,
        search: searchQuery.trim() || undefined,
        limit: pageSize,
        offset
      });

      if (res.success) {
        setScreenings(res.data.screenings || []);
        setTotalScreeningsCount(res.data.total || 0);
      }
    } catch (err: any) {
      console.error('[OfficerAsha] Error loading screenings:', err);
    }
  }, [selectedWorkerId, selectedRiskLevel, selectedDateRange, searchQuery, page]);

  // Combined Refresh Handler
  const handleRefresh = async () => {
    setRefreshing(true);
    setErrorMsg('');
    await Promise.all([fetchSummaryData(), fetchScreeningsData()]);
    setLastSyncTime(new Date().toLocaleTimeString());
    setRefreshing(false);
    setLoading(false);
  };

  // Initial Load
  useEffect(() => {
    handleRefresh();
  }, [fetchSummaryData, fetchScreeningsData]);

  // Socket.IO Real-Time Listener
  useEffect(() => {
    if (!token) return;
    const socket = socketService.connect(token);

    const onScreeningEvent = (payload: any) => {
      console.log('[SOCKET] Real-time ASHA screening event received:', payload);
      // REST is source of truth: refresh data immediately
      fetchSummaryData();
      fetchScreeningsData();
      setLastSyncTime(new Date().toLocaleTimeString());
    };

    socket.on('asha_screening_created', onScreeningEvent);
    socket.on('asha_screening_synced', onScreeningEvent);

    return () => {
      socket.off('asha_screening_created', onScreeningEvent);
      socket.off('asha_screening_synced', onScreeningEvent);
    };
  }, [token, fetchSummaryData, fetchScreeningsData]);

  const totalPages = Math.ceil(totalScreeningsCount / pageSize) || 1;

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-2 sm:px-4 text-slate-100 font-sans pb-16">
      
      {/* ── Top Command Bar ────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-teal-500/10 rounded-xl text-teal-400 border border-teal-500/20">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight bg-gradient-to-r from-teal-400 via-teal-200 to-indigo-300 bg-clip-text text-transparent">
                ASHA Field Monitoring & Operations
              </h1>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                Community Health Worker Surveillance • Jurisdiction: <span className="text-teal-400 font-semibold">{user.jurisdiction || 'State Health Authority'}</span>
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="font-bold">LIVE TELEMETRY</span>
          </div>

          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-750 hover:border-teal-500/40 text-slate-200 rounded-xl text-xs font-bold font-mono transition-all cursor-pointer shadow-sm"
            title="Fetch latest database records"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-teal-400 ${refreshing ? 'animate-spin' : ''}`} />
            <span>{refreshing ? 'SYNCING...' : 'REFRESH'}</span>
          </button>
        </div>
      </div>

      {/* ── Error Banner ──────────────────────────────────────────────── */}
      {errorMsg && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl flex items-center justify-between gap-3 text-rose-400 text-xs font-mono">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-5 h-5 shrink-0 text-rose-400" />
            <span>{errorMsg}</span>
          </div>
          <button 
            onClick={handleRefresh} 
            className="px-3 py-1 bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 rounded-lg text-[10px] uppercase font-bold"
          >
            Retry
          </button>
        </div>
      )}

      {/* ── Top 4 KPI Cards (Real Database Values) ─────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: ASHA Workers */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 bg-slate-950/60 shadow-lg relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-bold">ASHA Workers</span>
            <div className="p-2 rounded-lg bg-teal-500/10 text-teal-400">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-extrabold font-mono text-slate-100">
              {loading ? '—' : overview?.totalWorkers || workers.length || 0}
            </span>
            <span className="text-xs text-slate-400 block mt-1">Active Community Cadre</span>
          </div>
          <div className="w-full bg-slate-850 h-1 rounded-full mt-3 overflow-hidden">
            <div className="bg-teal-400 h-full rounded-full" style={{ width: '100%' }}></div>
          </div>
        </div>

        {/* Card 2: Total Screenings */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 bg-slate-950/60 shadow-lg relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-bold">Total Screenings</span>
            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
              <ClipboardList className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-extrabold font-mono text-indigo-300">
              {loading ? '—' : overview?.totalScreenings ?? 0}
            </span>
            <span className="text-xs text-slate-400 block mt-1">Field Health Assessments</span>
          </div>
          <div className="w-full bg-slate-850 h-1 rounded-full mt-3 overflow-hidden">
            <div className="bg-indigo-400 h-full rounded-full" style={{ width: '100%' }}></div>
          </div>
        </div>

        {/* Card 3: Today's Screenings */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 bg-slate-950/60 shadow-lg relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-bold">Today's Screenings</span>
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
              <Activity className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-extrabold font-mono text-amber-300">
              {loading ? '—' : overview?.todayScreenings ?? 0}
            </span>
            <span className="text-xs text-slate-400 block mt-1">Evaluated in last 24h</span>
          </div>
          <div className="w-full bg-slate-850 h-1 rounded-full mt-3 overflow-hidden">
            <div className="bg-amber-400 h-full rounded-full" style={{ width: '100%' }}></div>
          </div>
        </div>

        {/* Card 4: Referrals */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 bg-slate-950/60 shadow-lg relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-bold">Referral Cases</span>
            <div className="p-2 rounded-lg bg-rose-500/10 text-rose-400">
              <ShieldAlert className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-extrabold font-mono text-rose-400">
              {loading ? '—' : (overview?.referrals.urgent || 0) + (overview?.referrals.priority || 0)}
            </span>
            <span className="text-xs text-rose-300/80 block mt-1">Urgent & Priority Escalations</span>
          </div>
          <div className="w-full bg-slate-850 h-1 rounded-full mt-3 overflow-hidden">
            <div className="bg-rose-500 h-full rounded-full" style={{ width: '100%' }}></div>
          </div>
        </div>
      </div>

      {/* ── Screening Referral Distribution & Status Section ────────────── */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800/80 bg-slate-950/40 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-850 pb-3">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200 font-mono flex items-center gap-2">
              <HeartPulse className="w-4 h-4 text-teal-400" />
              Screening Referral Status
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Automated community triage distribution categorized by the clinical screening engine.
            </p>
          </div>
          <span className="text-[10px] text-slate-500 font-mono italic">
            *Operational monitoring only — not a definitive medical diagnosis.
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {/* Urgent */}
          <div 
            onClick={() => { setSelectedRiskLevel(selectedRiskLevel === 'URGENT' ? 'ALL' : 'URGENT'); setPage(1); }}
            className={`p-4 rounded-xl border transition-all cursor-pointer ${
              selectedRiskLevel === 'URGENT' 
                ? 'bg-rose-500/20 border-rose-500 ring-1 ring-rose-500' 
                : 'bg-slate-900/60 border-slate-800 hover:border-rose-500/40 hover:bg-slate-900'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-rose-400">🔴 Urgent Referral</span>
              <span className="w-2 h-2 rounded-full bg-rose-500"></span>
            </div>
            <span className="text-2xl font-bold font-mono text-rose-300 block mt-2">
              {loading ? '—' : overview?.referrals.urgent || 0}
            </span>
            <span className="text-[10px] text-slate-400 block mt-1">Requires immediate PHC care</span>
          </div>

          {/* Priority */}
          <div 
            onClick={() => { setSelectedRiskLevel(selectedRiskLevel === 'PRIORITY' ? 'ALL' : 'PRIORITY'); setPage(1); }}
            className={`p-4 rounded-xl border transition-all cursor-pointer ${
              selectedRiskLevel === 'PRIORITY' 
                ? 'bg-amber-500/20 border-amber-500 ring-1 ring-amber-500' 
                : 'bg-slate-900/60 border-slate-800 hover:border-amber-500/40 hover:bg-slate-900'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">🟠 Priority Case</span>
              <span className="w-2 h-2 rounded-full bg-amber-500"></span>
            </div>
            <span className="text-2xl font-bold font-mono text-amber-300 block mt-2">
              {loading ? '—' : overview?.referrals.priority || 0}
            </span>
            <span className="text-[10px] text-slate-400 block mt-1">High risk (Pregnancy/BP)</span>
          </div>

          {/* Needs Review */}
          <div 
            onClick={() => { setSelectedRiskLevel(selectedRiskLevel === 'NEEDS_REVIEW' ? 'ALL' : 'NEEDS_REVIEW'); setPage(1); }}
            className={`p-4 rounded-xl border transition-all cursor-pointer ${
              selectedRiskLevel === 'NEEDS_REVIEW' 
                ? 'bg-yellow-500/20 border-yellow-500 ring-1 ring-yellow-500' 
                : 'bg-slate-900/60 border-slate-800 hover:border-yellow-500/40 hover:bg-slate-900'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-yellow-400">🟡 Needs Review</span>
              <span className="w-2 h-2 rounded-full bg-yellow-500"></span>
            </div>
            <span className="text-2xl font-bold font-mono text-yellow-300 block mt-2">
              {loading ? '—' : overview?.referrals.needsReview || 0}
            </span>
            <span className="text-[10px] text-slate-400 block mt-1">Mild elevated vitals</span>
          </div>

          {/* Normal */}
          <div 
            onClick={() => { setSelectedRiskLevel(selectedRiskLevel === 'NORMAL' ? 'ALL' : 'NORMAL'); setPage(1); }}
            className={`p-4 rounded-xl border transition-all cursor-pointer ${
              selectedRiskLevel === 'NORMAL' 
                ? 'bg-emerald-500/20 border-emerald-500 ring-1 ring-emerald-500' 
                : 'bg-slate-900/60 border-slate-800 hover:border-emerald-500/40 hover:bg-slate-900'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">🟢 Normal</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            </div>
            <span className="text-2xl font-bold font-mono text-emerald-300 block mt-2">
              {loading ? '—' : overview?.referrals.normal || 0}
            </span>
            <span className="text-[10px] text-slate-400 block mt-1">All parameters stable</span>
          </div>
        </div>
      </div>

      {/* ── ASHA Workers Roster Section ────────────────────────────────── */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 bg-slate-950/50 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-850 pb-3">
          <div className="flex items-center gap-2.5">
            <Users className="w-5 h-5 text-indigo-400" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200 font-mono">ASHA Worker Roster & Performance</h3>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            {workers.length} Community Workers Registered
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-[10px] text-slate-400 uppercase">
                <th className="pb-3 px-3 font-semibold">ASHA Worker</th>
                <th className="pb-3 px-3 font-semibold">Jurisdiction / Village</th>
                <th className="pb-3 px-3 font-semibold text-center">Total Screenings</th>
                <th className="pb-3 px-3 font-semibold text-center">Today</th>
                <th className="pb-3 px-3 font-semibold">Last Field Activity</th>
                <th className="pb-3 px-3 font-semibold text-center">Status</th>
                <th className="pb-3 px-3 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-850">
              {workers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-6 text-slate-500 italic">
                    No ASHA workers found in system.
                  </td>
                </tr>
              ) : (
                workers.map((w) => (
                  <tr key={w.workerId} className="hover:bg-slate-900/60 transition-colors">
                    <td className="py-3.5 px-3">
                      <span className="font-bold text-slate-100 block">{w.name}</span>
                      <span className="text-[10px] text-slate-500 font-normal">{w.email}</span>
                    </td>
                    <td className="py-3.5 px-3 text-slate-300">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                        <span>{w.village || w.jurisdiction}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-3 text-center font-bold text-indigo-300">
                      {w.totalScreenings}
                    </td>
                    <td className="py-3.5 px-3 text-center font-bold text-amber-400">
                      {w.todayScreenings}
                    </td>
                    <td className="py-3.5 px-3 text-slate-400 text-[11px]">
                      {w.lastActivityDate 
                        ? new Date(w.lastActivityDate).toLocaleString() 
                        : 'No activity recorded'}
                    </td>
                    <td className="py-3.5 px-3 text-center">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                        w.status === 'Active' 
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                          : 'bg-slate-800 text-slate-400 border border-slate-700'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${w.status === 'Active' ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`}></span>
                        {w.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 text-right">
                      <button
                        onClick={() => {
                          setSelectedWorkerId(w.workerId);
                          setInspectedWorker(w);
                          setPage(1);
                        }}
                        className="px-2.5 py-1 bg-slate-850 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-teal-300 rounded text-[10px] font-bold uppercase transition-colors cursor-pointer"
                      >
                        Filter Logs
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Recent Field Screenings Table ──────────────────────────────── */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 bg-slate-950/60 space-y-4">
        
        {/* Table Header & Controls */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-850 pb-4">
          <div className="flex items-center gap-2.5">
            <ClipboardList className="w-5 h-5 text-teal-400" />
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200 font-mono">
                Recent Field Screenings
              </h3>
              <span className="text-[11px] text-slate-400 font-mono">
                Showing {screenings.length} of {totalScreeningsCount} database records
              </span>
            </div>
          </div>

          {/* Active Filter Badges */}
          {(selectedWorkerId !== 'ALL' || selectedRiskLevel !== 'ALL' || searchQuery) && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-mono text-slate-400 uppercase font-bold">Active Filters:</span>
              {selectedWorkerId !== 'ALL' && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] font-mono rounded">
                  Worker: {workers.find(w => w.workerId === selectedWorkerId)?.name || selectedWorkerId}
                  <button onClick={() => setSelectedWorkerId('ALL')} className="hover:text-white ml-1 font-bold">×</button>
                </span>
              )}
              {selectedRiskLevel !== 'ALL' && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-[10px] font-mono rounded">
                  Risk: {selectedRiskLevel}
                  <button onClick={() => setSelectedRiskLevel('ALL')} className="hover:text-white ml-1 font-bold">×</button>
                </span>
              )}
              {searchQuery && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-teal-500/10 border border-teal-500/20 text-teal-400 text-[10px] font-mono rounded">
                  Search: {searchQuery}
                  <button onClick={() => setSearchQuery('')} className="hover:text-white ml-1 font-bold">×</button>
                </span>
              )}
              <button
                onClick={() => {
                  setSelectedWorkerId('ALL');
                  setSelectedRiskLevel('ALL');
                  setSelectedDateRange('all');
                  setSearchQuery('');
                  setPage(1);
                }}
                className="text-[10px] text-slate-400 hover:text-rose-400 underline ml-1 cursor-pointer font-mono"
              >
                Clear All
              </button>
            </div>
          )}
        </div>

        {/* Filter Controls Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search Input */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search Citizen / Village..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs font-mono text-slate-200 placeholder-slate-500 focus:outline-none focus:border-teal-500"
            />
          </div>

          {/* Worker Filter Dropdown */}
          <select
            value={selectedWorkerId}
            onChange={(e) => { setSelectedWorkerId(e.target.value); setPage(1); }}
            className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-teal-500 cursor-pointer"
          >
            <option value="ALL">All ASHA Workers</option>
            {workers.map(w => (
              <option key={w.workerId} value={w.workerId}>{w.name} ({w.village})</option>
            ))}
          </select>

          {/* Risk Level Filter Dropdown */}
          <select
            value={selectedRiskLevel}
            onChange={(e) => { setSelectedRiskLevel(e.target.value); setPage(1); }}
            className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-teal-500 cursor-pointer"
          >
            <option value="ALL">All Referral Statuses</option>
            <option value="URGENT">🔴 URGENT Referral</option>
            <option value="PRIORITY">🟠 PRIORITY Case</option>
            <option value="NEEDS_REVIEW">🟡 NEEDS REVIEW</option>
            <option value="NORMAL">🟢 NORMAL</option>
          </select>

          {/* Date Range Filter */}
          <select
            value={selectedDateRange}
            onChange={(e) => { setSelectedDateRange(e.target.value); setPage(1); }}
            className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-teal-500 cursor-pointer"
          >
            <option value="all">All Dates</option>
            <option value="today">Today Only</option>
            <option value="week">Past 7 Days</option>
            <option value="month">Past 30 Days</option>
          </select>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto min-h-[220px]">
          <table className="w-full text-left font-mono text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-[10px] text-slate-400 uppercase">
                <th className="pb-3 px-3 font-semibold">Citizen</th>
                <th className="pb-3 px-3 font-semibold">ASHA Worker</th>
                <th className="pb-3 px-3 font-semibold">Village</th>
                <th className="pb-3 px-3 font-semibold">Date / Time</th>
                <th className="pb-3 px-3 font-semibold">Referral Status</th>
                <th className="pb-3 px-3 font-semibold">Clinical Flags</th>
                <th className="pb-3 px-3 font-semibold text-center">Sync</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-850">
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-500 font-mono">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-teal-400 opacity-60" />
                    Loading ASHA screening records from database...
                  </td>
                </tr>
              ) : screenings.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-500 font-mono">
                    <AlertTriangle className="w-8 h-8 mx-auto mb-2 text-slate-600 opacity-50" />
                    <p className="font-bold">No ASHA screening records match your query.</p>
                    <p className="text-[10px] mt-1 text-slate-600">Try adjusting your filters or search terms.</p>
                  </td>
                </tr>
              ) : (
                screenings.map((s) => {
                  let badgeColor = 'bg-slate-800 text-slate-300 border-slate-700';
                  let dotColor = 'bg-slate-400';
                  if (s.riskLevel === 'URGENT') {
                    badgeColor = 'bg-rose-500/10 text-rose-400 border-rose-500/20';
                    dotColor = 'bg-rose-400';
                  } else if (s.riskLevel === 'PRIORITY') {
                    badgeColor = 'bg-amber-500/10 text-amber-400 border-amber-500/20';
                    dotColor = 'bg-amber-400';
                  } else if (s.riskLevel === 'NEEDS_REVIEW') {
                    badgeColor = 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
                    dotColor = 'bg-yellow-400';
                  } else if (s.riskLevel === 'NORMAL') {
                    badgeColor = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
                    dotColor = 'bg-emerald-400';
                  }

                  return (
                    <tr key={s.id} className="hover:bg-slate-900/60 transition-colors">
                      <td className="py-3 px-3 font-semibold text-slate-100">
                        {s.citizenName}
                      </td>
                      <td className="py-3 px-3 text-slate-300">
                        {s.workerName}
                      </td>
                      <td className="py-3 px-3 text-slate-400">
                        {s.village}
                      </td>
                      <td className="py-3 px-3 text-slate-400 text-[11px]">
                        {new Date(s.screeningDate).toLocaleString()}
                      </td>
                      <td className="py-3 px-3">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase border ${badgeColor}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`}></span>
                          {s.riskLevel}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-400 text-[10px] max-w-xs truncate">
                        {s.riskFlags.length > 0 ? (
                          <span title={s.riskFlags.join(', ')}>
                            {s.riskFlags[0]}
                            {s.riskFlags.length > 1 && ` (+${s.riskFlags.length - 1} more)`}
                          </span>
                        ) : (
                          <span className="text-slate-600">No flags</span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className="inline-flex items-center gap-1 text-[9px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded uppercase font-bold">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          Synced
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-850 font-mono text-xs text-slate-400">
          <div>
            Showing Page <span className="text-slate-200 font-bold">{page}</span> of <span className="text-slate-200 font-bold">{totalPages}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(p => Math.max(p - 1, 1))}
              disabled={page <= 1}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 disabled:opacity-40 disabled:cursor-not-allowed hover:border-slate-700 text-slate-200 transition-colors"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Prev</span>
            </button>
            <button
              onClick={() => setPage(p => Math.min(p + 1, totalPages))}
              disabled={page >= totalPages}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 disabled:opacity-40 disabled:cursor-not-allowed hover:border-slate-700 text-slate-200 transition-colors"
            >
              <span>Next</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* ── Offline/Sync Architecture Disclosure Notice ───────────────── */}
      <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/40 text-slate-400 text-[11px] font-mono leading-relaxed space-y-1">
        <p className="text-slate-300 font-bold flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-teal-400" />
          Field Offline Synchronization &amp; Data Integrity Architecture:
        </p>
        <p>
          • <strong>PostgreSQL Persistence:</strong> All metrics displayed on this dashboard represent verified database records synchronized from community health worker field devices.
        </p>
        <p>
          • <strong>Device Isolation:</strong> Offline records stored in an ASHA worker's browser IndexedDB queue are synchronized upon network restoration. Local un-synced queues remain isolated on client devices until broadcasted to the central API.
        </p>
        <p>
          • <strong>Socket.IO Live Telemetry:</strong> Automatic WebSocket notification events (<code className="text-teal-400">asha_screening_synced</code>) trigger instant non-blocking dashboard re-fetches.
        </p>
      </div>

    </div>
  );
}
