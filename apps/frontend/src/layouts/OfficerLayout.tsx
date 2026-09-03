import React from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { 
  ShieldCheck, Map, BarChart3, AlertTriangle, FileText, 
  Menu, X, LogOut, ChevronRight, Activity, Zap, Sparkles, Cpu
} from 'lucide-react';
import { authService } from '../services/api';
import { useI18n } from '../i18n';
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

  const { lang, t } = useI18n();

  const navGroups = React.useMemo(() => [
    {
      group: 'MAIN',
      items: [
        { name: t('officer_dashboard_title'), path: '/officer/dashboard', icon: ShieldCheck }
      ]
    },
    {
      group: 'SURVEILLANCE & FIELD',
      items: [
        { name: t('asha_field_monitoring'), path: '/officer/asha-monitoring', icon: Activity },
        { name: t('disease_surveillance'), path: '/officer/surveillance', icon: BarChart3 },
        { name: t('outbreak_heatmaps'), path: '/officer/heatmaps', icon: Map },
        { name: t('reports_analytics'), path: '/officer/reports', icon: FileText }
      ]
    },
    {
      group: 'ANALYTICS & SIMULATION',
      items: [
        { name: t('health_campaigns'), path: '/officer/campaigns', icon: Zap },
        { name: t('ai_health_twin'), path: '/officer/digital-twin', icon: Sparkles },
        { name: t('preventive_health_simulator'), path: '/officer/simulator', icon: Cpu }
      ]
    }
  ], [lang]);

  return (
    <div className="h-screen bg-[#F5FAFC] text-slate-800 flex flex-col md:flex-row overflow-hidden font-sans">
      <aside className="hidden md:flex flex-col w-72 h-full border-r border-slate-200 bg-white p-5 justify-between shrink-0 shadow-xs">
        <div className="flex flex-col gap-4 overflow-y-auto flex-1 pr-1">
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
            <span className="text-[10px] font-bold tracking-wider text-indigo-700 uppercase font-sans">District Command</span>
            <p className="text-xs font-bold text-slate-900 truncate mt-0.5 font-sans">{user.name}</p>
            <p className="text-[10px] font-mono text-slate-500 font-medium">{user.jurisdiction || 'Pune District'}</p>
          </div>

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
                            ? 'bg-indigo-50 text-indigo-700 border border-indigo-200/80 shadow-2xs'
                            : 'text-slate-600 hover:text-slate-900 hover:bg-indigo-50/50 border border-transparent'
                        }`}
                      >
                        <span className="flex items-center gap-2.5">
                          <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`} />
                          <span>{item.name}</span>
                        </span>
                        {isActive && <ChevronRight className="w-3.5 h-3.5 text-indigo-600" />}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>
        </div>

        <div className="pt-3 border-t border-slate-100 space-y-2.5 shrink-0">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold text-slate-500 font-sans">Language</span>
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

      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <header className="h-16 bg-white border-b border-slate-200 px-4 md:px-8 flex items-center justify-between shrink-0 font-sans">
          <div className="flex items-center gap-3">
            <button onClick={() => setMobileOpen(!mobileOpen)} className="md:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100">
              {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
            <h1 className="font-extrabold text-lg text-slate-900 tracking-tight">Public Health Surveillance Command</h1>
          </div>
          <LanguageSelector />
        </header>

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
                            isActive ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' : 'text-slate-700 hover:bg-slate-50'
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

        <main className="flex-1 overflow-y-auto p-4 md:p-8 bg-[#F5FAFC]">
          <Outlet key={lang} />
        </main>
      </div>
    </div>
  );
}
