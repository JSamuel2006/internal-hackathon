import React, { useState, useEffect } from 'react';
import { 
  Activity, Shield, Award, Calendar, Clock, RefreshCw, Send, CheckCircle2, AlertCircle, HeartPulse, User, MapPin, FileText, Download, Play
} from 'lucide-react';
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

export default function CitizenLaboratoryPage() {
  const [loading, setLoading] = useState(false);
  const [orders, setOrders] = useState<any[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [aiReport, setAiReport] = useState<any>(null);

  // Manual result entry for demonstration
  const [manualResult, setManualResult] = useState('');

  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const fetchLabs = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/labs/orders');
      if (res.data?.success) setOrders(res.data.data || []);
    } catch (err) {
      setError('Could not retrieve laboratory records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLabs();
  }, []);

  const handleDiagnose = async (orderId: string) => {
    if (!manualResult) {
      setError('Please input lab results for verification.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await api.post('/labs/results', { orderId, result: manualResult });
      if (res.data?.success) {
        setAiReport(res.data.data);
        setSuccessMsg('AI Laboratory interpretation completed!');
        setManualResult('');
        fetchLabs();
        setTimeout(() => setSuccessMsg(''), 4000);
      }
    } catch (err) {
      setError('Failed to analyze lab order results.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4">
      {/* Title Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-rose-500/10 rounded-xl text-rose-455 border border-rose-500/20 shadow-lg">
            <Activity className="w-5 h-5 glow-pill" />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
              Laboratory Diagnostics & Results
              <span className="text-[10px] bg-rose-500/15 text-rose-400 border border-rose-500/20 px-2 py-0.5 rounded font-mono uppercase">LIS Node</span>
            </h2>
            <p className="text-xs text-slate-600 mt-0.5">Track sample collections, view completed reports, and read AI critical result alerts</p>
          </div>
        </div>

        <button
          onClick={fetchLabs}
          disabled={loading}
          className="px-4 py-2 border border-slate-200 bg-white hover:bg-slate-855 text-slate-355 font-semibold rounded-xl text-xs flex items-center gap-2 transition-all"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Queue</span>
        </button>
      </div>

      {/* Notifications */}
      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-450 text-xs flex items-center gap-2.5 shadow-lg font-mono">
          <CheckCircle2 className="w-4.5 h-4.5 text-emerald-400 shrink-0" />
          <span className="font-semibold">{successMsg}</span>
        </div>
      )}
      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-455 text-xs flex items-center gap-2.5 shadow-lg font-mono">
          <AlertCircle className="w-4.5 h-4.5 text-rose-400 shrink-0" />
          <span className="font-semibold">{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column (Lab Orders Queue list) */}
        <div className="lg:col-span-5 bg-white border border-slate-200 shadow-sm p-6 rounded-2xl border border-slate-200 space-y-4 self-start">
          <h3 className="text-xs font-bold text-slate-350 uppercase tracking-wider border-b border-slate-200 pb-2">
            My Laboratory Orders
          </h3>

          <div className="space-y-3">
            {orders.map((ord) => (
              <div
                key={ord.id}
                onClick={() => {
                  setSelectedOrder(ord);
                  setAiReport(null);
                }}
                className={`p-4 rounded-xl border transition-all text-left font-mono space-y-2.5 cursor-pointer ${
                  selectedOrder?.id === ord.id
                    ? 'bg-rose-500/10 border-rose-500/30'
                    : 'bg-white border-slate-200 hover:border-slate-200'
                }`}
              >
                <div className="flex justify-between items-center">
                  <span className="font-bold text-slate-205 text-xs">{ord.testName}</span>
                  <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase ${
                    ord.status === 'Completed' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'
                  }`}>{ord.status}</span>
                </div>
                <p className="text-[10px] text-slate-500">Laboratory: {ord.labName || 'Pune Central Diagnostics'}</p>
                {ord.result && (
                  <p className="text-[10px] text-slate-600 bg-white p-2 rounded border border-slate-200 leading-normal">{ord.result}</p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Right Column (AI Interpretation Panel & Result Upload) */}
        <div className="lg:col-span-7 space-y-6">
          {selectedOrder ? (
            <div className="space-y-6 animate-fade-in">
              {/* Manual Result Input for demo simulation */}
              {selectedOrder.status !== 'Completed' && (
                <div className="bg-white border border-slate-200 shadow-sm p-6 rounded-2xl border border-slate-200 space-y-4">
                  <h4 className="text-xs font-bold text-slate-205 uppercase tracking-wider border-b border-slate-200 pb-2">
                    Enter Laboratory Result Values (Demo Simulation)
                  </h4>
                  <div className="space-y-3">
                    <input
                      type="text"
                      placeholder="e.g. Hemoglobin: 10.2 g/dL (Low), WBC: 12000 /uL"
                      value={manualResult}
                      onChange={e => setManualResult(e.target.value)}
                      className="bg-white border border-slate-200 rounded-xl p-2.5 text-xs text-slate-355 w-full focus:outline-none font-mono"
                    />
                    <button
                      onClick={() => handleDiagnose(selectedOrder.id)}
                      className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-slate-950 font-bold rounded-xl text-xs uppercase flex items-center justify-center gap-1.5 font-mono"
                    >
                      <Play className="w-3.5 h-3.5" />
                      <span>Validate & Query Clinical AI</span>
                    </button>
                  </div>
                </div>
              )}

              {/* AI Report details */}
              {aiReport && (
                <div className="bg-white border border-slate-200 shadow-sm p-6 rounded-2xl border border-slate-200 space-y-4 text-xs font-mono animate-fade-in">
                  <div className="border-b border-slate-200 pb-2 flex justify-between items-center">
                    <h4 className="font-bold text-slate-205 text-xs uppercase">AI Laboratory Clinical Diagnostic Report</h4>
                    {aiReport.criticalFlag && (
                      <span className="px-2 py-0.5 bg-rose-500/10 text-rose-455 border border-rose-500/20 text-[9px] rounded font-bold uppercase animate-pulse">Critical Alert</span>
                    )}
                  </div>

                  <div className="p-3.5 bg-white rounded-xl border border-slate-200 text-slate-700 leading-relaxed">
                    {aiReport.summary}
                  </div>

                  {aiReport.abnormalBiomarkers?.length > 0 && (
                    <div className="space-y-1.5">
                      <span className="text-[9px] text-slate-500 uppercase font-bold block">Abnormal Biomarkers Flagged:</span>
                      <div className="flex flex-wrap gap-2">
                        {aiReport.abnormalBiomarkers.map((bio: string, idx: number) => (
                          <span key={idx} className="px-2 py-0.5 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded text-[9px] uppercase">{bio}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4 pt-2">
                    <div className="bg-white p-3 rounded-xl border border-slate-200">
                      <span className="text-slate-500 text-[9px] uppercase block">Repeat Checkup Recommended</span>
                      <strong className="text-slate-700 block mt-1">{aiReport.repeatInvestigationRecommended ? 'YES' : 'NO'}</strong>
                    </div>
                    <div className="bg-white p-3 rounded-xl border border-slate-200">
                      <span className="text-slate-500 text-[9px] uppercase block">Next Steps</span>
                      <strong className="text-slate-700 block mt-1">{aiReport.nextSteps}</strong>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="h-64 flex flex-col items-center justify-center text-center p-8 text-slate-500 bg-white border border-slate-200 shadow-sm rounded-2xl border border-slate-200">
              <FileText className="w-12 h-12 text-slate-700 mb-3 animate-pulse" />
              <p className="text-xs">Select a laboratory test order from the left index panel to examine collection timeline logs and read AI diagnoses.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
