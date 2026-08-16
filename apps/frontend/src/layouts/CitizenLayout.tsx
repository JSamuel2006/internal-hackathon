import React from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, Bot, ScanLine, History, MapPin, 
  Award, Bell, User, LogOut, ShieldAlert, HeartPulse, Menu, X, FileText, Sparkles, Globe, Calendar, Sliders, Clock
} from 'lucide-react';
import { authService } from '../services/api';

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

  const navItems = [
    { name: 'Dashboard', path: '/citizen/dashboard', icon: LayoutDashboard },
    { name: 'AI Health Twin', path: '/citizen/twin', icon: Sparkles },
    { name: 'AI Health Assistant', path: '/citizen/assistant', icon: Bot },
    { name: 'Medicine Scanner', path: '/citizen/scanner', icon: ScanLine },
    { name: 'Report Analyzer', path: '/citizen/report-analyzer', icon: FileText },
    { name: 'Health Timeline', path: '/citizen/timeline', icon: Clock },
    { name: 'Health History', path: '/citizen/history', icon: History },
    { name: '🚨 Emergency Response', path: '/citizen/emergency', icon: ShieldAlert },
    { name: 'Nearby Hospitals', path: '/citizen/hospitals', icon: MapPin },
    { name: 'Govt Schemes', path: '/citizen/schemes', icon: Award },
    { name: 'Health Exchange', path: '/citizen/interoperability', icon: Globe },
    { name: 'Book Appointment', path: '/citizen/book-appointment', icon: Calendar },
    { name: 'Lab Diagnostics', path: '/citizen/laboratory', icon: FileText },
  ];

  return (
    <div className="min-h-screen bg-[#030712] text-slate-100 flex flex-col md:flex-row">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex flex-col w-72 border-r border-slate-800/60 bg-slate-950/70 backdrop-blur-xl p-6 justify-between shrink-0">
        <div className="flex flex-col gap-8">
          <Link to="/citizen/dashboard" className="flex items-center gap-3">
            <div className="p-2 bg-rose-500/10 rounded-lg text-rose-400 border border-rose-500/20">
              <HeartPulse className="w-6 h-6" />
            </div>
            <div>
              <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-rose-400 to-amber-400 bg-clip-text text-transparent">
                ArogyaMitra
              </span>
              <span className="text-[10px] block text-slate-500 font-mono tracking-wider">CITIZEN PORTAL</span>
            </div>
          </Link>

          {/* Secure ABHA Card Badge */}
          <div className="p-4 rounded-xl bg-gradient-to-br from-slate-900 to-slate-950 border border-teal-500/20 shadow-md">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[9px] font-mono tracking-widest text-teal-400 uppercase font-bold">ABHA Digital Health Card</span>
              <Award className="w-3.5 h-3.5 text-teal-400" />
            </div>
            <p className="text-xs font-semibold text-slate-200">{user.name}</p>
            <p className="text-[10px] font-mono text-slate-450 mt-1">{user.abhaId}</p>
          </div>

          {/* Navigation Links */}
          <nav className="flex flex-col gap-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname.startsWith(item.path);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-rose-500/10 text-rose-400 border border-rose-500/25 shadow-sm shadow-rose-500/5'
                      : 'text-slate-400 hover:text-white hover:bg-slate-900/50'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-rose-400' : 'text-slate-450'}`} />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User profile / Logout */}
        <div className="border-t border-slate-900 pt-4 flex flex-col gap-3">
          <Link
            to="/citizen/profile"
            className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-900/40 transition-all text-left"
          >
            <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-rose-400 font-bold border border-slate-700">
              {user.name.charAt(0)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-slate-200 truncate">{user.name}</p>
              <p className="text-[10px] text-slate-500 truncate">{user.email}</p>
            </div>
          </Link>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm text-slate-450 hover:text-rose-400 hover:bg-rose-500/5 transition-all text-left w-full"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Mobile Header Bar */}
      <header className="md:hidden flex items-center justify-between px-6 py-4 bg-slate-950 border-b border-slate-900">
        <Link to="/citizen/dashboard" className="flex items-center gap-2">
          <HeartPulse className="w-5 h-5 text-rose-400" />
          <span className="font-bold text-base text-rose-400">ArogyaMitra</span>
        </Link>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-2 text-slate-400 hover:text-white"
        >
          {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </header>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 top-[60px] z-50 bg-slate-950/95 backdrop-blur-md flex flex-col p-6 gap-4 border-t border-slate-900">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname.startsWith(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 p-3 rounded-lg text-sm font-medium ${
                  isActive ? 'bg-rose-500/10 text-rose-400' : 'text-slate-400'
                }`}
              >
                <Icon className="w-4 h-4" />
                {item.name}
              </Link>
            );
          })}
          <hr className="border-slate-800" />
          <button
            onClick={() => {
              setMobileOpen(false);
              handleLogout();
            }}
            className="flex items-center gap-3 p-3 rounded-lg text-sm text-slate-400 hover:text-rose-400"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      )}

      {/* Main Panel Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <header className="hidden md:flex items-center justify-between px-8 py-5 border-b border-slate-900/60 bg-slate-950/20">
          <h1 className="text-sm font-semibold tracking-wide text-slate-350">India Citizen Digital Health</h1>
          <div className="flex items-center gap-4">
            <button className="relative p-2 rounded-lg hover:bg-slate-900 text-slate-400 hover:text-slate-200 transition-colors">
              <Bell className="w-4 h-4" />
              <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-rose-500 rounded-full"></span>
            </button>
            <div className="flex items-center gap-2 border-l border-slate-800 pl-4">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
              <span className="text-[10px] font-mono text-emerald-400">ABHA LINK ACTIVE</span>
            </div>
          </div>
        </header>

        <main className="flex-1 p-6 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
