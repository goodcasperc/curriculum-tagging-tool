import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { v4 as uuidv4 } from 'uuid'
import { TeacherProfile } from '@/types'

interface ProfileState {
  profile: TeacherProfile | null
  isLoading: boolean
  
  // Actions
  createProfile: (name: string, subject: string, curriculum?: string) => void
  updateProfile: (updates: Partial<TeacherProfile>) => void
  markSynced: () => void
  markUnsynced: () => void
  clearProfile: () => void
}

export const useProfileStore = create<ProfileState>()(
  persist(
    (set, get) => ({
      profile: null,
      isLoading: false,

      createProfile: (name: string, subject: string, curriculum?: string) => {
        const newProfile: TeacherProfile = {
          id: uuidv4(),
          name,
          subject,
          curriculum,
          created_at: new Date().toISOString(),
          is_synced: false,
        }
        set({ profile: newProfile })
      },

      updateProfile: (updates: Partial<TeacherProfile>) => {
        const currentProfile = get().profile
        if (currentProfile) {
          set({
            profile: {
              ...currentProfile,
              ...updates,
              is_synced: false, // Mark as unsynced when updated
            }
          })
        }
      },

      markSynced: () => {
        const currentProfile = get().profile
        if (currentProfile) {
          set({
            profile: {
              ...currentProfile,
              is_synced: true,
            }
          })
        }
      },

      markUnsynced: () => {
        const currentProfile = get().profile
        if (currentProfile) {
          set({
            profile: {
              ...currentProfile,
              is_synced: false,
            }
          })
        }
      },

      clearProfile: () => {
        set({ profile: null })
      },
    }),
    {
      name: 'teacher-profile-storage',
    }
  )
)