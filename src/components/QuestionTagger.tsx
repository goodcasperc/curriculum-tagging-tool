'use client'

import { useState, useEffect } from 'react'
import { useQuestionStore } from '@/stores/questionStore'
import { useCurriculumStore } from '@/stores/curriculumStore'
import { useProfileStore } from '@/stores/profileStore'
import { tagQuestion, formatTagsForStorage } from '@/utils/tagQuestion'
import { Question } from '@/types'

interface QuestionTaggerProps {
  question: Question
  onTagsUpdated?: () => void
}

interface TagSuggestion {
  id: string
  name: string
  score: number
  reason: string
  type: 'concept' | 'learning_goal'
  selected: boolean
}

export default function QuestionTagger({ question, onTagsUpdated }: QuestionTaggerProps) {
  const { updateQuestionTags } = useQuestionStore()
  const { curriculum } = useCurriculumStore()
  const { profile } = useProfileStore()
  
  const [isTagging, setIsTagging] = useState(false)
  const [suggestions, setSuggestions] = useState<TagSuggestion[]>([])
  const [confidence, setConfidence] = useState<'high' | 'medium' | 'low'>('low')
  const [customTag, setCustomTag] = useState('')
  const [customTagType, setCustomTagType] = useState<'concept' | 'learning_goal'>('concept')
  const [showManualTags, setShowManualTags] = useState(false)

  // Auto-tag the question when component mounts
  useEffect(() => {
    if (curriculum && !isTagging) {
      handleAutoTag()
    }
  }, [curriculum])

  const handleAutoTag = async () => {
    if (!curriculum) return
    
    setIsTagging(true)
    
    try {
      const result = await tagQuestion(
        question.question_text,
        curriculum,
        profile?.subject
      )
      
      const allSuggestions: TagSuggestion[] = [
        ...result.concepts.map(c => ({
          ...c,
          type: 'concept' as const,
          selected: c.score > 0.4 // Auto-select high confidence tags
        })),
        ...result.learning_goals.map(g => ({
          ...g,
          type: 'learning_goal' as const,
          selected: g.score > 0.3
        }))
      ]
      
      setSuggestions(allSuggestions)
      setConfidence(result.confidence)
    } catch (error) {
      console.error('Error auto-tagging question:', error)
    } finally {
      setIsTagging(false)
    }
  }

  const toggleSuggestion = (id: string) => {
    setSuggestions(prev => 
      prev.map(suggestion => 
        suggestion.id === id 
          ? { ...suggestion, selected: !suggestion.selected }
          : suggestion
      )
    )
  }

  const addCustomTag = () => {
    if (!customTag.trim()) return
    
    const newTag: TagSuggestion = {
      id: `custom-${Date.now()}`,
      name: customTag.trim(),
      score: 1.0,
      reason: 'Manually added',
      type: customTagType,
      selected: true
    }
    
    setSuggestions(prev => [...prev, newTag])
    setCustomTag('')
  }

  const removeTag = (id: string) => {
    setSuggestions(prev => prev.filter(s => s.id !== id))
  }

  const saveTags = () => {
    const selectedSuggestions = suggestions.filter(s => s.selected)
    
    const conceptIds = selectedSuggestions
      .filter(s => s.type === 'concept')
      .map(s => s.id)
    
    const learningGoalIds = selectedSuggestions
      .filter(s => s.type === 'learning_goal')
      .map(s => s.id)
    
    const formattedTags = formatTagsForStorage(conceptIds, learningGoalIds)
    
    updateQuestionTags(question.id, formattedTags)
    onTagsUpdated?.()
  }

  const getConfidenceColor = (conf: string) => {
    switch (conf) {
      case 'high': return 'text-green-600 bg-green-100'
      case 'medium': return 'text-yellow-600 bg-yellow-100'
      case 'low': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getScoreColor = (score: number) => {
    if (score > 0.6) return 'bg-green-500'
    if (score > 0.3) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  if (!curriculum) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <p className="text-yellow-700 text-sm">
          Upload a curriculum first to enable auto-tagging
        </p>
      </div>
    )
  }

  return (
    <div className="bg-white border rounded-lg p-4 space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-medium text-gray-900">Question Tags</h3>
        <div className="flex items-center gap-2">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getConfidenceColor(confidence)}`}>
            {confidence} confidence
          </span>
          <button
            onClick={handleAutoTag}
            disabled={isTagging}
            className="text-blue-600 hover:text-blue-800 text-sm disabled:opacity-50"
          >
            {isTagging ? 'Tagging...' : 'Re-tag'}
          </button>
        </div>
      </div>

      {/* Question Preview */}
      <div className="bg-gray-50 rounded p-3">
        <p className="text-sm text-gray-700 line-clamp-2">
          {question.question_text}
        </p>
      </div>

      {/* Loading State */}
      {isTagging && (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-sm text-gray-600">Analyzing question...</span>
        </div>
      )}

      {/* Tag Suggestions */}
      {!isTagging && suggestions.length > 0 && (
        <div className="space-y-4">
          {/* Concepts */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">Concepts</h4>
            <div className="space-y-2">
              {suggestions
                .filter(s => s.type === 'concept')
                .map(suggestion => (
                  <div key={suggestion.id} className="flex items-center justify-between p-2 border rounded">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={suggestion.selected}
                        onChange={() => toggleSuggestion(suggestion.id)}
                        className="rounded border-gray-300"
                      />
                      <div>
                        <span className="text-sm font-medium">{suggestion.name}</span>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="flex items-center gap-1">
                            <div className={`w-12 h-1 rounded ${getScoreColor(suggestion.score)}`}>
                              <div 
                                className="h-full bg-white bg-opacity-50 rounded"
                                style={{ width: `${(1 - suggestion.score) * 100}%` }}
                              />
                            </div>
                            <span className="text-xs text-gray-500">
                              {Math.round(suggestion.score * 100)}%
                            </span>
                          </div>
                          <span className="text-xs text-gray-400">• {suggestion.reason}</span>
                        </div>
                      </div>
                    </div>
                    {suggestion.reason === 'Manually added' && (
                      <button
                        onClick={() => removeTag(suggestion.id)}
                        className="text-red-500 hover:text-red-700 text-xs"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                ))}
            </div>
          </div>

          {/* Learning Goals */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">Learning Goals</h4>
            <div className="space-y-2">
              {suggestions
                .filter(s => s.type === 'learning_goal')
                .map(suggestion => (
                  <div key={suggestion.id} className="flex items-center justify-between p-2 border rounded">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={suggestion.selected}
                        onChange={() => toggleSuggestion(suggestion.id)}
                        className="rounded border-gray-300"
                      />
                      <div>
                        <span className="text-sm font-medium">{suggestion.name}</span>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="flex items-center gap-1">
                            <div className={`w-12 h-1 rounded ${getScoreColor(suggestion.score)}`}>
                              <div 
                                className="h-full bg-white bg-opacity-50 rounded"
                                style={{ width: `${(1 - suggestion.score) * 100}%` }}
                              />
                            </div>
                            <span className="text-xs text-gray-500">
                              {Math.round(suggestion.score * 100)}%
                            </span>
                          </div>
                          <span className="text-xs text-gray-400">• {suggestion.reason}</span>
                        </div>
                      </div>
                    </div>
                    {suggestion.reason === 'Manually added' && (
                      <button
                        onClick={() => removeTag(suggestion.id)}
                        className="text-red-500 hover:text-red-700 text-xs"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                ))}
            </div>
          </div>

          {/* Manual Tag Addition */}
          <div className="border-t pt-4">
            <button
              onClick={() => setShowManualTags(!showManualTags)}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              {showManualTags ? 'Hide' : 'Add'} custom tags
            </button>
            
            {showManualTags && (
              <div className="mt-3 space-y-3">
                <div className="flex gap-2">
                  <select
                    value={customTagType}
                    onChange={(e) => setCustomTagType(e.target.value as 'concept' | 'learning_goal')}
                    className="border border-gray-300 rounded px-2 py-1 text-sm"
                  >
                    <option value="concept">Concept</option>
                    <option value="learning_goal">Learning Goal</option>
                  </select>
                  <input
                    type="text"
                    value={customTag}
                    onChange={(e) => setCustomTag(e.target.value)}
                    placeholder="Enter custom tag..."
                    className="flex-1 border border-gray-300 rounded px-2 py-1 text-sm"
                    onKeyPress={(e) => e.key === 'Enter' && addCustomTag()}
                  />
                  <button
                    onClick={addCustomTag}
                    disabled={!customTag.trim()}
                    className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 disabled:bg-gray-300"
                  >
                    Add
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Save Button */}
          <div className="border-t pt-4">
            <button
              onClick={saveTags}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
            >
              Save Tags ({suggestions.filter(s => s.selected).length} selected)
            </button>
          </div>
        </div>
      )}

      {/* No Suggestions */}
      {!isTagging && suggestions.length === 0 && (
        <div className="text-center py-6 text-gray-500">
          <p className="text-sm">No tags suggested. Try manually adding tags or re-tagging.</p>
        </div>
      )}
    </div>
  )
}