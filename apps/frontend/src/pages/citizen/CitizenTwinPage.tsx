import React, { useState, useEffect } from 'react';
import {
  Activity, ShieldAlert, HeartPulse, User, Calendar, RefreshCw, Save,
  CheckCircle, AlertCircle, TrendingUp, Brain, Droplet, Stethoscope, Settings,
  ChevronDown, ChevronUp, History, BarChart2, DollarSign, Compass, Award, Trash2
} from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, ReferenceLine, LineChart, Line, BarChart, Bar } from 'recharts';
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

export default function CitizenTwinPage() {
  const [activeSubTab, setActiveSubTab] = useState<'twin' | 'compare' | 'simulator' | 'profile'>('twin');
  const [loading, setLoading] = useState(false);
  const [twinData, setTwinData] = useState<any>(null);
  
  // Historical prediction logs
  const [historyList, setHistoryList] = useState<any[]>([]);
  const [selectedHistId, setSelectedHistId] = useState<string>('');

  // What-If Simulator state
  const [simulators, setSimulators] = useState({
    weight: 75,
    steps: 6000,
    water: 2.0,
    sleep: 7.0,
    smoking: 'No',
    alcohol: 'Occasional',
    stress: 5,
    systolicBP: 120,
    bloodSugar: 95
  });
  const [simResult, setSimResult] = useState<any>(null);
  const [simName, setSimName] = useState('New Healthy Lifestyle Scenario');
  const [savedSims, setSavedSims] = useState<any[]>([]);
  const [activeSimId, setActiveSimId] = useState<string>('');

  // Profile fields
  const [profile, setProfile] = useState({
    age: 28,
    gender: 'Male',
    bmi: 22.5,
    existingDiseases: 'None',
    familyHistory: 'None',
    lifestyle: 'Non-smoker, moderate exercise 3 times a week',
    allergies: 'None',
    vaccinations: 'BCG, Hepatitis B, Tdap Booster (2024)'
  });

  // Accordion state
  const [expandedCards, setExpandedCards] = useState<Record<string, boolean>>({});

  // Comparison state
  const [compareTwinA, setCompareTwinA] = useState<any>(null);
  const [compareTwinB, setCompareTwinB] = useState<any>(null);

  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Fetch initial metadata
  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      // Get profile
      const profRes = await api.get('/twin/profile/usr-901');
      if (profRes.data?.success && profRes.data?.data) {
        setProfile(profRes.data.data);
      }

      // Get history
      const histRes = await api.get('/twin/history/usr-901');
      if (histRes.data?.success && histRes.data?.data) {
        const sorted = histRes.data.data.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setHistoryList(sorted);
        if (sorted.length > 0) {
          setTwinData(sorted[0].twin);
          setSelectedHistId(sorted[0].id);
        }
      }

      // Get saved simulations
      const simRes = await api.get('/twin/simulations/usr-901');
      if (simRes.data?.success && simRes.data?.data) {
        setSavedSims(simRes.data.data);
      }
    } catch (err: any) {
      console.error(err);
      setError('Could not load twin or simulator datasets. Check connection.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccessMsg('');
    try {
      const res = await api.post('/twin/profile', {
        userId: 'usr-901',
        ...profile
      });
      if (res.data?.success) {
        setSuccessMsg('Profile details successfully updated!');
        await fetchData();
        setTimeout(() => setSuccessMsg(''), 4000);
      }
    } catch (err: any) {
      setError('Failed to update bio profile parameters.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegenerateTwin = async () => {
    setLoading(true);
    setError('');
    setSuccessMsg('');
    try {
      const res = await api.post('/twin/predict', { userId: 'usr-901' });
      if (res.data?.success) {
        setSuccessMsg('Explainable Digital Twin successfully recalculated!');
        await fetchData();
        setTimeout(() => setSuccessMsg(''), 4000);
      }
    } catch (err: any) {
      setError('Failed to calculate forecast.');
    } finally {
      setLoading(false);
    }
  };

  // Trigger live what-if simulation using Gemini
  const runLiveSimulation = async () => {
    setLoading(true);
    setError('');
    setSuccessMsg('');
    try {
      const res = await api.post('/twin/simulate', {
        userId: 'usr-901',
        overrides: simulators
      });
      if (res.data?.success && res.data?.data) {
        setSimResult(res.data.data);
        setSuccessMsg('Simulation recalculated successfully!');
        setTimeout(() => setSuccessMsg(''), 3000);
      }
    } catch (err: any) {
      setError('Live recalculation failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSimulation = async () => {
    if (!simResult) return;
    setLoading(true);
    setError('');
    setSuccessMsg('');
    try {
      const res = await api.post('/twin/simulations/save', {
        userId: 'usr-901',
        name: simName,
        simulationData: simResult
      });
      if (res.data?.success) {
        setSuccessMsg(`Simulation "${simName}" saved to PostgreSQL successfully!`);
        await fetchData();
        setTimeout(() => setSuccessMsg(''), 4000);
      }
    } catch (err: any) {
      setError('Failed to save simulation record.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSimulation = async (id: string) => {
    setLoading(true);
    setError('');
    try {
      const res = await api.delete(`/twin/simulations/${id}`);
      if (res.data?.success) {
        setSuccessMsg('Saved simulation removed.');
        await fetchData();
        setTimeout(() => setSuccessMsg(''), 4000);
      }
    } catch (err: any) {
      setError('Delete operation failed.');
    } finally {
      setLoading(false);
    }
  };

  const loadSavedSimulation = (sim: any) => {
    setSimResult(sim.simulationData);
    setSimName(sim.name);
    setActiveSimId(sim.id);
  };

  const loadPastPrediction = (id: string) => {
    const record = historyList.find(h => h.id === id);
    if (record) {
      setTwinData(record.twin);
      setSelectedHistId(id);
    }
  };

  const toggleCard = (diseaseName: string) => {
    setExpandedCards(prev => ({
      ...prev,
      [diseaseName]: !prev[diseaseName]
    }));
  };

  // Recharts forecasts
  const mockBiomarkers = [
    { month: 'Jan', value: 5.6, forecast: 5.6 },
    { month: 'Mar', value: 5.8, forecast: 5.8 },
    { month: 'May', value: 6.2, forecast: 6.2 },
    { month: 'Jul', value: null, forecast: 6.0 },
    { month: 'Sep', value: null, forecast: 5.8 },
    { month: 'Nov', value: null, forecast: 5.7 }
  ];

  const currentProgs = twinData?.riskTimeline || [
    { timeframe: '1 month', probability: 72 },
    { timeframe: '3 months', probability: 68 },
    { timeframe: '6 months', probability: 55 }
  ];

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-rose-500/10 rounded-xl text-rose-455 border border-rose-500/20 shadow-lg">
            <Compass className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
              Preventive Health Simulator
              <span className="text-[10px] bg-rose-500/15 text-rose-400 border border-rose-500/20 px-2 py-0.5 rounded font-mono uppercase">What-If</span>
            </h2>
            <p className="text-xs text-slate-600 mt-0.5">Simulate lifestyle scenarios and immediately calculate future disease probability differences</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {['twin', 'simulator', 'compare', 'profile'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveSubTab(tab as any)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all ${
                activeSubTab === tab
                  ? 'bg-rose-500/10 text-rose-400 border border-rose-500/25'
                  : 'border border-slate-200 bg-white text-slate-600 hover:text-white'
              }`}
            >
              {tab === 'twin' ? 'AI Digital Twin' : tab === 'simulator' ? 'What-If Simulator' : tab === 'compare' ? 'Scenario Compare' : 'Profile Settings'}
            </button>
          ))}

          <button
            onClick={handleRegenerateTwin}
            disabled={loading}
            className="px-4 py-2 bg-gradient-to-r from-rose-500 to-amber-500 text-slate-950 font-bold hover:from-rose-400 hover:to-amber-400 rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-md"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Regenerate Twin</span>
          </button>
        </div>
      </div>

      {/* Notifications */}
      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-450 text-xs flex items-center gap-2.5 shadow-lg">
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

      {/* TAB 1: AI DIGITAL TWIN */}
      {activeSubTab === 'twin' && (
        <div className="space-y-8 animate-fade-in">
          {/* Interactive History Timeline Selector */}
          {historyList.length > 0 && (
            <div className="bg-white border border-slate-200 shadow-sm p-4 rounded-2xl border border-slate-200 flex flex-col md:flex-row items-start md:items-center gap-4 bg-white">
              <div className="flex items-center gap-2 text-slate-600 text-xs shrink-0">
                <History className="w-4 h-4 text-rose-400" />
                <span className="font-bold uppercase tracking-wider font-mono">Prediction Timeline History:</span>
              </div>
              <div className="flex gap-2 overflow-x-auto w-full py-1">
                {historyList.map((hist, idx) => (
                  <button
                    key={hist.id}
                    onClick={() => loadPastPrediction(hist.id)}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-mono shrink-0 transition-all border ${
                      selectedHistId === hist.id
                        ? 'bg-rose-500/10 text-rose-455 border-rose-500/30'
                        : 'bg-white border-slate-200 text-slate-600 hover:text-slate-800'
                    }`}
                  >
                    {idx === 0 ? '🎯 Current' : idx === 1 ? '⏮️ Previous' : `⏳ Hist (${hist.date})`}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Top Level Gauges */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white border border-slate-200 shadow-sm p-5 rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-900 to-slate-950 flex flex-col justify-between relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/5 rounded-full blur-xl"></div>
              <span className="text-[10px] text-slate-500 block uppercase font-mono tracking-wider">Overall Health Score</span>
              <div className="my-3 flex items-baseline gap-2">
                <span className="text-4xl font-extrabold text-slate-800 font-mono tracking-tight">{twinData?.overallHealthScore || 85}</span>
                <span className="text-xs text-rose-400 font-mono font-bold">%</span>
              </div>
              <div className="w-full bg-white h-1.5 rounded-full overflow-hidden">
                <div className="bg-gradient-to-r from-rose-500 to-emerald-500 h-full" style={{ width: `${twinData?.overallHealthScore || 85}%` }}></div>
              </div>
            </div>

            <div className="bg-white border border-slate-200 shadow-sm p-5 rounded-2xl border border-slate-200 flex flex-col justify-between">
              <span className="text-[10px] text-slate-500 block uppercase font-mono tracking-wider">Current Health Status</span>
              <span className="text-xl font-bold text-teal-400 my-3 block font-mono">
                {twinData?.currentHealthStatus || 'Stable / Optimal'}
              </span>
              <p className="text-[9px] text-slate-600 font-mono">Based on active clinical records</p>
            </div>

            <div className="bg-white border border-slate-200 shadow-sm p-5 rounded-2xl border border-slate-200 flex flex-col justify-between">
              <span className="text-[10px] text-slate-500 block uppercase font-mono tracking-wider">AI Prognosis Confidence</span>
              <div className="my-3 flex items-baseline gap-2">
                <span className="text-2xl font-bold text-emerald-400 font-mono">{twinData?.confidenceScore || 90}</span>
                <span className="text-xs text-emerald-400 font-mono">%</span>
              </div>
              <p className="text-[9px] text-slate-600 font-mono truncate">{twinData?.confidenceReason || 'Dataset completeness verified'}</p>
            </div>

            <div className="bg-white border border-slate-200 shadow-sm p-5 rounded-2xl border border-slate-200 flex flex-col justify-between">
              <span className="text-[10px] text-slate-500 block uppercase font-mono tracking-wider">Recovery Stability</span>
              <div className="my-3 flex items-baseline gap-2">
                <span className="text-2xl font-bold text-amber-500 font-mono">{twinData?.recoveryProgress || 80}</span>
                <span className="text-xs text-slate-500 font-mono">%</span>
              </div>
              <p className="text-[9px] text-slate-600 font-mono">Simulated target: 100%</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Body Systems (8 cols) */}
            <div className="lg:col-span-8 space-y-6">
              <div className="bg-white border border-slate-200 shadow-sm p-6 rounded-2xl border border-slate-200 space-y-5">
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider border-b border-slate-200 pb-3 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-rose-400" />
                  Body System Health Matrix
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {(twinData?.bodySystems || [
                    { name: 'Heart', score: 88, status: 'Optimal', trend: 'Stable', recommendation: 'Maintain regular aerobic activity.' },
                    { name: 'Kidney', score: 92, status: 'Optimal', trend: 'Stable', recommendation: 'Ensure adequate hydration.' },
                    { name: 'Liver', score: 85, status: 'Optimal', trend: 'Stable', recommendation: 'Limit processed sugars.' },
                    { name: 'Lungs', score: 82, status: 'Optimal', trend: 'Improving', recommendation: 'Continue breathing exercises.' },
                    { name: 'Brain', score: 90, status: 'Optimal', trend: 'Stable', recommendation: 'Engage in mental activities.' },
                    { name: 'Blood', score: 80, status: 'Optimal', trend: 'Stable', recommendation: 'Add iron-rich diet.' }
                  ]).map((sys: any, idx: number) => {
                    const isOptimal = sys.status === 'Optimal';
                    return (
                      <div key={idx} className="p-4 bg-white border border-slate-200 rounded-xl space-y-2 flex flex-col justify-between">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-800 text-xs font-mono">{sys.name}</span>
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase font-mono ${
                            isOptimal ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-500'
                          }`}>
                            {sys.status}
                          </span>
                        </div>
                        <div className="flex items-baseline gap-2">
                          <span className="text-lg font-bold text-slate-700 font-mono">{sys.score}</span>
                          <span className="text-[10px] text-slate-500">score</span>
                          <span className="text-[10px] text-rose-455 ml-auto font-mono">{sys.trend}</span>
                        </div>
                        <p className="text-[10px] text-slate-600 leading-relaxed italic mt-1">{sys.recommendation}</p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Explainable Predictions */}
              <div className="bg-white border border-slate-200 shadow-sm p-6 rounded-2xl border border-slate-200 space-y-5">
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider border-b border-slate-200 pb-3 flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-rose-400" />
                  Explainable AI Disease Risk Forecasts
                </h3>
                <div className="space-y-4">
                  {(twinData?.diseasePredictions || []).map((pred: any, idx: number) => {
                    const isExpanded = expandedCards[pred.disease];
                    return (
                      <div key={idx} className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div>
                            <span className="text-[10px] text-slate-500 font-mono uppercase font-bold tracking-wider">PREDICTIVE INDICATOR</span>
                            <h4 className="font-bold text-slate-205 text-sm mt-0.5">{pred.disease}</h4>
                            <p className="text-[10px] text-slate-600 font-mono mt-1">Trend: <strong className="text-amber-500">{pred.historicalTrend}</strong></p>
                          </div>
                          
                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <span className="text-[9px] text-slate-500 uppercase font-mono block">Probability</span>
                              <span className="text-lg font-bold text-rose-400 font-mono">{pred.probability}%</span>
                            </div>
                            <button
                              onClick={() => toggleCard(pred.disease)}
                              className="p-1.5 hover:bg-white border border-slate-200 rounded-lg text-slate-600"
                            >
                              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>

                        {isExpanded && (
                          <div className="border-t border-slate-200 pt-4 grid grid-cols-1 md:grid-cols-2 gap-5 text-xs animate-slide-down">
                            <div className="space-y-3">
                              <div>
                                <span className="text-slate-500 text-[10px] uppercase font-mono block font-bold mb-1">Clinical Reasoning</span>
                                <div className="text-slate-350 leading-relaxed font-mono whitespace-pre-line bg-white p-3 rounded-lg border border-slate-200">
                                  {pred.reasoning}
                                </div>
                              </div>
                              <div>
                                <span className="text-slate-500 text-[10px] uppercase font-mono block font-bold mb-1">Evidence Used</span>
                                <p className="text-slate-600 font-mono">{pred.evidenceUsed?.join(', ')}</p>
                              </div>
                            </div>
                            <div className="space-y-3">
                              <div>
                                <span className="text-slate-500 text-[10px] uppercase font-mono block font-bold mb-1">Progression Projections</span>
                                <div className="bg-white p-3 rounded-lg border border-slate-200 text-[10px] font-mono space-y-1">
                                  <p><span className="text-slate-500">1 Month:</span> {pred.expectedProgression?.nextMonth}</p>
                                  <p><span className="text-slate-500">3 Months:</span> {pred.expectedProgression?.threeMonths}</p>
                                  <p><span className="text-slate-500">6 Months:</span> {pred.expectedProgression?.sixMonths}</p>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Right Panel (4 cols) */}
            <div className="lg:col-span-4 space-y-6">
              <div className="bg-white border border-slate-200 shadow-sm p-5 rounded-2xl border border-slate-200 bg-gradient-to-b from-slate-900 to-slate-950 space-y-4">
                <h3 className="text-xs font-bold text-slate-350 uppercase tracking-wider border-b border-slate-200 pb-2 flex items-center gap-1.5">
                  <Brain className="w-4 h-4 text-rose-400" />
                  AI Prognosis Summary
                </h3>
                <p className="text-xs text-slate-700 leading-relaxed font-mono">
                  {twinData?.aiSummary || 'No diagnostic health summaries have been generated.'}
                </p>
                <div className="text-[9px] text-slate-500 italic border-t border-slate-200 pt-2 text-center">
                  ⚠️ This prediction is AI-assisted and not a confirmed diagnosis.
                </div>
              </div>

              {/* Risk Timeline */}
              <div className="bg-white border border-slate-200 shadow-sm p-5 rounded-2xl border border-slate-200 space-y-4">
                <h3 className="text-xs font-bold text-slate-350 uppercase tracking-wider border-b border-slate-200 pb-2 flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4 text-amber-500" />
                  Risk Evolution Timeline
                </h3>
                <div className="h-44">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={currentProgs}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis dataKey="timeframe" stroke="#64748b" style={{ fontSize: 10 }} />
                      <YAxis stroke="#64748b" style={{ fontSize: 10 }} domain={[0, 100]} />
                      <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b' }} />
                      <Line type="monotone" dataKey="probability" stroke="#f43f5e" strokeWidth={2} name="Probability %" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: WHAT-IF SIMULATOR */}
      {activeSubTab === 'simulator' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-fade-in">
          {/* Sliders Input Panel (4 cols) */}
          <div className="lg:col-span-4 bg-white border border-slate-200 shadow-sm p-5 rounded-2xl border border-slate-200 space-y-6 self-start">
            <h3 className="text-xs font-bold text-slate-355 uppercase tracking-wider border-b border-slate-200 pb-2 flex items-center gap-2">
              <Settings className="w-4 h-4 text-rose-400" />
              Adjust Lifestyle Sliders
            </h3>

            <div className="space-y-4 text-xs font-mono">
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-600">Weight (kg)</span>
                  <span className="text-rose-400 font-bold">{simulators.weight} kg</span>
                </div>
                <input
                  type="range" min="40" max="150" value={simulators.weight}
                  onChange={e => setSimulators({ ...simulators, weight: Number(e.target.value) })}
                  className="w-full h-1 bg-white rounded-lg appearance-none cursor-pointer accent-rose-500"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-600">Daily Steps</span>
                  <span className="text-rose-400 font-bold">{simulators.steps} steps</span>
                </div>
                <input
                  type="range" min="1000" max="20000" step="500" value={simulators.steps}
                  onChange={e => setSimulators({ ...simulators, steps: Number(e.target.value) })}
                  className="w-full h-1 bg-white rounded-lg appearance-none cursor-pointer accent-rose-500"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-600">Water Intake (Liters)</span>
                  <span className="text-rose-400 font-bold">{simulators.water} L</span>
                </div>
                <input
                  type="range" min="1.0" max="6.0" step="0.1" value={simulators.water}
                  onChange={e => setSimulators({ ...simulators, water: Number(e.target.value) })}
                  className="w-full h-1 bg-white rounded-lg appearance-none cursor-pointer accent-rose-500"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-600">Sleep Hours</span>
                  <span className="text-rose-400 font-bold">{simulators.sleep} hrs</span>
                </div>
                <input
                  type="range" min="4.0" max="12.0" step="0.5" value={simulators.sleep}
                  onChange={e => setSimulators({ ...simulators, sleep: Number(e.target.value) })}
                  className="w-full h-1 bg-white rounded-lg appearance-none cursor-pointer accent-rose-500"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-600">Stress Level</span>
                  <span className="text-rose-400 font-bold">{simulators.stress} /10</span>
                </div>
                <input
                  type="range" min="1" max="10" value={simulators.stress}
                  onChange={e => setSimulators({ ...simulators, stress: Number(e.target.value) })}
                  className="w-full h-1 bg-white rounded-lg appearance-none cursor-pointer accent-rose-500"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-600">Blood Sugar (mg/dL)</span>
                  <span className="text-rose-400 font-bold">{simulators.bloodSugar} mg/dL</span>
                </div>
                <input
                  type="range" min="70" max="250" value={simulators.bloodSugar}
                  onChange={e => setSimulators({ ...simulators, bloodSugar: Number(e.target.value) })}
                  className="w-full h-1 bg-white rounded-lg appearance-none cursor-pointer accent-rose-500"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  onClick={runLiveSimulation}
                  disabled={loading}
                  className="w-full py-2.5 bg-rose-500 hover:bg-rose-455 text-slate-950 font-bold rounded-xl text-xs uppercase transition-colors"
                >
                  Recalculate
                </button>
              </div>
            </div>

            {/* Scenario Saver */}
            {simResult && (
              <div className="border-t border-slate-200 pt-4 space-y-3">
                <span className="text-[10px] text-slate-500 uppercase font-mono block">Save Scenario</span>
                <input
                  type="text" value={simName}
                  onChange={e => setSimName(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-slate-800 text-xs focus:outline-none"
                />
                <button
                  onClick={handleSaveSimulation}
                  className="w-full py-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-bold hover:from-emerald-400 hover:to-teal-400 rounded-xl text-xs uppercase flex items-center justify-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" />
                  Save Scenario
                </button>
              </div>
            )}

            {/* Saved Simulations list */}
            {savedSims.length > 0 && (
              <div className="border-t border-slate-200 pt-4 space-y-2">
                <span className="text-[10px] text-slate-500 uppercase font-mono block">Saved Scenarios</span>
                <div className="space-y-1.5 max-h-36 overflow-y-auto">
                  {savedSims.map((sim) => (
                    <div key={sim.id} className="bg-white p-2.5 rounded border border-slate-200 flex justify-between items-center text-xs">
                      <button
                        onClick={() => loadSavedSimulation(sim)}
                        className="text-left font-mono truncate text-slate-700 hover:text-rose-400 max-w-[180px]"
                      >
                        {sim.name}
                      </button>
                      <button
                        onClick={() => handleDeleteSimulation(sim.id)}
                        className="text-rose-500 hover:text-rose-400 p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Recalculation Results (8 cols) */}
          <div className="lg:col-span-8 space-y-6">
            {simResult ? (
              <div className="space-y-6 animate-fade-in">
                {/* Before vs After Gauge Grid */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white border border-slate-200 shadow-sm p-5 rounded-2xl border border-slate-200 flex flex-col justify-between">
                    <span className="text-[10px] text-slate-500 uppercase font-mono">Current Overall Score</span>
                    <span className="text-3xl font-extrabold text-slate-600 font-mono my-2">{twinData?.overallHealthScore || 85}%</span>
                  </div>
                  <div className="bg-white border border-slate-200 shadow-sm p-5 rounded-2xl border border-slate-200 bg-gradient-to-br from-rose-500/5 to-amber-500/5 flex flex-col justify-between relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-20 h-20 bg-rose-500/10 rounded-full blur-xl animate-pulse"></div>
                    <span className="text-[10px] text-slate-500 uppercase font-mono">Simulated Target Score</span>
                    <div className="my-2 flex items-baseline gap-1.5">
                      <span className="text-3xl font-extrabold text-teal-400 font-mono">{simResult.simulatedOverallScore}%</span>
                      <span className={`text-[10px] font-mono font-bold ${
                        simResult.simulatedOverallScore >= (twinData?.overallHealthScore || 85) ? 'text-emerald-400' : 'text-rose-455'
                      }`}>
                        ({simResult.simulatedOverallScore - (twinData?.overallHealthScore || 85) >= 0 ? '+' : ''}
                        {simResult.simulatedOverallScore - (twinData?.overallHealthScore || 85)} diff)
                      </span>
                    </div>
                  </div>
                </div>

                {/* Financial Healthcare Impact */}
                <div className="bg-white border border-slate-200 shadow-sm p-5 rounded-2xl border border-slate-200 space-y-4">
                  <h4 className="text-xs font-bold text-slate-350 uppercase tracking-wider border-b border-slate-200 pb-2 flex items-center gap-1.5">
                    <DollarSign className="w-4 h-4 text-emerald-400" />
                    Estimated Financial Healthcare Impact
                  </h4>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div className="bg-white p-3 rounded-xl border border-slate-200">
                      <span className="text-[9px] text-slate-500 uppercase block font-mono">Medicine Cost Savings</span>
                      <span className="text-sm font-bold text-emerald-400 font-mono">₹{simResult.financialImpact?.medicineCostSavingsRupees || 2500}</span>
                    </div>
                    <div className="bg-white p-3 rounded-xl border border-slate-200">
                      <span className="text-[9px] text-slate-500 uppercase block font-mono">Doctor Visits Reduced</span>
                      <span className="text-sm font-bold text-emerald-400 font-mono">-{simResult.financialImpact?.hospitalVisitsReducedCount || 3} /yr</span>
                    </div>
                    <div className="bg-white p-3 rounded-xl border border-slate-200">
                      <span className="text-[9px] text-slate-500 uppercase block font-mono">Productivity Gain</span>
                      <span className="text-sm font-bold text-emerald-400 font-mono">+{simResult.financialImpact?.productivityGainPct || 12}%</span>
                    </div>
                  </div>
                </div>

                {/* Simulated Disease Risk Differences */}
                <div className="bg-white border border-slate-200 shadow-sm p-5 rounded-2xl border border-slate-200 space-y-4">
                  <h4 className="text-xs font-bold text-slate-350 uppercase tracking-wider border-b border-slate-200 pb-2">
                    Simulated Disease Risk Differences
                  </h4>
                  <div className="space-y-2">
                    {simResult.diseaseRisks?.map((risk: any, i: number) => {
                      const isReduction = risk.differencePct <= 0;
                      return (
                        <div key={i} className="flex justify-between items-center bg-white p-3 rounded border border-slate-200 text-xs">
                          <span className="font-bold text-slate-700 font-mono">{risk.name}</span>
                          <div className="flex items-center gap-3">
                            <span className="text-slate-600 font-mono">{risk.simulatedProbability}% risk</span>
                            <span className={`px-2 py-0.5 text-[9px] rounded font-mono font-bold uppercase ${
                              isReduction ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-455'
                            }`}>
                              {isReduction ? '' : '+'}{risk.differencePct}% Diff
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Body System Impacts */}
                <div className="bg-white border border-slate-200 shadow-sm p-6 rounded-2xl border border-slate-200 space-y-4">
                  <h3 className="text-xs font-bold text-slate-355 uppercase tracking-wider border-b border-slate-200 pb-2">
                    Body System Impact Details
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {simResult.systemImpact?.map((sys: any, idx: number) => (
                      <div key={idx} className="p-4 bg-white border border-slate-200 rounded-xl space-y-1">
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-slate-800 text-xs font-mono">{sys.name}</span>
                          <span className="text-sm font-bold text-teal-400 font-mono">{sys.simulatedScore}</span>
                        </div>
                        <p className="text-[10px] text-slate-600 leading-relaxed">{sys.reason}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* LifeStyle coach advice plan */}
                {simResult.lifestyleCoachActionPlan && (
                  <div className="bg-white border border-slate-200 shadow-sm p-5 rounded-2xl border border-slate-200 space-y-3">
                    <h3 className="text-xs font-bold text-slate-350 uppercase tracking-wider border-b border-slate-200 pb-2">
                      AI Lifestyle Coach Action Plan
                    </h3>
                    <div className="space-y-2 text-xs">
                      {simResult.lifestyleCoachActionPlan.map((act: any, i: number) => (
                        <div key={i} className="p-2.5 bg-white rounded border border-slate-200 flex justify-between">
                          <div>
                            <strong className="text-teal-400 block font-mono uppercase text-[9px]">{act.action}</strong>
                            <p className="text-slate-600 mt-0.5">{act.reason}</p>
                          </div>
                          <span className="text-emerald-400 font-bold font-mono shrink-0 ml-4">{act.expectedBenefit}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Health Journey Timeline */}
                {simResult.healthJourneyTimeline && (
                  <div className="bg-white border border-slate-200 shadow-sm p-5 rounded-2xl border border-slate-200 space-y-3">
                    <h3 className="text-xs font-bold text-slate-350 uppercase tracking-wider border-b border-slate-200 pb-2">
                      Expected Health Journey Timeline
                    </h3>
                    <div className="space-y-2 text-xs">
                      {simResult.healthJourneyTimeline.map((mile: any, i: number) => (
                        <div key={i} className="flex justify-between items-center bg-white p-2.5 rounded border border-slate-200 font-mono">
                          <div>
                            <span className="font-bold text-slate-700 block">{mile.milestone}</span>
                            <span className="text-[9px] text-slate-500">Weight: {mile.weightKg}kg | BMI: {mile.bmi}</span>
                          </div>
                          <div className="text-right">
                            <span className="text-[10px] text-teal-400 block">Health Score: {mile.healthScore}%</span>
                            <span className="text-[9px] text-slate-500">Risk: {mile.diseaseRiskPct}%</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="h-64 flex flex-col items-center justify-center text-center p-8 text-slate-500 bg-white border border-slate-200 shadow-sm rounded-2xl border border-slate-200">
                <Compass className="w-12 h-12 text-slate-700 mb-3 animate-pulse" />
                <p className="text-xs">Adjust sliders on the left and click Recalculate to generate simulated future health forecasts.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: SCENARIO COMPARE */}
      {activeSubTab === 'compare' && (
        <div className="bg-white border border-slate-200 shadow-sm p-6 rounded-2xl border border-slate-200 space-y-6 animate-fade-in">
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider border-b border-slate-200 pb-3 flex items-center gap-2">
            <BarChart2 className="w-4 h-4 text-rose-455" />
            Compare Scenarios
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-white p-4 rounded-xl border border-slate-200 text-xs">
            <div className="space-y-2">
              <label className="text-slate-500 font-mono uppercase block">Scenario A:</label>
              <select
                value={savedSims.indexOf(savedSims.find(s => JSON.stringify(s.simulationData) === JSON.stringify(compareTwinA)))}
                onChange={e => setCompareTwinA(savedSims[Number(e.target.value)]?.simulationData)}
                className="bg-white border border-slate-200 rounded-xl p-2.5 text-slate-355 w-full focus:outline-none"
              >
                <option value="">-- Select Scenario A --</option>
                {savedSims.map((s, i) => (
                  <option key={s.id} value={i}>{s.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-slate-500 font-mono uppercase block">Scenario B:</label>
              <select
                value={savedSims.indexOf(savedSims.find(s => JSON.stringify(s.simulationData) === JSON.stringify(compareTwinB)))}
                onChange={e => setCompareTwinB(savedSims[Number(e.target.value)]?.simulationData)}
                className="bg-white border border-slate-200 rounded-xl p-2.5 text-slate-355 w-full focus:outline-none"
              >
                <option value="">-- Select Scenario B --</option>
                {savedSims.map((s, i) => (
                  <option key={s.id} value={i}>{s.name}</option>
                ))}
              </select>
            </div>
          </div>

          {compareTwinA && compareTwinB ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 text-xs">
              <div className="space-y-4 p-5 bg-white rounded-xl border border-slate-200">
                <span className="px-2.5 py-0.5 bg-rose-500/10 text-rose-400 border border-rose-500/20 text-[9px] font-mono rounded font-bold uppercase">SCENARIO A</span>
                <div className="mt-3 flex justify-between items-center border-b border-slate-200 pb-2">
                  <span className="text-slate-600 font-bold uppercase">Simulated Overall Score</span>
                  <span className="text-lg font-bold font-mono text-slate-205">{compareTwinA.simulatedOverallScore}%</span>
                </div>
                <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                  <span className="text-slate-600 font-bold uppercase">Lifestyle Score</span>
                  <span className="font-bold text-teal-400 font-mono">{compareTwinA.simulatedLifestyleScore}%</span>
                </div>
              </div>

              <div className="space-y-4 p-5 bg-white rounded-xl border border-slate-200">
                <span className="px-2.5 py-0.5 bg-white text-slate-600 border border-slate-200 text-[9px] font-mono rounded font-bold uppercase">SCENARIO B</span>
                <div className="mt-3 flex justify-between items-center border-b border-slate-200 pb-2">
                  <span className="text-slate-600 font-bold uppercase">Simulated Overall Score</span>
                  <span className="text-lg font-bold font-mono text-slate-205">{compareTwinB.simulatedOverallScore}%</span>
                </div>
                <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                  <span className="text-slate-600 font-bold uppercase">Lifestyle Score</span>
                  <span className="font-bold text-teal-400 font-mono">{compareTwinB.simulatedLifestyleScore}%</span>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-500 text-center py-8">Select scenarios above to compare.</p>
          )}
        </div>
      )}

      {/* TAB 4: BIO PROFILE FORM */}
      {activeSubTab === 'profile' && (
        <div className="bg-white border border-slate-200 shadow-sm p-6 rounded-2xl border border-slate-200 space-y-6">
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider border-b border-slate-200 pb-3 flex items-center gap-2">
            <User className="w-4 h-4 text-rose-400" />
            Biological & Lifestyle Profile Settings
          </h3>
          <form onSubmit={handleProfileSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs text-slate-600 block font-semibold">Age</label>
              <input
                type="number"
                value={profile.age}
                onChange={e => setProfile({ ...profile, age: Number(e.target.value) })}
                className="w-full bg-white border border-slate-200 rounded-xl p-3 text-slate-800 text-xs focus:border-rose-500/40 focus:outline-none transition-colors"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs text-slate-600 block font-semibold">Gender</label>
              <select
                value={profile.gender}
                onChange={e => setProfile({ ...profile, gender: e.target.value })}
                className="w-full bg-white border border-slate-200 rounded-xl p-3 text-slate-800 text-xs focus:border-rose-500/40 focus:outline-none transition-colors"
              >
                <option>Male</option>
                <option>Female</option>
                <option>Other</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs text-slate-600 block font-semibold">BMI</label>
              <input
                type="number"
                step="0.1"
                value={profile.bmi}
                onChange={e => setProfile({ ...profile, bmi: Number(e.target.value) })}
                className="w-full bg-white border border-slate-200 rounded-xl p-3 text-slate-800 text-xs focus:border-rose-500/40 focus:outline-none transition-colors"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs text-slate-600 block font-semibold">Allergies</label>
              <input
                type="text"
                value={profile.allergies}
                onChange={e => setProfile({ ...profile, allergies: e.target.value })}
                className="w-full bg-white border border-slate-200 rounded-xl p-3 text-slate-800 text-xs focus:border-rose-500/40 focus:outline-none transition-colors"
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-xs text-slate-600 block font-semibold">Existing Diseases / Clinical Diagnoses</label>
              <input
                type="text"
                value={profile.existingDiseases}
                onChange={e => setProfile({ ...profile, existingDiseases: e.target.value })}
                className="w-full bg-white border border-slate-200 rounded-xl p-3 text-slate-800 text-xs focus:border-rose-500/40 focus:outline-none transition-colors"
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-xs text-slate-600 block font-semibold">Family Medical History</label>
              <textarea
                value={profile.familyHistory}
                onChange={e => setProfile({ ...profile, familyHistory: e.target.value })}
                className="w-full bg-white border border-slate-200 rounded-xl p-3 text-slate-800 text-xs focus:border-rose-500/40 focus:outline-none transition-colors h-20 resize-none"
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-xs text-slate-600 block font-semibold">Lifestyle & Activity Level</label>
              <input
                type="text"
                value={profile.lifestyle}
                onChange={e => setProfile({ ...profile, lifestyle: e.target.value })}
                className="w-full bg-white border border-slate-200 rounded-xl p-3 text-slate-800 text-xs focus:border-rose-500/40 focus:outline-none transition-colors"
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-xs text-slate-600 block font-semibold">Vaccination Record / History</label>
              <input
                type="text"
                value={profile.vaccinations}
                onChange={e => setProfile({ ...profile, vaccinations: e.target.value })}
                className="w-full bg-white border border-slate-200 rounded-xl p-3 text-slate-800 text-xs focus:border-rose-500/40 focus:outline-none transition-colors"
              />
            </div>
            <div className="md:col-span-2 pt-4">
              <button
                type="submit"
                disabled={loading}
                className="w-full md:w-auto px-6 py-3 bg-gradient-to-r from-rose-500 to-amber-500 text-slate-950 font-bold hover:from-rose-400 hover:to-amber-400 rounded-xl transition-all font-mono uppercase text-xs disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                <Save className="w-4 h-4" />
                <span>{loading ? 'Saving Profile...' : 'Save Profile & Update Twin'}</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
