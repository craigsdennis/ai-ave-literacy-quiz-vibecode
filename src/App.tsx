import { useState } from 'react'
import './App.css'
import type { Question } from '../worker/index'

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
  started: boolean;
  totalQuestions: number;
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

  const startQuiz = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/quiz/start', {
        method: 'POST',
        credentials: 'include'
      });
      const data: StartQuizResponse = await response.json();
      setTotalQuestions(data.totalQuestions);
      await loadCurrentQuestion();
      setQuizState('question');
    } catch (error) {
      console.error('Error starting quiz:', error);
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
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-500 to-orange-400 flex items-center justify-center p-4">
      <div className="quiz-frame bg-white/90 backdrop-blur-sm rounded-3xl p-8 max-w-2xl w-full shadow-2xl">
        {quizState === 'start' && (
          <div className="text-center space-y-8">
            <h1 className="text-4xl font-bold text-gray-800 mb-4">AI Literacy Quiz</h1>
            <p className="text-xl text-gray-600 mb-8">Test your knowledge about artificial intelligence</p>
            <button
              onClick={startQuiz}
              disabled={loading}
              className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-semibold py-4 px-8 rounded-2xl text-xl transition-all duration-200 transform hover:scale-105"
            >
              {loading ? 'Starting...' : 'Start Quiz'}
            </button>
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
                  className="bg-purple-600 h-2 rounded-full transition-all duration-300"
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
                      ? 'border-purple-600 bg-purple-50 text-purple-700'
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
                        ? 'border-purple-600 bg-purple-600'
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
                  className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 shadow-lg"
                >
                  {loading ? 'Submitting...' : 'Submit Answer'}
                </button>
              ) : (
                <button
                  onClick={continueToNext}
                  className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 shadow-lg"
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
            
            <div className="bg-gradient-to-r from-purple-100 to-blue-100 rounded-2xl p-8 space-y-4">
              <div className="text-6xl font-bold text-purple-600 mb-2">
                {results.percentage}%
              </div>
              <p className="text-xl text-gray-700">
                You got {results.correctAnswers} out of {results.totalQuestions} questions correct
              </p>
              <p className="text-gray-600">
                Completed in {Math.round(results.completionTime / 1000)} seconds
              </p>
            </div>

            <div className="space-y-2">
              {results.percentage >= 80 && (
                <p className="text-green-600 font-semibold text-lg">🎉 Excellent work!</p>
              )}
              {results.percentage >= 60 && results.percentage < 80 && (
                <p className="text-yellow-600 font-semibold text-lg">👍 Good job!</p>
              )}
              {results.percentage < 60 && (
                <p className="text-orange-600 font-semibold text-lg">💡 Keep learning!</p>
              )}
            </div>

            <button
              onClick={resetQuiz}
              className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-4 px-8 rounded-2xl text-xl transition-all duration-200 transform hover:scale-105"
            >
              Take Quiz Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default App
