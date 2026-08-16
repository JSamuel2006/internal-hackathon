import React, { useState, useEffect } from 'react';
import { Download, FileText, Printer, Share } from 'lucide-react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '/api/v1';

export default function EmergencyPassportPage() {
  const [passport, setPassport] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const fetchPassport = async () => {
    setLoading(true);
    try {
      const token = sessionStorage.getItem('token');
      const res = await axios.get(`${API_URL}/emergency/passport`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data?.success) {
        setPassport(res.data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPassport();
  }, []);

  return (
    <div className="space-y-8 max-w-4xl mx-auto px-4 font-mono text-xs text-slate-350">
      <div className="border-b border-slate-900 pb-4 flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-slate-100 uppercase tracking-wider">Emergency Health Passport</h2>
          <p className="text-[10px] text-slate-500 mt-1">Pre-shared critical EHR statistics for first-responders</p>
        </div>
        <button
          onClick={() => window.print()}
          className="p-2 border border-slate-800 bg-slate-900 rounded-xl flex items-center gap-2"
        >
          <Printer className="w-4 h-4" />
          <span>Print</span>
        </button>
      </div>

      {passport ? (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          {/* ABHA Card representation */}
          <div className="md:col-span-5 bg-gradient-to-r from-slate-950 to-slate-900 border border-slate-850 p-6 rounded-2xl space-y-4">
            <span className="text-[10px] text-slate-500 uppercase block">ABHA ID Health Card</span>
            <strong className="text-slate-205 text-base block">{passport.abhaId}</strong>
            <div className="text-[10px] text-slate-400 space-y-1">
              <p>Blood Group: <strong className="text-slate-202">{passport.bloodGroup}</strong></p>
              <p>Allergies: <strong className="text-rose-400">{passport.allergies.join(', ')}</strong></p>
            </div>
            {/* Mock QR code container */}
            <div className="p-3 bg-white w-28 h-28 rounded mx-auto flex items-center justify-center font-bold text-[8px] text-slate-950 text-center uppercase tracking-widest border border-slate-200">
              {passport.qrCode.slice(0, 10)}
            </div>
          </div>

          {/* Clinical summary details */}
          <div className="md:col-span-7 glass-panel p-6 rounded-2xl border border-slate-900 space-y-4">
            <h3 className="text-slate-202 font-bold uppercase tracking-wider border-b border-slate-850 pb-2">EHR Clinical Context Summary</h3>
            <div className="space-y-3">
              <div>
                <span className="text-[10px] text-slate-500 uppercase block">Chronic Diseases</span>
                <p className="text-slate-300 font-semibold">{passport.chronicDiseases.join(', ') || 'None reported'}</p>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 uppercase block">Current Medications</span>
                <p className="text-slate-300 font-semibold">{passport.currentMedicines.join(', ') || 'None active'}</p>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 uppercase block font-bold">Digital Twin parameters</span>
                <p className="text-slate-300 font-semibold">Cardiac safety: {passport.digitalTwinSummary.cardiacScore}%</p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <p className="text-slate-500 text-center py-12">Loading health passport metadata...</p>
      )}
    </div>
  );
}
export { Download, FileText, Printer, Share };
