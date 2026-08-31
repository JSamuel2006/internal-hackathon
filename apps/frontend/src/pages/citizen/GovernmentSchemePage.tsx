import React, { useState } from 'react';
import { Award, RefreshCw, BarChart2 } from 'lucide-react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '/api/v1';

export default function GovernmentSchemePage() {
  const [age, setAge] = useState('');
  const [income, setIncome] = useState('');
  const [state, setState] = useState('Maharashtra');
  const [disease, setDisease] = useState('Dengue');
  
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const checkEligibility = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = sessionStorage.getItem('token');
      const res = await axios.post(`${API_URL}/government-schemes/eligibility`, {
        age, income, state, disease
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data?.success) {
        setResult(res.data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto px-4 font-mono text-xs text-slate-350">
      <div className="border-b border-slate-200 pb-4">
        <h2 className="text-xl font-bold text-slate-900 uppercase tracking-wider">Government Health Scheme Navigator</h2>
        <p className="text-[10px] text-slate-500 mt-1">Cross-match local incomes and diagnoses to PM-JAY/CMCHIS eligibility registries</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        <form onSubmit={checkEligibility} className="md:col-span-5 bg-white p-6 rounded-2xl border border-slate-200 space-y-4">
          <span className="font-bold text-slate-205 uppercase block">Eligibility Questionnaire</span>
          <input
            type="number"
            placeholder="Age..."
            value={age}
            aria-label="Age input"
            onChange={e => setAge(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-slate-700 focus:outline-none"
          />
          <input
            type="number"
            placeholder="Annual Income (₹)..."
            value={income}
            aria-label="Annual Income input"
            onChange={e => setIncome(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-slate-700 focus:outline-none"
          />
          <input
            type="text"
            placeholder="Disease..."
            value={disease}
            aria-label="Disease input"
            onChange={e => setDisease(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-slate-700 focus:outline-none"
          />
          <button type="submit" className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-slate-950 font-bold rounded-xl uppercase">
            Check Eligibility
          </button>
        </form>

        <div className="md:col-span-7 space-y-6">
          {result ? (
            <div className="bg-white border border-slate-200 shadow-sm p-6 rounded-2xl border border-slate-200 space-y-4">
              <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                <span className="font-bold text-slate-202 uppercase">AI Recommendation</span>
                <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 text-[10px] rounded font-bold">Eligible</span>
              </div>
              <div className="space-y-3">
                <p>Schemes: <strong className="text-indigo-400">{result.recommendedSchemes?.join(', ')}</strong></p>
                <p>Explanation: <span className="text-slate-600 block mt-0.5">{result.explanation}</span></p>
                <p>Participating Hospitals: <strong className="text-slate-202 block mt-0.5">{result.participatingHospitals?.join(', ')}</strong></p>
              </div>
            </div>
          ) : (
            <div className="h-64 flex flex-col items-center justify-center text-center p-8 text-slate-500 bg-white border border-slate-200 shadow-sm rounded-2xl border border-slate-200">
              <Award className="w-12 h-12 text-slate-700 mb-3 animate-pulse" />
              <p>Complete the questionnaire on the left to verify Ayushman Bharat cashless eligibility.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
export { Award, RefreshCw, BarChart2 };
