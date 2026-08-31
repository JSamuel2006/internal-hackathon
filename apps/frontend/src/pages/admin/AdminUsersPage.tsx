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
            <p className="text-xs text-slate-455 mt-0.5">Manage credentials, federated roles, and security jurisdictions</p>
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 shadow-sm rounded-2xl border border-slate-200 overflow-hidden">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-white border-b border-slate-200 text-slate-500 font-mono uppercase">
              <th className="p-4 font-semibold">User Details</th>
              <th className="p-4 font-semibold">Federated Role</th>
              <th className="p-4 font-semibold">Jurisdiction / Node</th>
              <th className="p-4 font-semibold">Access Posture</th>
              <th className="p-4 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-900">
            {MOCK_USERS.map((user) => (
              <tr key={user.id} className="hover:bg-white transition-colors">
                <td className="p-4">
                  <span className="font-bold text-slate-800 block">{user.name}</span>
                  <span className="text-[10px] text-slate-500 font-mono mt-0.5">{user.email}</span>
                </td>
                <td className="p-4 font-mono text-[10px]">
                  <span className={`px-2 py-0.5 rounded border ${
                    user.role === 'ROLE_ADMIN'
                      ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
                      : user.role === 'ROLE_OFFICER'
                      ? 'bg-teal-500/10 text-teal-400 border-teal-500/20'
                      : 'bg-rose-500/10 text-rose-455 border-rose-500/20'
                  }`}>
                    {user.role}
                  </span>
                </td>
                <td className="p-4 text-slate-350">{user.jurisdiction}</td>
                <td className="p-4">
                  <span className="text-[10px] font-mono text-emerald-450 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                    {user.status}
                  </span>
                </td>
                <td className="p-4 text-right space-x-2">
                  <button className="p-1.5 bg-white border border-slate-200 hover:border-slate-200 text-slate-600 hover:text-white rounded">
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button className="p-1.5 bg-white border border-slate-855 hover:border-rose-500/30 text-slate-600 hover:text-rose-400 rounded">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
