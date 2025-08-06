-- Curriculum Tagging Tool Database Schema
-- Run this in your Supabase SQL editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- profiles table
CREATE TABLE profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT,
    subject TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- curriculums table
CREATE TABLE curriculums (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    concepts JSONB DEFAULT '[]'::jsonb,
    learning_goals JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- questions table
CREATE TABLE questions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    source_type TEXT CHECK (source_type IN ('text', 'image', 'pdf')) DEFAULT 'text',
    tags JSONB DEFAULT '{}'::jsonb,
    raw_file_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Indexes for better performance
CREATE INDEX idx_curriculums_profile_id ON curriculums(profile_id);
CREATE INDEX idx_questions_profile_id ON questions(profile_id);
CREATE INDEX idx_questions_source_type ON questions(source_type);
CREATE INDEX idx_questions_tags ON questions USING GIN(tags);

-- RLS (Row Level Security) policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE curriculums ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;

-- For now, allow all operations (we'll implement proper auth later)
CREATE POLICY "Allow all operations on profiles" ON profiles FOR ALL USING (true);
CREATE POLICY "Allow all operations on curriculums" ON curriculums FOR ALL USING (true);
CREATE POLICY "Allow all operations on questions" ON questions FOR ALL USING (true);