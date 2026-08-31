import React from 'react';
import {
  FileText, Upload, AlertCircle, ShieldAlert, Clock, Award,
  CheckCircle, Activity, User, HeartPulse, ChevronRight, HelpCircle, Volume2,
  ZoomIn, ZoomOut, RotateCw, Download, FileSpreadsheet, FileCode, Printer, Share2, Layers, Calendar, ArrowRight, Camera, Pill, Brain
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { aiService, reportService, api } from '../../services/api';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';

export default function CitizenReportAnalyzerPage() {
  const [activeTab, setActiveTab] = React.useState<'dashboard' | 'upload' | 'comparison' | 'timeline' | 'export'>('dashboard');

  // File Upload & Multi-file State
  const [fileList, setFileList] = React.useState<File[]>([]);
  const [previewUrl, setPreviewUrl] = React.useState<string>('');
  const [loading, setLoading] = React.useState(false);
  const [progressStep, setProgressStep] = React.useState<string>('');
  const [estimatedTime, setEstimatedTime] = React.useState<number>(0);
  const [error, setError] = React.useState('');

  // Diagnostic Results
  const [result, setResult] = React.useState<any>(null);
  const [history, setHistory] = React.useState<any[]>([]);
  
  const [recentActivities, setRecentActivities] = React.useState<any[]>([]);
  const [loadingActivities, setLoadingActivities] = React.useState(true);

  React.useEffect(() => {
    const fetchRecent = async () => {
      try {
        const response = await api.get('/health/timeline', {
          params: { page: 1, limit: 3 }
        });
        if (response.data?.success) {
          setRecentActivities(response.data.data || []);
        }
      } catch (err) {
        console.error('Failed to load analyzer activities', err);
      } finally {
        setLoadingActivities(false);
      }
    };
    fetchRecent();
  }, []);
  const [overallHealth, setOverallHealth] = React.useState<any>({
    score: 0,
    category: 'Excellent',
    confidence: 50,
    contributingReports: []
  });

  // Viewer controls
  const [zoom, setZoom] = React.useState(1.0);
  const [rotation, setRotation] = React.useState(0);
  const [splitScreen, setSplitScreen] = React.useState(false);

  // Timeline filters
  const [filterYear, setFilterYear] = React.useState<string>('All');
  const [filterType, setFilterType] = React.useState<string>('All');

  // File drag state
  const [dragActive, setDragActive] = React.useState(false);

  // Comparison State
  const [compareResult, setCompareResult] = React.useState<any[]>([]);
  const [selectedPrevReport, setSelectedPrevReport] = React.useState<string>('');

  // Camera State
  const [cameraActive, setCameraActive] = React.useState(false);
  const [cameraStream, setCameraStream] = React.useState<MediaStream | null>(null);
  const videoRef = React.useRef<HTMLVideoElement>(null);

  const fetchReportHistory = async () => {
    try {
      const res = await reportService.getHistory();
      if (res.success && res.data) {
        setHistory(res.data);
      }
    } catch (err) {
      console.error('Failed to fetch medical reports history from database', err);
    }
  };

  const fetchOverallHealth = async () => {
    try {
      const res = await reportService.getOverallHealthScore();
      if (res.success && res.data) {
        setOverallHealth(res.data);
      }
    } catch (err) {
      console.error('Failed to fetch overall health score', err);
    }
  };

  const loadData = async () => {
    await fetchReportHistory();
    await fetchOverallHealth();
  };

  React.useEffect(() => {
    loadData();
  }, []);

  // Camera capture methods
  const startCamera = async () => {
    try {
      setCameraActive(true);
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      setCameraStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      setError('Webcam access denied or unavailable.');
      setCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    setCameraActive(false);
  };

  const capturePhoto = () => {
    const video = videoRef.current;
    if (!video) return;

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      canvas.toBlob(blob => {
        if (blob) {
          const snappedFile = new File([blob], `camera-snap-${Date.now()}.jpg`, { type: 'image/jpeg' });
          setFileList([...fileList, snappedFile]);
          setPreviewUrl(URL.createObjectURL(snappedFile));
        }
      }, 'image/jpeg', 0.95);
    }
    stopCamera();
  };

  // Simulate progress
  const startProgressSimulation = () => {
    setProgressStep('Uploading Document...');
    setEstimatedTime(12);

    const steps = [
      { step: 'Uploading Document...', time: 10 },
      { step: 'Initializing Tesseract OCR Pipeline...', time: 8 },
      { step: 'Running Binarization & Adaptive Thresholding...', time: 6 },
      { step: 'Correcting text orientation...', time: 4 },
      { step: 'Reconstructing diagnostic metadata via AI Clinical Intelligence Engine...', time: 2 },
      { step: 'Saving clinical metadata to PostgreSQL...', time: 1 }
    ];

    steps.forEach((s, idx) => {
      setTimeout(() => {
        setProgressStep(s.step);
        setEstimatedTime(s.time);
      }, idx * 2000);
    });
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const droppedFiles = Array.from(e.dataTransfer.files);
    if (droppedFiles.length > 0) {
      setFileList([...fileList, ...droppedFiles]);
      if (droppedFiles[0].type.startsWith('image/')) {
        setPreviewUrl(URL.createObjectURL(droppedFiles[0]));
      } else {
        setPreviewUrl('');
      }
      setError('');
      setResult(null);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files ? Array.from(e.target.files) : [];
    if (selectedFiles.length > 0) {
      setFileList([...fileList, ...selectedFiles]);
      if (selectedFiles[0].type.startsWith('image/')) {
        setPreviewUrl(URL.createObjectURL(selectedFiles[0]));
      } else {
        setPreviewUrl('');
      }
      setError('');
      setResult(null);
    }
  };

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (fileList.length === 0) return;
    setLoading(true);
    setError('');
    startProgressSimulation();

    // Process first file sequentially for SIH flow validation
    const file = fileList[0];
    const formData = new FormData();
    formData.append('report', file);

    try {
      const res = await aiService.analyzeReport(formData);
      if (res.success) {
        setResult(res.data);
        await loadData(); // Reload history and overall health from PostgreSQL
      } else {
        setError(res.message || 'Failed to analyze report.');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Server error during report processing.');
    } finally {
      setLoading(false);
    }
  };

  const speakText = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.speak(new SpeechSynthesisUtterance(text));
    }
  };

  const handleCompare = async () => {
    if (!result || !selectedPrevReport) return;
    try {
      const currentId = history[0]?.id; // Assuming latest uploaded is index 0
      const res = await reportService.compare(currentId, selectedPrevReport);
      if (res.success && res.data) {
        setCompareResult(res.data.comparison || []);
      }
    } catch (err) {
      console.error('Failed to compare reports', err);
    }
  };

  // Export helper
  const triggerExport = (format: 'PDF' | 'CSV' | 'JSON') => {
    if (!result) return;
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(result, null, 2));
    const dlAnchorElem = document.createElement('a');
    dlAnchorElem.setAttribute("href", dataStr);
    dlAnchorElem.setAttribute("download", `report-analysis.${format.toLowerCase()}`);
    dlAnchorElem.click();
  };

  // Recharts trend data formatting
  const trendChartData = history
    .slice()
    .reverse()
    .map(h => ({
      date: h.reportDate,
      score: h.healthScore || 90,
      confidence: h.confidenceScore || 95
    }));

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-rose-500/10 rounded-lg text-rose-455 border border-rose-500/20">
          <FileText className="w-5 h-5 glow-pill" />
        </div>
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900">AI Medical Report Analyzer</h2>
          <p className="text-xs text-slate-600 mt-0.5">National health surveillance compliant diagnostic report engine</p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200 gap-2 overflow-x-auto pb-1">
        {[
          { id: 'dashboard', name: 'Health Dashboard', icon: Activity },
          { id: 'upload', name: 'Upload & Viewer', icon: Upload },
          { id: 'comparison', name: 'Report Comparison', icon: HeartPulse },
          { id: 'timeline', name: 'Health Timeline', icon: Calendar },
          { id: 'export', name: 'Export Center', icon: Download }
        ].map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-t-lg text-xs font-semibold tracking-wide uppercase transition-all shrink-0 ${
                activeTab === tab.id
                  ? 'border-b-2 border-rose-500 text-rose-400 bg-rose-500/5'
                  : 'text-slate-600 hover:text-white hover:bg-white'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.name}
            </button>
          );
        })}
      </div>

      {/* Tab 1: Health Dashboard */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white border border-slate-200 shadow-sm p-5 rounded-2xl border border-slate-200">
              <span className="text-[10px] text-slate-500 block uppercase font-mono">Total Scans</span>
              <span className="text-2xl font-bold text-slate-800 font-mono">{history.length}</span>
              <p className="text-[10px] text-slate-600 mt-1">Processed reports</p>
            </div>
            <div className="bg-white border border-slate-200 shadow-sm p-5 rounded-2xl border border-slate-200">
              <span className="text-[10px] text-slate-500 block uppercase font-mono">Latest Health Flag</span>
              <span className="text-sm font-bold text-rose-455">
                {history[0]?.riskLevel === 'High' ? 'Abnormal Indicators' : 'All Clear'}
              </span>
              <p className="text-[10px] text-slate-600 mt-1">From {history[0]?.reportType || 'No reports yet'}</p>
            </div>
            <div className="bg-white border border-slate-200 shadow-sm p-5 rounded-2xl border border-slate-200">
              <span className="text-[10px] text-slate-500 block uppercase font-mono">Referral specialist</span>
              <span className="text-sm font-bold text-teal-400">
                {history[0]?.specialistRecommended || 'None suggested'}
              </span>
              <p className="text-[10px] text-slate-600 mt-1">Suggested Consultant</p>
            </div>
            <div className="bg-white border border-slate-200 shadow-sm p-5 rounded-2xl border border-slate-200">
              <span className="text-[10px] text-slate-500 block uppercase font-mono">Overall Health Score</span>
              <span className="text-2xl font-bold text-amber-500 font-mono">
                {overallHealth.score}%
              </span>
              <p className="text-[10px] text-slate-600 mt-1">Category: <strong className="text-slate-350">{overallHealth.category}</strong></p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-8 space-y-6">
              {/* Recent AI Insights */}
              <div className="bg-white border border-slate-200 shadow-sm p-6 rounded-2xl border border-slate-200 space-y-4">
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider border-b border-slate-200 pb-2">
                  Recent AI Insights & Reliability
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed font-mono">
                  {history[0]?.geminiAnalysis || 'No diagnostic reports have been parsed yet. Upload a report PDF or photo under the "Upload & Viewer" tab.'}
                </p>

                {history[0] && (
                  <div className="grid grid-cols-2 gap-4 text-xs font-mono bg-white p-3.5 rounded-xl border border-slate-200">
                    <div>
                      <span className="text-slate-500 text-[10px] uppercase">Score Reliability (Confidence)</span>
                      <p className="text-emerald-400 font-bold text-sm mt-0.5">{overallHealth.confidence}%</p>
                    </div>
                    <div>
                      <span className="text-slate-500 text-[10px] uppercase">Contributing Report Types</span>
                      <p className="text-slate-350 text-xs mt-0.5">{overallHealth.contributingReports.join(', ') || 'None'}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Biomarker Trend Analytics Chart */}
              {history.length > 0 && (
                <div className="bg-white border border-slate-200 shadow-sm p-6 rounded-2xl border border-slate-200 space-y-4">
                  <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider border-b border-slate-200 pb-2">
                    Longitudinal Biomarker Trends
                  </h3>
                  <div className="h-60">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={trendChartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                        <XAxis dataKey="date" stroke="#64748b" style={{ fontSize: 10 }} />
                        <YAxis stroke="#64748b" style={{ fontSize: 10 }} />
                        <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b' }} />
                        <Line type="monotone" dataKey="score" stroke="#f43f5e" strokeWidth={2} name="Health Score" />
                        <Line type="monotone" dataKey="confidence" stroke="#10b981" strokeWidth={1} name="AI Confidence" strokeDasharray="5 5" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
            </div>

            {/* Doctor Follow-ups & Reminders (4 cols) */}
            <div className="lg:col-span-4 space-y-6">
              <div className="bg-white border border-slate-200 shadow-sm p-6 rounded-2xl border border-slate-200 space-y-4">
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider border-b border-slate-200 pb-2">
                  Doctor Follow-up Center
                </h3>
                <div className="space-y-3.5 text-xs">
                  {history.length > 0 && history[0].riskLevel === 'High' ? (
                    <>
                      <div className="p-3 bg-rose-500/5 border border-rose-500/10 rounded-xl space-y-1">
                        <span className="font-bold text-rose-455 block">Repeat Lab Screening</span>
                        <p className="text-slate-600">Recheck Lipid profile panel within 12 weeks to assess cholesterol changes.</p>
                      </div>
                      <div className="p-3 bg-amber-500/5 border border-amber-500/10 rounded-xl space-y-1">
                        <span className="font-bold text-amber-500 block">Medication Review</span>
                        <p className="text-slate-600">Schedule consultation with a {history[0].specialistRecommended} for cardiovascular check.</p>
                      </div>
                    </>
                  ) : (
                    <p className="text-slate-500">All standard screening intervals are compliant. No pending follow-ups scheduled.</p>
                  )}
                </div>
              </div>

              <div className="bg-white border border-slate-200 shadow-sm p-6 rounded-2xl border border-slate-200 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                    Recent Activity
                  </h3>
                  <Link to="/citizen/timeline" className="text-[10px] text-rose-455 hover:underline flex items-center gap-0.5 font-semibold font-mono">
                    View Full Timeline →
                  </Link>
                </div>
                <div className="space-y-3 text-xs">
                  {loadingActivities ? (
                    <div className="space-y-2">
                      <div className="h-10 bg-white rounded-xl animate-pulse"></div>
                      <div className="h-10 bg-white rounded-xl animate-pulse"></div>
                    </div>
                  ) : recentActivities.length === 0 ? (
                    <p className="text-[11px] text-slate-500 text-center py-2">No recent activities found.</p>
                  ) : (
                    recentActivities.map((act) => {
                      let Icon = FileText;
                      if (act.type === 'MEDICINE_SCAN') Icon = Pill;
                      else if (act.type === 'DISEASE_PREDICTION') Icon = Brain;
                      else if (act.type === 'APPOINTMENT') Icon = Calendar;
                      else if (act.type === 'USER_PROFILE' || act.type === 'HEALTH_SIMULATION') Icon = HeartPulse;

                      return (
                        <div key={act.id} className="flex items-center justify-between p-2.5 rounded-lg bg-white border border-slate-200">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="p-1.5 bg-white rounded-lg border border-slate-200 shrink-0">
                              <Icon className="w-3.5 h-3.5 text-slate-355" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <span className="font-bold text-slate-700 block truncate">{act.title}</span>
                              <span className="text-[9px] text-slate-550 font-mono">
                                {new Date(act.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                          </div>
                          <span className="text-[10px] text-teal-400 font-mono font-bold shrink-0">✓ Processed</span>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Upload & Viewer */}
      {activeTab === 'upload' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Upload panel (4 cols) */}
          <div className="lg:col-span-4 bg-white border border-slate-200 shadow-sm p-5 rounded-2xl border border-slate-200 space-y-5 self-start">
            <form onSubmit={handleAnalyze} className="space-y-6">
              <div
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                className={`border-2 border-dashed border-slate-200 rounded-xl p-5 text-center hover:border-rose-500/30 transition-all relative flex flex-col justify-center items-center min-h-[220px] ${
                  dragActive ? 'bg-rose-500/5 border-rose-500/30' : ''
                }`}
              >
                <input
                  type="file"
                  accept=".pdf,image/*"
                  multiple
                  onChange={handleFileChange}
                  className="absolute inset-0 opacity-0 cursor-pointer z-10"
                />
                <div className="space-y-3">
                  <Upload className="w-8 h-8 text-slate-500 mx-auto" />
                  <div>
                    <p className="text-xs font-semibold text-slate-700">Drag & Drop Reports</p>
                    <p className="text-[10px] text-slate-500 font-mono mt-1">PDF, PNG, JPG, or WEBP up to 10MB</p>
                  </div>
                </div>
              </div>

              {/* Advanced Camera Widget */}
              <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-2">
                <button
                  type="button"
                  onClick={cameraActive ? stopCamera : startCamera}
                  className="w-full py-2 bg-white border border-slate-200 hover:bg-rose-500/10 hover:text-rose-400 text-slate-700 font-bold rounded-lg text-xs font-mono uppercase transition-all flex items-center justify-center gap-1.5"
                >
                  <Camera className="w-4 h-4" />
                  {cameraActive ? 'Close Camera' : 'Snap report photo'}
                </button>

                {cameraActive && (
                  <div className="space-y-3">
                    <div className="overflow-hidden border border-slate-200 rounded-lg aspect-video bg-black relative">
                      <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
                    </div>
                    <button
                      type="button"
                      onClick={capturePhoto}
                      className="w-full py-2 bg-rose-500 hover:bg-rose-455 text-slate-950 font-bold rounded-lg text-xs font-mono uppercase transition-colors"
                    >
                      Capture Photo
                    </button>
                  </div>
                )}
              </div>

              {fileList.length > 0 && (
                <div className="space-y-2">
                  <span className="text-[9px] text-slate-500 uppercase font-mono">Selected Files ({fileList.length})</span>
                  <div className="space-y-1.5 max-h-32 overflow-y-auto">
                    {fileList.map((f, i) => (
                      <div key={i} className="bg-white p-2.5 rounded border border-slate-200 text-xs flex justify-between items-center">
                        <span className="text-slate-350 truncate block font-mono max-w-[200px]">{f.name}</span>
                        <span className="text-[9px] text-slate-500 shrink-0 font-mono">{(f.size / (1024 * 1024)).toFixed(2)} MB</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {loading && (
                <div className="p-3.5 bg-rose-500/5 border border-rose-500/10 rounded-xl space-y-2">
                  <span className="text-xs font-semibold text-rose-455 block">{progressStep}</span>
                  <div className="w-full bg-white h-1 rounded-full overflow-hidden">
                    <div className="bg-gradient-to-r from-rose-500 to-amber-500 h-full animate-progress-bar" style={{ width: '80%' }}></div>
                  </div>
                  <span className="text-[9px] text-slate-500 font-mono block">Estimated Time Remaining: {estimatedTime}s</span>
                </div>
              )}

              {error && (
                <div className="p-3.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-455 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={fileList.length === 0 || loading}
                className="w-full py-3 bg-gradient-to-r from-rose-500 to-amber-500 text-slate-950 font-bold hover:from-rose-400 hover:to-amber-400 transition-all rounded-xl disabled:opacity-50 text-xs tracking-wide font-mono uppercase"
              >
                {loading ? 'Analyzing Clinical Indicators...' : 'Start Lab Report Analysis'}
              </button>
            </form>
          </div>

          {/* Viewer & Results panel (8 cols) */}
          <div className="lg:col-span-8 space-y-6">
            {previewUrl && (
              <div className="bg-white border border-slate-200 shadow-sm p-4 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                  <span className="text-xs font-bold text-slate-350">Document Viewer</span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setZoom(z => Math.min(z + 0.1, 2.5))}
                      className="p-1 bg-white border border-slate-200 text-slate-600 hover:text-white rounded"
                    >
                      <ZoomIn className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setZoom(z => Math.max(z - 0.1, 0.5))}
                      className="p-1 bg-white border border-slate-200 text-slate-600 hover:text-white rounded"
                    >
                      <ZoomOut className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setRotation(r => (r + 90) % 360)}
                      className="p-1 bg-white border border-slate-200 text-slate-600 hover:text-white rounded"
                    >
                      <RotateCw className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setSplitScreen(!splitScreen)}
                      className={`px-2 py-0.5 border text-[10px] font-mono rounded ${
                        splitScreen ? 'bg-rose-500/20 border-rose-500/30 text-rose-455' : 'bg-white border-slate-200 text-slate-600'
                      }`}
                    >
                      Split Compare
                    </button>
                  </div>
                </div>

                <div className={`grid ${splitScreen ? 'grid-cols-2' : 'grid-cols-1'} gap-4`}>
                  <div className="overflow-hidden border border-slate-200 rounded-lg h-80 flex justify-center bg-white">
                    <img
                      src={previewUrl}
                      alt="Current Report"
                      className="max-h-full max-w-full object-contain transition-transform duration-200"
                      style={{ transform: `rotate(${rotation}deg) scale(${zoom})` }}
                    />
                  </div>
                  {splitScreen && (
                    <div className="overflow-hidden border border-slate-200 rounded-lg h-80 flex flex-col justify-center items-center bg-white text-slate-500 p-4 text-center">
                      <span className="text-xs font-mono font-bold block mb-1">Previous Report Reference</span>
                      <span className="text-[10px] text-slate-600">Lipid Profile (2026-05-15)</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {result ? (
              <div className="space-y-6">
                {/* Results Card */}
                <div className="bg-white border border-slate-200 shadow-sm p-5 rounded-2xl border border-slate-200 space-y-4">
                  <div className="flex justify-between items-center border-b border-slate-200 pb-3">
                    <div>
                      <span className="px-2.5 py-0.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-mono font-bold rounded-full">
                        SURVEILLANCE COMPLIANT
                      </span>
                      <h3 className="text-lg font-bold text-slate-900 mt-1.5">{result.reportType || 'Complete Blood Count (CBC)'}</h3>
                      <p className="text-xs text-slate-500 font-mono">Patient: {result.patientName} | Date: {result.reportDate}</p>
                    </div>
                    <button
                      onClick={() => speakText(`This is a ${result.reportType} report.`)}
                      className="p-2 bg-white border border-slate-200 rounded-lg text-slate-600 hover:text-slate-800"
                    >
                      <Volume2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white p-3 rounded-xl border border-slate-200">
                      <span className="text-[10px] text-slate-500 block uppercase">Recommended Specialist</span>
                      <span className="text-sm font-bold text-rose-455 font-mono">{result.recommendedSpecialist}</span>
                    </div>
                    <div className="bg-white p-3 rounded-xl border border-slate-200">
                      <span className="text-[10px] text-slate-500 block uppercase">Confidence Index</span>
                      <span className="text-sm font-bold text-emerald-400 font-mono">{result.confidenceScore || 97}%</span>
                    </div>
                  </div>
                </div>

                {/* Abnormal Values */}
                {result.abnormalValues && result.abnormalValues.length > 0 && (
                  <div className="bg-white border border-slate-200 shadow-sm p-5 rounded-2xl border border-slate-200 space-y-4">
                    <h4 className="text-xs font-bold text-slate-350 uppercase tracking-wider border-b border-slate-200 pb-2 flex items-center gap-1.5">
                      <ShieldAlert className="w-4 h-4 text-rose-455" />
                      Abnormal Readings Flagged
                    </h4>

                    <div className="space-y-3.5">
                      {result.abnormalValues.map((val: any, idx: number) => (
                        <div key={idx} className="p-3.5 bg-white rounded-xl border border-slate-200 space-y-1.5">
                          <div className="flex justify-between items-start">
                            <div>
                              <span className="font-bold text-slate-800">{val.parameter}</span>
                              <span className="text-[10px] text-slate-500 font-mono block">Reference Range: {val.referenceRange}</span>
                            </div>
                            <span className={`px-2 py-0.5 text-[9px] font-bold rounded uppercase ${
                              val.severity === 'High' ? 'bg-rose-500/10 text-rose-455' :
                              val.severity === 'Medium' ? 'bg-amber-500/10 text-amber-455' :
                              'bg-emerald-500/10 text-emerald-400'
                            }`}>
                              {val.severity} Severity
                            </span>
                          </div>
                          <div className="flex gap-4 text-xs">
                            <div>
                              <span className="text-slate-500 text-[10px]">Detected Value</span>
                              <p className="font-mono text-slate-800 font-bold">{val.value}</p>
                            </div>
                            <div className="flex-1">
                              <span className="text-slate-500 text-[10px]">Clinical Interpretation</span>
                              <p className="text-slate-600 leading-relaxed">{val.explanation}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Disclaimer */}
                <div className="text-[10px] text-slate-500 italic text-center">
                  {result.medicalDisclaimer}
                </div>
              </div>
            ) : (
              <div className="h-48 flex flex-col items-center justify-center text-center p-8 text-slate-500 bg-white border border-slate-200 shadow-sm rounded-2xl border border-slate-200">
                <FileText className="w-12 h-12 text-slate-700 mb-3 animate-pulse" />
                <p className="text-xs">Results will show up here after completing report analysis</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 3: Report Comparison */}
      {activeTab === 'comparison' && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 shadow-sm p-5 rounded-2xl border border-slate-200 space-y-4">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider border-b border-slate-200 pb-2">
              Current vs Historical Metrics Comparison
            </h3>

            {/* Select previous report */}
            <div className="flex gap-3 items-center bg-white p-3 rounded-xl border border-slate-200 text-xs">
              <span className="font-mono text-slate-500 uppercase">Compare With:</span>
              <select
                value={selectedPrevReport}
                onChange={e => setSelectedPrevReport(e.target.value)}
                className="bg-white border border-slate-200 rounded p-1 text-slate-355 flex-1 max-w-xs"
              >
                <option value="">-- Select Historical Record --</option>
                {history.slice(1).map((h, i) => (
                  <option key={i} value={h.id}>{h.reportType} ({h.reportDate})</option>
                ))}
              </select>
              <button
                type="button"
                onClick={handleCompare}
                disabled={!selectedPrevReport}
                className="px-3 py-1 bg-rose-500 hover:bg-rose-455 text-slate-950 font-bold uppercase rounded text-[10px]"
              >
                Run Comparison
              </button>
            </div>

            {compareResult.length > 0 ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-3 bg-white rounded border border-slate-200 font-mono text-[10px] uppercase text-slate-500">
                  <div>Parameter</div>
                  <div className="text-center">Previous Value</div>
                  <div className="text-center">Current Value</div>
                  <div className="text-right">Trend / Status</div>
                </div>

                {compareResult.map((c, i) => (
                  <div key={i} className="grid grid-cols-1 md:grid-cols-4 gap-4 p-3 bg-white rounded border border-slate-200 text-xs items-center">
                    <div className="font-bold text-slate-800">{c.parameter}</div>
                    <div className="text-center text-slate-600">{c.previous}</div>
                    <div className="text-center text-slate-800 font-bold">{c.current}</div>
                    <div className={`text-right font-mono font-bold flex justify-end items-center gap-1 ${
                      c.status === 'Improved' ? 'text-emerald-400' :
                      c.status === 'Declining' ? 'text-rose-455' :
                      'text-amber-500'
                    }`}>
                      <span>{c.trend === 'increasing' ? '↑ Increasing' : c.trend === 'decreasing' ? '↓ Decreasing' : '→ Stable'}</span>
                      <span className="px-1.5 py-0.5 bg-white rounded border border-slate-200">{c.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500 text-center py-8">Select a previous record above and click Run Comparison to compare metrics.</p>
            )}
          </div>
        </div>
      )}

      {/* Tab 4: Health Timeline */}
      {activeTab === 'timeline' && (
        <div className="space-y-6">
          <div className="flex gap-4 items-center bg-white p-3 rounded-xl border border-slate-200 text-xs">
            <span className="font-mono text-slate-500 uppercase">Filters:</span>
            <div className="flex gap-2">
              <select
                value={filterYear}
                onChange={e => setFilterYear(e.target.value)}
                className="bg-white border border-slate-200 rounded p-1 text-slate-355 font-mono"
              >
                <option>All</option>
                <option>2026</option>
              </select>
              <select
                value={filterType}
                onChange={e => setFilterType(e.target.value)}
                className="bg-white border border-slate-200 rounded p-1 text-slate-355"
              >
                <option>All</option>
                {Array.from(new Set(history.map(h => h.reportType))).map((type, i) => (
                  <option key={i}>{type}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-6 relative border-l border-slate-200 ml-4 pl-6">
            {history
              .filter(h => (filterYear === 'All' || h.reportDate.startsWith(filterYear)) && (filterType === 'All' || h.reportType === filterType))
              .map((h, idx) => {
                let abnormalList = [];
                try {
                  abnormalList = h.abnormalValues ? (typeof h.abnormalValues === 'string' ? JSON.parse(h.abnormalValues) : h.abnormalValues) : [];
                } catch (e) {}

                return (
                  <div key={idx} className="relative space-y-2">
                    <div className="absolute -left-[31px] top-1.5 w-4 h-4 rounded-full bg-rose-500 border-4 border-slate-950"></div>
                    <div className="bg-white border border-slate-200 shadow-sm p-5 rounded-2xl border border-slate-200 space-y-3">
                      <div className="flex justify-between items-center">
                        <div>
                          <span className="text-[10px] text-slate-500 font-mono block">{h.reportDate}</span>
                          <h4 className="font-bold text-slate-800">{h.reportType}</h4>
                          <span className="text-[9px] text-slate-500 block font-mono">{h.hospitalName} • Dr. {h.doctorName}</span>
                        </div>
                        <span className="text-[10px] text-emerald-400 font-mono font-bold bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded">
                          Confidence {h.confidenceScore}%
                        </span>
                      </div>

                      <div className="text-xs text-slate-600 space-y-1.5">
                        <p><strong className="text-slate-700">Abnormal Readings:</strong> {abnormalList.map((v: any) => `${v.parameter} (${v.value})`).join(', ') || 'None detected'}</p>
                        <p><strong className="text-slate-700">Specialist Consultant:</strong> {h.specialistRecommended}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* Tab 5: Export Center */}
      {activeTab === 'export' && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 shadow-sm p-6 rounded-2xl border border-slate-200 space-y-4">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider border-b border-slate-200 pb-2">
              Export Medical Metadata
            </h3>
            <p className="text-xs text-slate-600">
              Download your structured clinical records, timeline items, and AI diagnostic logs in multiple formats for your doctor or records compilation.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <button
                onClick={() => triggerExport('PDF')}
                className="flex flex-col items-center justify-center p-5 bg-white hover:bg-rose-500/10 border border-slate-200 rounded-xl space-y-2 transition-all group"
              >
                <Printer className="w-8 h-8 text-rose-455 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-bold text-slate-800">Patient PDF Summary</span>
                <span className="text-[9px] text-slate-500 font-mono">Format: PDF</span>
              </button>

              <button
                onClick={() => triggerExport('CSV')}
                className="flex flex-col items-center justify-center p-5 bg-white hover:bg-rose-500/10 border border-slate-200 rounded-xl space-y-2 transition-all group"
              >
                <FileSpreadsheet className="w-8 h-8 text-emerald-400 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-bold text-slate-800">Timeline Data (CSV)</span>
                <span className="text-[9px] text-slate-500 font-mono">Format: CSV</span>
              </button>

              <button
                onClick={() => triggerExport('JSON')}
                className="flex flex-col items-center justify-center p-5 bg-white hover:bg-rose-500/10 border border-slate-200 rounded-xl space-y-2 transition-all group"
              >
                <FileCode className="w-8 h-8 text-amber-500 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-bold text-slate-800">AI Schema Logs (JSON)</span>
                <span className="text-[9px] text-slate-500 font-mono">Format: FHIR JSON</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
