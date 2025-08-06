// Auto-tagging utility for matching questions with curriculum concepts and learning goals

import { CurriculumData, Question, Concept, LearningGoal } from '@/types'

// Simple keyword extraction
export function extractKeywords(text: string): string[] {
  // Remove common stop words and extract meaningful keywords
  const stopWords = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
    'what', 'how', 'why', 'when', 'where', 'which', 'who', 'is', 'are', 'was', 'were', 'be',
    'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might',
    'this', 'that', 'these', 'those', 'can', 'if', 'then', 'than', 'from', 'up', 'out', 'as'
  ])

  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ') // Replace punctuation with spaces
    .split(/\s+/)
    .filter(word => word.length > 2 && !stopWords.has(word))
    .filter((word, index, arr) => arr.indexOf(word) === index) // Remove duplicates
}

// Calculate text similarity using simple word overlap
export function calculateSimilarity(text1: string, text2: string): number {
  const words1 = new Set(extractKeywords(text1))
  const words2 = new Set(extractKeywords(text2))
  
  const intersection = new Set([...words1].filter(word => words2.has(word)))
  const union = new Set([...words1, ...words2])
  
  return union.size > 0 ? intersection.size / union.size : 0
}

// Match concepts by keyword overlap
export function matchConceptsByKeywords(
  questionKeywords: string[], 
  concepts: Concept[]
): Array<{ concept: Concept; score: number }> {
  const matches: Array<{ concept: Concept; score: number }> = []
  
  for (const concept of concepts) {
    const conceptText = `${concept.name} ${concept.description || ''}`.toLowerCase()
    const conceptKeywords = extractKeywords(conceptText)
    
    // Calculate overlap score
    const overlap = questionKeywords.filter(keyword => 
      conceptKeywords.some(ck => ck.includes(keyword) || keyword.includes(ck))
    ).length
    
    if (overlap > 0) {
      const score = overlap / Math.max(questionKeywords.length, conceptKeywords.length)
      matches.push({ concept, score })
    }
  }
  
  return matches.sort((a, b) => b.score - a.score)
}

// Match learning goals by text similarity
export function matchLearningGoalsByText(
  questionText: string,
  learningGoals: LearningGoal[]
): Array<{ goal: LearningGoal; score: number }> {
  const matches: Array<{ goal: LearningGoal; score: number }> = []
  
  for (const goal of learningGoals) {
    const goalText = `${goal.name} ${goal.description}`
    const similarity = calculateSimilarity(questionText, goalText)
    
    if (similarity > 0.1) { // Minimum threshold
      matches.push({ goal, score: similarity })
    }
  }
  
  return matches.sort((a, b) => b.score - a.score)
}

// Subject-specific keyword patterns
const SUBJECT_PATTERNS: Record<string, RegExp[]> = {
  mathematics: [
    /equation|solve|calculate|find|determine/i,
    /graph|plot|function|linear|quadratic/i,
    /angle|triangle|circle|rectangle|area|volume/i,
    /fraction|decimal|percent|ratio|proportion/i,
    /algebra|variable|expression|simplify/i
  ],
  english: [
    /analyze|interpret|meaning|theme|character/i,
    /essay|paragraph|argument|persuade|convince/i,
    /metaphor|simile|imagery|symbolism|literary/i,
    /grammar|sentence|clause|phrase|punctuation/i,
    /read|write|author|text|passage/i
  ],
  science: [
    /experiment|hypothesis|theory|observation/i,
    /atom|molecule|element|chemical|reaction/i,
    /force|energy|motion|velocity|acceleration/i,
    /cell|organism|ecosystem|evolution|genetics/i,
    /earth|climate|weather|planet|solar/i
  ]
}

// Enhanced concept matching with subject-specific patterns
export function enhancedConceptMatching(
  questionText: string,
  concepts: Concept[],
  subject?: string
): Array<{ concept: Concept; score: number; reason: string }> {
  const keywords = extractKeywords(questionText)
  const basicMatches = matchConceptsByKeywords(keywords, concepts)
  
  const enhancedMatches = basicMatches.map(match => ({
    ...match,
    reason: 'Keyword overlap'
  }))
  
  // Apply subject-specific patterns if available
  if (subject && SUBJECT_PATTERNS[subject.toLowerCase()]) {
    const patterns = SUBJECT_PATTERNS[subject.toLowerCase()]
    
    for (const concept of concepts) {
      const conceptText = `${concept.name} ${concept.description || ''}`.toLowerCase()
      
      for (const pattern of patterns) {
        if (pattern.test(questionText) && pattern.test(conceptText)) {
          const existingMatch = enhancedMatches.find(m => m.concept.id === concept.id)
          
          if (existingMatch) {
            existingMatch.score += 0.2 // Boost score for pattern match
            existingMatch.reason = 'Keyword overlap + Subject pattern'
          } else {
            enhancedMatches.push({
              concept,
              score: 0.3,
              reason: 'Subject pattern match'
            })
          }
        }
      }
    }
  }
  
  return enhancedMatches
    .sort((a, b) => b.score - a.score)
    .slice(0, 5) // Top 5 matches
}

// Main tagging function
export async function tagQuestion(
  questionText: string,
  curriculum: CurriculumData | null,
  subject?: string
): Promise<{
  concepts: Array<{ id: string; name: string; score: number; reason: string }>
  learning_goals: Array<{ id: string; name: string; score: number; reason: string }>
  confidence: 'high' | 'medium' | 'low'
}> {
  if (!curriculum) {
    return {
      concepts: [],
      learning_goals: [],
      confidence: 'low'
    }
  }

  // Match concepts
  const conceptMatches = enhancedConceptMatching(questionText, curriculum.concepts, subject)
  const concepts = conceptMatches.map(match => ({
    id: match.concept.id,
    name: match.concept.name,
    score: match.score,
    reason: match.reason
  }))

  // Match learning goals
  const goalMatches = matchLearningGoalsByText(questionText, curriculum.learning_goals)
  const learning_goals = goalMatches.slice(0, 5).map(match => ({
    id: match.goal.id,
    name: match.goal.name,
    score: match.score,
    reason: 'Text similarity'
  }))

  // Determine confidence level
  let confidence: 'high' | 'medium' | 'low' = 'low'
  const maxConceptScore = Math.max(...concepts.map(c => c.score), 0)
  const maxGoalScore = Math.max(...learning_goals.map(g => g.score), 0)
  
  if (maxConceptScore > 0.6 || maxGoalScore > 0.4) {
    confidence = 'high'
  } else if (maxConceptScore > 0.3 || maxGoalScore > 0.2) {
    confidence = 'medium'
  }

  return {
    concepts: concepts.filter(c => c.score > 0.15), // Filter out very low scores
    learning_goals: learning_goals.filter(g => g.score > 0.1),
    confidence
  }
}

// Validate and format tags for storage
export function formatTagsForStorage(
  conceptIds: string[],
  learningGoalIds: string[]
): { concepts: string[]; learning_goals: string[] } {
  return {
    concepts: [...new Set(conceptIds)], // Remove duplicates
    learning_goals: [...new Set(learningGoalIds)]
  }
}

// Mock embedding function (placeholder for OpenAI integration)
export async function getEmbeddings(text: string): Promise<number[]> {
  // In a real implementation, this would call OpenAI's embedding API
  // For now, return a mock embedding based on text length and content
  const normalized = text.toLowerCase()
  const mockEmbedding = []
  
  for (let i = 0; i < 100; i++) {
    const charCode = normalized.charCodeAt(i % normalized.length) || 0
    mockEmbedding.push((charCode % 256) / 255 - 0.5)
  }
  
  return mockEmbedding
}

// Match by embedding similarity (placeholder implementation)
export async function matchByEmbeddings(
  questionEmbedding: number[],
  learningGoals: LearningGoal[]
): Promise<Array<{ goal: LearningGoal; similarity: number }>> {
  // Placeholder implementation
  // In a real app, this would compare vector embeddings
  return learningGoals.map(goal => ({
    goal,
    similarity: Math.random() * 0.8 + 0.1 // Mock similarity score
  })).sort((a, b) => b.similarity - a.similarity)
}