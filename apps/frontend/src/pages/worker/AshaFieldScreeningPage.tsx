import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  ClipboardList, Check, AlertTriangle, ShieldCheck, 
  Mic, MicOff, RefreshCw, ChevronLeft, Volume2
} from 'lucide-react';
import { workerService } from '../../services/api';
import { offlineScreeningStorage } from '../../services/offlineScreeningStorage';
import { VoiceInputButton } from '../../components/voice/VoiceInputButton';

const SYMPTOMS_LIST = [
  'Fever', 'Cough', 'Difficulty Breathing', 'Chest Pain', 'Headache', 
  'Dizziness', 'Vomiting', 'Diarrhea', 'Abdominal Pain', 'Weakness'
];

const CONDITIONS_LIST = [
  'Diabetes', 'Hypertension', 'Asthma', 'Heart disease', 'Pregnancy'
];

const ALLERGIES_LIST = [
  'Medicine allergy', 'Food allergy', 'Other allergy', 'No known allergy'
];

interface MeasurementState {
  value: string;
  status: 'MEASURED' | 'NOT_MEASURED' | 'EQUIPMENT_UNAVAILABLE';
}

export default function AshaFieldScreeningPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const citizenId = searchParams.get('citizenId') || '';
  const citizenName = searchParams.get('name') || '';
  const citizenVillage = searchParams.get('village') || 'Haveli';

  // State parameters
  const [systolic, setSystolic] = useState<MeasurementState>({ value: '', status: 'NOT_MEASURED' });
  const [diastolic, setDiastolic] = useState<MeasurementState>({ value: '', status: 'NOT_MEASURED' });
  const [pulse, setPulse] = useState<MeasurementState>({ value: '', status: 'NOT_MEASURED' });
  const [spo2, setSpo2] = useState<MeasurementState>({ value: '', status: 'NOT_MEASURED' });
  const [temperature, setTemperature] = useState<MeasurementState>({ value: '', status: 'NOT_MEASURED' });
  const [glucose, setGlucose] = useState<MeasurementState>({ value: '', status: 'NOT_MEASURED' });
  const [weight, setWeight] = useState<MeasurementState>({ value: '', status: 'NOT_MEASURED' });
  const [height, setHeight] = useState<MeasurementState>({ value: '', status: 'NOT_MEASURED' });

  const [selectedConditions, setSelectedConditions] = useState<string[]>([]);
  const [selectedAllergies, setSelectedAllergies] = useState<string[]>(['No known allergy']);
  const [selectedCurrentMedicines, setSelectedCurrentMedicines] = useState<string[]>([]);
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [notes, setNotes] = useState('');

  // Medicine inputs
  const [newMedName, setNewMedName] = useState('');
  const [newMedDose, setNewMedDose] = useState('');
  const [newMedFreq, setNewMedFreq] = useState('1-0-1');

  // UI state
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successResult, setSuccessResult] = useState<any>(null);
  
  // Voice integration
  const [listening, setListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  let recognition: any = null;

  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      setSpeechSupported(true);
    }
  }, []);

  const handleStartSpeech = () => {
    if (!speechSupported) return;
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'hi-IN'; // Multi-lingual helper preset

    recognition.onstart = () => setListening(true);
    recognition.onend = () => setListening(false);
    recognition.onerror = () => setListening(false);
    
    recognition.onresult = (event: any) => {
      const resultText = event.results[0][0].transcript;
      setNotes((prev) => (prev ? prev + ' ' + resultText : resultText));
    };

    recognition.start();
  };

  const handleConditionToggle = (c: string) => {
    setSelectedConditions(prev => 
      prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c]
    );
  };

  const handleAllergyToggle = (a: string) => {
    if (a === 'No known allergy') {
      setSelectedAllergies(['No known allergy']);
      return;
    }
    setSelectedAllergies(prev => {
      const filtered = prev.filter(x => x !== 'No known allergy');
      return filtered.includes(a) ? filtered.filter(x => x !== a) : [...filtered, a];
    });
  };

  const handleSymptomToggle = (s: string) => {
    setSelectedSymptoms(prev => 
      prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]
    );
  };

  const handleAddMedicine = () => {
    if (!newMedName.trim()) return;
    const entry = `${newMedName} (${newMedDose || 'Dose N/A'}, ${newMedFreq})`;
    setSelectedCurrentMedicines([...selectedCurrentMedicines, entry]);
    setNewMedName('');
    setNewMedDose('');
  };

  const handleRemoveMedicine = (index: number) => {
    setSelectedCurrentMedicines(selectedCurrentMedicines.filter((_, i) => i !== index));
  };

  const evaluateOfflineRisk = () => {
    const flags: string[] = [];
    let riskLevel = 'NORMAL';

    // 1. SpO2 check
    if (spo2.status === 'MEASURED' && spo2.value) {
      const val = parseFloat(spo2.value);
      if (val < 90) {
        flags.push('Urgent medical attention recommended (Critical oxygen level: < 90% SpO2)');
        riskLevel = 'URGENT';
      } else if (val < 95) {
        flags.push('Medical review recommended (Mild oxygen saturation depression: < 95% SpO2)');
        riskLevel = 'NEEDS_REVIEW';
      }
    }

    // 2. BP Check
    if (systolic.status === 'MEASURED' && diastolic.status === 'MEASURED' && systolic.value && diastolic.value) {
      const sysVal = parseInt(systolic.value, 10);
      const diaVal = parseInt(diastolic.value, 10);
      if (sysVal > 180 || diaVal > 120) {
        flags.push('Urgent medical attention recommended (Severe Hypertension reading - emergency review required)');
        riskLevel = 'URGENT';
      } else if (sysVal > 140 || diaVal > 90) {
        flags.push('Medical review recommended (Elevated Blood Pressure reading)');
        if (riskLevel === 'NORMAL') riskLevel = 'NEEDS_REVIEW';
      }
    }

    // 3. Symptoms Check
    if (selectedSymptoms.includes('Chest Pain') || selectedSymptoms.includes('Difficulty Breathing')) {
      flags.push('Urgent medical attention recommended (Concerning symptoms: chest pain or breathing difficulty)');
      riskLevel = 'URGENT';
    }

    // 4. Pregnancy
    if (selectedConditions.includes('Pregnancy')) {
      const hasBP = systolic.status === 'MEASURED' && systolic.value && parseInt(systolic.value, 10) > 140;
      const hasSym = selectedSymptoms.includes('Severe Headache') || selectedSymptoms.includes('Dizziness');
      if (hasBP) {
        flags.push('Priority assessment recommended (Elevated BP in Pregnancy)');
        if (riskLevel !== 'URGENT') riskLevel = 'PRIORITY';
      }
      if (hasSym) {
        flags.push('Priority assessment recommended (Severe symptoms reported in Pregnancy)');
        if (riskLevel !== 'URGENT') riskLevel = 'PRIORITY';
      }
    }

    return { riskLevel, riskFlags: flags };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg('');

    // Pre-validate numeric entries
    const numOrNull = (item: MeasurementState) => {
      return item.status === 'MEASURED' && item.value ? parseFloat(item.value) : null;
    };

    const screeningInput = {
      citizen_user_id: citizenId.includes('offline') ? undefined : citizenId,
      citizen_name: citizenName,
      age: 35, // Demo fallback
      gender: 'Female', // Demo fallback
      village: citizenVillage,
      screening_date: new Date().toISOString(),
      systolic: numOrNull(systolic),
      systolic_status: systolic.status,
      diastolic: numOrNull(diastolic),
      diastolic_status: diastolic.status,
      pulse: numOrNull(pulse),
      pulse_status: pulse.status,
      spo2: numOrNull(spo2),
      spo2_status: spo2.status,
      temperature: numOrNull(temperature),
      temperature_status: temperature.status,
      glucose: numOrNull(glucose),
      glucose_status: glucose.status,
      weight: numOrNull(weight),
      weight_status: weight.status,
      height: numOrNull(height),
      height_status: height.status,
      known_conditions: selectedConditions,
      allergies: selectedAllergies,
      current_medicines: selectedCurrentMedicines,
      symptoms: selectedSymptoms,
      notes
    };

    // 1. Add to Offline Store Queue immediately
    const queuedRecord = await offlineScreeningStorage.addScreening(screeningInput);

    // 2. Check if online, trigger sync immediately
    if (navigator.onLine) {
      try {
        const res = await workerService.saveScreening(screeningInput);
        if (res.success) {
          await offlineScreeningStorage.updateSyncStatus(queuedRecord.client_record_id, 'SYNCED');
          setSuccessResult(res.data);
        } else {
          setErrorMsg('Backend sync failed, saved locally in queue.');
        }
      } catch (err: any) {
        // Safe fallback - offline saving took place
        setErrorMsg(`Network issue. Saved locally in offline queue: ${err.message}`);
      }
    } else {
      // Complete offline save workflow
      const offlineRisk = evaluateOfflineRisk();
      setSuccessResult({
        isOfflineSaved: true,
        risk_level: offlineRisk.riskLevel,
        risk_flags: offlineRisk.riskFlags,
        client_record_id: queuedRecord.client_record_id
      });
    }
    setSubmitting(false);
  };

  const renderVitalInput = (
    label: string, 
    state: MeasurementState, 
    setState: React.Dispatch<React.SetStateAction<MeasurementState>>, 
    placeholder: string,
    unit: string
  ) => {
    return (
      <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-3">
        <label className="block text-[10px] font-mono tracking-wider text-slate-600 uppercase">{label}</label>
        
        {/* Tri-state segmented selector */}
        <div className="grid grid-cols-3 gap-1 bg-white p-1 rounded-lg border border-slate-200">
          {[
            { code: 'MEASURED', name: 'Measured' },
            { code: 'NOT_MEASURED', name: 'Skip' },
            { code: 'EQUIPMENT_UNAVAILABLE', name: 'No Device' }
          ].map((st) => (
            <button
              key={st.code}
              type="button"
              onClick={() => setState({ ...state, status: st.code as any })}
              className={`py-1.5 rounded text-[8px] font-bold uppercase transition-all ${
                state.status === st.code 
                  ? 'bg-white text-white border border-slate-200' 
                  : 'text-slate-500 hover:text-slate-500'
              }`}
            >
              {st.name}
            </button>
          ))}
        </div>

        {/* Input box */}
        {state.status === 'MEASURED' ? (
          <div className="flex gap-2">
            <input
              type="number"
              step="any"
              required
              value={state.value}
              onChange={e => setState({ ...state, value: e.target.value })}
              className="flex-1 bg-white border border-slate-200 rounded-lg p-2.5 text-slate-900 font-mono text-sm"
              placeholder={placeholder}
            />
            <span className="p-2 bg-white border border-slate-200 rounded-lg flex items-center text-[10px] text-slate-500 font-mono">{unit}</span>
          </div>
        ) : (
          <div className="p-2 bg-white text-center border border-slate-200/50 rounded-lg text-[9px] text-slate-550 italic uppercase font-mono">
            {state.status === 'NOT_MEASURED' ? 'Not Measured' : 'Equipment Unavailable'}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header back */}
      <div className="flex justify-between items-center border-b border-slate-200 pb-4">
        <button
          onClick={() => navigate('/worker/dashboard')}
          className="p-2 border border-slate-200 bg-white rounded-xl flex items-center gap-1 hover:bg-slate-900"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Dashboard</span>
        </button>
        <span className="font-bold text-slate-800 uppercase">Resident: {citizenName}</span>
      </div>

      {successResult ? (
        <div className="bg-white border border-slate-200 shadow-sm p-8 rounded-2xl border border-slate-200 space-y-6 text-center">
          <div className="w-12 h-12 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full flex items-center justify-center mx-auto text-xl font-bold">
            ✓
          </div>
          <h2 className="text-lg font-bold text-slate-900">Screening Log Saved Successfully</h2>
          
          <div className="p-4 rounded-xl bg-white border border-slate-200 max-w-md mx-auto text-left space-y-2 font-mono">
            <p>Sync Status: <span className={successResult.isOfflineSaved ? "text-amber-400 font-bold" : "text-emerald-400 font-bold"}>
              {successResult.isOfflineSaved ? '🟡 PENDING SYNC (OFFLINE)' : '🟢 SYNCED TO DISTRICT DATABASE'}
            </span></p>
            <p>Computed Priority: <span className={`font-bold ${
              successResult.risk_level === 'URGENT' || successResult.risk_level === 'PRIORITY' ? 'text-rose-600' : 'text-slate-700'
            }`}>{successResult.risk_level}</span></p>
            
            {(() => {
              let flags: string[] = [];
              if (Array.isArray(successResult.risk_flags)) {
                flags = successResult.risk_flags;
              } else if (typeof successResult.risk_flags === 'string') {
                try {
                  flags = JSON.parse(successResult.risk_flags);
                } catch (_) {
                  flags = [];
                }
              }
              if (!flags || flags.length === 0) return null;
              return (
                <div>
                  <span className="text-[10px] text-slate-500 uppercase block font-bold mt-2">Active Care Referrals</span>
                  <ul className="list-disc list-inside text-[10px] text-rose-400 mt-1 space-y-1">
                    {flags.map((fl: string, i: number) => (
                      <li key={i}>{fl}</li>
                    ))}
                  </ul>
                </div>
              );
            })()}
          </div>

          <button
            onClick={() => navigate('/worker/dashboard')}
            className="px-6 py-2.5 bg-indigo-650 hover:bg-indigo-600 text-slate-950 font-bold uppercase rounded-xl"
          >
            Return to Dashboard
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Section 1: Tri-state Vitals */}
          <div className="bg-white border border-slate-200 shadow-sm p-6 rounded-2xl border border-slate-200 space-y-4">
            <span className="font-bold text-slate-800 uppercase block border-b border-slate-200 pb-2">Field Vitals Screenings</span>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {renderVitalInput('Systolic BP', systolic, setSystolic, 'e.g. 120', 'mmHg')}
              {renderVitalInput('Diastolic BP', diastolic, setDiastolic, 'e.g. 80', 'mmHg')}
              {renderVitalInput('Pulse Rate', pulse, setPulse, 'e.g. 72', 'BPM')}
              {renderVitalInput('Oxygen Saturation (SpO2)', spo2, setSpo2, 'e.g. 98', '%')}
              {renderVitalInput('Body Temperature', temperature, setTemperature, 'e.g. 98.4', '°F')}
              {renderVitalInput('Random Blood Glucose', glucose, setGlucose, 'e.g. 110', 'mg/dL')}
              {renderVitalInput('Weight', weight, setWeight, 'e.g. 62', 'kg')}
              {renderVitalInput('Height', height, setHeight, 'e.g. 165', 'cm')}
            </div>
          </div>

          {/* Section 2: Checklist grids */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Symptoms */}
            <div className="bg-white border border-slate-200 shadow-sm p-6 rounded-2xl border border-slate-200 space-y-4">
              <span className="font-bold text-slate-800 uppercase block border-b border-slate-200 pb-2">Symptoms Observed</span>
              <div className="grid grid-cols-2 gap-2">
                {SYMPTOMS_LIST.map((s) => {
                  const isChecked = selectedSymptoms.includes(s);
                  return (
                    <button
                      key={s}
                      type="button"
                      onClick={() => handleSymptomToggle(s)}
                      className={`flex items-center gap-2 p-2.5 rounded-lg border text-left text-[10px] font-bold uppercase transition-all ${
                        isChecked
                          ? 'bg-white text-white border-slate-200'
                          : 'bg-white text-slate-500 border-slate-200/50'
                      }`}
                    >
                      <Check className={`w-3.5 h-3.5 ${isChecked ? 'text-indigo-400' : 'opacity-0'}`} />
                      <span>{s}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Conditions & Allergies */}
            <div className="bg-white border border-slate-200 shadow-sm p-6 rounded-2xl border border-slate-200 space-y-6">
              <div>
                <span className="font-bold text-slate-800 uppercase block border-b border-slate-200 pb-2 mb-3">Chronic Conditions</span>
                <div className="flex flex-wrap gap-2">
                  {CONDITIONS_LIST.map((c) => {
                    const isChecked = selectedConditions.includes(c);
                    return (
                      <button
                        key={c}
                        type="button"
                        onClick={() => handleConditionToggle(c)}
                        className={`px-3 py-1.5 rounded-full border text-[9px] font-bold uppercase transition-all ${
                          isChecked
                            ? 'bg-white text-white border-slate-200'
                            : 'bg-white text-slate-500 border-slate-200/50'
                        }`}
                      >
                        {c}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <span className="font-bold text-slate-800 uppercase block border-b border-slate-200 pb-2 mb-3">Known Allergies</span>
                <div className="flex flex-wrap gap-2">
                  {ALLERGIES_LIST.map((a) => {
                    const isChecked = selectedAllergies.includes(a);
                    return (
                      <button
                        key={a}
                        type="button"
                        onClick={() => handleAllergyToggle(a)}
                        className={`px-3 py-1.5 rounded-full border text-[9px] font-bold uppercase transition-all ${
                          isChecked
                            ? 'bg-white text-white border-slate-200'
                            : 'bg-white text-slate-500 border-slate-200/50'
                        }`}
                      >
                        {a}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Medicine Tracking */}
          <div className="bg-white border border-slate-200 shadow-sm p-6 rounded-2xl border border-slate-200 space-y-4">
            <span className="font-bold text-slate-800 uppercase block border-b border-slate-200 pb-2">Active Prescriptions</span>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
              <div className="md:col-span-2">
                <label className="block text-[9px] text-slate-500 uppercase mb-1">Medicine Name</label>
                <input
                  type="text"
                  value={newMedName}
                  onChange={e => setNewMedName(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg p-2 text-slate-900"
                  placeholder="e.g. Paracetamol 650mg"
                />
              </div>
              <div>
                <label className="block text-[9px] text-slate-500 uppercase mb-1">Dose</label>
                <input
                  type="text"
                  value={newMedDose}
                  onChange={e => setNewMedDose(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg p-2 text-slate-900"
                  placeholder="e.g. 1 Tablet"
                />
              </div>
              <div>
                <button
                  type="button"
                  onClick={handleAddMedicine}
                  className="w-full py-2 bg-white border border-slate-200 hover:bg-slate-900 font-bold rounded-lg text-[10px]"
                >
                  ADD
                </button>
              </div>
            </div>

            <div className="space-y-1">
              {selectedCurrentMedicines.map((med, index) => (
                <div key={index} className="flex justify-between items-center p-2.5 bg-white rounded border border-slate-200 font-mono text-[10px]">
                  <span>{med}</span>
                  <button type="button" onClick={() => handleRemoveMedicine(index)} className="text-rose-600 font-bold hover:underline">Remove</button>
                </div>
              ))}
            </div>
          </div>

          {/* Section 4: Notes and Voice dictation */}
          <div className="bg-white border border-slate-200 shadow-sm p-6 rounded-2xl border border-slate-200 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-200 pb-2">
              <span className="font-bold text-slate-800 uppercase block">Field Observation Notes</span>
            </div>

            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl p-3 text-slate-700 min-h-[100px]"
              placeholder="Record any general physical symptoms or family medical history observations..."
            />

            <VoiceInputButton onCapture={(text) => setNotes((prev) => (prev ? prev + ' ' + text : text))} />
          </div>

          {errorMsg && (
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-455 text-xs">
              {errorMsg}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3.5 bg-indigo-650 hover:bg-indigo-600 text-slate-950 font-extrabold uppercase text-xs rounded-2xl tracking-widest flex items-center justify-center gap-2"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>{submitting ? 'PROCESSING...' : 'SAVE FIELD SCREENING RECORD'}</span>
          </button>
        </form>
      )}
    </div>
  );
}
export { CONDITIONS_LIST, ALLERGIES_LIST, SYMPTOMS_LIST };
