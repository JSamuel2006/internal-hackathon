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
      name: t('portal_citizen_name'),
      badge: 'Public Care',
      icon: HeartPulse,
      desc: t('portal_citizen_desc'),
      features: [t('service_voice_title'), t('service_offline_title'), t('service_ocr_title'), t('trust_abha_title')],
      link: '/login?role=ROLE_CITIZEN',
      accentColor: 'text-teal-600 border-teal-200 bg-teal-50',
    },
    {
      role: 'ROLE_WORKER',
      name: t('portal_worker_name'),
      badge: 'Community Outreach',
      icon: Users,
      desc: t('portal_worker_desc'),
      features: ['Offline Vitals Screening', 'Clinical Referral Engine', 'IndexedDB Queue & Sync', 'High-Risk Follow-ups'],
      link: '/login?role=ROLE_WORKER',
      accentColor: 'text-cyan-600 border-cyan-200 bg-cyan-50',
    },
    {
      role: 'ROLE_DOCTOR',
      name: t('portal_doctor_name'),
      badge: 'Clinical Emergency',
      icon: Stethoscope,
      desc: t('portal_doctor_desc'),
      features: ['Socket.IO Live Alert Queue', 'Citizen ↔ Doctor Live Chat', 'Consent Management', 'ASHA Screening History'],
      link: '/login?role=ROLE_DOCTOR',
      accentColor: 'text-blue-600 border-blue-200 bg-blue-50',
    },
    {
      role: 'ROLE_OFFICER',
      name: t('portal_officer_name'),
      badge: 'Surveillance & Policy',
      icon: Map,
      desc: t('portal_officer_desc'),
      features: ['ASHA Live Surveillance', 'Outbreak Heatmaps', 'Scenario Simulator', 'Epidemiological Intelligence'],
      link: '/login?role=ROLE_OFFICER',
      accentColor: 'text-indigo-600 border-indigo-200 bg-indigo-50',
    },
    {
      role: 'ROLE_ADMIN',
      name: t('portal_admin_name'),
      badge: 'Platform Root',
      icon: Lock,
      desc: t('portal_admin_desc'),
      features: ['PostgreSQL Health & Latency', 'Audit Trail Logs', 'RBAC User Management', 'Socket.IO Server Nodes'],
      link: '/login?role=ROLE_ADMIN',
      accentColor: 'text-emerald-600 border-emerald-200 bg-emerald-50',
    },
  ];

  const services = [
    {
      id: 'ai-assistant',
      title: t('service_ai_title'),
      desc: t('service_ai_desc'),
      icon: Bot,
      iconColor: 'text-teal-600 bg-teal-50 border-teal-200',
    },
    {
      id: 'emergency-sos',
      title: t('service_emergency_title'),
      desc: t('service_emergency_desc'),
      icon: ShieldAlert,
      iconColor: 'text-rose-600 bg-rose-50 border-rose-200',
    },
    {
      id: 'offline-healthcare',
      title: t('service_offline_title'),
      desc: t('service_offline_desc'),
      icon: WifiOff,
      iconColor: 'text-cyan-600 bg-cyan-50 border-cyan-200',
    },
    {
      id: 'voice-multilingual',
      title: t('service_voice_title'),
      desc: t('service_voice_desc'),
      icon: Globe,
      iconColor: 'text-blue-600 bg-blue-50 border-blue-200',
    },
    {
      id: 'medicine-scanner',
      title: t('service_ocr_title'),
      desc: t('service_ocr_desc'),
      icon: ScanLine,
      iconColor: 'text-indigo-600 bg-indigo-50 border-indigo-200',
    },
    {
      id: 'govt-schemes',
      title: t('service_schemes_title'),
      desc: t('service_schemes_desc'),
      icon: Award,
      iconColor: 'text-emerald-600 bg-emerald-50 border-emerald-200',
    },
    {
      id: 'telemedicine',
      title: t('service_telemedicine_title'),
      desc: t('service_telemedicine_desc'),
      icon: ExternalLink,
      iconColor: 'text-teal-700 bg-teal-50 border-teal-200',
    },
  ];

  return (
    <div className="flex-1 bg-white text-slate-800 font-sans selection:bg-teal-500 selection:text-white">
      
      {/* ── 1. HERO SECTION ──────────────────────────────────────────────── */}
      <section className="relative bg-[#F5FAFC] pt-12 pb-20 px-4 md:px-8 overflow-hidden border-b border-slate-100">
        
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          <div className="lg:col-span-6 space-y-6 text-left">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-teal-50 border border-teal-200/80 text-teal-700 text-xs font-bold font-sans tracking-wide">
              <HeartPulse className="w-3.5 h-3.5 text-teal-600" />
              <span>{t('hero_eyebrow')}</span>
            </div>

            <h1 className="text-[36px] sm:text-[48px] lg:text-[56px] font-bold text-slate-900 tracking-[-0.02em] leading-[1.12]">
              {t('hero_title_1')}{' '}
              <span className="text-teal-600 block sm:inline">
                {t('hero_title_2')}
              </span>
            </h1>

            <p className="text-base sm:text-lg text-slate-600 leading-[1.65] font-normal max-w-xl">
              {t('hero_desc')}
            </p>

            <div className="pt-2 flex flex-wrap gap-4 items-center">
              <Link
                to="/signup"
                className="flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-sm bg-teal-600 hover:bg-teal-700 text-white shadow-sm transition-all cursor-pointer"
              >
                <UserCheck className="w-4 h-4" />
                <span>{t('btn_get_started')}</span>
              </Link>

              <Link
                to="/login"
                className="flex items-center gap-2 px-6 py-3 rounded-2xl font-semibold text-sm bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-2xs transition-all cursor-pointer"
              >
                <LogIn className="w-4 h-4 text-slate-500" />
                <span>{t('btn_sign_in')}</span>
              </Link>

              <Link
                to="/citizen/offline-health"
                className="flex items-center gap-2 px-6 py-3 rounded-2xl font-semibold text-sm bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition-all cursor-pointer"
              >
                <ShieldAlert className="w-4 h-4 text-rose-600" />
                <span>{t('btn_emergency_sos')}</span>
              </Link>
            </div>
          </div>

          <div className="lg:col-span-6 relative flex justify-center items-center">
            <div className="relative w-full max-w-lg aspect-square sm:aspect-[4/3] rounded-3xl overflow-hidden shadow-sm border border-slate-200 bg-white">
              <img 
                src={heroImage} 
                alt="ArogyaMitra Healthcare Platform" 
                className="w-full h-full object-cover"
              />
            </div>

            <div className="absolute top-4 -left-2 sm:left-4 bg-white px-3.5 py-2 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-2 text-xs font-semibold text-slate-800">
              <span className="w-2 h-2 rounded-full bg-teal-500"></span>
              <span>{t('pill_regional_languages')}</span>
            </div>

            <div className="absolute bottom-4 -right-2 sm:right-4 bg-white px-3.5 py-2 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-2 text-xs font-semibold text-slate-800">
              <span className="w-2 h-2 rounded-full bg-rose-500"></span>
              <span>{t('pill_emergency_support')}</span>
            </div>
          </div>

        </div>
      </section>

      {/* ── 2. TRUST / INTRODUCTION STRIP ──────────────────────────────────── */}
      <section className="bg-white border-y border-slate-100 py-10 px-4 md:px-8">
        <div className="max-w-7xl mx-auto text-center space-y-8">
          <p className="text-xs font-bold text-teal-700 uppercase tracking-widest">
            {t('strip_eyebrow')}
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="p-5 rounded-2xl bg-[#F5FAFC] border border-teal-50/80 text-center space-y-2">
              <Bot className="w-6 h-6 text-teal-600 mx-auto" />
              <h4 className="font-bold text-sm text-slate-800">{t('strip_ai_title')}</h4>
              <p className="text-xs text-slate-500">{t('strip_ai_desc')}</p>
            </div>

            <div className="p-5 rounded-2xl bg-[#F5FAFC] border border-teal-50/80 text-center space-y-2">
              <WifiOff className="w-6 h-6 text-cyan-600 mx-auto" />
              <h4 className="font-bold text-sm text-slate-800">{t('strip_offline_title')}</h4>
              <p className="text-xs text-slate-500">{t('strip_offline_desc')}</p>
            </div>

            <div className="p-5 rounded-2xl bg-[#F5FAFC] border border-teal-50/80 text-center space-y-2">
              <Users className="w-6 h-6 text-blue-600 mx-auto" />
              <h4 className="font-bold text-sm text-slate-800">{t('strip_asha_title')}</h4>
              <p className="text-xs text-slate-500">{t('strip_asha_desc')}</p>
            </div>

            <div className="p-5 rounded-2xl bg-[#F5FAFC] border border-teal-50/80 text-center space-y-2">
              <Map className="w-6 h-6 text-indigo-600 mx-auto" />
              <h4 className="font-bold text-sm text-slate-800">{t('strip_officer_title')}</h4>
              <p className="text-xs text-slate-500">{t('strip_officer_desc')}</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── 3. SERVICES GRID ──────────────────────────────────────────────── */}
      <section id="services" className="py-20 px-4 md:px-8 bg-[#F5FAFC]">
        <div className="max-w-7xl mx-auto space-y-12">
          
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              {t('services_section_title')}
            </h2>
            <p className="text-base text-slate-600">
              {t('services_section_subtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {services.map((s) => {
              const Icon = s.icon;
              return (
                <div 
                  key={s.id}
                  className="bg-white rounded-3xl p-7 border border-slate-200/80 shadow-md hover:shadow-xl transition-all duration-300 flex flex-col justify-between group"
                >
                  <div className="space-y-4">
                    <div className={`p-3.5 rounded-2xl border inline-block ${s.iconColor} group-hover:scale-110 transition-transform`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 group-hover:text-teal-600 transition-colors">
                      {s.title}
                    </h3>
                    <p className="text-sm text-slate-600 leading-relaxed font-normal">
                      {s.desc}
                    </p>
                  </div>

                  <div className="pt-6 mt-4 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-xs font-bold text-teal-600 group-hover:translate-x-1 transition-transform flex items-center gap-1">
                      Learn More <ChevronRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      </section>

      {/* ── 4. TELEMEDICINE HANDOFF SECTION ───────────────────────────────── */}
      <section className="py-16 px-4 md:px-8 bg-teal-800 text-white relative overflow-hidden">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
          
          <div className="lg:col-span-8 space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-teal-100 text-xs font-semibold border border-white/20">
              <ExternalLink className="w-3.5 h-3.5 text-teal-300" />
              <span>{t('telemedicine_badge')}</span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
              {t('telemedicine_section_title')}
            </h2>

            <p className="text-sm sm:text-base text-teal-100 leading-relaxed max-w-3xl">
              {t('telemedicine_section_desc')}
            </p>

            <div className="flex flex-wrap gap-6 pt-2 text-xs font-semibold text-teal-100">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-teal-300" />
                <span>{t('telemedicine_feature_1')}</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-teal-300" />
                <span>{t('telemedicine_feature_2')}</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-teal-300" />
                <span>{t('telemedicine_feature_3')}</span>
              </div>
            </div>
          </div>

          <div className="lg:col-span-4 flex lg:justify-end">
            <a
              href="https://www.esanjeevani.in/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-3 px-7 py-3.5 rounded-2xl bg-white text-teal-900 hover:bg-teal-50 font-bold text-xs uppercase tracking-wider shadow-2xs transition-all cursor-pointer"
            >
              <span>{t('telemedicine_cta')}</span>
              <ExternalLink className="w-4 h-4 text-teal-700" />
            </a>
          </div>

        </div>
      </section>

      {/* ── 5. HOW IT WORKS SECTION ────────────────────────────────────────── */}
      <section id="how-it-works" className="py-20 px-4 md:px-8 bg-white">
        <div className="max-w-7xl mx-auto space-y-14">
          
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              {t('how_it_works_section_title')}
            </h2>
            <p className="text-base text-slate-600">
              {t('how_it_works_section_subtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-6 relative">
            {[
              { step: '01', title: t('step_1_title'), desc: t('step_1_desc'), icon: MessageSquare },
              { step: '02', title: t('step_2_title'), desc: t('step_2_desc'), icon: Bot },
              { step: '03', title: t('step_3_title'), desc: t('step_3_desc'), icon: Users },
              { step: '04', title: t('step_4_title'), desc: t('step_4_desc'), icon: Stethoscope },
              { step: '05', title: t('step_5_title'), desc: t('step_5_desc'), icon: Map },
            ].map((st, i) => {
              const Icon = st.icon;
              return (
                <div key={i} className="p-6 rounded-3xl bg-[#F5FAFC] border border-slate-200/70 space-y-3 relative group hover:border-teal-300 transition-all">
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-black text-teal-600 font-mono">{st.step}</span>
                    <Icon className="w-5 h-5 text-slate-600 group-hover:text-teal-600 transition-colors" />
                  </div>
                  <h4 className="font-bold text-sm text-slate-900 leading-snug">{st.title}</h4>
                  <p className="text-xs text-slate-600 leading-relaxed">{st.desc}</p>
                </div>
              );
            })}
          </div>

        </div>
      </section>

      {/* ── 6. PORTALS GRID SECTION ────────────────────────────────────────── */}
      <section className="py-20 px-4 md:px-8 bg-[#F5FAFC]">
        <div className="max-w-7xl mx-auto space-y-12">
          
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              {t('portals_section_title')}
            </h2>
            <p className="text-base text-slate-600">
              {t('portals_section_subtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {portals.map((p) => {
              const Icon = p.icon;
              return (
                <div key={p.role} className="bg-white rounded-3xl p-7 border border-slate-200 shadow-md flex flex-col justify-between space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="p-3 rounded-2xl bg-teal-50 text-teal-600 border border-teal-100">
                        <Icon className="w-6 h-6" />
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-slate-100 text-slate-600">
                        {p.badge}
                      </span>
                    </div>

                    <h3 className="text-xl font-bold text-slate-900">{p.name}</h3>
                    <p className="text-xs text-slate-600 leading-relaxed font-normal">{p.desc}</p>
                  </div>

                  <Link
                    to={p.link}
                    className="w-full text-center py-3 rounded-2xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs uppercase tracking-wider shadow-2xs transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>{t('portal_enter')}</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              );
            })}
          </div>

        </div>
      </section>

      {/* ── 7. FINAL CTA ─────────────────────────────────────────────────── */}
      <section className="py-20 px-4 md:px-8 bg-white border-t border-slate-100">
        <div className="max-w-4xl mx-auto bg-teal-700 rounded-3xl p-10 md:p-14 text-white text-center space-y-6 shadow-sm border border-teal-800">
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            {t('cta_title')}
          </h2>
          <p className="text-base text-teal-100 max-w-2xl mx-auto leading-relaxed">
            {t('cta_desc')}
          </p>
          <div className="flex flex-wrap gap-4 justify-center pt-2">
            <Link
              to="/signup"
              className="px-8 py-3.5 rounded-2xl bg-white text-teal-900 font-bold text-xs uppercase tracking-wider shadow-2xs hover:bg-teal-50 transition-all"
            >
              {t('cta_create_account')}
            </Link>
            <Link
              to="/login"
              className="px-8 py-3.5 rounded-2xl bg-teal-800/80 hover:bg-teal-800 text-white font-bold text-xs uppercase tracking-wider border border-white/20 transition-all"
            >
              {t('cta_sign_in')}
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}
