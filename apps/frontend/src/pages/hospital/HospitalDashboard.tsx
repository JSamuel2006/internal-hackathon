import React, { useState, useEffect } from 'react';
import { 
  Activity, Shield, ShieldCheck, HeartPulse, User, Calendar, Clock, RefreshCw, Send, CheckCircle2, AlertCircle, FileText, Check, Plus, Warehouse
} from 'lucide-react';
import axios from 'axios';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const API_URL = import.meta.env.VITE_API_URL || '/api/v1';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default function HospitalDashboard() {
  const [loading, setLoading] = useState(false);
  const [hospitals, setHospitals] = useState<any[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [error, setError] = useState('');

  const fetchHospitalData = async () => {
    setLoading(true);
    setError('');
    try {
      const hospRes = await api.get('/hospitals');
      if (hospRes.data?.success) setHospitals(hospRes.data.data || []);

      const docRes = await api.get('/doctors');
      if (docRes.data?.success) setDoctors(docRes.data.data || []);
    } catch (err) {
      setError('Could not retrieve hospital parameters.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHospitalData();
  }, []);

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4">
      {/* Title Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-rose-500/10 rounded-xl text-rose-455 border border-rose-500/20 shadow-lg">
            <Warehouse className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
              Hospital Logistics & Telemetry Command Center
              <span className="text-[10px] bg-rose-500/15 text-rose-400 border border-rose-500/20 px-2 py-0.5 rounded font-mono uppercase">Facility view</span>
            </h2>
            <p className="text-xs text-slate-600 mt-0.5">Track bed occupancies, operational statuses, and doctor schedules across the district health grid</p>
          </div>
        </div>

        <button
          onClick={fetchHospitalData}
          disabled={loading}
          className="px-4 py-2 border border-slate-200 bg-white hover:bg-slate-855 text-slate-355 font-semibold rounded-xl text-xs flex items-center gap-2 transition-all"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Sync Logistics</span>
        </button>
      </div>

      {/* Notifications */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-455 text-xs flex items-center gap-2.5 shadow-lg font-mono">
          <AlertCircle className="w-4.5 h-4.5 text-rose-400 shrink-0" />
          <span className="font-semibold">{error}</span>
        </div>
      )}

      {/* Hospital details layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {hospitals.map((h) => (
          <div key={h.id} className="bg-white border border-slate-200 shadow-sm p-6 rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950/20 shadow-xl space-y-4">
            <div className="flex justify-between items-start border-b border-slate-200 pb-2.5">
              <div>
                <h3 className="text-sm font-bold text-slate-205">{h.name}</h3>
                <span className="text-[10px] text-slate-500 font-mono block mt-0.5">{h.address}</span>
              </div>
              <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-0.5 rounded font-mono font-bold uppercase">Online</span>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs font-mono text-center">
              <div className="bg-white p-3 rounded-xl border border-slate-200">
                <span className="text-slate-500 text-[9px] uppercase block">Bed Occupancy</span>
                <strong className="text-lg font-bold text-amber-500 block mt-1">{h.bedOccupancy}%</strong>
              </div>
              <div className="bg-white p-3 rounded-xl border border-slate-200">
                <span className="text-slate-500 text-[9px] uppercase block">Emergency Queue</span>
                <strong className="text-lg font-bold text-rose-455 block mt-1">{h.emergencyQueue} patients</strong>
              </div>
            </div>

            {/* Online doctor list */}
            <div className="space-y-2">
              <span className="text-[9px] text-slate-550 uppercase font-mono font-bold block">Assigned Doctors:</span>
              <div className="space-y-1.5 text-[11px] font-mono">
                {doctors.filter(d => d.hospitalId === h.id).map(doc => (
                  <div key={doc.id} className="flex justify-between p-2 bg-white rounded border border-slate-200/80 text-slate-600">
                    <span>{doc.name} ({doc.specialty})</span>
                    <span className="text-indigo-400">{doc.availability}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* LIS & PMS Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 font-mono text-xs">
        <div className="bg-white border border-slate-200 shadow-sm p-6 rounded-2xl border border-slate-200 space-y-4">
          <h4 className="font-bold text-slate-800 uppercase tracking-wider border-b border-slate-200 pb-2">
            Laboratory turnaround Time Trends (Mins)
          </h4>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={[
                { name: '09:00', time: 42 },
                { name: '11:00', time: 55 },
                { name: '13:00', time: 38 },
                { name: '15:00', time: 61 },
                { name: '17:00', time: 30 }
              ]}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="name" stroke="#64748b" fontSize={10} />
                <YAxis stroke="#64748b" fontSize={10} />
                <Tooltip contentStyle={{ backgroundColor: '#020617', borderColor: '#1e293b' }} />
                <Area type="monotone" dataKey="time" stroke="#ec4899" fill="rgba(236,72,153,0.1)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white border border-slate-200 shadow-sm p-6 rounded-2xl border border-slate-200 space-y-4">
          <h4 className="font-bold text-slate-800 uppercase tracking-wider border-b border-slate-200 pb-2">
            Pharmacy Inventory stock Levels
          </h4>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={[
                { name: 'Paracetamol', qty: 120 },
                { name: 'Amoxicillin', qty: 8 },
                { name: 'Metformin', qty: 85 },
                { name: 'Ibuprofen', qty: 45 }
              ]}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="name" stroke="#64748b" fontSize={10} />
                <YAxis stroke="#64748b" fontSize={10} />
                <Tooltip contentStyle={{ backgroundColor: '#020617', borderColor: '#1e293b' }} />
                <Area type="monotone" dataKey="qty" stroke="#6366f1" fill="rgba(99,102,241,0.1)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
