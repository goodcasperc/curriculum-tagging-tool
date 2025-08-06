// Supabase sync utilities for syncing local data with the database

import { supabase } from '@/lib/supabase'
import { TeacherProfile, CurriculumData, Question } from '@/types'

// Sync profile to Supabase
export async function syncProfile(profile: TeacherProfile): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .upsert({
        id: profile.id,
        name: profile.name,
        subject: profile.subject,
        created_at: profile.created_at
      })
      .select()

    if (error) {
      console.error('Error syncing profile:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Network error syncing profile:', error)
    return false
  }
}

// Sync curriculum to Supabase
export async function syncCurriculum(
  curriculum: CurriculumData, 
  profileId: string
): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('curriculums')
      .upsert({
        id: curriculum.id,
        profile_id: profileId,
        title: curriculum.title,
        concepts: curriculum.concepts,
        learning_goals: curriculum.learning_goals,
        created_at: new Date().toISOString()
      })
      .select()

    if (error) {
      console.error('Error syncing curriculum:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Network error syncing curriculum:', error)
    return false
  }
}

// Sync single question to Supabase
export async function syncQuestion(
  question: Question, 
  profileId: string
): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('questions')
      .upsert({
        id: question.id,
        profile_id: profileId,
        question_text: question.question_text,
        source_type: question.source_type,
        tags: question.tags,
        raw_file_url: question.raw_file_url,
        created_at: question.created_at
      })
      .select()

    if (error) {
      console.error('Error syncing question:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Network error syncing question:', error)
    return false
  }
}

// Sync all questions to Supabase
export async function syncAllQuestions(
  questions: Question[], 
  profileId: string
): Promise<{ success: number; failed: number }> {
  let success = 0
  let failed = 0

  for (const question of questions) {
    const result = await syncQuestion(question, profileId)
    if (result) {
      success++
    } else {
      failed++
    }
  }

  return { success, failed }
}

// Load profile from Supabase
export async function loadProfileFromSupabase(profileId: string): Promise<TeacherProfile | null> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', profileId)
      .single()

    if (error || !data) {
      console.error('Error loading profile:', error)
      return null
    }

    return {
      id: data.id,
      name: data.name,
      subject: data.subject,
      created_at: data.created_at,
      is_synced: true
    }
  } catch (error) {
    console.error('Network error loading profile:', error)
    return null
  }
}

// Load curriculum from Supabase
export async function loadCurriculumFromSupabase(profileId: string): Promise<CurriculumData | null> {
  try {
    const { data, error } = await supabase
      .from('curriculums')
      .select('*')
      .eq('profile_id', profileId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (error || !data) {
      console.error('Error loading curriculum:', error)
      return null
    }

    return {
      id: data.id,
      title: data.title,
      concepts: data.concepts || [],
      learning_goals: data.learning_goals || [],
      strands: extractStrandsFromData(data.concepts || [], data.learning_goals || [])
    }
  } catch (error) {
    console.error('Network error loading curriculum:', error)
    return null
  }
}

// Load questions from Supabase
export async function loadQuestionsFromSupabase(profileId: string): Promise<Question[]> {
  try {
    const { data, error } = await supabase
      .from('questions')
      .select('*')
      .eq('profile_id', profileId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error loading questions:', error)
      return []
    }

    return (data || []).map(item => ({
      id: item.id,
      question_text: item.question_text,
      source_type: item.source_type,
      tags: item.tags || { concepts: [], learning_goals: [] },
      raw_file_url: item.raw_file_url,
      created_at: item.created_at,
      is_synced: true
    }))
  } catch (error) {
    console.error('Network error loading questions:', error)
    return []
  }
}

// Helper function to extract strands from concepts and learning goals
function extractStrandsFromData(concepts: any[], learningGoals: any[]): string[] {
  const strands = new Set<string>()
  
  concepts.forEach(concept => {
    if (concept.strand) strands.add(concept.strand)
  })
  
  learningGoals.forEach(goal => {
    if (goal.strand) strands.add(goal.strand)
  })
  
  return Array.from(strands)
}

// Check if Supabase is reachable
export async function checkSupabaseConnection(): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id')
      .limit(1)

    return !error
  } catch (error) {
    console.error('Supabase connection check failed:', error)
    return false
  }
}

// Batch sync all data
export async function performFullSync(
  profile: TeacherProfile,
  curriculum: CurriculumData | null,
  questions: Question[]
): Promise<{
  profile: boolean
  curriculum: boolean
  questions: { success: number; failed: number }
  isOnline: boolean
}> {
  const isOnline = await checkSupabaseConnection()
  
  if (!isOnline) {
    return {
      profile: false,
      curriculum: false,
      questions: { success: 0, failed: questions.length },
      isOnline: false
    }
  }

  // Sync profile
  const profileResult = await syncProfile(profile)

  // Sync curriculum if available
  let curriculumResult = true
  if (curriculum) {
    curriculumResult = await syncCurriculum(curriculum, profile.id)
  }

  // Sync questions
  const questionsResult = await syncAllQuestions(questions, profile.id)

  return {
    profile: profileResult,
    curriculum: curriculumResult,
    questions: questionsResult,
    isOnline: true
  }
}

// Auto-sync functionality - runs in background
export class AutoSync {
  private static instance: AutoSync | null = null
  private syncInterval: NodeJS.Timeout | null = null
  private isEnabled = false

  static getInstance(): AutoSync {
    if (!AutoSync.instance) {
      AutoSync.instance = new AutoSync()
    }
    return AutoSync.instance
  }

  enable(intervalMs: number = 30000) { // Default: 30 seconds
    if (this.isEnabled) return

    this.isEnabled = true
    this.syncInterval = setInterval(async () => {
      // Auto-sync logic would go here
      // For now, just check connection
      const isOnline = await checkSupabaseConnection()
      console.log('Auto-sync check:', isOnline ? 'Online' : 'Offline')
    }, intervalMs)
  }

  disable() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval)
      this.syncInterval = null
    }
    this.isEnabled = false
  }

  isActive(): boolean {
    return this.isEnabled
  }
}