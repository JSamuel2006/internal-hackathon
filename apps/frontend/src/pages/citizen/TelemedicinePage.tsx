import React, { useState, useEffect } from 'react';
import { Bot, RefreshCw, Sparkles, Send, Video, PhoneCall, ExternalLink, CheckCircle2, ShieldCheck, Activity } from 'lucide-react';
import axios from 'axios';
import { I18nService, t } from '../../i18n';

const API_URL = import.meta.env.VITE_API_URL || '/api/v1';

export default function TelemedicinePage() {
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentLink, setCurrentLink] = useState('');
  const [lang, setLang] = useState(I18nService.getLanguage());

  useEffect(() => {
    const unsub = I18nService.subscribe((n) => setLang(n));
    return unsub;
  }, []);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const token = sessionStorage.getItem('token');
      const res = await axios.get(`${API_URL}/telemedicine/history`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data?.success) {
        setSessions(res.data.data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleStartConsultation = async () => {
    setLoading(true);
    try {
      const token = sessionStorage.getItem('token');
      const res = await axios.post(`${API_URL}/telemedicine/create`, {
        doctorId: 'doc-default',
        appointmentId: 'app-default'
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data?.success) {
        setCurrentLink(res.data.data.meetingLink);
        fetchHistory();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-10 max-w-5xl mx-auto px-4 font-sans text-slate-800">
      
      {/* ── TWO-COLUMN HERO SECTION ──────────────────────────────────────── */}
      <div className="bg-white rounded-3xl p-8 md:p-10 border border-slate-200 shadow-md grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        
        {/* Left Column: Story & Primary CTA */}
        <div className="lg:col-span-7 space-y-5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-50 border border-teal-200 text-teal-700 text-xs font-bold uppercase tracking-wider">
            <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
            <span>OFFICIAL GOVERNMENT TELEMEDICINE</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight leading-snug">
            Connect to Healthcare,<br />Even From a Distance
          </h2>

          <p className="text-sm text-slate-600 leading-relaxed font-normal">
            Need a remote doctor consultation? ArogyaMitra provides a direct pathway to India's official eSanjeevani Telemedicine Service (Ministry of Health &amp; Family Welfare) and verified registered physicians.
          </p>

          <div className="flex flex-wrap gap-4 pt-2">
            <a
              href="https://www.esanjeevani.in/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-white font-bold text-xs uppercase tracking-wider shadow-md shadow-teal-500/20 transition-all cursor-pointer"
            >
              <span>Consult a Government Doctor</span>
              <ExternalLink className="w-4 h-4" />
            </a>

            <button
              onClick={handleStartConsultation}
              disabled={loading}
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs uppercase tracking-wider border border-slate-200 transition-all cursor-pointer disabled:opacity-50"
            >
              <Video className="w-4 h-4 text-teal-600" />
              <span>{loading ? 'Creating Consultation...' : 'Launch Video Room'}</span>
            </button>
          </div>
        </div>

        {/* Right Column: Light Blue Healthcare Card */}
        <div className="lg:col-span-5 bg-[#EEF7FA] rounded-2xl p-6 border border-teal-100 space-y-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-teal-800 uppercase tracking-wider">National Teleconsultation Gateway</span>
            <Activity className="w-4 h-4 text-teal-600" />
          </div>

          <p className="text-xs text-slate-600 leading-relaxed">
            Connect patients directly to official telemedicine services and qualified physicians across India.
          </p>

          <div className="space-y-2 pt-1 text-xs font-semibold text-slate-700">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
              <span>Remote Doctor Consultation</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
              <span>Government Doctors &amp; Specialists</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
              <span>Digital Health Access &amp; Prescriptions</span>
            </div>
          </div>

          <div className="pt-2 border-t border-teal-100 flex items-center justify-between text-[11px] text-teal-800 font-bold">
            <span>Status: Ready to Connect</span>
            <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse"></span>
          </div>
        </div>

      </div>

      {/* Active Meeting Link Output */}
      {currentLink && (
        <div className="p-5 rounded-2xl bg-teal-50 border border-teal-200 text-teal-900 text-xs flex items-center justify-between shadow-xs">
          <div>
            <span className="font-bold block text-sm">Consultation Room Active</span>
            <span className="text-xs text-teal-700">Meeting link: <a href={currentLink} target="_blank" rel="noopener noreferrer" className="underline font-mono font-bold">{currentLink}</a></span>
          </div>
          <a
            href={currentLink}
            target="_blank"
            rel="noopener noreferrer"
            className="px-5 py-2.5 rounded-full bg-teal-600 text-white font-bold text-xs hover:bg-teal-700 shadow-sm"
          >
            Enter Video Room ↗
          </a>
        </div>
      )}

      {/* ── HOW IT WORKS SECTION ─────────────────────────────────────────── */}
      <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm space-y-6">
        <h3 className="text-lg font-extrabold text-slate-900 tracking-tight">
          How It Works
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-5 rounded-2xl bg-[#F5FAFC] border border-slate-200 space-y-2">
            <span className="text-xs font-bold text-teal-600 font-mono">STEP 1</span>
            <h4 className="font-bold text-sm text-slate-900">Request Teleconsultation</h4>
            <p className="text-xs text-slate-600">Select your preferred telemedicine pathway or launch a video room.</p>
          </div>

          <div className="p-5 rounded-2xl bg-[#F5FAFC] border border-slate-200 space-y-2">
            <span className="text-xs font-bold text-teal-600 font-mono">STEP 2</span>
            <h4 className="font-bold text-sm text-slate-900">Connect with Doctor</h4>
            <p className="text-xs text-slate-600">Discuss symptoms with a certified clinician or government doctor.</p>
          </div>

          <div className="p-5 rounded-2xl bg-[#F5FAFC] border border-slate-200 space-y-2">
            <span className="text-xs font-bold text-teal-600 font-mono">STEP 3</span>
            <h4 className="font-bold text-sm text-slate-900">Receive Digital Prescription</h4>
            <p className="text-xs text-slate-600">Get your verified digital prescription directly in your health account.</p>
          </div>
        </div>
      </div>

      {/* ── IMPORTANT INFORMATION ────────────────────────────────────────── */}
      <div className="bg-amber-50 rounded-2xl p-6 border border-amber-200 text-amber-900 text-xs space-y-2">
        <h4 className="font-bold text-sm text-amber-950">Important Information</h4>
        <p className="leading-relaxed">
          eSanjeevani is India's National Telemedicine Service operated by the Ministry of Health and Family Welfare. For critical emergency cases requiring immediate physical intervention, please use the Emergency SOS helpline (108).
        </p>
      </div>

      {/* ── PREVIOUS CONSULTATIONS LOGS ──────────────────────────────────── */}
      <div className="bg-white border border-slate-200 shadow-sm p-6 rounded-3xl space-y-4">
        <h4 className="font-bold text-slate-900 text-sm">Previous Consultations</h4>
        <div className="space-y-3">
          {sessions.map((s) => (
            <div key={s.id} className="p-4 bg-[#F5FAFC] rounded-2xl border border-slate-200 flex justify-between items-center text-xs">
              <div>
                <span className="font-bold text-slate-900 block font-mono">Consultation ID: {s.id.slice(-6)}</span>
                <span className="text-[11px] text-slate-500">Created: {new Date(s.created_at).toLocaleString()}</span>
              </div>
              <span className="px-3 py-1 bg-teal-50 text-teal-700 border border-teal-200 text-[10px] font-bold rounded-full uppercase">
                {s.session_status}
              </span>
            </div>
          ))}
          {sessions.length === 0 && (
            <p className="text-slate-500 text-center py-6 text-xs">No previous video consulting logs found.</p>
          )}
        </div>
      </div>

    </div>
  );
}
export { Bot, RefreshCw, Sparkles, Send, Video, PhoneCall };
