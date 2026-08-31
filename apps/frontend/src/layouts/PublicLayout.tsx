import React, { useState, useEffect } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { HeartPulse, Menu, X, ShieldCheck, LogIn, UserCheck, PhoneCall, ExternalLink } from 'lucide-react';
import { LanguageSelector } from '../components/voice/LanguageSelector';
import { I18nService, t } from '../i18n';

export default function PublicLayout() {
  const [lang, setLang] = useState(I18nService.getLanguage());
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const unsub = I18nService.subscribe((newLang) => {
      setLang(newLang);
    });
    return unsub;
  }, []);

  const navItems = [
    { name: t('nav_home'), path: '/' },
    { name: t('nav_about'), path: '/about' },
    { name: t('nav_services'), path: '/#services' },
    { name: t('nav_how_it_works'), path: '/#how-it-works' },
  ];

  const handleNavClick = (path: string) => {
    setMenuOpen(false);
    if (path.includes('#')) {
      const elementId = path.split('#')[1];
      const element = document.getElementById(elementId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-white text-slate-800 font-sans selection:bg-teal-500 selection:text-white">
      
      {/* ── Top Official Utility Strip (Light Blue/Teal) ──────────────── */}
      <div className="bg-[#EEF7FA] border-b border-teal-100/60 py-2 px-4 text-xs font-sans text-slate-600">
        <div className="max-w-7xl mx-auto flex flex-wrap justify-between items-center gap-2">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 text-teal-700 font-semibold">
              <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse"></span>
              {t('top_platform_title')}
            </span>
            <span className="hidden sm:inline text-teal-200">|</span>
            <span className="hidden sm:inline text-slate-600 font-medium">{t('top_standards_info')}</span>
          </div>
          <div className="flex items-center gap-4 ml-auto">
            <a href="tel:108" className="hidden sm:flex items-center gap-1 text-teal-800 font-bold hover:text-teal-900 transition-colors">
              <PhoneCall className="w-3.5 h-3.5 text-rose-500" />
              <span>{t('top_emergency')}</span>
            </a>
            <LanguageSelector />
          </div>
        </div>
      </div>

      {/* ── Main Clean White Healthcare Navbar ───────────────────────── */}
      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-100 shadow-sm px-4 md:px-8 py-3.5 flex items-center justify-between">
        
        {/* Brand Logo & Name */}
        <Link to="/" className="flex items-center gap-3 group">
          <div className="p-2.5 bg-gradient-to-tr from-teal-500 to-cyan-500 rounded-xl text-white shadow-md shadow-teal-500/20 group-hover:scale-105 transition-transform">
            <HeartPulse className="w-6 h-6" />
          </div>
          <div>
            <span className="font-extrabold text-2xl tracking-tight text-slate-900 group-hover:text-teal-600 transition-colors">
              Arogya<span className="text-teal-600">Mitra</span>
            </span>
            <span className="text-[10px] block text-slate-500 font-semibold tracking-wider uppercase font-sans -mt-1">
              Digital Healthcare Platform
            </span>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <div className="hidden lg:flex items-center gap-8">
          {navItems.map((item) => (
            <a
              key={item.path}
              href={item.path}
              onClick={(e) => {
                if (item.path.includes('#')) {
                  e.preventDefault();
                  handleNavClick(item.path);
                }
              }}
              className={`text-xs font-bold tracking-wider transition-colors ${
                location.pathname === item.path 
                  ? 'text-teal-600 border-b-2 border-teal-500 pb-1' 
                  : 'text-slate-600 hover:text-teal-600'
              }`}
            >
              {item.name}
            </a>
          ))}
        </div>

        {/* Action CTAs: Sign In & Sign Up */}
        <div className="hidden md:flex items-center gap-3">
          <Link
            to="/login"
            className="flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold text-slate-700 hover:text-teal-700 bg-slate-100 hover:bg-slate-200/70 border border-slate-200/80 transition-all cursor-pointer"
          >
            <LogIn className="w-3.5 h-3.5 text-slate-500" />
            <span>{t('nav_sign_in')}</span>
          </Link>
          <Link
            to="/signup"
            className="flex items-center gap-2 px-6 py-2.5 rounded-full text-xs font-bold bg-gradient-to-r from-teal-500 to-cyan-600 text-white shadow-md shadow-teal-500/20 hover:shadow-lg hover:shadow-teal-500/30 hover:from-teal-600 hover:to-cyan-700 transition-all transform hover:-translate-y-0.5 cursor-pointer uppercase tracking-wider"
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>{t('nav_sign_up')}</span>
          </Link>
        </div>

        {/* Mobile Hamburger Menu Toggle */}
        <button
          className="lg:hidden p-2 text-slate-600 hover:text-teal-600 transition-colors"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle Navigation"
        >
          {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </nav>

      {/* ── Mobile Navigation Drawer ─────────────────────────────────── */}
      {menuOpen && (
        <div className="lg:hidden fixed inset-0 top-[105px] z-40 bg-white/98 backdrop-blur-xl flex flex-col p-6 gap-6 border-t border-slate-100 overflow-y-auto">
          <div className="flex flex-col gap-4">
            {navItems.map((item) => (
              <a
                key={item.path}
                href={item.path}
                onClick={(e) => {
                  if (item.path.includes('#')) {
                    e.preventDefault();
                    handleNavClick(item.path);
                  } else {
                    setMenuOpen(false);
                  }
                }}
                className={`text-base font-bold tracking-wider py-2.5 border-b border-slate-100 ${
                  location.pathname === item.path ? 'text-teal-600' : 'text-slate-700'
                }`}
              >
                {item.name}
              </a>
            ))}
          </div>

          <div className="flex flex-col gap-3 pt-4 border-t border-slate-100">
            <Link
              to="/login"
              onClick={() => setMenuOpen(false)}
              className="w-full text-center py-3 rounded-xl bg-slate-100 text-slate-800 font-bold text-sm"
            >
              {t('nav_sign_in')}
            </Link>
            <Link
              to="/signup"
              onClick={() => setMenuOpen(false)}
              className="w-full text-center py-3 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-600 text-white font-bold uppercase text-sm shadow-md shadow-teal-500/20"
            >
              {t('nav_sign_up')}
            </Link>
          </div>
        </div>
      )}

      {/* ── Main Page Content Outlet ────────────────────────────────── */}
      <main className="flex-1 flex flex-col">
        <Outlet key={lang} />
      </main>

      {/* ── Clean Professional Healthcare Footer ───────────────────── */}
      <footer className="border-t border-slate-200 bg-[#F5FAFC] py-14 px-6 text-sm text-slate-600 font-sans">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-10 mb-10 pb-10 border-b border-slate-200">
          
          <div className="space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-teal-500 rounded-lg text-white">
                <HeartPulse className="w-5 h-5" />
              </div>
              <span className="font-extrabold text-xl text-slate-900">Arogya<span className="text-teal-600">Mitra</span></span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed font-sans">
              Universal digital healthcare platform empowering citizens, community health workers, doctors, and public health authorities across India.
            </p>
          </div>

          <div>
            <h4 className="font-bold text-slate-900 uppercase tracking-wider text-xs mb-4 text-teal-700">Quick Links</h4>
            <ul className="space-y-2.5 text-xs text-slate-600 font-medium">
              <li><Link to="/" className="hover:text-teal-600 transition-colors">{t('nav_home')}</Link></li>
              <li><Link to="/about" className="hover:text-teal-600 transition-colors">{t('nav_about')}</Link></li>
              <li><a href="/#services" className="hover:text-teal-600 transition-colors">{t('nav_services')}</a></li>
              <li><a href="/#how-it-works" className="hover:text-teal-600 transition-colors">{t('nav_how_it_works')}</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-slate-900 uppercase tracking-wider text-xs mb-4 text-teal-700">Healthcare Portals</h4>
            <ul className="space-y-2.5 text-xs text-slate-600 font-medium">
              <li><Link to="/login?role=ROLE_CITIZEN" className="hover:text-teal-600 transition-colors">Citizen Health Portal</Link></li>
              <li><Link to="/login?role=ROLE_WORKER" className="hover:text-teal-600 transition-colors">ASHA Field Worker Portal</Link></li>
              <li><Link to="/login?role=ROLE_DOCTOR" className="hover:text-teal-600 transition-colors">Doctor Clinical Command</Link></li>
              <li><Link to="/login?role=ROLE_OFFICER" className="hover:text-teal-600 transition-colors">Public Health Surveillance</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-slate-900 uppercase tracking-wider text-xs mb-4 text-teal-700">Telemedicine Gateway</h4>
            <p className="text-xs text-slate-600 leading-relaxed mb-3">
              Direct access to the official Government of India eSanjeevani Telemedicine Service (MoHFW).
            </p>
            <a
              href="https://www.esanjeevani.in/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-teal-700 hover:text-teal-900 font-bold text-xs"
            >
              <span>Visit eSanjeevani Portal</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-teal-600 shrink-0" />
            <span>Secured with ABHA Health Data Standards &amp; Privacy-First Architecture</span>
          </div>
          <div>
            &copy; 2026 ArogyaMitra Healthcare. Grounded in ICMR Clinical Protocols.
          </div>
        </div>
      </footer>
    </div>
  );
}
