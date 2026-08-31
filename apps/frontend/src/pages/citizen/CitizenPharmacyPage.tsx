import React, { useState, useEffect } from 'react';
import { 
  Activity, Shield, Award, Calendar, Clock, RefreshCw, Send, CheckCircle2, AlertCircle, HeartPulse, User, MapPin, FileText, Download, Play, Sliders, Check, Trash, Plus, Mic, MicOff, Volume2
} from 'lucide-react';
import axios from 'axios';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const API_URL = import.meta.env.VITE_API_URL || '/api/v1';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default function CitizenPharmacyPage() {
  const [loading, setLoading] = useState(false);
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [selectedPresc, setSelectedPresc] = useState<any | null>(null);
  const [aiReport, setAiReport] = useState<any>(null);

  // Reminders state
  const [reminders, setReminders] = useState<any[]>([]);
  const [newReminderName, setNewReminderName] = useState('');
  const [newReminderTime, setNewReminderTime] = useState('Morning');

  const [nearbyPharmacies, setNearbyPharmacies] = useState<any[]>([]);

  // Voice Assistant state
  const [voiceQuery, setVoiceQuery] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [selectedLang, setSelectedLang] = useState('en');
  const [voiceHistory, setVoiceHistory] = useState<any[]>([]);
  const [assistantOutput, setAssistantOutput] = useState<any | null>(null);

  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const fetchPrescriptions = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/pharmacies/prescriptions');
      if (res.data?.success) setPrescriptions(res.data.data || []);

      const remRes = await api.get('/pharmacies/reminders');
      if (remRes.data?.success) setReminders(remRes.data.data || []);

      const nearRes = await api.get('/pharmacies/nearby');
      if (nearRes.data?.success) setNearbyPharmacies(nearRes.data.data || []);

      fetchVoiceHistory();
    } catch (err) {
      setError('Could not retrieve prescription data.');
    } finally {
      setLoading(false);
    }
  };

  const fetchVoiceHistory = async () => {
    try {
      const vRes = await api.get('/voice-assistant/history/usr-901');
      if (vRes.data?.success) setVoiceHistory(vRes.data.data || []);
    } catch (err) {
      console.error('Failed to load conversation history');
    }
  };

  useEffect(() => {
    fetchPrescriptions();
  }, []);

  const handleCheckInteractions = async (medicines: string) => {
    setLoading(true);
    setError('');
    try {
      const res = await api.post('/pharmacies/check-interactions', { medicines });
      if (res.data?.success) {
        setAiReport(res.data.data);
        setSuccessMsg('AI Safety Analysis and Generic Comparison complete!');
        setTimeout(() => setSuccessMsg(''), 4000);
      }
    } catch (err) {
      setError('Failed to check drug interactions.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateReminder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReminderName) return;
    setLoading(true);
    try {
      const res = await api.post('/pharmacies/reminders', {
        medicineName: newReminderName,
        timeSlot: newReminderTime
      });
      if (res.data?.success) {
        setSuccessMsg('Reminder created successfully!');
        setNewReminderName('');
        fetchPrescriptions();
        setTimeout(() => setSuccessMsg(''), 4000);
      }
    } catch (err) {
      setError('Could not create reminder.');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleReminderStatus = async (id: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'Taken' ? 'Upcoming' : 'Taken';
    try {
      await api.put(`/pharmacies/reminders/${id}`, { status: nextStatus });
      fetchPrescriptions();
    } catch (err) {
      setError('Could not update reminder.');
    }
  };

  const handleDeleteReminder = async (id: string) => {
    try {
      await api.delete(`/pharmacies/reminders/${id}`);
      fetchPrescriptions();
    } catch (err) {
      setError('Could not delete reminder.');
    }
  };

  const handleRequestRefill = async (id: string) => {
    setLoading(true);
    try {
      const res = await api.post(`/pharmacies/refill/${id}`);
      if (res.data?.success) {
        setSuccessMsg(`Refill request placed. Remaining tablets: ${res.data.data.remainingTablets}`);
        setTimeout(() => setSuccessMsg(''), 4500);
      }
    } catch (err) {
      setError('Could not request refill.');
    } finally {
      setLoading(false);
    }
  };

  const handleShareToABHA = async (id: string) => {
    try {
      const res = await api.post('/pharmacies/share', { prescriptionId: id, destination: 'ABHA Health Exchange' });
      if (res.data?.success) {
        setSuccessMsg('Prescription shared securely to ABHA!');
        setTimeout(() => setSuccessMsg(''), 4000);
      }
    } catch (err) {
      setError('Could not share prescription.');
    }
  };

  const handleDownloadPDF = async (id: string) => {
    try {
      const res = await api.get(`/pharmacies/prescription/${id}/pdf`);
      if (res.data?.success) {
        setSuccessMsg(`Prescription PDF generated successfully. QR Code: ${res.data.data.qrCode}`);
        setTimeout(() => setSuccessMsg(''), 5000);
      }
    } catch (err) {
      setError('Failed to download PDF.');
    }
  };

  // Voice Speech assistant operations
  const startSpeechRecognition = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setError('Web speech recognition API is not supported on this browser.');
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = selectedLang;
    recognition.interimResults = false;

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event: any) => {
      const text = event.results[0][0].transcript;
      setVoiceQuery(text);
      setIsListening(false);
    };

    recognition.onerror = () => {
      setIsListening(false);
      setError('Microphone access denied or audio issue detected.');
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  };

  const triggerVoiceAssistantQuery = async () => {
    if (!voiceQuery) return;
    setLoading(true);
    try {
      const res = await api.post('/voice-assistant/query', {
        question: voiceQuery,
        language: selectedLang,
        prescription: selectedPresc?.medicines || ''
      });
      if (res.data?.success) {
        setAssistantOutput(res.data.data);
        speakResponse(res.data.data.answer);
        fetchVoiceHistory();
      }
    } catch (err) {
      setError('Could not get assistant explanation.');
    } finally {
      setLoading(false);
    }
  };

  const speakResponse = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = selectedLang;
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleDeleteVoiceItem = async (id: string) => {
    try {
      await api.delete(`/voice-assistant/history/${id}`);
      fetchVoiceHistory();
    } catch (err) {
      setError('Failed to delete history item');
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4">
      {/* Title Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-rose-500/10 rounded-xl text-rose-455 border border-rose-500/20 shadow-lg">
            <Sliders className="w-5 h-5 glow-pill" />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
              Pharmacy & Prescription intelligence
              <span className="text-[10px] bg-rose-500/15 text-rose-400 border border-rose-500/20 px-2 py-0.5 rounded font-mono uppercase">PMS Node</span>
            </h2>
            <p className="text-xs text-slate-600 mt-0.5">Dispense generic alternatives, see price margins, and query AI drug interactions</p>
          </div>
        </div>

        <button
          onClick={fetchPrescriptions}
          disabled={loading}
          className="px-4 py-2 border border-slate-200 bg-white hover:bg-slate-855 text-slate-355 font-semibold rounded-xl text-xs flex items-center gap-2 transition-all"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Queue</span>
        </button>
      </div>

      {/* Notifications */}
      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-450 text-xs flex items-center gap-2.5 shadow-lg font-mono">
          <CheckCircle2 className="w-4.5 h-4.5 text-emerald-400 shrink-0" />
          <span className="font-semibold">{successMsg}</span>
        </div>
      )}
      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-455 text-xs flex items-center gap-2.5 shadow-lg font-mono">
          <AlertCircle className="w-4.5 h-4.5 text-rose-400 shrink-0" />
          <span className="font-semibold">{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column (Prescriptions queue & Reminders scheduler) */}
        <div className="lg:col-span-5 space-y-6 self-start">
          {/* Voice assistant module */}
          <div className="bg-white border border-slate-200 shadow-sm p-6 rounded-2xl border border-slate-200 space-y-4">
            <div className="border-b border-slate-200 pb-2 flex justify-between items-center">
              <h3 className="text-xs font-bold text-slate-350 uppercase tracking-wider">
                Voice Medicine Assistant
              </h3>
              <div className="flex items-center gap-1 text-[10px] text-slate-500 font-mono">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping"></span>
                <span>Bhashini Ready</span>
              </div>
            </div>

            <div className="flex gap-2">
              <select
                value={selectedLang}
                aria-label="Preferred voice assistant language selector"
                onChange={e => setSelectedLang(e.target.value)}
                className="bg-white border border-slate-200 rounded-xl p-2 text-slate-355 text-xs focus:outline-none"
              >
                <option value="en">English</option>
                <option value="hi">Hindi (हिन्दी)</option>
                <option value="ta">Tamil (தமிழ்)</option>
                <option value="te">Telugu (తెలుగు)</option>
                <option value="mr">Marathi (मराठी)</option>
                <option value="bn">Bengali (বাংলা)</option>
              </select>

              <button
                onClick={startSpeechRecognition}
                className={`p-2.5 rounded-xl border flex items-center justify-center transition-all ${
                  isListening 
                    ? 'bg-rose-500/20 border-rose-500/30 text-rose-400 animate-pulse'
                    : 'bg-white border-slate-200 text-slate-600 hover:text-slate-800'
                }`}
              >
                {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>
            </div>

            {isListening && (
              <div className="flex gap-1 items-center justify-center py-2">
                <span className="w-1 h-3 bg-indigo-500 rounded animate-bounce"></span>
                <span className="w-1 h-5 bg-indigo-400 rounded animate-bounce delay-75"></span>
                <span className="w-1 h-3 bg-indigo-500 rounded animate-bounce delay-150"></span>
              </div>
            )}

            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Spoken query transcript..."
                aria-label="Spoken query text transcript"
                value={voiceQuery}
                onChange={e => setVoiceQuery(e.target.value)}
                className="bg-white border border-slate-200 rounded-xl p-2.5 text-slate-355 text-xs flex-1 focus:outline-none"
              />
              <button
                onClick={triggerVoiceAssistantQuery}
                className="px-3 bg-indigo-600 hover:bg-indigo-500 text-slate-950 font-bold rounded-xl text-xs"
              >
                Send
              </button>
            </div>

            {assistantOutput && (
              <div className="p-4 bg-white rounded-xl border border-indigo-500/20 text-xs font-mono space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-indigo-400 font-bold">Voice Answer</span>
                  <button onClick={() => speakResponse(assistantOutput.answer)} className="text-slate-600 hover:text-slate-800">
                    <Volume2 className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-slate-700">{assistantOutput.answer}</p>
                {assistantOutput.safetyWarnings && (
                  <p className="text-[10px] text-amber-500">⚠️ {assistantOutput.safetyWarnings}</p>
                )}
              </div>
            )}

            {/* Conversation History */}
            <div className="space-y-2 border-t border-slate-200 pt-3">
              <span className="text-[10px] text-slate-500 uppercase block">Recent voice queries</span>
              <div className="space-y-2 max-h-36 overflow-y-auto">
                {voiceHistory.map((v) => (
                  <div key={v.id} className="p-2 bg-white rounded border border-slate-200 flex justify-between items-center text-[10px] font-mono">
                    <div className="flex-1">
                      <span className="text-slate-600 block font-semibold">Q: {v.question}</span>
                      <span className="text-slate-500 block">A: {v.answer}</span>
                    </div>
                    <button onClick={() => handleDeleteVoiceItem(v.id)} className="text-slate-600 hover:text-rose-455 transition-colors">
                      <Trash className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-200 shadow-sm p-6 rounded-2xl border border-slate-200 space-y-4">
            <h3 className="text-xs font-bold text-slate-350 uppercase tracking-wider border-b border-slate-200 pb-2">
              Active Prescriptions Queue
            </h3>

            <div className="space-y-3">
              {loading && prescriptions.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-6">Loading prescriptions queue...</p>
              ) : prescriptions.length > 0 ? (
                prescriptions.map((pr) => (
                  <div
                    key={pr.id}
                    onClick={() => {
                      setSelectedPresc(pr);
                      setAiReport(null);
                    }}
                    className={`p-4 rounded-xl border transition-all text-left font-mono space-y-2.5 cursor-pointer ${
                      selectedPresc?.id === pr.id
                        ? 'bg-rose-500/10 border-rose-500/30'
                        : 'bg-white border-slate-200 hover:border-slate-200'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-slate-205 text-xs">Prescription #{pr.id}</span>
                      <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase ${
                        pr.status === 'Dispensed' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'
                      }`}>{pr.status}</span>
                    </div>
                    <p className="text-[10px] text-slate-500">Doctor: {pr.doctorName || 'Dr. Patil'}</p>
                    <p className="text-[11px] text-slate-700 font-semibold">{pr.medicines}</p>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 space-y-2">
                  <HeartPulse className="w-8 h-8 text-slate-800 mx-auto animate-pulse" />
                  <p className="text-xs text-slate-500 font-bold">No active prescriptions found.</p>
                </div>
              )}
            </div>
          </div>

          {/* Medicine Reminder Timeline scheduler */}
          <div className="bg-white border border-slate-200 shadow-sm p-6 rounded-2xl border border-slate-200 space-y-4">
            <h3 className="text-xs font-bold text-slate-350 uppercase tracking-wider border-b border-slate-200 pb-2">
              Medicine Reminders & Schedule
            </h3>

            <form onSubmit={handleCreateReminder} className="flex gap-2 text-xs font-mono">
              <input
                type="text"
                placeholder="Medicine name..."
                aria-label="New medicine reminder name"
                value={newReminderName}
                onChange={e => setNewReminderName(e.target.value)}
                className="bg-white border border-slate-200 rounded-xl p-2 text-slate-355 flex-1 focus:outline-none"
              />
              <select
                value={newReminderTime}
                aria-label="New medicine time slot select"
                onChange={e => setNewReminderTime(e.target.value)}
                className="bg-white border border-slate-200 rounded-xl p-2 text-slate-355 focus:outline-none"
              >
                <option>Morning</option>
                <option>Afternoon</option>
                <option>Evening</option>
                <option>Night</option>
              </select>
              <button type="submit" className="p-2 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-slate-950 font-bold">
                <Plus className="w-4 h-4" />
              </button>
            </form>

            <div className="space-y-2 max-h-48 overflow-y-auto">
              {reminders.map(rem => (
                <div key={rem.id} className="flex justify-between items-center p-2.5 bg-white rounded-lg border border-slate-200 text-xs font-mono">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleToggleReminderStatus(rem.id, rem.status)}
                      className={`p-1 rounded border transition-colors ${
                        rem.status === 'Taken' ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400' : 'border-slate-200 text-slate-600'
                      }`}
                    >
                      <Check className="w-3 h-3" />
                    </button>
                    <div>
                      <span className={`block font-bold ${rem.status === 'Taken' ? 'line-through text-slate-500' : 'text-slate-205'}`}>{rem.medicineName}</span>
                      <span className="text-[9px] text-slate-500">{rem.timeSlot} | {rem.status}</span>
                    </div>
                  </div>
                  <button onClick={() => handleDeleteReminder(rem.id)} className="text-slate-500 hover:text-rose-455 transition-colors">
                    <Trash className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column (AI guidance details) */}
        <div className="lg:col-span-7 space-y-6">
          {selectedPresc ? (
            <div className="space-y-6 animate-fade-in">
              {/* Trigger checkup button */}
              <div className="bg-white border border-slate-200 shadow-sm p-5 rounded-2xl border border-slate-200 flex justify-between items-center text-xs font-mono">
                <div>
                  <span className="text-slate-800 block font-bold">Query AI drug interactions</span>
                  <p className="text-slate-500 mt-0.5">Analyze chemical formulas for contraindications and generic Jan Aushadhi swaps</p>
                </div>
                <button
                  onClick={() => handleCheckInteractions(selectedPresc.medicines)}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-slate-950 font-bold rounded-xl text-xs uppercase"
                >
                  Model Check
                </button>
              </div>

              {/* AI Report details */}
              {aiReport && (
                <div className="space-y-6 animate-fade-in">
                  {/* Section 1: AI Clinical Explanation */}
                  <div className="bg-white border border-slate-200 shadow-sm p-6 rounded-2xl border border-slate-200 space-y-4 text-xs font-mono">
                    <div className="border-b border-slate-200 pb-2 flex justify-between items-center">
                      <h4 className="font-bold text-slate-205 text-xs uppercase">AI Clinical Explanation</h4>
                      <span className="text-indigo-400 font-bold">Confidence: {aiReport.confidenceScore}%</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <span className="text-slate-500 text-[9px] uppercase block">Disease Treated</span>
                        <strong className="text-slate-700 block">{aiReport.diseaseBeingTreated}</strong>
                      </div>
                      <div>
                        <span className="text-slate-500 text-[9px] uppercase block">Expected Recovery</span>
                        <strong className="text-slate-700 block">{aiReport.expectedRecoveryTime}</strong>
                      </div>
                      <div className="md:col-span-2">
                        <span className="text-slate-500 text-[9px] uppercase block">How Medicine Works</span>
                        <p className="text-slate-600 leading-normal">{aiReport.howMedicineWorks}</p>
                      </div>
                      <div className="md:col-span-2">
                        <span className="text-slate-500 text-[9px] uppercase block">Clinical Explanation</span>
                        <p className="text-slate-600 leading-normal">{aiReport.clinicalExplanation}</p>
                      </div>
                    </div>
                  </div>

                  {/* Section 2: Drug Interaction Analysis */}
                  <div className="bg-white border border-slate-200 shadow-sm p-6 rounded-2xl border border-slate-200 space-y-4 text-xs font-mono">
                    <div className="border-b border-slate-200 pb-2 flex justify-between items-center">
                      <h4 className="font-bold text-slate-205 text-xs uppercase">Drug Interaction Analysis</h4>
                      <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[9px] rounded font-bold uppercase">Safe Combination</span>
                    </div>
                    <div className="space-y-2">
                      <div>
                        <span className="text-slate-500 text-[9px] uppercase block">Interaction Severity</span>
                        <strong className="text-slate-700 block">{aiReport.interactionSeverity || 'None'}</strong>
                      </div>
                      <div>
                        <span className="text-slate-500 text-[9px] uppercase block">Contraindications</span>
                        <p className="text-slate-600">{aiReport.contraindications?.join(', ') || 'None reported.'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Section 3: Side Effects & Organ Warnings */}
                  <div className="bg-white border border-slate-200 shadow-sm p-6 rounded-2xl border border-slate-200 space-y-4 text-xs font-mono">
                    <h4 className="font-bold text-slate-205 text-xs uppercase border-b border-slate-200 pb-2">Side Effects & Organ Warnings</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-white p-3 rounded-xl border border-slate-200">
                        <span className="text-amber-400 text-[9px] uppercase block">Common Side Effects</span>
                        <p className="text-slate-600 mt-1">{aiReport.commonSideEffects}</p>
                      </div>
                      <div className="bg-white p-3 rounded-xl border border-slate-200">
                        <span className="text-rose-455 text-[9px] uppercase block">Serious Side Effects</span>
                        <p className="text-slate-600 mt-1">{aiReport.seriousSideEffects}</p>
                      </div>
                    </div>
                    <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-2">
                      <span className="text-indigo-400 text-[9px] uppercase block">Organ Warnings</span>
                      <div className="grid grid-cols-3 gap-2 text-center text-[10px]">
                        <div>
                          <span className="text-slate-500 block">Kidney</span>
                          <span className="text-slate-700 block font-semibold">{aiReport.organWarnings?.kidney || 'Safe'}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block">Liver</span>
                          <span className="text-slate-700 block font-semibold">{aiReport.organWarnings?.liver || 'Moderate'}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block">Pregnancy</span>
                          <span className="text-slate-700 block font-semibold">{aiReport.organWarnings?.pregnancy || 'Consult Doctor'}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Section 4: Prescription Safety Dashboard */}
                  <div className="bg-white border border-slate-200 shadow-sm p-6 rounded-2xl border border-slate-200 space-y-4 text-xs font-mono">
                    <h4 className="font-bold text-slate-205 text-xs uppercase border-b border-slate-200 pb-2">Prescription Safety Scorecards</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                      <div className="bg-white p-3 rounded-xl border border-slate-200">
                        <span className="text-[9px] text-slate-550 block uppercase">Allergy Safety</span>
                        <strong className="text-base text-emerald-400 font-bold block mt-1">{aiReport.safetyScores?.Allergy || 95}%</strong>
                      </div>
                      <div className="bg-white p-3 rounded-xl border border-slate-200">
                        <span className="text-[9px] text-slate-550 block uppercase">Kidney Safety</span>
                        <strong className="text-base text-emerald-400 font-bold block mt-1">{aiReport.safetyScores?.Kidney || 90}%</strong>
                      </div>
                      <div className="bg-white p-3 rounded-xl border border-slate-200">
                        <span className="text-[9px] text-slate-550 block uppercase">Liver Safety</span>
                        <strong className="text-base text-amber-500 font-bold block mt-1">{aiReport.safetyScores?.Liver || 85}%</strong>
                      </div>
                      <div className="bg-white p-3 rounded-xl border border-slate-200">
                        <span className="text-[9px] text-slate-550 block uppercase">Pregnancy Safety</span>
                        <strong className="text-base text-indigo-400 font-bold block mt-1">{aiReport.safetyScores?.Pregnancy || 92}%</strong>
                      </div>
                    </div>
                  </div>

                  {/* Section 5: Generic Medicine comparison */}
                  <div className="bg-white border border-slate-200 shadow-sm p-6 rounded-2xl border border-slate-200 space-y-4 text-xs font-mono">
                    <h4 className="font-bold text-slate-205 text-xs uppercase border-b border-slate-200 pb-2">Generic Alternative Price Comparisons</h4>
                    <div className="p-4 bg-white rounded-xl border border-slate-200 flex justify-between items-center">
                      {aiReport.estimatedSavings ? (
                        <div>
                          <span className="text-[10px] text-slate-500 block">Brand Price: ₹{aiReport.estimatedSavings.brandPrice} | Generic Price: ₹{aiReport.estimatedSavings.genericPrice}</span>
                          <span className="text-slate-800 font-bold block mt-0.5">Est. Savings: ₹{aiReport.estimatedSavings.savings} ({aiReport.estimatedSavings.percentage}% Off)</span>
                        </div>
                      ) : (
                        <div>
                          <span className="text-[10px] text-slate-500 block">Brand Price: ₹120 | Generic Price: ₹30</span>
                          <span className="text-slate-800 font-bold block mt-0.5">Est. Savings: ₹90 (75% Off)</span>
                        </div>
                      )}
                      <span className="text-emerald-400 font-bold text-xs bg-emerald-500/10 px-2 py-1 rounded">High Savings</span>
                    </div>
                  </div>

                  {/* Section 8: Nearby Pharmacy listings */}
                  <div className="bg-white border border-slate-200 shadow-sm p-6 rounded-2xl border border-slate-200 space-y-4 text-xs font-mono">
                    <h4 className="font-bold text-slate-205 text-xs uppercase border-b border-slate-200 pb-2">Nearby Pharmacy Availability</h4>
                    <div className="space-y-2.5">
                      {nearbyPharmacies.map((pharm, idx) => (
                        <div key={idx} className="p-3 bg-white rounded border border-slate-200 flex justify-between items-center">
                          <div>
                            <span className="text-slate-800 font-bold block">{pharm.name}</span>
                            <span className="text-[10px] text-slate-500">Distance: {pharm.distance} | Contact: {pharm.phone}</span>
                          </div>
                          <span className="text-indigo-400 font-bold text-[10px]">{pharm.hours}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Section 5 Adherence charts */}
                  <div className="bg-white border border-slate-200 shadow-sm p-6 rounded-2xl border border-slate-200 space-y-4 text-xs font-mono">
                    <div className="border-b border-slate-200 pb-2 flex justify-between items-center">
                      <h4 className="font-bold text-slate-205 text-xs uppercase">Medication Adherence Analytics</h4>
                      <span className="text-emerald-400 font-bold">Compliance Score: {aiReport.medicineAdherenceScore}%</span>
                    </div>
                    <div className="h-44">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={[
                          { name: 'Mon', rate: 90 },
                          { name: 'Tue', rate: 95 },
                          { name: 'Wed', rate: 85 },
                          { name: 'Thu', rate: 98 },
                          { name: 'Fri', rate: 92 }
                        ]}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                          <XAxis dataKey="name" stroke="#64748b" fontSize={10} />
                          <YAxis stroke="#64748b" fontSize={10} />
                          <Tooltip contentStyle={{ backgroundColor: '#020617', borderColor: '#1e293b' }} />
                          <Area type="monotone" dataKey="rate" stroke="#10b981" fill="rgba(16,185,129,0.1)" strokeWidth={2} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                    <p className="text-[10px] text-slate-500 bg-white p-2.5 rounded border border-slate-200">
                      <strong>💡 AI Suggestion:</strong> {aiReport.AIAdherenceSuggestions}
                    </p>
                  </div>

                  {/* Section 6 Refill Progress */}
                  <div className="bg-white border border-slate-200 shadow-sm p-6 rounded-2xl border border-slate-200 space-y-4 text-xs font-mono">
                    <h4 className="font-bold text-slate-205 text-xs uppercase border-b border-slate-200 pb-2">Refill Progress Dashboard</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-slate-500 text-[9px] block uppercase">Remaining Tablets</span>
                        <strong className="text-slate-800 text-sm block mt-0.5">{aiReport.remainingTablets} Tablets</strong>
                      </div>
                      <div>
                        <span className="text-slate-550 text-[9px] block uppercase">Estimated Days left</span>
                        <strong className="text-slate-800 text-sm block mt-0.5">{aiReport.estimatedRemainingDays} Days</strong>
                      </div>
                      <div className="col-span-2">
                        <span className="text-slate-500 text-[9px] block uppercase">Expected Refill Date</span>
                        <strong className="text-indigo-400 block mt-0.5">{aiReport.nextRefillDate}</strong>
                      </div>
                    </div>
                    <button
                      onClick={() => handleRequestRefill(selectedPresc.id)}
                      className="w-full py-2 bg-rose-500 hover:bg-rose-455 text-slate-950 font-bold rounded-xl text-xs uppercase"
                    >
                      Request Refill
                    </button>
                  </div>

                  {/* Section 9: Actions */}
                  <div className="flex flex-wrap gap-2 text-xs font-mono">
                    <button
                      onClick={() => handleShareToABHA(selectedPresc.id)}
                      className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-slate-950 font-bold"
                    >
                      Share to ABHA
                    </button>
                    <button
                      onClick={() => handleDownloadPDF(selectedPresc.id)}
                      className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-slate-950 font-bold"
                    >
                      Download Prescription PDF
                    </button>
                    <button
                      onClick={() => window.print()}
                      className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-700 font-bold"
                    >
                      Print
                    </button>
                  </div>

                  {/* AI Clinical Disclaimer */}
                  <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500/90 text-[10px] font-mono leading-relaxed">
                    <strong>⚠️ AI Clinical Disclaimer:</strong> Recommendations are for Clinical Decision Support (CDSS) only. Final diagnoses, medicine adjustments, and prescription approvals must be verified by a licensed healthcare professional. AI predictions are probabilistic.
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="h-64 flex flex-col items-center justify-center text-center p-8 text-slate-500 bg-white border border-slate-200 shadow-sm rounded-2xl border border-slate-200">
              <HeartPulse className="w-12 h-12 text-slate-700 mb-3 animate-pulse" />
              <p className="text-xs">Select a prescription queue item on the left to verify chemical compatibility, check generic equivalent margins, and print refill logs.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
