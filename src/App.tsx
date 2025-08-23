import { useState, useEffect } from 'react'
import './App.css'
import type { Question } from '../worker/index'
import aiAvenueLogo from './assets/ai-avenue-logo.svg'

interface QuizResults {
  totalQuestions: number;
  correctAnswers: number;
  percentage: number;
  completionTime: number;
  answers: AnswerDetail[];
}

interface AnswerDetail {
  questionIndex: number;
  userAnswer: number;
  correctAnswer: number;
  correct: boolean;
}

interface StartQuizResponse {
  started?: boolean;
  totalQuestions?: number;
  sessionId?: string;
  error?: string;
  canResume?: boolean;
}

interface SessionStatusResponse {
  hasActiveSession: boolean;
  sessionId?: string;
  currentQuestionIndex?: number;
  totalQuestions?: number;
  answeredQuestions?: number;
  completed?: boolean;
  canResume?: boolean;
  startTime?: number;
}

interface QuestionResponse {
  question: Question;
  currentQuestion: number;
  totalQuestions: number;
}

interface AnswerFeedback {
  correct: boolean;
  correctAnswer: number;
  explanation: string;
  userAnswer: number;
}

interface AnswerResponse {
  success: boolean;
  completed: boolean;
  nextQuestion: number | null;
  feedback: AnswerFeedback;
}

type QuizState = 'start' | 'question' | 'results';

function App() {
  const [quizState, setQuizState] = useState<QuizState>('start');
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [currentQuestionNumber, setCurrentQuestionNumber] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<AnswerFeedback | null>(null);
  const [showingFeedback, setShowingFeedback] = useState(false);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [results, setResults] = useState<QuizResults | null>(null);
  const [loading, setLoading] = useState(false);
  const [hasExistingSession, setHasExistingSession] = useState(false);
  const [sessionStatus, setSessionStatus] = useState<SessionStatusResponse | null>(null);

  // Check for existing session on component mount
  useEffect(() => {
    checkExistingSession();
  }, []);

  const checkExistingSession = async () => {
    try {
      const response = await fetch('/api/quiz/session', {
        credentials: 'include'
      });
      const data: SessionStatusResponse = await response.json();
      setSessionStatus(data);
      setHasExistingSession(data.hasActiveSession);
      
      if (data.hasActiveSession && data.canResume) {
        setTotalQuestions(data.totalQuestions || 0);
        setCurrentQuestionNumber((data.currentQuestionIndex || 0) + 1);
      }
    } catch (error) {
      console.error('Error checking existing session:', error);
    }
  };

  const startQuiz = async (force = false) => {
    setLoading(true);
    try {
      const endpoint = force ? '/api/quiz/start/force' : '/api/quiz/start';
      const response = await fetch(endpoint, {
        method: 'POST',
        credentials: 'include'
      });
      
      if (!response.ok) {
        const errorData: StartQuizResponse = await response.json();
        if (errorData.canResume) {
          // There's an existing session that can be resumed
          setHasExistingSession(true);
          setSessionStatus({
            hasActiveSession: true,
            sessionId: errorData.sessionId,
            canResume: true
          });
          return;
        }
        throw new Error(errorData.error || 'Failed to start quiz');
      }
      
      const data: StartQuizResponse = await response.json();
      setTotalQuestions(data.totalQuestions || 0);
      setHasExistingSession(false);
      await loadCurrentQuestion();
      setQuizState('question');
    } catch (error) {
      console.error('Error starting quiz:', error);
    } finally {
      setLoading(false);
    }
  };

  const resumeQuiz = async () => {
    setLoading(true);
    try {
      await loadCurrentQuestion();
      setQuizState('question');
      setHasExistingSession(false);
    } catch (error) {
      console.error('Error resuming quiz:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCurrentQuestion = async () => {
    try {
      const response = await fetch('/api/quiz/question', {
        credentials: 'include'
      });
      const data: QuestionResponse = await response.json();
      setCurrentQuestion(data.question);
      setCurrentQuestionNumber(data.currentQuestion);
      setTotalQuestions(data.totalQuestions);
      setSelectedAnswer(null);
    } catch (error) {
      console.error('Error loading question:', error);
    }
  };

  const submitAnswer = async () => {
    if (selectedAnswer === null) return;
    
    setLoading(true);
    try {
      const response = await fetch('/api/quiz/answer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ answer: selectedAnswer })
      });
      
      const data: AnswerResponse = await response.json();
      setFeedback(data.feedback);
      setShowingFeedback(true);
      
      // Store completion state for when user manually continues
      setQuizCompleted(data.completed);
    } catch (error) {
      console.error('Error submitting answer:', error);
    } finally {
      setLoading(false);
    }
  };

  const continueToNext = async () => {
    setFeedback(null);
    setShowingFeedback(false);
    setSelectedAnswer(null);
    
    if (quizCompleted) {
      await loadResults();
    } else {
      await loadCurrentQuestion();
    }
    setQuizCompleted(false);
  };

  const loadResults = async () => {
    try {
      const response = await fetch('/api/quiz/results', {
        credentials: 'include'
      });
      const data: QuizResults = await response.json();
      setResults(data);
      setQuizState('results');
    } catch (error) {
      console.error('Error loading results:', error);
    }
  };

  const resetQuiz = () => {
    setQuizState('start');
    setCurrentQuestion(null);
    setCurrentQuestionNumber(0);
    setTotalQuestions(0);
    setSelectedAnswer(null);
    setFeedback(null);
    setShowingFeedback(false);
    setQuizCompleted(false);
    setResults(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#4E46FF] via-[#4E60FF] to-[#FF6B3D] flex flex-col">
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="quiz-frame bg-white/90 backdrop-blur-sm rounded-3xl p-8 max-w-2xl w-full shadow-2xl">
          {/* Logo */}
          <div className="text-center mb-8">
            <a href="https://aiavenue.show" target="_blank" rel="noopener noreferrer" className="inline-block hover:scale-105 transition-transform duration-200">
              <img src={aiAvenueLogo} alt="AI Avenue Logo" className="h-20 mx-auto" />
            </a>
          </div>
        {quizState === 'start' && (
          <div className="text-center space-y-8">
            <h1 className="text-4xl font-bold text-[#43388C] mb-4">AI Avenue Literacy Quiz</h1>
            <p className="text-xl text-gray-600 mb-8">Test your knowledge about artificial intelligence</p>
            
            {hasExistingSession && sessionStatus?.canResume ? (
              <div className="space-y-4">
                <p className="text-lg text-orange-600 mb-4">
                  You have an existing quiz session in progress!
                </p>
                <p className="text-sm text-gray-600 mb-6">
                  Progress: {sessionStatus.answeredQuestions || 0} of {sessionStatus.totalQuestions || 0} questions answered
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <button
                    onClick={resumeQuiz}
                    disabled={loading}
                    className="bg-[#50A2E7] hover:bg-[#3D8BD4] disabled:opacity-50 text-white font-semibold py-3 px-6 rounded-2xl text-lg transition-all duration-200 transform hover:scale-105"
                  >
                    {loading ? 'Resuming...' : 'Resume Quiz'}
                  </button>
                  <button
                    onClick={() => startQuiz(true)}
                    disabled={loading}
                    className="bg-[#4E46FF] hover:bg-[#43388C] disabled:opacity-50 text-white font-semibold py-3 px-6 rounded-2xl text-lg transition-all duration-200 transform hover:scale-105"
                  >
                    {loading ? 'Starting...' : 'Start New Quiz'}
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => startQuiz()}
                disabled={loading}
                className="bg-[#4E46FF] hover:bg-[#43388C] disabled:opacity-50 text-white font-semibold py-4 px-8 rounded-2xl text-xl transition-all duration-200 transform hover:scale-105"
              >
                {loading ? 'Starting...' : 'Start Quiz'}
              </button>
            )}
          </div>
        )}

        {quizState === 'question' && currentQuestion && (
          <div className="space-y-6">
            <div className="flex justify-between items-center mb-6">
              <div className="text-sm font-medium text-gray-500">
                Question {currentQuestionNumber} of {totalQuestions}
              </div>
              <div className="w-48 bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-[#4E46FF] to-[#FF6B3D] h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(currentQuestionNumber / totalQuestions) * 100}%` }}
                ></div>
              </div>
            </div>

            <h2 className="text-2xl font-semibold text-gray-800 mb-8">
              {currentQuestion.question}
            </h2>

            <div className="space-y-4">
              {currentQuestion.options.map((option, index) => (
                <button
                  key={index}
                  onClick={() => !showingFeedback && setSelectedAnswer(index)}
                  disabled={showingFeedback}
                  className={`w-full text-left p-4 rounded-xl border-2 transition-all duration-200 ${
                    showingFeedback && feedback
                      ? feedback.correctAnswer === index
                        ? 'border-green-500 bg-green-50 text-green-700'
                        : feedback.userAnswer === index
                        ? 'border-red-500 bg-red-50 text-red-700'
                        : 'border-gray-200 bg-gray-50 text-gray-500'
                      : selectedAnswer === index
                      ? 'border-[#4E46FF] bg-[#F7F6FE] text-[#43388C]'
                      : 'border-gray-200 hover:border-gray-300 bg-white hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      showingFeedback && feedback
                        ? feedback.correctAnswer === index
                          ? 'border-green-500 bg-green-500'
                          : feedback.userAnswer === index
                          ? 'border-red-500 bg-red-500'
                          : 'border-gray-300 bg-gray-100'
                        : selectedAnswer === index
                        ? 'border-[#4E46FF] bg-[#4E46FF]'
                        : 'border-gray-300'
                    }`}>
                      {showingFeedback && feedback ? (
                        feedback.correctAnswer === index ? (
                          <span className="text-white text-sm">✓</span>
                        ) : feedback.userAnswer === index ? (
                          <span className="text-white text-sm">✗</span>
                        ) : null
                      ) : selectedAnswer === index ? (
                        <div className="w-2 h-2 bg-white rounded-full"></div>
                      ) : null}
                    </div>
                    <span className="text-lg">{option}</span>
                  </div>
                </button>
              ))}
            </div>

            {/* Inline Feedback Section */}
            {showingFeedback && feedback && (
              <div className={`mt-6 p-6 rounded-2xl transition-all duration-500 ${
                feedback.correct 
                  ? 'bg-gradient-to-r from-green-100 to-green-50 border-2 border-green-200' 
                  : 'bg-gradient-to-r from-red-100 to-orange-50 border-2 border-red-200'
              }`}>
                <div className="flex items-center space-x-3 mb-4">
                  <div className={`text-3xl ${feedback.correct ? 'text-green-600' : 'text-red-600'}`}>
                    {feedback.correct ? '🎉' : '💡'}
                  </div>
                  <h3 className={`text-xl font-bold ${feedback.correct ? 'text-green-800' : 'text-red-800'}`}>
                    {feedback.correct ? 'Correct!' : 'Not quite right, but great try!'}
                  </h3>
                </div>
                
                <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-lg">
                  <h4 className="font-semibold text-blue-800 mb-2">💡 Learn more:</h4>
                  <p className="text-blue-700">{feedback.explanation}</p>
                </div>
                
                {!feedback.correct && (
                  <div className="mt-4 bg-yellow-50 border-l-4 border-yellow-400 p-3 rounded-lg">
                    <p className="text-yellow-800 font-medium">Keep going! Every mistake is a learning opportunity! 🌟</p>
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-end pt-6">
              {!showingFeedback ? (
                <button
                  onClick={submitAnswer}
                  disabled={selectedAnswer === null || loading}
                  className="bg-gradient-to-r from-[#4E46FF] to-[#43388C] hover:from-[#43388C] hover:to-[#3D2F7A] disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 shadow-lg"
                >
                  {loading ? 'Submitting...' : 'Submit Answer'}
                </button>
              ) : (
                <button
                  onClick={continueToNext}
                  className="bg-gradient-to-r from-[#50A2E7] to-[#3D8BD4] hover:from-[#3D8BD4] hover:to-[#2A74C1] text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 shadow-lg"
                >
                  {quizCompleted ? 'See Results →' : 'Continue →'}
                </button>
              )}
            </div>
          </div>
        )}

        {quizState === 'results' && results && (
          <div className="text-center space-y-8">
            <h1 className="text-4xl font-bold text-gray-800 mb-4">Quiz Complete!</h1>
            
            <div className="bg-gradient-to-r from-[#F7F6FE] to-[#F0F8FF] rounded-2xl p-8 space-y-4">
              <div className="text-6xl font-bold text-[#4E46FF] mb-2">
                {results.percentage}%
              </div>
              <p className="text-xl text-gray-700">
                You got {results.correctAnswers} out of {results.totalQuestions} questions correct
              </p>
              <p className="text-gray-600">
                Completed in {Math.round(results.completionTime / 1000)} seconds
              </p>
            </div>

            {/* AI Avenue Episode Recommendations */}
            <div className="mt-8 p-6 bg-gradient-to-r from-[#F7F6FE] to-[#F0F8FF] rounded-2xl border-2 border-[#B8B3E8]">
              {results.correctAnswers <= 2 && (
                <div className="text-left space-y-3">
                  <h3 className="text-2xl font-bold text-[#43388C]">0–2 Correct: The AI Vibe Check Begins</h3>
                  <p className="text-[#6B5B95]">
                    You're not behind. You're just early. AI Avenue is like Google Translate for AI concepts—with jokes. 
                    Start with <a href="https://aiavenue.show" target="_blank" rel="noopener noreferrer"><span className="font-semibold text-[#50A2E7] hover:text-[#3D8BD4] cursor-pointer underline">"Voice"</span></a> or <a href="https://aiavenue.show" target="_blank" rel="noopener noreferrer"><span className="font-semibold text-[#50A2E7] hover:text-[#3D8BD4] cursor-pointer underline">"Vision"</span></a>.
                  </p>
                </div>
              )}
              
              {results.correctAnswers >= 3 && results.correctAnswers <= 5 && (
                <div className="text-left space-y-3">
                  <h3 className="text-2xl font-bold text-[#43388C]">3–5 Correct: The Curious Collaborator</h3>
                  <p className="text-[#6B5B95]">
                    You're getting there. These episodes will boost your confidence while keeping things weird and accessible. 
                    We suggest <a href="https://aiavenue.show" target="_blank" rel="noopener noreferrer"><span className="font-semibold text-[#50A2E7] hover:text-[#3D8BD4] cursor-pointer underline">"Thinking"</span></a> or <a href="https://aiavenue.show" target="_blank" rel="noopener noreferrer"><span className="font-semibold text-[#50A2E7] hover:text-[#3D8BD4] cursor-pointer underline">"Doing"</span></a>.
                  </p>
                </div>
              )}
              
              {results.correctAnswers >= 6 && results.correctAnswers <= 8 && (
                <div className="text-left space-y-3">
                  <h3 className="text-2xl font-bold text-[#43388C]">6–8 Correct: The Prompt-Savvy Practitioner</h3>
                  <p className="text-[#6B5B95]">
                    You know what's real, what's hype, and you're ready to build. This show fills in context and shows how it works in the wild. 
                    Try <a href="https://aiavenue.show" target="_blank" rel="noopener noreferrer"><span className="font-semibold text-[#50A2E7] hover:text-[#3D8BD4] cursor-pointer underline">"Learning"</span></a>.
                  </p>
                </div>
              )}
              
              {results.correctAnswers >= 9 && (
                <div className="text-left space-y-3">
                  <h3 className="text-2xl font-bold text-[#43388C]">9–10 Correct: You Might Be a Model!</h3>
                  <p className="text-[#6B5B95]">
                    Impressive. You might already be running on fine-tuned parameters. But have you watched a robot hand host trivia? 
                    Didn't think so. Join us on <span className="font-semibold text-[#50A2E7] hover:text-[#3D8BD4] cursor-pointer underline">AI Avenue</span>.
                  </p>
                </div>
              )}
            </div>

            <div className="flex flex-col space-y-4 mt-6">
              <button
                onClick={resetQuiz}
                className="bg-gradient-to-r from-[#4E46FF] to-[#43388C] hover:from-[#43388C] hover:to-[#3D2F7A] text-white font-semibold py-4 px-8 rounded-2xl text-xl transition-all duration-200 transform hover:scale-105 shadow-lg"
              >
                Take Quiz Again
              </button>
              
              <a
                href="https://aiavenue.show"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-gradient-to-r from-[#50A2E7] to-[#3D8BD4] hover:from-[#3D8BD4] hover:to-[#2A74C1] text-white font-semibold py-3 px-6 rounded-2xl text-lg transition-all duration-200 transform hover:scale-105 shadow-lg text-center"
              >
                Watch AI Avenue →
              </a>
            </div>
          </div>
        )}
        </div>
      </div>
      
      {/* Sticky Footer */}
      <footer className="bg-white/95 backdrop-blur-sm border-t border-gray-200 py-4 px-6">
        <div className="text-center text-sm text-gray-600 space-y-2">
          <div>
            Built with <span className="text-[#FF6B3D]">🧡</span> using{' '}
            <a 
              href="https://developers.cloudflare.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-[#50A2E7] hover:text-[#3D8BD4] font-medium underline"
            >
              Cloudflare Workers
            </a>{' '}
            for{' '}
            <a 
              href="https://aiavenue.show" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-[#4E46FF] hover:text-[#43388C] font-medium underline"
            >
              AI Avenue
            </a>
          </div>
          <div>
            <a 
              href="https://github.com/craigsdennis/ai-ave-literacy-quiz-vibecode" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-gray-500 hover:text-[#43388C] font-medium underline transition-colors duration-200"
            >
              👀 the code
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App
