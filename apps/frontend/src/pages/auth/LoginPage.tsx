import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Activity, ShieldCheck, Lock, User, AlertCircle, Stethoscope, UserPlus, CheckCircle2 } from 'lucide-react';
import { authService } from '../../services/api';

export default function LoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isSignUpMode = searchParams.get('mode') === 'signup' || window.location.pathname === '/signup';

  const [mode, setMode] = useState<'login' | 'signup'>(isSignUpMode ? 'signup' : 'login');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('ROLE_CITIZEN');
  const [jurisdiction, setJurisdiction] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    if (isSignUpMode) {
      setMode('signup');
    }
  }, [isSignUpMode]);

  const handleRoleSelect = (selectedRole: string) => {
    setRole(selectedRole);
    if (mode === 'login') {
      if (selectedRole === 'ROLE_OFFICER') {
        setEmail('officer.pune@mohfw.gov.in');
        setName('Pune Health Officer');
      } else if (selectedRole === 'ROLE_ADMIN') {
        setEmail('admin.root@arogyaverse.gov.in');
        setName('System Root Admin');
      } else if (selectedRole === 'ROLE_DOCTOR') {
        setEmail('doctor@arogyamitra.demo');
        setName('Dr. Rajesh Sharma');
      } else if (selectedRole === 'ROLE_WORKER') {
        setEmail('asha.haveli@arogyamitra.gov.in');
        setName('Sunita Devi (ASHA)');
      } else {
        setEmail('citizen.rahul@gmail.com');
        setName('Rahul Verma');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccessMsg('');

    try {
      if (mode === 'signup') {
        const res = await authService.register({
          name: name.trim(),
          email: email.trim(),
          role,
          jurisdiction: jurisdiction.trim() || undefined,
        });

        if (res.success) {
          setSuccessMsg('Registration successful! Redirecting to your dashboard...');
          setTimeout(() => {
            if (role === 'ROLE_ADMIN') navigate('/admin/dashboard');
            else if (role === 'ROLE_OFFICER') navigate('/officer/dashboard');
            else if (role === 'ROLE_DOCTOR') navigate('/doctor/dashboard');
            else if (role === 'ROLE_WORKER') navigate('/worker/dashboard');
            else navigate('/citizen/dashboard');
          }, 1000);
        } else {
          setError(res.error || res.message || 'Registration failed. Please check details.');
        }
      } else {
        const res = await authService.login(email, role, name);
        if (res.success) {
          if (role === 'ROLE_ADMIN') navigate('/admin/dashboard');
          else if (role === 'ROLE_OFFICER') navigate('/officer/dashboard');
          else if (role === 'ROLE_DOCTOR') navigate('/doctor/dashboard');
          else if (role === 'ROLE_WORKER') navigate('/worker/dashboard');
          else navigate('/citizen/dashboard');
        } else {
          setError(res.message || 'Login failed. Please check credentials.');
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.error || err.response?.data?.message || 'Unable to connect to the backend server.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center p-6 bg-[#F5FAFC]">
      <div className="w-full max-w-lg bg-white rounded-3xl p-8 border border-slate-200 shadow-xl relative overflow-hidden">
        
        {/* Header Branding */}
        <div className="text-center mb-6">
          <div className="inline-flex p-3 bg-teal-50 rounded-2xl text-teal-600 border border-teal-100 mb-3 shadow-sm">
            <Activity className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-extrabold tracking-tight text-slate-900">
            Arogya<span className="text-teal-600">Mitra</span> Portal
          </h2>
          <p className="text-xs text-slate-500 mt-1 font-semibold uppercase tracking-wider">
            National Digital Healthcare Gateway
          </p>
        </div>

        {/* Mode Toggle (Sign In vs Sign Up) */}
        <div className="flex p-1 bg-slate-100 rounded-2xl mb-6">
          <button
            type="button"
            onClick={() => { setMode('login'); setError(''); setSuccessMsg(''); }}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${
              mode === 'login' 
                ? 'bg-white text-teal-700 shadow-sm' 
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => { setMode('signup'); setError(''); setSuccessMsg(''); setEmail(''); setName(''); }}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${
              mode === 'signup' 
                ? 'bg-gradient-to-r from-teal-500 to-cyan-600 text-white shadow-md' 
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Sign Up (New Account)
          </button>
        </div>

        {/* Role Selector Grid */}
        <div className="mb-6">
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Select User Role</label>
          <div className="grid grid-cols-5 gap-1.5 p-1.5 bg-[#F8FBFD] rounded-2xl border border-slate-100">
            {[
              { id: 'ROLE_CITIZEN', name: 'Citizen', icon: User, color: 'text-rose-600' },
              { id: 'ROLE_DOCTOR', name: 'Doctor', icon: Stethoscope, color: 'text-teal-600' },
              { id: 'ROLE_WORKER', name: 'ASHA', icon: Activity, color: 'text-amber-600' },
              { id: 'ROLE_OFFICER', name: 'Officer', icon: ShieldCheck, color: 'text-indigo-600' },
              { id: 'ROLE_ADMIN', name: 'Admin', icon: Lock, color: 'text-slate-700' },
            ].map((r) => {
              const Icon = r.icon;
              const isSelected = role === r.id;
              return (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => handleRoleSelect(r.id)}
                  className={`flex flex-col items-center gap-1.5 py-2.5 rounded-xl text-[10px] font-bold transition-all ${
                    isSelected
                      ? 'bg-white text-slate-900 shadow-sm border border-slate-200'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isSelected ? r.color : 'text-slate-400'}`} />
                  <span>{r.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-3">
            <AlertCircle className="w-5 h-5 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        {/* Success Alert */}
        {successMsg && (
          <div className="mb-6 p-4 rounded-2xl bg-teal-50 border border-teal-200 text-teal-800 text-xs flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 shrink-0 text-teal-600" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Full Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:border-teal-500 focus:bg-white text-slate-900 text-sm outline-none transition-all placeholder:text-slate-400 font-medium"
              placeholder="e.g. Ananya Sharma"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Email Address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:border-teal-500 focus:bg-white text-slate-900 text-sm outline-none transition-all placeholder:text-slate-400 font-medium"
              placeholder="name@example.com"
            />
          </div>

          {mode === 'signup' && (role === 'ROLE_WORKER' || role === 'ROLE_OFFICER') && (
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Jurisdiction / District</label>
              <input
                type="text"
                value={jurisdiction}
                onChange={(e) => setJurisdiction(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:border-teal-500 focus:bg-white text-slate-900 text-sm outline-none transition-all placeholder:text-slate-400 font-medium"
                placeholder="e.g. Haveli Village / Pune District"
              />
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-full bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-white font-bold text-xs uppercase tracking-wider shadow-md shadow-teal-500/20 transition-all disabled:opacity-50 mt-2 cursor-pointer"
          >
            {loading 
              ? (mode === 'signup' ? 'Registering Account...' : 'Authenticating...') 
              : (mode === 'signup' ? 'Create ArogyaMitra Account' : 'Sign In to Portal')
            }
          </button>
        </form>

        <div className="mt-6 text-center text-xs text-slate-500 font-medium">
          <p>Protected by ABHA Interoperability &amp; 256-bit Security Encryption.</p>
        </div>

      </div>
    </div>
  );
}
