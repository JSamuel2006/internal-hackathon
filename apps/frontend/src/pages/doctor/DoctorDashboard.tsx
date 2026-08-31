import React, { useState, useEffect, useRef } from 'react';
import { 
  HeartPulse, ShieldAlert, CheckCircle2, AlertCircle, RefreshCw, Send, ShieldCheck, Stethoscope, Star, Check, Plus,
  LayoutDashboard, MessageSquare, History, User, LogOut, Clock, Activity, ClipboardList
} from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { emergencyNetworkService, doctorApiService, authService, workerService } from '../../services/api';
import { socketService } from '../../services/socketService';

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
      const res = await emergencyNetworkService.sendChatMessage(selectedRequest.requestId, replyInput);
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

  // Color mapping helpers
  const availStatusColors = {
    AVAILABLE: { text: 'text-emerald-400', label: '🟢 AVAILABLE', desc: 'Ready to accept patients' },
    ONLINE: { text: 'text-emerald-400', label: '🟢 AVAILABLE', desc: 'Ready to accept patients' },
    BUSY: { text: 'text-amber-400', label: '🟠 BUSY', desc: 'Not accepting new emergency requests' },
    IN_CONSULTATION: { text: 'text-rose-500', label: '🔴 IN CONSULTATION', desc: 'Currently attending a patient' },
    OFFLINE: { text: 'text-slate-600', label: '⚫ OFFLINE', desc: 'Not available for emergency requests' }
  };

  return (
    <div className="min-h-screen bg-[#030712] text-slate-900 font-mono text-xs flex">
      {/* Sidebar Panel */}
      <aside className="w-64 border-r border-slate-200 bg-white p-6 flex flex-col justify-between shrink-0 select-none">
        <div className="space-y-6">
          <div className="flex items-center gap-2 pb-4 border-b border-slate-200">
            <HeartPulse className="w-6 h-6 text-rose-500 animate-pulse" />
            <div>
              <span className="font-bold text-sm tracking-wide text-slate-800">ArogyaMitra</span>
              <span className="text-[9px] block text-rose-500 uppercase tracking-widest font-bold">DOCTOR PORTAL</span>
            </div>
          </div>

          {doctor && (
            <div className="py-2 border-b border-slate-200">
              <span className="text-slate-800 font-bold block text-[11px]">{doctor.name}</span>
              <span className="text-slate-500 text-[9px] block uppercase">{doctor.specialty}</span>
            </div>
          )}

          {/* MAIN Section */}
          <div className="space-y-1">
            <span className="text-[9px] uppercase tracking-widest text-slate-600 font-bold block mb-1">MAIN</span>
            <button
              onClick={() => setSearchParams({ tab: 'dashboard' })}
              className={`w-full py-2 px-3 rounded-lg border text-left font-bold text-[10px] uppercase transition-all flex items-center gap-2 ${
                activeTab === 'dashboard'
                  ? 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                  : 'border-transparent text-slate-600 hover:text-slate-800 hover:bg-white'
              }`}
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span>Dashboard</span>
            </button>
          </div>

          {/* EMERGENCY CARE Section */}
          <div className="space-y-1">
            <span className="text-[9px] uppercase tracking-widest text-slate-600 font-bold block mb-1">EMERGENCY CARE</span>
            <button
              onClick={() => setSearchParams({ tab: 'emergency' })}
              className={`w-full py-2 px-3 rounded-lg border text-left font-bold text-[10px] uppercase transition-all flex items-center justify-between ${
                activeTab === 'emergency'
                  ? 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                  : 'border-transparent text-slate-600 hover:text-slate-800 hover:bg-white'
              }`}
            >
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>Emergency Requests</span>
              </div>
              {emergencyRequests.filter(r => r.status === 'REQUESTED').length > 0 && (
                <span className="bg-rose-500 text-slate-950 px-1.5 py-0.5 rounded text-[8px] font-extrabold animate-pulse">
                  {emergencyRequests.filter(r => r.status === 'REQUESTED').length}
                </span>
              )}
            </button>

            <button
              onClick={() => setSearchParams({ tab: 'chats' })}
              className={`w-full py-2 px-3 rounded-lg border text-left font-bold text-[10px] uppercase transition-all flex items-center justify-between ${
                activeTab === 'chats'
                  ? 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                  : 'border-transparent text-slate-600 hover:text-slate-800 hover:bg-white'
              }`}
            >
              <div className="flex items-center gap-2">
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Active Chats</span>
              </div>
              {availability === 'IN_CONSULTATION' && (
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
              )}
            </button>
          </div>

          {/* RECORDS Section */}
          <div className="space-y-1">
            <span className="text-[9px] uppercase tracking-widest text-slate-600 font-bold block mb-1">RECORDS</span>
            {selectedRequest && (
              <button
                onClick={() => setSearchParams({ tab: 'screenings' })}
                className={`w-full py-2 px-3 rounded-lg border text-left font-bold text-[10px] uppercase transition-all flex items-center gap-2 ${
                  activeTab === 'screenings'
                    ? 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                    : 'border-transparent text-slate-600 hover:text-slate-800 hover:bg-white'
                }`}
              >
                <ClipboardList className="w-3.5 h-3.5" />
                <span>ASHA Screenings</span>
              </button>
            )}

            <button
              onClick={() => setSearchParams({ tab: 'history' })}
              className={`w-full py-2 px-3 rounded-lg border text-left font-bold text-[10px] uppercase transition-all flex items-center gap-2 ${
                activeTab === 'history'
                  ? 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                  : 'border-transparent text-slate-600 hover:text-slate-800 hover:bg-white'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>History</span>
            </button>

            <button
              onClick={() => setSearchParams({ tab: 'profile' })}
              className={`w-full py-2 px-3 rounded-lg border text-left font-bold text-[10px] uppercase transition-all flex items-center gap-2 ${
                activeTab === 'profile'
                  ? 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                  : 'border-transparent text-slate-600 hover:text-slate-800 hover:bg-white'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>Profile</span>
            </button>
          </div>

          {/* MY AVAILABILITY Section */}
          <div className="space-y-2 pt-2 border-t border-slate-200">
            <span className="text-[9px] uppercase tracking-widest text-slate-600 font-bold block">MY AVAILABILITY</span>
            <div className="flex flex-col gap-1">
              {(['AVAILABLE', 'BUSY', 'OFFLINE'] as const).map((status) => (
                <button
                  key={status}
                  onClick={() => handleUpdateAvailability(status)}
                  disabled={availability === 'IN_CONSULTATION'}
                  className={`w-full py-1.5 px-3 rounded-lg border text-left font-bold text-[9px] uppercase transition-all flex items-center justify-between ${
                    availability === status 
                      ? 'bg-rose-500/10 border-rose-500/20 text-rose-400 font-extrabold' 
                      : 'border-transparent text-slate-500 hover:text-slate-350 disabled:opacity-30'
                  }`}
                >
                  <span>{status}</span>
                  <span className={`w-1.5 h-1.5 rounded-full ${
                    status === 'AVAILABLE' ? 'bg-emerald-500' : status === 'BUSY' ? 'bg-amber-500' : 'bg-slate-500'
                  }`} />
                </button>
              ))}
              {availability === 'IN_CONSULTATION' && (
                <div className="py-1.5 px-3 rounded-lg border border-rose-500/20 bg-rose-500/5 text-rose-400 font-bold text-[9px] uppercase flex items-center justify-between">
                  <span>IN CONSULTATION</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                </div>
              )}
            </div>
          </div>

          {/* CURRENT STATUS Info */}
          <div className="p-3 rounded-xl bg-white border border-slate-200 text-[10px]">
            <span className="text-slate-550 block uppercase text-[8px] tracking-wider mb-1 font-bold">CURRENT STATUS</span>
            <strong className={availStatusColors[availability].text}>{availStatusColors[availability].label}</strong>
            <p className="text-slate-500 text-[9px] mt-0.5">{availStatusColors[availability].desc}</p>
          </div>

          {/* CURRENT CONSULTATION Section */}
          {selectedRequest && (
            <div className="p-3.5 rounded-xl bg-rose-500/5 border border-rose-500/10 text-[10px] space-y-2.5 animate-pulse">
              <div>
                <span className="text-[8px] text-rose-400 font-bold uppercase tracking-wider block">CURRENT CONSULTATION</span>
                <span className="text-[9px] text-slate-500 font-mono block">ID: {selectedRequest.emergencyId.substring(0, 12)}...</span>
              </div>
              <div className="flex justify-between text-slate-350">
                <span>Elapsed:</span>
                <strong className="text-rose-400 flex items-center gap-1 font-bold">
                  <Clock className="w-3 h-3 text-rose-500" />
                  {formatTime(elapsedSeconds)}
                </strong>
              </div>
              <button 
                onClick={() => setSearchParams({ tab: 'chats' })}
                className="w-full py-1.5 bg-rose-500 text-slate-950 font-bold rounded-lg text-[9px] uppercase hover:bg-rose-400"
              >
                OPEN CHAT
              </button>
            </div>
          )}
        </div>

        <button 
          onClick={handleLogout}
          className="w-full py-2 border border-slate-200 bg-white text-slate-500 hover:text-rose-455 hover:bg-rose-500/5 transition-all text-center rounded-xl font-bold uppercase tracking-wider text-[9px]"
        >
          Sign Out Portal
        </button>
      </aside>

      {/* Main Workspace */}
      <main className="flex-1 p-8 overflow-y-auto space-y-6">
        
        {/* Dashboard Status Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-200 pb-5">
          {doctor ? (
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                {doctor.name}
                <span className="text-[9px] bg-rose-500/10 text-rose-400 border border-rose-500/20 px-2 py-0.5 rounded font-mono uppercase font-bold">
                  SIH Demo Doctor
                </span>
              </h2>
              <p className="text-slate-500 mt-0.5">
                {doctor.specialty} | Government General Hospital
              </p>
            </div>
          ) : (
            <p className="text-slate-500">Retrieving doctor profile...</p>
          )}

          <div className="flex flex-col lg:flex-row lg:items-end gap-3 text-right">
            <div>
              <span className="text-[9px] text-slate-550 block uppercase tracking-wider">Current Patient Status</span>
              <strong className="text-slate-700">
                {selectedRequest ? `Consulting ID: ${selectedRequest.emergencyId.substring(0, 8)}...` : 'None'}
              </strong>
            </div>
            <button
              onClick={syncDashboardData}
              disabled={loading}
              className="px-4 py-2 border border-slate-200 bg-white hover:bg-slate-800 text-slate-700 font-semibold rounded-xl text-[9px] uppercase flex items-center gap-2 transition-all"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Sync Dashboard</span>
            </button>
          </div>
        </div>

        {/* Global Safety Alert Banner */}
        <div className="p-4 rounded-xl bg-rose-500/5 border border-rose-500/10 text-rose-400 text-[10px] leading-relaxed flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold uppercase tracking-wider text-rose-455 mb-0.5"> Traumatology Emergency Notice</p>
            <p className="text-slate-455">
              This system is an emergency coordination and decision-support tool. It does not replace emergency medical services or professional clinical judgment. For critical life-threatening situations, prioritize immediate transport and call 112.
            </p>
          </div>
        </div>

        {/* Error / Success Notifications */}
        {successMsg && (
          <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-450 text-[10px] flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span className="font-bold">{successMsg}</span>
          </div>
        )}
        {error && (
          <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-455 text-[10px] flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400" />
            <span className="font-bold">{error}</span>
          </div>
        )}

        {/* Dynamic Route/Tab rendering */}
        {activeTab === 'dashboard' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white border border-slate-200 shadow-sm p-6 rounded-2xl border border-slate-200 bg-white space-y-2">
              <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold block">Status State</span>
              <p className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <span className={`w-3.5 h-3.5 rounded-full ${
                  availability === 'AVAILABLE' ? 'bg-emerald-500 animate-pulse' : availability === 'BUSY' ? 'bg-amber-500' : availability === 'IN_CONSULTATION' ? 'bg-rose-500 animate-ping' : 'bg-slate-500'
                }`} />
                {availability}
              </p>
              <p className="text-slate-500 text-[10px]">Toggled availability will control triage flow.</p>
            </div>
            
            <div className="bg-white border border-slate-200 shadow-sm p-6 rounded-2xl border border-slate-200 bg-white space-y-2">
              <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold block">Pending Requests</span>
              <p className="text-xl font-bold text-rose-400">
                {emergencyRequests.filter(r => r.status === 'REQUESTED').length} Requests
              </p>
              <p className="text-slate-500 text-[10px]">Awaiting acceptance from availability queue.</p>
            </div>

            <div className="bg-white border border-slate-200 shadow-sm p-6 rounded-2xl border border-slate-200 bg-white space-y-2">
              <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold block">Active Consultation</span>
              <p className="text-base font-bold text-slate-800">
                {selectedRequest ? '1 consultation running' : 'No active session'}
              </p>
              <p className="text-slate-500 text-[10px]">Derived securely using authenticated JWT credentials.</p>
            </div>
          </div>
        )}

        {activeTab === 'emergency' && (
          <div className="bg-white border border-slate-200 shadow-sm p-6 rounded-2xl border border-slate-200 bg-white space-y-4">
            <h3 className="text-xs font-bold text-slate-350 uppercase tracking-widest border-b border-slate-200 pb-2">
              Assistance Request Queue
            </h3>
            
            {availability === 'OFFLINE' ? (
              <p className="text-slate-600 py-6 text-center">You are currently offline. Please set your availability status to AVAILABLE to fetch requests.</p>
            ) : emergencyRequests.filter(r => r.status === 'REQUESTED').length === 0 ? (
              <p className="text-slate-600 py-6 text-center">No active doctor assistance requests found.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {emergencyRequests.filter(r => r.status === 'REQUESTED').map((req) => (
                  <div key={req.requestId} className="p-4 rounded-xl border border-slate-200 bg-white space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        {req.priority === 'HIGH' && (
                          <span className="inline-block px-2 py-0.5 rounded text-[9px] font-extrabold uppercase tracking-wider bg-rose-500/20 text-rose-400 border border-rose-500/30 animate-pulse mb-1.5">
                            🔴 High Priority Emergency
                          </span>
                        )}
                        <h4 className="text-[11px] font-bold text-slate-800">{req.category} EMERGENCY</h4>
                      </div>
                      <span className="text-[9px] text-slate-500 font-mono">
                        {new Date(req.requestedAt).toLocaleTimeString()}
                      </span>
                    </div>

                    <div className="text-[10px] text-slate-500 space-y-1">
                      <p>Session ID: <strong className="text-slate-350">{req.emergencyId}</strong></p>
                      <p>Priority Triage: <strong className="text-slate-350">{req.priority}</strong></p>
                    </div>

                    {req.priority === 'HIGH' && (
                      <div className="p-2.5 rounded bg-rose-500/5 border border-rose-500/10 text-[9px] text-rose-455 font-bold uppercase tracking-wider">
                        ⚠️ Action Required: CALL 112 / SEEK IMMEDIATE EMERGENCY CARE
                      </div>
                    )}

                    <div className="flex gap-2 pt-1.5">
                      <button 
                        onClick={() => handleAcceptRequest(req.requestId)}
                        className="flex-1 py-1.5 bg-rose-500 text-slate-950 font-bold rounded-lg text-[9px] uppercase hover:bg-rose-400"
                      >
                        Accept Request
                      </button>
                      <button 
                        onClick={() => handleDeclineRequest(req.requestId)}
                        className="py-1.5 px-3 bg-white border border-slate-200 text-slate-500 hover:text-rose-455 rounded-lg text-[9px] uppercase"
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

        {activeTab === 'chats' && (
          <div>
            {selectedRequest ? (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-fade-in">
                {/* Left col: Chat & Handoff */}
                <div className="lg:col-span-8 space-y-6">
                  
                  {/* Secure Consultation Chat Room */}
                  <div className="flex flex-col h-[380px] bg-white border border-slate-200 shadow-sm rounded-2xl border border-slate-200 bg-white overflow-hidden">
                    <div className="p-3 bg-white border-b border-slate-200 flex justify-between items-center">
                      <span className="font-bold text-[9px] text-slate-500 tracking-wider uppercase">Secure Trauma Consultation Message Node</span>
                      <button
                        onClick={handleCloseEmergency}
                        className="px-3 py-1 bg-rose-650 hover:bg-rose-555 text-slate-900 rounded-lg text-[9px] uppercase font-bold"
                      >
                        Close Session
                      </button>
                    </div>

                    <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-[#030712]/30">
                      {messages.map((m) => {
                        const isDoctor = m.senderRole === 'DOCTOR';
                        const isSystem = m.senderRole === 'SYSTEM';

                        if (isSystem) {
                          return (
                            <div key={m.id} className="p-2 bg-white border border-slate-200/60 rounded text-[9px] text-slate-500 text-center">
                              {m.message}
                            </div>
                          );
                        }

                        return (
                          <div key={m.id} className={`flex ${isDoctor ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[75%] p-3 rounded-xl border text-[11px] leading-relaxed ${
                              isDoctor
                                ? 'bg-rose-500/10 border-rose-500/20 text-slate-800'
                                : 'bg-white border-slate-200 text-slate-800'
                            }`}>
                              <p className="text-[8px] text-slate-500 uppercase mb-0.5 tracking-wider font-bold">
                                {isDoctor ? 'You' : 'Patient'}
                              </p>
                              <p>{m.message}</p>
                            </div>
                          </div>
                        );
                      })}
                      <div ref={messagesEndRef} />
                    </div>

                    <form onSubmit={handleSendChatMessage} className="p-3 bg-white border-t border-slate-200 flex gap-2">
                      <input
                        type="text"
                        value={replyInput}
                        onChange={(e) => setReplyInput(e.target.value)}
                        disabled={selectedRequest.status === 'CLOSED'}
                        placeholder={selectedRequest.status === 'CLOSED' ? 'Session closed.' : 'Type clinical emergency guidance response...'}
                        className="flex-1 px-4 py-2 bg-white border border-slate-200 rounded-xl text-slate-800 text-xs focus:outline-none disabled:opacity-50"
                      />
                      <button
                        type="submit"
                        disabled={selectedRequest.status === 'CLOSED' || !replyInput.trim()}
                        className="px-4 py-2 bg-rose-500 text-slate-950 rounded-xl hover:bg-rose-400 font-bold text-xs disabled:opacity-40 uppercase"
                      >
                        Transmit
                      </button>
                    </form>
                  </div>

                  {/* AI Summary compiled summary */}
                  {messages.length > 1 && (
                    <div className="bg-white border border-slate-200 shadow-sm p-5 rounded-2xl border border-slate-200 bg-white space-y-3">
                      <button
                        onClick={generateHandoffSummary}
                        className="w-full py-2 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 rounded-xl font-bold flex items-center justify-center gap-1.5"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>Compile AI Hand-off summary</span>
                      </button>
                      {aiSummary && (
                        <div className="p-3.5 bg-white border border-slate-200 rounded-xl text-[10px] text-slate-600 leading-relaxed whitespace-pre-line">
                          {aiSummary}
                        </div>
                      )}
                    </div>
                  )}

                </div>

                {/* Right col: Context & Consent */}
                <div className="lg:col-span-4 space-y-6">
                  
                  {/* Active Trauma info banner */}
                  <div className="bg-white border border-slate-200 shadow-sm p-5 rounded-2xl border border-slate-200 bg-white space-y-3">
                    <h4 className="text-[10px] font-bold text-rose-455 uppercase tracking-widest flex items-center gap-1.5">
                      <ShieldAlert className="w-4 h-4" />
                      Coordination Details
                    </h4>

                    {emergencyContext && (
                      <div className="text-[10px] space-y-2 leading-normal">
                        <div className="space-y-1">
                          <span className="text-slate-550 block uppercase text-[8px] tracking-wider">Reported Symptoms</span>
                          <p className="text-slate-700 font-semibold">{emergencyContext.symptoms.join(', ')}</p>
                        </div>
                        <div className="space-y-1">
                          <span className="text-slate-550 block uppercase text-[8px] tracking-wider">Triage Class</span>
                          <p className="text-slate-700 font-semibold">{emergencyContext.category}</p>
                        </div>
                        <div className="space-y-1">
                          <span className="text-slate-550 block uppercase text-[8px] tracking-wider">Triage Priority</span>
                          <p className="text-rose-400 font-bold">{emergencyContext.priority}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Consent-gated Patient Records */}
                  <div className="bg-white border border-slate-200 shadow-sm p-5 rounded-2xl border border-slate-200 bg-white space-y-3">
                    <h4 className="text-[10px] font-bold text-slate-350 uppercase tracking-widest border-b border-slate-200 pb-2">
                      Medical Summary
                    </h4>

                    {medicalSummary ? (
                      <div className="text-[10px] font-mono space-y-3">
                        <div className="bg-white p-3 rounded-xl border border-slate-200">
                          <span className="text-slate-550 uppercase text-[8px] block mb-0.5">Blood Group</span>
                          <strong className="text-teal-400 font-bold">{medicalSummary.bloodGroup}</strong>
                        </div>
                        <div className="bg-white p-3 rounded-xl border border-slate-200">
                          <span className="text-slate-550 uppercase text-[8px] block mb-0.5">Allergies</span>
                          <strong className="text-rose-455 font-bold">{medicalSummary.allergies.join(', ') || 'None'}</strong>
                        </div>
                        <div className="bg-white p-3 rounded-xl border border-slate-200">
                          <span className="text-slate-550 uppercase text-[8px] block mb-0.5">Chronic Conditions</span>
                          <strong className="text-slate-700 font-semibold">{medicalSummary.chronicConditions.join(', ') || 'None'}</strong>
                        </div>
                      </div>
                    ) : (
                      <div className="p-4 bg-white rounded-xl border border-slate-200 flex items-center gap-2.5 text-slate-500">
                        <ShieldCheck className="w-5 h-5 text-slate-700 shrink-0" />
                        <span>Medical history locked. Waiting for patient consent...</span>
                      </div>
                    )}
                  </div>

                  {/* ASHA Field Screenings Panel */}
                  <div className="bg-white border border-slate-200 shadow-sm p-5 rounded-2xl border border-slate-200 bg-white space-y-3">
                    <h4 className="text-[10px] font-bold text-slate-350 uppercase tracking-widest border-b border-slate-200 pb-2">
                      ASHA Community Screenings
                    </h4>
                    {ashaScreenings && ashaScreenings.length > 0 ? (
                      <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                        {ashaScreenings.map((scr: any) => (
                          <div key={scr.id} className="p-3 bg-white rounded-xl border border-slate-200 text-[10px] font-mono space-y-2">
                            <div className="flex justify-between border-b border-slate-200 pb-1 text-slate-500 text-[8px] uppercase">
                              <span>Date: {new Date(scr.screening_date).toLocaleDateString()}</span>
                              <span className={scr.risk_level === 'URGENT' || scr.risk_level === 'PRIORITY' ? 'text-rose-455 font-bold' : 'text-slate-500'}>
                                {scr.risk_level}
                              </span>
                            </div>
                            <div className="grid grid-cols-2 gap-1 text-[9px]">
                              <div>BP: <span className="text-slate-700">{scr.systolic_status === 'MEASURED' ? `${scr.systolic}/${scr.diastolic}` : 'N/A'}</span></div>
                              <div>SpO2: <span className="text-slate-700">{scr.spo2_status === 'MEASURED' ? `${scr.spo2}%` : 'N/A'}</span></div>
                              <div>Temp: <span className="text-slate-700">{scr.temperature_status === 'MEASURED' ? `${scr.temperature}°F` : 'N/A'}</span></div>
                              <div>Glucose: <span className="text-slate-700">{scr.glucose_status === 'MEASURED' ? `${scr.glucose} mg/dL` : 'N/A'}</span></div>
                            </div>
                            {scr.symptoms && JSON.parse(scr.symptoms).length > 0 && (
                              <div>
                                <span className="text-[8px] text-slate-500 uppercase block">Symptoms</span>
                                <span className="text-slate-600">{JSON.parse(scr.symptoms).join(', ')}</span>
                              </div>
                            )}
                            {scr.risk_flags && JSON.parse(scr.risk_flags).length > 0 && (
                              <div className="text-[9px] text-rose-400 font-bold">
                                ⚠ {JSON.parse(scr.risk_flags).join('; ')}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-slate-500 italic text-[10px]">No community screening records found for this patient.</p>
                    )}
                  </div>

                </div>
              </div>
            ) : (
              <div className="h-64 flex flex-col items-center justify-center text-center p-8 text-slate-500 bg-white border border-slate-200 shadow-sm rounded-2xl border border-slate-200 bg-white">
                <HeartPulse className="w-12 h-12 text-slate-700 mb-3 animate-pulse" />
                <p className="text-xs">No active consultation running. Select a requested emergency from the requests queue tab.</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'screenings' && (
          <div className="bg-white border border-slate-200 shadow-sm p-6 rounded-2xl border border-slate-200 bg-white space-y-4">
            <h3 className="text-xs font-bold text-slate-350 uppercase tracking-widest border-b border-slate-200 pb-2">
              ASHA Community Field Screenings
            </h3>
            {ashaScreenings && ashaScreenings.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {ashaScreenings.map((scr: any) => (
                  <div key={scr.id} className="p-5 rounded-xl border border-slate-200 bg-white space-y-4 text-xs font-mono">
                    <div className="flex justify-between items-center border-b border-slate-200 pb-2 text-[10px] text-slate-500 uppercase font-bold">
                      <span>Screening Date: {new Date(scr.screening_date).toLocaleString()}</span>
                      <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold ${
                        scr.risk_level === 'URGENT' || scr.risk_level === 'PRIORITY' ? 'bg-rose-500/20 text-rose-400' : 'bg-white text-slate-600'
                      }`}>
                        {scr.risk_level}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-slate-700">
                      <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                        <span className="text-[9px] text-slate-500 uppercase block mb-1">Blood Pressure</span>
                        <strong>{scr.systolic_status === 'MEASURED' ? `${scr.systolic}/${scr.diastolic} mmHg` : scr.systolic_status === 'NOT_MEASURED' ? 'Not measured' : 'Equipment unavailable'}</strong>
                      </div>
                      <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                        <span className="text-[9px] text-slate-500 uppercase block mb-1">Pulse Rate</span>
                        <strong>{scr.pulse_status === 'MEASURED' ? `${scr.pulse} BPM` : scr.pulse_status === 'NOT_MEASURED' ? 'Not measured' : 'Equipment unavailable'}</strong>
                      </div>
                      <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                        <span className="text-[9px] text-slate-500 uppercase block mb-1">SpO2 (Oxygen)</span>
                        <strong>{scr.spo2_status === 'MEASURED' ? `${scr.spo2}%` : scr.spo2_status === 'NOT_MEASURED' ? 'Not measured' : 'Equipment unavailable'}</strong>
                      </div>
                      <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                        <span className="text-[9px] text-slate-500 uppercase block mb-1">Temperature</span>
                        <strong>{scr.temperature_status === 'MEASURED' ? `${scr.temperature}°F` : scr.temperature_status === 'NOT_MEASURED' ? 'Not measured' : 'Equipment unavailable'}</strong>
                      </div>
                      <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                        <span className="text-[9px] text-slate-500 uppercase block mb-1">Random Glucose</span>
                        <strong>{scr.glucose_status === 'MEASURED' ? `${scr.glucose} mg/dL` : scr.glucose_status === 'NOT_MEASURED' ? 'Not measured' : 'Equipment unavailable'}</strong>
                      </div>
                      <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                        <span className="text-[9px] text-slate-500 uppercase block mb-1">Weight & Height</span>
                        <strong>
                          {scr.weight_status === 'MEASURED' ? `${scr.weight} kg` : 'N/A'} / {scr.height_status === 'MEASURED' ? `${scr.height} cm` : 'N/A'}
                        </strong>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div>
                        <span className="text-[9px] text-slate-500 uppercase block font-bold">Symptoms Observed</span>
                        <p className="text-slate-355 font-semibold">{scr.symptoms ? JSON.parse(scr.symptoms).join(', ') || 'None' : 'None'}</p>
                      </div>
                      <div>
                        <span className="text-[9px] text-slate-500 uppercase block font-bold">Known Conditions</span>
                        <p className="text-slate-355 font-semibold">{scr.known_conditions ? JSON.parse(scr.known_conditions).join(', ') || 'None' : 'None'}</p>
                      </div>
                      <div>
                        <span className="text-[9px] text-slate-500 uppercase block font-bold">Known Allergies</span>
                        <p className="text-slate-355 font-semibold">{scr.allergies ? JSON.parse(scr.allergies).join(', ') || 'None' : 'None'}</p>
                      </div>
                      {scr.notes && (
                        <div>
                          <span className="text-[9px] text-slate-500 uppercase block font-bold">ASHA Worker Notes</span>
                          <p className="text-slate-355 italic">{scr.notes}</p>
                        </div>
                      )}
                      {scr.risk_flags && JSON.parse(scr.risk_flags).length > 0 && (
                        <div className="p-3 rounded-lg bg-rose-500/5 border border-rose-500/10 text-[10px] text-rose-400 font-bold">
                          ⚠ Referral Flags: {JSON.parse(scr.risk_flags).join('; ')}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-500 italic text-center py-8">No community screening records found for this patient.</p>
            )}
          </div>
        )}

        {activeTab === 'history' && (
          <div className="bg-white border border-slate-200 shadow-sm p-6 rounded-2xl border border-slate-200 bg-white space-y-4">
            <h3 className="text-xs font-bold text-slate-350 uppercase tracking-widest border-b border-slate-200 pb-2">
              Consultation Archive
            </h3>

            <div className="overflow-x-auto text-[10px]">
              <table className="w-full text-left font-mono">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 uppercase text-[9px]">
                    <th className="pb-3">Emergency ID</th>
                    <th className="pb-3">Triage Category</th>
                    <th className="pb-3">Priority</th>
                    <th className="pb-3">Date</th>
                    <th className="pb-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-900/50">
                  {emergencyRequests.filter(r => r.status === 'CLOSED').length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-slate-600">No completed consultations in archive.</td>
                    </tr>
                  ) : (
                    emergencyRequests.filter(r => r.status === 'CLOSED').map(req => (
                      <tr key={req.requestId} className="text-slate-700">
                        <td className="py-3 font-bold">{req.emergencyId.substring(0, 14)}...</td>
                        <td className="py-3">{req.category}</td>
                        <td className="py-3">
                          <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold ${
                            req.priority === 'HIGH' ? 'bg-rose-500/20 text-rose-400' : 'bg-white text-slate-600'
                          }`}>
                            {req.priority}
                          </span>
                        </td>
                        <td className="py-3">{new Date(req.requestedAt).toLocaleDateString()}</td>
                        <td className="py-3 text-emerald-400 font-bold">RESOLVED</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'profile' && doctor && (
          <div className="bg-white border border-slate-200 shadow-sm p-6 rounded-2xl border border-slate-200 bg-white space-y-6 max-w-xl">
            <h3 className="text-xs font-bold text-slate-350 uppercase tracking-widest border-b border-slate-200 pb-2">
              Medical Practitioner Profile
            </h3>

            <div className="space-y-4 font-mono text-[10px]">
              <div className="bg-white p-4 rounded-xl border border-slate-200 grid grid-cols-2 gap-4">
                <div>
                  <span className="text-slate-550 block uppercase text-[8px]">Practitioner Name</span>
                  <strong className="text-slate-800 text-sm font-bold">{doctor.name}</strong>
                </div>
                <div>
                  <span className="text-slate-550 block uppercase text-[8px]">Medical Specialty</span>
                  <strong className="text-slate-800 font-bold">{doctor.specialty}</strong>
                </div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-200 grid grid-cols-2 gap-4">
                <div>
                  <span className="text-slate-550 block uppercase text-[8px]">Affiliation Hospital</span>
                  <strong className="text-slate-800 font-bold">Government General Hospital</strong>
                </div>
                <div>
                  <span className="text-slate-550 block uppercase text-[8px]">Availability Triage Status</span>
                  <strong className="text-rose-455 font-bold uppercase">{availability}</strong>
                </div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-200">
                <span className="text-slate-550 block uppercase text-[8px] mb-1">Doctor ID Identification</span>
                <code className="text-slate-600 font-bold select-all bg-white px-2 py-1 rounded border border-slate-200">
                  {doctor.id}
                </code>
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
