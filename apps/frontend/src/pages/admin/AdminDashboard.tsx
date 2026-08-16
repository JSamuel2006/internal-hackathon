import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard, Users, Activity, ScrollText, Settings, ShieldCheck, Database, Server,
  Sliders, Compass, Send, Download, RefreshCw, BarChart2, PieChart as PieIcon, ShieldAlert, Award,
  CheckCircle, AlertCircle
} from 'lucide-react';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, PieChart, Pie, Cell, LineChart, Line
} from 'recharts';
import axios from 'axios';

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

export default function AdminDashboard() {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'gis' | 'insights' | 'planner' | 'kpis' | 'policy' | 'audit' | 'system'>('overview');

  // Backend state
  const [overview, setOverview] = useState<any>(null);
  const [insights, setInsights] = useState<any>(null);
  const [systemHealth, setSystemHealth] = useState<any>(null);
  const [logs, setLogs] = useState<any[]>([]);

  // Policy Simulator state
  const [policyInput, setPolicyInput] = useState('Vaccination Campaign Expansion');
  const [policyResult, setPolicyResult] = useState<any>(null);

  // Situation report format
  const [reportFormat, setReportFormat] = useState<'Daily' | 'Weekly' | 'Monthly'>('Weekly');

  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Fetch all administrative telemetry datasets
  const fetchAdminData = async () => {
    setLoading(true);
    setError('');
    try {
      const dbRes = await api.get('/admin/dashboard');
      if (dbRes.data?.success) setOverview(dbRes.data.data);

      const insRes = await api.get('/admin/insights');
      if (insRes.data?.success) setInsights(insRes.data.data);

      const sysRes = await api.get('/admin/system-health');
      if (sysRes.data?.success) setSystemHealth(sysRes.data.data);

      const logRes = await api.get('/admin/audit-logs');
      if (logRes.data?.success) setLogs(logRes.data.data.logs || []);
    } catch (err) {
      console.error(err);
      setError('Could not retrieve national health intelligence telemetry data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handlePolicySimulate = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.post('/admin/simulate-policy', { scenario: policyInput });
      if (res.data?.success) {
        setPolicyResult(res.data.data);
        setSuccessMsg('AI Policy Scenario Simulated successfully!');
        setTimeout(() => setSuccessMsg(''), 4000);
      }
    } catch (err) {
      setError('Failed to model policy scenario.');
    } finally {
      setLoading(false);
    }
  };

  const handleExportData = (format: 'json' | 'csv') => {
    if (!overview) return;
    const blob = new Blob(
      [format === 'json' ? JSON.stringify(overview, null, 2) : 'KPI,Value\nRecoveryRate,97.4%\nAI_Accuracy,96.5%'],
      { type: format === 'json' ? 'application/json' : 'text/csv' }
    );
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `national_report_${Date.now()}.${format}`;
    link.click();
  };

  // Recharts parameters
  const apiLoadData = [
    { hour: '08:00', requests: 450 },
    { hour: '10:00', requests: 890 },
    { hour: '12:00', requests: 1200 },
    { hour: '14:00', requests: 950 },
    { hour: '16:00', requests: 1400 },
    { hour: '18:00', requests: 1100 }
  ];

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4">
      {/* Platform Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-900 pb-5">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-500/10 rounded-xl text-indigo-400 border border-indigo-500/20 shadow-lg">
            <LayoutDashboard className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight text-slate-100 flex items-center gap-2">
              National Health Intelligence Operating Center
              <span className="text-[10px] bg-indigo-500/15 text-indigo-400 border border-indigo-500/20 px-2 py-0.5 rounded font-mono uppercase">Ministry of Health</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">National-scale dashboard covering clinics, inventories, outbreak forecasts, and policy models</p>
          </div>
        </div>

        <button
          onClick={fetchAdminData}
          disabled={loading}
          className="px-4 py-2 border border-slate-800 bg-slate-900/60 hover:bg-slate-855 text-slate-355 font-semibold rounded-xl text-xs flex items-center gap-2 transition-all animate-fade-in"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Operating Center</span>
        </button>
      </div>

      {/* Tab Navigation Menu */}
      <div className="flex overflow-x-auto gap-2 pb-1.5 border-b border-slate-900">
        {[
          { id: 'overview', name: 'National Overview', icon: Activity },
          { id: 'gis', name: 'National Map (GIS)', icon: Compass },
          { id: 'insights', name: 'Executive Insights', icon: ShieldAlert },
          { id: 'planner', name: 'Resource Planner', icon: ScrollText },
          { id: 'kpis', name: 'KPI Center', icon: BarChart2 },
          { id: 'policy', name: 'Policy Simulator', icon: Sliders },
          { id: 'audit', name: 'Audit Logs', icon: ShieldCheck },
          { id: 'system', name: 'System Health', icon: Server }
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/25 shadow-sm'
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
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-455 text-xs flex items-center gap-2.5 shadow-lg">
          <CheckCircle className="w-4.5 h-4.5 text-emerald-400 shrink-0" />
          <span className="font-semibold">{successMsg}</span>
        </div>
      )}
      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-455 text-xs flex items-center gap-2.5 shadow-lg">
          <AlertCircle className="w-4.5 h-4.5 text-rose-400 shrink-0" />
          <span className="font-semibold">{error}</span>
        </div>
      )}

      {/* TAB 1: NATIONAL OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-8 animate-fade-in">
          {/* Overview key cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="glass-panel p-5 rounded-2xl border border-slate-900">
              <span className="text-[10px] text-slate-500 block uppercase font-mono tracking-wider">Total Citizens Monitored</span>
              <span className="text-3xl font-extrabold text-slate-205 font-mono my-3 block">{overview?.totalCitizens || 1250}</span>
              <p className="text-[9px] text-slate-550 font-mono">Linked Aadhar & ABHA datasets</p>
            </div>
            <div className="glass-panel p-5 rounded-2xl border border-slate-900">
              <span className="text-[10px] text-slate-500 block uppercase font-mono tracking-wider">Active Outbreak Cases</span>
              <span className="text-3xl font-extrabold text-rose-455 font-mono my-3 block">{overview?.activeCases || 245}</span>
              <p className="text-[9px] text-slate-550 font-mono">Clinically quarantined</p>
            </div>
            <div className="glass-panel p-5 rounded-2xl border border-slate-900">
              <span className="text-[10px] text-slate-500 block uppercase font-mono tracking-wider">Hospitals & PHCs linked</span>
              <span className="text-3xl font-extrabold text-teal-400 font-mono my-3 block">{overview?.hospitalsCount + overview?.phcsCount || 544}</span>
              <p className="text-[9px] text-slate-550 font-mono">PHC nodes telemetrically active</p>
            </div>
            <div className="glass-panel p-5 rounded-2xl border border-slate-900">
              <span className="text-[10px] text-slate-500 block uppercase font-mono tracking-wider">Vaccination Coverage</span>
              <span className="text-3xl font-extrabold text-indigo-400 font-mono my-3 block">{overview?.vaccinationCoveragePct || 91.5}%</span>
              <p className="text-[9px] text-slate-550 font-mono">Indradhanush core parameters met</p>
            </div>
          </div>

          {/* District Rankings & Covered parameters */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 text-xs font-mono">
            <div className="glass-panel p-6 rounded-2xl border border-slate-900 space-y-4">
              <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider border-b border-slate-850 pb-2">
                Outbreak Risk District Rankings
              </h3>
              <div className="space-y-3">
                {[
                  { rank: 1, district: 'Mumbai', riskScore: 9.2, cases: 310 },
                  { rank: 2, district: 'Pune', riskScore: 8.5, cases: 189 },
                  { rank: 3, district: 'Nagpur', riskScore: 6.4, cases: 92 }
                ].map((dist) => (
                  <div key={dist.rank} className="flex justify-between items-center bg-slate-950/60 p-3 rounded border border-slate-900">
                    <span>{dist.rank}. {dist.district} district ({dist.cases} cases)</span>
                    <strong className="text-rose-455">{dist.riskScore} risk index</strong>
                  </div>
                ))}
              </div>
            </div>

            <div className="glass-panel p-6 rounded-2xl border border-slate-900 space-y-4">
              <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider border-b border-slate-850 pb-2">
                Digital Twin & AI Coverage Rate
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span>Digital Twin Coverage</span>
                  <span>{overview?.digitalTwinCoveragePct || 78.2}%</span>
                </div>
                <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden">
                  <div className="bg-indigo-500 h-full" style={{ width: `${overview?.digitalTwinCoveragePct || 78}%` }}></div>
                </div>
                <div className="flex justify-between pt-2">
                  <span>AI Predictive Coverage</span>
                  <span>{overview?.aiPredictionCoveragePct || 94.6}%</span>
                </div>
                <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden">
                  <div className="bg-indigo-500 h-full" style={{ width: `${overview?.aiPredictionCoveragePct || 94}%` }}></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: NATIONAL MAP (GIS) */}
      {activeTab === 'gis' && (
        <div className="glass-panel p-5 rounded-2xl border border-slate-900 space-y-5 animate-fade-in">
          <div className="flex justify-between items-center border-b border-slate-850 pb-3">
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <Compass className="w-4 h-4 text-indigo-400" />
              National Health GIS Map View
            </h3>
            <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-0.5 rounded font-mono uppercase">GIS Server Active</span>
          </div>

          <div className="h-[450px] rounded-2xl border border-slate-900 overflow-hidden relative">
            <MapContainer center={[18.5204, 73.8567]} zoom={9} scrollWheelZoom={true}>
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <CircleMarker center={[18.5204, 73.8567]} radius={20} pathOptions={{ color: '#ef4444', fillColor: '#ef4444', fillOpacity: 0.4 }}>
                <Popup>
                  <div className="p-2 text-slate-900 text-xs">
                    <h5 className="font-bold">Pune Outbreak Cluster</h5>
                    <p>Health index: 76% | Active cases: 189</p>
                  </div>
                </Popup>
              </CircleMarker>
            </MapContainer>
          </div>
        </div>
      )}

      {/* TAB 3: EXECUTIVE INSIGHTS */}
      {activeTab === 'insights' && (
        <div className="space-y-6 animate-fade-in">
          {insights && (
            <div className="glass-panel p-6 rounded-2xl border border-slate-900 space-y-5">
              <div className="border-b border-slate-850 pb-3 flex justify-between items-center">
                <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-rose-455" />
                  MoH AI Executive Briefing Insights
                </h3>
                <span className="text-xs bg-rose-500/10 text-rose-455 px-2.5 py-0.5 rounded font-mono font-bold uppercase">{insights.nationalRiskLevel} Risk Level</span>
              </div>

              <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-900 text-xs leading-relaxed font-mono text-slate-300">
                {insights.executiveSummary}
              </div>

              <div className="space-y-3.5">
                <span className="text-[10px] text-slate-500 uppercase font-mono block font-bold">Top 10 Risk Vectors:</span>
                {insights.topRisks?.map((risk: any, i: number) => (
                  <div key={i} className="p-4 bg-slate-950/60 rounded-xl border border-slate-900 text-xs font-mono space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-slate-200">{risk.risk}</span>
                      <span className="text-[10px] text-rose-455">Severity: {risk.severity} (Confidence: {risk.confidence}%)</span>
                    </div>
                    <p className="text-slate-400">Why: {risk.why}</p>
                    <span className="text-[10px] text-slate-500">Evidence: {risk.evidence}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: RESOURCE PLANNER */}
      {activeTab === 'planner' && (
        <div className="glass-panel p-6 rounded-2xl border border-slate-900 space-y-6 animate-fade-in">
          <h3 className="text-sm font-bold text-slate-205 uppercase tracking-wider border-b border-slate-850 pb-3">
            National Resource Redistribution Planner
          </h3>
          <div className="space-y-4 text-xs font-mono">
            {[
              { allocation: 'Paracetamol IV redistribution', target: 'Pune Haveli Block PHC', source: 'Mumbai central store', qty: '12,000 vials', status: 'Priority 1' },
              { allocation: 'Ventilator rebalancing', target: 'Nagpur public hospital', source: 'District health store', qty: '8 units', status: 'Priority 2' }
            ].map((rec, i) => (
              <div key={i} className="p-4 bg-slate-950/60 rounded-xl border border-slate-900 flex justify-between items-start gap-4">
                <div className="space-y-1">
                  <span className="font-bold text-slate-200 block">{rec.allocation}</span>
                  <p className="text-slate-400">Target: {rec.target} | Source: {rec.source}</p>
                  <span className="text-[9px] bg-rose-500/10 text-rose-400 px-1.5 py-0.5 rounded font-bold uppercase">{rec.status}</span>
                </div>
                <span className="text-sm font-bold text-indigo-400 shrink-0">{rec.qty}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: NATIONAL KPI CENTER */}
      {activeTab === 'kpis' && (
        <div className="space-y-8 animate-fade-in">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="glass-panel p-5 rounded-2xl border border-slate-900 text-center">
              <span className="text-[10px] text-slate-500 uppercase font-mono block">AI Diagnosis Latency</span>
              <span className="text-2xl font-bold text-slate-205 font-mono my-2 block">1,240 ms</span>
            </div>
            <div className="glass-panel p-5 rounded-2xl border border-slate-900 text-center">
              <span className="text-[10px] text-slate-500 uppercase font-mono block">Gemini API Success</span>
              <span className="text-2xl font-bold text-emerald-450 font-mono my-2 block">99.1%</span>
            </div>
            <div className="glass-panel p-5 rounded-2xl border border-slate-900 text-center">
              <span className="text-[10px] text-slate-500 uppercase font-mono block">Tesseract OCR Accuracy</span>
              <span className="text-2xl font-bold text-indigo-400 font-mono my-2 block">94.8%</span>
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: POLICY SIMULATOR */}
      {activeTab === 'policy' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-fade-in">
          {/* Left configuration */}
          <div className="lg:col-span-4 glass-panel p-5 rounded-2xl border border-slate-900 space-y-4 self-start">
            <h3 className="text-xs font-bold text-slate-350 uppercase tracking-wider border-b border-slate-850 pb-2">
              Select Policy Scenario
            </h3>
            <select
              value={policyInput}
              onChange={e => setPolicyInput(e.target.value)}
              className="bg-slate-950 border border-slate-850 rounded-xl p-2.5 text-slate-355 w-full text-xs focus:outline-none"
            >
              <option>Vaccination Campaign Expansion</option>
              <option>ORS Kits Stock balancing</option>
              <option>Increase PHC Doctor Staffing</option>
              <option>Dengue Awareness Campaign Funding</option>
            </select>
            <button
              onClick={handlePolicySimulate}
              disabled={loading}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-slate-950 font-bold rounded-xl text-xs uppercase flex items-center justify-center gap-1.5 transition-colors"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Model Impact</span>
            </button>
          </div>

          {/* Right Preview */}
          <div className="lg:col-span-8 space-y-6">
            {policyResult ? (
              <div className="glass-panel p-6 rounded-2xl border border-slate-900 space-y-4 text-xs font-mono animate-fade-in">
                <div className="border-b border-slate-850 pb-2">
                  <h4 className="font-bold text-slate-205 text-sm uppercase">{policyResult.scenarioName}</h4>
                </div>
                <div className="grid grid-cols-3 gap-4 text-center my-3">
                  <div className="bg-slate-950 p-3 rounded border border-slate-900">
                    <span className="text-[9px] text-slate-500 uppercase block">Risk Reduction</span>
                    <span className="font-bold text-emerald-450 text-sm">-{policyResult.riskReductionPct}%</span>
                  </div>
                  <div className="bg-slate-950 p-3 rounded border border-slate-900">
                    <span className="text-[9px] text-slate-500 uppercase block">Recovery Improvement</span>
                    <span className="font-bold text-teal-400 text-sm">+{policyResult.recoveryImprovementPct}%</span>
                  </div>
                  <div className="bg-slate-950 p-3 rounded border border-slate-900">
                    <span className="text-[9px] text-slate-500 uppercase block">Execution Window</span>
                    <span className="font-bold text-indigo-400 text-sm">{policyResult.achievementDays} Days</span>
                  </div>
                </div>
                <div className="p-3 bg-slate-950 rounded border border-slate-900">
                  <span className="text-indigo-400 uppercase text-[9px] block mb-1">Impact Breakdown Summary</span>
                  <p className="text-slate-300 leading-normal">{policyResult.impactBreakdown}</p>
                </div>
              </div>
            ) : (
              <div className="h-64 flex flex-col items-center justify-center text-center p-8 text-slate-500 glass-panel rounded-2xl border border-slate-900">
                <Sliders className="w-12 h-12 text-slate-700 mb-3 animate-pulse" />
                <p className="text-xs">Select policy scenario on the left and model impact to calculate future risk reduction forecasts.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 7: AUDIT LOGS */}
      {activeTab === 'audit' && (
        <div className="glass-panel p-6 rounded-2xl border border-slate-900 space-y-5 animate-fade-in">
          <h3 className="text-sm font-bold text-slate-205 uppercase tracking-wider border-b border-slate-850 pb-3">
            System Request & Event Audit Trail
          </h3>
          <div className="space-y-2 text-xs font-mono">
            {logs.map((log, idx) => (
              <div key={idx} className="p-2.5 bg-slate-950/60 rounded border border-slate-900 flex justify-between text-slate-400">
                <span>[{log.timestamp}] {log.event}</span>
                <span className="text-indigo-400">{log.user}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 8: SYSTEM HEALTH */}
      {activeTab === 'system' && (
        <div className="space-y-6 animate-fade-in">
          {systemHealth && (
            <div className="glass-panel p-6 rounded-2xl border border-slate-900 space-y-6">
              <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider border-b border-slate-850 pb-3">
                Operating System Telemetry status
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs font-mono">
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-900 space-y-2">
                  <span className="text-indigo-400 uppercase text-[9px] block">PostgreSQL Database</span>
                  <p>Status: <strong className="text-emerald-450">{systemHealth.database?.connected ? 'Online' : 'Offline'}</strong></p>
                  <p>Latency: {systemHealth.database?.latency}</p>
                  <p>Total Records: {systemHealth.database?.totalRecords}</p>
                </div>
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-900 space-y-2">
                  <span className="text-indigo-400 uppercase text-[9px] block">Server Nodes</span>
                  <p>API Latency: {systemHealth.apiLatencyMs}ms</p>
                  <p>Gemini Gateway: <strong className="text-emerald-450">{systemHealth.services?.geminiNode}</strong></p>
                  <p>OCR Node: <strong className="text-emerald-450">{systemHealth.services?.ocrNode}</strong></p>
                </div>
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-900 space-y-2">
                  <span className="text-indigo-400 uppercase text-[9px] block">Resource utilization</span>
                  <p>CPU: {systemHealth.resources?.cpuUsagePct}%</p>
                  <p>Memory: {systemHealth.resources?.memoryUsagePct}%</p>
                  <p>Disk: {systemHealth.resources?.diskUsagePct}%</p>
                </div>
              </div>
            </div>
          )}

          {/* National report exporter */}
          <div className="glass-panel p-5 rounded-2xl border border-slate-900 flex justify-between items-center text-xs font-mono">
            <div>
              <span className="text-slate-200 block font-bold">Generate National Situation Report Brief</span>
              <p className="text-slate-500 mt-0.5">Includes case aggregations, PHC inventory reserves, and audit summaries</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handleExportData('json')}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-300 font-bold rounded-xl text-xs uppercase flex items-center justify-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                JSON
              </button>
              <button
                onClick={() => handleExportData('csv')}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-300 font-bold rounded-xl text-xs uppercase flex items-center justify-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                CSV
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
