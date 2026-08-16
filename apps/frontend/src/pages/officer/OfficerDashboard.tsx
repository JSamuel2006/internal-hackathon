import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, Activity, ClipboardList, Warehouse, 
  Map, Sparkles, Sliders, ArrowUpRight, CheckCircle2, User, AlertCircle, HeartPulse, Shield, BarChart2,
  FileText, Plus, Check, Play, RefreshCw, Send, Download, Layers, TrendingUp
} from 'lucide-react';
import { MapContainer, TileLayer, CircleMarker, Popup, Marker } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, AreaChart, Area
} from 'recharts';
import axios from 'axios';

// Leaflet default icon fix
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// API base path
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

export default function OfficerDashboard() {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'surveillance' | 'gis' | 'forecast' | 'resources' | 'alerts' | 'campaigns' | 'reports'>('surveillance');

  // Backend state
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [predictions, setPredictions] = useState<any[]>([]);
  const [resources, setResources] = useState<any[]>([]);
  const [capacity, setCapacity] = useState<any>(null);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [sitReport, setSitReport] = useState<any>(null);

  // Campaign Generator state
  const [campaignTarget, setCampaignTarget] = useState('Dengue Outbreak');
  const [campaignBrief, setCampaignBrief] = useState<any>(null);
  
  // Situation Report parameters
  const [reportType, setReportType] = useState<'Daily' | 'Weekly' | 'Monthly'>('Weekly');

  // Task queue state
  const [tasks, setTasks] = useState([
    { id: 1, title: 'Verify Dengue spike in Pune Haveli block', priority: 'Critical', status: 'Pending' },
    { id: 2, title: 'Reallocate ORS kits to Khed block health clinic', priority: 'High', status: 'Pending' },
    { id: 3, title: 'Approve public vector-awareness campaign brief', priority: 'Medium', status: 'Pending' }
  ]);

  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Fetch all surveillance data from endpoints
  const fetchSurveillanceData = async () => {
    setLoading(true);
    setError('');
    try {
      const dbRes = await api.get('/surveillance/dashboard');
      if (dbRes.data?.success) setDashboardData(dbRes.data.data);

      const predRes = await api.get('/surveillance/outbreak-predictions');
      if (predRes.data?.success) setPredictions(predRes.data.data.predictions || []);

      const resRes = await api.get('/surveillance/resource-allocation');
      if (resRes.data?.success) setResources(resRes.data.data.recommendations || []);

      const capRes = await api.get('/surveillance/hospital-capacity');
      if (capRes.data?.success) setCapacity(capRes.data.data.occupancyForecast || null);

      const alertRes = await api.get('/surveillance/alerts');
      if (alertRes.data?.success) setAlerts(alertRes.data.data.alerts || []);

      const sitRes = await api.get('/surveillance/situation-report');
      if (sitRes.data?.success) setSitReport(sitRes.data.data || null);
    } catch (err: any) {
      console.error(err);
      setError('Could not retrieve national disease surveillance telemetry data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSurveillanceData();
  }, []);

  const handleCampaignGenerate = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.post('/surveillance/campaigns', { disease: campaignTarget });
      if (res.data?.success) {
        setCampaignBrief(res.data.data);
        setSuccessMsg('AI Health Campaign generated successfully!');
        setTimeout(() => setSuccessMsg(''), 4000);
      }
    } catch (err) {
      setError('Failed to query campaign brief.');
    } finally {
      setLoading(false);
    }
  };

  const handleResolveAlert = (id: string) => {
    setAlerts(prev => prev.filter(a => a.id !== id));
    setSuccessMsg('Surveillance anomaly marked as resolved.');
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  const handleToggleTask = (id: number) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, status: t.status === 'Completed' ? 'Pending' : 'Completed' } : t));
  };

  const handleAddCustomTask = () => {
    const title = prompt('Enter task details:');
    if (title) {
      setTasks(prev => [...prev, { id: Date.now(), title, priority: 'Medium', status: 'Pending' }]);
    }
  };

  const handleExportData = (format: 'json' | 'csv') => {
    if (!sitReport) return;
    const blob = new Blob(
      [format === 'json' ? JSON.stringify(sitReport, null, 2) : 'Rank,District,RiskScore\n1,Mumbai,9.2\n2,Pune,8.5'],
      { type: format === 'json' ? 'application/json' : 'text/csv' }
    );
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `situation_report_${Date.now()}.${format}`;
    link.click();
  };

  // Recharts parameters
  const activeCasesTrend = [
    { month: 'Jun 1', cases: 140 },
    { month: 'Jun 8', cases: 165 },
    { month: 'Jun 15', cases: 210 },
    { month: 'Jun 22', cases: 289 },
    { month: 'Jun 29', cases: 382 },
    { month: 'Jul 6', cases: 429 }
  ];

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4">
      {/* Title Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-900 pb-5">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-rose-500/10 rounded-xl text-rose-455 border border-rose-500/20 shadow-lg">
            <Activity className="w-5 h-5 glow-pill" />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight text-slate-100 flex items-center gap-2">
              National AI Disease Surveillance Platform
              <span className="text-[10px] bg-rose-500/15 text-rose-400 border border-rose-500/20 px-2 py-0.5 rounded font-mono uppercase">Command Center</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">Government health officer outbreak intelligence, hospital capacity, and resource coordinates</p>
          </div>
        </div>

        <button
          onClick={fetchSurveillanceData}
          disabled={loading}
          className="px-4 py-2 border border-slate-800 bg-slate-900/60 hover:bg-slate-850 text-slate-300 font-semibold rounded-xl text-xs flex items-center gap-2 transition-all"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Telemetry</span>
        </button>
      </div>

      {/* Tab Navigation Menu */}
      <div className="flex overflow-x-auto gap-2 pb-1.5 border-b border-slate-900">
        {[
          { id: 'surveillance', name: 'Surveillance Dashboard', icon: Shield },
          { id: 'gis', name: 'Disease Map (GIS)', icon: Map },
          { id: 'forecast', name: 'AI Outbreak Forecast', icon: Sparkles },
          { id: 'resources', name: 'Resource Telemetry', icon: Warehouse },
          { id: 'alerts', name: 'Alert Center', icon: ShieldAlert },
          { id: 'campaigns', name: 'Campaign Generator', icon: Sliders },
          { id: 'reports', name: 'Situation Reports', icon: FileText }
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-rose-500/10 text-rose-400 border border-rose-500/25 shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900/40'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.name}
            </button>
          );
        })}
      </div>

      {/* Notifications */}
      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-450 text-xs flex items-center gap-2.5 shadow-lg">
          <CheckCircle2 className="w-4.5 h-4.5 text-emerald-400 shrink-0" />
          <span className="font-semibold">{successMsg}</span>
        </div>
      )}
      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-455 text-xs flex items-center gap-2.5 shadow-lg">
          <AlertCircle className="w-4.5 h-4.5 text-rose-400 shrink-0" />
          <span className="font-semibold">{error}</span>
        </div>
      )}

      {/* TAB 1: SURVEILLANCE DASHBOARD */}
      {activeTab === 'surveillance' && (
        <div className="space-y-8 animate-fade-in">
          {/* Key telemetry scores */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="glass-panel p-5 rounded-2xl border border-slate-900 flex flex-col justify-between">
              <span className="text-[10px] text-slate-500 block uppercase font-mono tracking-wider">National Health Score</span>
              <span className="text-3xl font-extrabold text-slate-205 font-mono my-3">{dashboardData?.nationalHealthScore || 82}%</span>
              <p className="text-[9px] text-slate-550 font-mono">Weighted epidemiological index</p>
            </div>
            <div className="glass-panel p-5 rounded-2xl border border-slate-900 flex flex-col justify-between">
              <span className="text-[10px] text-slate-500 block uppercase font-mono tracking-wider">District Health Score</span>
              <span className="text-3xl font-extrabold text-amber-500 font-mono my-3">{dashboardData?.districtHealthScore || 76}%</span>
              <p className="text-[9px] text-slate-550 font-mono"> पुणे (Pune) average risk index</p>
            </div>
            <div className="glass-panel p-5 rounded-2xl border border-slate-900 flex flex-col justify-between">
              <span className="text-[10px] text-slate-500 block uppercase font-mono tracking-wider">Active Outbreak Cases</span>
              <span className="text-3xl font-extrabold text-rose-455 font-mono my-3">{dashboardData?.activeCases || 243}</span>
              <p className="text-[9px] text-slate-550 font-mono">Monitored clinically in 24h</p>
            </div>
            <div className="glass-panel p-5 rounded-2xl border border-slate-900 flex flex-col justify-between">
              <span className="text-[10px] text-slate-500 block uppercase font-mono tracking-wider">High Risk Citizens</span>
              <span className="text-3xl font-extrabold text-red-500 font-mono my-3">{dashboardData?.highRiskCitizens || 45}</span>
              <p className="text-[9px] text-slate-550 font-mono">Abnormal biomarker clusters</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left: Recharts active caseload area chart (8 cols) */}
            <div className="lg:col-span-8 space-y-6">
              <div className="glass-panel p-6 rounded-2xl border border-slate-900 space-y-4">
                <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-rose-455" />
                  Active Outbreak Progression Trend
                </h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={activeCasesTrend}>
                      <defs>
                        <linearGradient id="colorCases" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.2}/>
                          <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis dataKey="month" stroke="#64748b" style={{ fontSize: 10 }} />
                      <YAxis stroke="#64748b" style={{ fontSize: 10 }} />
                      <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b' }} />
                      <Area type="monotone" dataKey="cases" stroke="#f43f5e" fillOpacity={1} fill="url(#colorCases)" strokeWidth={2} name="Weekly Cases" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* District Hotspot metrics */}
              <div className="glass-panel p-6 rounded-2xl border border-slate-900 space-y-4">
                <h3 className="text-sm font-bold text-slate-205 uppercase tracking-wider">District Hotspot Detection Matrix</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {(dashboardData?.hotspots || []).map((hot: any, i: number) => (
                    <div key={i} className="bg-slate-950/60 p-4 rounded-xl border border-slate-900 space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-slate-200 text-xs font-mono">{hot.district}</span>
                        <span className="text-[9px] font-mono bg-rose-500/10 text-rose-400 px-1.5 py-0.5 rounded font-bold uppercase">{hot.riskLevel}</span>
                      </div>
                      <div className="flex justify-between text-[11px] text-slate-400">
                        <span>Cases: {hot.cases}</span>
                        <span className="text-rose-455">{hot.growth}</span>
                      </div>
                      <p className="text-[10px] text-slate-500">Recovery rate: {hot.recovery}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right: Disease list distribution (4 cols) */}
            <div className="lg:col-span-4 space-y-6">
              <div className="glass-panel p-5 rounded-2xl border border-slate-900 space-y-4">
                <h3 className="text-xs font-bold text-slate-350 uppercase tracking-wider border-b border-slate-850 pb-2">
                  Disease Distribution Index
                </h3>
                <div className="space-y-3.5">
                  {(dashboardData?.diseaseDistribution || []).map((dis: any, idx: number) => (
                    <div key={idx} className="flex justify-between items-center text-xs font-mono">
                      <span className="text-slate-300">{dis.name}</span>
                      <span className="font-bold text-slate-205">{dis.count} cases</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Task manager checklist */}
              <div className="glass-panel p-5 rounded-2xl border border-slate-900 space-y-4">
                <div className="flex justify-between items-center border-b border-slate-850 pb-2">
                  <h3 className="text-xs font-bold text-slate-350 uppercase tracking-wider">Officer Action Queue</h3>
                  <button onClick={handleAddCustomTask} className="text-rose-400 hover:text-rose-350 p-1">
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                <div className="space-y-2.5 text-xs">
                  {tasks.map((t) => (
                    <div key={t.id} className="flex items-start gap-2.5 bg-slate-950/60 p-2.5 rounded border border-slate-900">
                      <button onClick={() => handleToggleTask(t.id)} className="mt-0.5 p-1 border border-slate-800 rounded hover:border-rose-455 text-slate-400">
                        {t.status === 'Completed' ? <Check className="w-3 h-3 text-rose-455" /> : <div className="w-3 h-3" />}
                      </button>
                      <div className="min-w-0">
                        <span className={`block font-medium ${t.status === 'Completed' ? 'line-through text-slate-500' : 'text-slate-300'}`}>{t.title}</span>
                        <span className="text-[9px] text-slate-500 font-mono uppercase">{t.priority} Priority</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: DISEASE MAP (GIS) */}
      {activeTab === 'gis' && (
        <div className="glass-panel p-5 rounded-2xl border border-slate-900 space-y-5 animate-fade-in">
          <div className="flex justify-between items-center border-b border-slate-850 pb-3">
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <Layers className="w-4 h-4 text-rose-455" />
              GIS Outbreak intelligence Map
            </h3>
            <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-0.5 rounded font-mono uppercase animate-pulse">Telemetry Live</span>
          </div>

          <div className="h-[450px] rounded-2xl border border-slate-900 overflow-hidden relative">
            <MapContainer center={[18.5204, 73.8567]} zoom={10} scrollWheelZoom={true}>
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              {/* Dynamic hotspot marker circles */}
              <CircleMarker center={[18.5204, 73.8567]} radius={20} pathOptions={{ color: '#ef4444', fillColor: '#ef4444', fillOpacity: 0.4 }}>
                <Popup>
                  <div className="p-2 text-slate-900 text-xs">
                    <h5 className="font-bold text-slate-950">Pune Haveli Block</h5>
                    <p>Dengue Outbreak Cluster (189 cases)</p>
                  </div>
                </Popup>
              </CircleMarker>
              <CircleMarker center={[19.0760, 72.8777]} radius={28} pathOptions={{ color: '#ef4444', fillColor: '#ef4444', fillOpacity: 0.45 }}>
                <Popup>
                  <div className="p-2 text-slate-900 text-xs">
                    <h5 className="font-bold text-slate-950">Mumbai Ward A</h5>
                    <p>COVID-19 Cluster (310 cases)</p>
                  </div>
                </Popup>
              </CircleMarker>
              
              {/* Simulated Health Warehouses, PHCs & Vaccines */}
              <Marker position={[18.5314, 73.8447]}>
                <Popup>
                  <div className="p-2 text-slate-900 text-xs">
                    <h5 className="font-bold">Haveli PHC Node</h5>
                    <p>ICU Capacity: 82% occupied | Stock Reserve: Optimal</p>
                  </div>
                </Popup>
              </Marker>
            </MapContainer>
          </div>
        </div>
      )}

      {/* TAB 3: AI OUTBREAK FORECAST */}
      {activeTab === 'forecast' && (
        <div className="space-y-6 animate-fade-in">
          <div className="glass-panel p-6 rounded-2xl border border-slate-900 space-y-4">
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider border-b border-slate-850 pb-3">
              Outbreak Forecasting
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {predictions.map((pred, i) => (
                <div key={i} className="p-5 bg-slate-950/60 rounded-xl border border-slate-900 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-slate-200 text-sm font-mono">{pred.disease}</span>
                    <span className="px-2 py-0.5 bg-rose-500/10 text-rose-455 text-[9px] font-mono rounded font-bold uppercase">{pred.severity} Severity</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono">
                    <div className="bg-slate-900 p-2 rounded">
                      <span className="text-slate-500 text-[9px] block">Expected Cases</span>
                      <span className="font-bold text-slate-205">{pred.predictedCases}</span>
                    </div>
                    <div className="bg-slate-900 p-2 rounded">
                      <span className="text-slate-500 text-[9px] block">Confidence</span>
                      <span className="font-bold text-teal-400">{pred.confidence}%</span>
                    </div>
                    <div className="bg-slate-900 p-2 rounded">
                      <span className="text-slate-500 text-[9px] block">Growth Rate</span>
                      <span className="font-bold text-rose-455">{pred.growthRate}</span>
                    </div>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed font-mono">{pred.reason}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: RESOURCE TELEMETRY */}
      {activeTab === 'resources' && (
        <div className="space-y-6 animate-fade-in">
          {/* ICU capacity status */}
          {capacity && (
            <div className="glass-panel p-5 rounded-2xl border border-slate-900 grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-1">
                <span className="text-[10px] text-slate-500 uppercase font-mono block">ICU Occupancy Forecast</span>
                <span className="text-2xl font-bold text-amber-500 font-mono">{capacity.icuOccupancyPct}% occupied</span>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] text-slate-500 uppercase font-mono block">Expected emergency visits</span>
                <span className="text-2xl font-bold text-slate-205 font-mono">{capacity.expectedEmergencyVisits} visits</span>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] text-slate-500 uppercase font-mono block">critical stock shortages</span>
                <span className="text-xs text-rose-400 font-mono font-bold block mt-1">{capacity.expectedShortages?.join(', ') || 'None'}</span>
              </div>
            </div>
          )}

          {/* Allocation Recommendations */}
          <div className="glass-panel p-6 rounded-2xl border border-slate-900 space-y-4">
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider border-b border-slate-850 pb-3">
              AI Resource Allocation & Redistribution Plans
            </h3>
            <div className="space-y-3.5">
              {resources.map((rec, i) => (
                <div key={i} className="p-4 bg-slate-950/60 rounded-xl border border-slate-900 flex justify-between items-start gap-4">
                  <div className="space-y-1">
                    <span className="font-bold text-slate-200 text-xs font-mono uppercase block">{rec.resource} Allocation</span>
                    <p className="text-xs text-slate-400 font-mono">{rec.why}</p>
                    <span className="text-[10px] text-slate-500 block font-mono">Expected Benefit: <strong className="text-teal-400">{rec.benefit}</strong></span>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-[9px] text-slate-500 uppercase font-mono block">Required</span>
                    <span className="text-lg font-bold text-rose-400 font-mono">{rec.requiredCount}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: ALERT CENTER */}
      {activeTab === 'alerts' && (
        <div className="glass-panel p-6 rounded-2xl border border-slate-900 space-y-5 animate-fade-in">
          <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider border-b border-slate-850 pb-3">
            Critical Surveillance Alert Queue
          </h3>
          <div className="space-y-4">
            {alerts.map((al) => (
              <div key={al.id} className="p-4 bg-slate-950/60 rounded-xl border border-slate-900 space-y-3 text-xs">
                <div className="flex justify-between items-center">
                  <span className="px-2.5 py-0.5 bg-rose-500/10 text-rose-400 border border-rose-500/20 text-[9px] font-mono rounded font-bold uppercase">{al.priority} Alert</span>
                  <span className="text-[10px] text-slate-500 font-mono">District: {al.affectedDistrict} (Confidence: {al.confidence}%)</span>
                </div>
                <div className="space-y-1">
                  <p className="font-bold text-slate-200 leading-normal">{al.reason}</p>
                  <p className="text-slate-400 font-mono text-[11px] leading-relaxed">Evidence: {al.evidence}</p>
                </div>
                <div className="flex justify-between items-center border-t border-slate-900 pt-3">
                  <span className="text-slate-500 font-mono text-[10px]">Action: {al.suggestedAction}</span>
                  <button
                    onClick={() => handleResolveAlert(al.id)}
                    className="px-3.5 py-1.5 bg-rose-500 hover:bg-rose-455 text-slate-950 font-bold rounded-lg text-[10px] uppercase transition-colors"
                  >
                    Acknowledge & Resolve
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 6: CAMPAIGN GENERATOR */}
      {activeTab === 'campaigns' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-fade-in">
          {/* Left prompt selector */}
          <div className="lg:col-span-4 glass-panel p-5 rounded-2xl border border-slate-900 space-y-4 self-start">
            <h3 className="text-xs font-bold text-slate-350 uppercase tracking-wider border-b border-slate-850 pb-2">
              Select Awareness Target
            </h3>
            <select
              value={campaignTarget}
              onChange={e => setCampaignTarget(e.target.value)}
              className="bg-slate-950 border border-slate-850 rounded-xl p-2.5 text-slate-355 w-full text-xs focus:outline-none"
            >
              <option>Dengue Outbreak</option>
              <option>Diabetes Screening</option>
              <option>Vaccination Drive</option>
              <option>Heat Wave Advisory</option>
            </select>
            <button
              onClick={handleCampaignGenerate}
              disabled={loading}
              className="w-full py-2.5 bg-rose-500 hover:bg-rose-455 text-slate-950 font-bold rounded-xl text-xs uppercase flex items-center justify-center gap-1.5 transition-colors"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Generate Brief</span>
            </button>
          </div>

          {/* Right Preview brief */}
          <div className="lg:col-span-8 space-y-6">
            {campaignBrief ? (
              <div className="glass-panel p-6 rounded-2xl border border-slate-900 space-y-4 text-xs font-mono animate-fade-in">
                <div className="border-b border-slate-850 pb-2 flex justify-between items-center">
                  <h4 className="font-bold text-slate-205 text-sm uppercase">{campaignBrief.title}</h4>
                  <span className="text-[10px] text-slate-500">Audience: {campaignBrief.targetAudience}</span>
                </div>
                <div className="space-y-3">
                  <div className="p-3 bg-slate-950 rounded border border-slate-900">
                    <span className="text-teal-400 uppercase text-[9px] block mb-1">Objective</span>
                    <p className="text-slate-300 leading-normal">{campaignBrief.objective}</p>
                  </div>
                  <div className="p-3 bg-slate-950 rounded border border-slate-900">
                    <span className="text-teal-400 uppercase text-[9px] block mb-1">Poster Content</span>
                    <p className="text-slate-300 leading-normal">{campaignBrief.posterContent}</p>
                  </div>
                  <div className="p-3 bg-slate-950 rounded border border-slate-900">
                    <span className="text-teal-400 uppercase text-[9px] block mb-1">SMS & WhatsApp Advisory</span>
                    <p className="text-slate-350 leading-normal mb-1">SMS: {campaignBrief.sms}</p>
                    <p className="text-slate-350 leading-normal">WhatsApp: {campaignBrief.whatsapp}</p>
                  </div>
                  <div className="p-3 bg-slate-950 rounded border border-slate-900">
                    <span className="text-teal-400 uppercase text-[9px] block mb-1">Public Announcement Audio Script</span>
                    <p className="text-slate-300 leading-normal italic">"{campaignBrief.announcementScript}"</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-64 flex flex-col items-center justify-center text-center p-8 text-slate-500 glass-panel rounded-2xl border border-slate-900">
                <Sliders className="w-12 h-12 text-slate-700 mb-3 animate-pulse" />
                <p className="text-xs">Click Generate Brief on the left to compile AI-targeted health awareness campaign materials.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 7: SITUATION REPORTS */}
      {activeTab === 'reports' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-fade-in">
          {/* Config options */}
          <div className="lg:col-span-4 glass-panel p-5 rounded-2xl border border-slate-900 space-y-4 self-start">
            <h3 className="text-xs font-bold text-slate-350 uppercase tracking-wider border-b border-slate-850 pb-2">
              Report Parameters
            </h3>
            <div className="flex gap-2">
              {['Daily', 'Weekly', 'Monthly'].map((type) => (
                <button
                  key={type}
                  onClick={() => setReportType(type as any)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold font-mono border transition-all ${
                    reportType === type
                      ? 'bg-rose-500/10 text-rose-455 border-rose-500/35'
                      : 'bg-slate-900 border-slate-850 text-slate-400'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => handleExportData('json')}
                className="w-full py-2 bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-300 font-bold rounded-xl text-xs uppercase flex items-center justify-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                JSON
              </button>
              <button
                onClick={() => handleExportData('csv')}
                className="w-full py-2 bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-300 font-bold rounded-xl text-xs uppercase flex items-center justify-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                CSV
              </button>
            </div>
          </div>

          {/* Report preview */}
          <div className="lg:col-span-8 space-y-6">
            {sitReport ? (
              <div className="glass-panel p-6 rounded-2xl border border-slate-900 space-y-4 text-xs font-mono animate-fade-in">
                <div className="border-b border-slate-850 pb-2 flex justify-between items-center">
                  <h4 className="font-bold text-slate-205 text-sm uppercase">{sitReport.type} Preview</h4>
                  <span className="text-[10px] text-slate-500">Range: {sitReport.dateRange}</span>
                </div>
                <div className="grid grid-cols-3 gap-4 text-center my-3">
                  <div className="bg-slate-950 p-3 rounded border border-slate-900">
                    <span className="text-[9px] text-slate-500 uppercase block">Cases</span>
                    <span className="font-bold text-slate-205 text-sm">{sitReport.metrics?.totalCases}</span>
                  </div>
                  <div className="bg-slate-950 p-3 rounded border border-slate-900">
                    <span className="text-[9px] text-slate-500 uppercase block">Recoveries</span>
                    <span className="font-bold text-teal-400 text-sm">{sitReport.metrics?.recoveries}</span>
                  </div>
                  <div className="bg-slate-950 p-3 rounded border border-slate-900">
                    <span className="text-[9px] text-slate-500 uppercase block">Deaths</span>
                    <span className="font-bold text-rose-455 text-sm">{sitReport.metrics?.deaths}</span>
                  </div>
                </div>

                <div className="space-y-2.5">
                  <span className="text-slate-500 text-[10px] uppercase font-bold block mb-1">District Risk Rankings:</span>
                  {sitReport.districtRankings?.map((dist: any, idx: number) => (
                    <div key={idx} className="flex justify-between bg-slate-950/60 p-2.5 rounded border border-slate-900">
                      <span>{dist.rank}. {dist.district}</span>
                      <strong className="text-rose-455">{dist.riskScore} score</strong>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-500 text-center py-12">No reports compiled yet.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
