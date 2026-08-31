import React from 'react';
import { Link } from 'react-router-dom';
import { 
  ShieldCheck, Cpu, HardDrive, HelpCircle, HeartPulse, 
  Target, Eye, Users, WifiOff, Globe, Lock, ArrowRight,
  Stethoscope, Map, CheckCircle2, Award, Zap
} from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="flex-1 bg-[#030712] text-slate-100 font-sans selection:bg-rose-500 selection:text-white">
      
      {/* ── 1. Hero / Header ────────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 md:px-8 pt-12 pb-14 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-xs font-mono text-rose-400 mb-6 font-semibold">
          <HeartPulse className="w-4 h-4" />
          <span>ABOUT AROGYAMITRA</span>
        </div>
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight bg-gradient-to-r from-rose-400 via-amber-300 to-teal-300 bg-clip-text text-transparent max-w-4xl mx-auto leading-tight">
          Universal, Equitable &amp; Intelligent Healthcare for India
        </h1>
        <p className="text-sm sm:text-base text-slate-300 mt-4 max-w-2xl mx-auto font-sans leading-relaxed">
          ArogyaMitra is an open, multilingual, offline-first digital health platform bridging the gap between rural citizens, community health workers, doctors, and public health authorities.
        </p>
      </section>

      {/* ── 2. The Healthcare Access Challenge ──────────────────────────── */}
      <section className="bg-slate-950/80 border-y border-slate-900 py-14 px-4 md:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-10">
            <span className="text-xs font-mono font-bold text-amber-400 uppercase tracking-widest block mb-2">THE PROBLEM WE SOLVE</span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-100">
              The Healthcare Access Challenge in India
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-850 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
                <WifiOff className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base text-slate-100">Connectivity Blackouts</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Rural PHCs and ASHA field workers frequently lose cellular connectivity, rendering conventional web-only health portals unusable when emergency guidance is needed most.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-850 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center font-bold">
                <Globe className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base text-slate-100">Linguistic Disparity</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Over 70% of India's population communicates primarily in regional languages. Monolingual English healthcare tools create friction for non-English speaking citizens.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-850 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-400 flex items-center justify-center font-bold">
                <Stethoscope className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base text-slate-100">Doctor Shortages</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                With a low doctor-to-patient ratio in remote districts, early screening and intelligent clinical triage are essential to prevent unnecessary hospital crowding.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── 3 & 4. Vision & Mission ─────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 md:px-8 py-16 w-full">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="p-8 rounded-3xl bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 shadow-xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center">
              <Eye className="w-6 h-6" />
            </div>
            <h3 className="text-2xl font-extrabold text-slate-100">Our Vision</h3>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              A nation where every citizen—regardless of geography, literacy level, or internet availability—has instant access to personalized, AI-assisted health guidance and emergency medical response.
            </p>
          </div>

          <div className="p-8 rounded-3xl bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 shadow-xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-teal-500/10 border border-teal-500/20 text-teal-400 flex items-center justify-center">
              <Target className="w-6 h-6" />
            </div>
            <h3 className="text-2xl font-extrabold text-slate-100">Our Mission</h3>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              To empower healthcare stakeholders with ground-breaking offline-first technology, regional NLP voice engines, and grounded AI models that respect patient privacy and clinical guidelines.
            </p>
          </div>
        </div>
      </section>

      {/* ── 5 & 6. Who We Serve & What We Provide ───────────────────────── */}
      <section className="bg-slate-950 border-y border-slate-900 py-16 px-4 md:px-8">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="text-center">
            <span className="text-xs font-mono font-bold text-teal-400 uppercase tracking-widest block mb-2">TARGET STAKEHOLDERS</span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-100">
              Who We Serve &amp; What We Provide
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-850 space-y-3">
              <h4 className="font-bold text-base text-rose-400">Citizens</h4>
              <ul className="space-y-2 text-xs text-slate-400">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-teal-400 shrink-0" /> AI Symptom Triage</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-teal-400 shrink-0" /> Prescription OCR Scanner</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-teal-400 shrink-0" /> Offline Health Card</li>
              </ul>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-850 space-y-3">
              <h4 className="font-bold text-base text-amber-400">ASHA Field Workers</h4>
              <ul className="space-y-2 text-xs text-slate-400">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-teal-400 shrink-0" /> Offline Vitals Screening</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-teal-400 shrink-0" /> Auto-Sync Queue</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-teal-400 shrink-0" /> High-Risk Flags</li>
              </ul>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-850 space-y-3">
              <h4 className="font-bold text-base text-teal-400">Clinicians &amp; Doctors</h4>
              <ul className="space-y-2 text-xs text-slate-400">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-teal-400 shrink-0" /> Real-time ER Alerts</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-teal-400 shrink-0" /> Live Citizen Chat</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-teal-400 shrink-0" /> ABHA History Access</li>
              </ul>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-850 space-y-3">
              <h4 className="font-bold text-base text-indigo-400">Public Health Officers</h4>
              <ul className="space-y-2 text-xs text-slate-400">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-teal-400 shrink-0" /> Outbreak Heatmaps</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-teal-400 shrink-0" /> ASHA Monitoring</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-teal-400 shrink-0" /> Epidemic Simulator</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ── 7 & 8. Ecosystem & Technology Behind ArogyaMitra ────────────── */}
      <section className="max-w-7xl mx-auto px-4 md:px-8 py-16 w-full space-y-12">
        <div className="text-center">
          <span className="text-xs font-mono font-bold text-rose-400 uppercase tracking-widest block mb-2">TECHNICAL ARCHITECTURE SPECIFICATION</span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-100">
            Technology Behind ArogyaMitra
          </h2>
          <p className="text-xs text-slate-400 mt-2 font-mono">
            SOVEREIGN TECHNICAL INTEGRATION &amp; PLATFORM SPECIFICATION
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-6 rounded-2xl bg-slate-950 border border-slate-900 space-y-3">
            <div className="flex items-center gap-3">
              <Cpu className="w-5 h-5 text-teal-400" />
              <h4 className="font-bold text-base text-slate-200">Grounded Clinical AI Engine</h4>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Consumes sovereign-hosted clinical guidelines and localized ICMR publications. The AI agent retrieves validated references from our indexed vector database before rendering symptom triage actions.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-950 border border-slate-900 space-y-3">
            <div className="flex items-center gap-3">
              <ShieldCheck className="w-5 h-5 text-rose-400" />
              <h4 className="font-bold text-base text-slate-200">ABHA &amp; NDHM Interoperability</h4>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Integrates with India's Ayushman Bharat Health Account (ABHA). Data transfers are encrypted end-to-end using strict JWT token exchanges, complying with DPDP regulations.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-950 border border-slate-900 space-y-3">
            <div className="flex items-center gap-3">
              <HardDrive className="w-5 h-5 text-indigo-400" />
              <h4 className="font-bold text-base text-slate-200">17-Pass OCR Medicine Scanner</h4>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Processes low-light image captures of pharmaceutical strips using adaptive thresholding and contrast optimization, matching extracted text against Indian Pharmacopoeia catalogs.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-950 border border-slate-900 space-y-3">
            <div className="flex items-center gap-3">
              <WifiOff className="w-5 h-5 text-amber-400" />
              <h4 className="font-bold text-base text-slate-200">Offline-First IndexedDB Engine</h4>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Stores emergency cards, local PHC directories, and screening queues locally in browser IndexedDB storage, auto-synchronizing background updates when network connection returns.
            </p>
          </div>
        </div>
      </section>

      {/* ── 9 & 10. Responsible AI, Privacy & Security ─────────────────── */}
      <section className="bg-slate-950 border-t border-slate-900 py-16 px-4 md:px-8">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="text-center">
            <span className="text-xs font-mono font-bold text-indigo-400 uppercase tracking-widest block mb-2">CLINICAL SAFETY &amp; PRIVACY</span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-100">
              Responsible AI &amp; Data Governance
            </h2>
          </div>

          <div className="p-8 rounded-3xl bg-slate-900/40 border border-slate-850 space-y-6">
            <div className="flex items-start gap-4">
              <HelpCircle className="w-6 h-6 text-amber-400 shrink-0 mt-1" />
              <div className="space-y-2">
                <h4 className="font-bold text-slate-200 text-sm">Human-in-the-Loop Validation</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  All diagnostic pathways, simulated models, and digital twin forecasts shown inside the platform are designed to assist public health authorities and medical professionals. Final clinical decisions remain under the authority of licensed medical officers.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-slate-800 pt-6 text-center font-mono">
              <div>
                <span className="text-xl font-bold text-teal-400">256-bit</span>
                <span className="block text-[10px] text-slate-500 uppercase mt-0.5">Payload Encryption</span>
              </div>
              <div>
                <span className="text-xl font-bold text-indigo-400">DPDP</span>
                <span className="block text-[10px] text-slate-500 uppercase mt-0.5">Privacy Compliant</span>
              </div>
              <div>
                <span className="text-xl font-bold text-rose-400">Zero</span>
                <span className="block text-[10px] text-slate-500 uppercase mt-0.5">Unauthorized Sharing</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 11 & 12. Approach & Get Started Call to Action ──────────────── */}
      <section className="max-w-7xl mx-auto px-4 md:px-8 py-16 text-center space-y-6">
        <h2 className="text-3xl font-extrabold text-slate-100">
          Experience ArogyaMitra Today
        </h2>
        <p className="text-xs sm:text-sm text-slate-300 max-w-xl mx-auto font-sans leading-relaxed">
          Access the unified healthcare gateway to explore AI assistant features, emergency response tools, or role-based clinical dashboards.
        </p>
        <div className="pt-2 flex flex-wrap justify-center gap-4">
          <Link
            to="/login"
            className="flex items-center gap-2 px-8 py-4 rounded-xl font-bold font-mono text-sm bg-rose-500 hover:bg-rose-600 text-white shadow-xl shadow-rose-500/25 transition-all uppercase tracking-wider"
          >
            <span>Launch Unified Portal</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            to="/"
            className="flex items-center gap-2 px-8 py-4 rounded-xl font-bold font-mono text-sm bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-200 transition-all"
          >
            <span>Return to Home</span>
          </Link>
        </div>
      </section>

    </div>
  );
}
