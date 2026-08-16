import React from 'react';
import { Newspaper, Sparkles, AlertCircle, Calendar, ExternalLink } from 'lucide-react';
import { analyticsService } from '../../services/api';

export default function OfficerNewsPage() {
  const [advisories, setAdvisories] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchNews = async () => {
      try {
        const res = await analyticsService.getNews();
        if (res.success && res.data.advisories) {
          setAdvisories(res.data.advisories);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchNews();
  }, []);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-3 border-b border-slate-900 pb-4">
        <div className="p-2 bg-teal-500/10 rounded-lg text-teal-450 border border-teal-500/20">
          <Newspaper className="w-5 h-5 glow-pill" />
        </div>
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-100">National News & Advisories</h2>
          <p className="text-xs text-slate-455 mt-0.5">Real-time health advisories with Gemini-synthesized clinical takeaways</p>
        </div>
      </div>

      {loading ? (
        <p className="text-xs text-slate-500">Loading advisories...</p>
      ) : (
        <div className="space-y-4">
          {advisories.map((adv) => (
            <div key={adv.id} className="glass-panel p-6 rounded-2xl border border-slate-900 space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2.5">
                    <span className="text-[9px] font-mono bg-teal-500/10 text-teal-400 px-2 py-0.5 rounded border border-teal-500/20 uppercase font-bold">
                      {adv.category}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {adv.date}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-slate-205">{adv.title}</h3>
                  <p className="text-[10px] font-mono text-indigo-400">{adv.source}</p>
                </div>
                <span className="text-[10px] text-slate-550 font-mono uppercase">ID: {adv.id}</span>
              </div>

              {/* AI Summarized Takeaway */}
              <div className="p-4 rounded-xl bg-teal-950/20 border border-teal-500/15 flex gap-3">
                <Sparkles className="w-4 h-4 text-teal-400 shrink-0 mt-0.5 animate-pulse" />
                <div>
                  <span className="text-[9px] font-mono text-teal-450 uppercase block font-bold">Gemini Clinical Takeaway</span>
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed">{adv.summary}</p>
                </div>
              </div>

              <div className="text-xs text-slate-400 leading-relaxed border-t border-slate-900 pt-3">
                <span className="font-semibold text-slate-300 block mb-1">Full Advisory Details</span>
                <p>{adv.fullAdvisory}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
