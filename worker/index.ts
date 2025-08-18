import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { sessionMiddleware, CookieStore, Session } from 'hono-sessions';

interface Question {
  id: number;
  question: string;
  options: string[];
  correctAnswer: number;
}

interface QuizSession {
  id: string;
  currentQuestionIndex: number;
  answers: number[];
  startTime: number;
  completed: boolean;
}

interface Env {
  DB: D1Database;
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

// Helper function to get all questions from D1
async function getAllQuestions(db: D1Database): Promise<Question[]> {
  const { results } = await db.prepare(`
    SELECT id, question, option_a, option_b, option_c, option_d, correct_answer 
    FROM questions 
    ORDER BY id
  `).all();
  
  return results.map((row: any) => ({
    id: row.id as number,
    question: row.question as string,
    options: [row.option_a, row.option_b, row.option_c, row.option_d] as string[],
    correctAnswer: row.correct_answer as number
  }));
}

// Helper function to get a specific question by index
async function getQuestionByIndex(db: D1Database, index: number): Promise<Question | null> {
  const { results } = await db.prepare(`
    SELECT id, question, option_a, option_b, option_c, option_d, correct_answer 
    FROM questions 
    ORDER BY id 
    LIMIT 1 OFFSET ?
  `).bind(index).all();
  
  if (results.length === 0) return null;
  
  const row = results[0] as any;
  return {
    id: row.id as number,
    question: row.question as string,
    options: [row.option_a, row.option_b, row.option_c, row.option_d] as string[],
    correctAnswer: row.correct_answer as number
  };
}

// Helper function to get total question count
async function getQuestionCount(db: D1Database): Promise<number> {
  const result = await db.prepare('SELECT COUNT(*) as count FROM questions').first();
  return (result as any).count as number;
}

app.post('/api/quiz/start', async (c) => {
  const session = c.get('session');
  const db = c.env.DB;
  
  try {
    const totalQuestions = await getQuestionCount(db);
    
    const quizSession: QuizSession = {
      id: crypto.randomUUID(),
      currentQuestionIndex: 0,
      answers: [],
      startTime: Date.now(),
      completed: false
    };
    
    // Store session in D1
    await db.prepare(`
      INSERT INTO quiz_sessions (id, current_question_index, answers, start_time, completed)
      VALUES (?, ?, ?, ?, ?)
    `).bind(
      quizSession.id,
      quizSession.currentQuestionIndex,
      JSON.stringify(quizSession.answers),
      quizSession.startTime,
      quizSession.completed
    ).run();
    
    session.set('quizSessionId', quizSession.id);
    
    return c.json({ 
      started: true,
      totalQuestions
    });
  } catch (error) {
    console.error('Error starting quiz:', error);
    return c.json({ error: 'Failed to start quiz' }, 500);
  }
});

app.get('/api/quiz/question', async (c) => {
  const session = c.get('session');
  const db = c.env.DB;
  const quizSessionId = session.get('quizSessionId') as string;
  
  if (!quizSessionId) {
    return c.json({ error: 'No active quiz session' }, 404);
  }
  
  try {
    // Get quiz session from D1
    const result = await db.prepare(`
      SELECT current_question_index, answers, completed 
      FROM quiz_sessions 
      WHERE id = ?
    `).bind(quizSessionId).first();
    
    if (!result) {
      return c.json({ error: 'No active quiz session' }, 404);
    }
    
    const quizSession = {
      currentQuestionIndex: (result as any).current_question_index as number,
      answers: JSON.parse((result as any).answers || '[]'),
      completed: (result as any).completed as boolean
    };
    
    if (quizSession.completed) {
      return c.json({ error: 'Quiz already completed' }, 400);
    }
    
    const totalQuestions = await getQuestionCount(db);
    
    if (quizSession.currentQuestionIndex >= totalQuestions) {
      return c.json({ error: 'No more questions' }, 400);
    }
    
    const question = await getQuestionByIndex(db, quizSession.currentQuestionIndex);
    
    if (!question) {
      return c.json({ error: 'Question not found' }, 404);
    }
    
    return c.json({
      question: {
        id: question.id,
        question: question.question,
        options: question.options
      },
      currentQuestion: quizSession.currentQuestionIndex + 1,
      totalQuestions
    });
  } catch (error) {
    console.error('Error loading question:', error);
    return c.json({ error: 'Failed to load question' }, 500);
  }
});

app.post('/api/quiz/answer', async (c) => {
  const session = c.get('session');
  const db = c.env.DB;
  const body = await c.req.json();
  const { answer } = body;
  
  if (typeof answer !== 'number') {
    return c.json({ error: 'Invalid answer format' }, 400);
  }
  
  const quizSessionId = session.get('quizSessionId') as string;
  
  if (!quizSessionId) {
    return c.json({ error: 'No active quiz session' }, 404);
  }
  
  try {
    // Get current quiz session from D1
    const result = await db.prepare(`
      SELECT current_question_index, answers, completed 
      FROM quiz_sessions 
      WHERE id = ?
    `).bind(quizSessionId).first();
    
    if (!result) {
      return c.json({ error: 'No active quiz session' }, 404);
    }
    
    const quizSession = {
      currentQuestionIndex: (result as any).current_question_index as number,
      answers: JSON.parse((result as any).answers || '[]'),
      completed: (result as any).completed as boolean
    };
    
    if (quizSession.completed) {
      return c.json({ error: 'Quiz already completed' }, 400);
    }
    
    const totalQuestions = await getQuestionCount(db);
    
    if (quizSession.currentQuestionIndex >= totalQuestions) {
      return c.json({ error: 'No more questions' }, 400);
    }
    
    // Update answers and move to next question
    quizSession.answers.push(answer);
    quizSession.currentQuestionIndex++;
    
    const isCompleted = quizSession.currentQuestionIndex >= totalQuestions;
    if (isCompleted) {
      quizSession.completed = true;
    }
    
    // Update session in D1
    await db.prepare(`
      UPDATE quiz_sessions 
      SET current_question_index = ?, answers = ?, completed = ?
      WHERE id = ?
    `).bind(
      quizSession.currentQuestionIndex,
      JSON.stringify(quizSession.answers),
      quizSession.completed,
      quizSessionId
    ).run();
    
    return c.json({
      success: true,
      completed: isCompleted,
      nextQuestion: isCompleted ? null : quizSession.currentQuestionIndex + 1
    });
  } catch (error) {
    console.error('Error submitting answer:', error);
    return c.json({ error: 'Failed to submit answer' }, 500);
  }
});

app.get('/api/quiz/results', async (c) => {
  const session = c.get('session');
  const db = c.env.DB;
  const quizSessionId = session.get('quizSessionId') as string;
  
  if (!quizSessionId) {
    return c.json({ error: 'No quiz session found' }, 404);
  }
  
  try {
    // Get quiz session from D1
    const result = await db.prepare(`
      SELECT answers, start_time, completed 
      FROM quiz_sessions 
      WHERE id = ?
    `).bind(quizSessionId).first();
    
    if (!result) {
      return c.json({ error: 'No quiz session found' }, 404);
    }
    
    if (!(result as any).completed) {
      return c.json({ error: 'Quiz not completed yet' }, 400);
    }
    
    const answers = JSON.parse((result as any).answers || '[]');
    const startTime = (result as any).start_time as number;
    
    // Get all questions to calculate results
    const questions = await getAllQuestions(db);
    
    let correctAnswers = 0;
    const answerDetails = [];
    
    for (let i = 0; i < answers.length && i < questions.length; i++) {
      const isCorrect = answers[i] === questions[i].correctAnswer;
      if (isCorrect) {
        correctAnswers++;
      }
      
      answerDetails.push({
        questionIndex: i,
        userAnswer: answers[i],
        correctAnswer: questions[i].correctAnswer,
        correct: isCorrect
      });
    }
    
    const percentage = Math.round((correctAnswers / questions.length) * 100);
    
    return c.json({
      totalQuestions: questions.length,
      correctAnswers,
      percentage,
      completionTime: Date.now() - startTime,
      answers: answerDetails
    });
  } catch (error) {
    console.error('Error loading results:', error);
    return c.json({ error: 'Failed to load results' }, 500);
  }
});

export default app;