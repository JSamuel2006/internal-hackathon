import React from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, Bot, ScanLine, History, MapPin, 
  Award, Bell, User, LogOut, ShieldAlert, HeartPulse, Menu, X, FileText, Sparkles, Globe, Calendar, Sliders, Clock, ChevronRight
} from 'lucide-react';
import { authService } from '../services/api';
import { useI18n } from '../i18n';
import { LanguageSelector } from '../components/voice/LanguageSelector';

export default function CitizenLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const userRaw = sessionStorage.getItem('user');
  const user = userRaw ? JSON.parse(userRaw) : { name: 'Citizen Profile', role: 'ROLE_CITIZEN', abhaId: 'ABHA-91-8842-1029-4410' };

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  const { lang, t } = useI18n();

  const navGroups = React.useMemo(() => [
    {
      group: 'MAIN',
      items: [
        { name: t('dashboard'), path: '/citizen/dashboard', icon: LayoutDashboard }
      ]
    },
    {
      group: 'HEALTH RECORDS',
      items: [
        { name: t('health_timeline'), path: '/citizen/timeline', icon: Clock },
        { name: t('health_history'), path: '/citizen/history', icon: History },
        { name: t('lab_diagnostics'), path: '/citizen/laboratory', icon: FileText }
      ]
    },
    {
      group: 'HEALTH TOOLS',
      items: [
        { name: t('ai_health_assistant'), path: '/citizen/assistant', icon: Bot },
        { name: t('ai_health_twin'), path: '/citizen/twin', icon: Sparkles },
        { name: t('medicine_scanner'), path: '/citizen/scanner', icon: ScanLine },
        { name: t('report_analyzer'), path: '/citizen/report-analyzer', icon: FileText }
      ]
    },
    {
      group: 'CARE & TELEMEDICINE',
      items: [
        { name: t('offline_healthcare'), path: '/citizen/offline-health', icon: HeartPulse },
        { name: t('emergency_response'), path: '/citizen/emergency', icon: ShieldAlert },
        { name: t('nearby_hospitals'), path: '/citizen/hospitals', icon: MapPin },
        { name: t('book_appointment'), path: '/citizen/book-appointment', icon: Calendar }
      ]
    },
    {
      group: 'SERVICES',
      items: [
        { name: t('govt_schemes'), path: '/citizen/schemes', icon: Award },
        { name: t('health_exchange'), path: '/citizen/interoperability', icon: Globe }
      ]
    }
  ], [lang]);

  return (
    <div className="h-screen bg-[#F5FAFC] text-slate-800 flex flex-col md:flex-row overflow-hidden font-sans selection:bg-teal-500 selection:text-white">
      
      {/* ── DESKTOP SIDEBAR (White Healthcare Design) ───────────────────── */}
      <aside className="hidden md:flex flex-col w-72 h-full border-r border-slate-200 bg-white p-5 justify-between shrink-0 overflow-hidden shadow-xs">
        <div className="flex flex-col gap-4 overflow-y-auto flex-1 pr-1">
          
          {/* Logo Branding */}
          <Link to="/citizen/dashboard" className="flex items-center gap-3 group px-2 py-1">
            <div className="p-2.5 bg-gradient-to-tr from-teal-500 to-cyan-500 rounded-xl text-white shadow-md shadow-teal-500/20 group-hover:scale-105 transition-transform">
              <HeartPulse className="w-5 h-5" />
            </div>
            <div>
              <span className="font-extrabold text-xl tracking-tight text-slate-900 group-hover:text-teal-600 transition-colors">
                Arogya<span className="text-teal-600">Mitra</span>
              </span>
              <span className="text-[10px] block text-slate-500 font-bold uppercase tracking-wider font-sans -mt-1">
                Citizen Care Portal
              </span>
            </div>
          </Link>

          {/* Secure ABHA Card Badge */}
          <div className="p-3.5 rounded-2xl bg-[#EEF7FA] border border-teal-100 shadow-2xs">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-bold tracking-wider text-teal-700 uppercase font-sans">ABHA Health ID</span>
              <Award className="w-3.5 h-3.5 text-teal-600" />
            </div>
            <p className="text-xs font-bold text-slate-900 truncate font-sans">{user.name}</p>
            <p className="text-[10px] font-mono text-slate-500 font-medium mt-0.5">{user.abhaId}</p>
          </div>

          {/* Grouped Navigation Links */}
          <nav className="flex flex-col gap-4 pt-1">
            {navGroups.map((g) => (
              <div key={g.group} className="space-y-1">
                <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase font-sans px-3 block">
                  {g.group}
                </span>
                <div className="flex flex-col gap-0.5">
                  {g.items.map((item) => {
                    const Icon = item.icon;
                    const isActive = location.pathname.startsWith(item.path);
                    return (
                      <Link
                        key={item.path}
                        to={item.path}
                        className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all font-sans ${
                          isActive
                            ? 'bg-teal-50 text-teal-700 border border-teal-200/80 shadow-2xs'
                            : 'text-slate-600 hover:text-slate-900 hover:bg-teal-50/50 border border-transparent'
                        }`}
                      >
                        <span className="flex items-center gap-2.5">
                          <Icon className={`w-4 h-4 ${isActive ? 'text-teal-600' : 'text-slate-400'}`} />
                          <span>{item.name}</span>
                        </span>
                        {isActive && <ChevronRight className="w-3.5 h-3.5 text-teal-600" />}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>
        </div>

        {/* Sidebar Footer: Language & Logout */}
        <div className="pt-3 border-t border-slate-100 space-y-2.5 shrink-0">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold text-slate-600 font-sans">Language</span>
            <LanguageSelector />
          </div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-all cursor-pointer font-sans"
          >
            <LogOut className="w-4 h-4 text-rose-600" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* ── MAIN CONTENT WRAPPER ────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-slate-200 px-4 md:px-8 flex items-center justify-between shrink-0 shadow-2xs font-sans">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100"
            >
              {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
            <h1 className="font-extrabold text-lg text-slate-900 tracking-tight font-sans">
              ArogyaMitra Healthcare Portal
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/citizen/emergency"
              className="hidden sm:flex items-center gap-1.5 px-4 py-2 rounded-full bg-rose-600 hover:bg-rose-700 text-white text-xs font-extrabold shadow-md transition-all font-sans"
            >
              <ShieldAlert className="w-4 h-4 text-white" />
              <span>Emergency SOS</span>
            </Link>
            <div className="hidden md:block">
              <LanguageSelector />
            </div>
          </div>
        </header>

        {/* Mobile Navigation Drawer */}
        {mobileOpen && (
          <div className="md:hidden fixed inset-0 top-16 z-50 bg-white p-6 overflow-y-auto flex flex-col justify-between font-sans">
            <div className="flex flex-col gap-4">
              {navGroups.map((g) => (
                <div key={g.group} className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{g.group}</span>
                  <div className="flex flex-col gap-1">
                    {g.items.map((item) => {
                      const Icon = item.icon;
                      const isActive = location.pathname.startsWith(item.path);
                      return (
                        <Link
                          key={item.path}
                          to={item.path}
                          onClick={() => setMobileOpen(false)}
                          className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold ${
                            isActive ? 'bg-teal-50 text-teal-700 border border-teal-200' : 'text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                          <span>{item.name}</span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
            <div className="pt-6 border-t border-slate-100">
              <button
                onClick={handleLogout}
                className="w-full py-3 rounded-xl bg-rose-50 text-rose-700 font-bold text-sm"
              >
                Sign Out
              </button>
            </div>
          </div>
        )}

        {/* Dynamic Page Outlet */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 bg-[#F5FAFC]">
          <Outlet />
        </main>
      </div>

    </div>
  );
}
