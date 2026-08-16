import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Bot, ShieldAlert, HeartPulse, LineChart, 
  Map, Sparkles, Activity, FileJson, Lock 
} from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="flex-1 flex flex-col bg-slate-950 text-slate-100 overflow-hidden relative">
      {/* Decorative Blur Backgrounds */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-teal-500/5 rounded-full blur-3xl -z-10"></div>
      <div className="absolute bottom-10 left-10 w-[300px] h-[300px] bg-indigo-500/5 rounded-full blur-3xl -z-10"></div>

      {/* Hero Section */}
      <section className="max-w-6xl mx-auto px-6 pt-20 pb-16 text-center flex flex-col items-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-xs font-mono text-teal-400 mb-6">
          <Sparkles className="w-3.5 h-3.5" />
          <span>India Smart Health Hackathon Finale Presentation</span>
        </div>

        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight max-w-4xl leading-tight">
          Next-Gen AI Platform for{' '}
          <span className="bg-gradient-to-r from-teal-400 via-cyan-400 to-indigo-400 bg-clip-text text-transparent">
            Public Health Surveillance
          </span>
        </h1>

        <p className="mt-6 text-base md:text-lg text-slate-400 max-w-2xl leading-relaxed">
          ArogyaVerse AI consolidates real-time symptoms triage, automated prescription strip scanner, disease outbreak simulation, and regional digital twins into a single unified platform.
        </p>

        <div className="mt-10 flex flex-wrap justify-center gap-4">
          <Link
            to="/login"
            className="px-8 py-3.5 rounded-xl font-bold bg-gradient-to-r from-teal-500 to-emerald-500 text-slate-950 hover:from-teal-400 hover:to-emerald-400 shadow-xl shadow-teal-500/10 transition-all transform hover:-translate-y-0.5"
          >
            Launch Command Center
          </Link>
          <Link
            to="/about"
            className="px-8 py-3.5 rounded-xl font-bold bg-slate-900 border border-slate-800 text-slate-200 hover:bg-slate-850 hover:border-slate-700 transition-all"
          >
            Explore System Architecture
          </Link>
        </div>
      </section>

      {/* Portal Cards Section */}
      <section className="max-w-6xl mx-auto px-6 py-12 w-full grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Citizen Card */}
        <div className="glass-panel rounded-2xl p-6 border border-slate-900/60 relative overflow-hidden flex flex-col justify-between h-80">
          <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/5 rounded-full blur-2xl"></div>
          <div>
            <div className="w-12 h-12 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mb-4">
              <Bot className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-100">Citizen ArogyaMitra</h3>
            <p className="text-sm text-slate-450 mt-2 leading-relaxed">
              Provides multi-lingual symptoms self-triage, ABHA integrated card, nearby health centres map locator, and OCR strip scanning.
            </p>
          </div>
          <Link
            to="/login"
            className="text-xs font-bold text-rose-400 hover:text-rose-300 transition-colors flex items-center gap-1 mt-4"
          >
            Access Citizen Portal &rarr;
          </Link>
        </div>

        {/* Officer Card */}
        <div className="glass-panel rounded-2xl p-6 border border-slate-900/60 relative overflow-hidden flex flex-col justify-between h-80">
          <div className="absolute top-0 right-0 w-24 h-24 bg-teal-500/5 rounded-full blur-2xl"></div>
          <div>
            <div className="w-12 h-12 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-400 flex items-center justify-center mb-4">
              <Map className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-100">Health Officer Portal</h3>
            <p className="text-sm text-slate-450 mt-2 leading-relaxed">
              Active epidemiological dashboard containing outbreak simulators, regional digital twin modeling, and automated IEC campaign generator.
            </p>
          </div>
          <Link
            to="/login"
            className="text-xs font-bold text-teal-450 hover:text-teal-350 transition-colors flex items-center gap-1 mt-4"
          >
            Open Officer Portal &rarr;
          </Link>
        </div>

        {/* Admin Card */}
        <div className="glass-panel rounded-2xl p-6 border border-slate-900/60 relative overflow-hidden flex flex-col justify-between h-80">
          <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-2xl"></div>
          <div>
            <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mb-4">
              <Lock className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-100">System Infrastructure</h3>
            <p className="text-sm text-slate-450 mt-2 leading-relaxed">
              Real-time platform system monitoring including Express Server, MongoDB database health, API rate limits, and audit logs.
            </p>
          </div>
          <Link
            to="/login"
            className="text-xs font-bold text-indigo-400 hover:text-indigo-305 transition-colors flex items-center gap-1 mt-4"
          >
            Access Root Control &rarr;
          </Link>
        </div>
      </section>

      {/* Info Stats Banner */}
      <section className="bg-slate-950/60 border-y border-slate-900 py-12 px-6">
        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          <div>
            <p className="text-2xl md:text-3xl font-extrabold text-teal-400 font-mono">100%</p>
            <p className="text-[10px] text-slate-500 font-mono uppercase tracking-wider mt-1">Sovereign Data Storage</p>
          </div>
          <div>
            <p className="text-2xl md:text-3xl font-extrabold text-indigo-400 font-mono">250ms</p>
            <p className="text-[10px] text-slate-500 font-mono uppercase tracking-wider mt-1">Real-time Triage Speed</p>
          </div>
          <div>
            <p className="text-2xl md:text-3xl font-extrabold text-rose-450 font-mono">94%</p>
            <p className="text-[10px] text-slate-500 font-mono uppercase tracking-wider mt-1">Medicine OCR Accuracy</p>
          </div>
          <div>
            <p className="text-2xl md:text-3xl font-extrabold text-cyan-400 font-mono">22+</p>
            <p className="text-[10px] text-slate-500 font-mono uppercase tracking-wider mt-1">Indian Languages Supported</p>
          </div>
        </div>
      </section>
    </div>
  );
}
