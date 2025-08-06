# 📚 Curriculum Tagging Tool

A lightweight tool for teachers to upload curriculum and manage questions with learning goal alignment.

## 🚀 Features

### ✅ Block 1: Teacher Profile (Local + Supabase Sync)
- **No sign-in required** - Local cache only in MVP
- Store basic teacher info (name, subject, curriculum)
- Save UUID in browser with persistent storage
- Sync data to Supabase for persistence
- Real-time sync status indicator

### ✅ Block 2: Curriculum Upload + Learning Goals Extraction
- **PDF/JSON upload** with drag-and-drop interface
- Extract learning goals, concepts, and organize into strands
- **Mock curriculum parsing** (ready for real PDF parsing)
- **Subject-based sample curricula** for testing
- Expandable UI for curriculum structure visualization
- Save to Supabase + local storage

### ✅ Block 3: Question Upload (Text / Image / PDF)
- **Multiple input methods:**
  - Direct text input
  - Image upload with OCR (Tesseract.js)
  - PDF upload with text extraction
- **Smart text extraction** with preprocessing
- Preview and edit extracted text before saving
- Question validation and format detection

### ✅ Block 4: Auto-Tagging Questions with Curriculum Tags
- **Intelligent matching** using:
  - Keyword overlap analysis
  - Text similarity scoring
  - Subject-specific pattern recognition
- **Manual tag management:**
  - Approve/reject suggested tags
  - Add custom concepts and learning goals
  - Edit and remove tags
- **Confidence scoring** (high/medium/low)
- Visual feedback with score indicators

### ✅ Block 5: Question Dashboard
- **Comprehensive question library** with:
  - Filter by source type (text/image/PDF)
  - Tag-based filtering
  - Search and organization
- **Rich question display:**
  - Source type indicators
  - Tag visualization
  - Sync status tracking
  - Quick edit and delete actions
- **Expandable tagging interface** for each question

### ✅ Block 6: Supabase Sync
- **Full data synchronization:**
  - Profile sync with conflict resolution
  - Curriculum backup and restore
  - Question library cloud storage
- **Offline/online support:**
  - Local-first architecture
  - Background sync capabilities
  - Connection status monitoring
- **Manual and automatic sync** options

## 🛠️ Technology Stack

- **Frontend:** Next.js 14, React 18, TypeScript
- **Styling:** Tailwind CSS
- **State Management:** Zustand with persistence
- **Database:** Supabase (PostgreSQL)
- **OCR:** Tesseract.js
- **File Handling:** react-dropzone
- **PDF Processing:** pdf-parse (ready for integration)

## 📋 Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account and project

## 🔧 Setup Instructions

### 1. Clone and Install Dependencies

```bash
git clone <repository-url>
cd curriculum-tagging-tool
npm install
```

### 2. Environment Configuration

Create a `.env.local` file with your Supabase credentials:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://spajcwdxktqhmkkkhwrh.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here

# Optional: Service Role Key (for server-side operations)
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Optional: OpenAI API Key (for enhanced embeddings)
OPENAI_API_KEY=your_openai_api_key_here
```

### 3. Database Setup

Run the provided SQL schema in your Supabase SQL editor:

```sql
-- Copy contents from supabase-schema.sql
-- This creates tables for profiles, curriculums, and questions
```

### 4. Start Development Server

```bash
npm run dev
```

Visit `http://localhost:3000` to start using the application.

## 📊 Database Schema

### Profiles Table
```sql
CREATE TABLE profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT,
    subject TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

### Curriculums Table
```sql
CREATE TABLE curriculums (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    concepts JSONB DEFAULT '[]'::jsonb,
    learning_goals JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

### Questions Table
```sql
CREATE TABLE questions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    source_type TEXT CHECK (source_type IN ('text', 'image', 'pdf')),
    tags JSONB DEFAULT '{}'::jsonb,
    raw_file_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

## 🎯 Usage Guide

### Getting Started
1. **Create Profile:** Set up your teacher profile with name and subject
2. **Upload Curriculum:** Use sample curricula or upload your own PDF
3. **Add Questions:** Input questions via text, images, or PDF files
4. **Review Tags:** Approve auto-generated tags or add custom ones
5. **Sync to Cloud:** Back up your data to Supabase

### Auto-Tagging Process
1. Upload or input a question
2. System analyzes text for concept and learning goal matches
3. Review suggested tags with confidence scores
4. Approve, edit, or add custom tags
5. Save tagged question to library

### Sync Features
- **Local-first:** All data works offline
- **Cloud backup:** Sync to Supabase when online
- **Conflict resolution:** Smart merging of local and remote data
- **Status indicators:** Know what's synced and what's pending

## 🔮 Future Enhancements

- **Real PDF parsing** with pdf-poppler integration
- **Advanced embedding** using OpenAI GPT models
- **Collaborative features** for teacher teams
- **Assessment generation** from tagged questions
- **Analytics dashboard** for curriculum coverage
- **Mobile app** with offline support

## 🤝 Contributing

This is an educational project demonstrating modern web development practices. Feel free to:
- Report issues
- Suggest improvements
- Submit pull requests
- Use as learning material

## 📄 License

MIT License - feel free to use this project for educational purposes.

---

**Built with ❤️ for educators everywhere**