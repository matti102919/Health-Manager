import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import type { Condition, Medication, Task, Appointment } from '../lib/types'
import { format, isToday, isTomorrow, parseISO } from 'date-fns'
import { Heart, Pill, SquareCheck as CheckSquare, Calendar, TriangleAlert as AlertTriangle, CircleCheck as CheckCircle2, Clock } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function DashboardPage() {
  const { user } = useAuth()
  const [conditions, setConditions] = useState<Condition[]>([])
  const [medications, setMedications] = useState<Medication[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    const userId = user.id
    async function load() {
      const today = format(new Date(), 'yyyy-MM-dd')
      const [condRes, medRes, taskRes, aptRes] = await Promise.all([
        supabase.from('conditions').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
        supabase.from('medications').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
        supabase.from('tasks').select('*').eq('user_id', userId).gte('due_date', today).order('due_date', { ascending: true }).limit(10),
        supabase.from('appointments').select('*').eq('user_id', userId).gte('date', today).order('date', { ascending: true }).limit(5),
      ])
      setConditions(condRes.data ?? [])
      setMedications(medRes.data ?? [])
      setTasks(taskRes.data ?? [])
      setAppointments(aptRes.data ?? [])
      setLoading(false)
    }
    load()
  }, [user])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-primary-200 border-t-primary-600" />
      </div>
    )
  }

  const todayTasks = tasks.filter((t) => isToday(parseISO(t.due_date)))
  const completedToday = todayTasks.filter((t) => t.completed).length
  const totalToday = todayTasks.length
  const severeConditions = conditions.filter((c) => c.severity === 'severe')

  const severityColor = (s: string) => {
    switch (s) {
      case 'mild': return 'bg-success-50 text-success-600 border-success-100'
      case 'moderate': return 'bg-warning-50 text-warning-600 border-warning-100'
      case 'severe': return 'bg-error-50 text-error-600 border-error-100'
      default: return 'bg-neutral-100 text-neutral-600 border-neutral-200'
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-neutral-900">Dashboard</h1>
        <p className="text-lg text-neutral-500 mt-1">Here's your health overview for today</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Link to="/conditions" className="bg-white rounded-2xl p-6 border border-neutral-200 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-primary-50 rounded-xl"><Heart className="w-6 h-6 text-primary-600" /></div>
            <span className="text-base font-medium text-neutral-500">Conditions</span>
          </div>
          <p className="text-3xl font-bold text-neutral-900">{conditions.length}</p>
        </Link>

        <Link to="/medications" className="bg-white rounded-2xl p-6 border border-neutral-200 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-success-50 rounded-xl"><Pill className="w-6 h-6 text-success-600" /></div>
            <span className="text-base font-medium text-neutral-500">Medications</span>
          </div>
          <p className="text-3xl font-bold text-neutral-900">{medications.length}</p>
        </Link>

        <Link to="/tasks" className="bg-white rounded-2xl p-6 border border-neutral-200 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-warning-50 rounded-xl"><CheckSquare className="w-6 h-6 text-warning-600" /></div>
            <span className="text-base font-medium text-neutral-500">Today's Tasks</span>
          </div>
          <p className="text-3xl font-bold text-neutral-900">{completedToday}/{totalToday}</p>
        </Link>

        <Link to="/appointments" className="bg-white rounded-2xl p-6 border border-neutral-200 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-error-50 rounded-xl"><Calendar className="w-6 h-6 text-error-600" /></div>
            <span className="text-base font-medium text-neutral-500">Appointments</span>
          </div>
          <p className="text-3xl font-bold text-neutral-900">{appointments.length}</p>
        </Link>
      </div>

      {severeConditions.length > 0 && (
        <div className="bg-error-50 border border-error-100 rounded-2xl p-5">
          <div className="flex items-center gap-3 mb-2">
            <AlertTriangle className="w-6 h-6 text-error-600" />
            <span className="text-lg font-semibold text-error-600">Important Reminders</span>
          </div>
          <ul className="space-y-1">
            {severeConditions.map((c) => (
              <li key={c.id} className="text-base text-error-600">{c.name} — requires careful management</li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-neutral-200">
          <div className="p-6 border-b border-neutral-100"><h2 className="text-xl font-semibold text-neutral-900">Today's Tasks</h2></div>
          <div className="p-6">
            {todayTasks.length === 0 ? (
              <p className="text-neutral-500 text-base">No tasks for today. Enjoy your day!</p>
            ) : (
              <ul className="space-y-3">
                {todayTasks.map((task) => (
                  <li key={task.id} className="flex items-start gap-3 p-3 rounded-xl bg-neutral-50">
                    {task.completed ? <CheckCircle2 className="w-6 h-6 text-success-500 shrink-0 mt-0.5" /> : <Clock className="w-6 h-6 text-warning-500 shrink-0 mt-0.5" />}
                    <div className="flex-1 min-w-0">
                      <p className={`text-base font-medium ${task.completed ? 'line-through text-neutral-400' : 'text-neutral-900'}`}>{task.title}</p>
                      {task.due_time && <p className="text-sm text-neutral-500">at {task.due_time}</p>}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-neutral-200">
          <div className="p-6 border-b border-neutral-100"><h2 className="text-xl font-semibold text-neutral-900">Upcoming Appointments</h2></div>
          <div className="p-6">
            {appointments.length === 0 ? (
              <p className="text-neutral-500 text-base">No upcoming appointments scheduled.</p>
            ) : (
              <ul className="space-y-3">
                {appointments.map((apt) => {
                  const dateObj = parseISO(apt.date)
                  const label = isToday(dateObj) ? 'Today' : isTomorrow(dateObj) ? 'Tomorrow' : format(dateObj, 'MMM d, yyyy')
                  return (
                    <li key={apt.id} className="p-4 rounded-xl bg-neutral-50">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-base font-medium text-neutral-900">Dr. {apt.doctor_name}</p>
                          {apt.specialty && <p className="text-sm text-neutral-500">{apt.specialty}</p>}
                        </div>
                        <div className="text-right">
                          <span className="inline-block px-3 py-1 text-sm font-medium bg-primary-50 text-primary-700 rounded-lg">{label}</span>
                          <p className="text-sm text-neutral-500 mt-1">{apt.time}</p>
                        </div>
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-neutral-200">
          <div className="p-6 border-b border-neutral-100"><h2 className="text-xl font-semibold text-neutral-900">Your Conditions</h2></div>
          <div className="p-6">
            {conditions.length === 0 ? (
              <div className="text-center py-4">
                <p className="text-neutral-500 text-base">No conditions added yet.</p>
                <Link to="/conditions" className="inline-block mt-3 text-base font-medium text-primary-600 hover:text-primary-700">Add your first condition</Link>
              </div>
            ) : (
              <ul className="space-y-3">
                {conditions.map((c) => (
                  <li key={c.id} className="flex items-center justify-between p-3 rounded-xl bg-neutral-50">
                    <span className="text-base font-medium text-neutral-900">{c.name}</span>
                    <span className={`px-3 py-1 text-sm font-medium rounded-lg border ${severityColor(c.severity)}`}>{c.severity}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-neutral-200">
          <div className="p-6 border-b border-neutral-100"><h2 className="text-xl font-semibold text-neutral-900">Your Medications</h2></div>
          <div className="p-6">
            {medications.length === 0 ? (
              <div className="text-center py-4">
                <p className="text-neutral-500 text-base">No medications added yet.</p>
                <Link to="/medications" className="inline-block mt-3 text-base font-medium text-primary-600 hover:text-primary-700">Add your first medication</Link>
              </div>
            ) : (
              <ul className="space-y-3">
                {medications.map((m) => (
                  <li key={m.id} className="p-3 rounded-xl bg-neutral-50">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-base font-medium text-neutral-900">{m.name}</p>
                        <p className="text-sm text-neutral-500">{m.dosage} — {m.frequency}</p>
                      </div>
                      {m.time_of_day.length > 0 && (
                        <div className="flex gap-1">
                          {m.time_of_day.map((t) => (
                            <span key={t} className="px-2 py-0.5 text-xs font-medium bg-primary-50 text-primary-700 rounded">{t}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
