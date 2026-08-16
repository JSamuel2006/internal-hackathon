import React, { useState, useEffect } from 'react';
import { Bot, RefreshCw, Sparkles, Send, Video, PhoneCall } from 'lucide-react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '/api/v1';

export default function TelemedicinePage() {
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentLink, setCurrentLink] = useState('');

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
    <div className="space-y-8 max-w-4xl mx-auto px-4 font-mono text-xs text-slate-355 text-center">
      <div className="border-b border-slate-900 pb-4">
        <h2 className="text-xl font-bold text-slate-100 uppercase tracking-wider">Telemedicine Consultation Rooms</h2>
        <p className="text-[10px] text-slate-500 mt-1">Grounded virtual consulting queues linking patients to registered physicians</p>
      </div>

      <div className="py-8 flex flex-col items-center justify-center space-y-6">
        <button
          onClick={handleStartConsultation}
          className="px-6 py-3 bg-rose-600 hover:bg-rose-500 text-slate-950 font-bold rounded-xl uppercase flex items-center gap-2"
        >
          <Video className="w-4 h-4" />
          <span>Launch secure Consultation Room</span>
        </button>

        {currentLink && (
          <div className="p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs">
            <p>Meeting link: <a href={currentLink} target="_blank" rel="noopener noreferrer" className="underline">{currentLink}</a></p>
          </div>
        )}
      </div>

      <div className="glass-panel p-6 rounded-2xl border border-slate-900 text-left space-y-4">
        <span className="font-bold text-slate-205 uppercase block">Previous consultations</span>
        <div className="space-y-2">
          {sessions.map((s) => (
            <div key={s.id} className="p-3 bg-slate-950 rounded border border-slate-900 flex justify-between items-center">
              <div>
                <span className="font-bold text-slate-202 block">Consultation ID: {s.id.slice(-6)}</span>
                <span className="text-[10px] text-slate-550">Created at: {new Date(s.created_at).toLocaleString()}</span>
              </div>
              <span className="px-2 py-0.5 bg-slate-900 text-slate-400 text-[9px] font-bold rounded uppercase">{s.session_status}</span>
            </div>
          ))}
          {sessions.length === 0 && (
            <p className="text-slate-500 text-center py-4">No previous video consulting logs found.</p>
          )}
        </div>
      </div>
    </div>
  );
}
export { Bot, RefreshCw, Sparkles, Send, Video, PhoneCall };
