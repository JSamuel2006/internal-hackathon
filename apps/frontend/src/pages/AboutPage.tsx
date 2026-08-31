import React from 'react';
import { Link } from 'react-router-dom';
import { 
  ShieldCheck, Cpu, HardDrive, HelpCircle, HeartPulse, 
  Target, Eye, Users, WifiOff, Globe, Lock, ArrowRight,
  Stethoscope, Map, CheckCircle2, Award, Zap, ChevronRight, UserCheck
} from 'lucide-react';
import { I18nService, t } from '../i18n';
import heroImage from '../assets/hero.png';

export default function AboutPage() {
  const [lang, setLang] = React.useState(I18nService.getLanguage());

  React.useEffect(() => {
    const unsub = I18nService.subscribe((newLang) => {
      setLang(newLang);
    });
    return unsub;
  }, []);

  return (
    <div className="flex-1 bg-white text-slate-800 font-sans selection:bg-teal-500 selection:text-white">
      
      {/* ── 1. ABOUT HERO SECTION ───────────────────────────────────────── */}
      <section className="relative bg-gradient-to-b from-[#F5FAFC] via-[#EEF7FA]/50 to-white py-16 px-4 md:px-8 border-b border-slate-100 overflow-hidden">
        <div className="max-w-4xl mx-auto text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-teal-50 border border-teal-200/80 text-teal-700 text-xs font-bold font-sans tracking-wide">
            <HeartPulse className="w-3.5 h-3.5 text-teal-600" />
            <span>National Digital Health Mission</span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight">
            {t('about_hero_title')}
          </h1>

          <p className="text-base sm:text-lg text-slate-600 leading-relaxed font-normal">
            {t('about_hero_desc')}
          </p>
        </div>
      </section>

      {/* ── 2. OUR STORY & VISION ────────────────────────────────────────── */}
      <section className="py-16 px-4 md:px-8 bg-white">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          
          <div className="space-y-6">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {t('about_story_title')}
            </h2>
            <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
              {t('about_story_desc')}
            </p>
            <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
              By leveraging ICMR clinical protocols, speech recognition in regional languages, and offline PWA sync, ArogyaMitra ensures healthcare guidance remains accessible anywhere.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="p-6 rounded-3xl bg-[#F5FAFC] border border-slate-200 space-y-3">
              <div className="p-3 bg-teal-500 text-white rounded-2xl w-fit">
                <Eye className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base text-slate-900">{t('about_vision_title')}</h3>
              <p className="text-xs text-slate-600 leading-relaxed">{t('about_vision_desc')}</p>
            </div>

            <div className="p-6 rounded-3xl bg-[#F5FAFC] border border-slate-200 space-y-3">
              <div className="p-3 bg-cyan-600 text-white rounded-2xl w-fit">
                <Target className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base text-slate-900">{t('about_mission_title')}</h3>
              <p className="text-xs text-slate-600 leading-relaxed">{t('about_mission_desc')}</p>
            </div>
          </div>

        </div>
      </section>

      {/* ── 3. WHO WE SERVE ──────────────────────────────────────────────── */}
      <section className="py-16 px-4 md:px-8 bg-[#F5FAFC]">
        <div className="max-w-7xl mx-auto space-y-12">
          
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              {t('about_who_title')}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="p-6 rounded-3xl bg-white border border-slate-200 space-y-3">
              <span className="p-2.5 bg-teal-50 text-teal-600 rounded-xl inline-block font-bold text-xs">CITIZENS</span>
              <h4 className="font-bold text-sm text-slate-900">Multilingual Care</h4>
              <p className="text-xs text-slate-600">AI symptom guidance, medicine OCR scanning, and emergency SOS health card.</p>
            </div>

            <div className="p-6 rounded-3xl bg-white border border-slate-200 space-y-3">
              <span className="p-2.5 bg-cyan-50 text-cyan-600 rounded-xl inline-block font-bold text-xs">ASHA WORKERS</span>
              <h4 className="font-bold text-sm text-slate-900">Field Vitals Screening</h4>
              <p className="text-xs text-slate-600">Offline vitals data collection, automated background sync, and risk escalation.</p>
            </div>

            <div className="p-6 rounded-3xl bg-white border border-slate-200 space-y-3">
              <span className="p-2.5 bg-blue-50 text-blue-600 rounded-xl inline-block font-bold text-xs">DOCTORS</span>
              <h4 className="font-bold text-sm text-slate-900">Clinical Command</h4>
              <p className="text-xs text-slate-600">Real-time teleconsultations, consent management, and prescription dispatch.</p>
            </div>

            <div className="p-6 rounded-3xl bg-white border border-slate-200 space-y-3">
              <span className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl inline-block font-bold text-xs">OFFICERS</span>
              <h4 className="font-bold text-sm text-slate-900">Surveillance &amp; Intelligence</h4>
              <p className="text-xs text-slate-600">Outbreak heatmaps, digital twin epidemiology, and automated campaign dispatches.</p>
            </div>
          </div>

        </div>
      </section>

      {/* ── 4. TECHNOLOGY BEHIND AROGYAMITRA ────────────────────────────── */}
      <section className="py-16 px-4 md:px-8 bg-white">
        <div className="max-w-5xl mx-auto space-y-8 text-center">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            {t('about_tech_title')}
          </h2>
          <p className="text-sm text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Built on a modern React, Vite, Express, TypeScript, and Progressive Web App stack for resilient operation across rural low-bandwidth conditions.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4">
            <div className="p-4 rounded-2xl bg-[#F5FAFC] border border-slate-200 font-bold text-xs text-slate-800">
              ⚡ Vite + React
            </div>
            <div className="p-4 rounded-2xl bg-[#F5FAFC] border border-slate-200 font-bold text-xs text-slate-800">
              🛡️ TypeScript Security
            </div>
            <div className="p-4 rounded-2xl bg-[#F5FAFC] border border-slate-200 font-bold text-xs text-slate-800">
              📱 PWA Service Worker
            </div>
            <div className="p-4 rounded-2xl bg-[#F5FAFC] border border-slate-200 font-bold text-xs text-slate-800">
              💾 IndexedDB Offline
            </div>
          </div>
        </div>
      </section>

      {/* ── 5. FINAL CTA ─────────────────────────────────────────────────── */}
      <section className="py-14 px-4 bg-[#F5FAFC] border-t border-slate-200 text-center">
        <div className="max-w-xl mx-auto space-y-4">
          <h3 className="text-xl font-bold text-slate-900">{t('cta_title')}</h3>
          <Link
            to="/signup"
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-gradient-to-r from-teal-500 to-cyan-600 text-white font-bold text-xs uppercase tracking-wider shadow-md hover:shadow-lg transition-all"
          >
            <span>{t('cta_create_account')}</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

    </div>
  );
}
