import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Activity, ShieldCheck, Lock, User, AlertCircle, Stethoscope } from 'lucide-react';
import { authService } from '../../services/api';

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = React.useState('');
  const [name, setName] = React.useState('');
  const [role, setRole] = React.useState('ROLE_OFFICER'); // Default role
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');

  const handleRoleSelect = (selectedRole: string) => {
    setRole(selectedRole);
    // Pre-populate with typical credentials for demo / finale presentation
    if (selectedRole === 'ROLE_OFFICER') {
      setEmail('officer.pune@mohfw.gov.in');
      setName('Pune Health Officer');
    } else if (selectedRole === 'ROLE_ADMIN') {
      setEmail('admin.root@arogyaverse.gov.in');
      setName('System Root Admin');
    } else if (selectedRole === 'ROLE_DOCTOR') {
      setEmail('doctor@arogyamitra.demo');
      setName('Dr. Rajesh Sharma');
    } else {
      setEmail('citizen.rahul@gmail.com');
      setName('Rahul Verma');
    }
  };

  React.useEffect(() => {
    // Initial populate
    handleRoleSelect('ROLE_OFFICER');
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await authService.login(email, role, name);
      if (res.success) {
        if (role === 'ROLE_ADMIN') {
          navigate('/admin/dashboard');
        } else if (role === 'ROLE_OFFICER') {
          navigate('/officer/dashboard');
        } else if (role === 'ROLE_DOCTOR') {
          navigate('/doctor/dashboard');
        } else {
          navigate('/citizen/dashboard');
        }
      } else {
        setError(res.message || 'Login failed. Please check credentials.');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Unable to connect to the backend server.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center p-6 bg-slate-950">
      <div className="w-full max-w-lg glass-panel rounded-2xl p-8 border border-slate-800/80 shadow-2xl relative overflow-hidden">
        {/* Glowing Background Blob */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-teal-500/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl"></div>

        <div className="text-center mb-8 relative z-10">
          <div className="inline-flex p-3 bg-teal-500/10 rounded-xl text-teal-400 border border-teal-500/20 mb-3">
            <Activity className="w-8 h-8 glow-pill" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-teal-450 to-indigo-400 bg-clip-text text-transparent">
            ArogyaVerse Command Center
          </h2>
          <p className="text-xs text-slate-400 mt-1 font-mono">SECURE MULTI-ROLE FEDERATED LOG-IN</p>
        </div>

        {/* Role Switcher */}
        <div className="grid grid-cols-4 gap-1 p-1 bg-slate-900/60 rounded-xl border border-slate-800/80 mb-6 relative z-10">
          {[
            { id: 'ROLE_CITIZEN', name: 'Citizen', icon: User, color: 'text-rose-400' },
            { id: 'ROLE_DOCTOR', name: 'Doctor', icon: Stethoscope, color: 'text-amber-405' },
            { id: 'ROLE_OFFICER', name: 'Officer', icon: ShieldCheck, color: 'text-teal-400' },
            { id: 'ROLE_ADMIN', name: 'Admin', icon: Lock, color: 'text-indigo-400' },
          ].map((r) => {
            const Icon = r.icon;
            const isSelected = role === r.id;
            return (
              <button
                key={r.id}
                type="button"
                onClick={() => handleRoleSelect(r.id)}
                className={`flex flex-col items-center gap-1.5 py-2.5 rounded-lg text-[10px] font-semibold tracking-wide transition-all ${
                  isSelected
                    ? 'bg-slate-950 text-white shadow-md border border-slate-800/40'
                    : 'text-slate-450 hover:text-slate-200'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isSelected ? r.color : 'text-slate-500'}`} />
                {r.name}
              </button>
            );
          })}
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-455 text-xs flex items-center gap-3 relative z-10 animate-shake">
            <AlertCircle className="w-5 h-5 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5 relative z-10">
          <div>
            <label className="block text-xs font-mono tracking-wider text-slate-400 uppercase mb-2">Full Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-slate-900/50 border border-slate-800 focus:border-teal-500/50 focus:ring-1 focus:ring-teal-500/50 text-slate-100 text-sm outline-none transition-all placeholder:text-slate-600"
              placeholder="e.g. Rahul Verma"
            />
          </div>

          <div>
            <label className="block text-xs font-mono tracking-wider text-slate-400 uppercase mb-2">Email Address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-slate-900/50 border border-slate-800 focus:border-teal-500/50 focus:ring-1 focus:ring-teal-500/50 text-slate-100 text-sm outline-none transition-all placeholder:text-slate-600"
              placeholder="name@health.gov.in"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-teal-500 to-indigo-500 text-slate-950 font-bold hover:from-teal-400 hover:to-indigo-400 transition-all shadow-lg shadow-teal-500/10 disabled:opacity-50 text-sm"
          >
            {loading ? 'Authenticating credentials...' : 'Enter Platform Command'}
          </button>
        </form>

        <div className="mt-6 text-center text-xs text-slate-550 font-mono">
          <p>Secure login session expires automatically in 24 hours.</p>
        </div>
      </div>
    </div>
  );
}
