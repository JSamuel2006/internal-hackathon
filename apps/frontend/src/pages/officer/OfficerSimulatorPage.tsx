import React from 'react';
import { Sliders, Save, Trash2, ShieldAlert, Sparkles, CheckCircle2, TrendingUp } from 'lucide-react';
import { analyticsService } from '../../services/api';

export default function OfficerSimulatorPage() {
  const [params, setParams] = React.useState({
    hospitalBeds: 80,
    medicalStaff: 75,
    orsStock: 80,
    testKits: 80,
    mosquitoNets: 50,
    vaccinationCoverage: 75,
    campaignReach: 65,
    campaignDuration: 4,
    budgetAllocation: 10,
    emergencyResponse: 70,
    healthLiteracy: 60,
    communityParticipation: 60,
    district: 'Pune',
  });

  const [results, setResults] = React.useState<any>(null);
  const [savedScenarios, setSavedScenarios] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [saveName, setSaveName] = React.useState('');

  const runSimulation = async () => {
    setLoading(true);
    try {
      const res = await analyticsService.simulateScenario(params);
      if (res.success) {
        setResults(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSaved = async () => {
    try {
      const res = await analyticsService.getScenarios();
      if (res.success && res.data.scenarios) {
        setSavedScenarios(res.data.scenarios);
      }
    } catch (err) {
      console.error(err);
    }
  };

  React.useEffect(() => {
    runSimulation();
    fetchSaved();
  }, [params]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!results) return;
    try {
      const res = await analyticsService.saveScenario({
        ...params,
        ...results,
        district: `${params.district} - Simulated`,
      });
      if (res.success) {
        setSaveName('');
        fetchSaved();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await analyticsService.deleteScenario(id);
      if (res.success) {
        fetchSaved();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSliderChange = (key: string, val: number) => {
    setParams((prev) => ({ ...prev, [key]: val }));
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-teal-500/10 rounded-lg text-teal-450 border border-teal-500/20">
            <Sliders className="w-5 h-5 glow-pill" />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight text-slate-900">Outbreak Scenario Simulator</h2>
            <p className="text-xs text-slate-455 mt-0.5">Model interventions and forecast health system capacities</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Side: Interventions Sliders */}
        <div className="bg-white border border-slate-200 shadow-sm p-6 rounded-2xl border border-slate-200 space-y-5 lg:col-span-1 max-h-[700px] overflow-y-auto pr-3">
          <h3 className="text-xs font-mono font-bold tracking-wider text-slate-500 uppercase mb-4">Intervention Inputs</h3>

          {[
            { label: 'Hospital Bed capacity', key: 'hospitalBeds', min: 10, max: 100, unit: '%' },
            { label: 'Active Medical Staff', key: 'medicalStaff', min: 10, max: 100, unit: '%' },
            { label: 'ORS Stock level', key: 'orsStock', min: 10, max: 100, unit: '%' },
            { label: 'Diagnostic Test Kits', key: 'testKits', min: 10, max: 100, unit: '%' },
            { label: 'Mosquito Nets distributed', key: 'mosquitoNets', min: 10, max: 100, unit: '%' },
            { label: 'Vaccination coverage', key: 'vaccinationCoverage', min: 10, max: 100, unit: '%' },
            { label: 'Campaign reach', key: 'campaignReach', min: 10, max: 100, unit: '%' },
            { label: 'Campaign duration', key: 'campaignDuration', min: 1, max: 12, unit: ' weeks' },
          ].map((slider) => (
            <div key={slider.key} className="space-y-2 text-xs">
              <div className="flex justify-between text-slate-700 font-medium">
                <span>{slider.label}</span>
                <span className="font-mono text-teal-400 font-bold">
                  {(params as any)[slider.key]}
                  {slider.unit}
                </span>
              </div>
              <input
                type="range"
                min={slider.min}
                max={slider.max}
                value={(params as any)[slider.key]}
                onChange={(e) => handleSliderChange(slider.key, parseInt(e.target.value))}
                className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-teal-400"
              />
            </div>
          ))}
        </div>

        {/* Right Side: Simulation Results & Save Options */}
        <div className="lg:col-span-2 space-y-6">
          {results && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Main Risk Indicators */}
              <div className="bg-white border border-slate-200 shadow-sm p-6 rounded-2xl border border-slate-200 space-y-4">
                <span className="text-[10px] font-mono text-slate-500 uppercase block">Outbreak Probability Indicator</span>
                <div className="flex items-baseline gap-2">
                  <p className="text-3xl font-extrabold font-mono text-teal-450">{results.outbreakRiskIndicator}%</p>
                  <span className="text-[10px] text-slate-500 font-mono">forecasted index</span>
                </div>
                <div className="w-full bg-white h-2 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      results.outbreakRiskIndicator > 60 ? 'bg-rose-500' : 'bg-teal-400'
                    }`}
                    style={{ width: `${results.outbreakRiskIndicator}%` }}
                  ></div>
                </div>
              </div>

              <div className="bg-white border border-slate-200 shadow-sm p-6 rounded-2xl border border-slate-200 space-y-4">
                <span className="text-[10px] font-mono text-slate-500 uppercase block">Hospital Stress level</span>
                <div className="flex items-baseline gap-2">
                  <p className="text-3xl font-extrabold font-mono text-rose-400">{results.hospitalStressIndex}%</p>
                  <span className="text-[10px] text-slate-500 font-mono">bed/staff stress</span>
                </div>
                <div className="w-full bg-white h-2 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-rose-500 rounded-full transition-all duration-500"
                    style={{ width: `${results.hospitalStressIndex}%` }}
                  ></div>
                </div>
              </div>
            </div>
          )}

          {/* AI Recommendations */}
          {results && (
            <div className="bg-white border border-slate-200 shadow-sm p-6 rounded-2xl border border-slate-200 space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
                <Sparkles className="w-4 h-4 text-teal-450 animate-pulse" />
                <h4 className="font-bold text-xs text-slate-800">AI Mitigation Recommendations</h4>
              </div>
              <ul className="text-xs space-y-2 text-slate-350 pl-1">
                {results.aiRecommendations.map((rec: string, i: number) => (
                  <li key={i} className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-teal-450 shrink-0 mt-0.5" />
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Save Simulation */}
          <div className="bg-white border border-slate-200 shadow-sm p-6 rounded-2xl border border-slate-200">
            <form onSubmit={handleSave} className="flex flex-col sm:flex-row items-center gap-3">
              <input
                type="text"
                required
                value={saveName}
                onChange={(e) => setSaveName(e.target.value)}
                placeholder="Enter scenario description (e.g. Monsoon Preparedness 2026)"
                className="w-full px-4 py-2.5 rounded-lg bg-white border border-slate-200 text-xs outline-none text-slate-800 focus:border-teal-500/35"
              />
              <button
                type="submit"
                className="px-5 py-2.5 rounded-lg text-xs font-bold bg-teal-500/10 border border-teal-500/25 hover:bg-teal-500/20 text-teal-450 flex items-center gap-1.5 transition-all shrink-0 w-full sm:w-auto justify-center"
              >
                <Save className="w-4 h-4" />
                <span>Save Setup</span>
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
