import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  Activity, ShieldCheck, Lock, User, AlertCircle, Stethoscope, 
  CheckCircle2, XCircle, ArrowRight, ArrowLeft, Eye, EyeOff
} from 'lucide-react';
import { authService } from '../../services/api';
import { I18nService, t } from '../../i18n';
import { ArogyaMitraIcon } from '../../components/ArogyaMitraLogo';

export default function LoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isSignUpMode = searchParams.get('mode') === 'signup' || window.location.pathname === '/signup';

  const [mode, setMode] = useState<'login' | 'signup'>(isSignUpMode ? 'signup' : 'login');
  const [lang, setLang] = useState(I18nService.getLanguage());

  // Common & Input States
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  // Signup Flow States
  const [accountType, setAccountType] = useState<'CITIZEN' | 'DOCTOR' | 'ASHA' | 'OFFICER'>('CITIZEN');
  const [name, setName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [professionalId, setProfessionalId] = useState('');
  const [jurisdiction, setJurisdiction] = useState('');

  // Step Wizard State for Registration (1: Type, 2: Personal Details, 3: Verify ID, 4: Complete)
  const [step, setStep] = useState<number>(1);
  
  // Verification State
  const [verifying, setVerifying] = useState(false);
  const [isVerified, setIsVerified] = useState<boolean | null>(null);
  const [verificationRecord, setVerificationRecord] = useState<any>(null);

  // Status & Error Messages
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Role selection state for Sign In (default ROLE_CITIZEN)
  const [loginRole, setLoginRole] = useState('ROLE_CITIZEN');

  useEffect(() => {
    const unsub = I18nService.subscribe((n) => setLang(n));
    return unsub;
  }, []);

  useEffect(() => {
    if (isSignUpMode) {
      setMode('signup');
    }
  }, [isSignUpMode]);

  // Demo helper: Auto-fill demo credentials based on role selection
  const handleLoginRoleSelect = (r: string) => {
    setLoginRole(r);
    if (r === 'ROLE_OFFICER') {
      setEmail('officer.pune@mohfw.gov.in');
      setPassword('password123');
      setName('Pune Health Officer');
    } else if (r === 'ROLE_ADMIN') {
      setEmail('admin.root@arogyaverse.gov.in');
      setPassword('adminPass123');
      setName('System Root Admin');
    } else if (r === 'ROLE_DOCTOR') {
      setEmail('doctor@arogyamitra.demo');
      setPassword('docPass123');
      setName('Dr. Rajesh Sharma');
    } else if (r === 'ROLE_WORKER') {
      setEmail('asha.haveli@arogyamitra.gov.in');
      setPassword('ashaPass123');
      setName('Sunita Devi (ASHA)');
    } else {
      setEmail('citizen.rahul@gmail.com');
      setPassword('citizenPass123');
      setName('Rahul Verma');
    }
  };

  const handleVerifyIdClick = async () => {
    if (!professionalId.trim()) {
      setError(`Please enter your ${accountType === 'DOCTOR' ? 'Doctor ID' : accountType === 'ASHA' ? 'ASHA ID' : 'Officer ID'}.`);
      return;
    }
    setVerifying(true);
    setError('');
    setIsVerified(null);

    try {
      const res = await authService.verifyId(accountType, professionalId.trim());
      if (res.success && res.verified) {
        setIsVerified(true);
        setVerificationRecord(res.data);
        if (res.data?.name && !name) {
          setName(res.data.name);
        }
        if (res.data?.jurisdiction && !jurisdiction) {
          setJurisdiction(res.data.jurisdiction);
        }
      } else {
        setIsVerified(false);
        setError(res.error || 'Identity verification failed.');
      }
    } catch (err: any) {
      setIsVerified(false);
      setError(err.response?.data?.error || 'Identity verification failed in the Authorized Prototype Registry.');
    } finally {
      setVerifying(false);
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email.trim()) {
      setError('Please enter a valid email address.');
      return;
    }
    if (!password) {
      setError('Please enter your password.');
      return;
    }

    setLoading(true);

    try {
      const res = await authService.login(email.trim(), password, loginRole, name.trim() || undefined);
      if (res.success) {
        if (loginRole === 'ROLE_ADMIN') navigate('/admin/dashboard');
        else if (loginRole === 'ROLE_OFFICER') navigate('/officer/dashboard');
        else if (loginRole === 'ROLE_DOCTOR') navigate('/doctor/dashboard');
        else if (loginRole === 'ROLE_WORKER') navigate('/worker/dashboard');
        else navigate('/citizen/dashboard');
      } else {
        setError(res.message || 'Sign in failed. Please check your email and password.');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.response?.data?.error || 'Unable to sign in. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignUpSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Full name is required.');
      return;
    }
    if (!email.trim()) {
      setError('Email address is required.');
      return;
    }
    if (!password) {
      setError('Password is required.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (accountType !== 'CITIZEN' && !isVerified) {
      setError(`Please verify your ${accountType} ID in the Authorized Prototype Registry before completing registration.`);
      return;
    }

    setLoading(true);
    setSuccessMsg('');

    try {
      const res = await authService.register({
        name: name.trim(),
        email: email.trim(),
        accountType,
        professionalId: professionalId.trim() || undefined,
        jurisdiction: jurisdiction.trim() || undefined,
        password,
      });

      if (res.success) {
        setSuccessMsg('Account created successfully! Redirecting to workspace...');
        setTimeout(() => {
          const userRole = res.data?.user?.role;
          if (userRole === 'ROLE_ADMIN') navigate('/admin/dashboard');
          else if (userRole === 'ROLE_OFFICER') navigate('/officer/dashboard');
          else if (userRole === 'ROLE_DOCTOR') navigate('/doctor/dashboard');
          else if (userRole === 'ROLE_WORKER') navigate('/worker/dashboard');
          else navigate('/citizen/dashboard');
        }, 1200);
      } else {
        setError(res.error || res.message || 'Registration failed.');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || err.response?.data?.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center p-6 bg-[#F5FAFC]">
      <div className="w-full max-w-lg bg-white rounded-3xl p-8 border border-slate-200 shadow-sm relative overflow-hidden">
        
        {/* Header Branding */}
        <div className="text-center mb-6">
          <div className="inline-flex justify-center mb-3">
            <ArogyaMitraIcon size={56} />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            {mode === 'login' ? t('auth_signin_heading') : t('auth_signup_heading')}
          </h2>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            {mode === 'login' ? t('auth_signin_subtitle') : t('auth_signup_subtitle')}
          </p>
        </div>

        {/* Mode Selector Toggle (Sign In vs Sign Up) */}
        <div className="flex p-1 bg-slate-100 rounded-2xl mb-6">
          <button
            type="button"
            onClick={() => { setMode('login'); setError(''); setSuccessMsg(''); setStep(1); }}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              mode === 'login' 
                ? 'bg-white text-teal-700 shadow-2xs' 
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {t('auth_mode_signin')}
          </button>
          <button
            type="button"
            onClick={() => { setMode('signup'); setError(''); setSuccessMsg(''); setStep(1); }}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              mode === 'signup' 
                ? 'bg-teal-600 text-white shadow-2xs' 
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {t('auth_mode_signup')}
          </button>
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

        {/* ── SIGN IN MODE ──────────────────────────────────────────────── */}
        {mode === 'login' && (
          <div>
            {/* Quick Account Type Switcher */}
            <div className="mb-6">
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">
                {t('auth_select_role')}
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 p-1.5 bg-[#F5FAFC] rounded-2xl border border-slate-200/80">
                {[
                  { id: 'ROLE_CITIZEN', name: 'Citizen', icon: User, color: 'text-teal-600' },
                  { id: 'ROLE_DOCTOR', name: 'Doctor', icon: Stethoscope, color: 'text-teal-600' },
                  { id: 'ROLE_WORKER', name: 'ASHA', icon: Activity, color: 'text-teal-600' },
                  { id: 'ROLE_OFFICER', name: 'Officer', icon: ShieldCheck, color: 'text-teal-600' },
                  { id: 'ROLE_ADMIN', name: 'Admin', icon: Lock, color: 'text-slate-700' },
                ].map((r) => {
                  const Icon = r.icon;
                  const isSelected = loginRole === r.id;
                  return (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => handleLoginRoleSelect(r.id)}
                      className={`flex flex-col items-center gap-1.5 py-2.5 rounded-xl text-[10px] font-bold transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-white text-slate-900 shadow-2xs border border-slate-200'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      <Icon className={`w-4 h-4 ${isSelected ? r.color : 'text-slate-500'}`} />
                      <span>{r.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  {t('auth_email_address')} *
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl bg-white border border-slate-200 focus:border-teal-600 text-slate-900 text-sm outline-none transition-all"
                  placeholder="name@example.com"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-slate-700">
                    {t('auth_password')} *
                  </label>
                  <button type="button" onClick={() => setError('Password reset instructions sent to registered mobile/email.')} className="text-xs text-teal-600 font-semibold hover:underline">
                    {t('auth_forgot_password')}
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl bg-white border border-slate-200 focus:border-teal-600 text-slate-900 text-sm outline-none transition-all pr-11"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-2xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs uppercase tracking-wider shadow-2xs transition-all disabled:opacity-50 mt-2 cursor-pointer"
              >
                {loading ? 'Authenticating...' : t('auth_btn_signin_portal')}
              </button>
            </form>
          </div>
        )}

        {/* ── SIGN UP MODE (Multi-Step Wizard) ─────────────────────────── */}
        {mode === 'signup' && (
          <div>
            {/* Step Wizard Indicator */}
            <div className="flex items-center justify-between mb-6 border-b border-slate-100 pb-4 text-xs font-bold text-slate-500">
              <span className={step === 1 ? 'text-teal-600 font-bold' : ''}>1. Account Type</span>
              <span>→</span>
              <span className={step === 2 ? 'text-teal-600 font-bold' : ''}>2. Details</span>
              {accountType !== 'CITIZEN' && (
                <>
                  <span>→</span>
                  <span className={step === 3 ? 'text-teal-600 font-bold' : ''}>3. Verify ID</span>
                </>
              )}
            </div>

            {/* STEP 1: Choose Account Type */}
            {step === 1 && (
              <div className="space-y-4">
                <p className="text-xs font-semibold text-slate-700 uppercase tracking-wider">{t('auth_account_type_question')}</p>

                <div className="grid grid-cols-1 gap-3">
                  {[
                    { id: 'CITIZEN', title: 'Citizen Account', desc: 'For individuals seeking AI health advice, medicine scanning, and health records.', icon: User, color: 'text-rose-600 bg-rose-50 border-rose-100' },
                    { id: 'DOCTOR', title: 'Doctor Account', desc: 'For licensed clinicians & medical specialists. Requires Doctor ID verification.', icon: Stethoscope, color: 'text-teal-600 bg-teal-50 border-teal-100' },
                    { id: 'ASHA', title: 'ASHA Field Worker Account', desc: 'For community health workers conducting field screenings. Requires ASHA ID.', icon: Activity, color: 'text-amber-600 bg-amber-50 border-amber-100' },
                    { id: 'OFFICER', title: 'Public Health Officer', desc: 'For district surveillance & health officers. Requires Officer ID.', icon: ShieldCheck, color: 'text-indigo-600 bg-indigo-50 border-indigo-100' },
                  ].map((opt) => {
                    const Icon = opt.icon;
                    const isSelected = accountType === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => {
                          setAccountType(opt.id as any);
                          setIsVerified(null);
                          setProfessionalId('');
                          setError('');
                        }}
                        className={`p-4 rounded-2xl border text-left flex items-start gap-3.5 transition-all cursor-pointer ${
                          isSelected 
                            ? 'border-teal-600 bg-teal-50/50 shadow-2xs' 
                            : 'border-slate-200 hover:border-slate-300 bg-white'
                        }`}
                      >
                        <div className={`p-2.5 rounded-xl border shrink-0 ${opt.color}`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="font-bold text-sm text-slate-900">{opt.title}</h4>
                          <p className="text-xs text-slate-500 mt-0.5">{opt.desc}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>

                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="w-full py-3.5 rounded-2xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs uppercase tracking-wider shadow-2xs mt-4 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Continue to Details</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* STEP 2: Enter Personal Details */}
            {step === 2 && (
              <form onSubmit={(e) => { e.preventDefault(); if (accountType === 'CITIZEN') handleSignUpSubmit(e); else setStep(3); }} className="space-y-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Account Details ({accountType})</span>
                  <button type="button" onClick={() => setStep(1)} className="text-xs font-semibold text-teal-600 hover:underline flex items-center gap-1">
                    <ArrowLeft className="w-3.5 h-3.5" /> Back
                  </button>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">{t('auth_full_name')} *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl bg-white border border-slate-200 focus:border-teal-600 text-slate-900 text-sm outline-none transition-all"
                    placeholder="e.g. Ananya Sharma"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">{t('auth_email_address')} *</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl bg-white border border-slate-200 focus:border-teal-600 text-slate-900 text-sm outline-none transition-all"
                    placeholder="name@example.com"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">{t('auth_password')} *</label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl bg-white border border-slate-200 focus:border-teal-600 text-slate-900 text-sm outline-none transition-all"
                    placeholder="••••••••"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">{t('auth_confirm_password')} *</label>
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl bg-white border border-slate-200 focus:border-teal-600 text-slate-900 text-sm outline-none transition-all"
                    placeholder="••••••••"
                  />
                </div>

                {accountType === 'CITIZEN' ? (
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3.5 rounded-2xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs uppercase tracking-wider shadow-2xs mt-4 cursor-pointer"
                  >
                    {loading ? 'Creating Account...' : t('auth_btn_create_account')}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setStep(3)}
                    className="w-full py-3.5 rounded-2xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs uppercase tracking-wider shadow-2xs mt-4 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>Next: Verify Professional ID</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}
              </form>
            )}

            {/* STEP 3: Verify Professional ID (Doctor / ASHA / Officer) */}
            {step === 3 && accountType !== 'CITIZEN' && (
              <div className="space-y-5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Identity Verification ({accountType})</span>
                  <button type="button" onClick={() => setStep(2)} className="text-xs font-semibold text-teal-600 hover:underline flex items-center gap-1">
                    <ArrowLeft className="w-3.5 h-3.5" /> Back
                  </button>
                </div>

                <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-sans leading-relaxed">
                  {t('auth_prototype_notice')}
                  <div className="font-mono text-[11px] mt-1 font-bold">
                    {accountType === 'DOCTOR' && 'DOC-1001, DOC-1002, DOC-1003, DOC-1004'}
                    {accountType === 'ASHA' && 'ASHA-2001, ASHA-2002, ASHA-2003, ASHA-2004'}
                    {accountType === 'OFFICER' && 'OFF-3001, OFF-3002, OFF-3003, OFF-3004'}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    {t('auth_prof_id')} *
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      required
                      value={professionalId}
                      onChange={(e) => { setProfessionalId(e.target.value); setIsVerified(null); setError(''); }}
                      className="flex-1 px-4 py-3 rounded-2xl bg-white border border-slate-200 focus:border-teal-600 text-slate-900 text-sm outline-none font-mono font-bold uppercase"
                      placeholder={accountType === 'DOCTOR' ? 'e.g. DOC-1001' : accountType === 'ASHA' ? 'e.g. ASHA-2001' : 'e.g. OFF-3001'}
                    />
                    <button
                      type="button"
                      disabled={verifying}
                      onClick={handleVerifyIdClick}
                      className="px-5 py-3 rounded-2xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs uppercase tracking-wider shadow-2xs cursor-pointer disabled:opacity-50 shrink-0"
                    >
                      {verifying ? t('auth_verifying') : t('auth_verify_button')}
                    </button>
                  </div>
                </div>

                {isVerified === true && verificationRecord && (
                  <div className="p-4 rounded-2xl bg-teal-50 border border-teal-200 text-teal-800 text-xs space-y-1">
                    <div className="flex items-center gap-2 font-bold text-teal-700">
                      <CheckCircle2 className="w-5 h-5 text-teal-600" />
                      <span>{t('auth_verified_badge')}</span>
                    </div>
                    <p className="text-xs font-medium text-teal-900 pt-1">
                      Matched: <strong>{verificationRecord.name}</strong> ({verificationRecord.title})
                    </p>
                  </div>
                )}

                {isVerified === false && (
                  <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2 font-bold">
                    <XCircle className="w-5 h-5 text-rose-600 shrink-0" />
                    <span>{t('auth_failed_badge')}</span>
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => handleSignUpSubmit()}
                  disabled={loading || !isVerified}
                  className="w-full py-3.5 rounded-2xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs uppercase tracking-wider shadow-2xs mt-4 cursor-pointer disabled:opacity-50"
                >
                  {loading ? 'Creating Verified Account...' : t('auth_btn_create_account')}
                </button>
              </div>
            )}
          </div>
        )}

        <div className="mt-6 text-center text-xs text-slate-500 font-medium border-t border-slate-100 pt-4">
          <p>Protected by ABHA Interoperability &amp; 256-bit Security Encryption.</p>
        </div>

      </div>
    </div>
  );
}
