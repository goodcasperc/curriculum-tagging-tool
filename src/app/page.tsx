'use client'

import { useState } from 'react'
import TeacherProfile from '@/components/TeacherProfile'
import CurriculumUploader from '@/components/CurriculumUploader'
import QuestionUploader from '@/components/QuestionUploader'
import QuestionList from '@/components/QuestionList'
import { useProfileStore } from '@/stores/profileStore'

export default function HomePage() {
  const { profile } = useProfileStore()
  const [activeTab, setActiveTab] = useState('profile')

  const tabs = [
    { id: 'profile', label: 'Profile', icon: '👤' },
    { id: 'curriculum', label: 'Curriculum', icon: '📖', disabled: !profile },
    { id: 'questions', label: 'Questions', icon: '❓', disabled: !profile },
    { id: 'dashboard', label: 'Dashboard', icon: '📊', disabled: !profile },
  ]

  return (
    <div className="space-y-6">
      {/* Navigation Tabs */}
      <nav className="tab-nav">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => !tab.disabled && setActiveTab(tab.id)}
            className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
            disabled={tab.disabled}
          >
            <span>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </nav>

      {/* Tab Content */}
      <div>
        {activeTab === 'profile' && (
          <div className="space-y-6">
            <TeacherProfile />
            
            {!profile && (
              <div className="card" style={{ backgroundColor: '#eff6ff', borderLeft: '4px solid #3b82f6' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                  <span style={{ fontSize: '1.25rem' }}>ℹ️</span>
                  <div>
                    <p style={{ color: '#1e40af', fontSize: '0.875rem', lineHeight: '1.5' }}>
                      <strong>Getting Started:</strong> Create your teacher profile to access curriculum upload, 
                      question management, and tagging features. Data will automatically sync to the cloud.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'curriculum' && profile && (
          <CurriculumUploader />
        )}

        {activeTab === 'questions' && profile && (
          <QuestionUploader />
        )}

        {activeTab === 'dashboard' && profile && (
          <QuestionList />
        )}
      </div>


    </div>
  )
}