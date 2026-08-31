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
      
      {/* ── 1. HERO SECTION ────────────────────────────────────────────────── */}
      <section className="bg-gradient-to-b from-[#F5FAFC] via-[#EEF7FA]/60 to-white pt-12 pb-16 px-4 md:px-8 border-b border-slate-100">
        <div className="max-w-7xl mx-auto text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-teal-50 border border-teal-200 text-teal-700 text-xs font-bold">
            <HeartPulse className="w-4 h-4 text-teal-600" />
            <span>ABOUT AROGYAMITRA</span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-tight max-w-4xl mx-auto">
            About <span className="text-teal-600">ArogyaMitra</span>
          </h1>

          <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto font-normal">
            Building a more accessible, connected, and inclusive digital healthcare experience for every citizen across India.
          </p>
        </div>
      </section>

      {/* ── 2. OUR STORY & THE HEALTHCARE CHALLENGE ────────────────────────── */}
      <section className="py-20 px-4 md:px-8 border-b border-slate-100">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          <div className="lg:col-span-6 space-y-6">
            <span className="text-xs font-bold text-teal-700 uppercase tracking-widest block">OUR STORY</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 leading-tight">
              Bridging the Digital Health Divide
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              India's vast geography and demographic diversity require health solutions that perform reliably in any environment. Millions of citizens face language barriers, connectivity drops, and limited access to clinical specialists.
            </p>
            <p className="text-sm text-slate-600 leading-relaxed">
              ArogyaMitra was conceived as a universal digital health bridge—combining offline-first PWA resilience, regional voice interaction, grounded AI triage, and real-time clinical escalation to connect rural citizens with certified care providers.
            </p>
          </div>

          <div className="lg:col-span-6 rounded-3xl overflow-hidden shadow-xl border-4 border-white bg-teal-50">
            <img src={heroImage} alt="ArogyaMitra Healthcare Story" className="w-full h-full object-cover" />
          </div>

        </div>
      </section>

      {/* ── 3 & 4. OUR VISION & OUR MISSION ────────────────────────────────── */}
      <section className="bg-[#F5FAFC] py-20 px-4 md:px-8 border-b border-slate-100">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
          
          <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-600 border border-teal-100 flex items-center justify-center">
              <Eye className="w-6 h-6" />
            </div>
            <h3 className="text-2xl font-extrabold text-slate-900">Our Vision</h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              A nation where every citizen—regardless of geography, literacy, or internet availability—has instant access to personalized, AI-assisted health guidance and emergency medical response.
            </p>
          </div>

          <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-cyan-50 text-cyan-600 border border-cyan-100 flex items-center justify-center">
              <Target className="w-6 h-6" />
            </div>
            <h3 className="text-2xl font-extrabold text-slate-900">Our Mission</h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              To empower citizens, community health workers (ASHA), and doctors with grounded AI models, offline-first architectures, and regional voice interaction that uphold clinical standards and patient privacy.
            </p>
          </div>

        </div>
      </section>

      {/* ── 5 & 6. WHO WE SERVE & WHAT WE PROVIDE ───────────────────────────── */}
      <section className="bg-white py-20 px-4 md:px-8 border-b border-slate-100">
        <div className="max-w-7xl mx-auto space-y-12">
          
          <div className="text-center space-y-3">
            <span className="text-xs font-bold text-teal-700 uppercase tracking-widest">
              STAKEHOLDERS &amp; SERVICES
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900">
              Who We Serve &amp; What We Provide
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="p-6 rounded-3xl bg-[#F5FAFC] border border-slate-100 space-y-3">
              <h4 className="font-bold text-base text-teal-700">Citizens</h4>
              <ul className="space-y-2 text-xs text-slate-600">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-teal-600" /> AI Symptom Triage</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-teal-600" /> Prescription OCR Scanner</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-teal-600" /> Offline Health Card</li>
              </ul>
            </div>

            <div className="p-6 rounded-3xl bg-[#F5FAFC] border border-slate-100 space-y-3">
              <h4 className="font-bold text-base text-cyan-700">ASHA Field Workers</h4>
              <ul className="space-y-2 text-xs text-slate-600">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-cyan-600" /> Offline Vitals Screening</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-cyan-600" /> Auto-Sync Queue</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-cyan-600" /> High-Risk Flags</li>
              </ul>
            </div>

            <div className="p-6 rounded-3xl bg-[#F5FAFC] border border-slate-100 space-y-3">
              <h4 className="font-bold text-base text-blue-700">Clinicians &amp; Doctors</h4>
              <ul className="space-y-2 text-xs text-slate-600">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-blue-600" /> Real-time ER Alerts</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-blue-600" /> Live Citizen Chat</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-blue-600" /> ABHA History Access</li>
              </ul>
            </div>

            <div className="p-6 rounded-3xl bg-[#F5FAFC] border border-slate-100 space-y-3">
              <h4 className="font-bold text-base text-indigo-700">Public Health Officers</h4>
              <ul className="space-y-2 text-xs text-slate-600">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" /> Outbreak Heatmaps</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" /> ASHA Monitoring</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" /> Epidemic Simulator</li>
              </ul>
            </div>
          </div>

        </div>
      </section>

      {/* ── 7 & 8. TECHNOLOGY BEHIND AROGYAMITRA ─────────────────────────── */}
      <section className="bg-[#F8FBFD] py-20 px-4 md:px-8 border-b border-slate-100">
        <div className="max-w-7xl mx-auto space-y-12">
          
          <div className="text-center space-y-3">
            <span className="text-xs font-bold text-teal-700 uppercase tracking-widest">
              PLATFORM ARCHITECTURE
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900">
              Technology Behind ArogyaMitra
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm space-y-3">
              <div className="flex items-center gap-3">
                <Cpu className="w-6 h-6 text-teal-600" />
                <h4 className="font-bold text-lg text-slate-900">Grounded Clinical AI Engine</h4>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Consumes sovereign clinical guidelines and localized ICMR publications. The AI agent retrieves validated references from our indexed vector database before rendering symptom triage actions.
              </p>
            </div>

            <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm space-y-3">
              <div className="flex items-center gap-3">
                <ShieldCheck className="w-6 h-6 text-cyan-600" />
                <h4 className="font-bold text-lg text-slate-900">ABHA &amp; NDHM Interoperability</h4>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Integrates with India's Ayushman Bharat Health Account (ABHA). Data transfers are encrypted end-to-end using strict JWT token exchanges, ensuring compliance with DPDP standards.
              </p>
            </div>

            <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm space-y-3">
              <div className="flex items-center gap-3">
                <HardDrive className="w-6 h-6 text-blue-600" />
                <h4 className="font-bold text-lg text-slate-900">17-Pass OCR Medicine Scanner</h4>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Processes image captures of pharmaceutical strips using adaptive thresholding and contrast optimization, matching extracted text against Indian Pharmacopoeia catalogs.
              </p>
            </div>

            <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm space-y-3">
              <div className="flex items-center gap-3">
                <WifiOff className="w-6 h-6 text-indigo-600" />
                <h4 className="font-bold text-lg text-slate-900">Offline-First IndexedDB Engine</h4>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Stores emergency health cards, local PHC directories, and screening queues locally in browser IndexedDB storage, auto-synchronizing background updates when network connection returns.
              </p>
            </div>
          </div>

        </div>
      </section>

      {/* ── 9 & 10. RESPONSIBLE AI & PRIVACY ──────────────────────────────── */}
      <section className="bg-white py-20 px-4 md:px-8 border-b border-slate-100">
        <div className="max-w-7xl mx-auto space-y-8">
          
          <div className="text-center space-y-3">
            <span className="text-xs font-bold text-teal-700 uppercase tracking-widest">
              CLINICAL GOVERNANCE
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900">
              Responsible AI &amp; Security
            </h2>
          </div>

          <div className="bg-[#F5FAFC] p-8 rounded-3xl border border-teal-100 space-y-6">
            <div className="flex items-start gap-4">
              <HelpCircle className="w-6 h-6 text-teal-600 shrink-0 mt-1" />
              <div className="space-y-2">
                <h4 className="font-bold text-slate-900 text-sm">Human Oversight &amp; Clinical Safety</h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  All diagnostic pathways, simulated models, and digital twin forecasts shown inside the platform are designed to assist public health authorities and medical professionals. Final clinical decisions remain under the authority of licensed medical officers.
                </p>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ── 11 & 12. GET STARTED CALL TO ACTION ────────────────────────────── */}
      <section className="bg-gradient-to-r from-[#EEF7FA] via-[#F5FAFC] to-[#EEF7FA] py-20 px-4 md:px-8 text-center border-t border-teal-100">
        <div className="max-w-4xl mx-auto space-y-6">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Start Your Healthcare Journey With ArogyaMitra
          </h2>
          <p className="text-slate-600 text-sm max-w-xl mx-auto leading-relaxed">
            Access healthcare assistance, emergency support and connected digital health services from one platform.
          </p>
          
          <div className="pt-4 flex flex-wrap justify-center gap-4">
            <Link
              to="/login"
              className="flex items-center gap-2 px-8 py-3.5 rounded-full font-bold text-sm bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-white shadow-lg shadow-teal-500/25 transition-all uppercase tracking-wider"
            >
              <span>Get Started</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/"
              className="px-7 py-3.5 rounded-full font-bold text-sm bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-sm transition-all"
            >
              Return to Home
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}
