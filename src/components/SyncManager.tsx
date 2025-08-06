'use client'

import { useState, useEffect } from 'react'
import { useProfileStore } from '@/stores/profileStore'
import { useCurriculumStore } from '@/stores/curriculumStore'
import { useQuestionStore } from '@/stores/questionStore'
import { 
  performFullSync, 
  checkSupabaseConnection,
  loadProfileFromSupabase,
  loadCurriculumFromSupabase,
  loadQuestionsFromSupabase
} from '@/utils/supabaseSync'

export default function SyncManager() {
  const { profile, markSynced: markProfileSynced } = useProfileStore()
  const { curriculum, setCurriculum } = useCurriculumStore()
  const { questions, addQuestion, markQuestionSynced } = useQuestionStore()
  
  const [isSyncing, setIsSyncing] = useState(false)
  const [isOnline, setIsOnline] = useState<boolean | null>(null)
  const [lastSync, setLastSync] = useState<Date | null>(null)
  const [syncStatus, setSyncStatus] = useState('')

  // Check connection status on mount
  useEffect(() => {
    checkConnection()
  }, [])

  const checkConnection = async () => {
    const online = await checkSupabaseConnection()
    setIsOnline(online)
  }

  const handleManualSync = async () => {
    if (!profile || isSyncing) return

    setIsSyncing(true)
    setSyncStatus('Syncing data to Supabase...')

    try {
      const result = await performFullSync(profile, curriculum, questions)
      
      if (result.isOnline) {
        if (result.profile) {
          markProfileSynced()
        }
        
        if (result.questions.success > 0) {
          // Mark synced questions
          questions.forEach(q => {
            if (!q.is_synced) {
              markQuestionSynced(q.id)
            }
          })
        }
        
        setLastSync(new Date())
        setSyncStatus(`✅ Sync complete! Profile: ${result.profile ? '✓' : '✗'}, ` +
                     `Curriculum: ${result.curriculum ? '✓' : '✗'}, ` +
                     `Questions: ${result.questions.success}/${questions.length}`)
        setIsOnline(true)
      } else {
        setSyncStatus('❌ Sync failed - No internet connection')
        setIsOnline(false)
      }
    } catch (error) {
      console.error('Sync error:', error)
      setSyncStatus('❌ Sync failed - Please try again')
    } finally {
      setIsSyncing(false)
      setTimeout(() => setSyncStatus(''), 5000)
    }
  }

  const handleLoadFromSupabase = async () => {
    if (!profile || isSyncing || !isOnline) return

    setIsSyncing(true)
    setSyncStatus('Loading data from Supabase...')

    try {
      // Load curriculum
      const remoteCurriculum = await loadCurriculumFromSupabase(profile.id)
      if (remoteCurriculum) {
        setCurriculum(remoteCurriculum)
      }

      // Load questions
      const remoteQuestions = await loadQuestionsFromSupabase(profile.id)
      remoteQuestions.forEach(question => {
        // Only add if not already exists locally
        const exists = questions.some(q => q.id === question.id)
        if (!exists) {
          addQuestion(question)
        }
      })

      setSyncStatus(`✅ Data loaded! ${remoteCurriculum ? 'Curriculum' : 'No curriculum'}, ${remoteQuestions.length} questions`)
      setLastSync(new Date())
    } catch (error) {
      console.error('Load error:', error)
      setSyncStatus('❌ Failed to load data from Supabase')
    } finally {
      setIsSyncing(false)
      setTimeout(() => setSyncStatus(''), 5000)
    }
  }

  // Count unsynced items
  const unsyncedCount = {
    profile: profile && !profile.is_synced ? 1 : 0,
    questions: questions.filter(q => !q.is_synced).length,
    total: (profile && !profile.is_synced ? 1 : 0) + questions.filter(q => !q.is_synced).length
  }

  if (!profile) {
    return null
  }

  return (
    <div className="bg-white border rounded-lg p-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-medium text-gray-900">☁️ Supabase Sync</h3>
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${
            isOnline === null ? 'bg-gray-400' :
            isOnline ? 'bg-green-500' : 'bg-red-500'
          }`} />
          <span className="text-sm text-gray-600">
            {isOnline === null ? 'Checking...' :
             isOnline ? 'Online' : 'Offline'}
          </span>
        </div>
      </div>

      {/* Connection Status */}
      {isOnline === false && (
        <div className="bg-red-50 border border-red-200 rounded p-3 mb-4">
          <p className="text-red-700 text-sm">
            ⚠️ Cannot connect to Supabase. Check your internet connection and API keys.
          </p>
          <button
            onClick={checkConnection}
            className="text-red-600 hover:text-red-800 text-sm underline mt-1"
          >
            Retry connection
          </button>
        </div>
      )}

      {/* Sync Status */}
      <div className="space-y-3">
        <div className="flex justify-between items-center text-sm">
          <span>Unsynced items:</span>
          <span className={`font-medium ${unsyncedCount.total > 0 ? 'text-yellow-600' : 'text-green-600'}`}>
            {unsyncedCount.total} {unsyncedCount.total === 1 ? 'item' : 'items'}
          </span>
        </div>

        {unsyncedCount.total > 0 && (
          <div className="text-xs text-gray-600 space-y-1">
            {unsyncedCount.profile > 0 && <div>• Profile not synced</div>}
            {unsyncedCount.questions > 0 && <div>• {unsyncedCount.questions} question{unsyncedCount.questions !== 1 ? 's' : ''} not synced</div>}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          <button
            onClick={handleManualSync}
            disabled={isSyncing || !isOnline}
            className="flex-1 bg-blue-600 text-white px-3 py-2 rounded text-sm hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {isSyncing ? 'Syncing...' : `Sync to Cloud (${unsyncedCount.total})`}
          </button>
          
          <button
            onClick={handleLoadFromSupabase}
            disabled={isSyncing || !isOnline}
            className="flex-1 bg-green-600 text-white px-3 py-2 rounded text-sm hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            Load from Cloud
          </button>
        </div>

        {/* Last Sync */}
        {lastSync && (
          <div className="text-xs text-gray-500 pt-2 border-t">
            Last sync: {lastSync.toLocaleString()}
          </div>
        )}

        {/* Status Message */}
        {syncStatus && (
          <div className={`text-sm p-2 rounded ${
            syncStatus.includes('✅') ? 'bg-green-50 text-green-700' :
            syncStatus.includes('❌') ? 'bg-red-50 text-red-700' :
            'bg-blue-50 text-blue-700'
          }`}>
            {syncStatus}
          </div>
        )}
      </div>
    </div>
  )
}