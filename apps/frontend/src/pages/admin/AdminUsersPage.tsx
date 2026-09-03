import React from 'react';
import { Users, UserCheck, ShieldAlert, Plus, Edit2, Trash2 } from 'lucide-react';

const MOCK_USERS = [
  { id: 'usr-901', name: 'Dr. Rajesh Sharma', email: 'officer.pune@mohfw.gov.in', role: 'ROLE_OFFICER', jurisdiction: 'Pune District', status: 'ACTIVE' },
  { id: 'usr-902', name: 'System Root Admin', email: 'admin.root@arogyaverse.gov.in', role: 'ROLE_ADMIN', jurisdiction: 'National Server', status: 'ACTIVE' },
  { id: 'usr-903', name: 'Rahul Verma', email: 'rahul.verma@gmail.com', role: 'ROLE_CITIZEN', jurisdiction: 'Pune Municipal', status: 'ACTIVE' },
];

export default function AdminUsersPage() {
  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-400 border border-indigo-500/20">
            <Users className="w-5 h-5 glow-pill" />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight text-slate-900">User Directory</h2>
            <p className="text-xs text-slate-600 mt-0.5">Manage credentials, federated roles, and security jurisdictions</p>
          </div>
        </div>
      </div>

      {/* Desktop Table View (md and above) */}
      <div className="hidden md:block bg-white border border-slate-200 shadow-sm rounded-2xl overflow-hidden">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-sans font-bold uppercase tracking-wider">
              <th className="p-4 font-semibold">User Details</th>
              <th className="p-4 font-semibold">Federated Role</th>
              <th className="p-4 font-semibold">Jurisdiction / Node</th>
              <th className="p-4 font-semibold">Access Posture</th>
              <th className="p-4 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {MOCK_USERS.map((user) => (
              <tr key={user.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="p-4">
                  <span className="font-bold text-slate-900 block">{user.name}</span>
                  <span className="text-[11px] text-slate-500 font-mono mt-0.5">{user.email}</span>
                </td>
                <td className="p-4 font-mono text-[10px]">
                  <span className={`px-2.5 py-1 rounded-full font-bold border ${
                    user.role === 'ROLE_ADMIN'
                      ? 'bg-purple-50 text-purple-700 border-purple-200'
                      : user.role === 'ROLE_OFFICER'
                      ? 'bg-teal-50 text-teal-700 border-teal-200'
                      : 'bg-slate-50 text-slate-700 border-slate-200'
                  }`}>
                    {user.role}
                  </span>
                </td>
                <td className="p-4 text-slate-700 font-medium">{user.jurisdiction}</td>
                <td className="p-4">
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 uppercase tracking-wide">
                    {user.status}
                  </span>
                </td>
                <td className="p-4 text-right space-x-2">
                  <button className="p-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl transition-colors cursor-pointer" title="Edit user">
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button className="p-2 bg-white border border-rose-200 hover:bg-rose-50 text-rose-600 rounded-xl transition-colors cursor-pointer" title="Delete user">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Stacked Card View (below md) */}
      <div className="md:hidden space-y-4">
        {MOCK_USERS.map((user) => (
          <div key={user.id} className="bg-white border border-slate-200 shadow-sm p-4 rounded-2xl space-y-3">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">{user.name}</h3>
                <span className="text-xs text-slate-500 font-mono block mt-0.5">{user.email}</span>
              </div>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 uppercase">
                {user.status}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-slate-100">
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider block">Role</span>
                <span className="font-mono text-[10px] font-bold text-teal-700">{user.role}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider block">Jurisdiction</span>
                <span className="text-slate-800 font-medium">{user.jurisdiction}</span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button className="flex items-center gap-1.5 px-3 py-2 bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl" title="Edit user">
                <Edit2 className="w-3.5 h-3.5" />
                <span>Edit</span>
              </button>
              <button className="flex items-center gap-1.5 px-3 py-2 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold rounded-xl" title="Delete user">
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
