import React from 'react';
import { Warehouse, Clock, AlertTriangle } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function MedicineSupplyDashboard() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 font-mono text-xs text-slate-700">
      <div className="flex justify-between items-center border-b border-slate-200 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-rose-500/10 rounded-xl text-rose-600 border border-rose-500/20">
            <Warehouse className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900 uppercase">National Medicine Supply & Inventory</h2>
            <p className="text-[10px] text-slate-500">Medicine demand forecasting and Jan Aushadhi Kendras stock rates</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white border border-slate-200 shadow-sm p-5 rounded-xl border border-slate-200 space-y-4">
          <span className="font-bold text-slate-800 block uppercase">Inventory Stock Forecast (Next 3 Months)</span>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={[
                { month: 'Jun', stock: 12000 },
                { month: 'Jul', stock: 9500 },
                { month: 'Aug', stock: 15000 },
                { month: 'Sep', stock: 21000 }
              ]}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="month" stroke="#64748b" fontSize={10} />
                <YAxis stroke="#64748b" fontSize={10} />
                <Tooltip contentStyle={{ backgroundColor: '#020617', borderColor: '#1e293b' }} />
                <Area type="monotone" dataKey="stock" stroke="#3b82f6" fill="rgba(59,130,246,0.1)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white border border-slate-200 shadow-sm p-5 rounded-xl border border-slate-200 space-y-4">
          <span className="font-bold text-slate-800 block uppercase">Low Stock Warnings</span>
          <div className="space-y-3">
            <div className="p-3 bg-white rounded border border-rose-500/20 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              <div>
                <span className="text-slate-800 font-bold block">Amoxicillin 500mg</span>
                <span className="text-[10px] text-slate-500">Remaining stocks: 240 units in Haveli block health clinics</span>
              </div>
            </div>
            <div className="p-3 bg-white rounded border border-slate-200 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
              <div>
                <span className="text-slate-800 font-bold block">ORS Sachet packs</span>
                <span className="text-[10px] text-slate-500">Remaining stocks: 120 units in Khed block</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
