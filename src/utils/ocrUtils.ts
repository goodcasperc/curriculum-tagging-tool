// OCR utilities using Tesseract.js for text extraction from images and PDFs

import { createWorker, PSM, Worker } from 'tesseract.js'

// Initialize OCR worker
let ocrWorker: Worker | null = null

export async function initializeOCR(): Promise<Worker> {
  if (ocrWorker) {
    return ocrWorker
  }

  ocrWorker = await createWorker('eng')
  
  return ocrWorker
}

// Extract text from image file
export async function extractTextFromImage(
  file: File, 
  onProgress?: (progress: number) => void
): Promise<string> {
  try {
    const worker = await initializeOCR()
    
    // Create image URL
    const imageUrl = URL.createObjectURL(file)
    
    // Configure OCR options
    await worker.setParameters({
      tessedit_pageseg_mode: PSM.AUTO,
    })
    
    // Extract text
    const { data: { text } } = await worker.recognize(imageUrl)
    
    // Cleanup
    URL.revokeObjectURL(imageUrl)
    
    return text.trim()
  } catch (error) {
    console.error('Error extracting text from image:', error)
    throw new Error('Failed to extract text from image')
  }
}

// Extract text from PDF (first page)
export async function extractTextFromPDFImage(
  file: File,
  onProgress?: (progress: number) => void
): Promise<string> {
  try {
    // For PDFs, we need to convert to image first
    // This is a simplified implementation - in production, you might use pdf-poppler or similar
    
    // For now, we'll just extract text from the file if it's actually an image
    // In a real implementation, you'd convert PDF pages to images first
    
    const worker = await initializeOCR()
    const imageUrl = URL.createObjectURL(file)
    
    const { data: { text } } = await worker.recognize(imageUrl)
    
    URL.revokeObjectURL(imageUrl)
    return text.trim()
  } catch (error) {
    console.error('Error extracting text from PDF:', error)
    throw new Error('Failed to extract text from PDF')
  }
}

// Clean up OCR worker
export async function cleanupOCR(): Promise<void> {
  if (ocrWorker) {
    await ocrWorker.terminate()
    ocrWorker = null
  }
}

// Preprocess text for better accuracy
export function preprocessExtractedText(text: string): string {
  return text
    .replace(/\s+/g, ' ') // Replace multiple whitespace with single space
    .replace(/[^\w\s.,!?;:()\-]/g, '') // Remove special characters except common punctuation
    .trim()
}

// Extract question from text (basic pattern matching)
export function extractQuestionFromText(text: string): string | null {
  // Look for question patterns
  const questionPatterns = [
    /\d+[\.)]\s*(.+?\?)/gi, // Numbered questions ending with ?
    /^(.+?\?)$/gm, // Lines ending with ?
    /Question\s*\d*[:\.]?\s*(.+?)(?=\n|$)/gi, // Text starting with "Question"
    /^(.{10,}?\?)(?=\s|$)/gm, // Any text ending with ? that's at least 10 chars
  ]
  
  for (const pattern of questionPatterns) {
    const matches = text.match(pattern)
    if (matches && matches.length > 0) {
      // Return the first substantial question found
      const question = matches[0].replace(/^\d+[\.)]\s*/, '').trim()
      if (question.length > 5) {
        return question
      }
    }
  }
  
  // If no specific question pattern found, return the text if it seems like a question
  if (text.includes('?') && text.length > 10) {
    return text.trim()
  }
  
  return null
}

// Validate if extracted text looks like a question
export function isValidQuestion(text: string): boolean {
  if (!text || text.length < 5) return false
  
  // Check for question indicators
  const questionIndicators = ['?', 'what', 'how', 'why', 'when', 'where', 'which', 'who']
  const lowerText = text.toLowerCase()
  
  return questionIndicators.some(indicator => lowerText.includes(indicator))
}