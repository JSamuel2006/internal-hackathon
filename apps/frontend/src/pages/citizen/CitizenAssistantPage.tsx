import React, { useState, useEffect } from 'react';
import { 
  Bot, Send, Mic, Volume2, Star, ThumbsUp, 
  Trash2, Plus, Sparkles, MessageCircle, AlertTriangle, Eye, EyeOff, Edit
} from 'lucide-react';
import { assistantService } from '../../services/api';

const SUGGESTED_PROMPTS = [
  'Can I take Amoxicillin with my Penicillin allergy?',
  'What does my HbA1c lab result mean?',
  'Check cardiac risks based on my Digital Twin',
  'Review my current medicines for interactions',
];

const LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'hi-IN', name: 'Hindi' },
  { code: 'ta-IN', name: 'Tamil' },
  { code: 'te-IN', name: 'Telugu' },
  { code: 'mr-IN', name: 'Marathi' },
  { code: 'bn-IN', name: 'Bengali' },
];

export default function CitizenAssistantPage() {
  const [sessions, setSessions] = useState<any[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string>('');
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  
  // Persist & restore response language from localStorage or global i18n
  const [languageCode, setLanguageCode] = useState<string>(() => {
    const saved = localStorage.getItem('arogya_ai_response_language');
    if (saved) return saved;
    const globalLang = localStorage.getItem('arogya_language') || 'en';
    if (globalLang.startsWith('ta')) return 'ta-IN';
    if (globalLang.startsWith('hi')) return 'hi-IN';
    if (globalLang.startsWith('mr')) return 'mr-IN';
    return 'en';
  });

  const [loading, setLoading] = useState(false);
  const [listening, setListening] = useState(false);

  // Sync language selection changes to localStorage
  const handleLanguageChange = (newLang: string) => {
    setLanguageCode(newLang);
    localStorage.setItem('arogya_ai_response_language', newLang);
  };

  // Search and Context states
  const [searchQuery, setSearchQuery] = useState('');
  const [showContext, setShowContext] = useState(true);
  const [patientContext, setPatientContext] = useState<any>({
    allergies: ['Penicillin Allergy'],
    chronicDiseases: ['Diabetes Mellitus'],
    medications: ['Paracetamol 650mg 1-0-1'],
    biomarkers: { HbA1c: '6.2%', creatinine: '0.8 mg/dL' },
    digitalTwin: { overallHealthScore: 85, cardiacScore: 88, kidneyScore: 90 }
  });

  // Load user sessions on mount
  const loadSessions = async () => {
    try {
      const res = await assistantService.getSessions();
      if (res.success && res.data.sessions) {
        setSessions(res.data.sessions);
        if (res.data.sessions.length > 0 && !currentSessionId) {
          selectSession(res.data.sessions[0].id);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadSessions();
  }, []);

  const createNewSession = async () => {
    try {
      const res = await assistantService.createSession(languageCode);
      if (res.success && res.data.session) {
        setSessions([res.data.session, ...sessions]);
        setCurrentSessionId(res.data.session.id);
        setMessages([]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const selectSession = async (id: string) => {
    setCurrentSessionId(id);
    try {
      const res = await assistantService.getSession(id);
      if (res.success && res.data.session) {
        setMessages(res.data.session.messages || []);
        if (res.data.session.language) {
          const sLang = res.data.session.language;
          if (sLang === 'ta' || sLang === 'ta-IN') setLanguageCode('ta-IN');
          else if (sLang === 'hi' || sLang === 'hi-IN') setLanguageCode('hi-IN');
          else if (sLang === 'mr' || sLang === 'mr-IN') setLanguageCode('mr-IN');
          else if (sLang === 'en') setLanguageCode('en');
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const deleteSession = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this session?')) return;
    try {
      const res = await assistantService.deleteSession(id);
      if (res.success) {
        setSessions(sessions.filter(s => s.id !== id));
        if (currentSessionId === id) {
          setCurrentSessionId('');
          setMessages([]);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const renameSession = async (id: string) => {
    const newTitle = prompt('Enter new title for this session:');
    if (!newTitle) return;
    try {
      const res = await assistantService.renameSession(id, newTitle);
      if (res.success) {
        loadSessions();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSend = async (textToSend: string) => {
    if (!textToSend.trim() || loading) return;
    setLoading(true);
    setInput('');

    // Append temporary optimistic user message
    const tempUserMsg = { id: `usr-temp-${Date.now()}`, role: 'user', content: textToSend };
    setMessages((prev) => [...prev, tempUserMsg]);

    try {
      let activeSessionId = currentSessionId;
      if (!activeSessionId) {
        const createRes = await assistantService.createSession(languageCode);
        if (createRes.success && createRes.data.session) {
          activeSessionId = createRes.data.session.id;
          setCurrentSessionId(activeSessionId);
          setSessions([createRes.data.session, ...sessions]);
        }
      }

      const activeLangObj = LANGUAGES.find(l => l.code === languageCode) || { code: 'en', name: 'English' };
      const res = await assistantService.sendMessage(activeSessionId, textToSend, activeLangObj as any);
      if (res.success && res.data) {
        selectSession(activeSessionId);
        loadSessions();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleFavorite = async (messageId: string) => {
    try {
      const res = await assistantService.toggleFavorite(currentSessionId, messageId);
      if (res.success) {
        setMessages(messages.map(m => m.id === messageId ? { ...m, isFavorite: res.data.isFavorite } : m));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleFeedback = async (messageId: string, feedbackType: string) => {
    try {
      const res = await assistantService.submitFeedback(currentSessionId, messageId, feedbackType);
      if (res.success) {
        alert('Thank you for your feedback! It helps improve clinical reasoning.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const speakText = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const cleanText = text.replace(/[#*`_]/g, '');
      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.lang = languageCode;
      window.speechSynthesis.speak(utterance);
    } else {
      alert('Speech synthesis not supported in this browser.');
    }
  };

  const startSpeechRecognition = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Voice recognition not supported in this browser. Try Chrome/Edge.');
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = languageCode;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    setListening(true);
    recognition.start();

    recognition.onresult = (event: any) => {
      const speechToText = event.results[0][0].transcript;
      setInput(speechToText);
      setListening(false);
    };

    recognition.onerror = (e: any) => {
      console.error(e);
      setListening(false);
    };

    recognition.onend = () => {
      setListening(false);
    };
  };

  const filteredSessions = sessions.filter(s =>
    s.title?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const [mobileDrawer, setMobileDrawer] = useState<'none' | 'history' | 'context'>('none');

  return (
    <div className="flex flex-col lg:flex-row h-auto lg:h-[calc(100dvh-140px)] gap-6 max-w-7xl mx-auto px-4 min-w-0">
      
      {/* Mobile Top Toolbar (< lg) */}
      <div className="lg:hidden flex flex-wrap items-center justify-between gap-2 p-3 bg-white border border-slate-200 rounded-2xl shadow-xs">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setMobileDrawer(mobileDrawer === 'history' ? 'none' : 'history')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 border transition-all ${
              mobileDrawer === 'history' ? 'bg-rose-50 border-rose-200 text-rose-700' : 'bg-slate-50 border-slate-200 text-slate-700'
            }`}
          >
            <MessageCircle className="w-3.5 h-3.5" />
            <span>Conversations ({sessions.length})</span>
          </button>

          <button
            onClick={() => setMobileDrawer(mobileDrawer === 'context' ? 'none' : 'context')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 border transition-all ${
              mobileDrawer === 'context' ? 'bg-teal-50 border-teal-200 text-teal-700' : 'bg-slate-50 border-slate-200 text-slate-700'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Patient Context</span>
          </button>
        </div>

        <select
          value={languageCode}
          onChange={(e) => handleLanguageChange(e.target.value)}
          className="bg-slate-50 border border-slate-200 text-slate-700 font-bold px-2.5 py-1.5 rounded-xl text-xs focus:outline-none"
        >
          {LANGUAGES.map((lang) => (
            <option key={lang.code} value={lang.code}>
              {lang.name}
            </option>
          ))}
        </select>
      </div>

      {/* Mobile History Drawer Sheet */}
      {mobileDrawer === 'history' && (
        <div className="lg:hidden p-4 bg-white border border-slate-200 rounded-2xl shadow-md space-y-3">
          <div className="flex justify-between items-center border-b border-slate-100 pb-2">
            <span className="font-bold text-xs text-slate-900 uppercase">Conversations History</span>
            <button onClick={() => setMobileDrawer('none')} className="text-slate-400 font-bold text-xs">Close</button>
          </div>
          <button
            onClick={() => { createNewSession(); setMobileDrawer('none'); }}
            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-xs font-bold bg-teal-600 text-white shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>New Conversation</span>
          </button>
          <div className="space-y-1 max-h-48 overflow-y-auto">
            {filteredSessions.map((s) => (
              <button
                key={s.id}
                onClick={() => { selectSession(s.id); setMobileDrawer('none'); }}
                className={`w-full p-2.5 rounded-xl text-xs font-medium text-left truncate flex items-center gap-2 ${
                  currentSessionId === s.id ? 'bg-teal-50 text-teal-800 font-bold' : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <MessageCircle className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                <span className="truncate">{s.title || `Session ${s.id.slice(-4)}`}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Mobile Patient Context Drawer Sheet */}
      {mobileDrawer === 'context' && (
        <div className="lg:hidden p-4 bg-white border border-slate-200 rounded-2xl shadow-md space-y-3 text-xs">
          <div className="flex justify-between items-center border-b border-slate-100 pb-2">
            <span className="font-bold text-xs text-slate-900 uppercase">Active Patient Record Context</span>
            <button onClick={() => setMobileDrawer('none')} className="text-slate-400 font-bold text-xs">Close</button>
          </div>
          <div className="grid grid-cols-2 gap-2 text-slate-700">
            <div><span className="text-[10px] text-rose-600 font-bold block">Allergies</span>{patientContext.allergies.join(', ')}</div>
            <div><span className="text-[10px] text-teal-600 font-bold block">Chronic</span>{patientContext.chronicDiseases.join(', ')}</div>
          </div>
        </div>
      )}
      {/* Session sidebar */}
      <div className="hidden lg:flex flex-col w-full lg:w-64 bg-white border border-slate-200 shadow-sm rounded-2xl border border-slate-200 shrink-0 p-4 justify-between bg-white">
        <div className="flex flex-col gap-4 overflow-y-auto">
          <button
            onClick={createNewSession}
            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-xs font-bold bg-rose-500/10 hover:bg-rose-500/20 text-rose-455 border border-rose-500/25 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>New Conversation</span>
          </button>

          {/* Search sessions */}
          <input
            type="text"
            placeholder="Search queries..."
            value={searchQuery}
            aria-label="Search conversation history"
            onChange={e => setSearchQuery(e.target.value)}
            className="bg-white border border-slate-200 rounded-xl p-2 text-slate-355 text-xs focus:outline-none"
          />

          <div className="space-y-1.5 mt-2">
            <span className="text-[10px] font-mono tracking-wider text-slate-500 uppercase px-2 font-bold">History</span>
            <div className="space-y-1 max-h-72 overflow-y-auto">
              {filteredSessions.map((s) => (
                <div
                  key={s.id}
                  className={`group flex items-center justify-between w-full p-2.5 rounded-xl text-xs font-medium text-left transition-all ${
                    currentSessionId === s.id
                      ? 'bg-white border border-slate-200 text-rose-400'
                      : 'text-slate-600 hover:text-slate-800 hover:bg-white'
                  }`}
                >
                  <button
                    onClick={() => selectSession(s.id)}
                    className="flex items-center gap-2 truncate flex-1 text-left"
                  >
                    <MessageCircle className="w-3.5 h-3.5 shrink-0 text-slate-500" />
                    <span className="truncate">{s.title || `Session ${s.id.slice(-4)}`}</span>
                  </button>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => renameSession(s.id)} className="text-slate-655 hover:text-slate-205">
                      <Edit className="w-3 h-3" />
                    </button>
                    <button onClick={(e) => deleteSession(s.id, e)} className="text-slate-655 hover:text-rose-400">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Language selector */}
        <div className="border-t border-slate-200 pt-3">
          <label className="block text-[10px] font-mono text-slate-500 uppercase mb-1">Response Language</label>
          <select
            value={languageCode}
            onChange={(e) => handleLanguageChange(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-lg py-2 px-3 text-xs outline-none text-slate-800 focus:border-rose-500/35 cursor-pointer"
          >
            {LANGUAGES.map((lang) => (
              <option key={lang.code} value={lang.code}>
                {lang.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Patient Context Panel */}
      {showContext && (
        <div className="hidden lg:flex flex-col w-full lg:w-72 bg-white border border-slate-200 shadow-sm rounded-2xl border border-slate-200 shrink-0 p-5 bg-white text-xs font-mono space-y-4 overflow-y-auto min-w-0">
          <div className="border-b border-slate-200 pb-2 flex justify-between items-center">
            <span className="font-bold text-slate-800">Patient Context Used</span>
            <button onClick={() => setShowContext(false)} className="text-slate-550 hover:text-slate-355">
              <EyeOff className="w-4 h-4" />
            </button>
          </div>
          
          <div className="space-y-3">
            <div>
              <span className="text-[10px] text-rose-400 uppercase font-bold block">Documented Allergies</span>
              <ul className="list-disc list-inside text-slate-350 mt-1">
                {patientContext.allergies.map((a: string) => <li key={a} className="truncate">{a}</li>)}
              </ul>
            </div>
            <div>
              <span className="text-[10px] text-indigo-400 uppercase font-bold block">Chronic Conditions</span>
              <ul className="list-disc list-inside text-slate-350 mt-1">
                {patientContext.chronicDiseases.map((c: string) => <li key={c} className="truncate">{c}</li>)}
              </ul>
            </div>
            <div>
              <span className="text-[10px] text-emerald-400 uppercase font-bold block">Active Prescriptions</span>
              <ul className="list-disc list-inside text-slate-350 mt-1">
                {patientContext.medications.map((m: string) => <li key={m} className="whitespace-normal break-words">{m}</li>)}
              </ul>
            </div>
            <div>
              <span className="text-[10px] text-amber-500 uppercase font-bold block">Latest Lab Biomarkers</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1 text-[10px] text-slate-600">
                <span>HbA1c: {patientContext.biomarkers.HbA1c}</span>
                <span>Creatinine: {patientContext.biomarkers.creatinine}</span>
              </div>
            </div>
            <div>
              <span className="text-[10px] text-teal-400 uppercase font-bold block">Digital Twin Analytics</span>
              <div className="grid grid-cols-3 gap-1 mt-1 text-[10px] text-slate-600 text-center">
                <div className="bg-white p-1 rounded">
                  <span>Cardiac</span>
                  <strong className="block text-emerald-400">{patientContext.digitalTwin.cardiacScore}%</strong>
                </div>
                <div className="bg-white p-1 rounded">
                  <span>Kidney</span>
                  <strong className="block text-emerald-400">{patientContext.digitalTwin.kidneyScore}%</strong>
                </div>
                <div className="bg-white p-1 rounded">
                  <span>Overall</span>
                  <strong className="block text-emerald-400">{patientContext.digitalTwin.overallHealthScore}%</strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Chat Area */}
      <div className="flex-1 flex flex-col bg-white border border-slate-200 shadow-sm rounded-2xl border border-slate-200 overflow-hidden bg-white min-w-0">
        {/* Chat Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex flex-col md:flex-row items-start md:items-center justify-between bg-white gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-rose-500/10 rounded-xl text-rose-455 border border-rose-500/20 shrink-0">
              <Bot className="w-5 h-5 glow-pill" />
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-sm text-slate-900 flex flex-wrap items-center gap-2">
                <span>ArogyaMitra AI CDSS</span>
                <span className="text-[9px] bg-indigo-500/10 text-indigo-400 border border-indigo-500/25 px-1.5 py-0.5 rounded uppercase font-mono shrink-0">Persistent</span>
              </h3>
              <p className="text-[10px] text-slate-500 font-mono break-all md:break-normal">ICMR / WHO GUIDELINES GROUNDED</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-[10px] font-mono w-full md:w-auto justify-between md:justify-end">
            {!showContext && (
              <button onClick={() => setShowContext(true)} className="text-slate-600 hover:text-slate-800 flex items-center gap-1">
                <Eye className="w-3.5 h-3.5" />
                <span>Show Context</span>
              </button>
            )}
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
              <span className="text-emerald-400 truncate">AI Clinical Intelligence</span>
            </div>
          </div>
        </div>

        {/* Messages list */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center max-w-lg mx-auto space-y-6">
              <Sparkles className="w-10 h-10 text-rose-400/80 animate-bounce" />
              <div>
                <h4 className="font-bold text-slate-800 text-base">Start a secure health consultation</h4>
                <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                  Type your query below or pick a suggested topic. All answers are cross-referenced with your medical records.
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
                {SUGGESTED_PROMPTS.map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => handleSend(prompt)}
                    className="p-3 text-left rounded-xl bg-white hover:bg-white border border-slate-200 hover:border-slate-200 text-xs text-slate-355 transition-all"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((m) => {
              const isUser = m.role === 'user';
              return (
                <div key={m.id} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-xl rounded-2xl p-4 border text-xs leading-relaxed space-y-3 ${
                      isUser
                        ? 'bg-rose-500/10 border-rose-500/20 text-slate-800'
                        : 'bg-white border-slate-200 text-slate-700'
                    }`}
                  >
                    {/* Role header */}
                    <div className="flex items-center justify-between border-b border-slate-200/40 pb-1.5">
                      <span className="font-bold font-mono text-[9px] uppercase tracking-wider text-slate-500">
                        {isUser ? 'You' : 'ArogyaMitra AI'}
                      </span>
                      {!isUser && (
                        <div className="flex items-center gap-1.5 text-slate-500">
                          {m.confidence && (
                            <span className="font-mono text-[9px] text-teal-400 bg-teal-500/10 px-1.5 py-0.5 rounded">
                              {Math.round(m.confidence * 100)}% Confidence
                            </span>
                          )}
                          <button
                            onClick={() => speakText(m.content)}
                            className="p-1 hover:text-slate-700 transition-colors"
                            title="Speak Response"
                          >
                            <Volume2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleFavorite(m.id)}
                            className={`p-1 transition-colors ${m.isFavorite ? 'text-amber-400' : 'hover:text-slate-700'}`}
                          >
                            <Star className="w-3.5 h-3.5 fill-current" />
                          </button>
                          <button
                            onClick={() => handleFeedback(m.id, 'HELPFUL')}
                            className="p-1 hover:text-slate-700 transition-colors"
                            title="Mark Helpful"
                          >
                            <ThumbsUp className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="whitespace-pre-wrap">{m.content}</div>

                    {/* Disclaimers & Emergency Warnings */}
                    {!isUser && m.isEmergency && (
                      <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-455 flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                        <span className="font-bold">EMERGENCY ALERT: Visit nearest hospital or call 108 immediately.</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center gap-2 text-xs text-slate-500 font-mono">
                <span className="w-2 h-2 bg-rose-500 rounded-full animate-ping"></span>
                <span>ArogyaMitra is interpreting context...</span>
              </div>
            </div>
          )}
        </div>

        {/* Chat input bar */}
        <div className="p-4 border-t border-slate-200 bg-white">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend(input);
            }}
            className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-4 py-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask anything about symptoms, medication safety, or guidelines..."
              className="flex-1 bg-transparent border-none outline-none text-xs text-slate-800 placeholder:text-slate-655"
              disabled={loading}
            />
            <button
              type="button"
              onClick={startSpeechRecognition}
              className={`p-2 rounded-lg transition-colors ${
                listening ? 'bg-rose-500/20 text-rose-400 animate-pulse' : 'text-slate-600 hover:text-white'
              }`}
            >
              <Mic className="w-4 h-4" />
            </button>
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="p-2 bg-rose-500/10 border border-rose-500/20 text-rose-455 rounded-lg hover:bg-rose-500/20 disabled:opacity-50 transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
