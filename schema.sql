-- AI Literacy Quiz Database Schema

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

-- Insert sample questions
INSERT INTO questions (question, option_a, option_b, option_c, option_d, correct_answer) VALUES
('What does AI stand for?', 'Artificial Intelligence', 'Automated Information', 'Advanced Integration', 'Algorithmic Interface', 0),
('Which of the following is a type of machine learning?', 'Supervised Learning', 'Creative Writing', 'Data Mining', 'Web Development', 0),
('What is a neural network inspired by?', 'Computer circuits', 'The human brain', 'Mathematical equations', 'Internet protocols', 1),
('Which company developed ChatGPT?', 'Google', 'Microsoft', 'OpenAI', 'Meta', 2),
('What does NLP stand for in AI?', 'Neural Language Processing', 'Natural Language Processing', 'Network Learning Protocol', 'Numerical Logic Programming', 1),
('What is deep learning?', 'A type of sleep', 'A subset of machine learning using neural networks', 'A programming language', 'A database system', 1),
('Which of these is NOT a common AI application?', 'Image recognition', 'Natural language processing', 'Cooking recipes', 'Autonomous vehicles', 2),
('What is the Turing Test used for?', 'Testing computer speed', 'Evaluating AI intelligence', 'Measuring internet speed', 'Testing software bugs', 1),
('What does GPT stand for?', 'General Purpose Technology', 'Generative Pre-trained Transformer', 'Global Processing Tool', 'Graphical Programming Tool', 1),
('Which programming language is commonly used in AI?', 'Python', 'HTML', 'CSS', 'JavaScript', 0);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_questions_id ON questions(id);
CREATE INDEX IF NOT EXISTS idx_quiz_sessions_id ON quiz_sessions(id);
CREATE INDEX IF NOT EXISTS idx_quiz_sessions_completed ON quiz_sessions(completed);
