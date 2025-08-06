import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Types for our database tables
export type Profile = {
  id: string
  name: string | null
  subject: string | null
  created_at: string
}

export type Curriculum = {
  id: string
  profile_id: string
  title: string
  concepts: any
  learning_goals: any
  created_at: string
}

export type Question = {
  id: string
  profile_id: string
  question_text: string
  source_type: 'text' | 'image' | 'pdf'
  tags: any
  raw_file_url: string | null
  created_at: string
}