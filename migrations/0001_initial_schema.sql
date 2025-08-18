-- Initial schema for AI Literacy Quiz Database
-- Migration: 0001_initial_schema.sql

-- Questions table
CREATE TABLE IF NOT EXISTS questions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    question TEXT NOT NULL,
    option_a TEXT NOT NULL,
    option_b TEXT NOT NULL,
    option_c TEXT NOT NULL,
    option_d TEXT NOT NULL,
    correct_answer INTEGER NOT NULL CHECK (correct_answer >= 0 AND correct_answer <= 3),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Quiz sessions table
CREATE TABLE IF NOT EXISTS quiz_sessions (
    id TEXT PRIMARY KEY,
    current_question_index INTEGER DEFAULT 0,
    answers TEXT, -- JSON array of answers
    start_time INTEGER NOT NULL,
    completed BOOLEAN DEFAULT FALSE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_questions_id ON questions(id);
CREATE INDEX IF NOT EXISTS idx_quiz_sessions_id ON quiz_sessions(id);
CREATE INDEX IF NOT EXISTS idx_quiz_sessions_completed ON quiz_sessions(completed);