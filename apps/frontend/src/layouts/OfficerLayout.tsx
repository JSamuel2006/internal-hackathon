import React from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { 
  ShieldCheck, LayoutDashboard, Map, Sliders, 
  Megaphone, Network, Newspaper, Cpu, FileText, 
  LogOut, Bell, Compass, Menu, X 
} from 'lucide-react';
import { authService } from '../services/api';

export default function OfficerLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const userRaw = sessionStorage.getItem('user');
  const user = userRaw ? JSON.parse(userRaw) : { name: 'Public Health Officer', role: 'ROLE_OFFICER', jurisdiction: 'Pune District' };

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  const navItems = [
    { name: 'Executive Dashboard', path: '/officer/dashboard', icon: LayoutDashboard },
    { name: 'Disease Heat Map', path: '/officer/heatmap', icon: Map },
    { name: 'Scenario Simulator', path: '/officer/simulator', icon: Sliders },
    { name: 'Campaign Generator', path: '/officer/campaigns', icon: Megaphone },
    { name: 'Knowledge Graph', path: '/officer/graph', icon: Network },
    { name: 'News Intelligence', path: '/officer/news', icon: Newspaper },
    { name: 'Digital Twin Twin', path: '/officer/digital-twin', icon: Cpu },
    { name: 'Reports Generator', path: '/officer/reports', icon: FileText },
  ];

  return (
    <div className="min-h-screen bg-[#02050d] text-slate-150 flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="hidden md:flex flex-col w-72 border-r border-slate-900 bg-slate-950/80 backdrop-blur-2xl p-6 justify-between shrink-0">
        <div className="flex flex-col gap-8">
          <Link to="/officer/dashboard" className="flex items-center gap-3">
            <div className="p-2 bg-teal-500/10 rounded-lg text-teal-400 border border-teal-500/20 glow-pill">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-teal-450 to-indigo-400 bg-clip-text text-transparent">
                ArogyaVerse
              </span>
              <span className="text-[10px] block text-slate-500 font-mono tracking-wider">OFFICER DASHBOARD</span>
            </div>
          </Link>

          {/* Officer Jurisdiction */}
          <div className="p-3.5 rounded-xl bg-slate-900/60 border border-indigo-500/10">
            <div className="flex items-center gap-2 mb-1">
              <Compass className="w-3.5 h-3.5 text-indigo-400" />
              <span className="text-[9px] font-mono tracking-widest text-slate-400 uppercase font-bold">Active Command</span>
            </div>
            <p className="text-xs font-semibold text-slate-200">{user.name}</p>
            <p className="text-[10px] font-mono text-indigo-400 mt-0.5">{user.jurisdiction || 'State Health Authority'}</p>
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
                      ? 'bg-teal-500/10 text-teal-450 border border-teal-500/25 shadow-sm shadow-teal-500/5'
                      : 'text-slate-400 hover:text-white hover:bg-slate-900/50'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-teal-450' : 'text-slate-450'}`} />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User Profile / Logout */}
        <div className="border-t border-slate-900 pt-4 flex flex-col gap-3">
          <div className="flex items-center gap-3 p-2 rounded-lg">
            <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-teal-400 font-bold border border-slate-700">
              {user.name.charAt(0)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-slate-200 truncate">{user.name}</p>
              <p className="text-[10px] text-slate-500 truncate">{user.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm text-slate-450 hover:text-teal-400 hover:bg-teal-500/5 transition-all text-left w-full"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Mobile Header Bar */}
      <header className="md:hidden flex items-center justify-between px-6 py-4 bg-slate-950 border-b border-slate-900">
        <Link to="/officer/dashboard" className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-teal-400" />
          <span className="font-bold text-base text-teal-400">ArogyaVerse</span>
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
                  isActive ? 'bg-teal-500/10 text-teal-450' : 'text-slate-400'
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
            className="flex items-center gap-3 p-3 rounded-lg text-sm text-slate-400 hover:text-teal-400"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <header className="hidden md:flex items-center justify-between px-8 py-5 border-b border-slate-900/60 bg-slate-950/30">
          <h1 className="text-sm font-semibold tracking-wide text-slate-450 uppercase font-mono">National Health Intelligence Center</h1>
          <div className="flex items-center gap-4">
            <button className="relative p-2 rounded-lg hover:bg-slate-900 text-slate-400 hover:text-slate-200 transition-colors">
              <Bell className="w-4 h-4" />
              <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-teal-500 rounded-full animate-ping"></span>
            </button>
            <div className="flex items-center gap-2 border-l border-slate-800 pl-4">
              <span className="w-2.5 h-2.5 bg-teal-500 rounded-full animate-pulse"></span>
              <span className="text-[10px] font-mono text-teal-400">INTELLIGENCE NODE ONLINE</span>
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
