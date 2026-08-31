import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Bot, ShieldAlert, HeartPulse, Stethoscope, 
  Map, Activity, Lock, Users, WifiOff, Globe, 
  ScanLine, ChevronRight, ArrowRight, ShieldCheck, Zap, 
  CheckCircle2, Award, Heart, ExternalLink, HelpCircle, 
  UserCheck, LogIn, Cpu, PhoneCall, Sparkles, MessageSquare
} from 'lucide-react';
import { I18nService, t } from '../i18n';
import heroImage from '../assets/hero.png';

export default function LandingPage() {
  const [lang, setLang] = React.useState(I18nService.getLanguage());

  React.useEffect(() => {
    const unsub = I18nService.subscribe((newLang) => {
      setLang(newLang);
    });
    return unsub;
  }, []);
  const portals = [
    {
      role: 'ROLE_CITIZEN',
      name: 'Citizen Health Portal',
      badge: 'Public Care',
      icon: HeartPulse,
      desc: 'AI health assistant, prescription scanner, emergency health card, symptom triage, and ABHA interoperability.',
      features: ['Multilingual AI Assistant', 'Offline First-Aid & SOS', 'Prescription OCR Scanner', 'ABHA Health Card Exchange'],
      link: '/login?role=ROLE_CITIZEN',
      accentColor: 'text-teal-600 border-teal-200 bg-teal-50',
    },
    {
      role: 'ROLE_WORKER',
      name: 'ASHA Field Worker Portal',
      badge: 'Community Outreach',
      icon: Users,
      desc: 'Offline field screening for BP, SpO₂, glucose, household registry, and automated background sync when online.',
      features: ['Offline Vitals Screening', 'Clinical Referral Engine', 'IndexedDB Queue & Sync', 'High-Risk Follow-ups'],
      link: '/login?role=ROLE_WORKER',
      accentColor: 'text-cyan-600 border-cyan-200 bg-cyan-50',
    },
    {
      role: 'ROLE_DOCTOR',
      name: 'Doctor Clinical Command',
      badge: 'Clinical Emergency',
      icon: Stethoscope,
      desc: 'Real-time emergency consultation requests, live citizen chat, consent-gated medical history, and ASHA oversight.',
      features: ['Socket.IO Live Alert Queue', 'Citizen ↔ Doctor Live Chat', 'Consent Management', 'ASHA Screening History'],
      link: '/login?role=ROLE_DOCTOR',
      accentColor: 'text-blue-600 border-blue-200 bg-blue-50',
    },
    {
      role: 'ROLE_OFFICER',
      name: 'Public Health Officer',
      badge: 'Surveillance & Policy',
      icon: Map,
      desc: 'Live ASHA field monitoring, geospatial outbreak heatmaps, population digital twins, and automated IEC campaigns.',
      features: ['ASHA Live Surveillance', 'Outbreak Heatmaps', 'Scenario Simulator', 'Epidemiological Intelligence'],
      link: '/login?role=ROLE_OFFICER',
      accentColor: 'text-indigo-600 border-indigo-200 bg-indigo-50',
    },
    {
      role: 'ROLE_ADMIN',
      name: 'System Infrastructure',
      badge: 'Platform Root',
      icon: Lock,
      desc: 'Platform health monitoring, database latency checks, user RBAC management, audit log inspection, and server node status.',
      features: ['PostgreSQL Health & Latency', 'Audit Trail Logs', 'RBAC User Management', 'Socket.IO Server Nodes'],
      link: '/login?role=ROLE_ADMIN',
      accentColor: 'text-emerald-600 border-emerald-200 bg-emerald-50',
    },
  ];

  const services = [
    {
      id: 'ai-assistant',
      title: 'AI Health Assistant',
      desc: 'Symptom triage, lab report interpretation, and personalized health guidance grounded in ICMR clinical protocols.',
      icon: Bot,
      iconColor: 'text-teal-600 bg-teal-50 border-teal-200',
    },
    {
      id: 'emergency-sos',
      title: 'Emergency Response Network',
      desc: 'Instant GPS-enabled emergency session creation with automated hospital and pharmacy alerts.',
      icon: ShieldAlert,
      iconColor: 'text-rose-600 bg-rose-50 border-rose-200',
    },
    {
      id: 'offline-healthcare',
      title: 'Offline-First Healthcare',
      desc: 'Access emergency health cards, first-aid guides, and village vitals screening without internet connectivity.',
      icon: WifiOff,
      iconColor: 'text-cyan-600 bg-cyan-50 border-cyan-200',
    },
    {
      id: 'voice-multilingual',
      title: 'Regional Language & Voice',
      desc: 'Speech-to-speech interaction and translation across English, Hindi, Tamil, and Marathi.',
      icon: Globe,
      iconColor: 'text-blue-600 bg-blue-50 border-blue-200',
    },
    {
      id: 'medicine-scanner',
      title: 'Medicine Strip Scanner',
      desc: 'AI-powered OCR scanner reads prescription strips, checks dosage, and flags drug interactions.',
      icon: ScanLine,
      iconColor: 'text-indigo-600 bg-indigo-50 border-indigo-200',
    },
    {
      id: 'govt-schemes',
      title: 'Government Health Schemes',
      desc: 'Personalized eligibility search and guidance for Ayushman Bharat (AB-PMJAY) and state welfare programs.',
      icon: Award,
      iconColor: 'text-emerald-600 bg-emerald-50 border-emerald-200',
    },
    {
      id: 'telemedicine',
      title: 'Telemedicine Access',
      desc: 'Direct handoff to India\'s official National Telemedicine Service (eSanjeevani) for remote doctor consultation.',
      icon: ExternalLink,
      iconColor: 'text-teal-700 bg-teal-50 border-teal-200',
    },
  ];

  return (
    <div className="flex-1 bg-white text-slate-800 font-sans selection:bg-teal-500 selection:text-white">
      
      {/* ── 1. HERO SECTION (Two-Column Professional Layout) ──────────────── */}
      <section className="relative bg-gradient-to-b from-[#F5FAFC] via-[#EEF7FA]/60 to-white pt-10 pb-20 px-4 md:px-8 overflow-hidden">
        
        {/* Subtle Decorative Background Glow Circles */}
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-teal-200/30 rounded-full blur-3xl -z-10 pointer-events-none"></div>
        <div className="absolute top-40 left-0 w-[400px] h-[400px] bg-cyan-100/40 rounded-full blur-2xl -z-10 pointer-events-none"></div>

        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Column: Text & CTAs */}
          <div className="lg:col-span-6 space-y-6 text-left">
            
            {/* Small Eyebrow */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-teal-50 border border-teal-200/80 text-teal-700 text-xs font-bold font-sans tracking-wide">
              <Sparkles className="w-3.5 h-3.5 text-teal-600" />
              <span>{t('hero_eyebrow')}</span>
            </div>

            {/* Large Professional Headline */}
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.15]">
              {t('hero_title_1')}{' '}
              <span className="bg-gradient-to-r from-teal-600 via-cyan-600 to-blue-600 bg-clip-text text-transparent block sm:inline">
                {t('hero_title_2')}
              </span>
            </h1>

            {/* Supporting Message */}
            <p className="text-base sm:text-lg text-slate-600 leading-relaxed font-normal">
              {t('hero_desc')}
            </p>

            {/* Action Buttons */}
            <div className="pt-2 flex flex-wrap gap-4 items-center">
              <Link
                to="/signup"
                className="flex items-center gap-2 px-7 py-3.5 rounded-full font-bold text-sm bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-white shadow-lg shadow-teal-500/25 transition-all transform hover:-translate-y-0.5 cursor-pointer uppercase tracking-wider"
              >
                <UserCheck className="w-4 h-4" />
                <span>{t('btn_get_started')}</span>
              </Link>

              <Link
                to="/login"
                className="flex items-center gap-2 px-6 py-3.5 rounded-full font-bold text-sm bg-white hover:bg-slate-50 text-slate-700 hover:text-teal-700 border border-slate-200 shadow-sm transition-all cursor-pointer"
              >
                <LogIn className="w-4 h-4 text-slate-500" />
                <span>{t('btn_sign_in')}</span>
              </Link>

              <Link
                to="/citizen/offline-health"
                className="flex items-center gap-2 px-6 py-3.5 rounded-full font-bold text-sm bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition-all cursor-pointer"
              >
                <ShieldAlert className="w-4 h-4 text-rose-600" />
                <span>{t('btn_emergency_sos')}</span>
              </Link>
            </div>
          </div>

          {/* Right Column: Large Professional Healthcare Visual Container with Floating Feature Pills */}
          <div className="lg:col-span-6 relative flex justify-center items-center">
            
            {/* Main Rounded Image Container */}
            <div className="relative w-full max-w-lg aspect-square sm:aspect-[4/3] rounded-3xl overflow-hidden shadow-2xl border-4 border-white bg-gradient-to-br from-teal-100 to-cyan-50 group">
              <img 
                src={heroImage} 
                alt="ArogyaMitra Healthcare Consultation" 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/40 via-transparent to-transparent"></div>
            </div>

            {/* Floating Healthcare Feature Pills (Inspired by eSanjeevani & Apollo TeleHealth UI) */}
            
            {/* Pill 1: Top Left */}
            <div className="absolute -top-4 -left-2 sm:left-4 bg-white/95 backdrop-blur-md px-4 py-2.5 rounded-2xl shadow-xl border border-teal-100 flex items-center gap-2.5 text-xs font-bold text-slate-800 animate-bounce-slow">
              <span className="p-1.5 bg-teal-100 text-teal-700 rounded-xl">🩺</span>
              <span>AI Health Assistance</span>
            </div>

            {/* Pill 2: Top Right */}
            <div className="absolute top-8 -right-2 sm:right-2 bg-white/95 backdrop-blur-md px-4 py-2.5 rounded-2xl shadow-xl border border-cyan-100 flex items-center gap-2.5 text-xs font-bold text-slate-800">
              <span className="p-1.5 bg-cyan-100 text-cyan-700 rounded-xl">🌐</span>
              <span>Regional Languages</span>
            </div>

            {/* Pill 3: Bottom Left */}
            <div className="absolute bottom-10 -left-4 sm:left-0 bg-white/95 backdrop-blur-md px-4 py-2.5 rounded-2xl shadow-xl border border-blue-100 flex items-center gap-2.5 text-xs font-bold text-slate-800">
              <span className="p-1.5 bg-blue-100 text-blue-700 rounded-xl">📱</span>
              <span>Offline-First Care</span>
            </div>

            {/* Pill 4: Bottom Right */}
            <div className="absolute -bottom-4 -right-2 sm:right-6 bg-white/95 backdrop-blur-md px-4 py-2.5 rounded-2xl shadow-xl border border-rose-100 flex items-center gap-2.5 text-xs font-bold text-slate-800">
              <span className="p-1.5 bg-rose-100 text-rose-700 rounded-xl">🚑</span>
              <span>Emergency Support</span>
            </div>

          </div>

        </div>
      </section>

      {/* ── 2. TRUST / INTRODUCTION STRIP ──────────────────────────────────── */}
      <section className="bg-white border-y border-slate-100 py-10 px-4 md:px-8">
        <div className="max-w-7xl mx-auto text-center space-y-8">
          <p className="text-xs font-bold text-teal-700 uppercase tracking-widest">
            ACCESSIBLE HEALTHCARE. DESIGNED FOR INDIA.
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="p-5 rounded-2xl bg-[#F5FAFC] border border-teal-50/80 text-center space-y-2">
              <Bot className="w-6 h-6 text-teal-600 mx-auto" />
              <h4 className="font-bold text-sm text-slate-800">AI-Assisted Healthcare</h4>
              <p className="text-xs text-slate-500">Grounded symptom assessment &amp; guidance</p>
            </div>

            <div className="p-5 rounded-2xl bg-[#F5FAFC] border border-teal-50/80 text-center space-y-2">
              <WifiOff className="w-6 h-6 text-cyan-600 mx-auto" />
              <h4 className="font-bold text-sm text-slate-800">Offline-First Access</h4>
              <p className="text-xs text-slate-500">Works seamlessly during network blackouts</p>
            </div>

            <div className="p-5 rounded-2xl bg-[#F5FAFC] border border-teal-50/80 text-center space-y-2">
              <Globe className="w-6 h-6 text-blue-600 mx-auto" />
              <h4 className="font-bold text-sm text-slate-800">Multilingual Support</h4>
              <p className="text-xs text-slate-500">Voice &amp; text in 4 major Indian dialects</p>
            </div>

            <div className="p-5 rounded-2xl bg-[#F5FAFC] border border-teal-50/80 text-center space-y-2">
              <HeartPulse className="w-6 h-6 text-emerald-600 mx-auto" />
              <h4 className="font-bold text-sm text-slate-800">Connected Care</h4>
              <p className="text-xs text-slate-500">Integrates citizens, ASHA, and doctors</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── 3. SERVICES SECTION ───────────────────────────────────────────── */}
      <section id="services" className="bg-[#F5FAFC] py-20 px-4 md:px-8 border-b border-slate-100">
        <div className="max-w-7xl mx-auto space-y-12">
          
          <div className="text-center space-y-3">
            <span className="text-xs font-bold text-teal-700 uppercase tracking-widest">
              HEALTHCARE SERVICES
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Comprehensive Services for Every Citizen
            </h2>
            <p className="text-sm text-slate-600 max-w-2xl mx-auto">
              Empowering individuals, families, and healthcare workers with accessible digital health solutions.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {services.map((s) => {
              const Icon = s.icon;
              return (
                <div 
                  key={s.id}
                  className="bg-white p-7 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all flex flex-col justify-between group"
                >
                  <div>
                    <div className={`w-12 h-12 rounded-2xl border flex items-center justify-center mb-5 ${s.iconColor}`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 group-hover:text-teal-600 transition-colors">
                      {s.title}
                    </h3>
                    <p className="text-xs text-slate-600 mt-2.5 leading-relaxed font-normal">
                      {s.desc}
                    </p>
                  </div>
                  
                  <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-teal-600 group-hover:text-teal-700">
                    <span>Explore Service</span>
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      </section>

      {/* ── 4. TELEMEDICINE FEATURE SECTION ───────────────────────────────── */}
      <section className="bg-white py-20 px-4 md:px-8 border-b border-slate-100">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          <div className="lg:col-span-6 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-50 border border-teal-200 text-teal-700 text-xs font-bold">
              <ExternalLink className="w-3.5 h-3.5" />
              <span>OFFICIAL GOVERNMENT TELEMEDICINE</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 leading-tight">
              Connect to Healthcare, Even From a Distance
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              Need a remote doctor consultation? ArogyaMitra provides a direct pathway to India's official <strong className="text-slate-900 font-semibold">eSanjeevani Telemedicine Service</strong> (Ministry of Health &amp; Family Welfare). Consult certified government doctors online free of cost.
            </p>

            <div className="pt-2">
              <Link
                to="/citizen/book-appointment"
                className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-white font-bold text-sm shadow-md shadow-teal-500/20 transition-all uppercase tracking-wider"
              >
                <span>Access eSanjeevani</span>
                <ExternalLink className="w-4 h-4" />
              </Link>
            </div>
          </div>

          <div className="lg:col-span-6 relative flex justify-center">
            <div className="w-full max-w-md bg-[#EEF7FA] p-8 rounded-3xl border border-teal-100 shadow-xl space-y-6 relative overflow-hidden">
              <div className="w-12 h-12 rounded-2xl bg-teal-500 text-white flex items-center justify-center shadow-lg">
                <Stethoscope className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-extrabold text-slate-900">National Teleconsultation Gateway</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Connects patients in rural health wellness centres directly to specialist doctors at district and state medical colleges.
              </p>

              <div className="space-y-2 pt-2 text-xs font-bold text-teal-800">
                <div className="flex items-center gap-2 p-2.5 rounded-xl bg-white shadow-sm border border-teal-100">
                  <CheckCircle2 className="w-4 h-4 text-teal-600" />
                  <span>Remote Consultation Pathway</span>
                </div>
                <div className="flex items-center gap-2 p-2.5 rounded-xl bg-white shadow-sm border border-teal-100">
                  <CheckCircle2 className="w-4 h-4 text-teal-600" />
                  <span>Real-Time Doctor Video &amp; Chat</span>
                </div>
                <div className="flex items-center gap-2 p-2.5 rounded-xl bg-white shadow-sm border border-teal-100">
                  <CheckCircle2 className="w-4 h-4 text-teal-600" />
                  <span>Accessible Digital Health Records</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ── 5. HOW IT WORKS ────────────────────────────────────────────────── */}
      <section id="how-it-works" className="bg-[#F8FBFD] py-20 px-4 md:px-8 border-b border-slate-100">
        <div className="max-w-7xl mx-auto space-y-14">
          
          <div className="text-center space-y-3">
            <span className="text-xs font-bold text-teal-700 uppercase tracking-widest">
              SIMPLE HEALTHCARE JOURNEY
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              How ArogyaMitra Works
            </h2>
            <p className="text-sm text-slate-600 max-w-2xl mx-auto">
              A step-by-step guided experience from initial health query to clinical support.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 relative">
            {[
              { step: '01', title: 'Choose what you need', desc: 'Select AI triage, medicine scan, or emergency assistance.' },
              { step: '02', title: 'Describe health concern', desc: 'Speak or type in your native regional language.' },
              { step: '03', title: 'Receive AI guidance', desc: 'Get triage assessments grounded in ICMR protocols.' },
              { step: '04', title: 'Connect with support', desc: 'Escalate to ASHA workers or emergency networks if needed.' },
              { step: '05', title: 'Continue care', desc: 'Receive remote doctor advice via eSanjeevani telemedicine.' },
            ].map((s, i) => (
              <div key={s.step} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between relative">
                <div>
                  <span className="text-2xl font-black text-teal-500 font-mono block mb-3">{s.step}</span>
                  <h3 className="font-bold text-slate-900 text-sm mb-2">{s.title}</h3>
                  <p className="text-xs text-slate-500 leading-relaxed font-normal">{s.desc}</p>
                </div>
                {i < 4 && (
                  <div className="hidden md:block absolute -right-3 top-1/2 -translate-y-1/2 z-10">
                    <ChevronRight className="w-5 h-5 text-teal-300" />
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Responsibility Banner */}
          <div className="p-5 rounded-2xl bg-white border border-teal-100 shadow-sm flex items-start gap-3.5 text-xs text-slate-600">
            <HelpCircle className="w-5 h-5 text-teal-600 shrink-0 mt-0.5" />
            <div>
              <strong className="text-slate-900 block font-bold mb-0.5">Medical Responsibility Guidance</strong>
              ArogyaMitra assists and guides citizens with AI-assisted health information grounded in validated medical protocols. It does not replace licensed medical professionals or emergency hospital care.
            </div>
          </div>

        </div>
      </section>

      {/* ── 6. BUILT FOR INDIA ────────────────────────────────────────────── */}
      <section className="bg-white py-20 px-4 md:px-8 border-b border-slate-100">
        <div className="max-w-7xl mx-auto space-y-12">
          
          <div className="text-center space-y-3">
            <span className="text-xs font-bold text-teal-700 uppercase tracking-widest">
              LOCALIZED &amp; INCLUSIVE
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900">
              Healthcare Designed for India
            </h2>
            <p className="text-sm text-slate-600 max-w-2xl mx-auto">
              Addressing real-world infrastructure challenges across diverse regions.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-8 rounded-3xl bg-[#EEF7FA] border border-teal-100 space-y-4">
              <Globe className="w-8 h-8 text-teal-600" />
              <h3 className="text-lg font-bold text-slate-900">Regional Languages &amp; Voice</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Interact fluently using voice input or text in English, Hindi, Tamil, and Marathi to ensure accessibility for every citizen.
              </p>
            </div>

            <div className="p-8 rounded-3xl bg-[#EEF7FA] border border-teal-100 space-y-4">
              <WifiOff className="w-8 h-8 text-cyan-600" />
              <h3 className="text-lg font-bold text-slate-900">Offline-First Support</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Full emergency card access, first-aid instructions, and ASHA vitals recording even when network signals fail completely.
              </p>
            </div>

            <div className="p-8 rounded-3xl bg-[#EEF7FA] border border-teal-100 space-y-4">
              <Users className="w-8 h-8 text-blue-600" />
              <h3 className="text-lg font-bold text-slate-900">Community Health Workers</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Empowering village ASHA workers with digital screening tools, high-risk flags, and automated background synchronization.
              </p>
            </div>
          </div>

        </div>
      </section>

      {/* ── 7. HEALTHCARE ECOSYSTEM ───────────────────────────────────────── */}
      <section className="bg-[#F5FAFC] py-20 px-4 md:px-8 border-b border-slate-100">
        <div className="max-w-7xl mx-auto space-y-12">
          
          <div className="text-center space-y-3">
            <span className="text-xs font-bold text-teal-700 uppercase tracking-widest">
              HUMAN-CENTERED CARE
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900">
              Connecting Every Part of the Healthcare Journey
            </h2>
            <p className="text-sm text-slate-600 max-w-2xl mx-auto">
              Linking citizens, field workers, clinicians, and health authorities seamlessly.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { title: 'Citizens', icon: HeartPulse, color: 'text-teal-600 bg-teal-50', desc: 'Receive AI assistance, store health cards offline, scan medicines, and trigger emergency SOS.' },
              { title: 'ASHA Workers', icon: Users, color: 'text-cyan-600 bg-cyan-50', desc: 'Conduct village field screenings, log vitals offline, and sync referral data automatically.' },
              { title: 'Doctors', icon: Stethoscope, color: 'text-blue-600 bg-blue-50', desc: 'Receive real-time emergency requests, review ASHA screening history, and chat live.' },
              { title: 'Public Health Officers', icon: Map, color: 'text-indigo-600 bg-indigo-50', desc: 'Monitor district outreach, view disease heatmaps, and run outbreak simulation models.' },
            ].map((eco) => {
              const Icon = eco.icon;
              return (
                <div key={eco.title} className="bg-white p-7 rounded-3xl border border-slate-100 shadow-sm text-center space-y-4">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mx-auto ${eco.color}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="font-bold text-slate-900 text-base">{eco.title}</h3>
                  <p className="text-xs text-slate-600 leading-relaxed font-normal">{eco.desc}</p>
                </div>
              );
            })}
          </div>

        </div>
      </section>

      {/* ── 8. IMPACT / QUALITATIVE HIGHLIGHTS STRIP ──────────────────────── */}
      <section className="bg-white py-16 px-4 md:px-8 border-b border-slate-100">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          <div>
            <span className="text-3xl sm:text-4xl font-extrabold text-teal-600 font-sans">100%</span>
            <span className="block text-xs font-bold text-slate-700 uppercase mt-1">Offline First-Aid SOS</span>
          </div>
          <div>
            <span className="text-3xl sm:text-4xl font-extrabold text-cyan-600 font-sans">4</span>
            <span className="block text-xs font-bold text-slate-700 uppercase mt-1">Indian Languages</span>
          </div>
          <div>
            <span className="text-3xl sm:text-4xl font-extrabold text-blue-600 font-sans">AI-Grounded</span>
            <span className="block text-xs font-bold text-slate-700 uppercase mt-1">ICMR Protocol Triage</span>
          </div>
          <div>
            <span className="text-3xl sm:text-4xl font-extrabold text-emerald-600 font-sans">Unified</span>
            <span className="block text-xs font-bold text-slate-700 uppercase mt-1">ABHA Health Exchange</span>
          </div>
        </div>
      </section>

      {/* ── 9. TRUST & RESPONSIBLE AI ─────────────────────────────────────── */}
      <section className="bg-[#F8FBFD] py-20 px-4 md:px-8 border-b border-slate-100">
        <div className="max-w-7xl mx-auto space-y-12">
          
          <div className="text-center space-y-3">
            <span className="text-xs font-bold text-teal-700 uppercase tracking-widest">
              RESPONSIBILITY &amp; SAFETY
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900">
              Technology With Responsibility
            </h2>
            <p className="text-sm text-slate-600 max-w-2xl mx-auto">
              Grounded AI models and privacy-first data governance.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-3">
              <Lock className="w-6 h-6 text-teal-600" />
              <h3 className="font-bold text-slate-900 text-sm">Privacy First</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Citizens retain explicit control over health history sharing.
              </p>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-3">
              <Bot className="w-6 h-6 text-cyan-600" />
              <h3 className="font-bold text-slate-900 text-sm">Responsible AI</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Grounded in sovereign ICMR guidelines to prevent clinical hallucinations.
              </p>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-3">
              <ShieldCheck className="w-6 h-6 text-blue-600" />
              <h3 className="font-bold text-slate-900 text-sm">Secure Access</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Protected JWT token exchange and ABHA consent protocols.
              </p>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-3">
              <Stethoscope className="w-6 h-6 text-indigo-600" />
              <h3 className="font-bold text-slate-900 text-sm">Human Oversight</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                AI triage supports and escalates to licensed clinicians.
              </p>
            </div>
          </div>

        </div>
      </section>

      {/* ── 10. HEALTHCARE & PROFESSIONAL PORTALS ─────────────────────────── */}
      <section className="bg-white py-20 px-4 md:px-8 border-b border-slate-100">
        <div className="max-w-7xl mx-auto space-y-12">
          
          <div className="text-center space-y-3">
            <span className="text-xs font-bold text-teal-700 uppercase tracking-widest">
              SYSTEM PORTALS
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900">
              Healthcare &amp; Professional Portals
            </h2>
            <p className="text-sm text-slate-600 max-w-2xl mx-auto">
              Select a specialized portal to access citizen care or clinical management dashboards.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {portals.map((p) => {
              const Icon = p.icon;
              return (
                <div 
                  key={p.role} 
                  className="bg-[#F5FAFC] p-7 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between group hover:border-teal-200 transition-all"
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className={`p-3 rounded-2xl border ${p.accentColor}`}>
                        <Icon className="w-6 h-6" />
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md bg-white border border-slate-200 text-slate-600">
                        {p.badge}
                      </span>
                    </div>

                    <h3 className="text-lg font-bold text-slate-900 group-hover:text-teal-600 transition-colors">
                      {p.name}
                    </h3>

                    <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                      {p.desc}
                    </p>

                    <div className="mt-4 pt-3 border-t border-slate-200/60 space-y-1.5 text-[11px] text-slate-600 font-medium">
                      {p.features.map((f, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-teal-500"></span>
                          <span>{f}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Link
                    to={p.link}
                    className="mt-6 flex items-center justify-between px-5 py-3 rounded-xl bg-white hover:bg-teal-50 border border-slate-200 text-xs font-bold text-slate-800 hover:text-teal-700 transition-all"
                  >
                    <span>Launch {p.name}</span>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-teal-600 transition-colors" />
                  </Link>
                </div>
              );
            })}
          </div>

        </div>
      </section>

      {/* ── 11. FINAL CALL TO ACTION SECTION ──────────────────────────────── */}
      <section className="bg-gradient-to-r from-[#EEF7FA] via-[#F5FAFC] to-[#EEF7FA] py-20 px-4 md:px-8 text-center border-t border-teal-100">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="w-12 h-12 rounded-2xl bg-teal-500 text-white flex items-center justify-center mx-auto shadow-md">
            <HeartPulse className="w-6 h-6" />
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Start Your Healthcare Journey With ArogyaMitra
          </h2>
          <p className="text-slate-600 text-sm max-w-2xl mx-auto leading-relaxed">
            Access healthcare assistance, emergency support, and connected digital health services from one platform.
          </p>
          
          <div className="pt-4 flex flex-wrap justify-center gap-4">
            <Link
              to="/login"
              className="px-8 py-3.5 rounded-full font-bold text-sm bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-white shadow-lg shadow-teal-500/25 transition-all uppercase tracking-wider"
            >
              Get Started
            </Link>
            <Link
              to="/login"
              className="px-7 py-3.5 rounded-full font-bold text-sm bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-sm transition-all"
            >
              Sign In
            </Link>
            <Link
              to="/citizen/offline-health"
              className="px-7 py-3.5 rounded-full font-bold text-sm bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition-all"
            >
              Emergency SOS
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}
