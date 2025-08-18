-- Seed questions for AI Literacy Quiz
-- Migration: 0002_seed_questions.sql

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