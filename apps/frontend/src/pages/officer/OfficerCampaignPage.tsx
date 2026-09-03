import React from 'react';
import { Megaphone, Sparkles, Send, CheckCircle2, History, AlertCircle } from 'lucide-react';
import { campaignService } from '../../services/api';

export default function OfficerCampaignPage() {
  const [prompt, setPrompt] = React.useState('');
  const [category, setCategory] = React.useState('SMS');
  const [generatedText, setGeneratedText] = React.useState('');
  const [campaigns, setCampaigns] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');

  const fetchCampaigns = async () => {
    try {
      const res = await campaignService.getCampaigns();
      if (res.success && res.data.campaigns) {
        setCampaigns(res.data.campaigns);
      }
    } catch (err) {
      console.error(err);
    }
  };

  React.useEffect(() => {
    fetchCampaigns();
  }, []);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || loading) return;
    setLoading(true);
    setError('');
    setGeneratedText('');

    try {
      const res = await campaignService.generateContent(prompt, category);
      if (res.success && res.data.generatedText) {
        setGeneratedText(res.data.generatedText);
      } else {
        setError('Generation failed. Please try again.');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Server error during Gemini generation.');
    } finally {
      setLoading(false);
    }
  };

  const handlePublish = async () => {
    if (!generatedText) return;
    try {
      const res = await campaignService.createCampaign({
        title: prompt.slice(0, 40) + ' Campaign',
        category,
        content: generatedText,
        targetAudience: 'General Public (District wide)',
      });
      if (res.success) {
        alert('Campaign published and broadcast to ASHA network!');
        setPrompt('');
        setGeneratedText('');
        fetchCampaigns();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-teal-500/10 rounded-lg text-teal-450 border border-teal-500/20">
            <Megaphone className="w-5 h-5 glow-pill" />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight text-slate-105">AI Health Campaign Builder</h2>
            <p className="text-xs text-slate-600 mt-0.5">Generate health advisories, SMS copy, and ASHA field pamphlets</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column: input */}
        <div className="bg-white border border-slate-200 shadow-sm p-6 rounded-2xl border border-slate-200 lg:col-span-1 flex flex-col justify-between">
          <form onSubmit={handleGenerate} className="space-y-5">
            <div>
              <label className="block text-[10px] font-mono text-slate-500 uppercase mb-2">Campaign Channel</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg py-2.5 px-3 text-xs text-slate-800 outline-none focus:border-teal-500/35"
              >
                <option value="SMS">ASHA SMS Alert</option>
                <option value="POSTER">Social Media Poster Text</option>
                <option value="RADIO">Radio Broadcast Jingle</option>
                <option value="PAMPHLET">Field Pamphlet Copy</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-mono text-slate-500 uppercase mb-2">Public Health Topic / Prompt</label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={4}
                required
                placeholder="e.g. Advise citizens to discard stagnant cooler water to prevent Dengue breeding in Khed block..."
                className="w-full px-3.5 py-2.5 rounded-lg bg-white border border-slate-200 text-xs text-slate-800 outline-none focus:border-teal-500/35 resize-none placeholder:text-slate-600"
              />
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-600 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={!prompt.trim() || loading}
              className="w-full py-3 bg-gradient-to-r from-teal-500 to-indigo-500 text-slate-950 font-bold hover:from-teal-400 hover:to-indigo-400 transition-all rounded-xl disabled:opacity-50 text-xs tracking-wide uppercase font-mono"
            >
              {loading ? 'Generating Clinical Copy...' : 'Draft Campaign Copy'}
            </button>
          </form>
        </div>

        {/* Middle column: Preview generated text */}
        <div className="bg-white border border-slate-200 shadow-sm p-6 rounded-2xl border border-slate-200 lg:col-span-1 flex flex-col justify-between">
          <div className="space-y-4">
            <h4 className="text-xs font-mono font-bold tracking-wider text-slate-500 uppercase">AI-Drafted Copy Preview</h4>
            {generatedText ? (
              <div className="p-4 rounded-xl bg-white border border-slate-200 text-xs text-slate-700 leading-relaxed font-mono whitespace-pre-wrap">
                {generatedText}
              </div>
            ) : (
              <div className="h-48 border border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center text-center p-4 text-slate-500">
                <Sparkles className="w-8 h-8 text-slate-700 mb-2" />
                <p className="text-xs">Clinical copy generated via Gemini will show up here.</p>
              </div>
            )}
          </div>

          {generatedText && (
            <button
              onClick={handlePublish}
              className="w-full py-2.5 bg-teal-500/10 border border-teal-500/25 hover:bg-teal-500/20 text-teal-450 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
            >
              <Send className="w-4 h-4" />
              <span>Broadcast Campaign</span>
            </button>
          )}
        </div>

        {/* Right column: History */}
        <div className="bg-white border border-slate-200 shadow-sm p-6 rounded-2xl border border-slate-200 lg:col-span-1 space-y-4 max-h-[500px] overflow-y-auto pr-2">
          <h4 className="text-xs font-mono font-bold tracking-wider text-slate-500 uppercase">Active Campaigns</h4>
          <div className="space-y-3">
            {campaigns.map((c) => (
              <div key={c.id} className="p-3 bg-white border border-slate-200 rounded-xl text-xs space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-800 truncate">{c.title}</span>
                  <span className="text-[9px] font-mono bg-teal-500/10 text-teal-400 px-1.5 py-0.5 rounded border border-teal-500/20">
                    {c.category}
                  </span>
                </div>
                <p className="text-slate-600 text-[10px] leading-relaxed line-clamp-3">{c.content}</p>
                <div className="text-[9px] text-slate-500 font-mono flex items-center justify-between pt-1 border-t border-slate-200">
                  <span>Target: {c.targetAudience}</span>
                  <span className="text-emerald-600 font-bold">LIVE</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
