import React, { useState, useEffect } from 'react';
import { Activity, Shield, RefreshCw } from 'lucide-react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '/api/v1';

export default function SuperAdminDashboard() {
  const [health, setHealth] = useState<any>(null);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchSystemData = async () => {
    setLoading(true);
    try {
      const token = sessionStorage.getItem('token');
      const healthRes = await axios.get(`${API_URL}/super-admin/system-health`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (healthRes.data?.success) {
        setHealth(healthRes.data.data);
      }

      const auditRes = await axios.get(`${API_URL}/super-admin/audit-logs`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (auditRes.data?.success) {
        setAuditLogs(auditRes.data.data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSystemData();
  }, []);

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4 font-mono text-xs text-slate-350">
      <div className="flex justify-between items-center border-b border-slate-900 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-rose-500/10 rounded-xl text-rose-455 border border-rose-500/20">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-100 uppercase">Super Admin Console</h2>
            <p className="text-[10px] text-slate-500">System health monitoring, audit trail inspectors, and database diagnostics</p>
          </div>
        </div>
        <button
          onClick={fetchSystemData}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-slate-950 font-bold rounded-xl uppercase flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Refresh metrics</span>
        </button>
      </div>

      {health && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-center">
          <div className="glass-panel p-5 rounded-xl border border-slate-900">
            <span className="text-[10px] text-slate-500 block uppercase">CPU Load</span>
            <strong className="text-xl text-slate-100 font-bold block mt-1">{health.cpuUsage}</strong>
          </div>
          <div className="glass-panel p-5 rounded-xl border border-slate-900">
            <span className="text-[10px] text-slate-500 block uppercase">Memory Usage</span>
            <strong className="text-xl text-slate-100 font-bold block mt-1">{health.memoryUsage}</strong>
          </div>
          <div className="glass-panel p-5 rounded-xl border border-slate-900">
            <span className="text-[10px] text-slate-500 block uppercase">Storage Usage</span>
            <strong className="text-xl text-slate-100 font-bold block mt-1">{health.storageUsage}</strong>
          </div>
          <div className="glass-panel p-5 rounded-xl border border-slate-900">
            <span className="text-[10px] text-slate-500 block uppercase">API Latency</span>
            <strong className="text-xl text-emerald-400 font-bold block mt-1">{health.apiLatency}</strong>
          </div>
        </div>
      )}

      <div className="glass-panel p-6 rounded-2xl border border-slate-900 space-y-4">
        <span className="font-bold text-slate-205 uppercase block">Recent System Audit Trails</span>
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {auditLogs.map((log) => (
            <div key={log.id} className="p-3 bg-slate-950 rounded border border-slate-900 flex justify-between items-center text-[10px]">
              <div>
                <strong className="text-slate-300 block">User: {log.user_id} | Module: {log.module}</strong>
                <span className="text-slate-500">{log.action}</span>
              </div>
              <span className="text-slate-600">{new Date(log.created_at).toLocaleString()}</span>
            </div>
          ))}
          {auditLogs.length === 0 && (
            <p className="text-slate-500 text-center py-4">No audit logs written yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}
export { Activity, Shield, RefreshCw };
