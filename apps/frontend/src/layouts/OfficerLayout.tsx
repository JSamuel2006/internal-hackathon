import React from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { 
  ShieldCheck, Map, BarChart3, AlertTriangle, FileText, 
  Menu, X, LogOut, ChevronRight, Activity
} from 'lucide-react';
import { authService } from '../services/api';
import { I18nService, t } from '../i18n';
import { LanguageSelector } from '../components/voice/LanguageSelector';

export default function OfficerLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const userRaw = sessionStorage.getItem('user');
  const user = userRaw ? JSON.parse(userRaw) : { name: 'Pune Health Officer', role: 'ROLE_OFFICER', jurisdiction: 'Pune District' };

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  const [currentLang, setCurrentLang] = React.useState(I18nService.getLanguage());

  React.useEffect(() => {
    const unsub = I18nService.subscribe((lang) => {
      setCurrentLang(lang);
    });
    return unsub;
  }, []);

  const navItems = [
    { name: 'Surveillance Command', path: '/officer/dashboard', icon: ShieldCheck },
    { name: 'ASHA Field Monitoring', path: '/officer/asha-monitoring', icon: Activity },
    { name: 'Disease Surveillance', path: '/officer/surveillance', icon: BarChart3 },
    { name: 'Outbreak Heatmaps', path: '/officer/heatmaps', icon: Map },
    { name: 'Reports & Analytics', path: '/officer/reports', icon: FileText },
  ];

  return (
    <div className="h-screen bg-[#F5FAFC] text-slate-800 flex flex-col md:flex-row overflow-hidden font-sans">
      <aside className="hidden md:flex flex-col w-72 h-full border-r border-slate-200 bg-white p-5 justify-between shrink-0 shadow-xs">
        <div className="flex flex-col gap-5 overflow-y-auto flex-1 pr-1">
          <Link to="/officer/dashboard" className="flex items-center gap-3 px-2 py-1">
            <div className="p-2.5 bg-indigo-600 rounded-xl text-white shadow-md shadow-indigo-600/20">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <span className="font-extrabold text-xl tracking-tight text-slate-900">
                Arogya<span className="text-indigo-600">Mitra</span>
              </span>
              <span className="text-[10px] block text-slate-500 font-bold uppercase tracking-wider font-sans -mt-1">
                Public Health Surveillance
              </span>
            </div>
          </Link>

          <div className="p-3.5 rounded-2xl bg-[#EEF7FA] border border-indigo-100 shadow-2xs">
            <span className="text-[10px] font-bold tracking-wider text-indigo-700 uppercase">District Command</span>
            <p className="text-xs font-bold text-slate-900 truncate mt-0.5">{user.name}</p>
            <p className="text-[10px] font-mono text-slate-500 font-medium">{user.jurisdiction || 'Pune District'}</p>
          </div>

          <nav className="flex flex-col gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                    isActive
                      ? 'bg-indigo-50 text-indigo-700 border border-indigo-200/80 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 border border-transparent'
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`} />
                    <span>{item.name}</span>
                  </span>
                  {isActive && <ChevronRight className="w-3.5 h-3.5 text-indigo-600" />}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="pt-4 border-t border-slate-100 space-y-3 shrink-0">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Language</span>
            <LanguageSelector />
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-all cursor-pointer"
          >
            <LogOut className="w-4 h-4 text-rose-600" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <header className="h-16 bg-white border-b border-slate-200 px-4 md:px-8 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <button onClick={() => setMobileOpen(!mobileOpen)} className="md:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100">
              {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
            <h1 className="font-extrabold text-lg text-slate-900 tracking-tight">Public Health Surveillance Command</h1>
          </div>
          <LanguageSelector />
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-8 bg-[#F5FAFC]">
          <Outlet key={currentLang} />
        </main>
      </div>
    </div>
  );
}
