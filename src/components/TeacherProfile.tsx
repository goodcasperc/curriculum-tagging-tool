'use client'

import React, { useState } from 'react'
import { useProfileStore } from '@/stores/profileStore'
import { syncProfile } from '@/utils/supabaseSync'

const SUBJECTS = [
  'Mathematics',
  'English Language Arts',
  'Science',
  'Social Studies',
  'History',
  'Geography',
  'Physics',
  'Chemistry',
  'Biology',
  'Other'
]

const CURRICULUMS = [
  'Ontario Curriculum',
  'Common Core',
  'IB Programme',
  'British National Curriculum',
  'Australian Curriculum',
  'Custom/Other'
]

export default function TeacherProfile() {
  const { profile, createProfile, updateProfile, markSynced } = useProfileStore()
  const [isSyncing, setIsSyncing] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    name: profile?.name || '',
    subject: profile?.subject || '',
    curriculum: profile?.curriculum || ''
  })

  // Set editing mode when there's no profile - avoid hydration mismatch
  const [mounted, setMounted] = React.useState(false)
  
  React.useEffect(() => {
    setMounted(true)
    console.log('Profile changed:', profile)
    setIsEditing(!profile)
  }, [profile])

  // Prevent hydration mismatch
  if (!mounted) {
    return <div className="card">Loading...</div>
  }

  // Remove console.log to prevent hydration issues

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name || !formData.subject) {
      alert('Please fill in all required fields')
      return
    }

    setIsSyncing(true)

    try {
      if (profile) {
        // Update existing profile
        updateProfile(formData)
        // Auto-sync the updated profile
        const success = await syncProfile({ ...profile, ...formData })
        if (success) {
          markSynced()
        }
      } else {
        // Create new profile
        createProfile(formData.name, formData.subject, formData.curriculum)
        
        // Auto-sync the new profile
        const newProfile = {
          id: crypto.randomUUID(),
          name: formData.name,
          subject: formData.subject,
          curriculum: formData.curriculum,
          created_at: new Date().toISOString(),
          is_synced: false
        }
        
        const success = await syncProfile(newProfile)
        if (success) {
          markSynced()
        }
      }
    } catch (error) {
      console.error('Auto-sync failed:', error)
      // Profile is still created locally even if sync fails
    } finally {
      setIsSyncing(false)
      setIsEditing(false)
    }
  }

  const handleEdit = () => {
    setIsEditing(true)
    setFormData({
      name: profile?.name || '',
      subject: profile?.subject || '',
      curriculum: profile?.curriculum || ''
    })
  }

  if (!isEditing && profile) {
    return (
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: '600', margin: 0 }}>👤 Teacher Profile</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <SyncStatus />
            <button
              onClick={handleEdit}
              style={{ color: '#3b82f6', textDecoration: 'none', fontSize: '0.875rem', background: 'none', border: 'none', cursor: 'pointer' }}
            >
              ✏️ Edit
            </button>
          </div>
        </div>
        
        <div className="form-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
          <div>
            <label className="form-label">Name</label>
            <p style={{ color: '#1f2937', fontWeight: '500' }}>{profile.name}</p>
          </div>
          <div>
            <label className="form-label">Subject</label>
            <p style={{ color: '#1f2937', fontWeight: '500' }}>{profile.subject}</p>
          </div>
          <div>
            <label className="form-label">Curriculum</label>
            <p style={{ color: '#1f2937', fontWeight: '500' }}>{profile.curriculum || 'Not specified'}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="card">
      <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1.5rem' }}>
        {profile ? '✏️ Edit Profile' : '👤 Create Teacher Profile'}
      </h2>
      
      <form onSubmit={handleSubmit}>
        <div className="form-grid two-col">
          <div className="form-group">
            <label htmlFor="name" className="form-label">
              Name *
            </label>
            <input
              type="text"
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="input-field"
              placeholder="Enter your name"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="subject" className="form-label">
              Subject *
            </label>
            <select
              id="subject"
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              className="select-field"
              required
            >
              <option value="">Select a subject</option>
              {SUBJECTS.map((subject) => (
                <option key={subject} value={subject}>
                  {subject}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group" style={{ gridColumn: '1 / -1' }}>
            <label htmlFor="curriculum" className="form-label">
              Curriculum (Optional)
            </label>
            <select
              id="curriculum"
              value={formData.curriculum}
              onChange={(e) => setFormData({ ...formData, curriculum: e.target.value })}
              className="select-field"
            >
              <option value="">Select a curriculum</option>
              {CURRICULUMS.map((curriculum) => (
                <option key={curriculum} value={curriculum}>
                  {curriculum}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
          <button
            type="submit"
            className="btn-primary"
            disabled={isSyncing}
          >
            {isSyncing ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{ 
                  width: '16px', 
                  height: '16px', 
                  border: '2px solid #ffffff',
                  borderTop: '2px solid transparent',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }} />
                {profile ? 'Updating & Syncing...' : 'Creating & Syncing...'}
              </div>
            ) : (
              profile ? 'Update Profile' : 'Create Profile'
            )}
          </button>
          
          {profile && (
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="btn-secondary"
              disabled={isSyncing}
            >
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  )
}

function SyncStatus() {
  const { profile } = useProfileStore()
  
  if (!profile) return null

  return (
    <div className={`status-badge ${profile.is_synced ? 'status-synced' : 'status-unsynced'}`}>
      <div style={{ 
        width: '8px', 
        height: '8px', 
        borderRadius: '50%', 
        backgroundColor: profile.is_synced ? '#16a34a' : '#d97706'
      }} />
      {profile.is_synced ? 'Synced' : 'Not Synced'}
    </div>
  )
}