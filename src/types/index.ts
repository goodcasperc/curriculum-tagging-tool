// Core types for the curriculum tagging tool

export interface TeacherProfile {
  id: string
  name: string
  subject: string
  curriculum?: string
  created_at: string
  is_synced: boolean
}

export interface Concept {
  id: string
  name: string
  description?: string
  strand?: string
  subsection?: string
}

export interface LearningGoal {
  id: string
  name: string
  description: string
  concepts: string[]
  strand?: string
  subsection?: string
}

export interface CurriculumData {
  id: string
  title: string
  concepts: Concept[]
  learning_goals: LearningGoal[]
  strands: string[]
}

export interface Question {
  id: string
  question_text: string
  source_type: 'text' | 'image' | 'pdf'
  raw_file_url?: string
  tags: {
    concepts: string[]
    learning_goals: string[]
  }
  created_at: string
  is_synced: boolean
}

export interface UploadedFile {
  file: File
  preview?: string
  extractedText?: string
}