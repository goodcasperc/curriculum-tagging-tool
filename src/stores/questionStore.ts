import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { v4 as uuidv4 } from 'uuid'
import { Question } from '@/types'

interface QuestionState {
  questions: Question[]
  isLoading: boolean
  
  // Actions
  addQuestion: (questionData: Omit<Question, 'id' | 'created_at' | 'is_synced'>) => void
  updateQuestion: (id: string, updates: Partial<Question>) => void
  deleteQuestion: (id: string) => void
  updateQuestionTags: (id: string, tags: { concepts: string[], learning_goals: string[] }) => void
  markQuestionSynced: (id: string) => void
  markQuestionUnsynced: (id: string) => void
  clearAllQuestions: () => void
  getQuestionsBySourceType: (sourceType: 'text' | 'image' | 'pdf') => Question[]
  getQuestionsByTag: (tagType: 'concepts' | 'learning_goals', tagValue: string) => Question[]
}

export const useQuestionStore = create<QuestionState>()(
  persist(
    (set, get) => ({
      questions: [],
      isLoading: false,

      addQuestion: (questionData) => {
        const newQuestion: Question = {
          ...questionData,
          id: uuidv4(),
          created_at: new Date().toISOString(),
          is_synced: false,
        }
        set((state) => ({
          questions: [...state.questions, newQuestion]
        }))
      },

      updateQuestion: (id: string, updates: Partial<Question>) => {
        set((state) => ({
          questions: state.questions.map(question =>
            question.id === id 
              ? { ...question, ...updates, is_synced: false }
              : question
          )
        }))
      },

      deleteQuestion: (id: string) => {
        set((state) => ({
          questions: state.questions.filter(question => question.id !== id)
        }))
      },

      updateQuestionTags: (id: string, tags: { concepts: string[], learning_goals: string[] }) => {
        set((state) => ({
          questions: state.questions.map(question =>
            question.id === id 
              ? { ...question, tags, is_synced: false }
              : question
          )
        }))
      },

      markQuestionSynced: (id: string) => {
        set((state) => ({
          questions: state.questions.map(question =>
            question.id === id 
              ? { ...question, is_synced: true }
              : question
          )
        }))
      },

      markQuestionUnsynced: (id: string) => {
        set((state) => ({
          questions: state.questions.map(question =>
            question.id === id 
              ? { ...question, is_synced: false }
              : question
          )
        }))
      },

      clearAllQuestions: () => {
        set({ questions: [] })
      },

      getQuestionsBySourceType: (sourceType: 'text' | 'image' | 'pdf') => {
        return get().questions.filter(question => question.source_type === sourceType)
      },

      getQuestionsByTag: (tagType: 'concepts' | 'learning_goals', tagValue: string) => {
        return get().questions.filter(question => 
          question.tags[tagType].includes(tagValue)
        )
      },
    }),
    {
      name: 'questions-storage',
    }
  )
)