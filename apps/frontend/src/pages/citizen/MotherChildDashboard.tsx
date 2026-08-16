import React, { useState, useEffect } from 'react';
import { Activity, Shield, Calendar, Clock, RefreshCw, BarChart2, Plus, CheckCircle2, AlertCircle } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import axios from 'axios';

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

export default function MotherChildDashboard() {
  const [loading, setLoading] = useState(false);
  const [motherProfile, setMotherProfile] = useState<any>(null);
  const [childProfile, setChildProfile] = useState<any>(null);
  const [vaccinations, setVaccinations] = useState<any[]>([]);
  const [growthRecords, setGrowthRecords] = useState<any[]>([]);

  const [motherAbha, setMotherAbha] = useState('');
  const [edd, setEdd] = useState('');
  const [childName, setChildName] = useState('');
  const [childAbha, setChildAbha] = useState('');

  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleRegisterMother = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await api.post('/mother-child/pregnancy', { abhaId: motherAbha, edd });
      if (res.data?.success) {
        setSuccessMsg('Mother pregnancy profile registered successfully!');
        setMotherProfile({ abhaId: motherAbha, edd, risk: 'Low' });
        fetchVaccinations(res.data.data.profileId);
      }
    } catch (err) {
      setError('Could not register mother profile');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterChild = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await api.post('/mother-child/child', { motherId: 'moth-default', abhaId: childAbha, name: childName });
      if (res.data?.success) {
        setSuccessMsg('Child profile registered successfully!');
        setChildProfile({ name: childName, abhaId: childAbha });
        fetchGrowthRecords(res.data.data.childId);
      }
    } catch (err) {
      setError('Could not register child profile');
    } finally {
      setLoading(false);
    }
  };

  const fetchVaccinations = async (id: string) => {
    try {
      const res = await api.get(`/mother-child/vaccinations/${id}`);
      if (res.data?.success) setVaccinations(res.data.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchGrowthRecords = async (id: string) => {
    try {
      const res = await api.get(`/mother-child/growth/${id}`);
      if (res.data?.success) setGrowthRecords(res.data.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4 font-mono text-xs text-slate-350">
      {/* Title Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-900 pb-5">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-500/10 rounded-xl text-indigo-400 border border-indigo-500/20 shadow-lg">
            <Activity className="w-5 h-5 glow-pill" />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight text-slate-100 flex items-center gap-2">
              Mother & Child Health Module
              <span className="text-[10px] bg-indigo-500/15 text-indigo-400 border border-indigo-500/20 px-2 py-0.5 rounded font-mono uppercase">MCH Portal</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">Track pregnancy trimesters, vaccination timelines, and pediatric growth milestone graphs</p>
          </div>
        </div>
      </div>

      {/* Notifications */}
      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-450 text-xs flex items-center gap-2.5 shadow-lg">
          <CheckCircle2 className="w-4.5 h-4.5 text-emerald-400 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}
      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-455 text-xs flex items-center gap-2.5 shadow-lg">
          <AlertCircle className="w-4.5 h-4.5 text-rose-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left column (registrations) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Pregnancy Registration */}
          <div className="glass-panel p-6 rounded-2xl border border-slate-900 space-y-4">
            <h3 className="text-xs font-bold text-slate-205 uppercase tracking-wider border-b border-slate-850 pb-2">
              Pregnancy registration
            </h3>
            {motherProfile ? (
              <div className="space-y-2">
                <p>Mother ABHA: <strong className="text-slate-200">{motherProfile.abhaId}</strong></p>
                <p>EDD: <strong className="text-slate-200">{motherProfile.edd}</strong></p>
                <p>Risk Score: <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 text-[10px] rounded font-bold">{motherProfile.risk}</span></p>
              </div>
            ) : (
              <form onSubmit={handleRegisterMother} className="space-y-3">
                <input
                  type="text"
                  placeholder="Mother ABHA Card ID..."
                  value={motherAbha}
                  aria-label="Mother ABHA ID"
                  onChange={e => setMotherAbha(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-850 rounded-xl p-2.5 text-slate-355 focus:outline-none"
                />
                <input
                  type="date"
                  placeholder="Estimated Date of Delivery (EDD)"
                  value={edd}
                  aria-label="Estimated Date of Delivery"
                  onChange={e => setEdd(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-850 rounded-xl p-2.5 text-slate-355 focus:outline-none"
                />
                <button type="submit" className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-slate-950 font-bold rounded-xl uppercase">
                  Register Pregnancy
                </button>
              </form>
            )}
          </div>

          {/* Child Registration */}
          <div className="glass-panel p-6 rounded-2xl border border-slate-900 space-y-4">
            <h3 className="text-xs font-bold text-slate-205 uppercase tracking-wider border-b border-slate-850 pb-2">
              Child growth registry
            </h3>
            {childProfile ? (
              <div className="space-y-2">
                <p>Child Name: <strong className="text-slate-200">{childProfile.name}</strong></p>
                <p>Child ABHA: <strong className="text-slate-200">{childProfile.abhaId}</strong></p>
              </div>
            ) : (
              <form onSubmit={handleRegisterChild} className="space-y-3">
                <input
                  type="text"
                  placeholder="Child Name..."
                  value={childName}
                  aria-label="Child Name"
                  onChange={e => setChildName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-850 rounded-xl p-2.5 text-slate-355 focus:outline-none"
                />
                <input
                  type="text"
                  placeholder="Child ABHA Card ID..."
                  value={childAbha}
                  aria-label="Child ABHA ID"
                  onChange={e => setChildAbha(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-850 rounded-xl p-2.5 text-slate-355 focus:outline-none"
                />
                <button type="submit" className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-slate-950 font-bold rounded-xl uppercase">
                  Register Child
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Right column (vaccines & growth charts) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Vaccination schedule */}
          <div className="glass-panel p-6 rounded-2xl border border-slate-900 space-y-4">
            <h3 className="text-xs font-bold text-slate-205 uppercase tracking-wider border-b border-slate-850 pb-2">
              Immunization Timeline
            </h3>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {vaccinations.length > 0 ? (
                vaccinations.map((vac) => (
                  <div key={vac.id} className="p-3 bg-slate-950 rounded border border-slate-900 flex justify-between items-center">
                    <div>
                      <span className="font-bold text-slate-202 block">{vac.vaccine_name}</span>
                      <span className="text-[10px] text-slate-550">Due date: {vac.due_date}</span>
                    </div>
                    <span className="px-2 py-0.5 bg-amber-500/10 text-amber-400 text-[9px] font-bold rounded uppercase">{vac.status}</span>
                  </div>
                ))
              ) : (
                <p className="text-slate-500 text-center py-4">Register pregnancy profile to load immunizations.</p>
              )}
            </div>
          </div>

          {/* Growth curves chart */}
          <div className="glass-panel p-6 rounded-2xl border border-slate-900 space-y-4">
            <h3 className="text-xs font-bold text-slate-205 uppercase tracking-wider border-b border-slate-850 pb-2">
              Pediatric Growth Curves (Percentiles)
            </h3>
            <div className="h-44">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={[
                  { month: 'Birth', percentile: 50 },
                  { month: '1 Month', percentile: 52 },
                  { month: '2 Months', percentile: 55 },
                  { month: '3 Months', percentile: 58 }
                ]}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="month" stroke="#64748b" fontSize={10} />
                  <YAxis stroke="#64748b" fontSize={10} />
                  <Tooltip contentStyle={{ backgroundColor: '#020617', borderColor: '#1e293b' }} />
                  <Area type="monotone" dataKey="percentile" stroke="#6366f1" fill="rgba(99,102,241,0.1)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
export { Activity, Calendar, Clock, RefreshCw, BarChart2, Plus };
