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
          <div className="p-2.5 bg-rose-50 rounded-xl text-rose-600 border border-rose-200 shadow-2xs">
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
          className="px-4 py-2 border border-slate-200 bg-white hover:bg-slate-900 text-slate-500 font-semibold rounded-xl text-xs flex items-center gap-2 transition-all"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Sync Logistics</span>
        </button>
      </div>

      {/* Notifications */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 text-xs flex items-center gap-2.5 shadow-lg font-mono">
          <AlertCircle className="w-4.5 h-4.5 text-rose-400 shrink-0" />
          <span className="font-semibold">{error}</span>
        </div>
      )}

      {/* Hospital details layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {hospitals.map((h) => (
          <div key={h.id} className="bg-white border border-slate-200 shadow-sm p-6 rounded-2xl space-y-4">
            <div className="flex justify-between items-start border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">{h.name}</h3>
                <span className="text-xs text-slate-500 block mt-0.5">{h.address}</span>
              </div>
              <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wide">Online</span>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs font-sans text-center">
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80">
                <span className="text-slate-500 text-[10px] uppercase font-bold tracking-wider block">Bed Occupancy</span>
                <strong className="text-xl font-extrabold text-amber-600 block mt-1">{h.bedOccupancy}%</strong>
              </div>
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80">
                <span className="text-slate-500 text-[10px] uppercase font-bold tracking-wider block">Emergency Queue</span>
                <strong className="text-xl font-extrabold text-rose-600 block mt-1">{h.emergencyQueue} patients</strong>
              </div>
            </div>

            {/* Online doctor list */}
            <div className="space-y-2 pt-1">
              <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider block">Assigned Medical Officers:</span>
              <div className="space-y-1.5 text-xs">
                {doctors.filter(d => d.hospitalId === h.id).map(doc => (
                  <div key={doc.id} className="flex flex-wrap justify-between items-center p-2.5 bg-slate-50 rounded-xl border border-slate-100 text-slate-700">
                    <span className="font-semibold text-slate-900">{doc.name} ({doc.specialty})</span>
                    <span className="text-teal-700 font-bold text-xs">{doc.availability}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* LIS & PMS Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-xs">
        <div className="bg-white border border-slate-200 shadow-sm p-6 rounded-2xl space-y-4">
          <h4 className="font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2 text-xs">
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
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="name" stroke="#64748B" fontSize={10} />
                <YAxis stroke="#64748B" fontSize={10} />
                <Tooltip contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#CBD5E1', borderRadius: '12px', color: '#0F172A' }} />
                <Area type="monotone" dataKey="time" stroke="#0D9488" fill="rgba(13,148,136,0.1)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white border border-slate-200 shadow-sm p-6 rounded-2xl space-y-4">
          <h4 className="font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2 text-xs">
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
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="name" stroke="#64748B" fontSize={10} />
                <YAxis stroke="#64748B" fontSize={10} />
                <Tooltip contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#CBD5E1', borderRadius: '12px', color: '#0F172A' }} />
                <Area type="monotone" dataKey="qty" stroke="#2563EB" fill="rgba(37,99,235,0.1)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
