import React, { useState } from 'react';
import { Bot, RefreshCw, Sparkles, Send } from 'lucide-react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '/api/v1';

export default function SymptomAssessmentPage() {
  const [symptoms, setSymptoms] = useState('');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleAssess = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!symptoms.trim() || loading) return;
    setLoading(true);
    try {
      const token = sessionStorage.getItem('token');
      const res = await axios.post(`${API_URL}/symptom-assessment`, {
        symptoms,
        history: 'Penicillin allergy, Type 2 diabetes'
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
    <div className="space-y-8 max-w-4xl mx-auto px-4 font-mono text-xs text-slate-355">
      <div className="border-b border-slate-900 pb-4">
        <h2 className="text-xl font-bold text-slate-100 uppercase tracking-wider">Smart Symptom Assessment</h2>
        <p className="text-[10px] text-slate-500 mt-1">Interactive AI triage classifier. Not a definitive diagnosis.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        <form onSubmit={handleAssess} className="md:col-span-5 bg-slate-950 p-6 rounded-2xl border border-slate-900 space-y-4">
          <span className="font-bold text-slate-205 uppercase block">Describe Symptoms</span>
          <textarea
            placeholder="E.g., high fever since last night, abdominal pain..."
            value={symptoms}
            aria-label="Describe Symptoms"
            onChange={e => setSymptoms(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-slate-300 focus:outline-none min-h-[100px]"
          />
          <button type="submit" className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-slate-950 font-bold rounded-xl uppercase">
            Start Assessment
          </button>
        </form>

        <div className="md:col-span-7 space-y-6">
          {result ? (
            <div className="glass-panel p-6 rounded-2xl border border-slate-900 space-y-4">
              <div className="flex justify-between items-center border-b border-slate-850 pb-2">
                <span className="font-bold text-slate-202 uppercase">Triage Assessment</span>
                <span className="px-2 py-0.5 bg-amber-500/10 text-amber-400 text-[10px] rounded font-bold">{result.riskLevel} Risk</span>
              </div>
              <div className="space-y-3">
                <p>Explanation: <span className="text-slate-400 block mt-0.5">{result.explanation}</span></p>
                <p>Recommended Action: <strong className="text-slate-202">{result.recommendedAction}</strong></p>
                <p>Specialist: <strong className="text-indigo-400">{result.recommendedSpecialist}</strong></p>
                {result.followUpQuestions && (
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase block font-bold">Follow-up Questions</span>
                    <ul className="list-disc list-inside text-slate-400 mt-1">
                      {result.followUpQuestions.map((q: string) => <li key={q}>{q}</li>)}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="h-64 flex flex-col items-center justify-center text-center p-8 text-slate-500 glass-panel rounded-2xl border border-slate-900">
              <Bot className="w-12 h-12 text-slate-700 mb-3 animate-pulse" />
              <p>State your symptoms in the left form to trigger AI triage assessment.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
export { Bot, RefreshCw, Sparkles, Send };
