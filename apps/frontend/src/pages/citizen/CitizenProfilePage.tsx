import React from 'react';
import { User, Award, ShieldCheck, Save, AlertCircle } from 'lucide-react';

export default function CitizenProfilePage() {
  const userRaw = sessionStorage.getItem('user');
  const user = userRaw ? JSON.parse(userRaw) : { name: 'Rahul Verma', email: 'rahul.verma@gmail.com', abhaId: 'ABHA-91-8842-1029-4410' };

  const [bloodGroup, setBloodGroup] = React.useState('O-Positive');
  const [allergies, setAllergies] = React.useState('Penicillin, Dust mites');
  const [phone, setPhone] = React.useState('+91-9876543210');
  const [saved, setSaved] = React.useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-rose-500/10 rounded-lg text-rose-455 border border-rose-500/20">
          <User className="w-5 h-5 glow-pill" />
        </div>
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-100">Ayushman Bharat Profile</h2>
          <p className="text-xs text-slate-455 mt-0.5">Manage your personal physiological parameters and verified government parameters</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left column: ABHA Card preview */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-900 bg-gradient-to-br from-slate-900 to-slate-950 flex flex-col justify-between h-56 relative overflow-hidden md:col-span-1">
          <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500/5 rounded-full blur-2xl"></div>
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-mono tracking-widest text-slate-450 uppercase font-bold">Health Card</span>
              <Award className="w-4 h-4 text-teal-400" />
            </div>
            <p className="text-sm font-bold text-slate-200 mt-3">{user.name}</p>
            <p className="text-[10px] font-mono text-slate-400 mt-1">{user.abhaId}</p>
          </div>
          <div className="border-t border-slate-800 pt-3 flex items-center justify-between">
            <span className="text-[9px] text-slate-500 font-mono">SECURE CHIP V1</span>
            <span className="text-[10px] text-teal-400 font-bold font-mono">VERIFIED</span>
          </div>
        </div>

        {/* Right column: Edit Details Form */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-900 md:col-span-2">
          <form onSubmit={handleSave} className="space-y-5">
            <h3 className="font-bold text-sm text-slate-200 border-b border-slate-850 pb-2">Medical Bio-Parameters</h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-mono text-slate-450 uppercase mb-2">Blood Group</label>
                <input
                  type="text"
                  value={bloodGroup}
                  onChange={(e) => setBloodGroup(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-lg bg-slate-900/50 border border-slate-800 text-xs text-slate-200 outline-none focus:border-rose-500/35"
                />
              </div>
              <div>
                <label className="block text-[10px] font-mono text-slate-450 uppercase mb-2">Emergency Phone</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-lg bg-slate-900/50 border border-slate-800 text-xs text-slate-200 outline-none focus:border-rose-500/35"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-mono text-slate-450 uppercase mb-2">Allergies & Contraindications</label>
              <textarea
                value={allergies}
                onChange={(e) => setAllergies(e.target.value)}
                rows={2}
                className="w-full px-3.5 py-2 rounded-lg bg-slate-900/50 border border-slate-800 text-xs text-slate-200 outline-none focus:border-rose-500/35 resize-none"
              />
            </div>

            {saved && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-450 text-xs rounded-lg flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Profile updated successfully! Syncing to ABHA registry.</span>
              </div>
            )}

            <button
              type="submit"
              className="px-4 py-2.5 bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500/20 text-rose-455 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ml-auto"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Profile</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
