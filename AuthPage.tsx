import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import type { Task, Condition } from '../lib/types'
import { format } from 'date-fns'
import { CheckSquare, Plus, X, Edit2, Trash2, CheckCircle2, Circle } from 'lucide-react'

const CATEGORY_OPTIONS: { value: Task['category']; label: string }[] = [
  { value: 'medication', label: 'Medication' }, { value: 'exercise', label: 'Exercise' },
  { value: 'diet', label: 'Diet' }, { value: 'appointment', label: 'Appointment' },
  { value: 'other', label: 'Other' },
]

const emptyForm = {
  title: '', description: '', due_date: format(new Date(), 'yyyy-MM-dd'),
  due_time: '', completed: false, category: 'other' as Task['category'], condition_id: '',
}

export default function TasksPage() {
  const { user } = useAuth()
  const [tasks, setTasks] = useState<Task[]>([])
  const [conditions, setConditions] = useState<Condition[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [filter, setFilter] = useState<'all' | 'today' | 'upcoming' | 'completed'>('all')

  const load = async () => {
    if (!user) return
    const [taskRes, condRes] = await Promise.all([
      supabase.from('tasks').select('*').eq('user_id', user.id).order('due_date', { ascending: true }),
      supabase.from('conditions').select('*').eq('user_id', user.id).order('name'),
    ])
    setTasks(taskRes.data ?? []); setConditions(condRes.data ?? []); setLoading(false)
  }

  useEffect(() => { load() }, [user])

  const toggleComplete = async (task: Task) => {
    if (!user) return
    await supabase.from('tasks').update({ completed: !task.completed }).eq('id', task.id).eq('user_id', user.id); load()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    const payload = { title: form.title, description: form.description || null, due_date: form.due_date, due_time: form.due_time || null, completed: form.completed, category: form.category, condition_id: form.condition_id || null }
    if (editingId) {
      await supabase.from('tasks').update(payload).eq('id', editingId).eq('user_id', user.id)
    } else {
      await supabase.from('tasks').insert({ ...payload, user_id: user.id })
    }
    setForm(emptyForm); setShowForm(false); setEditingId(null); load()
  }

  const startEdit = (t: Task) => {
    setForm({ title: t.title, description: t.description ?? '', due_date: t.due_date, due_time: t.due_time ?? '', completed: t.completed, category: t.category, condition_id: t.condition_id ?? '' })
    setEditingId(t.id); setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (!user || !confirm('Delete this task?')) return
    await supabase.from('tasks').delete().eq('id', id).eq('user_id', user.id); load()
  }

  const cancelForm = () => { setForm(emptyForm); setShowForm(false); setEditingId(null) }

  const today = format(new Date(), 'yyyy-MM-dd')
  const filteredTasks = tasks.filter((t) => {
    switch (filter) {
      case 'today': return t.due_date === today && !t.completed
      case 'upcoming': return t.due_date >= today && !t.completed
      case 'completed': return t.completed
      default: return true
    }
  })

  const categoryIcon = (cat: string) => {
    switch (cat) {
      case 'medication': return 'bg-success-50 text-success-600'
      case 'exercise': return 'bg-primary-50 text-primary-600'
      case 'diet': return 'bg-warning-50 text-warning-600'
      case 'appointment': return 'bg-error-50 text-error-600'
      default: return 'bg-neutral-100 text-neutral-600'
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center py-20"><div className="animate-spin rounded-full h-10 w-10 border-4 border-primary-200 border-t-primary-600" /></div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900">Tasks</h1>
          <p className="text-lg text-neutral-500 mt-1">Your daily health tasks and reminders</p>
        </div>
        <button onClick={() => { setForm(emptyForm); setEditingId(null); setShowForm(true) }}
          className="flex items-center gap-2 px-5 py-3 text-base font-semibold text-white bg-primary-600 rounded-xl hover:bg-primary-700 transition-colors">
          <Plus className="w-5 h-5" /> Add Task
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {(['all', 'today', 'upcoming', 'completed'] as const).map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-4 py-2 text-base font-medium rounded-xl transition-colors ${filter === f ? 'bg-primary-600 text-white' : 'bg-white text-neutral-600 border border-neutral-300 hover:bg-neutral-50'}`}>
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={cancelForm}>
          <div className="bg-white rounded-2xl p-8 w-full max-w-lg shadow-xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-semibold text-neutral-900">{editingId ? 'Edit Task' : 'Add Task'}</h2>
              <button onClick={cancelForm} className="p-2 hover:bg-neutral-100 rounded-lg"><X className="w-6 h-6 text-neutral-400" /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-base font-medium text-neutral-700 mb-2">Task Title</label>
                <input type="text" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full px-4 py-3 text-lg border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500" placeholder="e.g., Take morning medication" />
              </div>
              <div>
                <label className="block text-base font-medium text-neutral-700 mb-2">Description</label>
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full px-4 py-3 text-lg border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500" rows={2} placeholder="Add details about this task" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-base font-medium text-neutral-700 mb-2">Due Date</label>
                  <input type="date" required value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })}
                    className="w-full px-4 py-3 text-lg border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500" />
                </div>
                <div>
                  <label className="block text-base font-medium text-neutral-700 mb-2">Due Time</label>
                  <input type="time" value={form.due_time} onChange={(e) => setForm({ ...form, due_time: e.target.value })}
                    className="w-full px-4 py-3 text-lg border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500" />
                </div>
              </div>
              <div>
                <label className="block text-base font-medium text-neutral-700 mb-2">Category</label>
                <div className="flex flex-wrap gap-2">
                  {CATEGORY_OPTIONS.map((opt) => (
                    <button key={opt.value} type="button" onClick={() => setForm({ ...form, category: opt.value })}
                      className={`px-4 py-2 text-base font-medium rounded-xl border transition-colors ${form.category === opt.value ? 'bg-primary-50 text-primary-700 border-primary-200' : 'bg-white text-neutral-600 border-neutral-300 hover:bg-neutral-50'}`}>
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
              {conditions.length > 0 && (
                <div>
                  <label className="block text-base font-medium text-neutral-700 mb-2">Related Condition</label>
                  <select value={form.condition_id} onChange={(e) => setForm({ ...form, condition_id: e.target.value })}
                    className="w-full px-4 py-3 text-lg border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500">
                    <option value="">None</option>
                    {conditions.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              )}
              <button type="submit" className="w-full py-3 px-6 text-lg font-semibold text-white bg-primary-600 rounded-xl hover:bg-primary-700 transition-colors">
                {editingId ? 'Save Changes' : 'Add Task'}
              </button>
            </form>
          </div>
        </div>
      )}

      {filteredTasks.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-neutral-200">
          <CheckSquare className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
          <p className="text-xl text-neutral-500">No tasks found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredTasks.map((t) => (
            <div key={t.id} className={`bg-white rounded-2xl border border-neutral-200 p-5 hover:shadow-md transition-shadow ${t.completed ? 'opacity-70' : ''}`}>
              <div className="flex items-start gap-4">
                <button onClick={() => toggleComplete(t)} className="mt-0.5 shrink-0">
                  {t.completed ? <CheckCircle2 className="w-7 h-7 text-success-500" /> : <Circle className="w-7 h-7 text-neutral-300 hover:text-primary-400" />}
                </button>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className={`text-lg font-semibold ${t.completed ? 'line-through text-neutral-400' : 'text-neutral-900'}`}>{t.title}</h3>
                    <span className={`px-2 py-0.5 text-xs font-medium rounded-lg ${categoryIcon(t.category)}`}>{t.category}</span>
                  </div>
                  {t.description && <p className="text-base text-neutral-600 mb-1">{t.description}</p>}
                  <div className="flex items-center gap-3 text-sm text-neutral-400">
                    <span>{t.due_date}</span>
                    {t.due_time && <span>at {t.due_time}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => startEdit(t)} className="p-2 text-neutral-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"><Edit2 className="w-5 h-5" /></button>
                  <button onClick={() => handleDelete(t.id)} className="p-2 text-neutral-400 hover:text-error-600 hover:bg-error-50 rounded-lg transition-colors"><Trash2 className="w-5 h-5" /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
