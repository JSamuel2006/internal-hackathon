import React, { useState, useEffect } from 'react';
import { Activity, Shield, Users, Plus, Trash2 } from 'lucide-react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '/api/v1';

export default function FamilyDashboard() {
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState('');
  const [relationship, setRelationship] = useState('Parent');
  const [abhaId, setAbhaId] = useState('');
  
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const fetchMembers = async () => {
    setLoading(true);
    try {
      const token = sessionStorage.getItem('token');
      const res = await axios.get(`${API_URL}/family`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data?.success) {
        setMembers(res.data.data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, []);

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    setError('');
    try {
      const token = sessionStorage.getItem('token');
      const res = await axios.post(`${API_URL}/family`, {
        name, relationship, abhaId
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data?.success) {
        setSuccessMsg('Family member profile created successfully!');
        setName('');
        setAbhaId('');
        fetchMembers();
      }
    } catch (err) {
      setError('Could not add family member');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteMember = async (id: string) => {
    if (!confirm('Are you sure you want to remove this member?')) return;
    try {
      const token = sessionStorage.getItem('token');
      const res = await axios.delete(`${API_URL}/family/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data?.success) {
        fetchMembers();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4 font-mono text-xs text-slate-500">
      <div className="flex justify-between items-center border-b border-slate-200 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-500/10 rounded-xl text-indigo-400 border border-indigo-500/20">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900 uppercase">Family Health Directory</h2>
            <p className="text-[10px] text-slate-500">Coordinate health timelines, ABHAs, and immunizations for all relatives</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <form onSubmit={handleAddMember} className="lg:col-span-5 bg-white p-6 rounded-2xl border border-slate-200 space-y-4">
          <span className="font-bold text-slate-800 uppercase block">Add Relative</span>
          <input
            type="text"
            placeholder="Relative Name..."
            value={name}
            aria-label="Relative Name"
            onChange={e => setName(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-slate-700 focus:outline-none"
          />
          <input
            type="text"
            placeholder="ABHA ID Card (Optional)..."
            value={abhaId}
            aria-label="ABHA ID"
            onChange={e => setAbhaId(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-slate-700 focus:outline-none"
          />
          <select
            value={relationship}
            aria-label="Relationship"
            onChange={e => setRelationship(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-slate-700 focus:outline-none"
          >
            <option value="Parent">Parent</option>
            <option value="Spouse">Spouse</option>
            <option value="Child">Child</option>
            <option value="Sibling">Sibling</option>
          </select>
          <button type="submit" className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-slate-950 font-bold rounded-xl uppercase">
            Add relative
          </button>
        </form>

        <div className="lg:col-span-7 space-y-4">
          <span className="font-bold text-slate-800 uppercase block">Registered Relatives</span>
          <div className="space-y-3">
            {members.map((m) => (
              <div key={m.id} className="p-4 bg-white border border-slate-200 rounded-xl flex justify-between items-center">
                <div>
                  <strong className="text-slate-202 text-sm block">{m.member_name}</strong>
                  <span className="text-[10px] text-slate-500">{m.relationship} {m.abha_id ? `| ABHA: ${m.abha_id}` : ''}</span>
                </div>
                <button onClick={() => handleDeleteMember(m.id)} className="text-slate-550 hover:text-rose-600">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
            {members.length === 0 && (
              <p className="text-slate-500 text-center py-12">No family members registered yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
export { Activity, Shield, Users, Plus, Trash2 };
