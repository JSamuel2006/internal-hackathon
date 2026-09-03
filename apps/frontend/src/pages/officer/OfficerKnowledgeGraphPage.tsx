import React from 'react';
import { Network, Search, AlertCircle, Link2, HelpCircle } from 'lucide-react';
import { analyticsService } from '../../services/api';

export default function OfficerKnowledgeGraphPage() {
  const [nodes, setNodes] = React.useState<any[]>([]);
  const [links, setLinks] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [selectedNode, setSelectedNode] = React.useState<any>(null);

  React.useEffect(() => {
    const fetchGraph = async () => {
      try {
        const res = await analyticsService.getKnowledgeGraph();
        if (res.success && res.data) {
          setNodes(res.data.nodes || []);
          setLinks(res.data.links || []);
          if (res.data.nodes.length > 0) {
            setSelectedNode(res.data.nodes[0]);
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchGraph();
  }, []);

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-teal-500/10 rounded-lg text-teal-450 border border-teal-500/20">
            <Network className="w-5 h-5 glow-pill" />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight text-slate-900">Pathogen Knowledge Graph</h2>
            <p className="text-xs text-slate-600 mt-0.5">Explore medical schema relations: symptoms, prevention, vaccines, and schemes</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Nodes Grid */}
        <div className="bg-white border border-slate-200 shadow-sm p-6 rounded-2xl border border-slate-200 md:col-span-2 space-y-4">
          <h4 className="text-xs font-mono font-bold tracking-wider text-slate-500 uppercase">Knowledge Entities</h4>
          {loading ? (
            <p className="text-xs text-slate-500">Loading graph...</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {nodes.map((node) => (
                <button
                  key={node.id}
                  onClick={() => setSelectedNode(node)}
                  className={`p-3.5 rounded-xl border text-left transition-all ${
                    selectedNode?.id === node.id
                      ? 'bg-teal-500/10 border-teal-500/30 text-teal-400'
                      : 'bg-white border-slate-200 hover:border-slate-200 text-slate-500'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold truncate">{node.label}</span>
                    <span className={`text-[8px] font-mono px-1 py-0.2 rounded border ${
                      node.type === 'DISEASE'
                        ? 'bg-rose-500/10 text-rose-600 border-rose-500/20'
                        : node.type === 'SYMPTOM'
                        ? 'bg-amber-500/10 text-amber-450 border-amber-500/20'
                        : node.type === 'PREVENTION'
                        ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                        : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
                    }`}>
                      {node.type}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Selected Entity Details */}
        <div className="bg-white border border-slate-200 shadow-sm p-6 rounded-2xl border border-slate-200 space-y-5">
          {selectedNode ? (
            <div className="space-y-4">
              <div className="border-b border-slate-200 pb-3">
                <span className="text-[9px] font-mono text-slate-500 uppercase">{selectedNode.type} Entity</span>
                <h3 className="text-base font-bold text-slate-800 mt-1">{selectedNode.label}</h3>
              </div>

              <div className="space-y-3.5 text-xs">
                <div>
                  <span className="text-[10px] text-slate-500 font-mono uppercase block mb-1">Clinical Description</span>
                  <p className="text-slate-500 leading-relaxed">{selectedNode.description}</p>
                </div>

                {/* Relational links */}
                <div className="space-y-2">
                  <span className="text-[10px] text-slate-500 font-mono uppercase block">Relational Connections</span>
                  <div className="space-y-1.5">
                    {links
                      .filter((l) => l.source === selectedNode.id || l.target === selectedNode.id)
                      .map((link, i) => {
                        const partnerId = link.source === selectedNode.id ? link.target : link.source;
                        const partnerNode = nodes.find((n) => n.id === partnerId);
                        return (
                          <div key={i} className="flex items-center gap-2 p-2 bg-white rounded-lg border border-slate-200 text-slate-700">
                            <Link2 className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                            <span className="font-semibold">{partnerNode?.label || partnerId}</span>
                            <span className="text-[9px] font-mono text-slate-500">({partnerNode?.type})</span>
                          </div>
                        );
                      })}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-500">
              <Network className="w-10 h-10 text-slate-800 mb-2" />
              <p className="text-xs">Select an entity node to view relational maps</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
