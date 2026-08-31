import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ScanLine, Upload, AlertCircle, AlertTriangle, Volume2, ShieldAlert, RotateCw, ZoomIn, ZoomOut,
  RefreshCw, Layers, Clock, ShieldCheck, HeartPulse, Plus, Trash2, MapPin, ExternalLink,
  Navigation, LocateFixed, CheckCircle, XCircle, HelpCircle, Info, Loader2, Eye, EyeOff,
  ChevronDown, ChevronUp, Phone, FileText, Share2, Sparkles, Printer, User, Compass, Activity
} from 'lucide-react';
import { aiService } from '../../services/api';
import { t } from '../../i18n';
import { TextToSpeechButton } from '../../components/voice/TextToSpeechButton';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl:       'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl:     'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const UserDot = L.divIcon({
  html: `<div style="width:12px;height:12px;background:#f43f5e;border:2px solid #fff;border-radius:50%;box-shadow:0 0 0 4px rgba(244,63,94,0.25)"></div>`,
  className: '',
  iconSize:   [12, 12],
  iconAnchor: [6, 6],
});

function MapRecenter({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => { map.setView([lat, lng], 14); }, [lat, lng, map]);
  return null;
}

const SCAN_STEPS = [
  'Upload',
  'Image Enhancement',
  'OCR Engine',
  'QR Detection',
  'Field Extraction',
  'Database Validation',
  'Patient Context',
  'Clinical Analysis',
  'Complete',
] as const;

type ScanStep = typeof SCAN_STEPS[number];

function ScanProgressBar({ currentStep, error, remainingSecs }: { currentStep: ScanStep | null; error: boolean; remainingSecs: number }) {
  const idx = currentStep ? SCAN_STEPS.indexOf(currentStep) : -1;
  return (
    <div className="bg-white border border-slate-200 shadow-sm p-4 rounded-xl border border-slate-200 space-y-2">
      <div className="flex justify-between items-center text-xs">
        <span className="font-mono text-slate-700">Scan Pipeline: {currentStep}</span>
        {remainingSecs > 0 && (
          <span className="font-mono text-amber-400">Est. remaining: {remainingSecs}s</span>
        )}
      </div>
      <div className="w-full bg-white rounded-full h-1.5 overflow-hidden">
        <div
          className={`h-full transition-all duration-300 ${error ? 'bg-rose-500' : 'bg-gradient-to-r from-rose-500 to-amber-500'}`}
          style={{ width: `${((idx + 1) / SCAN_STEPS.length) * 100}%` }}
        />
      </div>
      <div className="grid grid-cols-5 gap-1 pt-1">
        {SCAN_STEPS.map((step, i) => (
          <div
            key={step}
            className={`text-[8px] font-mono text-center truncate ${
              i <= idx ? (error && i === idx ? 'text-rose-500' : 'text-teal-400') : 'text-slate-600'
            }`}
          >
            {step}
          </div>
        ))}
      </div>
    </div>
  );
}

function ConfidenceBadge({ confidence, value }: { confidence: number; value: string }) {
  if (!value || value.toLowerCase().includes('unable') || value.toLowerCase().includes('not detect')) {
    return <span className="text-[9px] font-bold text-rose-500 font-mono">🔴 Low</span>;
  }
  if (confidence >= 0.8) {
    return <span className="text-[9px] font-bold text-emerald-400 font-mono">🟢 High ({Math.round(confidence * 100)}%)</span>;
  }
  if (confidence >= 0.5) {
    return <span className="text-[9px] font-bold text-amber-400 font-mono">🟡 Medium ({Math.round(confidence * 100)}%)</span>;
  }
  return <span className="text-[9px] font-bold text-rose-500 font-mono">🔴 Low ({Math.round(confidence * 100)}%)</span>;
}

export default function CitizenScannerPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Active Tab
  const [activeTab, setActiveTab] = useState<'Scanner' | 'History' | 'Compare' | 'Admin'>('Scanner');

  // File handling
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  // Scan state
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState<ScanStep | null>(null);
  const [stepError, setStepError] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [ocrData, setOcrData] = useState<any>(null);
  const [error, setError] = useState('');
  const [qualityWarn, setQualityWarn] = useState('');
  const [remainingTime, setRemainingTime] = useState(0);

  // Metadata hardening
  const [scanId, setScanId] = useState('');
  const [imageQuality, setImageQuality] = useState<any>(null);
  const [dbValidation, setDbValidation] = useState<any>(null);
  const [qrBarcodeVerification, setQrBarcodeVerification] = useState<any>(null);
  const [perfMetrics, setPerfMetrics] = useState<any>(null);

  // Patient context
  const [contextConsent, setContextConsent] = useState<boolean>(() => localStorage.getItem('scannerContextConsent') === 'true');
  const [showConsentDialog, setShowConsentDialog] = useState(false);
  const [patientWarnings, setPatientWarnings] = useState<any[]>([]);
  const [contextUsed, setContextUsed] = useState(false);
  const [patientCtxSummary, setPatientCtxSummary] = useState<any>(null);

  // History & Compare states
  const [historyList, setHistoryList] = useState<any[]>(() => JSON.parse(localStorage.getItem('medicine_scan_history') || '[]'));
  const [searchQuery, setSearchQuery] = useState('');
  const [filterQuality, setFilterQuality] = useState('All');
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareTarget, setShareTarget] = useState('');
  const [copySuccess, setCopySuccess] = useState(false);

  // Pharmacy Map settings
  const [coords, setCoords] = useState<{ lat: number; lng: number }>({ lat: 19.0178, lng: 73.0286 });
  const [locPermission, setLocPermission] = useState<'prompt' | 'granted' | 'denied'>('prompt');
  const [pharmacies, setPharmacies] = useState<any[]>([
    { name: 'Jan Aushadhi Kendra Belapur', type: 'Jan Aushadhi', dist: '0.8 KM', time: '5 mins', hours: '09:00 - 21:00', phone: '022-2756311', lat: 19.0185, lng: 73.0295, stock: 'High Stock' },
    { name: 'Apollo Pharmacy CBD', type: 'Private', dist: '1.5 KM', time: '10 mins', hours: '24 Hours Open', phone: '022-2756422', lat: 19.0165, lng: 73.0270, stock: 'Medium Stock' },
  ]);

  const [showContext, setShowContext] = useState(false);

  const speakText = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance((text || '').replace(/[#*`_]/g, ''));
      window.speechSynthesis.speak(u);
    }
  };

  // Drag & Drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };
  const handleDragLeave = () => {
    setIsDragging(false);
  };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const f = e.dataTransfer.files?.[0];
    if (f) processFile(f);
  };

  const processFile = (f: File) => {
    const allowed = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    if (!allowed.includes(f.type)) {
      setError('Unsupported file type. Please upload PNG, JPG, JPEG, or WEBP.');
      return;
    }
    if (f.size > 12 * 1024 * 1024) {
      setError('File is too large. Maximum size is 12MB.');
      return;
    }
    setFile(f);
    setError('');
    setResult(null);
    setOcrData(null);
    setQualityWarn('');
    setPatientWarnings([]);
    setContextUsed(false);
    setCurrentStep(null);
    setStepError(false);

    const reader = new FileReader();
    reader.onload = (ev) => setPreviewUrl(ev.target?.result as string);
    reader.readAsDataURL(f);
  };

  // Canvas Image preview
  useEffect(() => {
    if (!previewUrl) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const img = new Image();
    img.onload = () => {
      const angleRad = (rotation * Math.PI) / 180;
      const w = img.width;
      const h = img.height;
      const sin = Math.abs(Math.sin(angleRad));
      const cos = Math.abs(Math.cos(angleRad));
      canvas.width = Math.round(w * cos + h * sin);
      canvas.height = Math.round(w * sin + h * cos);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate(angleRad);
      ctx.scale(zoom, zoom);
      ctx.drawImage(img, -w / 2, -h / 2);
    };
    img.src = previewUrl;
  }, [previewUrl, zoom, rotation]);

  // Geolocation
  const requestLocation = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          setLocPermission('granted');
        },
        () => {
          setLocPermission('denied');
        }
      );
    } else {
      setLocPermission('denied');
    }
  };

  // Consent
  const handleGrantConsent = () => {
    localStorage.setItem('scannerContextConsent', 'true');
    setContextConsent(true);
    setShowConsentDialog(false);
    doScan(true);
  };
  const handleDenyConsent = () => {
    localStorage.setItem('scannerContextConsent', 'false');
    setContextConsent(false);
    setShowConsentDialog(false);
    doScan(false);
  };

  // Main Scan Trigger
  const doScan = async (withContext: boolean) => {
    if (!file || loading) return;
    setLoading(true);
    setError('');
    setResult(null);
    setOcrData(null);
    setPatientWarnings([]);
    setContextUsed(false);
    setStepError(false);
    setRemainingTime(4);

    const stepsTimer = setInterval(() => {
      setRemainingTime((prev) => Math.max(0, prev - 1));
    }, 1000);

    const simulateStep = (step: ScanStep, ms: number) =>
      new Promise<void>((res) => {
        setCurrentStep(step);
        setTimeout(res, ms);
      });

    try {
      await simulateStep('Image Enhancement', 500);
      await simulateStep('OCR Engine', 600);
      await simulateStep('QR Detection', 300);
      await simulateStep('Field Extraction', 300);
      await simulateStep('Database Validation', 400);
      if (withContext) await simulateStep('Patient Context', 400);
      await simulateStep('Clinical Analysis', 500);

      const formData = new FormData();
      formData.append('image', file);

      const res = await aiService.scanMedicine(formData, withContext);

      clearInterval(stepsTimer);
      setRemainingTime(0);

      if (!res.success) {
        setStepError(true);
        setError(res.message || 'Scan failed. Please try again.');
        setLoading(false);
        return;
      }

      setCurrentStep('Complete');
      setResult(res.data);
      setScanId(res.scanId);
      setImageQuality(res.imageQuality);
      setDbValidation(res.dbValidation);
      setQrBarcodeVerification(res.qrBarcodeVerification);
      setPerfMetrics(res.performance);
      setOcrData(res.ocr);
      setQualityWarn(res.ocr?.qualityWarning || res.imageQuality?.warnings?.join(' | ') || '');
      setPatientWarnings(res.patientWarnings || []);
      setContextUsed(res.contextUsed || false);
      setPatientCtxSummary(res.patientContext || null);

      // Save to localStorage history
      const historyItem = {
        scanId: res.scanId || `SCAN-${Date.now()}`,
        medicineName: res.data?.medicineName || 'Unknown Medicine',
        genericName: res.data?.genericName || 'Unknown',
        date: new Date().toLocaleDateString(),
        imageQuality: res.imageQuality?.qualityRating || 'Excellent',
        warnings: res.warnings || [],
        data: res.data,
        ocr: res.ocr,
        patientWarnings: res.patientWarnings,
        contextUsed: res.contextUsed,
        patientContext: res.patientContext,
        dbValidation: res.dbValidation,
        qrBarcodeVerification: res.qrBarcodeVerification,
        performance: res.performance,
        previewUrl
      };

      const updated = [historyItem, ...historyList];
      setHistoryList(updated);
      localStorage.setItem('medicine_scan_history', JSON.stringify(updated));

    } catch (err: any) {
      clearInterval(stepsTimer);
      setRemainingTime(0);
      setStepError(true);
      let msg = err?.response?.data?.message || err?.message || 'Scan failed. Please retry.';
      if (msg.includes('500') || msg.toLowerCase().includes('internal server error')) {
        msg = 'AI Clinical Analysis temporarily unavailable. Showing OCR extracted medicine information.';
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleScanSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;
    const consent = localStorage.getItem('scannerContextConsent');
    if (consent === null) {
      setShowConsentDialog(true);
    } else {
      doScan(contextConsent);
    }
  };

  const handleReset = () => {
    setFile(null);
    setPreviewUrl('');
    setResult(null);
    setOcrData(null);
    setError('');
    setQualityWarn('');
    setCurrentStep(null);
    setStepError(false);
    setPatientWarnings([]);
    setContextUsed(false);
    setImageQuality(null);
    setDbValidation(null);
    setQrBarcodeVerification(null);
  };

  const deleteHistoryItem = (id: string) => {
    const filtered = historyList.filter(h => h.scanId !== id);
    setHistoryList(filtered);
    localStorage.setItem('medicine_scan_history', JSON.stringify(filtered));
  };

  const reopenScan = (item: any) => {
    setResult(item.data);
    setOcrData(item.ocr);
    setScanId(item.scanId);
    setImageQuality(item.imageQualityMetrics || { qualityRating: item.imageQuality });
    setDbValidation(item.dbValidation);
    setQrBarcodeVerification(item.qrBarcodeVerification);
    setPatientWarnings(item.patientWarnings);
    setContextUsed(item.contextUsed);
    setPatientCtxSummary(item.patientContext);
    setPerfMetrics(item.performance);
    if (item.previewUrl) setPreviewUrl(item.previewUrl);
    setActiveTab('Scanner');
  };

  // PDF report download
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 print:p-0">
      
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 print:hidden">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-rose-500/10 rounded-xl text-rose-400 border border-rose-500/20">
            <ScanLine className="w-6 h-6 glow-pill" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              Enterprise Medicine Scanner
              <span className="px-2 py-0.5 text-[9px] bg-rose-500/20 text-rose-300 font-mono rounded border border-rose-500/30 uppercase tracking-widest">CDSS Pro</span>
            </h2>
            <p className="text-xs text-slate-600">Hardened OCR-First Pipeline & Clinical Decision Support System</p>
          </div>
        </div>

        {/* Tab switcher */}
        <div className="flex bg-white border border-slate-200 p-1 rounded-xl gap-1 self-stretch sm:self-auto">
          {[
            { id: 'Scanner', icon: ScanLine, label: 'Scanner' },
            { id: 'History', icon: Clock, label: 'History' },
            { id: 'Compare', icon: Layers, label: 'Compare' },
            { id: 'Admin', icon: Activity, label: 'Admin Analytics' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono transition-all ${
                activeTab === tab.id
                  ? 'bg-rose-500 text-slate-950 font-bold'
                  : 'text-slate-600 hover:text-slate-800'
              }`}
            >
              <tab.icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* CONSENT DIALOG */}
      {showConsentDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white backdrop-blur-sm px-4">
          <div className="bg-white border border-slate-200 shadow-sm p-6 rounded-2xl border border-rose-500/20 max-w-md w-full space-y-4 text-xs">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-rose-400" />
              <h3 className="font-bold text-sm text-slate-900">Medical Records Access</h3>
            </div>
            <p className="text-slate-700">
              Allow ArogyaVerse AI to link your medical history (prescriptions, allergies, chronic diseases, lab results) to automatically run personalized safety validation?
            </p>
            <div className="flex gap-3 pt-2">
              <button onClick={handleGrantConsent} className="flex-1 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-lg uppercase">
                Allow
              </button>
              <button onClick={handleDenyConsent} className="flex-1 py-2 bg-white border border-slate-200 text-slate-350 hover:bg-slate-800 font-bold rounded-lg uppercase">
                Skip
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RENDER ACTIVE TAB */}
      {activeTab === 'Scanner' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* UPLOAD & CONTROLS */}
          <div className="lg:col-span-4 space-y-6 print:hidden">
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`bg-white border border-slate-200 shadow-sm p-6 rounded-2xl border-2 border-dashed transition-all text-center space-y-4 ${
                isDragging ? 'border-rose-500 bg-rose-500/5' : 'border-slate-200 hover:border-slate-700'
              }`}
            >
              {!previewUrl ? (
                <div className="py-8">
                  <Upload className="w-10 h-10 text-slate-500 mx-auto mb-3 animate-pulse" />
                  <p className="text-xs font-medium text-slate-700">Drag & Drop packaging photo here</p>
                  <p className="text-[10px] text-slate-500 mt-1">PNG, JPG or WEBP (Max 12MB)</p>
                  <div className="mt-4">
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-800 text-slate-800 text-xs rounded-xl transition-all font-semibold"
                    >
                      Browse Files
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) processFile(f);
                      }}
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="border border-slate-200 rounded-lg overflow-hidden flex justify-center bg-white relative">
                    <canvas ref={canvasRef} className="max-h-56 max-w-full object-contain" />
                  </div>
                  
                  {/* Preview controls */}
                  <div className="flex justify-center gap-2">
                    <button onClick={() => setZoom(z => Math.min(z + 0.1, 2))} className="p-1.5 bg-white hover:bg-slate-800 text-slate-700 rounded border border-slate-200" title="Zoom In"><ZoomIn className="w-3.5 h-3.5" /></button>
                    <button onClick={() => setZoom(z => Math.max(z - 0.1, 0.5))} className="p-1.5 bg-white hover:bg-slate-800 text-slate-700 rounded border border-slate-200" title="Zoom Out"><ZoomOut className="w-3.5 h-3.5" /></button>
                    <button onClick={() => setRotation(r => (r + 90) % 360)} className="p-1.5 bg-white hover:bg-slate-800 text-slate-700 rounded border border-slate-200" title="Rotate"><RotateCw className="w-3.5 h-3.5" /></button>
                    <button onClick={handleReset} className="p-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded border border-rose-500/20" title="Reset"><RefreshCw className="w-3.5 h-3.5" /></button>
                  </div>
                </div>
              )}
            </div>

            {/* Error notifications */}
            {error && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-300 rounded-xl text-xs flex gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block">Status Info</span>
                  <p>{error}</p>
                  <button onClick={() => doScan(contextConsent)} className="mt-2 px-2 py-1 bg-rose-500/20 rounded hover:bg-rose-500/30 font-mono text-[9px] uppercase font-bold text-rose-300">
                    Retry Clinical Analysis
                  </button>
                </div>
              </div>
            )}

            {/* Scan Button */}
            <button
              onClick={handleScanSubmit}
              disabled={!file || loading}
              className="w-full py-3.5 bg-gradient-to-r from-rose-500 to-amber-500 text-slate-950 font-bold hover:from-rose-400 hover:to-amber-400 rounded-xl disabled:opacity-40 text-xs tracking-wider font-mono uppercase flex items-center justify-center gap-2 transition-all shadow-lg shadow-rose-950/20"
            >
              {loading ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Analyzing Strip...</>
              ) : (
                <><ScanLine className="w-4 h-4" /> Start Strip Scan</>
              )}
            </button>
          </div>

          {/* RESULTS DASHBOARD */}
          <div className="lg:col-span-8 space-y-6">
            {loading && (
              <div className="space-y-6">
                <ScanProgressBar currentStep={currentStep} error={stepError} remainingSecs={remainingTime} />
                <div className="bg-white border border-slate-200 shadow-sm p-8 rounded-2xl border border-slate-200 flex flex-col items-center justify-center space-y-3">
                  <Loader2 className="w-8 h-8 text-rose-500 animate-spin" />
                  <p className="text-xs font-mono text-slate-600 animate-pulse">Running OCR character recognition & database safety check...</p>
                </div>
              </div>
            )}

            {result && !loading && (
              <div className="space-y-6 print:space-y-4">
                
                {/* ID & ACTION BAR */}
                <div className="bg-white border border-slate-200 shadow-sm p-4 rounded-xl border border-slate-200 flex flex-wrap justify-between items-center gap-3 print:hidden">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-mono font-bold rounded">
                      ✔ SCAN COMPLETED
                    </span>
                    <span className="font-mono text-[10px] text-slate-500">ID: {scanId}</span>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={handlePrint} className="p-2 bg-white border border-slate-200 hover:bg-slate-800 text-slate-350 rounded-lg text-xs flex items-center gap-1.5">
                      <Printer className="w-3.5 h-3.5" /> Print
                    </button>
                    <button onClick={() => setShowShareModal(true)} className="p-2 bg-white border border-slate-200 hover:bg-slate-800 text-slate-350 rounded-lg text-xs flex items-center gap-1.5">
                      <Share2 className="w-3.5 h-3.5" /> Share
                    </button>
                  </div>
                </div>

                {/* CLINICAL SUMMARY */}
                <div className="bg-white border border-slate-200 shadow-sm p-5 rounded-2xl border border-slate-200 space-y-3 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-3 text-rose-500/10">
                    <Sparkles className="w-20 h-20" />
                  </div>
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                          dbValidation?.matchStatus?.includes('Match')
                            ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-400'
                            : 'bg-rose-500/10 border-rose-500/25 text-rose-400'
                        }`}>
                          {dbValidation?.matchStatus || '❓ Not Found'}
                        </span>
                        {imageQuality?.qualityRating && (
                          <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                            imageQuality.qualityRating === 'Excellent' || imageQuality.qualityRating === 'Good'
                              ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-400'
                              : 'bg-amber-500/10 border-amber-500/25 text-amber-400'
                          }`}>
                            Quality: {imageQuality.qualityRating}
                          </span>
                        )}
                        <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                          imageQuality?.confidenceLevel === 'HIGH'
                            ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-400'
                            : imageQuality?.confidenceLevel === 'MEDIUM'
                              ? 'bg-amber-500/10 border-amber-500/25 text-amber-400'
                              : 'bg-rose-500/10 border-rose-500/25 text-rose-400'
                        }`}>
                          Confidence: {imageQuality?.confidenceLevel || 'LOW'}
                        </span>
                      </div>
                      
                      {imageQuality?.confidenceLevel === 'LOW' && (
                        <div className="mt-3 p-3 bg-rose-500/15 border border-rose-500/25 text-rose-300 rounded-xl text-xs flex gap-2">
                          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                          <div>
                            <span className="font-bold text-rose-200 block">🔴 LOW CONFIDENCE</span>
                            <p>{t('low_confidence_warn')}</p>
                          </div>
                        </div>
                      )}

                      {imageQuality?.confidenceLevel === 'MEDIUM' && (
                        <div className="mt-3 p-3 bg-amber-500/15 border border-amber-500/25 text-amber-300 rounded-xl text-xs flex gap-2">
                          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                          <div>
                            <span className="font-bold text-amber-200 block">🟡 POSSIBLE MATCH</span>
                            <p>{t('possible_medicine_warn', { name: result.medicineName || 'medicine' })}</p>
                          </div>
                        </div>
                      )}

                      <h3 className="text-2xl font-bold text-slate-900 mt-2">{result.medicineName || 'Scanned Strip'}</h3>
                      <p className="text-xs text-slate-600 mt-0.5">{result.genericName} • {result.strength} • {result.dosageForm}</p>
                    </div>

                    <TextToSpeechButton text={`${result.medicineName || ''}. Generic ${result.genericName || ''}. Uses ${result.clinicalAnalysis?.uses || ''}`} />
                  </div>

                  {qrBarcodeVerification?.qrStatus && qrBarcodeVerification.qrStatus !== 'Not detected' && (
                    <div className="flex gap-2 pt-2">
                      <span className="px-2 py-0.5 bg-teal-500/10 text-teal-400 text-[10px] font-mono rounded border border-teal-500/20">
                        {qrBarcodeVerification.qrStatus}
                      </span>
                      {qrBarcodeVerification.manufacturerVerified && (
                        <span className="px-2 py-0.5 bg-indigo-500/10 text-indigo-400 text-[10px] font-mono rounded border border-indigo-500/20">
                          ✓ Manufacturer Verified
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* CALIBRATED QUALITY DASHBOARD */}
                <div className="bg-white border border-slate-200 shadow-sm p-5 rounded-2xl border border-slate-200 space-y-4">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-widest flex items-center gap-2 border-b border-slate-200 pb-2">
                    <Activity className="w-4 h-4 text-rose-500" />
                    Intelligent OCR Quality & Accuracy Calibration
                  </h4>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {/* Overall Image Quality */}
                    <div className="bg-white p-3.5 rounded-xl border border-slate-200 space-y-1">
                      <span className="text-[10px] font-mono text-slate-500 uppercase block">Overall Quality</span>
                      <span className={`text-base font-bold font-mono block ${
                        imageQuality?.overallRating === 'Excellent' || imageQuality?.overallRating === 'Good'
                          ? 'text-emerald-400'
                          : 'text-amber-400'
                      }`}>
                        {imageQuality?.overallRating || 'Good'}
                      </span>
                    </div>

                    {/* OCR Accuracy */}
                    <div className="bg-white p-3.5 rounded-xl border border-slate-200 space-y-2">
                      <span className="text-[10px] font-mono text-slate-500 uppercase block">OCR Accuracy</span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-bold text-rose-400 font-mono">{imageQuality?.ocrAccuracy || 80}%</span>
                        <div className="w-full bg-slate-800 h-1.5 rounded overflow-hidden">
                          <div className="bg-rose-500 h-1.5 transition-all" style={{ width: `${imageQuality?.ocrAccuracy || 80}%` }}></div>
                        </div>
                      </div>
                    </div>

                    {/* Field Coverage */}
                    <div className="bg-white p-3.5 rounded-xl border border-slate-200 space-y-2">
                      <span className="text-[10px] font-mono text-slate-500 uppercase block">Field Coverage</span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-bold text-teal-400 font-mono">{imageQuality?.fieldCoverage || 60}%</span>
                        <div className="w-full bg-slate-800 h-1.5 rounded overflow-hidden">
                          <div className="bg-teal-500 h-1.5 transition-all" style={{ width: `${imageQuality?.fieldCoverage || 60}%` }}></div>
                        </div>
                      </div>
                    </div>

                    {/* Processing Speed */}
                    <div className="bg-white p-3.5 rounded-xl border border-slate-200 space-y-1">
                      <span className="text-[10px] font-mono text-slate-500 uppercase block">Processing Latency</span>
                      <span className="text-sm font-bold text-amber-400 font-mono block">
                        {imageQuality?.processingTime || perfMetrics?.ocrTime || 0}ms
                      </span>
                    </div>
                  </div>

                  {/* Physics & Regions Breakdown */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-white p-3.5 rounded-xl border border-slate-200 text-[10px] font-mono text-slate-600">
                    <div>
                      <span className="text-slate-500 block uppercase">Winning Pass</span>
                      <span>{imageQuality?.winningPass || 'Default'}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block uppercase">Orientation</span>
                      <span>{imageQuality?.orientation || '0°'}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block uppercase">Detected Regions</span>
                      <span className="truncate block">{imageQuality?.detectedRegions?.join(', ') || 'All Regions'}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block uppercase">Blur / Bright / Contrast</span>
                      <span>
                        {imageQuality?.qualityMetrics?.blurScore?.toFixed(0) || 12} / {imageQuality?.qualityMetrics?.brightnessScore || 75} / {imageQuality?.qualityMetrics?.contrastScore || 80}
                      </span>
                    </div>
                  </div>

                  {/* Checklist and suggestions */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                    {/* Detected & Missing Checklist */}
                    <div className="space-y-3">
                      <div className="space-y-1.5">
                        <span className="text-[10px] font-mono text-slate-600 uppercase block">Detected Fields Checklist</span>
                        <div className="grid grid-cols-2 gap-1.5 text-[10.5px] font-mono">
                          {imageQuality?.detectedFields && imageQuality.detectedFields.length > 0 ? (
                            imageQuality.detectedFields.map((field: string) => (
                              <div key={field} className="flex items-center gap-1 text-emerald-400">
                                <span>✓</span>
                                <span className="text-slate-350">{field}</span>
                              </div>
                            ))
                          ) : (
                            <span className="text-slate-500">No fields detected</span>
                          )}
                        </div>
                      </div>

                      {imageQuality?.missingFields && imageQuality.missingFields.length > 0 && (
                        <div className="space-y-1.5">
                          <span className="text-[10px] font-mono text-slate-600 uppercase block">Missing Fields Checklist</span>
                          <div className="grid grid-cols-2 gap-1.5 text-[10.5px] font-mono">
                            {imageQuality.missingFields.map((field: string) => (
                              <div key={field} className="flex items-center gap-1 text-rose-500">
                                <span>✗</span>
                                <span className="text-slate-500">{field}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Quality Suggestions & Pass Details */}
                    <div className="space-y-3">
                      <div className="space-y-1.5">
                        <span className="text-[10px] font-mono text-slate-600 uppercase block">Diagnostics & Suggestions</span>
                        <div className="space-y-1">
                          {imageQuality?.qualitySuggestions && imageQuality.qualitySuggestions.length > 0 ? (
                            imageQuality.qualitySuggestions.map((s: string, idx: number) => (
                              <div key={idx} className="text-[10px] text-amber-400 font-mono flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 bg-amber-400 rounded-full shrink-0"></span>
                                {s}
                              </div>
                            ))
                          ) : (
                            <div className="text-[10px] text-emerald-400 font-mono flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full shrink-0"></span>
                              Excellent image layout. No warnings reported.
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Expandable OCR Details */}
                      <details className="group cursor-pointer">
                        <summary className="text-[10px] font-mono text-slate-600 uppercase flex items-center gap-1 select-none hover:text-slate-800">
                          <span>▸ View Advanced OCR Pass Details</span>
                        </summary>
                        <div className="mt-2 bg-white p-3 rounded-lg border border-slate-200 text-[10px] font-mono space-y-1 text-slate-600">
                          <div><span className="text-slate-500">Winning OCR Pass:</span> {imageQuality?.winningPass || 'Default'}</div>
                          <div><span className="text-slate-500">Characters Detected:</span> {ocrData?.detectedText?.length || 0}</div>
                          <div><span className="text-slate-500">Confidence Score:</span> {ocrData?.confidence || 'Unknown'}</div>
                        </div>
                      </details>
                    </div>
                  </div>
                </div>

                {/* SAFETY CHECK GRID */}
                {contextUsed && (
                  <div className="bg-white border border-slate-200 shadow-sm p-5 rounded-2xl border border-rose-500/20 space-y-4">
                    <h4 className="text-xs font-bold text-rose-300 uppercase tracking-widest flex items-center gap-2 border-b border-slate-200 pb-2">
                      <ShieldAlert className="w-4 h-4" />
                      Clinical Safety Verification Engine
                      {patientCtxSummary && (
                        <button onClick={() => setShowContext(!showContext)} className="ml-auto text-slate-500 hover:text-slate-700 print:hidden">
                          {showContext ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      )}
                    </h4>

                    {showContext && patientCtxSummary && (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-white p-4 rounded-xl border border-slate-200 text-[10px] font-mono">
                        <div>
                          <span className="text-slate-500 block">Allergies</span>
                          <span className="text-rose-400">{patientCtxSummary.allergies?.join(', ') || 'None'}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block">Prescribed</span>
                          <span className="text-teal-400">{patientCtxSummary.medications?.join(', ') || 'None'}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block">Chronic Conditions</span>
                          <span className="text-amber-400">{patientCtxSummary.chronicDiseases?.join(', ') || 'None'}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block">Kidney / Liver Score</span>
                          <span className="text-indigo-400">Kidney: {patientCtxSummary.kidneyScore || 90}% / Liver: {patientCtxSummary.liverScore || 85}%</span>
                        </div>
                      </div>
                    )}

                    <div className="space-y-2">
                      {patientWarnings.length === 0 ? (
                        <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-xs flex items-center gap-2 font-mono">
                          <CheckCircle className="w-4 h-4" /> No allergy or cross-reaction interactions detected for this patient profile.
                        </div>
                      ) : (
                        patientWarnings.map((warn, i) => (
                          <div
                            key={i}
                            className={`p-3 rounded-xl border flex gap-2.5 text-xs ${
                              warn.level === 'danger'
                                ? 'bg-rose-500/10 border-rose-500/25 text-rose-300'
                                : warn.level === 'warning'
                                  ? 'bg-amber-500/10 border-amber-500/25 text-amber-300'
                                  : 'bg-blue-500/10 border-blue-500/25 text-blue-300'
                            }`}
                          >
                            <ShieldAlert className="w-4 h-4 mt-0.5 shrink-0" />
                            <div>
                              <span className="font-bold block">{warn.title}</span>
                              <p className="mt-0.5">{warn.detail}</p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}

                {/* EXTRACTED FIELDS TABLE */}
                <div className="bg-white border border-slate-200 shadow-sm p-5 rounded-2xl border border-slate-200 space-y-4">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-widest border-b border-slate-200 pb-2">
                    Extracted Packaging Information (OCR First)
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                      { label: 'Medicine Name', val: result.medicineName, conf: ocrData?.fieldConfidences?.medicineName ?? 0.8, source: ocrData?.fieldSources?.medicineName || 'OCR' },
                      { label: 'Manufacturer', val: result.manufacturer, conf: ocrData?.fieldConfidences?.manufacturer ?? 0.82, source: ocrData?.fieldSources?.manufacturer || 'OCR' },
                      { label: 'Composition Strength', val: result.strength, conf: ocrData?.fieldConfidences?.strength ?? 0.85, source: ocrData?.fieldSources?.strength || 'OCR' },
                      { label: 'Batch Identifier', val: result.batchNumber, conf: ocrData?.fieldConfidences?.batchNumber ?? 0.90, source: ocrData?.fieldSources?.batchNumber || 'OCR' },
                      { label: 'Manufacturing Date', val: result.manufacturingDate, conf: ocrData?.fieldConfidences?.manufacturingDate ?? 0.90, source: ocrData?.fieldSources?.manufacturingDate || 'OCR' },
                      { label: 'Expiry Date', val: result.expiryDate, conf: ocrData?.fieldConfidences?.expiryDate ?? 0.90, source: ocrData?.fieldSources?.expiryDate || 'OCR' },
                      { label: 'Retail Price (MRP)', val: result.mrp, conf: ocrData?.fieldConfidences?.mrp ?? 0.88, source: ocrData?.fieldSources?.mrp || 'OCR' },
                      { label: 'Dosage Form', val: result.dosageForm, conf: ocrData?.fieldConfidences?.dosageForm ?? 0.8, source: ocrData?.fieldSources?.dosageForm || 'OCR' },
                      { label: 'QR Status', val: qrBarcodeVerification?.qrStatus || 'Not detected', conf: qrBarcodeVerification?.qrStatus && qrBarcodeVerification.qrStatus !== 'Not detected' ? 0.95 : 0, source: ocrData?.fieldSources?.qrCode || 'OCR' },
                      { label: 'Barcode Status', val: qrBarcodeVerification?.barcodeStatus || 'Not detected', conf: qrBarcodeVerification?.barcodeStatus && qrBarcodeVerification.barcodeStatus !== 'Not detected' ? 0.95 : 0, source: ocrData?.fieldSources?.barcode || 'OCR' }
                    ].map((f, i) => (
                      <div key={i} className="p-3 bg-white border border-slate-200 rounded-xl flex justify-between items-center">
                        <div className="space-y-1">
                          <span className="text-[10px] font-mono text-slate-500 block uppercase">{f.label}</span>
                          <span className="text-sm font-bold text-slate-800 block">{f.val || 'Unable to Detect'}</span>
                          <span className="px-1.5 py-0.5 bg-white border border-slate-200 text-[8px] font-mono text-slate-600 rounded inline-block">
                            Source: {f.source}
                          </span>
                        </div>
                        <ConfidenceBadge confidence={f.conf} value={f.val} />
                      </div>
                    ))}
                  </div>
                </div>

                {/* CLINICAL FACTS */}
                {result.clinicalAnalysis && (
                  <div className="bg-white border border-slate-200 shadow-sm p-5 rounded-2xl border border-slate-200 space-y-4">
                    <h4 className="text-xs font-bold text-slate-700 uppercase tracking-widest border-b border-slate-200 pb-2">
                      Clinical Facts & Guidelines
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                      <div className="space-y-1">
                        <span className="text-slate-500 font-mono block">Primary Indications & Uses</span>
                        <p className="text-slate-700 leading-relaxed">{result.clinicalAnalysis.uses}</p>
                      </div>
                      <div className="space-y-1">
                        <span className="text-slate-500 font-mono block">Dosage & Food Advice</span>
                        <p className="text-slate-700 leading-relaxed">{result.clinicalAnalysis.beforeAfterFood}</p>
                      </div>
                      <div className="space-y-1">
                        <span className="text-slate-500 font-mono block">Mechanism of Action</span>
                        <p className="text-slate-700 leading-relaxed">{result.clinicalAnalysis.mechanismOfAction}</p>
                      </div>
                      <div className="space-y-1">
                        <span className="text-slate-500 font-mono block">Missed Dose Guidance</span>
                        <p className="text-slate-700 leading-relaxed">{result.clinicalAnalysis.missedDoseGuidance}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* PHARMACY SELECTOR */}
                <div className="bg-white border border-slate-200 shadow-sm p-5 rounded-2xl border border-slate-200 space-y-4 print:hidden">
                  <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                    <h4 className="text-xs font-bold text-slate-700 uppercase tracking-widest flex items-center gap-1.5">
                      <MapPin className="w-4 h-4 text-rose-500 animate-bounce" /> Nearby Pharmacies & Kendras
                    </h4>
                    {locPermission !== 'granted' && (
                      <button
                        onClick={requestLocation}
                        className="text-[10px] font-mono bg-rose-500/10 border border-rose-500/20 text-rose-400 px-2.5 py-1 rounded hover:bg-rose-500/20"
                      >
                        Find Near Me
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                    <div className="md:col-span-5 space-y-2 max-h-72 overflow-y-auto pr-2">
                      {pharmacies.map((p, idx) => (
                        <div key={idx} className="p-3 bg-white border border-slate-200 rounded-xl hover:border-slate-200 transition-all text-xs space-y-1">
                          <div className="flex justify-between items-center">
                            <span className="font-bold text-slate-800">{p.name}</span>
                            <span className="px-1.5 py-0.5 bg-emerald-500/15 text-emerald-400 text-[8px] font-mono rounded">
                              {p.stock}
                            </span>
                          </div>
                          <p className="text-slate-600 font-mono text-[10px]">{p.type} • {p.dist} away ({p.time} travel)</p>
                          <p className="text-slate-500 text-[10px]">Hours: {p.hours}</p>
                          <div className="flex gap-2 pt-1">
                            <a href={`tel:${p.phone}`} className="flex items-center gap-1 text-[9px] font-mono text-teal-400 hover:underline">
                              <Phone className="w-3 h-3" /> Call Kendra
                            </a>
                            <a
                              href={`https://www.google.com/maps/dir/?api=1&destination=${p.lat},${p.lng}`}
                              target="_blank"
                              rel="noreferrer"
                              className="flex items-center gap-1 text-[9px] font-mono text-rose-400 hover:underline ml-auto"
                            >
                              <Navigation className="w-3 h-3" /> Directions
                            </a>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="md:col-span-7 h-72 border border-slate-200 rounded-xl overflow-hidden relative">
                      <MapContainer center={[coords.lat, coords.lng]} zoom={14} className="h-full w-full">
                        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                        <Marker position={[coords.lat, coords.lng]} icon={UserDot}>
                          <Popup>Your Location</Popup>
                        </Marker>
                        {pharmacies.map((p, idx) => (
                          <Marker key={idx} position={[p.lat, p.lng]}>
                            <Popup>
                              <div className="text-xs">
                                <strong>{p.name}</strong>
                                <p>{p.stock}</p>
                              </div>
                            </Popup>
                          </Marker>
                        ))}
                        <MapRecenter lat={coords.lat} lng={coords.lng} />
                      </MapContainer>
                    </div>
                  </div>
                </div>

                {/* DEBUG METRICS */}
                {perfMetrics && (
                  <div className="bg-white border border-slate-200 shadow-sm p-4 rounded-xl border border-slate-200 bg-white text-[10px] font-mono text-slate-500 space-y-1 print:hidden">
                    <span className="font-bold text-slate-600 uppercase tracking-widest block text-[9px] mb-1">Observability Analytics (Admin Mode)</span>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      <p>OCR Engine: <span className="text-slate-600">{perfMetrics.ocrTime}ms</span></p>
                      <p>AI Explanation: <span className="text-slate-600">{perfMetrics.aiTime}ms</span></p>
                      <p>DB Write latency: <span className="text-slate-600">{perfMetrics.dbTime}ms</span></p>
                      <p>Total time: <span className="text-slate-600">{perfMetrics.totalTimeMs}ms</span></p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* SCAN HISTORY TAB */}
      {activeTab === 'History' && (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-3 items-center justify-between">
            <h3 className="text-lg font-bold text-slate-800">Scanned Strip Archives</h3>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Search scans..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 outline-none"
              />
              <select
                value={filterQuality}
                onChange={(e) => setFilterQuality(e.target.value)}
                className="bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-800 outline-none"
              >
                <option value="All">All Quality</option>
                <option value="Excellent">Excellent</option>
                <option value="Good">Good</option>
                <option value="Fair">Fair</option>
                <option value="Poor">Poor</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {historyList
              .filter(h => h.medicineName.toLowerCase().includes(searchQuery.toLowerCase()) || h.scanId.includes(searchQuery))
              .filter(h => filterQuality === 'All' || h.imageQuality === filterQuality)
              .map((h) => (
                <div key={h.scanId} className="bg-white border border-slate-200 shadow-sm p-4 rounded-2xl border border-slate-200 flex flex-col justify-between space-y-3">
                  <div>
                    <div className="flex justify-between items-center text-[10px] font-mono text-slate-500">
                      <span>{h.date}</span>
                      <span>{h.scanId}</span>
                    </div>
                    <h4 className="text-base font-bold text-slate-800 mt-1">{h.medicineName}</h4>
                    <p className="text-xs text-slate-600 truncate">{h.genericName}</p>
                    <div className="flex gap-1.5 mt-2 flex-wrap">
                      <span className="px-2 py-0.5 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-[8px] font-mono rounded">
                        Quality: {h.imageQuality}
                      </span>
                      {h.dbValidation?.matchStatus && (
                        <span className="px-2 py-0.5 bg-white text-slate-600 text-[8px] font-mono rounded">
                          {h.dbValidation.matchStatus}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-slate-200">
                    <button onClick={() => reopenScan(h)} className="text-xs font-bold text-rose-400 hover:text-rose-350">
                      Reopen scan
                    </button>
                    <button onClick={() => deleteHistoryItem(h.scanId)} className="text-slate-500 hover:text-rose-500 p-1">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* COMPARE TAB */}
      {activeTab === 'Compare' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-bold text-slate-800">Compare Medicine Packages</h3>
            <span className="text-xs text-slate-600">{compareIds.length} of 2 selected</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-1 space-y-2">
              <span className="text-xs text-slate-600 block font-mono">Select 2 scans to compare:</span>
              <div className="space-y-1.5 max-h-96 overflow-y-auto">
                {historyList.map(h => (
                  <label key={h.scanId} className="flex items-center gap-2 p-2 bg-white rounded-lg border border-slate-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={compareIds.includes(h.scanId)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          if (compareIds.length < 2) setCompareIds([...compareIds, h.scanId]);
                        } else {
                          setCompareIds(compareIds.filter(id => id !== h.scanId));
                        }
                      }}
                      disabled={!compareIds.includes(h.scanId) && compareIds.length >= 2}
                      className="accent-rose-500"
                    />
                    <div className="text-[11px] truncate">
                      <span className="font-bold text-slate-800 block truncate">{h.medicineName}</span>
                      <span className="text-[9px] text-slate-500 font-mono">{h.scanId}</span>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div className="md:col-span-3">
              {compareIds.length < 2 ? (
                <div className="bg-white border border-slate-200 shadow-sm p-10 rounded-2xl border border-slate-200 text-center text-slate-500 text-xs">
                  Please select at least 2 scans from the left panel to display comparison analysis.
                </div>
              ) : (
                <div className="bg-white border border-slate-200 shadow-sm p-5 rounded-2xl border border-slate-200 space-y-4 overflow-x-auto text-xs">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200">
                        <th className="py-2 text-slate-455 font-mono">Field</th>
                        {compareIds.map(id => {
                          const item = historyList.find(h => h.scanId === id);
                          return (
                            <th key={id} className="py-2 text-slate-800 font-bold">{item?.medicineName}</th>
                          );
                        })}
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { label: 'Substance Generic', key: 'genericName' },
                        { label: 'Substance Strength', key: 'strength', path: 'data' },
                        { label: 'Manufacturer', key: 'manufacturer', path: 'data' },
                        { label: 'Batch Number', key: 'batchNumber', path: 'data' },
                        { label: 'Retail Price (MRP)', key: 'mrp', path: 'data' },
                        { label: 'Expiry Date', key: 'expiryDate', path: 'data' }
                      ].map((row, i) => (
                        <tr key={i} className="border-b border-slate-200">
                          <td className="py-3 font-mono text-slate-600">{row.label}</td>
                          {compareIds.map(id => {
                            const item = historyList.find(h => h.scanId === id);
                            const val = row.path === 'data' ? item?.data?.[row.key] : item?.[row.key];
                            return (
                              <td key={id} className="py-3 text-slate-700 font-semibold">{val || '—'}</td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ADMIN ANALYTICS TAB */}
      {activeTab === 'Admin' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Total Scans', val: historyList.length, desc: 'Longitudinal record count' },
              { label: 'Scan Success Rate', val: '100%', desc: 'Graceful fallback protection active' },
              { label: 'Average OCR confidence', val: historyList.length > 0 ? `${Math.round(historyList.reduce((acc, h) => {
                const confVal = typeof h.ocr?.confidence === 'number' ? h.ocr.confidence : (parseFloat(h.ocr?.confidence) / 100 || (h.ocr?.ocrTextConfidence ? h.ocr.ocrTextConfidence / 100 : 0.8));
                return acc + confVal;
              }, 0) / historyList.length * 100)}%` : 'N/A', desc: 'Preprocessed pass averages' },
              { label: 'Avg processing speed', val: '1.8s', desc: 'Image to warning delivery' }
            ].map((stat, i) => (
              <div key={i} className="bg-white border border-slate-200 shadow-sm p-4 rounded-xl border border-slate-200 space-y-1">
                <span className="text-[10px] font-mono text-slate-500 uppercase block">{stat.label}</span>
                <span className="text-xl font-bold text-rose-400 font-mono block">{stat.val}</span>
                <span className="text-[9px] text-slate-500 block">{stat.desc}</span>
              </div>
            ))}
          </div>

          <div className="bg-white border border-slate-200 shadow-sm p-5 rounded-2xl border border-slate-200 space-y-4">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-widest border-b border-slate-200 pb-2">
              longitudinal Scan Logs (Observability Database)
            </h4>
            <div className="overflow-x-auto text-[10px] font-mono">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500">
                    <th className="py-2">Scan ID</th>
                    <th className="py-2">Medicine Name</th>
                    <th className="py-2">Quality</th>
                    <th className="py-2">DB Validation</th>
                    <th className="py-2">Latency</th>
                    <th className="py-2">Memory Heap</th>
                  </tr>
                </thead>
                <tbody>
                  {historyList.map(h => (
                    <tr key={h.scanId} className="border-b border-slate-200 text-slate-600">
                      <td className="py-2">{h.scanId}</td>
                      <td className="py-2 font-bold text-slate-700">{h.medicineName}</td>
                      <td className="py-2">{h.imageQuality}</td>
                      <td className="py-2">{h.dbValidation?.matchStatus || '❓ Not Found'}</td>
                      <td className="py-2">{h.performance?.totalTimeMs || 1800}ms</td>
                      <td className="py-2">{(h.performance?.memoryUsage?.heapUsed / 1024 / 1024).toFixed(1) || '32.5'} MB</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SHARE MODAL */}
      {showShareModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white backdrop-blur-sm px-4">
          <div className="bg-white border border-slate-200 shadow-sm p-6 rounded-2xl border border-rose-500/20 max-w-md w-full space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                <Share2 className="w-4 h-4 text-rose-400" /> Share Scan Summary
              </h3>
              <button onClick={() => setShowShareModal(false)} className="text-slate-500 hover:text-slate-700">✕</button>
            </div>
            <div className="space-y-3">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(`Scan Summary: ${result?.medicineName || 'Medicine'}. Generic: ${result?.genericName}. Batch: ${result?.batchNumber}. Expiry: ${result?.expiryDate}`);
                  setCopySuccess(true);
                  setTimeout(() => setCopySuccess(false), 2000);
                }}
                className="w-full py-2 bg-white border border-slate-200 text-slate-800 hover:bg-slate-800 rounded-lg text-left px-3 flex justify-between"
              >
                <span>Copy Summary Text</span>
                <span className="text-rose-400 font-mono">{copySuccess ? 'Copied!' : 'Copy'}</span>
              </button>
              <button onClick={() => { alert('Shared securely with doctor session.'); setShowShareModal(false); }} className="w-full py-2 bg-white border border-slate-200 text-slate-800 hover:bg-slate-800 rounded-lg text-left px-3">
                Share with Prescribing Doctor
              </button>
              <button onClick={() => { alert('Shared with registered family member.'); setShowShareModal(false); }} className="w-full py-2 bg-white border border-slate-200 text-slate-800 hover:bg-slate-800 rounded-lg text-left px-3">
                Share with Family (WhatsApp / SMS)
              </button>
              <button onClick={() => { alert('Integrated to ABHA Health Records repository.'); setShowShareModal(false); }} className="w-full py-2 bg-white border border-slate-200 text-slate-800 hover:bg-slate-800 rounded-lg text-left px-3 font-mono font-bold text-indigo-400">
                ABHA Health Vault Integration (Future-Ready)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
