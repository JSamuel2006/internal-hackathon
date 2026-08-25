import React, { useState, useEffect } from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { 
  Activity, LayoutDashboard, ClipboardList, LogOut, ShieldAlert,
  Wifi, WifiOff, RefreshCw
} from 'lucide-react';
import { authService, workerService } from '../services/api';
import { offlineScreeningStorage } from '../services/offlineScreeningStorage';

export default function WorkerLayout() {
  const navigate = useNavigate();
  const [online, setOnline] = useState(navigator.onLine);
  const [pendingCount, setPendingCount] = useState(0);
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState('');

  // Track online/offline status
  useEffect(() => {
    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Sync queue status checker
    const checkQueue = () => {
      const stats = offlineScreeningStorage.getStats();
      setPendingCount(stats.pending);
    };

    checkQueue();
    const interval = setInterval(checkQueue, 4000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, []);

  const handleSync = async () => {
    if (!online || syncing) return;
    setSyncing(true);
    setSyncMessage('Synchronizing field screening records...');
    try {
      const screenings = offlineScreeningStorage.getScreenings().filter(s => s.sync_status === 'PENDING' || s.sync_status === 'FAILED');
      if (screenings.length === 0) {
        setSyncMessage('No pending records to synchronize.');
        setTimeout(() => setSyncMessage(''), 2000);
        setSyncing(false);
        return;
      }

      const res = await workerService.syncScreenings(screenings);
      if (res.success && Array.isArray(res.data)) {
        res.data.forEach((item: any) => {
          if (item.status === 'SUCCESS') {
            offlineScreeningStorage.updateSyncStatus(item.client_record_id, 'SYNCED');
          } else {
            offlineScreeningStorage.updateSyncStatus(item.client_record_id, 'FAILED', item.error);
          }
        });
        offlineScreeningStorage.clearSynced();
        const stats = offlineScreeningStorage.getStats();
        setPendingCount(stats.pending);
        setSyncMessage(`Synchronization complete. Unsynced remaining: ${stats.pending}`);
      } else {
        setSyncMessage('Synchronization failed on backend.');
      }
    } catch (err: any) {
      setSyncMessage(`Error syncing: ${err.message || err}`);
    } finally {
      setSyncing(false);
      setTimeout(() => setSyncMessage(''), 3000);
    }
  };

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  const userRaw = sessionStorage.getItem('user');
  const user = userRaw ? JSON.parse(userRaw) : { name: 'Sunita Devi (ASHA)', jurisdiction: 'Haveli Village' };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-mono text-xs">
      {/* Top Banner Status Bar */}
      <div className="bg-slate-900 border-b border-slate-800 px-4 py-2 flex justify-between items-center z-50">
        <div className="flex items-center gap-3">
          <div className="p-1 bg-emerald-500/10 rounded text-emerald-450 border border-emerald-500/20">
            <Activity className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <span className="font-bold text-slate-202 text-[10px] block uppercase tracking-wider">ArogyaMitra Field Screen</span>
            <span className="text-[9px] text-slate-500">{user.name} | {user.jurisdiction}</span>
          </div>
        </div>

        {/* Connectivity and sync indicators */}
        <div className="flex items-center gap-3">
          {syncMessage && (
            <span className="text-[9px] text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 animate-pulse">
              {syncMessage}
            </span>
          )}

          {pendingCount > 0 && (
            <button
              onClick={handleSync}
              disabled={syncing || !online}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-[9px] font-bold border transition-all ${
                online
                  ? 'bg-amber-500 text-slate-950 border-amber-600 hover:bg-amber-400'
                  : 'bg-slate-800 text-slate-500 border-slate-700 cursor-not-allowed'
              }`}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
              <span>{pendingCount} PENDING</span>
            </button>
          )}

          <div className={`flex items-center gap-1 px-2 py-0.5 rounded text-[9px] border font-bold ${
            online 
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
              : 'bg-rose-500/10 text-rose-450 border-rose-500/20'
          }`}>
            {online ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
            <span>{online ? 'ONLINE' : 'OFFLINE'}</span>
          </div>
        </div>
      </div>

      {/* Main Layout Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar Nav */}
        <nav className="w-48 bg-slate-950 border-r border-slate-900 flex flex-col justify-between p-4 hidden md:flex">
          <div className="space-y-4">
            <Link
              to="/worker/dashboard"
              className="flex items-center gap-2.5 py-2.5 px-3 rounded-xl text-slate-350 hover:bg-slate-900 hover:text-slate-100 transition-all font-semibold"
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Field Board</span>
            </Link>
            <Link
              to="/worker/screening"
              className="flex items-center gap-2.5 py-2.5 px-3 rounded-xl text-slate-350 hover:bg-slate-900 hover:text-slate-100 transition-all font-semibold"
            >
              <ClipboardList className="w-4 h-4" />
              <span>New Screen</span>
            </Link>
          </div>

          <button
            onClick={handleLogout}
            className="flex items-center gap-2.5 py-2.5 px-3 rounded-xl text-rose-455 hover:bg-rose-500/10 transition-all font-semibold text-left w-full border border-transparent hover:border-rose-500/20"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </nav>

        {/* Dynamic page content */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          {/* Mobile navigation header */}
          <div className="flex md:hidden justify-around border-b border-slate-900 pb-4 mb-6 text-center">
            <Link to="/worker/dashboard" className="px-3 py-1.5 bg-slate-900 rounded-lg flex items-center gap-1.5 font-bold">
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span>Board</span>
            </Link>
            <Link to="/worker/screening" className="px-3 py-1.5 bg-slate-900 rounded-lg flex items-center gap-1.5 font-bold">
              <ClipboardList className="w-3.5 h-3.5" />
              <span>Screen</span>
            </Link>
            <button onClick={handleLogout} className="px-3 py-1.5 bg-slate-900 text-rose-400 rounded-lg flex items-center gap-1.5 font-bold">
              <LogOut className="w-3.5 h-3.5" />
              <span>Exit</span>
            </button>
          </div>

          <Outlet />
        </main>
      </div>
    </div>
  );
}
