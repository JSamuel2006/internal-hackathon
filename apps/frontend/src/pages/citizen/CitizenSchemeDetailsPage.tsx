import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Award, ShieldCheck, HelpCircle, CheckCircle, ExternalLink, ArrowLeft, Bot,
  AlertCircle, MapPin, Phone, Navigation, LocateFixed, FileText, Clock
} from 'lucide-react';
import axios from 'axios';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const API_URL = import.meta.env.VITE_API_URL || '/api/v1';

function MapRecenter({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => { map.setView([lat, lng], 13); }, [lat, lng, map]);
  return null;
}

const SCHEME_META: Record<string, any> = {
  'sch-pmjay': {
    name: 'Ayushman Bharat PM-JAY',
    ministry: 'Ministry of Health & Family Welfare',
    coverage: '₹5 Lakh per family per year',
    website: 'https://pmjay.gov.in',
    description: 'Provides cashless treatment coverage up to ₹5 Lakh per year for eligible families at empanelled secondary and tertiary care hospitals.',
    eligibility: 'SECC database classifications, low-income households, BPL families',
    benefits: 'Cashless secondary and tertiary hospitalization, day-care surgeries, pre/post-hospitalization',
    documents: 'Aadhaar Card, Ration Card, PM-JAY eligibility letter, Income Certificate',
    faqs: [
      { q: 'What is PM-JAY?', a: 'Ayushman Bharat PM-JAY provides ₹5 lakh health coverage per family per year for secondary and tertiary hospitalization.' },
      { q: 'Who is eligible?', a: 'Families identified under SECC-2011 database and state government BPL lists are eligible.' },
      { q: 'What does it cover?', a: 'It covers hospitalizations, surgeries, diagnostics, and medicines for about 1,350 medical packages.' },
      { q: 'How do I apply?', a: 'Visit the nearest Common Service Centre (CSC) or empanelled hospital with Aadhaar and Ration Card.' },
      { q: 'Can private hospitals accept it?', a: 'Yes, both public and empanelled private hospitals accept PM-JAY cashless cards.' },
    ],
    applicationSteps: [
      { step: 1, title: 'Check Eligibility', desc: 'Visit pmjay.gov.in or call 14555 to check if your family is eligible.' },
      { step: 2, title: 'Get PM-JAY Card', desc: 'Visit nearest CSC or empanelled hospital with Aadhaar + Ration Card.' },
      { step: 3, title: 'Card Issued', desc: 'Ayushman Bharat Golden Card is issued on the spot.' },
      { step: 4, title: 'Avail Treatment', desc: 'Present the card at any empanelled hospital for cashless treatment.' },
    ],
    processingTime: '1-2 working days for card issuance',
  },
  'sch-cmchis': {
    name: 'Chief Minister Comprehensive Health Insurance Scheme (CMCHIS)',
    ministry: 'Health & Family Welfare Department, Tamil Nadu',
    coverage: '₹5 Lakh per family per year',
    website: 'https://cmchistn.com',
    description: 'Financial assistance for families below poverty line in Tamil Nadu suffering from major life-threatening diseases.',
    eligibility: 'Tamil Nadu residents with annual income below ₹72,000',
    benefits: 'Cashless super-specialty treatment at government and empanelled private hospitals',
    documents: 'Aadhaar Card, Income Certificate, Ration Card (Government card), Birth Certificate',
    faqs: [
      { q: 'What is CMCHIS?', a: 'A Tamil Nadu state scheme providing ₹5 lakh annual cashless healthcare coverage to BPL families.' },
      { q: 'Who is eligible?', a: 'Families with annual income below ₹72,000 holding government-issued Ration Cards.' },
      { q: 'How to apply?', a: 'Apply via nearest Taluk office or government hospital with income certificate and Aadhaar.' },
    ],
    applicationSteps: [
      { step: 1, title: 'Verify Ration Card', desc: 'Confirm you hold a government-issued ration card.' },
      { step: 2, title: 'Visit Enrollment Camp', desc: 'Visit nearest government hospital enrollment camp.' },
      { step: 3, title: 'Biometric Enrollment', desc: 'Complete Aadhaar-based biometric enrollment.' },
      { step: 4, title: 'Avail Services', desc: 'Use scheme at any empanelled facility in Tamil Nadu.' },
    ],
    processingTime: '3-5 working days',
  },
  'sch-ran': {
    name: 'Rashtriya Arogya Nidhi (RAN)',
    ministry: 'Ministry of Health & Family Welfare',
    coverage: 'Up to ₹15 Lakh per case',
    website: 'https://mohfw.gov.in',
    description: 'Provides financial assistance to BPL patients suffering from life-threatening diseases requiring super-specialty treatment.',
    eligibility: 'BPL families with annual income below poverty threshold requiring super-specialty care',
    benefits: 'One-time financial grant for super-specialty treatment, direct transfer to government hospital',
    documents: 'BPL Certificate, Aadhaar, Medical Documents certifying disease, Doctor referral letter',
    faqs: [
      { q: 'What is RAN?', a: 'RAN provides financial assistance for BPL patients requiring expensive super-specialty treatment.' },
      { q: 'Who is eligible?', a: 'Any BPL patient suffering from life-threatening disease requiring costly treatment.' },
    ],
    applicationSteps: [
      { step: 1, title: 'Get Medical Certificate', desc: 'Obtain certificate from government medical officer confirming disease.' },
      { step: 2, title: 'Apply at Hospital', desc: 'Submit application at nearest government teaching hospital.' },
      { step: 3, title: 'State Review', desc: 'State Health Society reviews and approves application.' },
      { step: 4, title: 'Treatment Authorization', desc: 'Hospital receives direct fund transfer for authorized treatment.' },
    ],
    processingTime: '7-15 working days',
  },
};

function generateNearbyHospitals(lat: number, lng: number, city: string, schemeId: string) {
  const schemeName = SCHEME_META[schemeId]?.name || 'PM-JAY';
  return [
    { id: 1, name: `${city} Government Medical College Hospital`, type: 'District Hospital', lat: lat + 0.012, lng: lng + 0.008, beds: 420, phone: '108', distance: '1.2 km' },
    { id: 2, name: `Urban Primary Health Centre — ${city}`, type: 'PHC', lat: lat - 0.008, lng: lng + 0.015, beds: 25, phone: '104', distance: '2.1 km' },
    { id: 3, name: `${city} Sub-District Community Hospital`, type: 'CHC', lat: lat + 0.018, lng: lng - 0.012, beds: 60, phone: '1800-180-1104', distance: '3.4 km' },
    { id: 4, name: `Jan Arogya Hospital — ${city}`, type: 'Empanelled Private', lat: lat - 0.015, lng: lng - 0.010, beds: 80, phone: '1800-111-565', distance: '4.1 km' },
  ].map(h => ({ ...h, scheme: schemeName }));
}

const INDIAN_STATES = [
  'Andhra Pradesh', 'Bihar', 'Chhattisgarh', 'Delhi', 'Goa', 'Gujarat', 'Haryana',
  'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra',
  'Manipur', 'Meghalaya', 'Odisha', 'Punjab', 'Rajasthan', 'Tamil Nadu', 'Telangana',
  'Uttar Pradesh', 'Uttarakhand', 'West Bengal', 'Jammu & Kashmir',
];

export default function CitizenSchemeDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const schemeId = id || 'sch-pmjay';
  const scheme = SCHEME_META[schemeId] || SCHEME_META['sch-pmjay'];

  // Eligibility Checker
  const [age, setAge] = useState('32');
  const [income, setIncome] = useState('80000');
  const [selectedState, setSelectedState] = useState('Maharashtra');
  const [eligibilityResult, setEligibilityResult] = useState<any>(null);
  const [checking, setChecking] = useState(false);

  // Location
  const [userLat, setUserLat] = useState<number | null>(null);
  const [userLng, setUserLng] = useState<number | null>(null);
  const [cityLabel, setCityLabel] = useState('');
  const [locating, setLocating] = useState(false);
  const [locationDenied, setLocationDenied] = useState(false);
  const [manualCity, setManualCity] = useState('');
  const [manualState, setManualState] = useState('');
  const [hospitals, setHospitals] = useState<any[]>([]);
  const [selectedHospital, setSelectedHospital] = useState<any>(null);

  // Chatbot
  const [chatInput, setChatInput] = useState('');
  const [chatLog, setChatLog] = useState<any[]>([
    { role: 'assistant', content: `Hello! I am ArogyaMitra. Ask me anything about ${scheme.name} — eligibility, benefits, documents, or nearby hospitals in your area.` }
  ]);
  const [chatLoading, setChatLoading] = useState(false);

  // Active tab
  const [activeTab, setActiveTab] = useState<'overview' | 'hospitals' | 'documents' | 'eligibility' | 'faq' | 'apply'>('overview');

  useEffect(() => {
    setLocating(true);
    if (!navigator.geolocation) { setLocationDenied(true); setLocating(false); return; }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setUserLat(lat);
        setUserLng(lng);
        try {
          const r = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`);
          const data = await r.json();
          const city = data.address?.city || data.address?.town || data.address?.village || 'Nearby';
          const state = data.address?.state || '';
          setCityLabel(city);
          setManualState(state);
          setSelectedState(state || 'Maharashtra');
          const h = generateNearbyHospitals(lat, lng, city, schemeId);
          setHospitals(h);
          setSelectedHospital(h[0]);
        } catch {
          setCityLabel('Nearby');
          const h = generateNearbyHospitals(lat, lng, 'Nearby', schemeId);
          setHospitals(h);
          setSelectedHospital(h[0]);
        }
        setLocating(false);
      },
      () => { setLocationDenied(true); setLocating(false); },
      { timeout: 10000 }
    );
  }, [schemeId]);

  const applyManualLocation = () => {
    const cities: Record<string, [number, number]> = {
      'mumbai': [19.076, 72.8777], 'delhi': [28.6139, 77.2090], 'chennai': [13.0827, 80.2707],
      'bangalore': [12.9716, 77.5946], 'bengaluru': [12.9716, 77.5946], 'kolkata': [22.5726, 88.3639],
      'hyderabad': [17.385, 78.4867], 'pune': [18.5204, 73.8567], 'ahmedabad': [23.0225, 72.5714],
      'jaipur': [26.9124, 75.7873], 'lucknow': [26.8467, 80.9462], 'nagpur': [21.1458, 79.0882],
    };
    const key = manualCity.toLowerCase().trim();
    const coords = cities[key] || [20.5937, 78.9629];
    setUserLat(coords[0]);
    setUserLng(coords[1]);
    setCityLabel(manualCity);
    const h = generateNearbyHospitals(coords[0], coords[1], manualCity, schemeId);
    setHospitals(h);
    setSelectedHospital(h[0]);
    setLocationDenied(false);
  };

  const handleCheckEligibility = async (e: React.FormEvent) => {
    e.preventDefault();
    setChecking(true);
    const ageNum = parseInt(age);
    const incomeNum = parseInt(income);
    await new Promise(r => setTimeout(r, 800));

    let status: 'eligible' | 'possibly' | 'not';
    let explanation = '';
    if (incomeNum < 100000 && ageNum >= 18) {
      status = 'eligible';
      explanation = `Based on your annual income of ₹${incomeNum.toLocaleString()} and age ${ageNum}, you likely qualify under ${scheme.name}. Please visit the nearest Common Service Centre with Aadhaar and Ration Card to confirm enrollment.`;
    } else if (incomeNum < 250000) {
      status = 'possibly';
      explanation = `Your income bracket may qualify under some state-specific extensions of ${scheme.name}. We recommend visiting your nearest district health office for formal verification.`;
    } else {
      status = 'not';
      explanation = `Based on the provided income (₹${incomeNum.toLocaleString()}), you may not qualify for ${scheme.name} which is targeted at economically weaker sections. However, you may be eligible for other employer or state health schemes.`;
    }
    setEligibilityResult({ status, explanation });
    setChecking(false);
  };

  const handleSendChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || chatLoading) return;
    const userText = chatInput;
    setChatLog(prev => [...prev, { role: 'user', content: userText }]);
    setChatInput('');
    setChatLoading(true);
    try {
      const token = sessionStorage.getItem('token');
      const res = await axios.post(`${API_URL}/assistant/sessions/default/messages`, {
        content: `Regarding government health scheme ${scheme.name} in ${cityLabel || selectedState}: ${userText}`,
        language: 'en',
        userId: 'usr-default'
      }, { headers: { Authorization: `Bearer ${token}` } });
      if (res.data?.success && res.data.data?.answer) {
        setChatLog(prev => [...prev, { role: 'assistant', content: res.data.data.answer }]);
      } else throw new Error('no answer');
    } catch {
      // Contextual fallback responses
      const lower = userText.toLowerCase();
      let answer = `${scheme.name} provides coverage of ${scheme.coverage}. Eligible citizens can enroll at the nearest government hospital or Common Service Centre with Aadhaar and income proof.`;
      if (lower.includes('eligib')) answer = scheme.eligibility;
      if (lower.includes('document')) answer = `Required documents for ${scheme.name}: ${scheme.documents}`;
      if (lower.includes('hospital')) answer = hospitals.length > 0
        ? `Nearby empanelled hospitals in ${cityLabel}: ${hospitals.map(h => h.name).join(', ')}`
        : 'Please allow location access to see nearby empanelled hospitals.';
      if (lower.includes('apply')) answer = scheme.applicationSteps?.map((s: any) => `Step ${s.step}: ${s.title} — ${s.desc}`).join('\n');
      setChatLog(prev => [...prev, { role: 'assistant', content: answer }]);
    } finally {
      setChatLoading(false);
    }
  };

  const centerLat = userLat ?? 20.5937;
  const centerLng = userLng ?? 78.9629;

  const TABS = [
    { id: 'overview', label: '📋 Overview' },
    { id: 'eligibility', label: '✅ Eligibility' },
    { id: 'hospitals', label: '🏥 Hospitals' },
    { id: 'documents', label: '📄 Documents' },
    { id: 'apply', label: '📝 Apply' },
    { id: 'faq', label: '❓ FAQ' },
  ] as const;

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 font-mono text-xs">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <button
          onClick={() => navigate('/citizen/schemes')}
          className="flex items-center gap-2 py-1.5 px-3 bg-white border border-slate-200 rounded-xl hover:bg-slate-850 transition-colors text-slate-700"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Schemes</span>
        </button>
        <div className="flex items-center gap-2">
          {locating ? (
            <span className="text-[10px] text-amber-400 flex items-center gap-1 animate-pulse">
              <LocateFixed className="w-3 h-3" /> Locating...
            </span>
          ) : cityLabel ? (
            <span className="text-[10px] text-emerald-400 flex items-center gap-1">
              <MapPin className="w-3 h-3" /> {cityLabel}
            </span>
          ) : null}
          <span className="text-[10px] text-slate-500 uppercase font-bold">Scheme Portal</span>
        </div>
      </div>

      {/* Scheme Title Banner */}
      <div className="bg-white border border-slate-200 shadow-sm p-5 rounded-2xl border border-slate-200 flex items-start justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-rose-400" />
            <h2 className="text-sm font-bold text-slate-900">{scheme.name}</h2>
          </div>
          <p className="text-[10px] text-slate-600">{scheme.ministry}</p>
          <p className="text-xs text-slate-600 leading-relaxed max-w-2xl">{scheme.description}</p>
        </div>
        <div className="flex flex-col gap-2 shrink-0">
          <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[9px] rounded font-bold uppercase text-center">ABHA Ready</span>
          <a
            href={scheme.website}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 py-1.5 px-3 bg-white border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-850 transition-colors text-[10px]"
          >
            <ExternalLink className="w-3 h-3" />
            Official Portal
          </a>
        </div>
      </div>

      {/* Location denied — manual input */}
      {locationDenied && (
        <div className="bg-white border border-slate-200 shadow-sm p-4 rounded-2xl border border-amber-500/20 bg-amber-500/5 space-y-3">
          <p className="text-amber-400 text-[10px] flex items-center gap-1">
            <AlertCircle className="w-3.5 h-3.5" />
            Location access denied. Enter your city to see hospitals accepting this scheme near you.
          </p>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Enter city (e.g. Chennai, Lucknow)"
              value={manualCity}
              onChange={e => setManualCity(e.target.value)}
              aria-label="City for scheme hospital search"
              className="flex-1 bg-white border border-slate-200 rounded-xl p-2 text-slate-202 focus:outline-none"
            />
            <select
              value={manualState}
              onChange={e => setManualState(e.target.value)}
              className="bg-white border border-slate-200 rounded-xl p-2 text-slate-202 focus:outline-none"
              aria-label="Select state"
            >
              <option value="">Select State</option>
              {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <button onClick={applyManualLocation} className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl transition-colors">
              Find
            </button>
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-3">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`py-1.5 px-3 rounded-lg text-[10px] font-bold transition-all ${
              activeTab === tab.id
                ? 'bg-rose-500/10 border border-rose-500/20 text-rose-400'
                : 'bg-white border border-slate-200 text-slate-600 hover:text-slate-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-8 space-y-5">
          {/* OVERVIEW TAB */}
          {activeTab === 'overview' && (
            <div className="bg-white border border-slate-200 shadow-sm p-6 rounded-2xl border border-slate-200 space-y-4">
              <span className="font-bold text-slate-205 uppercase block border-b border-slate-200 pb-2">Scheme Overview</span>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-[9px] text-slate-500 uppercase block">Coverage Limit</span>
                  <strong className="text-slate-800">{scheme.coverage}</strong>
                </div>
                <div>
                  <span className="text-[9px] text-slate-500 uppercase block">Ministry</span>
                  <strong className="text-slate-800">{scheme.ministry}</strong>
                </div>
                <div>
                  <span className="text-[9px] text-slate-500 uppercase block">Eligibility</span>
                  <span className="text-slate-600">{scheme.eligibility}</span>
                </div>
                <div>
                  <span className="text-[9px] text-slate-500 uppercase block">Benefits</span>
                  <span className="text-slate-600">{scheme.benefits}</span>
                </div>
              </div>
            </div>
          )}

          {/* ELIGIBILITY TAB */}
          {activeTab === 'eligibility' && (
            <div className="bg-white border border-slate-200 shadow-sm p-6 rounded-2xl border border-slate-200 space-y-4">
              <span className="font-bold text-slate-205 uppercase block border-b border-slate-200 pb-2">Automatic Eligibility Checker</span>
              <form onSubmit={handleCheckEligibility} className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] text-slate-500 block mb-1">Your Age</label>
                  <input
                    type="number" value={age} onChange={e => setAge(e.target.value)}
                    aria-label="Age input"
                    className="w-full bg-white border border-slate-200 rounded-xl p-2 text-slate-202 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 block mb-1">Annual Income (₹)</label>
                  <input
                    type="number" value={income} onChange={e => setIncome(e.target.value)}
                    aria-label="Annual income input"
                    className="w-full bg-white border border-slate-200 rounded-xl p-2 text-slate-202 focus:outline-none"
                  />
                </div>
                <div className="col-span-2">
                  <label className="text-[10px] text-slate-500 block mb-1">State</label>
                  <select
                    value={selectedState} onChange={e => setSelectedState(e.target.value)}
                    aria-label="State selector"
                    className="w-full bg-white border border-slate-200 rounded-xl p-2 text-slate-202 focus:outline-none"
                  >
                    {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <button
                  type="submit"
                  disabled={checking}
                  className="col-span-2 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl uppercase disabled:opacity-50 transition-colors"
                >
                  {checking ? 'Checking…' : 'Check My Eligibility'}
                </button>
              </form>
              {eligibilityResult && (
                <div className={`p-4 rounded-xl border space-y-2 ${
                  eligibilityResult.status === 'eligible' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                  : eligibilityResult.status === 'possibly' ? 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                  : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                }`}>
                  <span className="font-bold block">
                    {eligibilityResult.status === 'eligible' ? '✅ Likely Eligible'
                    : eligibilityResult.status === 'possibly' ? '🟡 Possibly Eligible'
                    : '❌ May Not Qualify'}
                  </span>
                  <p className="text-slate-700">{eligibilityResult.explanation}</p>
                </div>
              )}
            </div>
          )}

          {/* HOSPITALS TAB — Location-Aware */}
          {activeTab === 'hospitals' && (
            <div className="space-y-4">
              <div className="bg-white border border-slate-200 shadow-sm p-5 rounded-2xl border border-slate-200">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-bold text-slate-205 uppercase">
                    Empanelled Hospitals {cityLabel ? `— ${cityLabel}` : ''}
                  </span>
                  {locating && <span className="text-amber-400 text-[10px] animate-pulse">Locating...</span>}
                </div>
                {hospitals.length === 0 && !locating && (
                  <p className="text-slate-500 text-center py-6">No location detected. Please enter your city above.</p>
                )}
                <div className="space-y-2">
                  {hospitals.map(h => (
                    <button
                      key={h.id}
                      onClick={() => setSelectedHospital(h)}
                      className={`w-full text-left p-3 rounded-xl border transition-all ${
                        selectedHospital?.id === h.id
                          ? 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                          : 'bg-white border-slate-200 hover:border-slate-200'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <span className="font-bold text-slate-800">{h.name}</span>
                        <span className="text-[9px] bg-white border border-slate-200 px-1.5 py-0.5 rounded text-rose-400">{h.type}</span>
                      </div>
                      <div className="mt-1 flex gap-3 text-[10px] text-slate-500">
                        <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{h.phone}</span>
                        <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{h.distance}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
              {hospitals.length > 0 && (
                <div className="h-56 rounded-2xl overflow-hidden border border-slate-200">
                  <MapContainer center={[centerLat, centerLng]} zoom={13} style={{ height: '100%', width: '100%' }}>
                    <MapRecenter lat={centerLat} lng={centerLng} />
                    <TileLayer
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    {hospitals.map(h => (
                      <Marker key={h.id} position={[h.lat, h.lng]}>
                        <Popup>
                          <div className="text-xs font-sans space-y-1">
                            <p className="font-bold text-slate-900">{h.name}</p>
                            <p className="text-slate-600">{h.type}</p>
                            <p className="text-slate-600">📞 {h.phone}</p>
                            <a href={`https://www.google.com/maps/dir/?api=1&destination=${h.lat},${h.lng}`}
                              target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">Navigate</a>
                          </div>
                        </Popup>
                      </Marker>
                    ))}
                  </MapContainer>
                </div>
              )}
            </div>
          )}

          {/* DOCUMENTS TAB */}
          {activeTab === 'documents' && (
            <div className="bg-white border border-slate-200 shadow-sm p-6 rounded-2xl border border-slate-200 space-y-4">
              <span className="font-bold text-slate-205 uppercase block border-b border-slate-200 pb-2">Required Documents Checklist</span>
              <div className="space-y-2">
                {scheme.documents.split(',').map((doc: string, i: number) => (
                  <div key={i} className="flex justify-between items-center p-2.5 bg-white rounded border border-slate-200">
                    <span className="flex items-center gap-2">
                      <FileText className="w-3.5 h-3.5 text-slate-600" />
                      {doc.trim()}
                    </span>
                    <span className={i === 0 ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'}>
                      {i === 0 ? '✔ Commonly Available' : '📋 May Need to Obtain'}
                    </span>
                  </div>
                ))}
              </div>
              <div className="p-3 bg-amber-500/5 border border-amber-500/15 rounded-xl text-amber-400 text-[10px] flex items-start gap-2">
                <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                <span>Document requirements may vary by state. Confirm with your nearest Common Service Centre or empanelled hospital.</span>
              </div>
            </div>
          )}

          {/* APPLICATION STEPS TAB */}
          {activeTab === 'apply' && (
            <div className="bg-white border border-slate-200 shadow-sm p-6 rounded-2xl border border-slate-200 space-y-4">
              <span className="font-bold text-slate-205 uppercase block border-b border-slate-200 pb-2">Application Process</span>
              <div className="space-y-4">
                {scheme.applicationSteps?.map((s: any) => (
                  <div key={s.step} className="flex gap-4 p-3 bg-white rounded-xl border border-slate-200">
                    <div className="w-8 h-8 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center font-bold shrink-0">
                      {s.step}
                    </div>
                    <div>
                      <p className="font-bold text-slate-800">{s.title}</p>
                      <p className="text-slate-600 mt-0.5">{s.desc}</p>
                    </div>
                  </div>
                ))}
                <div className="flex items-center gap-2 text-[10px] text-slate-600 pt-2">
                  <Clock className="w-3.5 h-3.5 text-indigo-400" />
                  Estimated Processing Time: <strong className="text-slate-800">{scheme.processingTime}</strong>
                </div>
              </div>
            </div>
          )}

          {/* FAQ TAB */}
          {activeTab === 'faq' && (
            <div className="bg-white border border-slate-200 shadow-sm p-6 rounded-2xl border border-slate-200 space-y-4">
              <span className="font-bold text-slate-205 uppercase block border-b border-slate-200 pb-2">Frequently Asked Questions</span>
              <div className="space-y-3">
                {scheme.faqs?.map((f: any, i: number) => (
                  <div key={i} className="p-3 bg-white rounded-xl border border-slate-200 space-y-1">
                    <p className="font-bold text-slate-800 flex items-start gap-1.5">
                      <HelpCircle className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />
                      {f.q}
                    </p>
                    <p className="text-slate-600 pl-5">{f.a}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Sidebar: ArogyaMitra Chat */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white border border-slate-200 shadow-sm p-5 rounded-2xl border border-slate-200 flex flex-col h-96">
            <div className="flex items-center gap-2 border-b border-slate-200 pb-3 mb-3">
              <Bot className="w-4 h-4 text-rose-400" />
              <span className="font-bold text-slate-205 text-xs uppercase">Ask ArogyaMitra</span>
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse ml-auto"></span>
            </div>
            <div className="flex-1 overflow-y-auto space-y-2 text-[10px] mb-3">
              {chatLog.map((c, i) => (
                <div key={i} className={`p-2 rounded-lg ${c.role === 'user' ? 'bg-rose-500/10 text-rose-200 text-right' : 'bg-white text-slate-700'}`}>
                  {c.content}
                </div>
              ))}
              {chatLoading && (
                <div className="bg-white text-slate-600 p-2 rounded-lg flex items-center gap-1 animate-pulse">
                  <span className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-ping"></span>
                  ArogyaMitra is thinking…
                </div>
              )}
            </div>
            <form onSubmit={handleSendChat} className="flex gap-2">
              <input
                type="text" placeholder="Ask about this scheme..."
                value={chatInput} onChange={e => setChatInput(e.target.value)}
                aria-label="Chat with ArogyaMitra"
                className="flex-1 bg-white border border-slate-200 rounded-xl p-2 text-slate-202 focus:outline-none text-xs"
              />
              <button type="submit" disabled={chatLoading}
                className="px-3 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl uppercase disabled:opacity-50 transition-colors">
                →
              </button>
            </form>
          </div>

          {/* Quick Suggestions */}
          <div className="bg-white border border-slate-200 shadow-sm p-4 rounded-2xl border border-slate-200 space-y-2">
            <span className="text-[10px] text-slate-500 uppercase font-bold block">Quick Questions</span>
            {['Am I eligible?', 'What documents do I need?', `Which hospitals accept ${scheme.name.split(' ')[0]}?`, 'How do I apply?'].map(q => (
              <button
                key={q}
                onClick={() => { setChatInput(q); }}
                className="w-full text-left py-1.5 px-3 bg-white border border-slate-200 text-[10px] text-slate-600 rounded-lg hover:text-slate-800 hover:bg-slate-850 transition-colors"
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
