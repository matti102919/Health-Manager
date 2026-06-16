import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { format, parseISO, isToday, isTomorrow } from 'date-fns';
import { Calendar, Plus, X, CreditCard as Edit2, Trash2, MapPin, Clock } from 'lucide-react';
const emptyForm = { doctor_name: '', specialty: '', location: '', date: format(new Date(), 'yyyy-MM-dd'), time: '09:00', notes: '', condition_id: '' };
export default function AppointmentsPage() {
    const { user } = useAuth();
    const [appointments, setAppointments] = useState([]);
    const [conditions, setConditions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [form, setForm] = useState(emptyForm);
    const load = async () => {
        if (!user)
            return;
        const [aptRes, condRes] = await Promise.all([
            supabase.from('appointments').select('*').eq('user_id', user.id).order('date', { ascending: true }),
            supabase.from('conditions').select('*').eq('user_id', user.id).order('name'),
        ]);
        setAppointments(aptRes.data ?? []);
        setConditions(condRes.data ?? []);
        setLoading(false);
    };
    useEffect(() => { load(); }, [user]);
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!user)
            return;
        const payload = { doctor_name: form.doctor_name, specialty: form.specialty || null, location: form.location || null, date: form.date, time: form.time, notes: form.notes || null, condition_id: form.condition_id || null };
        if (editingId) {
            await supabase.from('appointments').update(payload).eq('id', editingId).eq('user_id', user.id);
        }
        else {
            await supabase.from('appointments').insert({ ...payload, user_id: user.id });
        }
        setForm(emptyForm);
        setShowForm(false);
        setEditingId(null);
        load();
    };
    const startEdit = (a) => {
        setForm({ doctor_name: a.doctor_name, specialty: a.specialty ?? '', location: a.location ?? '', date: a.date, time: a.time, notes: a.notes ?? '', condition_id: a.condition_id ?? '' });
        setEditingId(a.id);
        setShowForm(true);
    };
    const handleDelete = async (id) => {
        if (!user || !confirm('Delete this appointment?'))
            return;
        await supabase.from('appointments').delete().eq('id', id).eq('user_id', user.id);
        load();
    };
    const cancelForm = () => { setForm(emptyForm); setShowForm(false); setEditingId(null); };
    const today = format(new Date(), 'yyyy-MM-dd');
    const upcoming = appointments.filter((a) => a.date >= today);
    const past = appointments.filter((a) => a.date < today);
    const dateLabel = (d) => {
        const dateObj = parseISO(d);
        if (isToday(dateObj))
            return 'Today';
        if (isTomorrow(dateObj))
            return 'Tomorrow';
        return format(dateObj, 'EEEE, MMM d, yyyy');
    };
    if (loading) {
        return <div className="flex items-center justify-center py-20"><div className="animate-spin rounded-full h-10 w-10 border-4 border-primary-200 border-t-primary-600"/></div>;
    }
    return (<div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900">Appointments</h1>
          <p className="text-lg text-neutral-500 mt-1">Schedule and track your doctor visits</p>
        </div>
        <button onClick={() => { setForm(emptyForm); setEditingId(null); setShowForm(true); }} className="flex items-center gap-2 px-5 py-3 text-base font-semibold text-white bg-primary-600 rounded-xl hover:bg-primary-700 transition-colors">
          <Plus className="w-5 h-5"/> Add Appointment
        </button>
      </div>

      {showForm && (<div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={cancelForm}>
          <div className="bg-white rounded-2xl p-8 w-full max-w-lg shadow-xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-semibold text-neutral-900">{editingId ? 'Edit Appointment' : 'Add Appointment'}</h2>
              <button onClick={cancelForm} className="p-2 hover:bg-neutral-100 rounded-lg"><X className="w-6 h-6 text-neutral-400"/></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-base font-medium text-neutral-700 mb-2">Doctor Name</label>
                <input type="text" required value={form.doctor_name} onChange={(e) => setForm({ ...form, doctor_name: e.target.value })} className="w-full px-4 py-3 text-lg border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500" placeholder="e.g., Dr. Smith"/>
              </div>
              <div>
                <label className="block text-base font-medium text-neutral-700 mb-2">Specialty</label>
                <input type="text" value={form.specialty} onChange={(e) => setForm({ ...form, specialty: e.target.value })} className="w-full px-4 py-3 text-lg border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500" placeholder="e.g., Cardiologist"/>
              </div>
              <div>
                <label className="block text-base font-medium text-neutral-700 mb-2">Location</label>
                <input type="text" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} className="w-full px-4 py-3 text-lg border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500" placeholder="e.g., City Hospital, Room 204"/>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-base font-medium text-neutral-700 mb-2">Date</label>
                  <input type="date" required value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="w-full px-4 py-3 text-lg border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"/>
                </div>
                <div>
                  <label className="block text-base font-medium text-neutral-700 mb-2">Time</label>
                  <input type="time" required value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} className="w-full px-4 py-3 text-lg border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"/>
                </div>
              </div>
              {conditions.length > 0 && (<div>
                  <label className="block text-base font-medium text-neutral-700 mb-2">Related Condition</label>
                  <select value={form.condition_id} onChange={(e) => setForm({ ...form, condition_id: e.target.value })} className="w-full px-4 py-3 text-lg border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500">
                    <option value="">None</option>
                    {conditions.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                    )
                    }
                  </select>
                </div>)}
              )
              }
              <div>
                <label className="block text-base font-medium text-neutral-700 mb-2">Notes</label>
                <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="w-full px-4 py-3 text-lg border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500" rows={2} placeholder="Any preparation or questions for the doctor"/>
              </div>
              <button type="submit" className="w-full py-3 px-6 text-lg font-semibold text-white bg-primary-600 rounded-xl hover:bg-primary-700 transition-colors">
                {editingId ? 'Save Changes' : 'Add Appointment'}
              </button>
            </form>
          </div>
        </div>)}
      )
      }

      {upcoming.length === 0 && past.length === 0 ? (<div className="text-center py-16 bg-white rounded-2xl border border-neutral-200">
          <Calendar className="w-16 h-16 text-neutral-300 mx-auto mb-4"/>
          <p className="text-xl text-neutral-500">No appointments scheduled</p>
          <p className="text-base text-neutral-400 mt-2">Click "Add Appointment" to schedule one</p>
        </div>) : (<>
          {upcoming.length > 0 && (<div>
              <h2 className="text-xl font-semibold text-neutral-900 mb-4">Upcoming</h2>
              <div className="space-y-4">
                {upcoming.map((a) => {
                    const condition = conditions.find((c) => c.id === a.condition_id);
                    return (<div key={a.id} className="bg-white rounded-2xl border border-neutral-200 p-6 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="text-xl font-semibold text-neutral-900">Dr. {a.doctor_name}</h3>
                          {a.specialty && <p className="text-base text-primary-600 font-medium">{a.specialty}</p>}
                          }
                          <div className="flex items-center gap-4 mt-3 text-base text-neutral-600">
                            <div className="flex items-center gap-2"><Calendar className="w-5 h-5 text-neutral-400"/><span>{dateLabel(a.date)}</span></div>
                            <div className="flex items-center gap-2"><Clock className="w-5 h-5 text-neutral-400"/><span>{a.time}</span></div>
                          </div>
                          {a.location && <div className="flex items-center gap-2 mt-2 text-base text-neutral-500"><MapPin className="w-5 h-5 text-neutral-400"/><span>{a.location}</span></div>}
                          {condition && <p className="text-sm text-neutral-500 mt-2">For: {condition.name}</p>}
                          }
                          {a.notes && <p className="text-sm text-neutral-500 mt-1">{a.notes}</p>}
                          }
                        </div>
                        <div className="flex items-center gap-2 ml-4">
                          <button onClick={() => startEdit(a)} className="p-2 text-neutral-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"><Edit2 className="w-5 h-5"/></button>
                          <button onClick={() => handleDelete(a.id)} className="p-2 text-neutral-400 hover:text-error-600 hover:bg-error-50 rounded-lg transition-colors"><Trash2 className="w-5 h-5"/></button>
                        </div>
                      </div>
                    )
                    </div>);
                })}
              </div>
            </div>)}
          )
          }
          {past.length > 0 && (<div>
              <h2 className="text-xl font-semibold text-neutral-400 mb-4">Past Appointments</h2>
              <div className="space-y-3">
                {past.map((a) => (<div key={a.id} className="bg-white rounded-2xl border border-neutral-200 p-5 opacity-60">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-medium text-neutral-700">Dr. {a.doctor_name}</h3>
                        <p className="text-sm text-neutral-400">{dateLabel(a.date)} at {a.time}</p>
                      </div>
                      <button onClick={() => handleDelete(a.id)} className="p-2 text-neutral-400 hover:text-error-600 rounded-lg transition-colors"><Trash2 className="w-5 h-5"/></button>
                    </div>
                  </div>))}
                )
                )
                }
              </div>
            </div>)}
          )
          }
        </>)}
      )
      }
    )
    </div>);
}
