import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Users, ClipboardList, AlertTriangle, RefreshCw, 
  Search, Plus, CheckCircle, Clock, ShieldCheck
} from 'lucide-react';
import { workerService } from '../../services/api';
import { offlineScreeningStorage } from '../../services/offlineScreeningStorage';
import type { OfflineScreening } from '../../services/offlineScreeningStorage';

export default function AshaDashboard() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [citizens, setCitizens] = useState<any[]>([]);
  const [history, setHistory] = useState<OfflineScreening[]>([]);
  
  // Dashboard stats
  const [stats, setStats] = useState({
    screenedToday: 0,
    pendingSync: 0,
    synced: 0,
    priorityCases: 0,
  });

  const [loading, setLoading] = useState(false);
  const [registering, setRegistering] = useState(false);

  // New Citizen fields
  const [newName, setNewName] = useState('');
  const [newAge, setNewAge] = useState('');
  const [newGender, setNewGender] = useState('Male');
  const [newVillage, setNewVillage] = useState('Haveli');
  const [newPhone, setNewPhone] = useState('');
  const [newContact, setNewContact] = useState('');
  const [regMsg, setRegMsg] = useState('');

  const loadData = async () => {
    setLoading(true);
    // 1. Get offline storage stats & queue
    const localQueue = await offlineScreeningStorage.getScreenings();
    setHistory(localQueue);

    const localStats = await offlineScreeningStorage.getStats();

    // 2. Fetch stats & citizen list if online
    if (navigator.onLine) {
      try {
        const statsRes = await workerService.getStats();
        const citRes = await workerService.getCitizens();
        if (statsRes.success) {
          setStats({
            screenedToday: statsRes.data.screenedToday + localStats.synced,
            pendingSync: localStats.pending,
            synced: statsRes.data.screenedToday,
            priorityCases: statsRes.data.priorityCases
          });
        }
        if (citRes.success) {
          setCitizens(citRes.data || []);
        }
      } catch (err) {
        console.error('Failed to load online stats', err);
      }
    } else {
      // Offline fallback: aggregate from local Storage
      const priorities = localQueue.filter(s => s.risk_level === 'PRIORITY' || s.risk_level === 'URGENT').length;
      setStats({
        screenedToday: localQueue.length,
        pendingSync: localStats.pending,
        synced: localStats.synced,
        priorityCases: priorities
      });

      // Filter offline queued citizens
      const offlineCitizens = localQueue.map(s => ({
        id: s.citizen_user_id || `offline-${s.client_record_id}`,
        name: s.citizen_name,
        jurisdiction: s.village,
        role: 'ROLE_CITIZEN',
        isOfflineCreated: true
      }));

      // Unique by name to avoid listing multiple screenings as separate citizens
      const uniqueOffline = Array.from(new Map(offlineCitizens.map(item => [item.name, item])).values());
      setCitizens(uniqueOffline);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
    window.addEventListener('online', loadData);
    return () => window.removeEventListener('online', loadData);
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!navigator.onLine) {
      // Local filter
      const localQueue = await offlineScreeningStorage.getScreenings();
      const filtered = localQueue
        .filter(s => s.citizen_name.toLowerCase().includes(query.toLowerCase()))
        .map(s => ({
          id: s.citizen_user_id || `offline-${s.client_record_id}`,
          name: s.citizen_name,
          jurisdiction: s.village,
          role: 'ROLE_CITIZEN'
        }));
      setCitizens(Array.from(new Map(filtered.map(item => [item.name, item])).values()));
      return;
    }

    setLoading(true);
    try {
      const res = await workerService.getCitizens(query);
      if (res.success) {
        setCitizens(res.data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterCitizen = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newAge || !newVillage) {
      setRegMsg('Please provide Name, Age, and Village.');
      return;
    }

    const ageNum = parseInt(newAge, 10);
    if (isNaN(ageNum)) {
      setRegMsg('Please enter a valid age number.');
      return;
    }

    if (!navigator.onLine) {
      // Create citizen in local queue as a simulated record
      const tempId = `usr-offline-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      const localCitizen = {
        id: tempId,
        name: newName,
        age: ageNum,
        gender: newGender,
        village: newVillage,
        phone: newPhone || undefined,
        emergency_contact: newContact || undefined,
        role: 'ROLE_CITIZEN',
        isOfflineCreated: true
      };

      setCitizens([localCitizen, ...citizens]);
      setNewName('');
      setNewAge('');
      setNewPhone('');
      setNewContact('');
      setRegistering(false);
      setRegMsg('Citizen registered locally (Offline). Ready to screen!');
      setTimeout(() => setRegMsg(''), 4000);
      return;
    }

    try {
      const res = await workerService.registerCitizen({
        name: newName,
        age: ageNum,
        gender: newGender,
        village: newVillage,
        phone: newPhone || undefined,
        emergency_contact: newContact || undefined
      });
      if (res.success) {
        setCitizens([res.data, ...citizens]);
        setNewName('');
        setNewAge('');
        setNewPhone('');
        setNewContact('');
        setRegistering(false);
        setRegMsg('Citizen profile registered successfully! Ready to screen.');
        setTimeout(() => setRegMsg(''), 4000);
      } else {
        setRegMsg(res.message || 'Registration failed.');
      }
    } catch (err: any) {
      setRegMsg(err.response?.data?.message || 'Error registering citizen.');
    }
  };

  const handleSyncClick = async () => {
    if (stats.pendingSync === 0) return;
    setLoading(true);
    try {
      const activeQueue = await offlineScreeningStorage.getScreenings();
      const screenings = activeQueue.filter(s => s.sync_status === 'PENDING' || s.sync_status === 'FAILED');
      const res = await workerService.syncScreenings(screenings);
      if (res.success && Array.isArray(res.data)) {
        for (const item of res.data) {
          if (item.status === 'SUCCESS') {
            await offlineScreeningStorage.updateSyncStatus(item.client_record_id, 'SYNCED');
          } else {
            await offlineScreeningStorage.updateSyncStatus(item.client_record_id, 'FAILED', item.error);
          }
        }
        await offlineScreeningStorage.clearSynced();
        await loadData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Dashboard Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass-panel p-4 rounded-xl border border-slate-900 flex justify-between items-center">
          <div>
            <span className="text-[10px] text-slate-500 uppercase font-mono block">Today's Screens</span>
            <span className="text-xl font-bold font-mono text-slate-100">{stats.screenedToday}</span>
          </div>
          <ClipboardList className="w-8 h-8 text-indigo-400" />
        </div>

        <div 
          onClick={handleSyncClick}
          className={`glass-panel p-4 rounded-xl border border-slate-900 flex justify-between items-center cursor-pointer hover:border-amber-500/30 transition-all ${
            stats.pendingSync > 0 ? 'bg-amber-500/5 animate-pulse' : ''
          }`}
        >
          <div>
            <span className="text-[10px] text-slate-500 uppercase font-mono block">Pending Sync</span>
            <span className="text-xl font-bold font-mono text-amber-400">{stats.pendingSync}</span>
          </div>
          <Clock className="w-8 h-8 text-amber-500" />
        </div>

        <div className="glass-panel p-4 rounded-xl border border-slate-900 flex justify-between items-center">
          <div>
            <span className="text-[10px] text-slate-500 uppercase font-mono block">Synced Records</span>
            <span className="text-xl font-bold font-mono text-emerald-450">{stats.synced}</span>
          </div>
          <CheckCircle className="w-8 h-8 text-emerald-500" />
        </div>

        <div className="glass-panel p-4 rounded-xl border border-slate-900 flex justify-between items-center">
          <div>
            <span className="text-[10px] text-slate-500 uppercase font-mono block">Priority Alerts</span>
            <span className="text-xl font-bold font-mono text-rose-455">{stats.priorityCases}</span>
          </div>
          <AlertTriangle className="w-8 h-8 text-rose-500" />
        </div>
      </div>

      {regMsg && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs rounded-xl">
          {regMsg}
        </div>
      )}

      {/* Citizen Search & Register Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 space-y-4">
          <div className="glass-panel p-6 rounded-2xl border border-slate-900 space-y-4">
            <div className="flex justify-between items-center">
              <span className="font-bold text-slate-205 uppercase block">Village Resident Registry</span>
              <button
                onClick={() => setRegistering(!registering)}
                className="px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-[10px] font-bold text-slate-202 flex items-center gap-1 hover:bg-slate-850"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{registering ? 'Cancel' : 'New Citizen'}</span>
              </button>
            </div>

            {/* Quick Register Citizen Form */}
            {registering ? (
              <form onSubmit={handleRegisterCitizen} className="p-4 bg-slate-950/80 rounded-xl border border-slate-900 space-y-4">
                <span className="text-[10px] text-slate-500 uppercase font-mono block border-b border-slate-900 pb-1.5">Add Rural Citizen</span>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[9px] font-mono text-slate-500 uppercase mb-1">Citizen Name *</label>
                    <input
                      type="text"
                      required
                      value={newName}
                      onChange={e => setNewName(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-slate-100"
                      placeholder="e.g. Kavita Patil"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-mono text-slate-500 uppercase mb-1">Age *</label>
                    <input
                      type="number"
                      required
                      value={newAge}
                      onChange={e => setNewAge(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-slate-100"
                      placeholder="e.g. 28"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[9px] font-mono text-slate-500 uppercase mb-1">Gender *</label>
                    <select
                      value={newGender}
                      onChange={e => setNewGender(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-slate-100"
                    >
                      <option>Male</option>
                      <option>Female</option>
                      <option>Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[9px] font-mono text-slate-500 uppercase mb-1">Village *</label>
                    <input
                      type="text"
                      required
                      value={newVillage}
                      onChange={e => setNewVillage(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-slate-100"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[9px] font-mono text-slate-500 uppercase mb-1">Phone (Optional)</label>
                    <input
                      type="text"
                      value={newPhone}
                      onChange={e => setNewPhone(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-slate-100"
                      placeholder="e.g. 9876543210"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-mono text-slate-500 uppercase mb-1">Emergency Contact (Optional)</label>
                    <input
                      type="text"
                      value={newContact}
                      onChange={e => setNewContact(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-slate-100"
                      placeholder="e.g. 9876543211"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-2 bg-indigo-650 hover:bg-indigo-600 font-bold text-slate-950 uppercase text-xs rounded-xl tracking-wider"
                >
                  Save Citizen Profile
                </button>
              </form>
            ) : (
              <>
                <form onSubmit={handleSearch} className="flex gap-2">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      value={query}
                      onChange={e => setQuery(e.target.value)}
                      placeholder="Search resident by name or ABHA..."
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2.5 pl-8 pr-4 text-slate-100 outline-none"
                    />
                    <Search className="w-4 h-4 text-slate-600 absolute left-2.5 top-3" />
                  </div>
                  <button type="submit" className="px-4 bg-slate-900 border border-slate-800 rounded-xl hover:bg-slate-850">
                    Find
                  </button>
                </form>

                <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                  {citizens.map((c) => (
                    <div key={c.id} className="p-4 bg-slate-950/60 rounded-xl border border-slate-900 flex justify-between items-center">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-slate-202 text-sm">{c.name}</span>
                          {c.isOfflineCreated && (
                            <span className="bg-amber-500/10 text-amber-450 border border-amber-500/20 text-[7px] font-bold px-1.5 py-0.5 rounded tracking-wide uppercase">Offline Profile</span>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-500 mt-0.5">{c.jurisdiction || 'Haveli Village'} | ABHA: {c.abhaId || 'Not Linked'}</p>
                      </div>
                      <Link
                        to={`/worker/screening?citizenId=${c.id}&name=${encodeURIComponent(c.name)}&village=${encodeURIComponent(c.jurisdiction || 'Haveli')}`}
                        className="px-3.5 py-2 bg-emerald-650 hover:bg-emerald-600 text-slate-950 font-extrabold rounded-xl uppercase text-[10px] tracking-wide"
                      >
                        Screen
                      </Link>
                    </div>
                  ))}
                  {citizens.length === 0 && !loading && (
                    <p className="text-center py-6 text-slate-600 font-mono">No village residents found. Click "New Citizen" to register a profile.</p>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Sync Queue Logs */}
        <div className="lg:col-span-5">
          <div className="glass-panel p-6 rounded-2xl border border-slate-900 space-y-4">
            <span className="font-bold text-slate-205 uppercase block">Recent Field Screenings</span>
            <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
              {history.map((h) => (
                <div key={h.client_record_id} className="p-3 bg-slate-950 rounded-xl border border-slate-900 space-y-2">
                  <div className="flex justify-between items-center border-b border-slate-900 pb-1.5">
                    <div>
                      <span className="font-bold text-slate-202 block text-xs">{h.citizen_name}</span>
                      <span className="text-[9px] text-slate-500">{h.village} | {new Date(h.screening_date).toLocaleDateString()}</span>
                    </div>
                    <span className={`px-2 py-0.5 text-[8px] font-bold rounded uppercase border ${
                      h.sync_status === 'SYNCED'
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        : h.sync_status === 'FAILED'
                        ? 'bg-rose-500/10 text-rose-455 border-rose-500/20'
                        : 'bg-amber-500/10 text-amber-450 border-amber-500/20'
                    }`}>
                      {h.sync_status}
                    </span>
                  </div>
                  
                  {/* Screening clinical stats */}
                  <div className="grid grid-cols-3 gap-2 text-[9px] font-mono text-slate-400">
                    <div>BP: <strong className="text-slate-300">{h.systolic_status === 'MEASURED' ? `${h.systolic}/${h.diastolic}` : 'N/A'}</strong></div>
                    <div>SpO2: <strong className="text-slate-300">{h.spo2_status === 'MEASURED' ? `${h.spo2}%` : 'N/A'}</strong></div>
                    <div>Temp: <strong className="text-slate-300">{h.temperature_status === 'MEASURED' ? `${h.temperature}°F` : 'N/A'}</strong></div>
                  </div>

                  {h.risk_level !== 'NORMAL' && (
                    <div className="mt-1 flex items-center gap-1.5 text-[9px] font-bold text-rose-400">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>{h.risk_level} FLAG</span>
                    </div>
                  )}

                  {h.error && (
                    <p className="text-[8px] text-rose-455 font-mono truncate">Error: {h.error}</p>
                  )}
                </div>
              ))}

              {history.length === 0 && (
                <p className="text-center py-6 text-slate-600 font-mono">No screenings recorded today.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
