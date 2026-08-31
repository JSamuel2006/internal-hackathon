import React from 'react';
import { Map, AlertCircle, Compass, RefreshCw } from 'lucide-react';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { analyticsService } from '../../services/api';

export default function OfficerHeatmapPage() {
  const [heatmapPoints, setHeatmapPoints] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [disease, setDisease] = React.useState('All');

  const fetchHeatmap = async () => {
    setLoading(true);
    try {
      const res = await analyticsService.getGeoHeatmap(undefined, disease === 'All' ? undefined : disease);
      if (res.success && res.data.anonymizedSamplePoints) {
        setHeatmapPoints(res.data.anonymizedSamplePoints);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchHeatmap();
  }, [disease]);

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-teal-500/10 rounded-lg text-teal-450 border border-teal-500/20">
            <Map className="w-5 h-5 glow-pill" />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight text-slate-900">Disease Outbreak Heat Map</h2>
            <p className="text-xs text-slate-455 mt-0.5">District surveillance query density and hotspot mapping</p>
          </div>
        </div>

        {/* Filter controls */}
        <div className="flex items-center gap-2">
          <select
            value={disease}
            onChange={(e) => setDisease(e.target.value)}
            className="bg-white border border-slate-200 rounded-lg py-2 px-3 text-xs text-slate-800 outline-none focus:border-teal-500/35"
          >
            <option value="All">All Pathogens</option>
            <option value="Dengue">Dengue / High Fever</option>
            <option value="Malaria">Malaria</option>
            <option value="ADD">Acute Diarrhea</option>
          </select>
          <button
            onClick={fetchHeatmap}
            className="p-2 bg-white border border-slate-200 rounded-lg text-slate-600 hover:text-white transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Statistics list */}
        <div className="space-y-4">
          <span className="text-[10px] font-mono tracking-wider text-slate-500 uppercase px-1">Hotspot Blocks</span>
          <div className="space-y-3">
            {heatmapPoints.map((pt, i) => (
              <div key={i} className="p-4 rounded-xl bg-white border border-slate-200 flex justify-between items-center text-xs">
                <div>
                  <span className="font-semibold text-slate-800 block">{pt.district} District</span>
                  <span className="text-[10px] text-slate-500 font-mono">GeoHash: {pt.geoHash}</span>
                </div>
                <div className="text-right">
                  <span className="text-rose-400 font-bold block">{pt.queryDensity} queries/km²</span>
                  <span className={`text-[9px] font-mono ${pt.trend === 'UP' ? 'text-rose-455' : 'text-emerald-450'}`}>
                    {pt.trend} TREND
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Map Panel */}
        <div className="col-span-1 md:col-span-3 h-[480px] rounded-2xl border border-slate-200 overflow-hidden relative">
          <MapContainer center={[18.5204, 73.8567]} zoom={9} scrollWheelZoom={true}>
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {heatmapPoints.map((pt, i) => (
              <CircleMarker
                key={i}
                center={[pt.lat, pt.lng]}
                radius={pt.queryDensity / 4}
                pathOptions={{
                  color: pt.trend === 'UP' ? '#ef4444' : '#f59e0b',
                  fillColor: pt.trend === 'UP' ? '#ef4444' : '#f59e0b',
                  fillOpacity: 0.45,
                  weight: 1.5
                }}
              >
                <Popup>
                  <div className="p-2 space-y-1 font-sans text-slate-900 text-xs">
                    <h5 className="font-bold text-slate-950">{pt.district} Cluster</h5>
                    <p>Density Index: {pt.queryDensity}</p>
                    <p className="font-semibold">Trend posture: {pt.trend}</p>
                  </div>
                </Popup>
              </CircleMarker>
            ))}
          </MapContainer>
        </div>
      </div>
    </div>
  );
}
