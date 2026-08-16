import React, { useState, useEffect } from 'react';
import { 
  Activity, Shield, Award, Calendar, Clock, RefreshCw, Send, CheckCircle2, AlertCircle, HeartPulse, User, MapPin, Trash
} from 'lucide-react';
import axios from 'axios';

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

export default function AppointmentBookingPage() {
  const [loading, setLoading] = useState(false);
  const [hospitals, setHospitals] = useState<any[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [appointments, setAppointments] = useState<any[]>([]);

  // Selection state
  const [selectedHospital, setSelectedHospital] = useState('');
  const [selectedDoctor, setSelectedDoctor] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('10:00 AM');

  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const fetchEcosystemData = async () => {
    setLoading(true);
    setError('');
    try {
      const hospRes = await api.get('/hospitals');
      if (hospRes.data?.success) setHospitals(hospRes.data.data || []);

      const appRes = await api.get('/appointments');
      if (appRes.data?.success) setAppointments(appRes.data.data || []);
    } catch (err) {
      setError('Could not retrieve hospital registries.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEcosystemData();
  }, []);

  // Fetch doctors dynamically when hospital selection changes
  useEffect(() => {
    if (!selectedHospital) {
      setDoctors([]);
      return;
    }
    const fetchDoctorsForHospital = async () => {
      try {
        const res = await api.get(`/doctors?hospitalId=${selectedHospital}`);
        if (res.data?.success) setDoctors(res.data.data || []);
      } catch (err) {
        console.error(err);
      }
    };
    fetchDoctorsForHospital();
  }, [selectedHospital]);

  const handleBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedHospital || !selectedDoctor || !selectedDate) {
      setError('Please populate all appointment parameters.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await api.post('/appointments', {
        hospitalId: selectedHospital,
        doctorId: selectedDoctor,
        date: selectedDate,
        time: selectedTime
      });
      if (res.data?.success) {
        setSuccessMsg('Clinical appointment booked successfully!');
        setSelectedDate('');
        fetchEcosystemData();
        setTimeout(() => setSuccessMsg(''), 4000);
      }
    } catch (err) {
      setError('Could not book appointment.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (id: string) => {
    setLoading(true);
    try {
      const res = await api.delete(`/appointments/${id}`);
      if (res.data?.success) {
        setSuccessMsg('Appointment cancelled.');
        fetchEcosystemData();
        setTimeout(() => setSuccessMsg(''), 4000);
      }
    } catch (err) {
      setError('Could not cancel appointment.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4">
      {/* Title Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-900 pb-5">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-rose-500/10 rounded-xl text-rose-455 border border-rose-500/20 shadow-lg">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight text-slate-100 flex items-center gap-2">
              Book Doctor Appointment
              <span className="text-[10px] bg-rose-500/15 text-rose-400 border border-rose-500/20 px-2 py-0.5 rounded font-mono uppercase">Ecosystem Connect</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">Schedule checkups with specialists across linked public health networks</p>
          </div>
        </div>

        <button
          onClick={fetchEcosystemData}
          disabled={loading}
          className="px-4 py-2 border border-slate-800 bg-slate-900/60 hover:bg-slate-855 text-slate-355 font-semibold rounded-xl text-xs flex items-center gap-2 transition-all"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Lists</span>
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
        {/* Left Form Panel */}
        <div className="lg:col-span-5 glass-panel p-6 rounded-2xl border border-slate-900 space-y-5 self-start">
          <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider border-b border-slate-850 pb-2">
            Appointment Parameters
          </h3>

          <form onSubmit={handleBook} className="space-y-4 text-xs font-mono">
            {/* Hospital Selector */}
            <div className="space-y-1.5">
              <label className="text-slate-400 block uppercase text-[10px]">Select Hospital Clinic</label>
              <select
                value={selectedHospital}
                onChange={e => {
                  setSelectedHospital(e.target.value);
                  setSelectedDoctor('');
                }}
                className="bg-slate-950 border border-slate-850 rounded-xl p-2.5 text-slate-355 w-full focus:outline-none"
              >
                <option value="">-- Choose Hospital --</option>
                {hospitals.map(h => (
                  <option key={h.id} value={h.id}>{h.name} (Wait: {h.emergencyQueue} mins)</option>
                ))}
              </select>
            </div>

            {/* Doctor Selector */}
            <div className="space-y-1.5">
              <label className="text-slate-400 block uppercase text-[10px]">Select Specialist Practitioner</label>
              <select
                value={selectedDoctor}
                onChange={e => setSelectedDoctor(e.target.value)}
                disabled={!selectedHospital}
                className="bg-slate-950 border border-slate-850 rounded-xl p-2.5 text-slate-355 w-full focus:outline-none disabled:opacity-50"
              >
                <option value="">-- Choose Doctor --</option>
                {doctors.map(d => (
                  <option key={d.id} value={d.id}>{d.name} ({d.specialty})</option>
                ))}
              </select>
            </div>

            {/* Date selection */}
            <div className="space-y-1.5">
              <label className="text-slate-400 block uppercase text-[10px]">Preferred Checkup Date</label>
              <input
                type="date"
                value={selectedDate}
                onChange={e => setSelectedDate(e.target.value)}
                className="bg-slate-950 border border-slate-850 rounded-xl p-2.5 text-slate-355 w-full focus:outline-none"
              />
            </div>

            {/* Time Slot */}
            <div className="space-y-1.5">
              <label className="text-slate-400 block uppercase text-[10px]">Preferred Time Slot</label>
              <select
                value={selectedTime}
                onChange={e => setSelectedTime(e.target.value)}
                className="bg-slate-950 border border-slate-850 rounded-xl p-2.5 text-slate-355 w-full focus:outline-none"
              >
                <option>09:30 AM</option>
                <option>10:30 AM</option>
                <option>11:30 AM</option>
                <option>02:30 PM</option>
                <option>03:30 PM</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-rose-500 hover:bg-rose-455 text-slate-950 font-bold rounded-xl text-xs uppercase flex items-center justify-center gap-1.5 transition-colors"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Confirm Appointment Slot</span>
            </button>
          </form>
        </div>

        {/* Right Active List Panel */}
        <div className="lg:col-span-7 glass-panel p-6 rounded-2xl border border-slate-900 space-y-4">
          <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider border-b border-slate-850 pb-2">
            My Scheduled Checkups History
          </h3>

          <div className="space-y-3 max-h-[420px] overflow-y-auto">
            {appointments.length > 0 ? (
              appointments.map((app) => (
                <div key={app.id} className="p-4 bg-slate-950/60 rounded-xl border border-slate-900 flex justify-between items-start gap-4 text-xs font-mono">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-205">{app.doctorName || 'Dr. Patil'}</span>
                      <span className="text-[9px] bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-1.5 py-0.5 rounded font-bold uppercase">{app.status}</span>
                    </div>
                    <p className="text-slate-400">{app.hospitalName || 'AIMS Delhi'}</p>
                    <div className="flex gap-4 text-[10px] text-slate-500">
                      <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {app.date}</span>
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {app.time}</span>
                    </div>
                  </div>

                  {app.status !== 'Cancelled' && (
                    <button
                      onClick={() => handleCancel(app.id)}
                      className="p-1.5 border border-slate-850 bg-slate-900 rounded-lg text-slate-400 hover:text-rose-455 transition-colors shrink-0"
                    >
                      <Trash className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-500 text-center py-12">No active appointments scheduled. Book a slot on the left.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
