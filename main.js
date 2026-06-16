import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { Heart, Plus, X, CreditCard as Edit2, Trash2 } from 'lucide-react';
const emptyForm = { name: '', description: '', diagnosed_date: '', severity: 'moderate' };
export default function ConditionsPage() {
    const { user } = useAuth();
    const [conditions, setConditions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [form, setForm] = useState(emptyForm);
    const load = async () => {
        if (!user)
            return;
        const { data } = await supabase.from('conditions').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
        setConditions(data ?? []);
        setLoading(false);
    };
    useEffect(() => { load(); }, [user]);
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!user)
            return;
        const payload = { name: form.name, description: form.description || null, diagnosed_date: form.diagnosed_date || null, severity: form.severity };
        if (editingId) {
            await supabase.from('conditions').update(payload).eq('id', editingId).eq('user_id', user.id);
        }
        else {
            await supabase.from('conditions').insert({ ...payload, user_id: user.id });
        }
        setForm(emptyForm);
        setShowForm(false);
        setEditingId(null);
        load();
    };
    const startEdit = (c) => {
        setForm({ name: c.name, description: c.description ?? '', diagnosed_date: c.diagnosed_date ?? '', severity: c.severity });
        setEditingId(c.id);
        setShowForm(true);
    };
    const handleDelete = async (id) => {
        if (!user || !confirm('Are you sure you want to delete this condition?'))
            return;
        await supabase.from('conditions').delete().eq('id', id).eq('user_id', user.id);
        load();
    };
    const cancelForm = () => { setForm(emptyForm); setShowForm(false); setEditingId(null); };
    const severityBadge = (s) => {
        switch (s) {
            case 'mild': return 'bg-success-50 text-success-600 border-success-100';
            case 'moderate': return 'bg-warning-50 text-warning-600 border-warning-100';
            case 'severe': return 'bg-error-50 text-error-600 border-error-100';
            default: return 'bg-neutral-100 text-neutral-600 border-neutral-200';
        }
    };
    if (loading) {
        return <div className="flex items-center justify-center py-20"><div className="animate-spin rounded-full h-10 w-10 border-4 border-primary-200 border-t-primary-600"/></div>;
    }
    return (<div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900">Conditions</h1>
          <p className="text-lg text-neutral-500 mt-1">Track and manage your health conditions</p>
        </div>
        <button onClick={() => { setForm(emptyForm); setEditingId(null); setShowForm(true); }} className="flex items-center gap-2 px-5 py-3 text-base font-semibold text-white bg-primary-600 rounded-xl hover:bg-primary-700 transition-colors">
          <Plus className="w-5 h-5"/> Add Condition
        </button>
      </div>

      {showForm && (<div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={cancelForm}>
          <div className="bg-white rounded-2xl p-8 w-full max-w-lg shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-semibold text-neutral-900">{editingId ? 'Edit Condition' : 'Add Condition'}</h2>
              <button onClick={cancelForm} className="p-2 hover:bg-neutral-100 rounded-lg"><X className="w-6 h-6 text-neutral-400"/></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-base font-medium text-neutral-700 mb-2">Condition Name</label>
                <input type="text" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full px-4 py-3 text-lg border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500" placeholder="e.g., Diabetes Type 2"/>
              </div>
              <div>
                <label className="block text-base font-medium text-neutral-700 mb-2">Description</label>
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full px-4 py-3 text-lg border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500" rows={3} placeholder="Describe your condition and any important notes"/>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-base font-medium text-neutral-700 mb-2">Diagnosed Date</label>
                  <input type="date" value={form.diagnosed_date} onChange={(e) => setForm({ ...form, diagnosed_date: e.target.value })} className="w-full px-4 py-3 text-lg border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"/>
                </div>
                <div>
                  <label className="block text-base font-medium text-neutral-700 mb-2">Severity</label>
                  <select value={form.severity} onChange={(e) => setForm({ ...form, severity: e.target.value })} className="w-full px-4 py-3 text-lg border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500">
                    <option value="mild">Mild</option><option value="moderate">Moderate</option><option value="severe">Severe</option>
                  </select>
                </div>
              </div>
              <button type="submit" className="w-full py-3 px-6 text-lg font-semibold text-white bg-primary-600 rounded-xl hover:bg-primary-700 transition-colors">
                {editingId ? 'Save Changes' : 'Add Condition'}
              </button>
            </form>
          </div>
        </div>)}
      )
      }

      {conditions.length === 0 ? (<div className="text-center py-16 bg-white rounded-2xl border border-neutral-200">
          <Heart className="w-16 h-16 text-neutral-300 mx-auto mb-4"/>
          <p className="text-xl text-neutral-500">No conditions added yet</p>
          <p className="text-base text-neutral-400 mt-2">Click "Add Condition" to get started</p>
        </div>) : (<div className="space-y-4">
          {conditions.map((c) => (<div key={c.id} className="bg-white rounded-2xl border border-neutral-200 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-semibold text-neutral-900">{c.name}</h3>
                    <span className={`px-3 py-1 text-sm font-medium rounded-lg border ${severityBadge(c.severity)}`}>{c.severity}</span>
                  </div>
                  {c.description && <p className="text-base text-neutral-600 mb-2">{c.description}</p>}
                  }
                  {c.diagnosed_date && <p className="text-sm text-neutral-400">Diagnosed: {c.diagnosed_date}</p>}
                  }
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <button onClick={() => startEdit(c)} className="p-2 text-neutral-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"><Edit2 className="w-5 h-5"/></button>
                  <button onClick={() => handleDelete(c.id)} className="p-2 text-neutral-400 hover:text-error-600 hover:bg-error-50 rounded-lg transition-colors"><Trash2 className="w-5 h-5"/></button>
                </div>
              </div>
            </div>))}
          )
          )
          }
        </div>)}
      )
      }
    )
    </div>);
}
