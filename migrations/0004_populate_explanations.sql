-- Populate explanations for existing questions
-- Migration: 0004_populate_explanations.sql

UPDATE questions SET explanation = 'AI stands for Artificial Intelligence, which refers to computer systems that can perform tasks typically requiring human intelligence.' WHERE question = 'What does AI stand for?';

UPDATE questions SET explanation = 'Supervised Learning is a type of machine learning where the algorithm learns from labeled training data to make predictions on new data.' WHERE question = 'Which of the following is a type of machine learning?';

UPDATE questions SET explanation = 'Neural networks are inspired by the human brain''s network of neurons, mimicking how biological neurons process and transmit information.' WHERE question = 'What is a neural network inspired by?';

UPDATE questions SET explanation = 'ChatGPT was developed by OpenAI, an AI research company founded in 2015 that focuses on developing safe artificial intelligence.' WHERE question = 'Which company developed ChatGPT?';

UPDATE questions SET explanation = 'NLP stands for Natural Language Processing, which is the branch of AI that helps computers understand, interpret, and generate human language.' WHERE question = 'What does NLP stand for in AI?';

UPDATE questions SET explanation = 'Deep learning is a subset of machine learning that uses neural networks with multiple layers (hence "deep") to learn complex patterns in data.' WHERE question = 'What is deep learning?';

UPDATE questions SET explanation = 'While AI is used for image recognition, natural language processing, and autonomous vehicles, cooking recipes are not typically considered an AI application.' WHERE question = 'Which of these is NOT a common AI application?';

UPDATE questions SET explanation = 'The Turing Test, proposed by Alan Turing in 1950, is used to evaluate whether a machine can exhibit intelligent behavior indistinguishable from a human.' WHERE question = 'What is the Turing Test used for?';

UPDATE questions SET explanation = 'GPT stands for Generative Pre-trained Transformer, which describes the architecture and training method used to create these language models.' WHERE question = 'What does GPT stand for?';

UPDATE questions SET explanation = 'Python is the most commonly used programming language in AI due to its simplicity and extensive libraries like TensorFlow, PyTorch, and scikit-learn.' WHERE question = 'Which programming language is commonly used in AI?';