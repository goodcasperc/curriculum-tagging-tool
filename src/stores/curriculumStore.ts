import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { CurriculumData, Concept, LearningGoal } from '@/types'

interface CurriculumState {
  curriculum: CurriculumData | null
  isLoading: boolean
  
  // Actions
  setCurriculum: (curriculum: CurriculumData) => void
  addConcept: (concept: Concept) => void
  addLearningGoal: (goal: LearningGoal) => void
  updateConcept: (id: string, updates: Partial<Concept>) => void
  updateLearningGoal: (id: string, updates: Partial<LearningGoal>) => void
  clearCurriculum: () => void
}

export const useCurriculumStore = create<CurriculumState>()(
  persist(
    (set, get) => ({
      curriculum: null,
      isLoading: false,

      setCurriculum: (curriculum: CurriculumData) => {
        set({ curriculum })
      },

      addConcept: (concept: Concept) => {
        const current = get().curriculum
        if (current) {
          set({
            curriculum: {
              ...current,
              concepts: [...current.concepts, concept]
            }
          })
        }
      },

      addLearningGoal: (goal: LearningGoal) => {
        const current = get().curriculum
        if (current) {
          set({
            curriculum: {
              ...current,
              learning_goals: [...current.learning_goals, goal]
            }
          })
        }
      },

      updateConcept: (id: string, updates: Partial<Concept>) => {
        const current = get().curriculum
        if (current) {
          set({
            curriculum: {
              ...current,
              concepts: current.concepts.map(concept =>
                concept.id === id ? { ...concept, ...updates } : concept
              )
            }
          })
        }
      },

      updateLearningGoal: (id: string, updates: Partial<LearningGoal>) => {
        const current = get().curriculum
        if (current) {
          set({
            curriculum: {
              ...current,
              learning_goals: current.learning_goals.map(goal =>
                goal.id === id ? { ...goal, ...updates } : goal
              )
            }
          })
        }
      },

      clearCurriculum: () => {
        set({ curriculum: null })
      },
    }),
    {
      name: 'curriculum-storage',
    }
  )
)