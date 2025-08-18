import { useState } from 'react'
import './App.css'

interface Question {
  id: string;
  question: string;
  options: string[];
}

interface QuizResults {
  totalQuestions: number;
  correctAnswers: number;
  percentage: number;
  completionTime: number;
}

type QuizState = 'start' | 'question' | 'results';

function App() {
  const [quizState, setQuizState] = useState<QuizState>('start');
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [currentQuestionNumber, setCurrentQuestionNumber] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [results, setResults] = useState<QuizResults | null>(null);
  const [loading, setLoading] = useState(false);

  const startQuiz = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/quiz/start', {
        method: 'POST',
        credentials: 'include'
      });
      const data = await response.json();
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
      const data = await response.json();
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
      
      const data = await response.json();
      
      if (data.completed) {
        await loadResults();
      } else {
        await loadCurrentQuestion();
      }
    } catch (error) {
      console.error('Error submitting answer:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadResults = async () => {
    try {
      const response = await fetch('/api/quiz/results', {
        credentials: 'include'
      });
      const data = await response.json();
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
                  onClick={() => setSelectedAnswer(index)}
                  className={`w-full text-left p-4 rounded-xl border-2 transition-all duration-200 ${
                    selectedAnswer === index
                      ? 'border-purple-600 bg-purple-50 text-purple-700'
                      : 'border-gray-200 hover:border-gray-300 bg-white hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      selectedAnswer === index
                        ? 'border-purple-600 bg-purple-600'
                        : 'border-gray-300'
                    }`}>
                      {selectedAnswer === index && (
                        <div className="w-2 h-2 bg-white rounded-full"></div>
                      )}
                    </div>
                    <span className="text-lg">{option}</span>
                  </div>
                </button>
              ))}
            </div>

            <div className="flex justify-end pt-6">
              <button
                onClick={submitAnswer}
                disabled={selectedAnswer === null || loading}
                className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200"
              >
                {loading ? 'Submitting...' : 'Next Question'}
              </button>
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
