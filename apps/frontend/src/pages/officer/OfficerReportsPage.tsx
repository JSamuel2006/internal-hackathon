import React from 'react';
import { FileText, Download, Copy, AlertCircle, Sparkles, CheckCircle2 } from 'lucide-react';
import { reportService } from '../../services/api';

export default function OfficerReportsPage() {
  const [district, setDistrict] = React.useState('Pune');
  const [month, setMonth] = React.useState('2026-08');
  const [format, setFormat] = React.useState('PDF');
  const [loading, setLoading] = React.useState(false);
  const [report, setReport] = React.useState<any>(null);
  const [copied, setCopied] = React.useState(false);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setReport(null);

    try {
      const res = await reportService.generateReport(district, month, format);
      if (res.success && res.data) {
        setReport(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (!report?.reportContent) return;
    navigator.clipboard.writeText(report.reportContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-3 border-b border-slate-200 pb-4">
        <div className="p-2 bg-teal-500/10 rounded-lg text-teal-450 border border-teal-500/20">
          <FileText className="w-5 h-5 glow-pill" />
        </div>
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900">National Health Report Center</h2>
          <p className="text-xs text-slate-455 mt-0.5">Generate monthly district epidemiological reports via Gemini AI</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Side: Parameters Form */}
        <div className="bg-white border border-slate-200 shadow-sm p-6 rounded-2xl border border-slate-200 md:col-span-1 flex flex-col justify-between h-80">
          <form onSubmit={handleGenerate} className="space-y-4">
            <h3 className="text-xs font-mono font-bold tracking-wider text-slate-500 uppercase">Configuration</h3>

            <div>
              <label className="block text-[10px] font-mono text-slate-500 uppercase mb-1.5">Target District</label>
              <input
                type="text"
                required
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 text-xs rounded-lg text-slate-800 outline-none focus:border-teal-500/35"
              />
            </div>

            <div>
              <label className="block text-[10px] font-mono text-slate-500 uppercase mb-1.5">Report Period</label>
              <input
                type="month"
                required
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 text-xs rounded-lg text-slate-800 outline-none focus:border-teal-500/35"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-teal-500 to-indigo-500 text-slate-950 font-bold hover:from-teal-400 hover:to-indigo-400 transition-all rounded-xl disabled:opacity-50 text-xs tracking-wide uppercase font-mono mt-2"
            >
              {loading ? 'Synthesizing Report...' : 'Compile Health Report'}
            </button>
          </form>
        </div>

        {/* Right Side: Report Viewer */}
        <div className="bg-white border border-slate-200 shadow-sm p-6 rounded-2xl border border-slate-200 md:col-span-2 space-y-4 min-h-[400px] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-4">
              <h4 className="text-xs font-mono font-bold tracking-wider text-slate-500 uppercase">Output Document</h4>
              {report && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={copyToClipboard}
                    className="p-2 rounded hover:bg-white text-slate-600 hover:text-white transition-colors"
                    title="Copy Report Content"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => alert(`Downloading report in PDF format...`)}
                    className="p-2 rounded hover:bg-white text-slate-600 hover:text-white transition-colors"
                    title="Export PDF"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            {report ? (
              <div className="space-y-4">
                <div className="p-3 bg-teal-950/20 border border-teal-500/10 rounded-xl flex items-center justify-between text-xs text-teal-400">
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-teal-400 animate-pulse" />
                    <span>Report compiled using Gemini: <span className="font-mono">{report.poweredBy}</span></span>
                  </div>
                  <span className="text-[9px] font-mono text-slate-500">Task ID: {report.taskId}</span>
                </div>

                {copied && (
                  <div className="p-2 rounded bg-emerald-500/10 text-emerald-450 border border-emerald-500/20 text-[10px] text-center font-mono uppercase">
                    Report markdown copied to clipboard!
                  </div>
                )}

                <div className="p-4 rounded-xl bg-white border border-slate-200 text-xs text-slate-350 leading-relaxed font-mono whitespace-pre-wrap max-h-[350px] overflow-y-auto">
                  {report.reportContent}
                </div>
              </div>
            ) : (
              <div className="h-64 border border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center text-slate-500 text-center p-6">
                <FileText className="w-10 h-10 text-slate-850 mb-2 animate-bounce" />
                <p className="text-xs">No active document. Adjust parameters and click compile.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
