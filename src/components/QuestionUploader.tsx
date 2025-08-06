'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { useQuestionStore } from '@/stores/questionStore'
import { useCurriculumStore } from '@/stores/curriculumStore'
import { 
  extractTextFromImage, 
  extractTextFromPDFImage, 
  preprocessExtractedText,
  extractQuestionFromText,
  isValidQuestion
} from '@/utils/ocrUtils'

type UploadMethod = 'text' | 'image' | 'pdf'

export default function QuestionUploader() {
  const { addQuestion } = useQuestionStore()
  const { curriculum } = useCurriculumStore()
  const [activeMethod, setActiveMethod] = useState<UploadMethod>('text')
  const [questionText, setQuestionText] = useState('')
  const [extractedText, setExtractedText] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [processProgress, setProcessProgress] = useState(0)
  const [uploadStatus, setUploadStatus] = useState('')
  const [previewFile, setPreviewFile] = useState<string | null>(null)

  // Text input submission
  const handleTextSubmit = () => {
    if (!questionText.trim()) {
      setUploadStatus('❌ Please enter a question')
      return
    }

    if (!isValidQuestion(questionText)) {
      setUploadStatus('⚠️ This doesn\'t look like a question. Continue anyway?')
      return
    }

    addQuestion({
      question_text: questionText.trim(),
      source_type: 'text',
      tags: { concepts: [], learning_goals: [] }
    })

    setQuestionText('')
    setUploadStatus('✅ Question added successfully!')
    setTimeout(() => setUploadStatus(''), 3000)
  }

  // File upload handlers
  const onDropImage = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return
    
    const file = acceptedFiles[0]
    setIsProcessing(true)
    setProcessProgress(0)
    setUploadStatus('Processing image...')
    setPreviewFile(URL.createObjectURL(file))

    try {
      const rawText = await extractTextFromImage(file, (progress) => {
        setProcessProgress(progress)
      })
      
      const processedText = preprocessExtractedText(rawText)
      const extractedQuestion = extractQuestionFromText(processedText) || processedText
      
      setExtractedText(extractedQuestion)
      setUploadStatus('✅ Text extracted! Please review and edit if needed.')
    } catch (error) {
      console.error('Error processing image:', error)
      setUploadStatus('❌ Error processing image. Please try again.')
    } finally {
      setIsProcessing(false)
      setProcessProgress(0)
    }
  }, [])

  const onDropPDF = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return
    
    const file = acceptedFiles[0]
    setIsProcessing(true)
    setProcessProgress(0)
    setUploadStatus('Processing PDF...')

    try {
      const rawText = await extractTextFromPDFImage(file, (progress) => {
        setProcessProgress(progress)
      })
      
      const processedText = preprocessExtractedText(rawText)
      const extractedQuestion = extractQuestionFromText(processedText) || processedText
      
      setExtractedText(extractedQuestion)
      setUploadStatus('✅ Text extracted! Please review and edit if needed.')
    } catch (error) {
      console.error('Error processing PDF:', error)
      setUploadStatus('❌ Error processing PDF. Please try again.')
    } finally {
      setIsProcessing(false)
      setProcessProgress(0)
    }
  }, [])

  const { getRootProps: getImageProps, getInputProps: getImageInputProps, isDragActive: isImageDragActive } = useDropzone({
    onDrop: onDropImage,
    accept: {
      'image/*': ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp']
    },
    maxFiles: 1,
    disabled: isProcessing
  })

  const { getRootProps: getPDFProps, getInputProps: getPDFInputProps, isDragActive: isPDFDragActive } = useDropzone({
    onDrop: onDropPDF,
    accept: {
      'application/pdf': ['.pdf']
    },
    maxFiles: 1,
    disabled: isProcessing
  })

  // Save extracted question
  const handleSaveExtracted = () => {
    if (!extractedText.trim()) {
      setUploadStatus('❌ No text to save')
      return
    }

    addQuestion({
      question_text: extractedText.trim(),
      source_type: activeMethod === 'image' ? 'image' : 'pdf',
      raw_file_url: previewFile || undefined,
      tags: { concepts: [], learning_goals: [] }
    })

    // Reset form
    setExtractedText('')
    setPreviewFile(null)
    setUploadStatus('✅ Question added successfully!')
    setTimeout(() => setUploadStatus(''), 3000)
  }

  // Clear current upload
  const handleClear = () => {
    setExtractedText('')
    setPreviewFile(null)
    setUploadStatus('')
    setProcessProgress(0)
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold mb-4">❓ Question Upload</h2>
      
      {!curriculum && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <span className="text-yellow-400">⚠️</span>
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                <strong>Upload a curriculum first</strong> to enable automatic tagging of questions with learning goals.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Method Selection */}
      <div className="flex space-x-1 mb-6 bg-gray-100 p-1 rounded-lg">
        {[
          { id: 'text', label: '📝 Text Input', icon: '📝' },
          { id: 'image', label: '🖼️ Image Upload', icon: '🖼️' },
          { id: 'pdf', label: '📄 PDF Upload', icon: '📄' }
        ].map((method) => (
          <button
            key={method.id}
            onClick={() => {
              setActiveMethod(method.id as UploadMethod)
              handleClear()
            }}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeMethod === method.id
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {method.label}
          </button>
        ))}
      </div>

      {/* Content based on active method */}
      {activeMethod === 'text' && (
        <div className="space-y-4">
          <div>
            <label htmlFor="question-text" className="block text-sm font-medium text-gray-700 mb-2">
              Enter your question:
            </label>
            <textarea
              id="question-text"
              value={questionText}
              onChange={(e) => setQuestionText(e.target.value)}
              className="w-full h-32 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Type your question here..."
            />
          </div>
          
          <button
            onClick={handleTextSubmit}
            disabled={!questionText.trim()}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            Add Question
          </button>
        </div>
      )}

      {activeMethod === 'image' && (
        <div className="space-y-4">
          <div
            {...getImageProps()}
            className={`
              border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
              ${isImageDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}
              ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}
            `}
          >
            <input {...getImageInputProps()} />
            <div className="space-y-4">
              <div className="text-4xl">🖼️</div>
              {isImageDragActive ? (
                <p className="text-blue-600">Drop the image here...</p>
              ) : (
                <div>
                  <p className="text-lg font-medium text-gray-900">
                    Upload Question Image
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    Drag and drop an image here, or click to select
                  </p>
                  <p className="text-xs text-gray-400 mt-2">
                    Supports: JPG, PNG, GIF, WebP (max 10MB)
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Image Preview */}
          {previewFile && (
            <div className="border rounded-lg p-4">
              <h4 className="font-medium mb-2">Uploaded Image:</h4>
              <img 
                src={previewFile} 
                alt="Uploaded question" 
                className="max-w-full max-h-64 object-contain mx-auto"
              />
            </div>
          )}
        </div>
      )}

      {activeMethod === 'pdf' && (
        <div className="space-y-4">
          <div
            {...getPDFProps()}
            className={`
              border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
              ${isPDFDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}
              ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}
            `}
          >
            <input {...getPDFInputProps()} />
            <div className="space-y-4">
              <div className="text-4xl">📄</div>
              {isPDFDragActive ? (
                <p className="text-blue-600">Drop the PDF here...</p>
              ) : (
                <div>
                  <p className="text-lg font-medium text-gray-900">
                    Upload Question PDF
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    Drag and drop a PDF here, or click to select
                  </p>
                  <p className="text-xs text-gray-400 mt-2">
                    First page will be processed with OCR (max 10MB)
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Processing Status */}
      {isProcessing && (
        <div className="mt-4 space-y-2">
          <div className="flex items-center justify-center gap-3 text-blue-600">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
            <span>Processing {activeMethod}...</span>
          </div>
          {processProgress > 0 && (
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${processProgress * 100}%` }}
              ></div>
            </div>
          )}
        </div>
      )}

      {/* Extracted Text Editor */}
      {extractedText && !isProcessing && (
        <div className="mt-6 space-y-4 border-t pt-6">
          <div>
            <label htmlFor="extracted-text" className="block text-sm font-medium text-gray-700 mb-2">
              Extracted Text (edit if needed):
            </label>
            <textarea
              id="extracted-text"
              value={extractedText}
              onChange={(e) => setExtractedText(e.target.value)}
              className="w-full h-32 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Edit the extracted question text..."
            />
          </div>
          
          <div className="flex gap-3">
            <button
              onClick={handleSaveExtracted}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
            >
              Save Question
            </button>
            <button
              onClick={handleClear}
              className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* Status Messages */}
      {uploadStatus && (
        <div className={`mt-4 p-3 rounded-lg text-sm ${
          uploadStatus.includes('✅') ? 'bg-green-50 text-green-700' :
          uploadStatus.includes('❌') ? 'bg-red-50 text-red-700' :
          uploadStatus.includes('⚠️') ? 'bg-yellow-50 text-yellow-700' :
          'bg-blue-50 text-blue-700'
        }`}>
          {uploadStatus}
        </div>
      )}
    </div>
  )
}