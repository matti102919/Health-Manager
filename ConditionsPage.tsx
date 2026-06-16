export interface Condition {
  id: string
  user_id: string
  name: string
  description: string | null
  diagnosed_date: string | null
  severity: 'mild' | 'moderate' | 'severe'
  created_at: string
}

export interface Medication {
  id: string
  user_id: string
  name: string
  dosage: string
  frequency: string
  time_of_day: string[]
  condition_id: string | null
  notes: string | null
  start_date: string | null
  end_date: string | null
  created_at: string
}

export interface Task {
  id: string
  user_id: string
  title: string
  description: string | null
  due_date: string
  due_time: string | null
  completed: boolean
  category: 'medication' | 'exercise' | 'diet' | 'appointment' | 'other'
  condition_id: string | null
  created_at: string
}

export interface Appointment {
  id: string
  user_id: string
  doctor_name: string
  specialty: string | null
  location: string | null
  date: string
  time: string
  notes: string | null
  condition_id: string | null
  created_at: string
}
