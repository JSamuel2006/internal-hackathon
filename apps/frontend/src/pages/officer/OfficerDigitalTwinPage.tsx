import React from 'react';
import { Cpu, Sliders, Sparkles, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { analyticsService } from '../../services/api';

export default function OfficerDigitalTwinPage() {
  const [coverage, setCoverage] = React.useState(65);
  const [beds, setBeds] = React.useState(82);
  const [awareness, setAwareness] = React.useState(70);
  const [loading, setLoading] = React.useState(false);
  const [result, setResult] = React.useState<any>(null);

  const runDigitalTwin = async () => {
    setLoading(true);
    try {
      const res = await analyticsService.simulateDigitalTwin({
        campaignCoverage: coverage,
        hospitalBeds: beds,
        awarenessLevel: awareness,
      });
      if (res.success) {
        setResult(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    runDigitalTwin();
  }, [coverage, beds, awareness]);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-3 border-b border-slate-200 pb-4">
        <div className="p-2 bg-teal-500/10 rounded-lg text-teal-450 border border-teal-500/20">
          <Cpu className="w-5 h-5 glow-pill" />
        </div>
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900">District Digital Twin Sandbox</h2>
          <p className="text-xs text-slate-455 mt-0.5">Model regional digital health parameters and simulate outbreak tolerances</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Sliders */}
        <div className="bg-white border border-slate-200 shadow-sm p-6 rounded-2xl border border-slate-200 space-y-6 md:col-span-1">
          <h3 className="text-xs font-mono font-bold tracking-wider text-slate-500 uppercase">Twin Controls</h3>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between text-slate-350 font-medium">
              <span>ASHA Campaign reach</span>
              <span className="font-mono text-teal-400 font-bold">{coverage}%</span>
            </div>
            <input
              type="range"
              min={10}
              max={100}
              value={coverage}
              onChange={(e) => setCoverage(parseInt(e.target.value))}
              className="w-full h-1 bg-slate-805 rounded-lg appearance-none cursor-pointer accent-teal-400"
            />
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between text-slate-350 font-medium">
              <span>District Bed Reserves</span>
              <span className="font-mono text-teal-400 font-bold">{beds}%</span>
            </div>
            <input
              type="range"
              min={10}
              max={100}
              value={beds}
              onChange={(e) => setBeds(parseInt(e.target.value))}
              className="w-full h-1 bg-slate-805 rounded-lg appearance-none cursor-pointer accent-teal-400"
            />
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between text-slate-350 font-medium">
              <span>Public Literacy Index</span>
              <span className="font-mono text-teal-400 font-bold">{awareness}%</span>
            </div>
            <input
              type="range"
              min={10}
              max={100}
              value={awareness}
              onChange={(e) => setAwareness(parseInt(e.target.value))}
              className="w-full h-1 bg-slate-805 rounded-lg appearance-none cursor-pointer accent-teal-400"
            />
          </div>
        </div>

        {/* Forecast result */}
        <div className="bg-white border border-slate-200 shadow-sm p-6 rounded-2xl border border-slate-200 md:col-span-2 space-y-6">
          <h4 className="text-xs font-mono font-bold tracking-wider text-slate-500 uppercase">Simulated Digital Twin Output</h4>

          {result && (
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-white border border-slate-200">
                  <span className="text-[10px] text-slate-500 font-mono uppercase block mb-1">Outbreak Probability</span>
                  <span className="text-2xl font-bold font-mono text-teal-400">{result.simulatedOutbreakProbability}%</span>
                </div>
                <div className="p-4 rounded-xl bg-white border border-slate-200">
                  <span className="text-[10px] text-slate-500 font-mono uppercase block mb-1">Stress posture</span>
                  <span className={`text-xs font-bold uppercase font-mono px-2 py-0.5 rounded ${
                    result.riskLevel === 'HIGH RISK' ? 'bg-rose-500/10 text-rose-455 border border-rose-500/20' : 'bg-emerald-500/10 text-emerald-450 border border-emerald-500/20'
                  }`}>
                    {result.riskLevel}
                  </span>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-2 text-xs">
                <span className="font-bold text-slate-205 flex items-center gap-1">
                  <Sparkles className="w-4 h-4 text-teal-400 animate-pulse" />
                  Twin Action Recommendation
                </span>
                <p className="text-slate-350 leading-relaxed">{result.recommendation}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
