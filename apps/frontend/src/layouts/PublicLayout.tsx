import React from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { ShieldCheck, HeartPulse, Menu, X, Globe, UserCheck, LogIn, Sparkles } from 'lucide-react';
import { LanguageSelector } from '../components/voice/LanguageSelector';

export default function PublicLayout() {
  const [menuOpen, setMenuOpen] = React.useState(false);
  const location = useLocation();

  const navItems = [
    { name: 'Home', path: '/' },
    { name: 'About Us', path: '/about' },
    { name: 'Services', path: '/#services' },
    { name: 'How It Works', path: '/#how-it-works' },
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
    <div className="min-h-screen flex flex-col bg-[#030712] text-slate-100 font-sans selection:bg-rose-500 selection:text-white">
      {/* Top Utility Bar */}
      <div className="bg-slate-950 border-b border-slate-900 py-1.5 px-4 text-xs font-mono text-slate-400">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 text-teal-400 font-semibold">
              <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse"></span>
              National Digital Health Initiative
            </span>
            <span className="hidden sm:inline text-slate-600">|</span>
            <span className="hidden sm:inline text-slate-400">Ayushman Bharat &amp; ICMR Guidelines Grounded</span>
          </div>
          <div className="flex items-center gap-4">
            <LanguageSelector />
          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <nav className="sticky top-0 z-50 bg-slate-950/90 backdrop-blur-md border-b border-slate-800/80 px-4 md:px-8 py-3.5 flex items-center justify-between shadow-xl">
        <Link to="/" className="flex items-center gap-3 group">
          <div className="p-2.5 bg-rose-500/10 rounded-xl text-rose-400 border border-rose-500/25 group-hover:scale-105 transition-transform">
            <HeartPulse className="w-6 h-6 text-rose-500" />
          </div>
          <div>
            <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-rose-400 via-amber-300 to-teal-300 bg-clip-text text-transparent">
              ArogyaMitra
            </span>
            <span className="text-[10px] block text-slate-400 font-mono tracking-wider font-semibold uppercase">
              AI Public Healthcare Platform
            </span>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <div className="hidden md:flex items-center gap-8">
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
              className={`text-sm font-semibold tracking-wide transition-colors ${
                location.pathname === item.path ? 'text-rose-400 font-bold' : 'text-slate-300 hover:text-white'
              }`}
            >
              {item.name}
            </a>
          ))}
        </div>

        {/* Action Buttons: Sign In & Sign Up */}
        <div className="hidden md:flex items-center gap-3">
          <Link
            to="/login"
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold font-mono text-slate-200 hover:text-white bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all cursor-pointer"
          >
            <LogIn className="w-3.5 h-3.5 text-slate-400" />
            <span>Sign In</span>
          </Link>
          <Link
            to="/login"
            className="flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold font-mono bg-rose-500 hover:bg-rose-600 text-white shadow-lg shadow-rose-500/20 transition-all transform hover:-translate-y-0.5 cursor-pointer uppercase tracking-wider"
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>Sign Up</span>
          </Link>
        </div>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden p-2 text-slate-400 hover:text-white transition-colors"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle Navigation Menu"
        >
          {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </nav>

      {/* Mobile Navigation Drawer */}
      {menuOpen && (
        <div className="md:hidden fixed inset-0 top-[110px] z-40 bg-slate-950/98 backdrop-blur-xl flex flex-col p-6 gap-6 border-t border-slate-900 overflow-y-auto">
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
                className={`text-base font-semibold py-2 border-b border-slate-900 ${
                  location.pathname === item.path ? 'text-rose-400' : 'text-slate-300'
                }`}
              >
                {item.name}
              </a>
            ))}
          </div>

          <div className="flex flex-col gap-3 pt-4 border-t border-slate-900">
            <Link
              to="/login"
              onClick={() => setMenuOpen(false)}
              className="w-full text-center py-3 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 font-bold font-mono text-sm"
            >
              Sign In
            </Link>
            <Link
              to="/login"
              onClick={() => setMenuOpen(false)}
              className="w-full text-center py-3 rounded-xl bg-rose-500 text-white font-bold font-mono uppercase text-sm shadow-lg shadow-rose-500/20"
            >
              Sign Up
            </Link>
          </div>
        </div>
      )}

      {/* Main Page Body */}
      <main className="flex-1 flex flex-col">
        <Outlet />
      </main>

      {/* Public Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-12 px-6 text-xs text-slate-400 font-mono">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 mb-8 pb-8 border-b border-slate-900">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <HeartPulse className="w-5 h-5 text-rose-500" />
              <span className="font-bold text-base text-slate-100">ArogyaMitra</span>
            </div>
            <p className="text-slate-450 leading-relaxed font-sans text-xs">
              Universal digital healthcare platform empowering Indian citizens, community health workers, doctors, and public health authorities.
            </p>
          </div>

          <div>
            <h4 className="font-bold text-slate-200 uppercase tracking-wider text-[11px] mb-3 text-rose-400">Quick Links</h4>
            <ul className="space-y-2 text-slate-450 font-sans">
              <li><Link to="/" className="hover:text-slate-200 transition-colors">Home</Link></li>
              <li><Link to="/about" className="hover:text-slate-200 transition-colors">About Us</Link></li>
              <li><a href="/#services" className="hover:text-slate-200 transition-colors">Healthcare Services</a></li>
              <li><a href="/#how-it-works" className="hover:text-slate-200 transition-colors">How It Works</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-slate-200 uppercase tracking-wider text-[11px] mb-3 text-teal-400">Portals</h4>
            <ul className="space-y-2 text-slate-450 font-sans">
              <li><Link to="/login" className="hover:text-slate-200 transition-colors">Citizen Health Portal</Link></li>
              <li><Link to="/login" className="hover:text-slate-200 transition-colors">ASHA Field Worker Portal</Link></li>
              <li><Link to="/login" className="hover:text-slate-200 transition-colors">Doctor Clinical Command</Link></li>
              <li><Link to="/login" className="hover:text-slate-200 transition-colors">Public Health Surveillance</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-slate-200 uppercase tracking-wider text-[11px] mb-3 text-amber-400">Telemedicine Handoff</h4>
            <p className="text-slate-450 leading-relaxed font-sans text-xs mb-3">
              Consult government doctors online via India's National Telemedicine Service (MoHFW).
            </p>
            <a
              href="https://www.esanjeevani.in/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-teal-400 hover:underline font-mono text-[11px] font-bold"
            >
              <span>eSanjeevani Portal ↗</span>
            </a>
          </div>
        </div>

        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Secured with ABHA Health Record Standards &amp; DPDP Compliant Architecture</span>
          </div>
          <div className="text-slate-500">
            &copy; 2026 ArogyaMitra AI. Grounded in ICMR &amp; National Digital Health Mission Protocols.
          </div>
        </div>
      </footer>
    </div>
  );
}
