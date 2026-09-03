import React, { useState, useEffect, useRef } from 'react';
import { 
  HeartPulse, ShieldAlert, Send, Clock, User, ShieldCheck, 
  AlertTriangle, RefreshCw, XCircle, ArrowLeft, CheckSquare
} from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { emergencyNetworkService } from '../../services/api';
import { socketService } from '../../services/socketService';

export default function EmergencyDoctorChatPage() {
  const navigate = useNavigate();
  const { sessionId } = useParams<{ sessionId: string }>();

  // State parameters
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<any>(null);
  const [requestId, setRequestId] = useState<string | null>(null);
  const [requestStatus, setRequestStatus] = useState<string>('REQUESTED'); // REQUESTED, ACCEPTED, CLOSED, etc.
  const [messages, setMessages] = useState<any[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [consentGranted, setConsentGranted] = useState(false);
  const [consentId, setConsentId] = useState<string | null>(null);
  const [doctorName, setDoctorName] = useState<string>('Connecting to nearest doctor...');
  const [errorMsg, setErrorMsg] = useState('');
  const [aiSummary, setAiSummary] = useState<string>('');
  const [participantLang, setParticipantLang] = useState<string>('ta');
  const [showOriginalMap, setShowOriginalMap] = useState<Record<string, boolean>>({});

  const toggleShowOriginal = (msgId: string) => {
    setShowOriginalMap((prev) => ({ ...prev, [msgId]: !prev[msgId] }));
  };

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Phase 1: Initialize session + create doctor request (runs ONCE on mount)
  useEffect(() => {
    if (!sessionId) return;

    const startSession = async () => {
      setLoading(true);
      try {
        const sessionRes = await emergencyNetworkService.getSession(sessionId!);
        if (sessionRes.success) {
          setSession(sessionRes.data);
        }

        // Auto-request doctor assistance on page entry
        const reqRes = await emergencyNetworkService.requestDoctorAssistance(sessionId!);
        if (reqRes.success) {
          setRequestId(reqRes.data.id);
          setRequestStatus(reqRes.data.status);
        }
      } catch (err: any) {
        const httpStatus = err?.response?.status;

        // 403 = session ownership mismatch — this account does not own the session.
        // Do NOT fall through to getDoctorAssistanceStatus() which will also 403.
        // Show a clear error immediately so the user knows to re-login.
        if (httpStatus === 403) {
          setErrorMsg(
            'Session access denied (403). This session belongs to a different account. ' +
            'Please re-login with your Citizen account and try again.'
          );
          setLoading(false);
          return;
        }

        // 409 = a doctor request already exists for this session — recover the existing request.
        // Any other error → also attempt the status fallback before giving up.
        try {
          const statusRes = await emergencyNetworkService.getDoctorAssistanceStatus(sessionId!);
          if (statusRes.success && statusRes.data) {
            setRequestId(statusRes.data.requestId);
            setRequestStatus(statusRes.data.status);
          }
        } catch (innerErr: any) {
          const msg = innerErr?.response?.data?.message || innerErr?.message || 'Unknown error';
          setErrorMsg(`Session error: ${msg}. Please re-login or refresh the page.`);
        }
      } finally {
        setLoading(false);
      }
    };

    startSession();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]); // Only run once per session, NOT when requestId changes

  // Phase 3: Setup Socket.IO connection for real-time status and message synchronization
  useEffect(() => {
    if (!sessionId) return;

    const token = sessionStorage.getItem('token');
    if (!token) return;

    const socket = socketService.connect(token);

    socket.emit('join_session', { sessionId }, (res: any) => {
      if (res && res.success) {
        console.log(`[SOCKET] Authenticated and joined room session:${sessionId}`);
      } else {
        console.error('[SOCKET] Failed to join session room:', res?.message);
      }
    });

    socket.on('doctor_request_status_updated', (data) => {
      console.log('[SOCKET] doctor_request_status_updated received:', data);
      if (data.status) {
        setRequestStatus(data.status);
        if (data.status === 'ACCEPTED' && data.doctor) {
          setDoctorName(`${data.doctor.name} is connected`);
        } else if (data.status === 'CLOSED') {
          setDoctorName('Conversation ended.');
        }
      }
    });

    socket.on('emergency_chat_message', (msg) => {
      console.log('[SOCKET] emergency_chat_message received:', msg);
      setMessages((prev) => {
        if (prev.some((m) => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
    });

    socket.on('reconnect', () => {
      console.log('[SOCKET] Citizen socket reconnected, rejoining session room');
      socket.emit('join_session', { sessionId });
    });

    return () => {
      socket.off('doctor_request_status_updated');
      socket.off('emergency_chat_message');
      socket.off('reconnect');
    };
  }, [sessionId]);

  // Phase 2: Poll status + messages every 3 seconds (runs once, stable)
  useEffect(() => {
    if (!sessionId) return;

    let isMounted = true;

    const runPolling = async () => {
      if (!isMounted) return;

      try {
        // Poll doctor request status
        const statusRes = await emergencyNetworkService.getDoctorAssistanceStatus(sessionId);
        if (!isMounted) return;

        if (!statusRes.success) {
          // API returned error body (non-2xx caught by axios interceptor would throw)
          return;
        }

        if (statusRes.data) {
          const info = statusRes.data;
          setRequestId(info.requestId);
          setRequestStatus(info.status);

          if (info.status === 'ACCEPTED' && info.doctor) {
            setDoctorName(`${info.doctor.name} is connected (${info.doctor.hospital})`);
          } else if (info.status === 'REQUESTED' && info.doctor) {
            setDoctorName(`Doctor request sent. Waiting for ${info.doctor.name} to accept...`);
          } else if (info.status === 'CLOSED') {
            setDoctorName('Conversation ended.');
          } else {
            setDoctorName('Connecting to nearest doctor...');
          }

          // Poll messages
          if (info.requestId) {
            try {
              const msgRes = await emergencyNetworkService.getChatMessages(info.requestId);
              if (isMounted && msgRes.success && Array.isArray(msgRes.data)) {
                setMessages(msgRes.data);
                // Clear any stale error once messages load successfully
                setErrorMsg((prev) => prev.startsWith('Chat error') ? '' : prev);
              }
            } catch (msgErr: any) {
              const status = msgErr?.response?.status;
              const detail = msgErr?.response?.data?.message || msgErr?.message || 'network error';
              if (status === 403) {
                setErrorMsg(`Chat error: Session ownership mismatch (403). Please re-login.`);
              } else if (status === 404) {
                setErrorMsg(`Chat error: Request not found (404). Refresh the page.`);
              } else {
                setErrorMsg(`Chat error: ${detail}`);
              }
            }
          }
        }
      } catch (err: any) {
        // getDoctorAssistanceStatus itself failed
        const status = err?.response?.status;
        if (status === 403) {
          setErrorMsg('Session access denied (403). Your session may have expired — please re-login.');
        } else if (status !== 404) {
          // 404 can happen briefly before the request is created; ignore silently
          console.warn('Polling error:', err?.response?.data || err?.message);
        }
      }
    };

    // First poll immediately, then every 3 seconds
    runPolling();
    const pollInterval = setInterval(runPolling, 3000);

    return () => {
      isMounted = false;
      clearInterval(pollInterval);
    };
  }, [sessionId]); // Stable — depends only on sessionId, NOT requestId

  // Dynamic Translation Resolver: fetches or returns stored translation based on participantLang & authoritative originalText
  useEffect(() => {
    if (!requestId || messages.length === 0) return;

    messages.forEach(async (m) => {
      if (m.senderRole === 'SYSTEM') return;
      const origLang = (m.originalLanguage || 'en').toLowerCase().substring(0, 2);
      const targetLang = participantLang.toLowerCase().substring(0, 2);

      if (origLang === targetLang) return; // Original language matches target
      if (m.translations && m.translations[targetLang]) return; // Already cached locally

      // Fetch on-demand translation from backend REST API
      try {
        const res = await emergencyNetworkService.translateChatMessage(requestId, m.id, targetLang);
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
  }, [participantLang, requestId, messages.length]);

  // Helper to determine exact text to render for a message
  const getDisplayText = (m: any) => {
    if (m.senderRole === 'SYSTEM') return m.message;
    const showOriginal = showOriginalMap[m.id];
    const origText = m.originalText || m.message;
    const origLang = (m.originalLanguage || 'en').toLowerCase().substring(0, 2);
    const targetLang = participantLang.toLowerCase().substring(0, 2);

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

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || !requestId || sending) return;

    setSending(true);
    try {
      const res = await emergencyNetworkService.sendChatMessage(requestId, inputMessage, { patientLanguage: participantLang });
      if (res.success) {
        setMessages((prev) => [...prev, res.data]);
        setInputMessage('');
      }
    } catch (err: any) {
      setErrorMsg('Failed to send message: ' + (err.response?.data?.message || err.message));
    } finally {
      setSending(false);
    }
  };

  const handleToggleConsent = async () => {
    if (!sessionId || !requestId) return;

    try {
      if (!consentGranted) {
        // Grant consent to doctor
        // In real app, the authorizedEntity is the doctor's user ID or 'doctor' role proxy
        const res = await emergencyNetworkService.grantConsent(sessionId, {
          authorizedEntity: 'doc-101', // Target doctor profile
          consentScope: ['allergies', 'currentMedications', 'chronicConditions', 'bloodGroup'],
          durationMinutes: 60
        });
        if (res.success) {
          setConsentGranted(true);
          setConsentId(res.data.consentId);
        }
      } else {
        // Revoke consent
        if (consentId) {
          const res = await emergencyNetworkService.revokeConsent(sessionId, consentId);
          if (res.success) {
            setConsentGranted(false);
            setConsentId(null);
          }
        }
      }
    } catch (err: any) {
      setErrorMsg('Consent action failed.');
    }
  };

  const handleCloseConversation = async () => {
    if (!requestId) return;
    if (!window.confirm('Are you sure you want to end this emergency consultation?')) return;

    try {
      const res = await emergencyNetworkService.closeRequest(requestId);
      if (res.success) {
        setRequestStatus('CLOSED');
        setDoctorName('Conversation ended.');
      }
    } catch (err) {
      setErrorMsg('Failed to close conversation.');
    }
  };

  const fetchAISummary = async () => {
    if (!requestId) return;
    try {
      const res = await emergencyNetworkService.getChatSummary(requestId);
      if (res.success) {
        setAiSummary(res.summary);
      }
    } catch (err) {
      setErrorMsg('Could not fetch AI summary.');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] font-mono text-xs text-slate-600 space-y-4">
        <RefreshCw className="w-8 h-8 text-rose-600 animate-spin" />
        <span>Securing emergency communication channel...</span>
      </div>
    );
  }

  const priority = session?.classification?.priority || 'LOW';
  const category = session?.classification?.category || 'GENERAL';

  return (
    <div className="space-y-6 max-w-4xl mx-auto px-4 font-mono text-xs text-slate-700">
      {/* Header bar */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <button 
          onClick={() => navigate('/citizen/emergency')}
          className="flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to ERN Dashboard</span>
        </button>
        <span className="text-[10px] bg-rose-500/10 text-rose-400 border border-rose-500/20 px-2.5 py-0.5 rounded font-bold uppercase tracking-wider">
          Live Doctor Link
        </span>
      </div>

      {/* Warning Box for HIGH priority */}
      {priority === 'HIGH' && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 space-y-2">
          <div className="flex items-center gap-2 font-bold text-sm">
            <AlertTriangle className="w-5 h-5 text-rose-400 animate-pulse" />
            <span>🚨 CRITICAL SAFETY WARNING — SEEK IMMEDIATE OFFLINE CARE</span>
          </div>
          <p className="text-slate-600 leading-relaxed">
            Your emergency has been classified as <strong className="text-rose-400">{priority} PRIORITY ({category})</strong>. 
            Do not wait for doctor responses if symptoms are worsening. Dial <strong className="text-rose-400">112 / 108</strong> immediately, or proceed to the nearest emergency room.
          </p>
        </div>
      )}

      {/* Main layout */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        
        {/* Left Column: Connection Info & Consent Gating */}
        <div className="md:col-span-4 space-y-6">
          <div className="bg-white border border-slate-200 shadow-sm p-5 rounded-2xl border border-slate-200 space-y-4">
            <h3 className="text-slate-202 font-bold border-b border-slate-200 pb-2 uppercase tracking-wide">
              ERN Active Session
            </h3>
            
            <div className="space-y-2">
              <div>
                <span className="text-[10px] text-slate-500 block uppercase">Session ID</span>
                <span className="text-slate-700 font-bold">{sessionId}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block uppercase">Priority / Category</span>
                <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                  priority === 'HIGH' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                }`}>
                  {priority} — {category}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block uppercase">Link Status</span>
                <span className="text-emerald-400 flex items-center gap-1.5 mt-0.5">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                  {requestStatus}
                </span>
              </div>
            </div>

            {requestStatus !== 'CLOSED' && (
              <button 
                onClick={handleCloseConversation}
                className="w-full py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 font-bold rounded-xl border border-rose-500/30 transition-all flex items-center justify-center gap-2"
              >
                <XCircle className="w-4 h-4" />
                <span>Close Consult</span>
              </button>
            )}
          </div>

          {/* Consent card */}
          <div className="bg-white border border-slate-200 shadow-sm p-5 rounded-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <h3 className="text-slate-202 font-bold uppercase tracking-wide">EHR History Share</h3>
              <ShieldCheck className={`w-4 h-4 ${consentGranted ? 'text-teal-400' : 'text-slate-650'}`} />
            </div>
            
            <p className="text-slate-500 leading-relaxed text-[10px]">
              Authorize the doctor to view your allergies, medications, and digital twin score to prevent adverse drug reactions.
            </p>

            <button 
              onClick={handleToggleConsent}
              className={`w-full py-2.5 rounded-xl font-bold border transition-all flex items-center justify-center gap-2 ${
                consentGranted 
                  ? 'bg-teal-500/10 border-teal-500/30 text-teal-400 hover:bg-teal-500/20'
                  : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-900'
              }`}
            >
              <span>{consentGranted ? 'Revoke EHR Access' : 'Authorize EHR Share'}</span>
            </button>
          </div>

          {/* AI Summarizer Panel */}
          {messages.length > 2 && (
            <div className="bg-white border border-slate-200 shadow-sm p-5 rounded-2xl border border-slate-200 space-y-3">
              <button
                onClick={fetchAISummary}
                className="w-full py-2 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 rounded-xl font-bold flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Generate AI Handoff</span>
              </button>
              {aiSummary && (
                <div className="p-3 bg-white border border-slate-200 rounded-xl max-h-48 overflow-y-auto text-[10px] text-slate-600 space-y-2 whitespace-pre-line">
                  {aiSummary}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Column: Secure Chat Window */}
        <div className="md:col-span-8 flex flex-col h-[500px] bg-white border border-slate-200 shadow-sm rounded-2xl border border-slate-200 overflow-hidden">
          
          {/* Chat Header */}
          <div className="p-4 bg-white border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center border border-slate-200 text-rose-600 font-bold">
                Doc
              </div>
              <div>
                <strong className="text-slate-800 text-xs block">{doctorName}</strong>
                <span className="text-[9px] text-slate-500">Secure real-time bilingual chat</span>
              </div>
            </div>
            
            {/* Participant Chat Language Selector */}
            <div className="flex items-center gap-1.5 text-[10px]">
              <span className="text-slate-400 font-bold hidden sm:inline">My Chat Language:</span>
              <select
                value={participantLang}
                onChange={(e) => setParticipantLang(e.target.value)}
                className="bg-white border border-slate-200 text-slate-700 font-bold px-2 py-1 rounded-lg text-[10px] focus:outline-none focus:border-teal-500 cursor-pointer"
              >
                <option value="ta">தமிழ் (Tamil)</option>
                <option value="hi">हिंदी (Hindi)</option>
                <option value="mr">मराठी (Marathi)</option>
                <option value="en">English</option>
              </select>
            </div>
          </div>

          {/* Messages list */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-[#030712]/50">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-slate-500 space-y-2 text-center">
                <Clock className="w-8 h-8 text-slate-700 animate-pulse" />
                <span>Waiting for doctor connection...</span>
                <span className="text-[9px] max-w-xs leading-normal">
                  Our system is dispatching this request to Sassoon General Hospital & medical officer nodes.
                </span>
              </div>
            ) : (
              messages.map((m) => {
                const isCitizen = m.senderRole === 'CITIZEN';
                const isSystem = m.senderRole === 'SYSTEM';

                if (isSystem) {
                  return (
                    <div key={m.id} className="p-3 bg-white border border-slate-200 rounded-xl text-[10px] text-slate-500 leading-relaxed">
                      {m.message}
                    </div>
                  );
                }

                const displayInfo = getDisplayText(m);
                const showOriginal = showOriginalMap[m.id];
                const canToggle = !displayInfo.isOriginal || showOriginal;

                return (
                  <div key={m.id} className={`flex ${isCitizen ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] p-3.5 rounded-2xl text-xs leading-relaxed ${
                      isCitizen 
                        ? 'bg-rose-500/20 text-rose-100 border border-rose-500/30' 
                        : 'bg-white border border-slate-200 text-slate-800'
                    }`}>
                      <div className="flex justify-between items-center text-[9px] text-slate-400 font-bold uppercase tracking-wider mb-1 gap-3">
                        <span>{isCitizen ? 'You (Patient)' : 'Attending Doctor'}</span>
                        <span className="text-[8px] text-teal-400 font-mono">
                          {displayInfo.label}
                        </span>
                      </div>
                      
                      <p className="text-xs">{displayInfo.text}</p>

                      <button
                        type="button"
                        onClick={() => toggleShowOriginal(m.id)}
                        className="mt-2 text-[9px] text-teal-400 hover:text-teal-300 font-bold underline cursor-pointer block"
                      >
                        {showOriginal ? 'Hide Original' : 'View Original'}
                      </button>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Message input */}
          <form onSubmit={handleSendMessage} className="p-3 bg-white border-t border-slate-200 flex gap-2">
            <input 
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              disabled={requestStatus === 'CLOSED' || sending}
              placeholder={requestStatus === 'CLOSED' ? 'This conversation is closed.' : 'Type your message...'}
              className="flex-1 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-250 text-xs focus:outline-none focus:border-rose-500/50 disabled:opacity-50"
            />
            <button 
              type="submit"
              disabled={requestStatus === 'CLOSED' || sending || !inputMessage.trim()}
              className="p-2.5 bg-rose-500 text-slate-950 rounded-xl hover:bg-rose-600 disabled:opacity-40 transition-all"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>

      </div>

      {errorMsg && (
        <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-600 rounded-xl font-mono text-[10px]">
          {errorMsg}
        </div>
      )}
    </div>
  );
}
