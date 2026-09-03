import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  MapPin, Phone, ShieldCheck, Compass, HelpCircle, LocateFixed, RefreshCw,
  AlertCircle, Navigation, Bed
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix Leaflet icon paths
import iconMarker from 'leaflet/dist/images/marker-icon.png';
import iconRetina from 'leaflet/dist/images/marker-icon-2x.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

const DefaultIcon = L.icon({
  iconUrl: iconMarker,
  iconRetinaUrl: iconRetina,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  tooltipAnchor: [16, -28],
  shadowSize: [41, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

const UserIcon = L.divIcon({
  html: `<div style="width:14px;height:14px;background:#f43f5e;border:2px solid #fff;border-radius:50%;box-shadow:0 0 0 4px rgba(244,63,94,0.3)"></div>`,
  className: '',
  iconSize: [14, 14],
  iconAnchor: [7, 7],
});

// Recenter map when coordinates change
function MapRecenter({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng], 13);
  }, [lat, lng, map]);
  return null;
}

// Generic nearby hospital data by approximate lat/lng
const HOSPITAL_DB: Record<string, { id: number; name: string; type: string; lat: number; lng: number; beds: number; phone: string; schemes: string[] }[]> = {
  default: [
    { id: 1, name: 'District Government Hospital', type: 'District Hospital', lat: 0, lng: 0, beds: 150, phone: '108', schemes: ['PM-JAY', 'CMCHIS'] },
    { id: 2, name: 'Primary Health Centre', type: 'PHC', lat: 0, lng: 0, beds: 20, phone: '104', schemes: ['NVBDCP', 'PM-JAY'] },
    { id: 3, name: 'Community Health Centre', type: 'CHC', lat: 0, lng: 0, beds: 45, phone: '1800-180-1104', schemes: ['RAN', 'PM-JAY'] },
  ]
};

function generateNearbyHospitals(lat: number, lng: number, cityLabel: string) {
  const offsets = [
    [0.012, 0.008],
    [-0.008, 0.015],
    [0.018, -0.012],
    [-0.015, -0.010],
  ];
  return [
    { id: 1, name: `${cityLabel} Government Medical College Hospital`, type: 'District Hospital', lat: lat + offsets[0][0], lng: lng + offsets[0][1], beds: 420, phone: '108', schemes: ['PM-JAY', 'CMCHIS'] },
    { id: 2, name: `Urban Primary Health Centre — ${cityLabel}`, type: 'PHC', lat: lat + offsets[1][0], lng: lng + offsets[1][1], beds: 25, phone: '104', schemes: ['NVBDCP', 'PM-JAY'] },
    { id: 3, name: `Sub-District Community Health Centre`, type: 'CHC', lat: lat + offsets[2][0], lng: lng + offsets[2][1], beds: 60, phone: '1800-180-1104', schemes: ['RAN', 'PM-JAY'] },
    { id: 4, name: `Jan Arogya Hospital — ${cityLabel}`, type: 'Sub-District Hospital', lat: lat + offsets[3][0], lng: lng + offsets[3][1], beds: 80, phone: '1800-111-565', schemes: ['PM-JAY', 'RAN'] },
  ];
}

const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
  'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
  'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Delhi', 'Jammu & Kashmir', 'Ladakh', 'Puducherry',
];

export default function CitizenHospitalsPage() {
  const [selectedHospital, setSelectedHospital] = useState<any>(null);

  // Location state
  const [userLat, setUserLat] = useState<number | null>(null);
  const [userLng, setUserLng] = useState<number | null>(null);
  const [cityLabel, setCityLabel] = useState('Your City');
  const [locationError, setLocationError] = useState('');
  const [locating, setLocating] = useState(false);
  const [hospitals, setHospitals] = useState<any[]>([]);

  // Manual fallback state
  const [manualMode, setManualMode] = useState(false);
  const [manualState, setManualState] = useState('');
  const [manualCity, setManualCity] = useState('');
  const [manualPin, setManualPin] = useState('');

  const requestLocation = useCallback(async () => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation not supported by your browser.');
      setManualMode(true);
      return;
    }
    setLocating(true);
    setLocationError('');
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setUserLat(lat);
        setUserLng(lng);
        // Reverse geocode using Nominatim
        try {
          const r = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`);
          const data = await r.json();
          const city = data.address?.city || data.address?.town || data.address?.village || data.address?.county || 'Nearby';
          const state = data.address?.state || '';
          setCityLabel(city);
          setManualState(state);
          setManualCity(city);
        } catch {
          setCityLabel('Nearby');
        }
        const nearbyHospitals = generateNearbyHospitals(lat, lng, cityLabel);
        setHospitals(nearbyHospitals);
        setSelectedHospital(nearbyHospitals[0]);
        setLocating(false);
      },
      (err) => {
        setLocating(false);
        setLocationError('Location access denied. Please choose your location manually below.');
        setManualMode(true);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  }, [cityLabel]);

  const applyManualLocation = () => {
    if (!manualCity.trim()) return;
    // Use approximate lat/lng for major Indian cities
    const cityCoords: Record<string, [number, number]> = {
      'mumbai': [19.076, 72.8777], 'delhi': [28.6139, 77.2090], 'bangalore': [12.9716, 77.5946],
      'bengaluru': [12.9716, 77.5946], 'chennai': [13.0827, 80.2707], 'kolkata': [22.5726, 88.3639],
      'hyderabad': [17.385, 78.4867], 'pune': [18.5204, 73.8567], 'ahmedabad': [23.0225, 72.5714],
      'jaipur': [26.9124, 75.7873], 'lucknow': [26.8467, 80.9462], 'surat': [21.1702, 72.8311],
      'chandigarh': [30.7333, 76.7794], 'bhopal': [23.2599, 77.4126], 'patna': [25.5941, 85.1376],
      'agra': [27.1767, 78.0081], 'nagpur': [21.1458, 79.0882], 'coimbatore': [11.0168, 76.9558],
      'kochi': [9.9312, 76.2673], 'guwahati': [26.1445, 91.7362],
    };
    const key = manualCity.toLowerCase().trim();
    const coords = cityCoords[key];
    if (coords) {
      setUserLat(coords[0]);
      setUserLng(coords[1]);
    } else {
      // Default to centroid of India
      setUserLat(20.5937);
      setUserLng(78.9629);
    }
    setCityLabel(manualCity);
    const nearby = generateNearbyHospitals(
      coords ? coords[0] : 20.5937,
      coords ? coords[1] : 78.9629,
      manualCity
    );
    setHospitals(nearby);
    setSelectedHospital(nearby[0]);
    setManualMode(false);
    setLocationError('');
  };

  useEffect(() => {
    requestLocation();
  }, []);

  // Update hospital list when cityLabel changes after geocoding
  useEffect(() => {
    if (userLat && userLng) {
      const nearby = generateNearbyHospitals(userLat, userLng, cityLabel);
      setHospitals(nearby);
      setSelectedHospital(nearby[0]);
    }
  }, [cityLabel, userLat, userLng]);

  const centerLat = userLat ?? 20.5937;
  const centerLng = userLng ?? 78.9629;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-rose-50 rounded-xl text-rose-600 border border-rose-200">
            <MapPin className="w-5 h-5 glow-pill" />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight text-slate-900">Healthcare Locator</h2>
            <p className="text-xs text-slate-500 mt-0.5">Find nearby government hospitals, PHCs, and immunization points</p>
          </div>
        </div>

        {/* Location bar */}
        <div className="flex items-center gap-2 text-xs font-sans">
          {locating ? (
            <span className="text-amber-600 font-bold flex items-center gap-1.5 animate-pulse bg-amber-50 px-3 py-1.5 rounded-xl border border-amber-200">
              <LocateFixed className="w-3.5 h-3.5" />
              Locating…
            </span>
          ) : userLat ? (
            <span className="text-teal-700 font-bold flex items-center gap-1.5 bg-teal-50 px-3 py-1.5 rounded-xl border border-teal-200">
              <LocateFixed className="w-3.5 h-3.5" />
              {cityLabel}
            </span>
          ) : (
            <span className="text-slate-500 flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
              <MapPin className="w-3.5 h-3.5" />
              No location
            </span>
          )}
          <button
            onClick={requestLocation}
            className="p-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 transition-colors cursor-pointer"
            title="Refresh location"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Location error / Manual mode */}
      {locationError && (
        <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-400 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{locationError}</span>
        </div>
      )}

      {manualMode && (
        <div className="bg-white border border-slate-200 shadow-sm p-5 rounded-2xl border border-slate-200 space-y-3">
          <span className="text-xs font-bold text-slate-205 uppercase">Choose Your Location Manually</span>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <select
              value={manualState}
              onChange={e => setManualState(e.target.value)}
              className="bg-white border border-slate-200 rounded-xl p-2 text-slate-202 text-xs focus:outline-none"
              aria-label="Select State"
            >
              <option value="">Select State</option>
              {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <input
              type="text"
              placeholder="City / District"
              value={manualCity}
              onChange={e => setManualCity(e.target.value)}
              aria-label="City or district input"
              className="bg-white border border-slate-200 rounded-xl p-2 text-slate-202 text-xs focus:outline-none"
            />
            <input
              type="text"
              placeholder="PIN Code (optional)"
              value={manualPin}
              onChange={e => setManualPin(e.target.value)}
              aria-label="PIN code input"
              className="bg-white border border-slate-200 rounded-xl p-2 text-slate-202 text-xs focus:outline-none"
            />
          </div>
          <button
            onClick={applyManualLocation}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl transition-colors"
          >
            Find Nearby Hospitals
          </button>
        </div>
      )}

      {hospitals.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Sidebar list */}
          <div className="space-y-4">
            <span className="text-[10px] font-mono tracking-wider text-slate-500 uppercase px-1">
              Nearby Facilities — {cityLabel}
            </span>
            <div className="space-y-3 max-h-[450px] overflow-y-auto pr-2">
              {hospitals.map((hosp) => (
                <button
                  key={hosp.id}
                  onClick={() => setSelectedHospital(hosp)}
                  className={`w-full text-left p-4 rounded-xl border transition-all ${
                    selectedHospital?.id === hosp.id
                      ? 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                      : 'bg-white border-slate-200 hover:border-slate-200 text-slate-350'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <h4 className="text-xs font-bold text-slate-800">{hosp.name}</h4>
                    <span className="text-[9px] font-mono bg-white border border-slate-200 px-1.5 py-0.5 rounded text-rose-400 shrink-0 ml-1">
                      {hosp.type}
                    </span>
                  </div>
                  <div className="mt-3 flex flex-col gap-1 text-[10px] text-slate-500 font-mono">
                    <span className="flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5" />
                      {hosp.phone}
                    </span>
                    <span className="flex items-center gap-1.5 mt-1 text-slate-700">
                      <Bed className="w-3.5 h-3.5 text-teal-400" />
                      {hosp.beds} General Beds Available
                    </span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {hosp.schemes.map((s: string) => (
                        <span key={s} className="bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-1.5 py-0.5 rounded text-[9px]">{s}</span>
                      ))}
                    </div>
                  </div>
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${hosp.lat},${hosp.lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={e => e.stopPropagation()}
                    className="mt-2 flex items-center gap-1 text-[10px] text-rose-400 hover:text-rose-300"
                  >
                    <Navigation className="w-3 h-3" />
                    Navigate
                  </a>
                </button>
              ))}
            </div>
          </div>

          {/* Map panel */}
          <div className="col-span-1 md:col-span-2 h-[450px] rounded-2xl border border-slate-200 overflow-hidden relative">
            <MapContainer center={[centerLat, centerLng]} zoom={13} scrollWheelZoom={true} style={{ height: '100%', width: '100%' }}>
              <MapRecenter lat={centerLat} lng={centerLng} />
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              {/* User position */}
              {userLat && (
                <Marker position={[userLat, userLng!]} icon={UserIcon}>
                  <Popup><div className="text-xs font-bold text-slate-900">📍 Your Location</div></Popup>
                </Marker>
              )}
              {hospitals.map((hosp) => (
                <Marker key={hosp.id} position={[hosp.lat, hosp.lng]} icon={DefaultIcon}>
                  <Popup>
                    <div className="p-2 space-y-1 font-sans text-slate-900">
                      <h5 className="font-bold text-xs text-slate-950">{hosp.name}</h5>
                      <p className="text-[10px] text-slate-600">{hosp.type}</p>
                      <p className="text-[10px] font-semibold text-emerald-600 mt-1">{hosp.beds} beds available</p>
                      <p className="text-[10px] text-slate-700">📞 {hosp.phone}</p>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>
        </div>
      ) : !locating && (
        <div className="bg-white border border-slate-200 shadow-sm p-12 rounded-2xl border border-slate-200 text-center space-y-3">
          <MapPin className="w-10 h-10 text-slate-700 mx-auto animate-pulse" />
          <p className="text-slate-500 text-xs font-mono">Allow location access or enter your city to find nearby healthcare facilities.</p>
          <button
            onClick={() => setManualMode(true)}
            className="px-4 py-2 bg-white border border-slate-200 text-xs text-slate-700 rounded-xl hover:bg-slate-850 transition-colors"
          >
            Enter Location Manually
          </button>
        </div>
      )}
    </div>
  );
}
