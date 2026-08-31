import React, { useState, useEffect } from 'react';
import { 
  Activity, Shield, ShieldCheck, ShieldAlert, Sparkles, Sliders, ArrowUpRight, CheckCircle2, User, 
  AlertCircle, HeartPulse, RefreshCw, Send, Download, Layers, Check, Copy, FileText, Calendar, Lock, Globe
} from 'lucide-react';
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

export default function CitizenHealthExchangePage() {
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [fhirBundle, setFhirBundle] = useState<any>(null);
  const [abhaAddressInput, setAbhaAddressInput] = useState('');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [copied, setCopied] = useState(false);

  const fetchProfile = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/interoperability/profile');
      if (res.data?.success) {
        setProfile(res.data.data);
      }
      
      const fhirRes = await api.get('/interoperability/fhir');
      if (fhirRes.data?.success) {
        setFhirBundle(fhirRes.data.data);
      }
    } catch (err) {
      setError('Failed to fetch ABHA exchange registry settings.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleLinkABHA = async () => {
    if (!abhaAddressInput.includes('@')) {
      setError('Invalid ABHA address format. Must include @ (e.g. name@abha)');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await api.post('/interoperability/profile', { abhaAddress: abhaAddressInput });
      if (res.data?.success) {
        setProfile(res.data.data);
        setSuccessMsg('Linked successfully to Ayushman Bharat Digital Mission (ABDM)!');
        setTimeout(() => setSuccessMsg(''), 4000);
      }
    } catch (err) {
      setError('Could not register ABHA ID.');
    } finally {
      setLoading(false);
    }
  };

  const handleConsentAction = async (consentId: string, action: 'Approved' | 'Rejected') => {
    setLoading(true);
    setError('');
    try {
      const res = await api.post('/interoperability/consent', { consentId, action });
      if (res.data?.success) {
        setProfile(res.data.data);
        setSuccessMsg(`Consent request ${action.toLowerCase()} successfully.`);
        setTimeout(() => setSuccessMsg(''), 4000);
      }
    } catch (err) {
      setError('Could not resolve consent request.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyJSON = () => {
    if (!fhirBundle) return;
    navigator.clipboard.writeText(JSON.stringify(fhirBundle, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadFHIR = () => {
    if (!fhirBundle) return;
    const blob = new Blob([JSON.stringify(fhirBundle, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `fhir_bundle_${profile?.abhaId || 'records'}.json`;
    link.click();
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4">
      {/* Title Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-500/10 rounded-xl text-indigo-400 border border-indigo-500/20 shadow-lg">
            <Globe className="w-5 h-5 animate-spin" />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
              National Health Exchange Interoperability
              <span className="text-[10px] bg-indigo-500/15 text-indigo-400 border border-indigo-500/20 px-2 py-0.5 rounded font-mono uppercase">ABDM Linkage</span>
            </h2>
            <p className="text-xs text-slate-600 mt-0.5">Ayushman Bharat Digital Mission (ABDM) compliance and HL7 FHIR record exchange</p>
          </div>
        </div>

        <button
          onClick={fetchProfile}
          disabled={loading}
          className="px-4 py-2 border border-slate-200 bg-white hover:bg-slate-855 text-slate-355 font-semibold rounded-xl text-xs flex items-center gap-2 transition-all"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Sync ABDM Status</span>
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

      {/* Grid system */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column (ABHA ID Card & Consent Management) */}
        <div className="lg:col-span-6 space-y-6">
          {/* ABHA card registration/linkage */}
          {profile?.verified ? (
            <div className="bg-white border border-slate-200 shadow-sm p-6 rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950/40 relative overflow-hidden shadow-2xl space-y-6">
              {/* Card headers */}
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <span className="text-[10px] text-slate-500 font-mono tracking-wider block uppercase">National Health Authority</span>
                  <h3 className="text-sm font-bold text-slate-800 uppercase tracking-widest font-mono">ABHA HEALTH ID CARD</h3>
                </div>
                <span className="text-[9px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded font-bold uppercase font-mono">ABDM Link Active</span>
              </div>

              {/* Citizen Card detail rows */}
              <div className="flex gap-4 items-center pt-2">
                <div className="w-16 h-16 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-500 shrink-0">
                  <User className="w-8 h-8" />
                </div>
                <div className="space-y-1 text-xs font-mono">
                  <div>
                    <span className="text-slate-500 block text-[9px] uppercase">ABHA Address</span>
                    <span className="font-bold text-slate-205">{profile.abhaAddress}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[9px] uppercase">ABHA Number</span>
                    <span className="font-bold text-indigo-400">{profile.abhaId}</span>
                  </div>
                </div>
              </div>

              {/* Validation Status footer */}
              <div className="border-t border-slate-200/60 pt-4 flex justify-between items-center text-[10px] font-mono text-slate-500">
                <span>Status: Verified Citizen ID</span>
                <span>Linked: {profile.syncTimeline?.[0]?.timestamp ? new Date(profile.syncTimeline[0].timestamp).toLocaleDateString() : 'N/A'}</span>
              </div>
            </div>
          ) : (
            <div className="bg-white border border-slate-200 shadow-sm p-6 rounded-2xl border border-slate-200 space-y-4">
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Lock className="w-4 h-4 text-indigo-400" />
                  Link ABDM ABHA Address
                </h3>
                <p className="text-xs text-slate-600">Provide your Ayushman Bharat Address to automatically fetch linked diagnostic logs</p>
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. name@abha"
                  value={abhaAddressInput}
                  onChange={e => setAbhaAddressInput(e.target.value)}
                  className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-355 w-full focus:outline-none font-mono"
                />
                <button
                  onClick={handleLinkABHA}
                  disabled={loading}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-slate-950 font-bold rounded-xl text-xs uppercase"
                >
                  Link
                </button>
              </div>
            </div>
          )}

          {/* Consent requests list */}
          <div className="bg-white border border-slate-200 shadow-sm p-6 rounded-2xl border border-slate-200 space-y-4">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider border-b border-slate-200 pb-2">
              ABDM Consent Requests Management
            </h3>

            <div className="space-y-3">
              {(profile?.consents || []).map((c: any) => (
                <div key={c.id} className="p-4 bg-white rounded-xl border border-slate-200 space-y-3 text-xs font-mono">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-slate-205">{c.hospital}</span>
                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                      c.status === 'Approved' ? 'bg-emerald-500/10 text-emerald-400' :
                      c.status === 'Pending' ? 'bg-amber-500/10 text-amber-400 animate-pulse' :
                      'bg-slate-800 text-slate-500'
                    }`}>{c.status}</span>
                  </div>
                  <p className="text-slate-600">Purpose: {c.purpose}</p>
                  
                  {c.status === 'Pending' && (
                    <div className="flex gap-2 pt-1">
                      <button
                        onClick={() => handleConsentAction(c.id, 'Approved')}
                        className="px-3.5 py-1.5 bg-emerald-500 text-slate-950 font-bold rounded-lg text-[10px] uppercase"
                      >
                        Approve Share
                      </button>
                      <button
                        onClick={() => handleConsentAction(c.id, 'Rejected')}
                        className="px-3.5 py-1.5 bg-white border border-slate-200 text-slate-600 font-bold rounded-lg text-[10px] uppercase"
                      >
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column (FHIR Bundle JSON Viewer & Timeline) */}
        <div className="lg:col-span-6 space-y-6">
          {/* Interactive FHIR Bundle Viewer */}
          <div className="bg-white border border-slate-200 shadow-sm p-6 rounded-2xl border border-slate-200 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-200 pb-2.5">
              <h3 className="text-sm font-bold text-slate-205 uppercase tracking-wider flex items-center gap-2">
                <FileText className="w-4 h-4 text-indigo-400" />
                HL7 FHIR Bundle Package
              </h3>
              
              <div className="flex gap-2">
                <button
                  onClick={handleCopyJSON}
                  className="p-1.5 border border-slate-200 bg-white rounded-lg text-slate-600 hover:text-white"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={handleDownloadFHIR}
                  className="p-1.5 border border-slate-200 bg-white rounded-lg text-slate-600 hover:text-white"
                >
                  <Download className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {fhirBundle ? (
              <pre className="p-4 bg-white rounded-xl border border-slate-200 max-h-72 overflow-y-auto text-[10px] font-mono text-slate-600 leading-relaxed">
                {JSON.stringify(fhirBundle, null, 2)}
              </pre>
            ) : (
              <p className="text-xs text-slate-500 text-center py-6">Link your ABHA ID to view FHIR Bundle exports.</p>
            )}
          </div>

          {/* Sync timeline */}
          <div className="bg-white border border-slate-200 shadow-sm p-6 rounded-2xl border border-slate-200 space-y-4">
            <h3 className="text-sm font-bold text-slate-205 uppercase tracking-wider border-b border-slate-200 pb-2">
              Exchange Sync History Log
            </h3>

            <div className="space-y-3.5 max-h-60 overflow-y-auto font-mono text-xs">
              {(profile?.syncTimeline || []).map((item: any) => (
                <div key={item.id} className="flex gap-3 items-start">
                  <div className="p-1.5 bg-white border border-slate-200 rounded-lg text-slate-500 mt-0.5 shrink-0">
                    <Calendar className="w-3.5 h-3.5" />
                  </div>
                  <div className="space-y-0.5">
                    <span className="font-semibold text-slate-700 block">{item.description}</span>
                    <span className="text-[10px] text-slate-550 block">{item.system} • {new Date(item.timestamp).toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
