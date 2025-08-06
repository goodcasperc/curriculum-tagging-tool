'use client'

import { useState } from 'react'
import { useQuestionStore } from '@/stores/questionStore'
import { useCurriculumStore } from '@/stores/curriculumStore'
import QuestionTagger from './QuestionTagger'
import { Question } from '@/types'

export default function QuestionList() {
  const { questions, deleteQuestion } = useQuestionStore()
  const { curriculum } = useCurriculumStore()
  const [expandedQuestion, setExpandedQuestion] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'text' | 'image' | 'pdf'>('all')

  const filteredQuestions = questions.filter(q => 
    filter === 'all' || q.source_type === filter
  )

  const toggleExpanded = (questionId: string) => {
    setExpandedQuestion(expandedQuestion === questionId ? null : questionId)
  }

  const getSourceIcon = (sourceType: string) => {
    switch (sourceType) {
      case 'text': return '📝'
      case 'image': return '🖼️'
      case 'pdf': return '📄'
      default: return '❓'
    }
  }

  const getTagCount = (question: Question) => {
    return question.tags.concepts.length + question.tags.learning_goals.length
  }

  if (questions.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">📚 Question Library</h2>
        <div className="text-center py-12 text-gray-500">
          <div className="text-4xl mb-4">📝</div>
          <p className="text-lg">No questions uploaded yet</p>
          <p className="text-sm mt-2">Upload your first question to get started!</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">📚 Question Library</h2>
        <div className="text-sm text-gray-500">
          {questions.length} question{questions.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-6">
        {[
          { id: 'all', label: 'All Questions', count: questions.length },
          { id: 'text', label: '📝 Text', count: questions.filter(q => q.source_type === 'text').length },
          { id: 'image', label: '🖼️ Image', count: questions.filter(q => q.source_type === 'image').length },
          { id: 'pdf', label: '📄 PDF', count: questions.filter(q => q.source_type === 'pdf').length }
        ].map(filterOption => (
          <button
            key={filterOption.id}
            onClick={() => setFilter(filterOption.id as any)}
            className={`px-3 py-1 rounded-full text-sm ${
              filter === filterOption.id
                ? 'bg-blue-100 text-blue-700'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {filterOption.label} ({filterOption.count})
          </button>
        ))}
      </div>

      {/* Question List */}
      <div className="space-y-4">
        {filteredQuestions.map((question) => (
          <div key={question.id} className="border rounded-lg">
            {/* Question Header */}
            <div className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">{getSourceIcon(question.source_type)}</span>
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                      {question.source_type}
                    </span>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      question.is_synced 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {question.is_synced ? 'Synced' : 'Local'}
                    </span>
                  </div>
                  
                  <p className="text-gray-900 mb-2 line-clamp-2">
                    {question.question_text}
                  </p>
                  
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span>Tags: {getTagCount(question)}</span>
                    <span>Added: {new Date(question.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 ml-4">
                  <button
                    onClick={() => toggleExpanded(question.id)}
                    className="text-blue-600 hover:text-blue-800 text-sm"
                  >
                    {expandedQuestion === question.id ? 'Hide Details' : 'View/Edit Tags'}
                  </button>
                  <button
                    onClick={() => deleteQuestion(question.id)}
                    className="text-red-600 hover:text-red-800 text-sm"
                  >
                    Delete
                  </button>
                </div>
              </div>

              {/* Current Tags Preview */}
              {getTagCount(question) > 0 && (
                <div className="mt-3 pt-3 border-t">
                  <div className="flex flex-wrap gap-1">
                    {question.tags.concepts.map(conceptId => {
                      const concept = curriculum?.concepts.find(c => c.id === conceptId)
                      return concept ? (
                        <span key={conceptId} className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                          📝 {concept.name}
                        </span>
                      ) : null
                    })}
                    {question.tags.learning_goals.map(goalId => {
                      const goal = curriculum?.learning_goals.find(g => g.id === goalId)
                      return goal ? (
                        <span key={goalId} className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                          🎯 {goal.name}
                        </span>
                      ) : null
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Expanded Tagger */}
            {expandedQuestion === question.id && (
              <div className="border-t bg-gray-50 p-4">
                <QuestionTagger 
                  question={question}
                  onTagsUpdated={() => {
                    // Optionally close the expanded view after tagging
                    // setExpandedQuestion(null)
                  }}
                />
              </div>
            )}
          </div>
        ))}
      </div>

      {filteredQuestions.length === 0 && filter !== 'all' && (
        <div className="text-center py-8 text-gray-500">
          <p>No {filter} questions found</p>
        </div>
      )}
    </div>
  )
}