import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { sessionMiddleware, CookieStore, Session } from 'hono-sessions';

interface Question {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
}

interface QuizSession {
  currentQuestionIndex: number;
  answers: number[];
  startTime: number;
  completed: boolean;
}

const app = new Hono<{ 
  Bindings: Env;
  Variables: {
    session: Session;
    session_key_rotation: boolean;
  };
}>();

app.use('*', cors());

const store = new CookieStore();

app.use(
  '*',
  sessionMiddleware({
    store,
    encryptionKey: 'quiz-app-secret-key-change-in-production',
    expireAfterSeconds: 900,
    cookieOptions: {
      sameSite: 'Lax',
      secure: false,
      httpOnly: true,
    },
  })
);

const QUESTIONS: Question[] = [
  {
    id: '1',
    question: 'What does AI stand for?',
    options: ['Artificial Intelligence', 'Automated Information', 'Advanced Integration', 'Algorithmic Interface'],
    correctAnswer: 0
  },
  {
    id: '2',
    question: 'Which of the following is a type of machine learning?',
    options: ['Supervised Learning', 'Creative Writing', 'Data Mining', 'Web Development'],
    correctAnswer: 0
  },
  {
    id: '3',
    question: 'What is a neural network inspired by?',
    options: ['Computer circuits', 'The human brain', 'Mathematical equations', 'Internet protocols'],
    correctAnswer: 1
  },
  {
    id: '4',
    question: 'Which company developed ChatGPT?',
    options: ['Google', 'Microsoft', 'OpenAI', 'Meta'],
    correctAnswer: 2
  },
  {
    id: '5',
    question: 'What does NLP stand for in AI?',
    options: ['Neural Language Processing', 'Natural Language Processing', 'Network Learning Protocol', 'Numerical Logic Programming'],
    correctAnswer: 1
  }
];

app.post('/api/quiz/start', async (c) => {
  const session = c.get('session');
  
  const quizSession: QuizSession = {
    currentQuestionIndex: 0,
    answers: [],
    startTime: Date.now(),
    completed: false
  };
  
  session.set('quiz', quizSession);
  
  return c.json({ 
    started: true,
    totalQuestions: QUESTIONS.length
  });
});

app.get('/api/quiz/question', async (c) => {
  const session = c.get('session');
  const quizSession = session.get('quiz') as QuizSession;
  
  if (!quizSession) {
    return c.json({ error: 'No active quiz session' }, 404);
  }
  
  if (quizSession.completed) {
    return c.json({ error: 'Quiz already completed' }, 400);
  }
  
  if (quizSession.currentQuestionIndex >= QUESTIONS.length) {
    return c.json({ error: 'No more questions' }, 400);
  }
  
  const question = QUESTIONS[quizSession.currentQuestionIndex];
  
  return c.json({
    question: {
      id: question.id,
      question: question.question,
      options: question.options
    },
    currentQuestion: quizSession.currentQuestionIndex + 1,
    totalQuestions: QUESTIONS.length
  });
});

app.post('/api/quiz/answer', async (c) => {
  const session = c.get('session');
  const body = await c.req.json();
  const { answer } = body;
  
  if (typeof answer !== 'number') {
    return c.json({ error: 'Invalid answer format' }, 400);
  }
  
  const quizSession = session.get('quiz') as QuizSession;
  
  if (!quizSession) {
    return c.json({ error: 'No active quiz session' }, 404);
  }
  
  if (quizSession.completed) {
    return c.json({ error: 'Quiz already completed' }, 400);
  }
  
  if (quizSession.currentQuestionIndex >= QUESTIONS.length) {
    return c.json({ error: 'No more questions' }, 400);
  }
  
  quizSession.answers.push(answer);
  quizSession.currentQuestionIndex++;
  
  const isCompleted = quizSession.currentQuestionIndex >= QUESTIONS.length;
  if (isCompleted) {
    quizSession.completed = true;
  }
  
  session.set('quiz', quizSession);
  
  return c.json({
    success: true,
    completed: isCompleted,
    nextQuestion: isCompleted ? null : quizSession.currentQuestionIndex + 1
  });
});

app.get('/api/quiz/results', async (c) => {
  const session = c.get('session');
  const quizSession = session.get('quiz') as QuizSession;
  
  if (!quizSession) {
    return c.json({ error: 'No quiz session found' }, 404);
  }
  
  if (!quizSession.completed) {
    return c.json({ error: 'Quiz not completed yet' }, 400);
  }
  
  let correctAnswers = 0;
  for (let i = 0; i < quizSession.answers.length; i++) {
    if (quizSession.answers[i] === QUESTIONS[i].correctAnswer) {
      correctAnswers++;
    }
  }
  
  const percentage = Math.round((correctAnswers / QUESTIONS.length) * 100);
  
  return c.json({
    totalQuestions: QUESTIONS.length,
    correctAnswers,
    percentage,
    completionTime: Date.now() - quizSession.startTime,
    answers: quizSession.answers.map((answer, index) => ({
      questionIndex: index,
      userAnswer: answer,
      correctAnswer: QUESTIONS[index].correctAnswer,
      correct: answer === QUESTIONS[index].correctAnswer
    }))
  });
});

export default app;