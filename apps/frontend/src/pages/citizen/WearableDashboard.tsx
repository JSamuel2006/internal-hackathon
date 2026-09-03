import React, { useState, useEffect } from 'react';
import { Activity, Shield, RefreshCw } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '/api/v1';

export default function WearableDashboard() {
  const [trends, setTrends] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchTrends = async () => {
    setLoading(true);
    try {
      const token = sessionStorage.getItem('token');
      const res = await axios.get(`${API_URL}/wearables/trends`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data?.success) {
        setTrends(res.data.data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrends();
  }, []);

  const handleSync = async () => {
    setLoading(true);
    try {
      const token = sessionStorage.getItem('token');
      await axios.post(`${API_URL}/wearables/sync`, {
        heartRate: 72,
        systolic: 120,
        diastolic: 80,
        spo2: 98,
        glucose: 110,
        steps: 8420,
        calories: 420,
        deviceName: 'Apple Watch Series 9'
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchTrends();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4 font-mono text-xs text-slate-500">
      <div className="flex justify-between items-center border-b border-slate-200 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-500/10 rounded-xl text-indigo-400 border border-indigo-500/20">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900 uppercase">IoT Wearable & Smartwatch Sync</h2>
            <p className="text-[10px] text-slate-500">Synchronize steps, blood pressures, and blood oxygen levels from smart devices</p>
          </div>
        </div>
        <button
          onClick={handleSync}
          className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-slate-950 font-bold rounded-xl uppercase flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Sync Device</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-center">
        <div className="bg-white border border-slate-200 shadow-sm p-5 rounded-xl border border-slate-200">
          <span className="text-[10px] text-slate-500 block uppercase">Heart Rate</span>
          <strong className="text-2xl text-rose-600 font-bold block mt-1">72 BPM</strong>
        </div>
        <div className="bg-white border border-slate-200 shadow-sm p-5 rounded-xl border border-slate-200">
          <span className="text-[10px] text-slate-500 block uppercase">Blood Oxygen (SpO₂)</span>
          <strong className="text-2xl text-emerald-400 font-bold block mt-1">98%</strong>
        </div>
        <div className="bg-white border border-slate-200 shadow-sm p-5 rounded-xl border border-slate-200">
          <span className="text-[10px] text-slate-500 block uppercase">Steps Plotted</span>
          <strong className="text-2xl text-indigo-450 font-bold block mt-1">8,420 / 10,000</strong>
        </div>
      </div>

      <div className="bg-white border border-slate-200 shadow-sm p-6 rounded-2xl border border-slate-200 space-y-4">
        <span className="font-bold text-slate-800 uppercase block">Wearable Step Trends (Last 7 Days)</span>
        <div className="h-52">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={[
              { date: 'Mon', steps: 6200 },
              { date: 'Tue', steps: 7100 },
              { date: 'Wed', steps: 8400 },
              { date: 'Thu', steps: 5200 },
              { date: 'Fri', steps: 9100 }
            ]}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="date" stroke="#64748b" fontSize={10} />
              <YAxis stroke="#64748b" fontSize={10} />
              <Tooltip contentStyle={{ backgroundColor: '#020617', borderColor: '#1e293b' }} />
              <Area type="monotone" dataKey="steps" stroke="#4f46e5" fill="rgba(79,70,229,0.1)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
export { Activity, Shield, RefreshCw };
