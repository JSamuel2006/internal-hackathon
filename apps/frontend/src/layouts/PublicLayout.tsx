import React from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { Shield, Activity, Menu, X } from 'lucide-react';

export default function PublicLayout() {
  const [menuOpen, setMenuOpen] = React.useState(false);
  const location = useLocation();

  const navItems = [
    { name: 'Home', path: '/' },
    { name: 'About', path: '/about' },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
      {/* Top Navbar */}
      <nav className="sticky top-0 z-50 glass-panel border-b border-slate-800/50 px-6 py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="p-2 bg-teal-500/10 rounded-lg text-teal-400 border border-teal-500/20 glow-pill">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-teal-400 to-indigo-400 bg-clip-text text-transparent">
              ArogyaVerse
            </span>
            <span className="text-xs block text-slate-400 font-mono tracking-wider">AI PUBLIC HEALTH</span>
          </div>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-8">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`text-sm font-medium tracking-wide transition-colors ${
                location.pathname === item.path ? 'text-teal-400' : 'text-slate-350 hover:text-white'
              }`}
            >
              {item.name}
            </Link>
          ))}
          <Link
            to="/login"
            className="px-5 py-2.5 rounded-lg text-sm font-medium bg-gradient-to-r from-teal-500 to-emerald-500 text-slate-950 hover:from-teal-400 hover:to-emerald-400 shadow-lg shadow-teal-500/10 transition-all transform hover:-translate-y-0.5"
          >
            Access Platform
          </Link>
        </div>

        {/* Mobile menu trigger */}
        <button
          className="md:hidden p-2 text-slate-450 hover:text-white transition-colors"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </nav>

      {/* Mobile Drawer */}
      {menuOpen && (
        <div className="md:hidden fixed inset-0 top-[73px] z-40 bg-slate-950/95 backdrop-blur-lg flex flex-col p-6 gap-6 border-t border-slate-800">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setMenuOpen(false)}
              className={`text-lg font-medium ${
                location.pathname === item.path ? 'text-teal-400' : 'text-slate-350'
              }`}
            >
              {item.name}
            </Link>
          ))}
          <Link
            to="/login"
            onClick={() => setMenuOpen(false)}
            className="w-full text-center py-3 rounded-lg text-slate-950 bg-gradient-to-r from-teal-500 to-emerald-500 font-semibold"
          >
            Access Platform
          </Link>
        </div>
      )}

      {/* Hero / Main Area */}
      <main className="flex-1 flex flex-col">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/80 py-8 px-6 text-center text-xs text-slate-500 font-mono">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-1.5 justify-center">
            <Shield className="w-4 h-4 text-teal-500" />
            <span>Secured with Advanced RBAC & National Health Data Standards</span>
          </div>
          <div>
            &copy; 2026 ArogyaVerse AI. Integrated with National Digital Health Mission & ICMR Guidelines.
          </div>
        </div>
      </footer>
    </div>
  );
}
