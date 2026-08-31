import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Bot, ShieldAlert, HeartPulse, Stethoscope, 
  Map, Sparkles, Activity, Lock, 
  Users, WifiOff, Globe, PhoneCall, ScanLine, 
  ChevronRight, ArrowRight, ShieldCheck, Zap, Radio, FileText, CheckCircle2,
  Award, Heart, ExternalLink, HelpCircle, UserCheck, LogIn, Cpu
} from 'lucide-react';

export default function LandingPage() {
  const portals = [
    {
      role: 'ROLE_CITIZEN',
      name: 'Citizen Health Portal',
      badge: 'Public Healthcare',
      color: 'rose',
      icon: HeartPulse,
      desc: 'AI health assistant, 17-pass prescription scanner, emergency health card, symptom assessment, and ABHA interoperability.',
      features: ['Multilingual AI Assistant', 'Offline First-Aid & SOS', 'Prescription OCR Scanner', 'ABHA Health Card Exchange'],
      link: '/login?role=ROLE_CITIZEN',
      bgGlow: 'bg-rose-500/10 border-rose-500/25 text-rose-400',
    },
    {
      role: 'ROLE_WORKER',
      name: 'ASHA Field Worker Portal',
      badge: 'Community Outreach',
      color: 'amber',
      icon: Users,
      desc: 'Offline field screening for BP, SpO₂, glucose, and weight, automated triage evaluation, household registry, and auto-sync when online.',
      features: ['Offline Vitals Screening', 'Clinical Referral Engine', 'IndexedDB Queue & Sync', 'High-Risk Follow-ups'],
      link: '/login?role=ROLE_WORKER',
      bgGlow: 'bg-amber-500/10 border-amber-500/25 text-amber-400',
    },
    {
      role: 'ROLE_DOCTOR',
      name: 'Doctor Clinical Command',
      badge: 'Emergency Clinical',
      color: 'teal',
      icon: Stethoscope,
      desc: 'Real-time Socket.IO emergency consultation requests, live citizen chat, consent-gated medical history, and ASHA screening oversight.',
      features: ['Socket.IO Live Alert Queue', 'Citizen ↔ Doctor Live Chat', 'Consent Management', 'ASHA History Visibility'],
      link: '/login?role=ROLE_DOCTOR',
      bgGlow: 'bg-teal-500/10 border-teal-500/25 text-teal-400',
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
      bgGlow: 'bg-indigo-500/10 border-indigo-500/25 text-indigo-400',
    },
    {
      role: 'ROLE_ADMIN',
      name: 'System Infrastructure',
      badge: 'Platform Root',
      color: 'cyan',
      icon: Lock,
      desc: 'Platform health monitoring, database latency ping, user RBAC management, audit log inspection, and system configuration.',
      features: ['PostgreSQL Health & Latency', 'Audit Trail Logs', 'RBAC User Management', 'Socket.IO Server Nodes'],
      link: '/login?role=ROLE_ADMIN',
      bgGlow: 'bg-cyan-500/10 border-cyan-500/25 text-cyan-400',
    },
  ];

  const services = [
    {
      id: 'ai-assistant',
      title: 'AI Health Assistant',
      desc: 'Symptom triage, lab report interpretation, and personalized health guidance grounded in ICMR protocols.',
      icon: Bot,
      color: 'text-rose-400 border-rose-500/20 bg-rose-500/10',
    },
    {
      id: 'emergency-sos',
      title: 'Emergency Response Network',
      desc: 'Instant GPS-enabled emergency session creation with automated hospital and pharmacy alerts.',
      icon: ShieldAlert,
      color: 'text-amber-400 border-amber-500/20 bg-amber-500/10',
    },
    {
      id: 'offline-healthcare',
      title: 'Offline-First Healthcare',
      desc: 'Access emergency health cards, first-aid guides, and village vitals screening without internet connectivity.',
      icon: WifiOff,
      color: 'text-teal-400 border-teal-500/20 bg-teal-500/10',
    },
    {
      id: 'voice-multilingual',
      title: 'Regional Voice & Language',
      desc: 'Speech-to-speech interaction and translation across English, Hindi, Tamil, and Marathi.',
      icon: Globe,
      color: 'text-indigo-400 border-indigo-500/20 bg-indigo-500/10',
    },
    {
      id: 'medicine-scanner',
      title: 'Medicine Strip Scanner',
      desc: 'AI-powered OCR scanner reads prescription strips, checks dosage, and flags drug interactions.',
      icon: ScanLine,
      color: 'text-cyan-400 border-cyan-500/20 bg-cyan-500/10',
    },
    {
      id: 'govt-schemes',
      title: 'Government Health Schemes',
      desc: 'Personalized eligibility search and guidance for Ayushman Bharat (AB-PMJAY) and state welfare programs.',
      icon: Award,
      color: 'text-emerald-400 border-emerald-500/20 bg-emerald-500/10',
    },
    {
      id: 'telemedicine',
      title: 'Telemedicine & eSanjeevani Handoff',
      desc: 'Direct handoff to India\'s official National Telemedicine Service (MoHFW) for remote doctor consultation.',
      icon: ExternalLink,
      color: 'text-rose-300 border-rose-400/20 bg-rose-400/10',
    },
  ];

  return (
    <div className="flex-1 flex flex-col bg-[#030712] text-slate-100 overflow-hidden relative selection:bg-rose-500 selection:text-white">
      
      {/* Subtle Ambient Background Gradients */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[600px] bg-gradient-to-b from-rose-500/10 via-amber-500/5 to-transparent rounded-full blur-3xl -z-10 pointer-events-none"></div>
      <div className="absolute top-[800px] -left-32 w-[500px] h-[500px] bg-teal-500/5 rounded-full blur-3xl -z-10 pointer-events-none"></div>

      {/* ── 1. Hero Section ──────────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 md:px-8 pt-12 pb-16 text-center flex flex-col items-center">
        {/* National Initiative Badge */}
        <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-slate-900/90 border border-slate-800 text-xs font-mono text-teal-300 mb-8 shadow-lg backdrop-blur-md">
          <span className="w-2.5 h-2.5 rounded-full bg-teal-400 animate-pulse"></span>
          <span className="font-bold tracking-wide">NATIONAL DIGITAL HEALTHCARE INITIATIVE</span>
        </div>

        {/* Strong Public Healthcare Headline */}
        <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black tracking-tight max-w-5xl leading-[1.12]">
          Healthcare that reaches you,{' '}
          <span className="bg-gradient-to-r from-rose-400 via-amber-300 to-teal-300 bg-clip-text text-transparent block sm:inline">
            even when the Internet doesn't.
          </span>
        </h1>

        {/* Supporting Narrative */}
        <p className="mt-6 text-base sm:text-lg md:text-xl text-slate-300 max-w-3xl leading-relaxed font-normal">
          <strong className="text-slate-100 font-semibold">ArogyaMitra</strong> connects citizens, community health workers, doctors, and public-health teams through accessible, multilingual, and offline-first digital healthcare.
        </p>

        {/* Primary Action CTAs */}
        <div className="mt-10 flex flex-wrap justify-center gap-4 items-center">
          <Link
            to="/login"
            className="flex items-center gap-2 px-8 py-4 rounded-xl font-bold text-sm bg-rose-500 hover:bg-rose-600 text-white shadow-xl shadow-rose-500/25 transition-all transform hover:-translate-y-0.5 cursor-pointer font-mono uppercase tracking-wider"
          >
            <UserCheck className="w-4 h-4" />
            <span>Sign Up</span>
          </Link>
          <Link
            to="/login"
            className="flex items-center gap-2 px-7 py-4 rounded-xl font-bold text-sm bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-100 hover:text-white transition-all cursor-pointer font-mono"
          >
            <LogIn className="w-4 h-4 text-slate-400" />
            <span>Sign In</span>
          </Link>
          <Link
            to="/citizen/offline-health"
            className="flex items-center gap-2 px-6 py-4 rounded-xl font-bold text-sm bg-rose-950/60 border border-rose-800/80 text-rose-300 hover:bg-rose-900/50 transition-all cursor-pointer font-mono"
          >
            <ShieldAlert className="w-4 h-4 text-rose-400" />
            <span>Emergency SOS</span>
          </Link>
        </div>

        {/* Core Accessibility Pillars */}
        <div className="mt-14 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono text-slate-400 max-w-4xl w-full">
          <div className="flex items-center justify-center gap-2 p-3 rounded-xl bg-slate-950/80 border border-slate-900 shadow-sm">
            <WifiOff className="w-4 h-4 text-teal-400 shrink-0" />
            <span>100% Offline Mode</span>
          </div>
          <div className="flex items-center justify-center gap-2 p-3 rounded-xl bg-slate-950/80 border border-slate-900 shadow-sm">
            <Globe className="w-4 h-4 text-indigo-400 shrink-0" />
            <span>4 Dialects Voice</span>
          </div>
          <div className="flex items-center justify-center gap-2 p-3 rounded-xl bg-slate-950/80 border border-slate-900 shadow-sm">
            <Award className="w-4 h-4 text-amber-400 shrink-0" />
            <span>ABHA Connected</span>
          </div>
          <div className="flex items-center justify-center gap-2 p-3 rounded-xl bg-slate-950/80 border border-slate-900 shadow-sm">
            <Bot className="w-4 h-4 text-rose-400 shrink-0" />
            <span>24/7 AI Triage</span>
          </div>
        </div>
      </section>

      {/* ── 2. Healthcare Services Section ──────────────────────────────── */}
      <section id="services" className="max-w-7xl mx-auto px-4 md:px-8 py-16 w-full border-t border-slate-900">
        <div className="text-center mb-12">
          <span className="text-xs font-mono font-bold text-rose-400 uppercase tracking-widest block mb-2">PUBLIC HEALTHCARE CAPABILITIES</span>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-slate-100">
            Comprehensive Digital Health Services
          </h2>
          <p className="text-sm text-slate-400 mt-2 max-w-2xl mx-auto font-sans">
            Designed for seamless accessibility across urban cities, remote villages, and offline community health posts.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((s) => {
            const Icon = s.icon;
            return (
              <div 
                key={s.id}
                className="p-6 rounded-2xl bg-slate-950/60 border border-slate-900 hover:border-slate-800 transition-all flex flex-col justify-between group"
              >
                <div>
                  <div className={`w-12 h-12 rounded-xl border flex items-center justify-center mb-5 ${s.color}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-100 group-hover:text-rose-300 transition-colors">
                    {s.title}
                  </h3>
                  <p className="text-xs text-slate-400 mt-2.5 leading-relaxed font-sans">
                    {s.desc}
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-slate-900/80 flex items-center justify-between text-xs font-mono text-slate-500">
                  <span>Accessible Online &amp; Offline</span>
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform text-rose-400" />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── 3. How ArogyaMitra Works Section ────────────────────────────── */}
      <section id="how-it-works" className="bg-slate-950/80 border-y border-slate-900 py-16 px-4 md:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <span className="text-xs font-mono font-bold text-teal-400 uppercase tracking-widest block mb-2">SIMPLE CITIZEN JOURNEY</span>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-slate-100">
              How ArogyaMitra Works
            </h2>
            <p className="text-sm text-slate-400 mt-2 max-w-2xl mx-auto">
              From initial voice query to clinical triage and emergency doctor escalation.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 relative">
            {[
              { step: '01', title: 'Describe Symptoms', desc: 'Speak or type in your native language (English, Hindi, Tamil, Marathi).' },
              { step: '02', title: 'AI Triage Evaluation', desc: 'AI cross-references symptom patterns against grounded ICMR protocols.' },
              { step: '03', title: 'Context Check', desc: 'Safely incorporates your ABHA allergies and health history.' },
              { step: '04', title: 'Clear Guidance', desc: 'Receive simple, understandable action steps, dosage warnings, or first-aid.' },
              { step: '05', title: 'Care Escalation', desc: 'Direct handoff to ASHA field workers, emergency network, or eSanjeevani.' },
            ].map((st, i) => (
              <div key={st.step} className="p-5 rounded-2xl bg-slate-900/50 border border-slate-850 relative flex flex-col justify-between">
                <div>
                  <span className="text-2xl font-black font-mono text-teal-400/80 block mb-2">{st.step}</span>
                  <h3 className="text-sm font-bold text-slate-100 mb-2">{st.title}</h3>
                  <p className="text-xs text-slate-400 leading-relaxed font-sans">{st.desc}</p>
                </div>
                {i < 4 && (
                  <div className="hidden md:block absolute -right-3 top-1/2 -translate-y-1/2 z-10">
                    <ChevronRight className="w-5 h-5 text-slate-700" />
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Medical Responsibility Disclaimer */}
          <div className="mt-10 p-4 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-slate-400 leading-relaxed flex items-start gap-3">
            <HelpCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-slate-200 block mb-0.5">Medical Responsibility Disclaimer</strong>
              ArogyaMitra provides AI-assisted healthcare information and triage guidance grounded in clinical protocols. It supports and assists, but does NOT replace licensed medical professionals, doctors, or emergency response services.
            </div>
          </div>
        </div>
      </section>

      {/* ── 4. Built for India Section ───────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 md:px-8 py-16 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-6 space-y-6">
            <span className="text-xs font-mono font-bold text-amber-400 uppercase tracking-widest block">TAILORED FOR RURAL &amp; URBAN NEEDS</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-100 leading-tight">
              Built specifically for India's healthcare reality.
            </h2>
            <p className="text-slate-300 text-sm leading-relaxed font-sans">
              Traditional healthcare software fails when network signals drop or when patients cannot speak English. ArogyaMitra is architected from the ground up for low-connectivity environments, regional language diversity, and community-level care delivery.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono pt-2">
              <div className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-950 border border-slate-900">
                <CheckCircle2 className="w-4 h-4 text-teal-400" />
                <span>Multilingual Speech &amp; Voice</span>
              </div>
              <div className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-950 border border-slate-900">
                <CheckCircle2 className="w-4 h-4 text-teal-400" />
                <span>Offline-First PWA Caching</span>
              </div>
              <div className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-950 border border-slate-900">
                <CheckCircle2 className="w-4 h-4 text-teal-400" />
                <span>ASHA Field Screening Sync</span>
              </div>
              <div className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-950 border border-slate-900">
                <CheckCircle2 className="w-4 h-4 text-teal-400" />
                <span>17-Pass Medicine Strip OCR</span>
              </div>
            </div>
          </div>

          <div className="lg:col-span-6 p-8 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-950 to-slate-950 border border-slate-800 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/10 rounded-full blur-2xl"></div>
            <div className="space-y-6 relative z-10">
              <div className="flex items-center gap-3">
                <Heart className="w-8 h-8 text-rose-500 animate-pulse" />
                <div>
                  <h3 className="font-bold text-lg text-slate-100">National Healthcare Outreach</h3>
                  <p className="text-xs text-slate-400 font-mono">Empowering 1.4 Billion Citizens</p>
                </div>
              </div>
              <p className="text-xs text-slate-350 leading-relaxed font-sans">
                By bridging village ASHA workers directly with district medical officers and certified government doctors via telemedicine, ArogyaMitra reduces diagnostic delays and ensures early disease detection.
              </p>
              <div className="grid grid-cols-3 gap-2 text-center font-mono border-t border-slate-850 pt-4">
                <div>
                  <span className="text-xl font-bold text-rose-400">4</span>
                  <span className="block text-[10px] text-slate-500 uppercase mt-0.5">Languages</span>
                </div>
                <div>
                  <span className="text-xl font-bold text-teal-400">100%</span>
                  <span className="block text-[10px] text-slate-500 uppercase mt-0.5">Offline SOS</span>
                </div>
                <div>
                  <span className="text-xl font-bold text-amber-400">5</span>
                  <span className="block text-[10px] text-slate-500 uppercase mt-0.5">Role Portals</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 5. Healthcare Ecosystem Section ─────────────────────────────── */}
      <section className="bg-slate-950/60 border-y border-slate-900 py-16 px-4 md:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <span className="text-xs font-mono font-bold text-indigo-400 uppercase tracking-widest block mb-2">COLLABORATIVE NETWORK</span>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-slate-100">
              The ArogyaMitra Ecosystem
            </h2>
            <p className="text-sm text-slate-400 mt-2 max-w-2xl mx-auto">
              How different participants in the healthcare system connect seamlessly.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { title: 'Citizens', icon: HeartPulse, color: 'text-rose-400', desc: 'Receive AI assistance, store health records offline, scan medicines, and trigger emergency alerts.' },
              { title: 'ASHA Workers', icon: Users, color: 'text-amber-400', desc: 'Conduct village field screenings, record vitals offline, and sync high-risk cases automatically.' },
              { title: 'Doctors', icon: Stethoscope, color: 'text-teal-400', desc: 'Receive real-time Socket.IO emergency consultation requests, review screening logs, and chat live.' },
              { title: 'Health Officers', icon: Map, color: 'text-indigo-400', desc: 'Monitor district-level ASHA outreach, view disease heatmaps, and run outbreak simulation models.' },
            ].map((eco) => {
              const Icon = eco.icon;
              return (
                <div key={eco.title} className="p-6 rounded-2xl bg-slate-900/60 border border-slate-850 hover:border-slate-750 transition-all text-center">
                  <div className="w-12 h-12 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center mx-auto mb-4 shadow-inner">
                    <Icon className={`w-6 h-6 ${eco.color}`} />
                  </div>
                  <h3 className="font-bold text-base text-slate-100 mb-2">{eco.title}</h3>
                  <p className="text-xs text-slate-400 leading-relaxed font-sans">{eco.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── 6. Telemedicine / eSanjeevani Access Section ────────────────── */}
      <section className="max-w-7xl mx-auto px-4 md:px-8 py-16 w-full">
        <div className="p-8 sm:p-10 rounded-3xl bg-gradient-to-r from-teal-950/40 via-slate-900 to-indigo-950/40 border border-teal-500/30 flex flex-col lg:flex-row items-center justify-between gap-8 shadow-2xl">
          <div className="space-y-4 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/10 border border-teal-500/20 text-xs font-mono text-teal-300">
              <ExternalLink className="w-3.5 h-3.5" />
              <span>OFFICIAL GOVERNMENT TELEMEDICINE PATHWAY</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-100">
              Need a remote doctor consultation?
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-sans">
              Access the official Government of India <strong className="text-teal-300">eSanjeevani Telemedicine Service</strong> (Ministry of Health &amp; Family Welfare). Consult certified government doctors online free of cost.
            </p>
          </div>

          <div className="shrink-0 w-full sm:w-auto">
            <Link
              to="/citizen/book-appointment"
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-teal-400 hover:bg-teal-300 text-slate-950 font-bold font-mono text-sm uppercase tracking-wider shadow-lg shadow-teal-500/20 transition-all cursor-pointer"
            >
              <span>Access eSanjeevani Portal</span>
              <ExternalLink className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── 7. Trust & Responsible AI Section ───────────────────────────── */}
      <section className="bg-slate-950 border-t border-slate-900 py-16 px-4 md:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <span className="text-xs font-mono font-bold text-rose-400 uppercase tracking-widest block mb-2">SECURITY &amp; PRIVACY</span>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-slate-100">
              Trust &amp; Responsible AI
            </h2>
            <p className="text-sm text-slate-400 mt-2 max-w-2xl mx-auto">
              Built around sovereign data protection and rigorous clinical grounding.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-850">
              <Cpu className="w-6 h-6 text-teal-400 mb-3" />
              <h3 className="font-bold text-base text-slate-100 mb-2">Responsible AI Grounding</h3>
              <p className="text-xs text-slate-400 leading-relaxed font-sans">
                Our AI pipelines reference localized ICMR clinical guidelines and sovereign health catalogs before rendering recommendations, minimizing hallucinations.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-850">
              <Lock className="w-6 h-6 text-indigo-400 mb-3" />
              <h3 className="font-bold text-base text-slate-100 mb-2">Consent-Aware Privacy</h3>
              <p className="text-xs text-slate-400 leading-relaxed font-sans">
                Citizens retain explicit control over health history sharing. Emergency doctor access requires active time-bound authorization.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-850">
              <ShieldCheck className="w-6 h-6 text-rose-400 mb-3" />
              <h3 className="font-bold text-base text-slate-100 mb-2">Offline Resilience</h3>
              <p className="text-xs text-slate-400 leading-relaxed font-sans">
                Critical emergency cards, first-aid instructions, and ASHA field queues remain 100% accessible even during total network blackouts.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── 8. Healthcare & Administration Portals (Role Gateways) ───────── */}
      <section className="max-w-7xl mx-auto px-4 md:px-8 py-16 w-full border-t border-slate-900">
        <div className="text-center mb-10">
          <span className="text-xs font-mono font-bold text-amber-400 uppercase tracking-widest block mb-2">SYSTEM COMMAND CENTER</span>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-100">
            Healthcare &amp; Administration Portals
          </h2>
          <p className="text-xs text-slate-400 mt-1 font-mono">
            Select a role-based gateway to access specialized clinical or operational dashboards
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

                  <h3 className="text-lg font-bold text-slate-100 group-hover:text-rose-300 transition-colors">
                    {p.name}
                  </h3>

                  <p className="text-xs text-slate-400 mt-2 leading-relaxed font-sans">
                    {p.desc}
                  </p>

                  <div className="mt-4 pt-3 border-t border-slate-850/80 space-y-1.5 font-mono text-[11px] text-slate-400">
                    {p.features.map((f, i) => (
                      <div key={i} className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-400/80"></span>
                        <span>{f}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <Link
                  to={p.link}
                  className="mt-6 flex items-center justify-between px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-rose-500/30 text-xs font-bold font-mono text-slate-200 hover:text-white transition-all group/btn"
                >
                  <span>Launch {p.name}</span>
                  <ChevronRight className="w-4 h-4 text-slate-500 group-hover/btn:translate-x-0.5 group-hover/btn:text-rose-400 transition-all" />
                </Link>
              </div>
            );
          })}

          {/* Quick Demo Card */}
          <div className="glass-panel rounded-2xl p-6 border border-teal-500/20 bg-gradient-to-b from-teal-500/5 to-transparent relative overflow-hidden flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-400">
                  <Zap className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2.5 py-1 rounded-md bg-teal-500/10 border border-teal-500/30 text-teal-300">
                  Unified Gateway
                </span>
              </div>

              <h3 className="text-lg font-bold text-slate-100">
                1-Click Role Access
              </h3>

              <p className="text-xs text-slate-400 mt-2 leading-relaxed font-sans">
                Experience all roles with pre-seeded demo accounts on the unified login gateway with pre-loaded profiles.
              </p>

              <div className="mt-4 p-3 rounded-xl bg-slate-950/80 border border-slate-850 text-[11px] font-mono space-y-1 text-slate-400">
                <div className="text-teal-300 font-bold">Pre-Configured Demo Credentials:</div>
                <div>• Citizen: Rahul Verma</div>
                <div>• ASHA: Sunita Devi</div>
                <div>• Doctor: Dr. Rajesh Sharma</div>
                <div>• Officer: Pune Health Officer</div>
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

      {/* ── 9. Final Call To Action Section ─────────────────────────────── */}
      <section className="bg-gradient-to-b from-slate-950 to-[#030712] border-t border-slate-900 py-16 px-4 md:px-8 text-center">
        <div className="max-w-4xl mx-auto space-y-6">
          <HeartPulse className="w-12 h-12 text-rose-500 mx-auto animate-bounce" />
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-100 tracking-tight">
            Ready to experience next-generation public healthcare?
          </h2>
          <p className="text-slate-300 text-sm max-w-2xl mx-auto font-sans leading-relaxed">
            Join citizens, ASHA workers, and medical officers across India in building a safer, more resilient digital health future.
          </p>
          <div className="pt-4 flex flex-wrap justify-center gap-4">
            <Link
              to="/login"
              className="px-8 py-4 rounded-xl font-bold font-mono text-sm bg-rose-500 hover:bg-rose-600 text-white shadow-xl shadow-rose-500/25 transition-all uppercase tracking-wider"
            >
              Sign Up for Free
            </Link>
            <Link
              to="/about"
              className="px-8 py-4 rounded-xl font-bold font-mono text-sm bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-200 transition-all"
            >
              Learn About ArogyaMitra
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}
