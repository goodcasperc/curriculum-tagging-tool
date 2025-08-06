'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { useCurriculumStore } from '@/stores/curriculumStore'
import { useProfileStore } from '@/stores/profileStore'
import { parsePDFToCurriculum } from '@/utils/pdfParser'
import { getMockCurriculumBySubject } from '@/utils/mockCurriculum'
import { syncCurriculum } from '@/utils/supabaseSync'
import { CurriculumData } from '@/types'

export default function CurriculumUploader() {
  const { profile } = useProfileStore()
  const { curriculum, setCurriculum } = useCurriculumStore()
  const [isUploading, setIsUploading] = useState(false)
  const [uploadStatus, setUploadStatus] = useState<string>('')

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return
    
    const file = acceptedFiles[0]
    setIsUploading(true)
    setUploadStatus('Processing curriculum file...')
    
    try {
      const curriculumData = await parsePDFToCurriculum(file)
      setCurriculum(curriculumData)
      
      // Auto-sync to Supabase
      if (profile) {
        setUploadStatus('✅ Curriculum processed! Syncing to cloud...')
        const syncSuccess = await syncCurriculum(curriculumData, profile.id)
        if (syncSuccess) {
          setUploadStatus('✅ Curriculum uploaded and synced to cloud successfully!')
        } else {
          setUploadStatus('✅ Curriculum uploaded locally (cloud sync failed)')
        }
      } else {
        setUploadStatus('✅ Curriculum uploaded and processed successfully!')
      }
    } catch (error) {
      console.error('Error processing curriculum:', error)
      setUploadStatus('❌ Error processing curriculum file')
    } finally {
      setIsUploading(false)
    }
  }, [setCurriculum])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/json': ['.json']
    },
    maxFiles: 1,
    disabled: isUploading
  })

  const handleUseMockCurriculum = () => {
    if (!profile?.subject) return
    
    const mockCurriculum = getMockCurriculumBySubject(profile.subject)
    if (mockCurriculum) {
      setCurriculum(mockCurriculum)
      setUploadStatus('✅ Mock curriculum loaded successfully!')
    } else {
      setUploadStatus('❌ No mock curriculum available for this subject')
    }
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold mb-4">📖 Curriculum Upload</h2>
      
      {!curriculum ? (
        <div className="space-y-6">
          {/* File Upload Area */}
          <div
            {...getRootProps()}
            className={`
              border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
              ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}
              ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}
            `}
          >
            <input {...getInputProps()} />
            <div className="space-y-4">
              <div className="text-4xl">📄</div>
              {isDragActive ? (
                <p className="text-blue-600">Drop the curriculum file here...</p>
              ) : (
                <div>
                  <p className="text-lg font-medium text-gray-900">
                    Upload Curriculum Document
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    Drag and drop a PDF file here, or click to select
                  </p>
                  <p className="text-xs text-gray-400 mt-2">
                    Supports: PDF, JSON (max 10MB)
                  </p>
                </div>
              )}
            </div>
          </div>



          {/* Status */}
          {uploadStatus && (
            <div className={`p-3 rounded-lg text-sm ${
              uploadStatus.includes('✅') ? 'bg-green-50 text-green-700' :
              uploadStatus.includes('❌') ? 'bg-red-50 text-red-700' :
              'bg-blue-50 text-blue-700'
            }`}>
              {uploadStatus}
            </div>
          )}

          {isUploading && (
            <div className="flex items-center justify-center gap-3 text-blue-600">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
              <span>Processing curriculum...</span>
            </div>
          )}
        </div>
      ) : (
        <CurriculumViewer 
          curriculum={curriculum} 
          onClear={() => {
            setCurriculum(null)
            setUploadStatus('')
          }}
        />
      )}
    </div>
  )
}

function CurriculumViewer({ curriculum, onClear }: { 
  curriculum: CurriculumData
  onClear: () => void 
}) {
  const [expandedStrands, setExpandedStrands] = useState<Set<string>>(new Set())
  
  const toggleStrand = (strand: string) => {
    const newExpanded = new Set(expandedStrands)
    if (newExpanded.has(strand)) {
      newExpanded.delete(strand)
    } else {
      newExpanded.add(strand)
    }
    setExpandedStrands(newExpanded)
  }

  const conceptsByStrand = curriculum.concepts.reduce((acc, concept) => {
    const strand = concept.strand || 'Other'
    if (!acc[strand]) acc[strand] = []
    acc[strand].push(concept)
    return acc
  }, {} as Record<string, typeof curriculum.concepts>)

  const goalsByStrand = curriculum.learning_goals.reduce((acc, goal) => {
    const strand = goal.strand || 'Other'
    if (!acc[strand]) acc[strand] = []
    acc[strand].push(goal)
    return acc
  }, {} as Record<string, typeof curriculum.learning_goals>)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{curriculum.title}</h3>
          <p className="text-sm text-gray-500 mt-1">
            {curriculum.concepts.length} concepts • {curriculum.learning_goals.length} learning goals
          </p>
        </div>
        <button
          onClick={onClear}
          className="text-red-600 hover:text-red-800 text-sm"
        >
          Clear & Upload New
        </button>
      </div>

      {/* Strands */}
      <div className="space-y-4">
        {curriculum.strands.map((strand) => (
          <div key={strand} className="border rounded-lg">
            <button
              onClick={() => toggleStrand(strand)}
              className="w-full px-4 py-3 text-left hover:bg-gray-50 flex justify-between items-center"
            >
              <span className="font-medium">{strand}</span>
              <span className="text-gray-400">
                {expandedStrands.has(strand) ? '−' : '+'}
              </span>
            </button>
            
            {expandedStrands.has(strand) && (
              <div className="px-4 pb-4 border-t bg-gray-50">
                {/* Concepts */}
                {conceptsByStrand[strand] && (
                  <div className="mb-4">
                    <h4 className="font-medium text-sm text-gray-700 mb-2">Concepts</h4>
                    <div className="space-y-2">
                      {conceptsByStrand[strand].map((concept) => (
                        <div key={concept.id} className="bg-white p-3 rounded border">
                          <div className="font-medium text-sm">{concept.name}</div>
                          {concept.description && (
                            <div className="text-xs text-gray-600 mt-1">{concept.description}</div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Learning Goals */}
                {goalsByStrand[strand] && (
                  <div>
                    <h4 className="font-medium text-sm text-gray-700 mb-2">Learning Goals</h4>
                    <div className="space-y-2">
                      {goalsByStrand[strand].map((goal) => (
                        <div key={goal.id} className="bg-white p-3 rounded border">
                          <div className="font-medium text-sm">{goal.name}</div>
                          <div className="text-xs text-gray-600 mt-1">{goal.description}</div>
                          <div className="text-xs text-blue-600 mt-2">
                            Related concepts: {goal.concepts.length}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}