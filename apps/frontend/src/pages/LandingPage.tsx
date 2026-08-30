import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Bot, ShieldAlert, HeartPulse, Stethoscope, 
  Map, Sparkles, Activity, FileJson, Lock, 
  Users, WifiOff, Globe, PhoneCall, ScanLine, 
  ChevronRight, ArrowRight, ShieldCheck, Cpu, Zap, Radio
} from 'lucide-react';

export default function LandingPage() {
  const portals = [
    {
      role: 'ROLE_CITIZEN',
      name: 'Citizen ArogyaMitra',
      badge: 'Public Healthcare',
      color: 'rose',
      icon: HeartPulse,
      desc: 'AI health assistant, medicine scanner (17-pass OCR), offline-first emergency health card, symptoms triage, and ABHA health exchange.',
      features: ['Multilingual AI Assistant', 'Offline First-Aid & SOS', 'Prescription OCR Scanner', 'Emergency Doctor Chat'],
      link: '/login?role=ROLE_CITIZEN',
      bgGlow: 'bg-rose-500/10 border-rose-500/20 text-rose-400',
    },
    {
      role: 'ROLE_WORKER',
      name: 'ASHA Field Worker',
      badge: 'Community Outreach',
      color: 'amber',
      icon: Users,
      desc: 'Offline field screenings (BP, SpO₂, glucose, weight), automated triage risk evaluation, household registry, and auto-sync when online.',
      features: ['Offline Vitals Screening', 'Clinical Referral Engine', 'IndexedDB Queue & Sync', 'High-Risk Follow-ups'],
      link: '/login?role=ROLE_WORKER',
      bgGlow: 'bg-amber-500/10 border-amber-500/20 text-amber-400',
    },
    {
      role: 'ROLE_DOCTOR',
      name: 'Doctor Command',
      badge: 'Emergency Clinical',
      color: 'teal',
      icon: Stethoscope,
      desc: 'Real-time Socket.IO emergency consultation requests, live citizen chat, consent-gated medical history access, and ASHA screening oversight.',
      features: ['Socket.IO Live Alert Queue', 'Citizen ↔ Doctor Chat', 'Consent Management', 'ASHA History Visibility'],
      link: '/login?role=ROLE_DOCTOR',
      bgGlow: 'bg-teal-500/10 border-teal-500/20 text-teal-400',
    },
    {
      role: 'ROLE_OFFICER',
      name: 'Public Health Officer',
      badge: 'Epidemiological Command',
      color: 'indigo',
      icon: Map,
      desc: 'Live ASHA field monitoring, geospatial outbreak heatmaps, population digital twins, scenario simulation, and automated IEC campaigns.',
      features: ['ASHA Live Surveillance', 'Disease Heatmap & Forecast', 'Scenario Simulator', 'Outbreak Intelligence'],
      link: '/login?role=ROLE_OFFICER',
      bgGlow: 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400',
    },
    {
      role: 'ROLE_ADMIN',
      name: 'System Infrastructure',
      badge: 'Platform Root',
      color: 'cyan',
      icon: Lock,
      desc: 'Platform health monitoring, PostgreSQL latency ping, user RBAC management, audit log inspection, and system configuration.',
      features: ['PostgreSQL Health & Latency', 'Audit Trail Logs', 'RBAC User Management', 'Socket.IO Server Nodes'],
      link: '/login?role=ROLE_ADMIN',
      bgGlow: 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400',
    },
  ];

  return (
    <div className="flex-1 flex flex-col bg-slate-950 text-slate-100 overflow-hidden relative selection:bg-teal-500 selection:text-slate-950">
      
      {/* Decorative Glow Elements */}
      <div className="absolute top-16 left-1/2 -translate-x-1/2 w-[700px] h-[500px] bg-gradient-to-b from-teal-500/10 via-indigo-500/5 to-transparent rounded-full blur-3xl -z-10 pointer-events-none"></div>
      <div className="absolute top-[600px] -left-20 w-[400px] h-[400px] bg-rose-500/5 rounded-full blur-3xl -z-10 pointer-events-none"></div>
      <div className="absolute top-[900px] -right-20 w-[450px] h-[450px] bg-teal-500/5 rounded-full blur-3xl -z-10 pointer-events-none"></div>

      {/* ── Hero Section ────────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-6 pt-16 pb-12 text-center flex flex-col items-center">
        
        {/* National Initiative Badge */}
        <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-slate-900/90 border border-slate-800 text-xs font-mono text-teal-400 mb-6 shadow-md backdrop-blur-md">
          <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse"></span>
          <span className="font-bold tracking-wide">NATIONAL HEALTH AI PLATFORM • SMART HEALTHCARE FOR RURAL & URBAN INDIA</span>
        </div>

        {/* Hero Title */}
        <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight max-w-5xl leading-[1.15]">
          Universal Healthcare.{' '}
          <span className="bg-gradient-to-r from-teal-400 via-cyan-300 to-indigo-400 bg-clip-text text-transparent">
            AI-Powered, Offline-First, Multilingual.
          </span>
        </h1>

        {/* Hero Subtitle */}
        <p className="mt-6 text-base sm:text-lg md:text-xl text-slate-350 max-w-3xl leading-relaxed font-normal">
          <strong className="text-slate-200">ArogyaMitra</strong> bridges the healthcare divide in rural and underserved areas — connecting Citizens, ASHA field workers, Doctors, and Public Health Officers in a real-time emergency &amp; surveillance ecosystem.
        </p>

        {/* Hero Action Buttons */}
        <div className="mt-10 flex flex-wrap justify-center gap-4 items-center">
          <Link
            to="/login"
            className="flex items-center gap-2 px-8 py-4 rounded-xl font-bold text-sm bg-gradient-to-r from-teal-500 via-teal-400 to-emerald-500 text-slate-950 hover:from-teal-400 hover:to-emerald-400 shadow-xl shadow-teal-500/20 transition-all transform hover:-translate-y-0.5 cursor-pointer font-mono uppercase tracking-wider"
          >
            <span>Launch Platform Command</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            to="/about"
            className="flex items-center gap-2 px-7 py-4 rounded-xl font-bold text-sm bg-slate-900/90 border border-slate-800 text-slate-200 hover:bg-slate-850 hover:border-slate-700 hover:text-white transition-all cursor-pointer font-mono"
          >
            <span>Architecture &amp; Standards</span>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </Link>
        </div>

        {/* Core Value Pills */}
        <div className="mt-12 flex flex-wrap justify-center gap-2.5 sm:gap-4 text-xs font-mono text-slate-400">
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900/60 border border-slate-800/80">
            <WifiOff className="w-3.5 h-3.5 text-teal-400" /> 100% Offline-First Mode
          </span>
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900/60 border border-slate-800/80">
            <Globe className="w-3.5 h-3.5 text-indigo-400" /> English • தமிழ் • हिन्दी • मराठी
          </span>
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900/60 border border-slate-800/80">
            <ScanLine className="w-3.5 h-3.5 text-rose-400" /> 17-Pass Medicine Strip OCR
          </span>
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900/60 border border-slate-800/80">
            <Radio className="w-3.5 h-3.5 text-amber-400" /> Socket.IO Real-Time ERN
          </span>
        </div>
      </section>

      {/* ── All 5 Portal Gateways Grid ─────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-6 py-8 w-full">
        <div className="text-center mb-8">
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-100 uppercase font-mono">
            Role-Based Portal Gateways
          </h2>
          <p className="text-xs text-slate-400 mt-1 font-mono">
            Select a specialized user dashboard to launch the application
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {portals.map((p) => {
            const Icon = p.icon;
            return (
              <div 
                key={p.role} 
                className="glass-panel rounded-2xl p-6 border border-slate-850 hover:border-slate-700 relative overflow-hidden flex flex-col justify-between group transition-all"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className={`p-3 rounded-xl border ${p.bgGlow}`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2.5 py-1 rounded-md bg-slate-900 border border-slate-800 text-slate-400">
                      {p.badge}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-slate-100 group-hover:text-teal-300 transition-colors">
                    {p.name}
                  </h3>

                  <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                    {p.desc}
                  </p>

                  {/* Key Highlights */}
                  <div className="mt-4 pt-3 border-t border-slate-850/80 space-y-1.5">
                    {p.features.map((f, i) => (
                      <div key={i} className="flex items-center gap-1.5 text-[11px] font-mono text-slate-400">
                        <span className="w-1.5 h-1.5 rounded-full bg-teal-400/80"></span>
                        <span>{f}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <Link
                  to={p.link}
                  className="mt-6 flex items-center justify-between px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-teal-500/30 text-xs font-bold font-mono text-slate-200 hover:text-white transition-all group/btn"
                >
                  <span>Launch {p.name}</span>
                  <ChevronRight className="w-4 h-4 text-slate-500 group-hover/btn:translate-x-0.5 group-hover/btn:text-teal-400 transition-all" />
                </Link>
              </div>
            );
          })}

          {/* Quick Demo Shortcut Card */}
          <div className="glass-panel rounded-2xl p-6 border border-teal-500/20 bg-gradient-to-b from-teal-500/5 to-transparent relative overflow-hidden flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-400">
                  <Zap className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2.5 py-1 rounded-md bg-teal-500/10 border border-teal-500/30 text-teal-300">
                  Instant Demo
                </span>
              </div>

              <h3 className="text-lg font-bold text-slate-100">
                1-Click Quick Access
              </h3>

              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Experience all roles with pre-seeded demo accounts on the unified login gateway with pre-loaded profiles.
              </p>

              <div className="mt-4 p-3 rounded-xl bg-slate-950/80 border border-slate-850 text-[11px] font-mono space-y-1 text-slate-400">
                <div className="text-teal-300 font-bold">Supported Demo Profiles:</div>
                <div>• Officer: Pune District Health Authority</div>
                <div>• Doctor: Dr. Rajesh Sharma (Emergency)</div>
                <div>• ASHA: Sunita Devi (Haveli Village)</div>
                <div>• Citizen: Rahul Verma (ABHA Connected)</div>
              </div>
            </div>

            <Link
              to="/login"
              className="mt-6 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 text-slate-950 hover:from-teal-400 hover:to-emerald-400 text-xs font-bold font-mono uppercase tracking-wider transition-all"
            >
              <span>Go to Login Gateway</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── Key Metrics & Standards Banner ─────────────────────────────── */}
      <section className="bg-slate-950/80 border-y border-slate-900 py-12 px-6 mt-8">
        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center font-mono">
          <div>
            <p className="text-3xl md:text-4xl font-extrabold text-teal-400">100%</p>
            <p className="text-[10px] text-slate-400 uppercase tracking-wider mt-1">Offline-Ready Health Tools</p>
          </div>
          <div>
            <p className="text-3xl md:text-4xl font-extrabold text-indigo-400">&lt; 150ms</p>
            <p className="text-[10px] text-slate-400 uppercase tracking-wider mt-1">Socket.IO Alert Dispatch</p>
          </div>
          <div>
            <p className="text-3xl md:text-4xl font-extrabold text-rose-400">17-Pass</p>
            <p className="text-[10px] text-slate-400 uppercase tracking-wider mt-1">Tesseract OCR Pipeline</p>
          </div>
          <div>
            <p className="text-3xl md:text-4xl font-extrabold text-amber-400">4 Dialects</p>
            <p className="text-[10px] text-slate-400 uppercase tracking-wider mt-1">Instant Speech &amp; Translation</p>
          </div>
        </div>
      </section>

    </div>
  );
}
