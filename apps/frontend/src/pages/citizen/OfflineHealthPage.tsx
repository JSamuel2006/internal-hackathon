import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, RefreshCw, Activity, Heart, BookOpen, AlertCircle, CheckCircle, Wifi, WifiOff 
} from 'lucide-react';
import { offlineStorage } from '../../services/offlineStorage';
import { offlineScreeningStorage } from '../../services/offlineScreeningStorage';
import { firstAidArticles } from '../../services/firstAidData';
import { workerService } from '../../services/api';

export default function OfflineHealthPage() {
  const userRaw = sessionStorage.getItem('user');
  const user = userRaw ? JSON.parse(userRaw) : null;
  const userId = user?.id || 'default_citizen';

  const [online, setOnline] = useState(navigator.onLine);
  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState('');
  
  // Cache States
  const [profile, setProfile] = useState<any>(null);
  const [recentScreening, setRecentScreening] = useState<any>(null);
  const [pendingCount, setPendingCount] = useState(0);
  const [lastSynced, setLastSynced] = useState<string>('');

  // First Aid Modal/Detail state
  const [selectedArticle, setSelectedArticle] = useState<any>(null);

  // Load from IndexedDB Cache
  const loadCache = async () => {
    if (!userId) return;
    const cachedProfile = await offlineStorage.get('profiles', userId);
    const cachedTimeline = await offlineStorage.get('timelines', userId);
    const cachedEmergency = await offlineStorage.get('emergency', userId);
    
    // Load screenings
    const screenings = await offlineScreeningStorage.getScreenings();
    const pending = screenings.filter(s => s.sync_status === 'PENDING').length;
    setPendingCount(pending);

    if (cachedProfile) {
      setProfile(cachedProfile);
    } else if (user) {
      // Seed initial data
      setProfile({
        name: user.name,
        abhaId: user.abhaId,
        age: 35,
        gender: 'Male',
        bloodGroup: 'O-Positive',
        allergies: 'None reported',
        conditions: 'None',
        medicines: 'None',
        emergencyContact: '+91-9988776655'
      });
    }

    if (cachedTimeline && cachedTimeline.length > 0) {
      setRecentScreening(cachedTimeline[0]);
    }

    const lastSyncTime = localStorage.getItem(`last_sync_${userId}`);
    if (lastSyncTime) {
      setLastSynced(new Date(lastSyncTime).toLocaleString());
    } else {
      setLastSynced('Never');
    }
  };

  // Cache live data when online
  const cacheLiveData = async () => {
    if (!navigator.onLine || !userId) return;
    try {
      // Save current user profile to profiles store
      const initialProfile = {
        name: user?.name || 'Rahul Verma',
        abhaId: user?.abhaId || 'ABHA-91-8842-1029-4410',
        age: 32,
        gender: 'Male',
        bloodGroup: 'O-Positive',
        allergies: 'Penicillin, Dust mites',
        conditions: 'Hypertension',
        medicines: 'Amlodipine 5mg (1 Tablet, Daily)',
        emergencyContact: '+91-9876543210'
      };
      await offlineStorage.set('profiles', userId, userId, initialProfile);
      setProfile(initialProfile);

      // Fetch history if citizen
      if (user?.role === 'ROLE_CITIZEN') {
        const historyRes = await workerService.getCitizenHistory(userId);
        if (historyRes.success && Array.isArray(historyRes.data) && historyRes.data.length > 0) {
          await offlineStorage.set('timelines', userId, userId, historyRes.data);
          setRecentScreening(historyRes.data[0]);
        }
      }

      localStorage.setItem(`last_sync_${userId}`, new Date().toISOString());
      setLastSynced(new Date().toLocaleString());
    } catch (e) {
      console.warn('Failed to cache live data', e);
    }
  };

  // Sync offline screenings
  const handleSyncNow = async () => {
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
  };

  useEffect(() => {
    loadCache();
    if (online) {
      cacheLiveData();
    }

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
  }, [online, userId]);

  return (
    <div className="space-y-6 max-w-4xl mx-auto p-4 pb-20">
      {/* Top Banner Status */}
      <div className={`p-4 rounded-2xl border transition-all flex items-center justify-between ${
        online 
          ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-450' 
          : 'bg-rose-500/10 border-rose-500/20 text-rose-455'
      }`}>
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${online ? 'bg-emerald-500/20' : 'bg-rose-500/20'}`}>
            {online ? <Wifi className="w-6 h-6 animate-pulse" /> : <WifiOff className="w-6 h-6" />}
          </div>
          <div>
            <h2 className="text-lg font-bold tracking-tight">
              {online ? '🟢 Online Mode' : '🔴 Offline Care Mode'}
            </h2>
            <p className="text-xs opacity-80 mt-0.5">
              {online 
                ? 'All health data is active and real-time. Unsynced local files will auto-sync.' 
                : 'Essential care records and guides are fully functional on this device.'}
            </p>
          </div>
        </div>
        <div className="text-right text-[10px] font-mono opacity-70">
          Last Synced: <br />
          <span className="font-bold">{lastSynced}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Profile Card */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-900 space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-900 pb-3">
            <Activity className="w-5 h-5 text-indigo-400" />
            <h3 className="font-bold text-sm text-slate-200 uppercase tracking-wider">👤 Profile Information</h3>
          </div>
          {profile ? (
            <div className="space-y-3 font-mono text-[11px] text-slate-300">
              <div className="flex justify-between py-1 border-b border-slate-950">
                <span className="text-slate-500 uppercase">Name</span>
                <span className="text-slate-200 font-bold">{profile.name}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-950">
                <span className="text-slate-500 uppercase">ABHA ID</span>
                <span className="text-slate-200 font-bold">{profile.abhaId}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-950">
                <span className="text-slate-500 uppercase">Blood Group</span>
                <span className="text-rose-400 font-bold">{profile.bloodGroup}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-950">
                <span className="text-slate-500 uppercase">Emergency Call</span>
                <span className="text-slate-200 font-bold">{profile.emergencyContact}</span>
              </div>
              <div className="py-1">
                <span className="text-slate-500 uppercase block mb-1">Allergies</span>
                <span className="text-amber-450 font-bold block">{profile.allergies}</span>
              </div>
              <div className="py-1">
                <span className="text-slate-500 uppercase block mb-1">Medicines</span>
                <span className="text-indigo-300 block">{profile.medicines}</span>
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-500 italic">No cached profile found. Load while online to save.</p>
          )}
        </div>

        {/* Sync Queue */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-900 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center gap-2 border-b border-slate-900 pb-3">
              <RefreshCw className="w-5 h-5 text-amber-400" />
              <h3 className="font-bold text-sm text-slate-200 uppercase tracking-wider">🔄 Offline Sync Manager</h3>
            </div>
            <p className="text-xs text-slate-400 mt-2">
              ASHA screening files registered during network outages are queued locally. They will transfer automatically once a network handshake occurs.
            </p>
            <div className="mt-4 p-4 bg-slate-955 rounded-xl border border-slate-900 flex justify-between items-center">
              <span className="text-xs text-slate-400">Pending Sync Queue</span>
              <span className={`px-2.5 py-1 rounded-full text-xs font-bold font-mono ${
                pendingCount > 0 ? 'bg-amber-500/20 text-amber-400 animate-pulse' : 'bg-slate-900 text-slate-500'
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
            className="w-full py-3.5 bg-indigo-650 hover:bg-indigo-600 disabled:bg-slate-900 disabled:text-slate-600 text-slate-950 font-bold uppercase text-xs rounded-xl tracking-widest transition-colors flex items-center justify-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
            <span>{syncing ? 'SYNCING...' : 'SYNC NOW'}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Recent Screening / History */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-900 space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-900 pb-3">
            <Heart className="w-5 h-5 text-rose-500" />
            <h3 className="font-bold text-sm text-slate-200 uppercase tracking-wider">📋 Recent Health Screening</h3>
          </div>
          {recentScreening ? (
            <div className="space-y-2 text-xs">
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-900 flex justify-between items-center">
                <span className="text-slate-400">Date</span>
                <span className="font-mono text-slate-300">{new Date(recentScreening.screening_date || recentScreening.createdAt).toLocaleDateString()}</span>
              </div>
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-900 flex justify-between items-center">
                <span className="text-slate-400">Blood Pressure</span>
                <span className="font-mono text-slate-200 font-bold">
                  {recentScreening.systolic}/{recentScreening.diastolic} mmHg
                </span>
              </div>
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-900 flex justify-between items-center">
                <span className="text-slate-400">Oxygen (SpO2)</span>
                <span className="font-mono text-emerald-450 font-bold">{recentScreening.spo2}%</span>
              </div>
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-900 flex justify-between items-center">
                <span className="text-slate-400">Pulse</span>
                <span className="font-mono text-slate-200">{recentScreening.pulse} bpm</span>
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-500 italic">No recent screening cached. Open this page online to load screenings.</p>
          )}
        </div>

        {/* First Aid Guidance */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-900 space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-900 pb-3">
            <BookOpen className="w-5 h-5 text-teal-400" />
            <h3 className="font-bold text-sm text-slate-200 uppercase tracking-wider">🩹 First-Aid Guidance</h3>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {firstAidArticles.map((art) => (
              <button
                key={art.id}
                onClick={() => setSelectedArticle(art)}
                className="p-3.5 bg-slate-950 hover:bg-slate-900 text-left border border-slate-850 rounded-xl transition-all space-y-1.5"
              >
                <span className="text-[10px] text-indigo-400 font-bold block">{art.category}</span>
                <span className="text-xs text-slate-200 font-bold block">{art.title}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* First Aid Article Modal */}
      {selectedArticle && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-panel max-w-lg w-full max-h-[85vh] overflow-y-auto p-6 rounded-2xl border border-slate-900 space-y-6">
            <div className="flex justify-between items-start border-b border-slate-900 pb-3">
              <div>
                <span className="text-[10px] text-indigo-400 font-bold block uppercase tracking-wider">{selectedArticle.category}</span>
                <h4 className="text-lg font-bold text-slate-100">{selectedArticle.title}</h4>
              </div>
              <button 
                onClick={() => setSelectedArticle(null)}
                className="px-2.5 py-1 bg-slate-900 hover:bg-slate-850 border border-slate-800 text-[10px] text-slate-400 font-bold uppercase rounded"
              >
                Close
              </button>
            </div>
            
            <p className="text-xs text-slate-350">{selectedArticle.description}</p>
            
            <div className="space-y-2">
              <span className="text-[10px] text-slate-450 uppercase font-bold tracking-wider block">Recommended Steps</span>
              <ol className="list-decimal list-inside text-xs text-slate-300 space-y-2 leading-relaxed">
                {selectedArticle.steps.map((st: string, i: number) => (
                  <li key={i}>{st}</li>
                ))}
              </ol>
            </div>

            <div className="p-4 bg-amber-500/10 border border-amber-500/20 text-amber-455 rounded-xl space-y-1.5">
              <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase">
                <AlertCircle className="w-4 h-4 text-amber-450" />
                <span>Precautions & Warnings</span>
              </div>
              <ul className="list-disc list-inside text-[10px] space-y-1 leading-relaxed">
                {selectedArticle.warnings.map((w: string, i: number) => (
                  <li key={i}>{w}</li>
                ))}
              </ul>
            </div>

            <p className="text-[8px] text-slate-500 italic text-center">
              Disclaimer: Educational information only. Seek professional emergency care immediately for serious symptoms.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
