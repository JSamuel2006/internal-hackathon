import React, { useState, useEffect, useRef } from 'react';
import { 
  HeartPulse, ShieldAlert, CheckCircle2, AlertCircle, RefreshCw, Send, ShieldCheck, Stethoscope, Star, Check, Plus,
  LayoutDashboard, MessageSquare, History, User, LogOut, Clock, Activity, ClipboardList, ChevronRight
} from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { emergencyNetworkService, doctorApiService, authService, workerService } from '../../services/api';
import { socketService } from '../../services/socketService';
import { LanguageSelector } from '../../components/voice/LanguageSelector';

interface DoctorProfile {
  id: string;
  name: string;
  specialty: string;
  availability: string;
  hospitalId: string;
}

export default function DoctorDashboard() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Tab state derived from query params: dashboard, emergency, chats, history, profile
  const activeTab = searchParams.get('tab') || 'dashboard';

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Doctor state
  const [doctor, setDoctor] = useState<DoctorProfile | null>(null);
  const [availability, setAvailability] = useState<'AVAILABLE' | 'BUSY' | 'IN_CONSULTATION' | 'OFFLINE'>('AVAILABLE');

  // Emergency Queue & Chat Workspace States
  const [emergencyRequests, setEmergencyRequests] = useState<any[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [emergencyContext, setEmergencyContext] = useState<any>(null);
  const [medicalSummary, setMedicalSummary] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [replyInput, setReplyInput] = useState('');
  const [aiSummary, setAiSummary] = useState<string>('');
  const [ashaScreenings, setAshaScreenings] = useState<any[]>([]);
  const [doctorChatLang, setDoctorChatLang] = useState<string>('en');
  const [showOriginalMap, setShowOriginalMap] = useState<Record<string, boolean>>({});

  const toggleShowOriginal = (msgId: string) => {
    setShowOriginalMap((prev) => ({ ...prev, [msgId]: !prev[msgId] }));
  };

  // Elapsed Timer state for active consultation
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Sync profile & queues
  const syncDashboardData = async () => {
    setLoading(true);
    setError('');
    try {
      // 1. Get current doctor profile
      const profRes = await doctorApiService.getProfile();
      if (profRes.success && profRes.data) {
        setDoctor(profRes.data);
        let currentAvail = profRes.data.availability || 'AVAILABLE';
        if (currentAvail === 'ONLINE') currentAvail = 'AVAILABLE';
        setAvailability(currentAvail as any);
      }

      // 2. Fetch requests
      const erRes = await emergencyNetworkService.getDoctorRequests();
      if (erRes.success) {
        // Sort requests: HIGH priority first, then newest first
        const sorted = (erRes.data || []).sort((a: any, b: any) => {
          if (a.priority === 'HIGH' && b.priority !== 'HIGH') return -1;
          if (a.priority !== 'HIGH' && b.priority === 'HIGH') return 1;
          return new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime();
        });
        setEmergencyRequests(sorted);

        // Auto-detect if there is an active accepted consultation in the queue
        const activeConsultation = sorted.find((r: any) => r.status === 'ACCEPTED');
        if (activeConsultation) {
          setSelectedRequest(activeConsultation);
          // Set elapsed seconds using its acceptance timestamp
          const acceptedTime = activeConsultation.acceptedAt ? new Date(activeConsultation.acceptedAt).getTime() : Date.now();
          setElapsedSeconds(Math.floor((Date.now() - acceptedTime) / 1000));
        } else {
          setSelectedRequest(null);
        }
      }
    } catch (err: any) {
      if (err.response?.status === 403 || err.response?.status === 401) {
        navigate('/login');
      } else {
        setError('Failed to sync doctor dashboard queues.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    syncDashboardData();

    // Establish authenticated Socket.IO connection
    const token = sessionStorage.getItem('token');
    if (token) {
      const socket = socketService.connect(token);

      socket.on('emergency_request_created', (data) => {
        console.log('[SOCKET] emergency_request_created received, triggering REST sync', data);
        syncDashboardData();
      });

      socket.on('emergency_request_updated', (data) => {
        console.log('[SOCKET] emergency_request_updated received, triggering REST sync', data);
        syncDashboardData();
      });

      socket.on('reconnect', () => {
        console.log('[SOCKET] Socket reconnected, triggering REST queue synchronization');
        syncDashboardData();
      });
    }

    return () => {
      const socket = socketService.getSocket();
      if (socket) {
        socket.off('emergency_request_created');
        socket.off('emergency_request_updated');
        socket.off('reconnect');
      }
    };
  }, []);

  // Poll for queue & active chat updates
  useEffect(() => {
    const queueInterval = setInterval(async () => {
      if (availability === 'OFFLINE') return;
      try {
        const erRes = await emergencyNetworkService.getDoctorRequests();
        if (erRes.success) {
          const sorted = (erRes.data || []).sort((a: any, b: any) => {
            if (a.priority === 'HIGH' && b.priority !== 'HIGH') return -1;
            if (a.priority !== 'HIGH' && b.priority === 'HIGH') return 1;
            return new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime();
          });
          setEmergencyRequests(sorted);

          // Update active consultation link dynamically
          const activeConsultation = sorted.find((r: any) => r.status === 'ACCEPTED');
          if (activeConsultation) {
            setSelectedRequest(activeConsultation);
          } else {
            setSelectedRequest(null);
          }
        }
      } catch (err) {
        /* quiet */
      }
    }, 30000); // 30 seconds fallback polling

    return () => clearInterval(queueInterval);
  }, [availability]);

  // Consultation elapsed timer
  useEffect(() => {
    if (!selectedRequest) {
      setElapsedSeconds(0);
      return;
    }
    const timer = setInterval(() => {
      setElapsedSeconds(prev => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [selectedRequest]);

  // Poll chat messages & consent status when a request is actively open
  useEffect(() => {
    if (!selectedRequest) return;

    let isMounted = true;
    const pollActiveChat = async () => {
      try {
        const res = await emergencyNetworkService.getChatMessages(selectedRequest.requestId);
        if (isMounted && res.success) {
          setMessages(res.data || []);
        }

        // Fetch context
        const ctxRes = await emergencyNetworkService.getEmergencyContext(selectedRequest.requestId);
        if (isMounted && ctxRes.success) {
          setEmergencyContext(ctxRes.data);
        }

        // Fetch consent-gated medical history
        if (doctor) {
          const summaryRes = await emergencyNetworkService.getMedicalHistory(selectedRequest.emergencyId, doctor.id)
            .catch(() => null);
          if (isMounted) {
            if (summaryRes && summaryRes.success) {
              setMedicalSummary(summaryRes.data);
            } else {
              setMedicalSummary(null);
            }
          }
        }

        // Fetch community screenings (ASHA)
        const citizenId = selectedRequest.citizen_user_id || selectedRequest.citizenUserId;
        if (citizenId) {
          const ashaRes = await workerService.getCitizenHistory(citizenId).catch(() => null);
          if (isMounted && ashaRes && ashaRes.success) {
            setAshaScreenings(ashaRes.data || []);
          }
        }
      } catch (err) {
        console.error('Active chat polling error', err);
      }
    };

    pollActiveChat();
    const chatInterval = setInterval(pollActiveChat, 4000);

    return () => {
      isMounted = false;
      clearInterval(chatInterval);
    };
  }, [selectedRequest, doctor]);

  // Dynamic Translation Resolver: fetches missing target language translations for existing messages when doctorChatLang changes
  useEffect(() => {
    if (!selectedRequest || messages.length === 0) return;

    messages.forEach(async (m) => {
      if (m.senderRole === 'SYSTEM') return;
      const origLang = (m.originalLanguage || 'en').toLowerCase().substring(0, 2);
      const targetLang = doctorChatLang.toLowerCase().substring(0, 2);

      if (origLang === targetLang) return; // Original language matches target
      if (m.translations && m.translations[targetLang]) return; // Already cached locally

      try {
        const res = await emergencyNetworkService.translateChatMessage(selectedRequest.requestId, m.id, targetLang);
        if (res && res.success && res.data) {
          setMessages((prev) =>
            prev.map((msg) => {
              if (msg.id !== m.id) return msg;
              const updatedTranslations = { ...(msg.translations || {}), [targetLang]: res.data.translatedText };
              return {
                ...msg,
                translations: updatedTranslations,
              };
            })
          );
        }
      } catch (err) {
        console.warn(`Translation fetch failed for message ${m.id}:`, err);
      }
    });
  }, [doctorChatLang, selectedRequest, messages.length]);

  // Helper to determine exact text to render for a message based on doctorChatLang
  const getDisplayText = (m: any) => {
    if (m.senderRole === 'SYSTEM') return m.message;
    const showOriginal = showOriginalMap[m.id];
    const origText = m.originalText || m.message;
    const origLang = (m.originalLanguage || 'en').toLowerCase().substring(0, 2);
    const targetLang = doctorChatLang.toLowerCase().substring(0, 2);

    if (showOriginal) return { text: origText, isOriginal: true, label: `Original • ${origLang.toUpperCase()}` };
    if (origLang === targetLang) return { text: origText, isOriginal: true, label: `Original • ${origLang.toUpperCase()}` };

    if (m.translations && m.translations[targetLang]) {
      return { text: m.translations[targetLang], isOriginal: false, label: `Translated from ${origLang.toUpperCase()}` };
    }

    if (m.translatedLanguage && m.translatedLanguage.toLowerCase().substring(0, 2) === targetLang) {
      return { text: m.translatedText || m.message, isOriginal: false, label: `Translated from ${origLang.toUpperCase()}` };
    }

    return { text: origText, isOriginal: true, label: `Original • ${origLang.toUpperCase()}` };
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleUpdateAvailability = async (newStatus: 'AVAILABLE' | 'BUSY' | 'OFFLINE' | 'IN_CONSULTATION') => {
    if (availability === 'IN_CONSULTATION' && newStatus !== 'IN_CONSULTATION') {
      setError('Cannot change status manually while actively in consultation. Please close the active emergency session first.');
      setTimeout(() => setError(''), 4000);
      return;
    }
    setLoading(true);
    try {
      const res = await doctorApiService.updateAvailability(newStatus);
      if (res.success) {
        setAvailability(newStatus);
        setSuccessMsg(`Availability updated to ${newStatus}`);
        setTimeout(() => setSuccessMsg(''), 3000);
        if (newStatus === 'OFFLINE') {
          setEmergencyRequests([]);
          setSelectedRequest(null);
        } else {
          syncDashboardData();
        }
      }
    } catch {
      setError('Failed to update availability status.');
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptRequest = async (requestId: string) => {
    if (availability === 'IN_CONSULTATION') {
      setError('You are already attending to a critical patient. Close the current session first.');
      setTimeout(() => setError(''), 4000);
      return;
    }
    setLoading(true);
    try {
      const res = await emergencyNetworkService.acceptRequest(requestId);
      if (res.success) {
        setSuccessMsg('Consultation workspace activated.');
        setAvailability('IN_CONSULTATION');
        setTimeout(() => setSuccessMsg(''), 3000);
        await syncDashboardData();
        setSearchParams({ tab: 'chats' });
      }
    } catch (err: any) {
      setError('Accept failed: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleDeclineRequest = async (requestId: string) => {
    setLoading(true);
    try {
      const res = await emergencyNetworkService.declineRequest(requestId);
      if (res.success) {
        setSuccessMsg('Request returned to regional queue.');
        setTimeout(() => setSuccessMsg(''), 3000);
        await syncDashboardData();
      }
    } catch {
      setError('Decline action failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleSendChatMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyInput.trim() || !selectedRequest) return;

    try {
      const res = await emergencyNetworkService.sendChatMessage(selectedRequest.requestId, replyInput, { doctorLanguage: doctorChatLang });
      if (res.success) {
        setMessages((prev) => [...prev, res.data]);
        setReplyInput('');
      }
    } catch {
      setError('Failed to transmit message.');
    }
  };

  const handleCloseEmergency = async () => {
    if (!selectedRequest) return;
    try {
      const res = await emergencyNetworkService.closeRequest(selectedRequest.requestId);
      if (res.success) {
        setSuccessMsg('Consultation marked resolved.');
        setAvailability('AVAILABLE');
        setTimeout(() => setSuccessMsg(''), 3000);
        setSelectedRequest(null);
        setAiSummary('');
        await syncDashboardData();
        setSearchParams({ tab: 'dashboard' });
      }
    } catch {
      setError('Close action failed.');
    }
  };

  const generateHandoffSummary = async () => {
    if (!selectedRequest) return;
    try {
      const res = await emergencyNetworkService.getChatSummary(selectedRequest.requestId);
      if (res.success) {
        setAiSummary(res.summary);
      }
    } catch {
      setAiSummary('AI handoff summary unavailable — continuing with clinical conversation.');
    }
  };

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  const formatTime = (totalSecs: number) => {
    const mins = Math.floor(totalSecs / 60).toString().padStart(2, '0');
    const secs = (totalSecs % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
  };

  // Color mapping helpers matching Citizen Portal standards
  const availStatusColors = {
    AVAILABLE: { text: 'text-emerald-700 font-bold', label: '🟢 AVAILABLE', desc: 'Ready to accept patients' },
    ONLINE: { text: 'text-emerald-700 font-bold', label: '🟢 AVAILABLE', desc: 'Ready to accept patients' },
    BUSY: { text: 'text-amber-700 font-bold', label: '🟠 BUSY', desc: 'Not accepting new emergency requests' },
    IN_CONSULTATION: { text: 'text-rose-700 font-bold', label: '🔴 IN CONSULTATION', desc: 'Currently attending a patient' },
    OFFLINE: { text: 'text-slate-500 font-bold', label: '⚫ OFFLINE', desc: 'Not available for emergency requests' }
  };

  return (
    <div className="h-screen bg-[#F5FAFC] text-slate-800 flex flex-col md:flex-row overflow-hidden font-sans selection:bg-teal-500 selection:text-white">
      
      {/* Sidebar Panel (White Healthcare Design) */}
      <aside className="hidden md:flex flex-col w-72 h-full border-r border-slate-200 bg-white p-5 justify-between shrink-0 overflow-hidden shadow-xs select-none">
        <div className="flex flex-col gap-4 overflow-y-auto flex-1 pr-1">
          
          {/* Logo Branding */}
          <div className="flex items-center gap-3 px-2 py-1">
            <div className="p-2.5 bg-gradient-to-tr from-teal-500 to-cyan-500 rounded-xl text-white shadow-md shadow-teal-500/20">
              <Stethoscope className="w-5 h-5" />
            </div>
            <div>
              <span className="font-extrabold text-xl tracking-tight text-slate-900">
                Arogya<span className="text-teal-600">Mitra</span>
              </span>
              <span className="text-[10px] block text-teal-700 font-bold uppercase tracking-wider font-sans -mt-1">
                Doctor Care Portal
              </span>
            </div>
          </div>

          {/* Practitioner Identity Card */}
          {doctor && (
            <div className="p-3.5 rounded-2xl bg-[#EEF7FA] border border-teal-100 shadow-2xs">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-bold tracking-wider text-teal-700 uppercase font-sans">Medical Practitioner</span>
                <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
              </div>
              <p className="text-xs font-bold text-slate-900 truncate font-sans">{doctor.name}</p>
              <p className="text-[10px] font-sans font-semibold text-slate-500 mt-0.5">{doctor.specialty}</p>
            </div>
          )}

          {/* MAIN Section */}
          <div className="space-y-1">
            <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase font-sans px-3 block">
              MAIN
            </span>
            <button
              onClick={() => setSearchParams({ tab: 'dashboard' })}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all font-sans ${
                activeTab === 'dashboard'
                  ? 'bg-teal-50 text-teal-700 font-bold border border-teal-200/80 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-teal-50/50 border border-transparent'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <LayoutDashboard className={`w-4 h-4 ${activeTab === 'dashboard' ? 'text-teal-600' : 'text-slate-400'}`} />
                <span>Dashboard</span>
              </div>
              {activeTab === 'dashboard' && <ChevronRight className="w-3.5 h-3.5 text-teal-600" />}
            </button>
          </div>

          {/* EMERGENCY CARE Section */}
          <div className="space-y-1">
            <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase font-sans px-3 block">
              EMERGENCY CARE
            </span>
            <button
              onClick={() => setSearchParams({ tab: 'emergency' })}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all font-sans ${
                activeTab === 'emergency'
                  ? 'bg-teal-50 text-teal-700 font-bold border border-teal-200/80 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-teal-50/50 border border-transparent'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <ShieldAlert className={`w-4 h-4 ${activeTab === 'emergency' ? 'text-teal-600' : 'text-slate-400'}`} />
                <span>Emergency Requests</span>
              </div>
              {emergencyRequests.filter(r => r.status === 'REQUESTED').length > 0 ? (
                <span className="bg-rose-600 text-white px-2 py-0.5 rounded-full text-[9px] font-bold animate-pulse">
                  {emergencyRequests.filter(r => r.status === 'REQUESTED').length}
                </span>
              ) : (
                activeTab === 'emergency' && <ChevronRight className="w-3.5 h-3.5 text-teal-600" />
              )}
            </button>

            <button
              onClick={() => setSearchParams({ tab: 'chats' })}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all font-sans ${
                activeTab === 'chats'
                  ? 'bg-teal-50 text-teal-700 font-bold border border-teal-200/80 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-teal-50/50 border border-transparent'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <MessageSquare className={`w-4 h-4 ${activeTab === 'chats' ? 'text-teal-600' : 'text-slate-400'}`} />
                <span>Active Consultation</span>
              </div>
              {availability === 'IN_CONSULTATION' ? (
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
              ) : (
                activeTab === 'chats' && <ChevronRight className="w-3.5 h-3.5 text-teal-600" />
              )}
            </button>
          </div>

          {/* RECORDS Section */}
          <div className="space-y-1">
            <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase font-sans px-3 block">
              RECORDS & SCREENINGS
            </span>
            {selectedRequest && (
              <button
                onClick={() => setSearchParams({ tab: 'screenings' })}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all font-sans ${
                  activeTab === 'screenings'
                    ? 'bg-teal-50 text-teal-700 font-bold border border-teal-200/80 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-teal-50/50 border border-transparent'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <ClipboardList className={`w-4 h-4 ${activeTab === 'screenings' ? 'text-teal-600' : 'text-slate-400'}`} />
                  <span>ASHA Field Screenings</span>
                </div>
                {activeTab === 'screenings' && <ChevronRight className="w-3.5 h-3.5 text-teal-600" />}
              </button>
            )}

            <button
              onClick={() => setSearchParams({ tab: 'history' })}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all font-sans ${
                activeTab === 'history'
                  ? 'bg-teal-50 text-teal-700 font-bold border border-teal-200/80 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-teal-50/50 border border-transparent'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <History className={`w-4 h-4 ${activeTab === 'history' ? 'text-teal-600' : 'text-slate-400'}`} />
                <span>Consultation Archive</span>
              </div>
              {activeTab === 'history' && <ChevronRight className="w-3.5 h-3.5 text-teal-600" />}
            </button>

            <button
              onClick={() => setSearchParams({ tab: 'profile' })}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all font-sans ${
                activeTab === 'profile'
                  ? 'bg-teal-50 text-teal-700 font-bold border border-teal-200/80 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-teal-50/50 border border-transparent'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <User className={`w-4 h-4 ${activeTab === 'profile' ? 'text-teal-600' : 'text-slate-400'}`} />
                <span>Practitioner Profile</span>
              </div>
              {activeTab === 'profile' && <ChevronRight className="w-3.5 h-3.5 text-teal-600" />}
            </button>
          </div>

          {/* MY AVAILABILITY Section */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase font-sans px-3 block">
              MY AVAILABILITY
            </span>
            <div className="flex flex-col gap-1">
              {(['AVAILABLE', 'BUSY', 'OFFLINE'] as const).map((status) => (
                <button
                  key={status}
                  onClick={() => handleUpdateAvailability(status)}
                  disabled={availability === 'IN_CONSULTATION'}
                  className={`w-full px-3 py-2 rounded-xl text-xs font-semibold transition-all flex items-center justify-between font-sans ${
                    availability === status 
                      ? 'bg-teal-50 text-teal-800 font-bold border border-teal-200' 
                      : 'text-slate-600 hover:bg-slate-50 border border-transparent disabled:opacity-40'
                  }`}
                >
                  <span>{status}</span>
                  <span className={`w-2 h-2 rounded-full ${
                    status === 'AVAILABLE' ? 'bg-emerald-500' : status === 'BUSY' ? 'bg-amber-500' : 'bg-slate-400'
                  }`} />
                </button>
              ))}
              {availability === 'IN_CONSULTATION' && (
                <div className="px-3 py-2 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 font-bold text-xs flex items-center justify-between font-sans">
                  <span>IN CONSULTATION</span>
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                </div>
              )}
            </div>
          </div>

          {/* CURRENT STATUS Info Card */}
          <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-2xs font-sans">
            <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase block mb-1">Current Status</span>
            <strong className={`text-xs block ${availStatusColors[availability].text}`}>{availStatusColors[availability].label}</strong>
            <p className="text-[11px] text-slate-500 mt-0.5">{availStatusColors[availability].desc}</p>
          </div>

          {/* CURRENT CONSULTATION Active Badge */}
          {selectedRequest && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs space-y-2.5 font-sans">
              <div>
                <span className="text-[10px] font-bold tracking-wider text-rose-700 uppercase block">Active Consultation</span>
                <span className="text-[11px] font-mono text-slate-600 block mt-0.5">ID: {selectedRequest.emergencyId.substring(0, 12)}...</span>
              </div>
              <div className="flex justify-between items-center text-slate-600 text-[11px]">
                <span>Elapsed Time:</span>
                <strong className="text-rose-700 flex items-center gap-1 font-bold font-mono">
                  <Clock className="w-3.5 h-3.5 text-rose-600" />
                  {formatTime(elapsedSeconds)}
                </strong>
              </div>
              <button 
                onClick={() => setSearchParams({ tab: 'chats' })}
                className="w-full py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs uppercase tracking-wide transition-all shadow-xs cursor-pointer"
              >
                Open Workspace
              </button>
            </div>
          )}
        </div>

        {/* Footer Language & Sign Out */}
        <div className="pt-3 border-t border-slate-100 space-y-2.5 shrink-0">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold text-slate-600 font-sans">Language</span>
            <LanguageSelector />
          </div>

          <button 
            onClick={handleLogout}
            className="w-full py-2.5 px-3 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200 font-bold transition-all text-xs flex items-center justify-center gap-2 cursor-pointer font-sans shadow-2xs"
          >
            <LogOut className="w-4 h-4 text-slate-400 group-hover:text-rose-600" />
            <span>Sign Out Doctor Portal</span>
          </button>
        </div>
      </aside>

      {/* Main Content Canvas (Light Blue Healthcare System) */}
      <main className="flex-1 overflow-y-auto flex flex-col min-w-0 bg-[#F5FAFC]">
        
        {/* Header Bar */}
        <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shrink-0 shadow-2xs sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-teal-500/10 rounded-xl text-teal-600 border border-teal-500/20 md:hidden">
              <Stethoscope className="w-5 h-5" />
            </div>
            <div>
              {doctor ? (
                <h1 className="text-base font-bold text-slate-900 flex items-center gap-2 font-sans">
                  <span>{doctor.name}</span>
                  <span className="text-[10px] bg-teal-50 text-teal-700 border border-teal-200/80 px-2 py-0.5 rounded-full font-bold uppercase">
                    Primary Practitioner
                  </span>
                </h1>
              ) : (
                <h1 className="text-base font-bold text-slate-900 font-sans">Doctor Portal</h1>
              )}
              <p className="text-xs text-slate-500 mt-0.5 font-sans">
                {doctor ? `${doctor.specialty} • Government General Hospital` : 'Healthcare Assistance Dashboard'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:block text-right">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block font-sans">Active Patient Session</span>
              <span className="text-xs font-mono font-bold text-slate-800">
                {selectedRequest ? `ID: ${selectedRequest.emergencyId.substring(0, 10)}...` : 'None Active'}
              </span>
            </div>
            <button
              onClick={syncDashboardData}
              disabled={loading}
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs flex items-center gap-2 transition-all cursor-pointer border border-slate-200 font-sans shadow-2xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh Queue</span>
            </button>
          </div>
        </header>

        {/* Inner Scrollable Workspace */}
        <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto w-full flex-1">
          
          {/* Emergency Safety Notice (Medical Warning Style) */}
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 text-xs leading-relaxed flex items-start gap-3.5 shadow-2xs font-sans">
            <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold uppercase tracking-wider text-rose-900 mb-0.5 font-sans">Traumatology Emergency Notice</p>
              <p className="text-rose-800">
                This system is an emergency coordination and decision-support tool. It does not replace emergency medical services or professional clinical judgment. For critical life-threatening situations, prioritize immediate transport and call 112.
              </p>
            </div>
          </div>

          {/* Success & Error Alert Banners */}
          {successMsg && (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center gap-2.5 font-sans shadow-2xs">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="font-bold">{successMsg}</span>
            </div>
          )}
          {error && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 text-xs flex items-center gap-2.5 font-sans shadow-2xs">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span className="font-bold">{error}</span>
            </div>
          )}

          {/* Tab 1: Dashboard Overview */}
          {activeTab === 'dashboard' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 font-sans">
              <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-xs space-y-3">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Practitioner Triage Status</span>
                <div className="flex items-center gap-3">
                  <span className={`w-3.5 h-3.5 rounded-full ${
                    availability === 'AVAILABLE' ? 'bg-emerald-500 animate-pulse' : availability === 'BUSY' ? 'bg-amber-500' : availability === 'IN_CONSULTATION' ? 'bg-rose-500 animate-ping' : 'bg-slate-400'
                  }`} />
                  <span className="text-lg font-bold text-slate-900">{availability}</span>
                </div>
                <p className="text-xs text-slate-500">Selected availability controls automated triage routing.</p>
              </div>
              
              <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-xs space-y-3">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Pending Requests Queue</span>
                <p className="text-2xl font-bold text-rose-600">
                  {emergencyRequests.filter(r => r.status === 'REQUESTED').length} <span className="text-sm font-semibold text-slate-600">Pending</span>
                </p>
                <p className="text-xs text-slate-500">Awaiting acceptance from regional healthcare queue.</p>
              </div>

              <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-xs space-y-3">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Active Consultation Session</span>
                <p className="text-base font-bold text-slate-900">
                  {selectedRequest ? '1 Consultation Running' : 'No Active Session'}
                </p>
                <p className="text-xs text-slate-500">Protected by JWT role authentication and patient consent.</p>
              </div>
            </div>
          )}

          {/* Tab 2: Emergency Requests Queue */}
          {activeTab === 'emergency' && (
            <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-xs space-y-5 font-sans">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <h3 className="text-sm font-bold text-slate-900 tracking-tight">Assistance Request Queue</h3>
                <span className="text-xs font-mono text-slate-500">{emergencyRequests.filter(r => r.status === 'REQUESTED').length} Pending</span>
              </div>
              
              {availability === 'OFFLINE' ? (
                <div className="text-center py-12 space-y-2">
                  <ShieldAlert className="w-10 h-10 text-slate-300 mx-auto" />
                  <p className="text-sm font-bold text-slate-700">Practitioner Currently Offline</p>
                  <p className="text-xs text-slate-500">Set your status to AVAILABLE in the sidebar to view emergency triage requests.</p>
                </div>
              ) : emergencyRequests.filter(r => r.status === 'REQUESTED').length === 0 ? (
                <div className="text-center py-12 space-y-2">
                  <CheckCircle2 className="w-10 h-10 text-teal-500/40 mx-auto" />
                  <p className="text-sm font-bold text-slate-800">No Active Emergency Requests</p>
                  <p className="text-xs text-slate-500">All incoming triage assistance requests are clear.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {emergencyRequests.filter(r => r.status === 'REQUESTED').map((req) => (
                    <div 
                      key={req.requestId} 
                      className={`p-5 rounded-2xl border transition-all ${
                        req.priority === 'HIGH'
                          ? 'bg-rose-50/50 border-rose-200 shadow-xs'
                          : 'bg-white border-slate-200 shadow-xs'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          {req.priority === 'HIGH' && (
                            <span className="inline-block px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider bg-rose-100 text-rose-700 border border-rose-200 mb-2">
                              🔴 High Priority Emergency
                            </span>
                          )}
                          <h4 className="text-sm font-bold text-slate-900">{req.category} EMERGENCY</h4>
                        </div>
                        <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-2 py-1 rounded-md">
                          {new Date(req.requestedAt).toLocaleTimeString()}
                        </span>
                      </div>

                      <div className="text-xs text-slate-600 space-y-1 font-mono bg-slate-50 p-3 rounded-xl border border-slate-100 mb-4">
                        <p>Session ID: <strong className="text-slate-900">{req.emergencyId}</strong></p>
                        <p>Triage Level: <strong className="text-slate-900">{req.priority}</strong></p>
                      </div>

                      {req.priority === 'HIGH' && (
                        <div className="p-3 rounded-xl bg-rose-100/80 border border-rose-200 text-xs text-rose-900 font-bold mb-4">
                          ⚠️ Action Required: Immediate Tele-Triage / Urgent Ambulance Dispatch
                        </div>
                      )}

                      <div className="flex gap-2.5">
                        <button 
                          onClick={() => handleAcceptRequest(req.requestId)}
                          className="flex-1 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl text-xs uppercase tracking-wider transition-all cursor-pointer shadow-xs"
                        >
                          Accept Consultation
                        </button>
                        <button 
                          onClick={() => handleDeclineRequest(req.requestId)}
                          className="py-2.5 px-4 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900 rounded-xl text-xs font-bold transition-all cursor-pointer"
                        >
                          Decline
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Tab 3: Active Consultation Workspace */}
          {activeTab === 'chats' && (
            <div>
              {selectedRequest ? (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 font-sans">
                  {/* Left col: Chat Workspace & AI Hand-off */}
                  <div className="lg:col-span-8 space-y-6">
                    
                    <div className="flex flex-col h-[480px] bg-white border border-slate-200 shadow-xs rounded-2xl overflow-hidden">
                      <div className="p-4 bg-white border-b border-slate-200 flex justify-between items-center">
                        <div>
                          <span className="font-bold text-xs text-slate-900 uppercase tracking-wider block">Secure Trauma Consultation Session</span>
                          <span className="text-[10px] font-mono text-slate-500">ID: {selectedRequest.emergencyId}</span>
                        </div>
                        
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1.5 text-[10px]">
                            <span className="text-slate-400 font-bold hidden sm:inline">My Chat Language:</span>
                            <select
                              value={doctorChatLang}
                              onChange={(e) => setDoctorChatLang(e.target.value)}
                              className="bg-slate-50 border border-slate-200 text-slate-700 font-bold px-2 py-1 rounded-lg text-[10px] focus:outline-none focus:border-teal-500 cursor-pointer"
                            >
                              <option value="en">English</option>
                              <option value="ta">தமிழ் (Tamil)</option>
                              <option value="hi">हिंदी (Hindi)</option>
                              <option value="mr">मराठी (Marathi)</option>
                            </select>
                          </div>
                          
                          <button
                            onClick={handleCloseEmergency}
                            className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs"
                          >
                            Close Session
                          </button>
                        </div>
                      </div>

                      {/* Chat Messages */}
                      <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50/50">
                        {messages.map((m) => {
                          const isDoctor = m.senderRole === 'DOCTOR';
                          const isSystem = m.senderRole === 'SYSTEM';

                          if (isSystem) {
                            return (
                              <div key={m.id} className="p-2 bg-white border border-slate-200 rounded-xl text-[10px] text-slate-500 text-center font-mono shadow-2xs">
                                {m.message}
                              </div>
                            );
                          }

                          const displayInfo = getDisplayText(m);
                          const showOriginal = showOriginalMap[m.id];

                          return (
                            <div key={m.id} className={`flex ${isDoctor ? 'justify-end' : 'justify-start'}`}>
                              <div className={`max-w-[75%] p-3.5 rounded-2xl text-xs leading-relaxed ${
                                isDoctor
                                  ? 'bg-teal-600 text-white shadow-xs'
                                  : 'bg-white border border-slate-200 text-slate-800 shadow-xs'
                              }`}>
                                <div className={`flex justify-between items-center text-[9px] uppercase font-bold tracking-wider mb-1 gap-3 ${
                                  isDoctor ? 'text-teal-100' : 'text-slate-400'
                                }`}>
                                  <span>{isDoctor ? 'You (Practitioner)' : 'Patient'}</span>
                                  <span className={`text-[8px] font-mono ${isDoctor ? 'text-teal-200' : 'text-teal-600'}`}>
                                    {displayInfo.label}
                                  </span>
                                </div>

                                <p className="text-xs">{displayInfo.text}</p>

                                <button
                                  type="button"
                                  onClick={() => toggleShowOriginal(m.id)}
                                  className={`mt-2 text-[9px] font-bold underline cursor-pointer block ${
                                    isDoctor ? 'text-teal-100 hover:text-white' : 'text-teal-600 hover:text-teal-800'
                                  }`}
                                >
                                  {showOriginal ? 'Hide Original' : 'View Original'}
                                </button>
                              </div>
                            </div>
                          );
                        })}
                        <div ref={messagesEndRef} />
                      </div>

                      {/* Input bar */}
                      <form onSubmit={handleSendChatMessage} className="p-4 bg-white border-t border-slate-200 flex gap-3">
                        <input
                          type="text"
                          value={replyInput}
                          onChange={(e) => setReplyInput(e.target.value)}
                          disabled={selectedRequest.status === 'CLOSED'}
                          placeholder={selectedRequest.status === 'CLOSED' ? 'Session closed.' : 'Type clinical triage response...'}
                          className="flex-1 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 text-xs focus:outline-none focus:border-teal-500 disabled:opacity-50 shadow-2xs"
                        />
                        <button
                          type="submit"
                          disabled={selectedRequest.status === 'CLOSED' || !replyInput.trim()}
                          className="px-5 py-2.5 bg-teal-600 text-white rounded-xl hover:bg-teal-700 font-bold text-xs disabled:opacity-40 uppercase tracking-wider transition-all cursor-pointer shadow-xs"
                        >
                          Transmit
                        </button>
                      </form>
                    </div>

                    {/* AI Hand-off Summary */}
                    {messages.length > 1 && (
                      <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs space-y-3">
                        <button
                          onClick={generateHandoffSummary}
                          className="w-full py-2.5 bg-teal-50 hover:bg-teal-100/80 text-teal-700 border border-teal-200 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                          <span>Compile AI Hand-off Summary</span>
                        </button>
                        {aiSummary && (
                          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 leading-relaxed whitespace-pre-line font-mono">
                            {aiSummary}
                          </div>
                        )}
                      </div>
                    )}

                  </div>

                  {/* Right col: Triage Details & Medical Records */}
                  <div className="lg:col-span-4 space-y-6">
                    
                    {/* Triage Coordination Info */}
                    <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs space-y-3">
                      <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-3">
                        <ShieldAlert className="w-4 h-4 text-rose-600" />
                        Triage Coordination Details
                      </h4>

                      {emergencyContext ? (
                        <div className="text-xs space-y-3">
                          <div>
                            <span className="text-[10px] font-bold text-slate-400 block uppercase">Reported Symptoms</span>
                            <p className="font-semibold text-slate-800 mt-0.5">{emergencyContext.symptoms.join(', ')}</p>
                          </div>
                          <div>
                            <span className="text-[10px] font-bold text-slate-400 block uppercase">Triage Category</span>
                            <p className="font-semibold text-slate-800 mt-0.5">{emergencyContext.category}</p>
                          </div>
                          <div>
                            <span className="text-[10px] font-bold text-slate-400 block uppercase">Triage Priority</span>
                            <p className="font-bold text-rose-600 mt-0.5">{emergencyContext.priority}</p>
                          </div>
                        </div>
                      ) : (
                        <p className="text-xs text-slate-500">Loading context details...</p>
                      )}
                    </div>

                    {/* Medical Summary */}
                    <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs space-y-3">
                      <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-3">
                        Medical Summary
                      </h4>

                      {medicalSummary ? (
                        <div className="text-xs space-y-2.5 font-sans">
                          <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                            <span className="text-[10px] font-bold text-slate-400 uppercase block mb-0.5">Blood Group</span>
                            <strong className="text-teal-700 font-bold font-mono">{medicalSummary.bloodGroup}</strong>
                          </div>
                          <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                            <span className="text-[10px] font-bold text-slate-400 uppercase block mb-0.5">Allergies</span>
                            <strong className="text-rose-600 font-bold">{medicalSummary.allergies.join(', ') || 'None'}</strong>
                          </div>
                          <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                            <span className="text-[10px] font-bold text-slate-400 uppercase block mb-0.5">Chronic Conditions</span>
                            <strong className="text-slate-800 font-semibold">{medicalSummary.chronicConditions.join(', ') || 'None'}</strong>
                          </div>
                        </div>
                      ) : (
                        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex items-center gap-2.5 text-slate-500 text-xs">
                          <ShieldCheck className="w-5 h-5 text-slate-400 shrink-0" />
                          <span>Medical history locked. Waiting for patient consent...</span>
                        </div>
                      )}
                    </div>

                    {/* ASHA Field Screenings Panel */}
                    <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs space-y-3">
                      <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-3">
                        ASHA Community Screenings
                      </h4>
                      {ashaScreenings && ashaScreenings.length > 0 ? (
                        <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                          {ashaScreenings.map((scr: any) => (
                            <div key={scr.id} className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2 font-sans">
                              <div className="flex justify-between border-b border-slate-200/80 pb-1.5 text-[10px] text-slate-500 font-mono">
                                <span>{new Date(scr.screening_date).toLocaleDateString()}</span>
                                <span className={scr.risk_level === 'URGENT' || scr.risk_level === 'PRIORITY' ? 'text-rose-600 font-bold' : 'text-slate-600 font-bold'}>
                                  {scr.risk_level}
                                </span>
                              </div>
                              <div className="grid grid-cols-2 gap-1.5 text-xs font-mono">
                                <div>BP: <span className="font-bold text-slate-800">{scr.systolic_status === 'MEASURED' ? `${scr.systolic}/${scr.diastolic}` : 'N/A'}</span></div>
                                <div>SpO2: <span className="font-bold text-slate-800">{scr.spo2_status === 'MEASURED' ? `${scr.spo2}%` : 'N/A'}</span></div>
                              </div>
                              {scr.risk_flags && JSON.parse(scr.risk_flags).length > 0 && (
                                <div className="text-[11px] text-rose-600 font-bold pt-1">
                                  ⚠️ {JSON.parse(scr.risk_flags).join('; ')}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-slate-500 text-xs italic">No community screening records found for this patient.</p>
                      )}
                    </div>

                  </div>
                </div>
              ) : (
                <div className="bg-white border border-slate-200 p-12 rounded-2xl shadow-xs text-center space-y-3 font-sans">
                  <HeartPulse className="w-10 h-10 text-teal-500/40 mx-auto" />
                  <h3 className="text-sm font-bold text-slate-800">No Active Consultation Running</h3>
                  <p className="text-xs text-slate-500 max-w-md mx-auto">Select an emergency request from the Emergency Requests queue tab to activate a consultation workspace.</p>
                </div>
              )}
            </div>
          )}

          {/* Tab 4: ASHA Field Screenings Detailed Grid */}
          {activeTab === 'screenings' && (
            <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-xs space-y-4 font-sans">
              <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3">
                ASHA Community Field Screenings
              </h3>
              {ashaScreenings && ashaScreenings.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {ashaScreenings.map((scr: any) => (
                    <div key={scr.id} className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-3 text-xs">
                      <div className="flex justify-between items-center border-b border-slate-200 pb-2 text-xs font-mono text-slate-500">
                        <span>Date: {new Date(scr.screening_date).toLocaleString()}</span>
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          scr.risk_level === 'URGENT' || scr.risk_level === 'PRIORITY' ? 'bg-rose-100 text-rose-700 border border-rose-200' : 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                        }`}>
                          {scr.risk_level}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-slate-700 font-sans">
                        <div className="bg-white p-3 rounded-xl border border-slate-200">
                          <span className="text-[10px] font-bold text-slate-400 uppercase block mb-0.5">Blood Pressure</span>
                          <strong className="font-mono">{scr.systolic_status === 'MEASURED' ? `${scr.systolic}/${scr.diastolic} mmHg` : scr.systolic_status === 'NOT_MEASURED' ? 'Not measured' : 'Equipment unavailable'}</strong>
                        </div>
                        <div className="bg-white p-3 rounded-xl border border-slate-200">
                          <span className="text-[10px] font-bold text-slate-400 uppercase block mb-0.5">Pulse Rate</span>
                          <strong className="font-mono">{scr.pulse_status === 'MEASURED' ? `${scr.pulse} BPM` : scr.pulse_status === 'NOT_MEASURED' ? 'Not measured' : 'Equipment unavailable'}</strong>
                        </div>
                        <div className="bg-white p-3 rounded-xl border border-slate-200">
                          <span className="text-[10px] font-bold text-slate-400 uppercase block mb-0.5">SpO2 (Oxygen)</span>
                          <strong className="font-mono">{scr.spo2_status === 'MEASURED' ? `${scr.spo2}%` : scr.spo2_status === 'NOT_MEASURED' ? 'Not measured' : 'Equipment unavailable'}</strong>
                        </div>
                        <div className="bg-white p-3 rounded-xl border border-slate-200">
                          <span className="text-[10px] font-bold text-slate-400 uppercase block mb-0.5">Temperature</span>
                          <strong className="font-mono">{scr.temperature_status === 'MEASURED' ? `${scr.temperature}°F` : scr.temperature_status === 'NOT_MEASURED' ? 'Not measured' : 'Equipment unavailable'}</strong>
                        </div>
                      </div>

                      {scr.risk_flags && JSON.parse(scr.risk_flags).length > 0 && (
                        <div className="p-3 rounded-xl bg-rose-100/70 border border-rose-200 text-xs text-rose-900 font-bold">
                          ⚠️ Referral Flags: {JSON.parse(scr.risk_flags).join('; ')}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-slate-500 text-xs italic text-center py-8">No community screening records found for this patient.</p>
              )}
            </div>
          )}

          {/* Tab 5: History Archive */}
          {activeTab === 'history' && (
            <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-xs space-y-4 font-sans">
              <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3">
                Consultation Archive
              </h3>

              <div className="overflow-x-auto text-xs">
                <table className="w-full text-left font-sans">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-400 uppercase text-[10px] font-bold">
                      <th className="pb-3">Emergency ID</th>
                      <th className="pb-3">Triage Category</th>
                      <th className="pb-3">Priority</th>
                      <th className="pb-3">Date</th>
                      <th className="pb-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {emergencyRequests.filter(r => r.status === 'CLOSED').length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-slate-500">No completed consultations in archive.</td>
                      </tr>
                    ) : (
                      emergencyRequests.filter(r => r.status === 'CLOSED').map(req => (
                        <tr key={req.requestId} className="text-slate-700">
                          <td className="py-3 font-bold font-mono text-slate-900">{req.emergencyId.substring(0, 14)}...</td>
                          <td className="py-3">{req.category}</td>
                          <td className="py-3">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              req.priority === 'HIGH' ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-700'
                            }`}>
                              {req.priority}
                            </span>
                          </td>
                          <td className="py-3 font-mono">{new Date(req.requestedAt).toLocaleDateString()}</td>
                          <td className="py-3 text-emerald-700 font-bold">RESOLVED</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Tab 6: Practitioner Profile */}
          {activeTab === 'profile' && doctor && (
            <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-xs space-y-5 font-sans max-w-xl">
              <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3">
                Medical Practitioner Profile
              </h3>

              <div className="space-y-3 text-xs">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 block uppercase">Practitioner Name</span>
                    <strong className="text-slate-900 text-sm font-bold">{doctor.name}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 block uppercase">Medical Specialty</span>
                    <strong className="text-slate-800 font-bold">{doctor.specialty}</strong>
                  </div>
                </div>

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 block uppercase">Affiliation Hospital</span>
                    <strong className="text-slate-800 font-bold">Government General Hospital</strong>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 block uppercase">Availability Triage Status</span>
                    <strong className="text-rose-600 font-bold uppercase">{availability}</strong>
                  </div>
                </div>

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 block uppercase mb-1">Doctor ID Identification</span>
                  <code className="text-slate-800 font-bold font-mono select-all bg-white px-2.5 py-1 rounded-md border border-slate-200">
                    {doctor.id}
                  </code>
                </div>
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}
