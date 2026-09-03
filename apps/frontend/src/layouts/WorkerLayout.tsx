import React from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { 
  Users, Activity, ClipboardList, ShieldAlert, HeartPulse, 
  Menu, X, LogOut, RefreshCw, ChevronRight, CheckCircle2
} from 'lucide-react';
import { authService } from '../services/api';
import { useI18n } from '../i18n';
import { LanguageSelector } from '../components/voice/LanguageSelector';

export default function WorkerLayout() {
  const { lang, t } = useI18n();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const userRaw = sessionStorage.getItem('user');
  const user = userRaw ? JSON.parse(userRaw) : { name: 'Sunita Devi (ASHA)', role: 'ROLE_WORKER', jurisdiction: 'Haveli Village' };

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  const navItems = React.useMemo(() => [
    { name: t('asha_dashboard'), path: '/worker/dashboard', icon: Activity },
    { name: t('my_patients'), path: '/worker/patients', icon: Users },
    { name: t('field_screening'), path: '/worker/screening', icon: ClipboardList },
  ], [lang]);

  return (
    <div className="h-screen bg-[#F5FAFC] text-slate-800 flex flex-col md:flex-row overflow-hidden font-sans">
      <aside className="hidden md:flex flex-col w-72 h-full border-r border-slate-200 bg-white p-5 justify-between shrink-0 shadow-xs">
        <div className="flex flex-col gap-5 overflow-y-auto flex-1 pr-1">
          <Link to="/worker/dashboard" className="flex items-center gap-3 px-2 py-1">
            <div className="p-2.5 bg-cyan-600 rounded-xl text-white shadow-md shadow-cyan-600/20">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <span className="font-extrabold text-xl tracking-tight text-slate-900">
                Arogya<span className="text-cyan-600">Mitra</span>
              </span>
              <span className="text-[10px] block text-slate-500 font-bold uppercase tracking-wider font-sans -mt-1">
                ASHA Worker Portal
              </span>
            </div>
          </Link>

          <div className="p-3.5 rounded-2xl bg-[#EEF7FA] border border-cyan-100 shadow-2xs">
            <span className="text-[10px] font-bold tracking-wider text-cyan-700 uppercase">ASHA Jurisdiction</span>
            <p className="text-xs font-bold text-slate-900 truncate mt-0.5">{user.name}</p>
            <p className="text-[10px] font-mono text-slate-500 font-medium">{user.jurisdiction || 'Haveli Village'}</p>
          </div>

          <nav className="space-y-1">
            {navItems.map((item) => {
              const active = location.pathname === item.path || (item.path !== '/worker/dashboard' && location.pathname.startsWith(item.path));
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    active
                      ? 'bg-cyan-50 text-cyan-800 font-bold border border-cyan-200'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${active ? 'text-cyan-600' : 'text-slate-400'}`} />
                    <span>{item.name}</span>
                  </div>
                  {active && <ChevronRight className="w-3.5 h-3.5 text-cyan-600" />}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="pt-4 border-t border-slate-100 space-y-3">
          <LanguageSelector />
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 border border-rose-100 transition-all cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Mobile Top Nav */}
      <div className="md:hidden flex items-center justify-between p-4 bg-white border-b border-slate-200 shadow-xs">
        <Link to="/worker/dashboard" className="flex items-center gap-2">
          <div className="p-2 bg-cyan-600 rounded-lg text-white">
            <Users className="w-4 h-4" />
          </div>
          <span className="font-bold text-slate-900">ArogyaMitra ASHA</span>
        </Link>

        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {mobileOpen && (
        <div className="md:hidden bg-white border-b border-slate-200 p-4 space-y-2">
          {navItems.map((item) => {
            const active = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold ${
                  active ? 'bg-cyan-50 text-cyan-800 font-bold border border-cyan-200' : 'text-slate-600'
                }`}
              >
                <Icon className="w-4 h-4 text-cyan-600" />
                <span>{item.name}</span>
              </Link>
            );
          })}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
            <LanguageSelector />
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-rose-600"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto p-4 md:p-8">
        <Outlet />
      </main>
    </div>
  );
}
