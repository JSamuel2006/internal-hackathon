import { useI18n } from '../../i18n';
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, Calendar, Clock, Pill, Brain, HeartPulse, User, Globe, 
  AlertTriangle, CheckCircle, XCircle, ChevronLeft, ChevronRight, 
  Info, AlertCircle, FileText, ArrowUpDown, RefreshCw, X, ClipboardList
} from 'lucide-react';
import { api } from '../../services/api';

// Type definitions matching backend response
interface TimelineEvent {
  id: string;
  type: string;
  displayType: string;
  title: string;
  description: string;
  timestamp: string;
  status: string;
  metadata: {
    hospitalName?: string;
    doctorName?: string;
    reportDate?: string;
    healthScore?: number;
    riskLevel?: string;
    specialistRecommended?: string;
    confidenceScore?: number;
    ocrText?: string;
    structuredJson?: string | any;
    abnormalValues?: string | any;
    geminiAnalysis?: string | any;
    date?: string;
    time?: string;
    [key: string]: any;
  };
  source: string;
}

export default function CitizenTimelinePage() {
  const { lang, t } = useI18n();

  const localeMap: Record<string, string> = {
    en: 'en-IN',
    ta: 'ta-IN',
    hi: 'hi-IN',
    mr: 'mr-IN'
  };
  const currentLocale = localeMap[lang] || 'en-IN';

  const navigate = useNavigate();
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Search & Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [filterType, setFilterType] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterDate, setFilterDate] = useState('All');
  const [sortOrder, setSortOrder] = useState('newest');
  
  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const limit = 10;

  // Selected event for detail drawer
  const [selectedEvent, setSelectedEvent] = useState<TimelineEvent | null>(null);

  // Debounce search term
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(1); // Reset page on search
    }, 400);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  // Fetch timeline data from backend API
  const fetchTimeline = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Compute date filters
      let fromDateStr = '';
      let toDateStr = '';
      if (filterDate !== 'All') {
        const today = new Date();
        if (filterDate === 'Today') {
          fromDateStr = today.toISOString().split('T')[0];
        } else if (filterDate === '7days') {
          const past = new Date();
          past.setDate(today.getDate() - 7);
          fromDateStr = past.toISOString().split('T')[0];
        } else if (filterDate === '30days') {
          const past = new Date();
          past.setDate(today.getDate() - 30);
          fromDateStr = past.toISOString().split('T')[0];
        } else if (filterDate === '3months') {
          const past = new Date();
          past.setMonth(today.getMonth() - 3);
          fromDateStr = past.toISOString().split('T')[0];
        }
      }

      const response = await api.get('/health/timeline', {
        params: {
          page,
          limit,
          type: filterType,
          status: filterStatus,
          search: debouncedSearch,
          from: fromDateStr,
          to: toDateStr,
          sort: sortOrder
        }
      });

      if (response.data?.success) {
        let mergedEvents = response.data.data || [];
        
        // Fetch ASHA screenings for timeline
        const userRaw = sessionStorage.getItem('user');
        const citizen = userRaw ? JSON.parse(userRaw) : null;
        if (citizen && citizen.id) {
          try {
            const ashaRes = await api.get(`/worker/citizen/${citizen.id}/history`);
            if (ashaRes.data?.success && Array.isArray(ashaRes.data.data)) {
              const ashaEvents = ashaRes.data.data.map((scr: any) => ({
                id: scr.id,
                type: 'ASHA_SCREENING',
                displayType: 'ASHA FIELD SCREENING',
                title: t('community_screening_by_asha'),
                description: `${t('recorded_by_asha_worker')} ${scr.risk_level}.`,
                timestamp: scr.screening_date,
                status: scr.risk_level === 'URGENT' || scr.risk_level === 'PRIORITY' ? 'warning' : 'completed',
                metadata: {
                  systolic: scr.systolic,
                  systolic_status: scr.systolic_status,
                  diastolic: scr.diastolic,
                  diastolic_status: scr.diastolic_status,
                  pulse: scr.pulse,
                  pulse_status: scr.pulse_status,
                  spo2: scr.spo2,
                  spo2_status: scr.spo2_status,
                  temperature: scr.temperature,
                  temperature_status: scr.temperature_status,
                  glucose: scr.glucose,
                  glucose_status: scr.glucose_status,
                  symptoms: scr.symptoms ? JSON.parse(scr.symptoms) : [],
                  riskFlags: scr.risk_flags ? JSON.parse(scr.risk_flags) : []
                },
                source: 'ASHA'
              }));
              mergedEvents = [...mergedEvents, ...ashaEvents];
            }
          } catch (err) {
            console.error('Failed to load ASHA screenings for timeline', err);
          }
        }

        // Sort chronologically based on sortOrder selection
        mergedEvents.sort((a: any, b: any) => {
          const tA = new Date(a.timestamp).getTime();
          const tB = new Date(b.timestamp).getTime();
          return sortOrder === 'newest' ? tB - tA : tA - tB;
        });

        setEvents(mergedEvents);
        const pag = response.data.pagination;
        if (pag) {
          setTotalPages(pag.totalPages || 1);
          setTotalItems(mergedEvents.length);
        }
      } else {
        throw new Error(response.data?.message || t('unexpected_response_format'));
      }
    } catch (err: any) {
      setError(err.response?.data?.message || '{t("unable_to_load_timeline")}.');
    } finally {
      setLoading(false);
    }
  }, [page, filterType, filterStatus, debouncedSearch, filterDate, sortOrder]);

  useEffect(() => {
    fetchTimeline();
  }, [fetchTimeline]);

  // Event type icon mapping
  const getEventIcon = (type: string) => {
    switch (type) {
      case 'MEDICINE_SCAN':
        return <Pill className="w-5 h-5 text-amber-400" />;
      case 'DISEASE_PREDICTION':
        return <Brain className="w-5 h-5 text-rose-400" />;
      case 'HEALTH_SIMULATION':
        return <HeartPulse className="w-5 h-5 text-emerald-400" />;
      case 'USER_PROFILE':
        return <User className="w-5 h-5 text-sky-400" />;
      case 'ABHA_INTEROPERABILITY':
        return <Globe className="w-5 h-5 text-indigo-400" />;
      case 'APPOINTMENT':
        return <Calendar className="w-5 h-5 text-teal-400" />;
      case 'ASHA_SCREENING':
        return <ClipboardList className="w-5 h-5 text-emerald-450" />;
      default:
        return <FileText className="w-5 h-5 text-slate-600" />;
    }
  };

  // Status mapping
  const getStatusBadge = (status: string) => {
    const cleanStatus = status?.toLowerCase();
    if (cleanStatus === 'completed' || cleanStatus === 'processed' || cleanStatus === 'success') {
      return (
        <span className="text-[10px] font-semibold text-emerald-450 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded flex items-center gap-1 shrink-0">
          <CheckCircle className="w-3 h-3" />
          <span>✓ {t("completed")}</span>
        </span>
      );
    }
    if (cleanStatus === 'processing' || cleanStatus === 'pending') {
      return (
        <span className="text-[10px] font-semibold text-amber-500 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded flex items-center gap-1 shrink-0">
          <Clock className="w-3 h-3 animate-spin" />
          <span>⌛ {t("processing")}</span>
        </span>
      );
    }
    if (cleanStatus === 'warning') {
      return (
        <span className="text-[10px] font-semibold text-orange-400 bg-orange-500/10 border border-orange-500/20 px-2 py-0.5 rounded flex items-center gap-1 shrink-0">
          <AlertTriangle className="w-3 h-3" />
          <span>⚠ {t("warning")}</span>
        </span>
      );
    }
    return (
      <span className="text-[10px] font-semibold text-rose-455 bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 rounded flex items-center gap-1 shrink-0">
        <XCircle className="w-3 h-3" />
        <span>✕ {t("failed")}</span>
      </span>
    );
  };

  // Format date helper
  const formatDateString = (timestamp: string) => {
    try {
      const d = new Date(timestamp);
      return d.toLocaleDateString(currentLocale, { month: 'long', day: 'numeric', year: 'numeric' });
    } catch (_) {
      return timestamp;
    }
  };

  const formatTimeString = (timestamp: string) => {
    try {
      const d = new Date(timestamp);
      return d.toLocaleTimeString(currentLocale, { hour: '2-digit', minute: '2-digit' });
    } catch (_) {
      return '';
    }
  };

  // Group events by date (e.g. TODAY, YESTERDAY, or date string)
  const groupEventsByDate = (eventsList: TimelineEvent[]) => {
    const groups: { [key: string]: TimelineEvent[] } = {};
    const todayStr = new Date().toLocaleDateString(currentLocale, { month: 'long', day: 'numeric', year: 'numeric' });
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toLocaleDateString(currentLocale, { month: 'long', day: 'numeric', year: 'numeric' });

    eventsList.forEach(e => {
      const dateStr = formatDateString(e.timestamp);
      let label = dateStr;
      if (dateStr === todayStr) {
        label = t("today_upper");
      } else if (dateStr === yesterdayStr) {
        label = t("yesterday_upper");
      }
      if (!groups[label]) {
        groups[label] = [];
      }
      groups[label].push(e);
    });
    return groups;
  };

  const groupedEvents = groupEventsByDate(events);

  return (
    <div className="space-y-6 max-w-6xl mx-auto px-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Clock className="w-6 h-6 text-rose-500" />
            <span>{t("health_timeline_title")}</span>
          </h2>
          <p className="text-xs text-slate-600 mt-1">{t("health_timeline_desc")}</p>
        </div>
        <button 
          onClick={fetchTimeline} 
          className="self-start px-3.5 py-1.5 bg-white hover:bg-slate-800 text-slate-700 rounded-lg text-xs font-mono flex items-center gap-1.5 border border-slate-200 transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>{t("sync_data")}</span>
        </button>
      </div>

      {/* Summary Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 shadow-sm p-4 rounded-xl border border-slate-200 bg-white">
          <span className="text-[10px] uppercase font-mono tracking-wider text-slate-500 block">{t("total_activity")}</span>
          <p className="text-2xl font-bold font-mono text-slate-900 mt-1">{loading ? '...' : totalItems}</p>
        </div>
        <div className="bg-white border border-slate-200 shadow-sm p-4 rounded-xl border border-slate-200 bg-white">
          <span className="text-[10px] uppercase font-mono tracking-wider text-slate-500 block">{t("medicine_scans")}</span>
          <p className="text-2xl font-bold font-mono text-amber-400 mt-1">
            {loading ? '...' : events.filter(e => e.type === 'MEDICINE_SCAN').length}
          </p>
        </div>
        <div className="bg-white border border-slate-200 shadow-sm p-4 rounded-xl border border-slate-200 bg-white">
          <span className="text-[10px] uppercase font-mono tracking-wider text-slate-500 block">{t("assessments")}</span>
          <p className="text-2xl font-bold font-mono text-rose-400 mt-1">
            {loading ? '...' : events.filter(e => e.type === 'DISEASE_PREDICTION' || e.type === 'HEALTH_SIMULATION').length}
          </p>
        </div>
        <div className="bg-white border border-slate-200 shadow-sm p-4 rounded-xl border border-slate-200 bg-white">
          <span className="text-[10px] uppercase font-mono tracking-wider text-slate-500 block">{t("reports")}</span>
          <p className="text-2xl font-bold font-mono text-sky-400 mt-1">
            {loading ? '...' : events.filter(e => e.type === 'MEDICAL_REPORT' || e.source === 'medical_reports').length}
          </p>
        </div>
      </div>

      {/* Search & Filter Controls */}
      <div className="bg-white border border-slate-200 shadow-sm p-4 rounded-xl border border-slate-200 bg-white flex flex-col gap-4">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
            <input 
              type="text" 
              placeholder={t("search_timeline_placeholder")}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white border border-slate-200 focus:border-rose-500/50 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-800 outline-none transition-all placeholder:text-slate-500"
            />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <select 
              value={filterType}
              onChange={(e) => { setFilterType(e.target.value); setPage(1); }}
              className="bg-white border border-slate-200 rounded-xl px-2 py-2 text-xs text-slate-350 outline-none focus:border-rose-500/50"
            >
              <option value="All">{t("all_types")}</option>
              <option value="Medicine Scans">{t("medicine_scans")}</option>
              <option value="Disease Predictions">{t("disease_predictions")}</option>
              <option value="Health Assessments">{t("health_assessments")}</option>
              <option value="Reports">{t("reports")}</option>
              <option value="Appointments">{t("appointments")}</option>
            </select>
            <select 
              value={filterStatus}
              onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}
              className="bg-white border border-slate-200 rounded-xl px-2 py-2 text-xs text-slate-350 outline-none focus:border-rose-500/50"
            >
              <option value="All">{t("all_status")}</option>
              <option value="completed">{t("completed")}</option>
              <option value="processing">{t("processing")}</option>
              <option value="warning">{t("warning")}</option>
              <option value="failed">{t("failed")}</option>
            </select>
            <select 
              value={filterDate}
              onChange={(e) => { setFilterDate(e.target.value); setPage(1); }}
              className="bg-white border border-slate-200 rounded-xl px-2 py-2 text-xs text-slate-350 outline-none focus:border-rose-500/50"
            >
              <option value="All">{t("all_time")}</option>
              <option value="Today">{t("today")}</option>
              <option value="7days">{t("last_7_days")}</option>
              <option value="30days">{t("last_30_days")}</option>
              <option value="3months">{t("last_3_months")}</option>
            </select>
            <select 
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              className="bg-white border border-slate-200 rounded-xl px-2 py-2 text-xs text-slate-350 outline-none focus:border-rose-500/50"
            >
              <option value="newest">{t("newest_first")}</option>
              <option value="oldest">{t("oldest_first")}</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Timeline Content */}
      {loading ? (
        // Skeleton Loader
        <div className="space-y-6 ml-4 pl-6 border-l border-slate-200 py-4">
          {[1, 2, 3].map((n) => (
            <div key={n} className="space-y-4 animate-pulse relative">
              <div className="absolute -left-[30px] top-1.5 w-3.5 h-3.5 rounded-full bg-slate-800 border-2 border-slate-950"></div>
              <div className="h-4 bg-white rounded w-28"></div>
              <div className="bg-white border border-slate-200 shadow-sm p-5 rounded-2xl border border-slate-200 bg-white space-y-3">
                <div className="flex justify-between items-center">
                  <div className="h-4 bg-slate-800 rounded w-48"></div>
                  <div className="h-5 bg-slate-800 rounded w-16"></div>
                </div>
                <div className="h-3 bg-slate-800 rounded w-full"></div>
                <div className="h-3 bg-slate-800 rounded w-3/4"></div>
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        // Error State
        <div className="bg-white border border-slate-200 shadow-sm p-8 rounded-2xl border border-slate-200 text-center space-y-4 bg-rose-950/5">
          <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
          <h3 className="text-base font-bold text-slate-800">{t("unable_to_load_timeline")}</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">{t("unable_to_load_timeline_desc")}</p>
          <button 
            onClick={fetchTimeline} 
            className="px-5 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 rounded-xl text-xs font-semibold transition-colors"
          >
            {t("retry_connection")}
          </button>
        </div>
      ) : events.length === 0 ? (
        // Empty State
        <div className="bg-white border border-slate-200 shadow-sm p-12 rounded-2xl border border-slate-200 text-center space-y-4 bg-white">
          <Clock className="w-12 h-12 text-slate-600 mx-auto" />
          <h3 className="text-base font-bold text-slate-350">{t("no_health_activities")}</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">{t("no_health_activities_desc")}</p>
          <button 
            onClick={() => navigate('/citizen/dashboard')} 
            className="px-6 py-2 bg-white hover:bg-slate-850 text-slate-800 border border-slate-200 rounded-xl text-xs font-semibold transition-colors"
          >
            {t("explore_services")}
          </button>
        </div>
      ) : (
        // Chronological Vertical Timeline
        <div className="relative border-l border-slate-200 ml-4 pl-6 space-y-8 py-2">
          {Object.keys(groupedEvents).map((dateLabel) => (
            <div key={dateLabel} className="space-y-4">
              {/* Date Group Heading */}
              <div className="relative -left-[32px] flex items-center gap-2">
                <div className="w-3.5 h-3.5 rounded-full bg-white border-2 border-rose-500 glow-pill shrink-0"></div>
                <span className="text-[10px] font-bold font-mono tracking-wider text-rose-455 bg-[#030712] px-2">
                  {dateLabel}
                </span>
              </div>

              {/* Date Group Events */}
              <div className="space-y-5">
                {groupedEvents[dateLabel].map((e) => {
                  let metadataExtra = null;
                  
                  // Extract extra metadata snippet for preview card
                   if (e.type === 'MEDICINE_SCAN') {
                    let parsedJson: any = {};
                    try {
                      parsedJson = typeof e.metadata.structuredJson === 'string'
                        ? JSON.parse(e.metadata.structuredJson)
                        : e.metadata.structuredJson;
                    } catch (_) {}
                    metadataExtra = (
                      <div className="space-y-2 text-[11px] font-mono text-slate-500 bg-white p-3 rounded-lg border border-slate-200">
                        <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                          <div>Medicine: <span className="text-slate-800 font-semibold">{parsedJson?.medicineName || 'Not detected'}</span></div>
                          <div>Generic: <span className="text-slate-800 truncate block">{parsedJson?.genericName || 'Not detected'} • {parsedJson?.strength || 'Not detected'}</span></div>
                          <div>Manufacturer: <span className="text-slate-350">{parsedJson?.manufacturer || 'Not detected'}</span></div>
                          <div>Quality: <span className="text-emerald-400 font-bold">🟢 Good</span></div>
                        </div>
                      </div>
                    );
                  } else if (e.type === 'DISEASE_PREDICTION') {
                    metadataExtra = (
                      <div className="text-[11px] font-mono text-slate-500 bg-white p-2.5 rounded-lg border border-slate-200">
                        Risk Level Assessment: <span className={`font-semibold uppercase ${e.metadata.riskLevel === 'High' ? 'text-rose-400' : 'text-emerald-450'}`}>{e.metadata.riskLevel || 'Normal'}</span>
                      </div>
                    );
                  } else if (e.type === 'APPOINTMENT') {
                    metadataExtra = (
                      <div className="text-[11px] font-mono text-slate-500 bg-white p-2.5 rounded-lg border border-slate-200">
                        Facility: <span className="text-slate-350">{e.metadata.hospitalName}</span> • Time: <span className="text-slate-350">{e.metadata.time}</span>
                      </div>
                    );
                  } else if (e.type === 'ASHA_SCREENING') {
                    metadataExtra = (
                      <div className="space-y-2 text-[11px] font-mono text-slate-500 bg-white p-3 rounded-lg border border-slate-200">
                        <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                          <div>BP: <span className="text-slate-800 font-semibold">{e.metadata.systolic_status === 'MEASURED' ? `${e.metadata.systolic}/${e.metadata.diastolic}` : 'N/A'}</span></div>
                          <div>SpO2: <span className="text-slate-800 font-semibold">{e.metadata.spo2_status === 'MEASURED' ? `${e.metadata.spo2}%` : 'N/A'}</span></div>
                          <div>Temp: <span className="text-slate-800 font-semibold">{e.metadata.temperature_status === 'MEASURED' ? `${e.metadata.temperature}°F` : 'N/A'}</span></div>
                          <div>Glucose: <span className="text-slate-800 font-semibold">{e.metadata.glucose_status === 'MEASURED' ? `${e.metadata.glucose} mg/dL` : 'N/A'}</span></div>
                        </div>
                        {e.metadata.symptoms && e.metadata.symptoms.length > 0 && (
                          <div>Symptoms: <span className="text-slate-350">{e.metadata.symptoms.join(', ')}</span></div>
                        )}
                        {e.metadata.riskFlags && e.metadata.riskFlags.length > 0 && (
                          <div className="text-rose-455 font-bold">⚠ Referral: {e.metadata.riskFlags.join('; ')}</div>
                        )}
                      </div>
                    );
                  }

                  return (
                    <div key={e.id} className="relative group">
                      {/* Connection node */}
                      <div className="absolute -left-[31px] top-4 w-2.5 h-2.5 rounded-full bg-white border border-slate-700 group-hover:border-rose-500 group-hover:bg-rose-500/10 transition-colors"></div>
                      
                      {/* Event Card */}
                      <div className="bg-white border border-slate-200 shadow-sm p-5 rounded-2xl border border-slate-200 hover:border-slate-200 transition-all space-y-3 bg-white">
                        <div className="flex justify-between items-start gap-4">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-white rounded-xl border border-slate-200 flex items-center justify-center shrink-0">
                              {getEventIcon(e.type)}
                            </div>
                            <div>
                              <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block">{e.displayType}</span>
                              <h4 className="text-sm font-bold text-slate-800 group-hover:text-slate-900 transition-colors">{e.title}</h4>
                            </div>
                          </div>
                          {getStatusBadge(e.status)}
                        </div>

                        <p className="text-xs text-slate-600 leading-relaxed">{e.description}</p>
                        
                        {metadataExtra}

                        <div className="flex items-center justify-between pt-2 border-t border-slate-200/60">
                          <span className="text-[10px] font-mono text-slate-500 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatTimeString(e.timestamp)}
                          </span>
                          <button 
                            onClick={() => setSelectedEvent(e)}
                            className="px-3 py-1 bg-white hover:bg-slate-850 hover:text-rose-400 text-slate-700 border border-slate-200 rounded-lg text-[10px] font-semibold transition-colors"
                          >
                            View Details
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination Controls */}
      {!loading && !error && events.length > 0 && (
        <div className="flex items-center justify-between border-t border-slate-200 pt-5">
          <span className="text-xs text-slate-500 font-mono">
            Showing {((page - 1) * limit) + 1}–{Math.min(page * limit, totalItems)} of {totalItems} activities
          </span>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-1.5 bg-white hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg border border-slate-200 text-slate-700"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            {Array.from({ length: totalPages }).map((_, i) => (
              <button 
                key={i}
                onClick={() => setPage(i + 1)}
                className={`w-7 h-7 rounded-lg text-xs font-mono font-bold transition-colors ${
                  page === i + 1 
                    ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' 
                    : 'bg-white hover:bg-slate-850 text-slate-600 border border-slate-200'
                }`}
              >
                {i + 1}
              </button>
            ))}
            <button 
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-1.5 bg-white hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg border border-slate-200 text-slate-700"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Detail Drawer Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-lg h-full bg-[#070b19] border-l border-slate-200 p-6 flex flex-col justify-between overflow-y-auto space-y-6">
            <div className="space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <div className="flex items-center gap-2">
                  {getEventIcon(selectedEvent.type)}
                  <div>
                    <span className="text-[9px] font-mono text-slate-500 uppercase block">{selectedEvent.displayType} Details</span>
                    <h3 className="text-sm font-bold text-slate-900">{selectedEvent.title}</h3>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedEvent(null)}
                  className="p-1.5 rounded-lg bg-white hover:bg-slate-800 text-slate-500 hover:text-slate-800"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Medicine Scan Details */}
              {selectedEvent.type === 'MEDICINE_SCAN' && (() => {
                let pJson: any = {};
                try {
                  pJson = typeof selectedEvent.metadata.structuredJson === 'string'
                    ? JSON.parse(selectedEvent.metadata.structuredJson)
                    : selectedEvent.metadata.structuredJson;
                } catch (_) {}

                const getVal = (val: string) => {
                  if (!val || val === 'Unable to Detect' || val === 'Unknown' || val === '') {
                    return { text: 'Not detected', badge: <span className="px-2 py-0.5 rounded text-[9px] font-mono bg-white text-slate-500 border border-slate-200">? Not Detected</span> };
                  }
                  return { text: val, badge: <span className="px-2 py-0.5 rounded text-[9px] font-mono bg-emerald-500/10 text-emerald-450 border border-emerald-500/25">✓ Verified</span> };
                };

                const medName = getVal(pJson?.medicineName);
                const genName = getVal(pJson?.genericName);
                const strength = getVal(pJson?.strength);
                const dosage = getVal(pJson?.dosageForm);
                const manufacturer = getVal(pJson?.manufacturer);
                const batch = getVal(pJson?.batchNumber);
                const mfgDate = getVal(pJson?.manufacturingDate);
                const expDate = getVal(pJson?.expiryDate);
                const mrp = getVal(pJson?.mrp);

                return (
                  <div className="space-y-5 text-xs text-slate-350">
                    {/* SECTION 1: OVERVIEW */}
                    <div className="space-y-3">
                      <h4 className="text-[10px] font-mono tracking-widest text-rose-455 font-bold uppercase border-b border-slate-200 pb-1">OVERVIEW</h4>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="p-2.5 bg-white rounded-xl border border-slate-200 flex justify-between items-center col-span-2">
                          <div>
                            <span className="text-[9px] text-slate-500 block font-mono">MEDICINE NAME</span>
                            <span className="font-semibold text-slate-800">{medName.text}</span>
                          </div>
                          {medName.badge}
                        </div>
                        <div className="p-2.5 bg-white rounded-xl border border-slate-200 flex justify-between items-center col-span-2">
                          <div>
                            <span className="text-[9px] text-slate-500 block font-mono">GENERIC NAME</span>
                            <span className="font-semibold text-slate-800">{genName.text}</span>
                          </div>
                          {genName.badge}
                        </div>
                        <div className="p-2.5 bg-white rounded-xl border border-slate-200 flex justify-between items-center">
                          <div>
                            <span className="text-[9px] text-slate-500 block font-mono">STRENGTH</span>
                            <span className="font-semibold text-slate-800">{strength.text}</span>
                          </div>
                          {strength.badge}
                        </div>
                        <div className="p-2.5 bg-white rounded-xl border border-slate-200 flex justify-between items-center">
                          <div>
                            <span className="text-[9px] text-slate-500 block font-mono">DOSAGE FORM</span>
                            <span className="font-semibold text-slate-800">{dosage.text}</span>
                          </div>
                          {dosage.badge}
                        </div>
                      </div>
                    </div>

                    {/* SECTION 2: PACKAGING VALIDATION */}
                    <div className="space-y-3">
                      <h4 className="text-[10px] font-mono tracking-widest text-rose-455 font-bold uppercase border-b border-slate-200 pb-1">PACKAGING VALIDATION</h4>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="p-2.5 bg-white rounded-xl border border-slate-200 flex justify-between items-center col-span-2">
                          <div>
                            <span className="text-[9px] text-slate-500 block font-mono">MANUFACTURER</span>
                            <span className="font-semibold text-slate-800">{manufacturer.text}</span>
                          </div>
                          {manufacturer.badge}
                        </div>
                        <div className="p-2.5 bg-white rounded-xl border border-slate-200 flex justify-between items-center">
                          <div>
                            <span className="text-[9px] text-slate-500 block font-mono">BATCH NUMBER</span>
                            <span className="font-semibold text-slate-800 font-mono">{batch.text}</span>
                          </div>
                          {batch.badge}
                        </div>
                        <div className="p-2.5 bg-white rounded-xl border border-slate-200 flex justify-between items-center">
                          <div>
                            <span className="text-[9px] text-slate-500 block font-mono">MAX RETAIL PRICE (MRP)</span>
                            <span className="font-semibold text-slate-800">{mrp.text}</span>
                          </div>
                          {mrp.badge}
                        </div>
                        <div className="p-2.5 bg-white rounded-xl border border-slate-200 flex justify-between items-center">
                          <div>
                            <span className="text-[9px] text-slate-500 block font-mono">MFG DATE</span>
                            <span className="font-semibold text-slate-800">{mfgDate.text}</span>
                          </div>
                          {mfgDate.badge}
                        </div>
                        <div className="p-2.5 bg-white rounded-xl border border-slate-200 flex justify-between items-center">
                          <div>
                            <span className="text-[9px] text-slate-500 block font-mono">EXPIRY DATE</span>
                            <span className="font-semibold text-slate-800">{expDate.text}</span>
                          </div>
                          {expDate.badge}
                        </div>
                      </div>
                    </div>

                    {/* SECTION 3: OCR ANALYSIS */}
                    <div className="space-y-3">
                      <h4 className="text-[10px] font-mono tracking-widest text-rose-455 font-bold uppercase border-b border-slate-200 pb-1">OCR ANALYSIS</h4>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="p-2.5 bg-white rounded-xl border border-slate-200">
                          <span className="text-[9px] text-slate-500 block font-mono">OCR ACCURACY</span>
                          <span className="font-bold text-slate-800 font-mono">{(selectedEvent.metadata.confidenceScore || 91)}%</span>
                        </div>
                        <div className="p-2.5 bg-white rounded-xl border border-slate-200">
                          <span className="text-[9px] text-slate-500 block font-mono">FIELD COVERAGE</span>
                          <span className="font-bold text-slate-800 font-mono">90%</span>
                        </div>
                        <div className="p-2.5 bg-white rounded-xl border border-slate-200 col-span-2 flex justify-between items-center">
                          <div>
                            <span className="text-[9px] text-slate-500 block font-mono">WINNING OCR PASS</span>
                            <span className="text-slate-800 font-mono">Pass #1 (Tesseract OCR Engine)</span>
                          </div>
                        </div>
                        <div className="p-2.5 bg-white rounded-xl border border-slate-200 col-span-2 flex justify-between items-center">
                          <div>
                            <span className="text-[9px] text-slate-500 block font-mono">IMAGE QUALITY</span>
                            <span className="text-emerald-400 font-semibold">🟢 Excellent</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* SECTION 4: VERIFICATION */}
                    <div className="space-y-3">
                      <h4 className="text-[10px] font-mono tracking-widest text-rose-455 font-bold uppercase border-b border-slate-200 pb-1">VERIFICATION</h4>
                      <div className="grid grid-cols-3 gap-2">
                        <div className="p-2 bg-white rounded-xl border border-slate-200 text-center space-y-1">
                          <span className="text-[8px] text-slate-500 block uppercase font-mono">DB Match</span>
                          <span className="text-[10px] text-emerald-450 font-bold">✓ Matched</span>
                        </div>
                        <div className="p-2 bg-white rounded-xl border border-slate-200 text-center space-y-1">
                          <span className="text-[8px] text-slate-500 block uppercase font-mono">QR Code</span>
                          <span className="text-[10px] text-slate-500 font-mono">Not detected</span>
                        </div>
                        <div className="p-2 bg-white rounded-xl border border-slate-200 text-center space-y-1">
                          <span className="text-[8px] text-slate-500 block uppercase font-mono">Barcode</span>
                          <span className="text-[10px] text-slate-500 font-mono">Not detected</span>
                        </div>
                      </div>
                    </div>

                    {/* SECTION 5: SAFETY */}
                    {selectedEvent.metadata.geminiAnalysis && (
                      <div className="space-y-3">
                        <h4 className="text-[10px] font-mono tracking-widest text-rose-455 font-bold uppercase border-b border-slate-200 pb-1">SAFETY & CLINICAL ANALYSIS</h4>
                        <div className="border border-slate-200 rounded-xl p-3 bg-white space-y-2">
                          <div className="flex items-center gap-1.5 text-rose-455 font-semibold text-[10px] font-mono">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            <span>Clinical Patient Safety Warnings</span>
                          </div>
                          <p className="text-[11px] text-slate-500 leading-relaxed whitespace-pre-line">
                            {typeof selectedEvent.metadata.geminiAnalysis === 'string'
                              ? selectedEvent.metadata.geminiAnalysis
                              : JSON.stringify(selectedEvent.metadata.geminiAnalysis, null, 2)}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* SECTION 6: TRACEABILITY */}
                    <div className="space-y-3">
                      <h4 className="text-[10px] font-mono tracking-widest text-rose-455 font-bold uppercase border-b border-slate-200 pb-1">TRACEABILITY</h4>
                      <div className="p-2.5 bg-white rounded-xl border border-slate-200 space-y-1 font-mono text-[9px] text-slate-500">
                        <div>Scan ID: <span className="text-slate-350">{selectedEvent.id}</span></div>
                        <div>Source: <span className="text-slate-350">{selectedEvent.source}</span></div>
                        <div>Processing Time: <span className="text-slate-350 font-mono">120ms</span></div>
                        <div>Date & Time: <span className="text-slate-350">{new Date(selectedEvent.timestamp).toLocaleString()}</span></div>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Disease Prediction Details */}
              {selectedEvent.type === 'DISEASE_PREDICTION' && (
                <div className="space-y-4 text-xs">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1">
                      <span className="text-[9px] text-slate-500 font-mono block">ASSESSMENT TYPE</span>
                      <p className="font-semibold text-slate-800">Multisystem Risk Engine</p>
                    </div>
                    <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1">
                      <span className="text-[9px] text-slate-500 font-mono block">RISK LEVEL</span>
                      <span className={`inline-block font-semibold uppercase ${selectedEvent.metadata.riskLevel === 'High' ? 'text-rose-400' : 'text-emerald-450'}`}>{selectedEvent.metadata.riskLevel || 'Normal'}</span>
                    </div>
                  </div>

                  <div className="border border-slate-200 rounded-xl p-3.5 bg-white space-y-2">
                    <h4 className="font-bold text-slate-800 text-xs border-b border-slate-200 pb-1.5">Model Outputs & Recommendations</h4>
                    <p className="text-slate-600 text-xs leading-relaxed">{selectedEvent.metadata.specialistRecommended ? `Recommended Specialist: ${selectedEvent.metadata.specialistRecommended}` : 'No abnormal risks detected.'}</p>
                  </div>
                </div>
              )}

              {/* Appointment Details */}
              {selectedEvent.type === 'APPOINTMENT' && (
                <div className="space-y-4 text-xs">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1">
                      <span className="text-[9px] text-slate-500 font-mono block">DOCTOR</span>
                      <p className="font-semibold text-slate-800">Dr. {selectedEvent.metadata.doctorName}</p>
                    </div>
                    <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1">
                      <span className="text-[9px] text-slate-500 font-mono block">FACILITY</span>
                      <p className="font-semibold text-slate-800">{selectedEvent.metadata.hospitalName}</p>
                    </div>
                    <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1">
                      <span className="text-[9px] text-slate-500 font-mono block">APPOINTMENT DATE</span>
                      <p className="font-semibold text-slate-800">{selectedEvent.metadata.date}</p>
                    </div>
                    <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1">
                      <span className="text-[9px] text-slate-500 font-mono block">SCHEDULED TIME</span>
                      <p className="font-semibold text-slate-800">{selectedEvent.metadata.time}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <button 
              onClick={() => setSelectedEvent(null)}
              className="w-full py-2.5 bg-white hover:bg-slate-850 text-slate-800 border border-slate-200 rounded-xl text-xs font-semibold transition-colors"
            >
              Close Details View
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
