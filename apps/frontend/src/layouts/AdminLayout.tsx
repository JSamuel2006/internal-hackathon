import React from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { 
  Lock, LayoutDashboard, Users, Activity, 
  ScrollText, Settings, LogOut, Bell, Menu, X 
} from 'lucide-react';
import { authService } from '../services/api';

export default function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const userRaw = sessionStorage.getItem('user');
  const user = userRaw ? JSON.parse(userRaw) : { name: 'System Administrator', role: 'ROLE_ADMIN' };

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  const navItems = [
    { name: 'Console Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
    { name: 'User Management', path: '/admin/users', icon: Users },
    { name: 'System Monitoring', path: '/admin/monitoring', icon: Activity },
    { name: 'Audit Logs', path: '/admin/audit-logs', icon: ScrollText },
    { name: 'Settings', path: '/admin/settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-[#070509] text-slate-100 flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="hidden md:flex flex-col w-72 border-r border-slate-900 bg-slate-950/80 backdrop-blur-2xl p-6 justify-between shrink-0">
        <div className="flex flex-col gap-8">
          <Link to="/admin/dashboard" className="flex items-center gap-3">
            <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-400 border border-indigo-500/20 glow-pill">
              <Lock className="w-6 h-6" />
            </div>
            <div>
              <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                Arogya Admin
              </span>
              <span className="text-[10px] block text-slate-500 font-mono tracking-wider">ROOT ACCESS</span>
            </div>
          </Link>

          {/* Nav list */}
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
                      ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/25 shadow-sm shadow-indigo-500/5'
                      : 'text-slate-400 hover:text-white hover:bg-slate-900/50'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-400' : 'text-slate-450'}`} />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User profile / Logout */}
        <div className="border-t border-slate-900 pt-4 flex flex-col gap-3">
          <div className="flex items-center gap-3 p-2 rounded-lg">
            <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-indigo-400 font-bold border border-slate-700">
              A
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-slate-200 truncate">{user.name}</p>
              <p className="text-[10px] text-slate-500 truncate">System Root Node</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm text-slate-450 hover:text-indigo-455 hover:bg-indigo-500/5 transition-all text-left w-full"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Mobile Header Bar */}
      <header className="md:hidden flex items-center justify-between px-6 py-4 bg-slate-950 border-b border-slate-900">
        <Link to="/admin/dashboard" className="flex items-center gap-2">
          <Lock className="w-5 h-5 text-indigo-400" />
          <span className="font-bold text-base text-indigo-400">Arogya Admin</span>
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
                  isActive ? 'bg-indigo-500/10 text-indigo-400' : 'text-slate-400'
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
            className="flex items-center gap-3 p-3 rounded-lg text-sm text-slate-450 hover:text-indigo-455"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <header className="hidden md:flex items-center justify-between px-8 py-5 border-b border-slate-900/60 bg-slate-950/20">
          <h1 className="text-sm font-semibold tracking-wide text-slate-450 uppercase font-mono">Platform Infrastructure Console</h1>
          <div className="flex items-center gap-4">
            <button className="relative p-2 rounded-lg hover:bg-slate-900 text-slate-450 hover:text-slate-250 transition-colors">
              <Bell className="w-4 h-4" />
              <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-indigo-500 rounded-full animate-ping"></span>
            </button>
            <div className="flex items-center gap-2 border-l border-slate-800 pl-4">
              <span className="w-2.5 h-2.5 bg-indigo-500 rounded-full animate-pulse"></span>
              <span className="text-[10px] font-mono text-indigo-400 font-bold">ROOT SESSION SECURED</span>
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
