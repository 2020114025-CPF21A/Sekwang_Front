
import { useState, useEffect } from 'react';
import Card from '../../components/base/Card';
import Button from '../../components/base/Button';

interface Question {
  id: number;
  question: string;
  options?: string[];
  answer: string;
  type: 'multiple' | 'ox' | 'speed';
}

export default function Game() {
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [score, setScore] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(10);
  const [gameMode, setGameMode] = useState<'multiple' | 'ox' | 'speed'>('multiple');
  const [answered, setAnswered] = useState(false);

  const questions: Question[] = [
    {
      id: 1,
      question: '구약 성경의 5번째 책은 무엇인가요?',
      options: ['레위기', '민수기', '신명기', '여호수아'],
      answer: '신명기',
      type: 'multiple'
    },
    {
      id: 2,
      question: '구약 성경의 총 권수는 39권이다.',
      answer: 'O',
      type: 'ox'
    },
    {
      id: 3,
      question: '예수님의 12제자 중 첫 번째로 부름받은 제자는?',
      options: ['베드로', '안드레', '야고보', '요한'],
      answer: '안드레',
      type: 'multiple'
    },
    {
      id: 4,
      question: '모세가 받은 십계명은 시내산에서 받았다.',
      answer: 'O',
      type: 'ox'
    },
    {
      id: 5,
      question: '다윗이 골리앗을 이긴 무기는?',
      answer: '물매',
      type: 'speed'
    }
  ];

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (gameStarted && timeLeft > 0 && !answered) {
      timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
    } else if (timeLeft === 0 && !answered) {
      handleTimeUp();
    }
    return () => clearTimeout(timer);
  }, [gameStarted, timeLeft, answered]);

  const startGame = (mode: 'multiple' | 'ox' | 'speed') => {
    setGameMode(mode);
    setGameStarted(true);
    setScore(0);
    setAnswered(false);
    const filteredQuestions = questions.filter(q => q.type === mode);
    const randomQuestion = filteredQuestions[Math.floor(Math.random() * filteredQuestions.length)];
    setCurrentQuestion(randomQuestion);
    setTimeLeft(mode === 'speed' ? 5 : 10);
  };

  const handleAnswer = (answer: string) => {
    if (answered) return;
    
    setAnswered(true);
    if (answer === currentQuestion?.answer) {
      setScore(score + 1);
    }
    
    setTimeout(() => {
      nextQuestion();
    }, 1500);
  };

  const handleTimeUp = () => {
    setAnswered(true);
    setTimeout(() => {
      nextQuestion();
    }, 1500);
  };

  const nextQuestion = () => {
    const filteredQuestions = questions.filter(q => q.type === gameMode);
    const randomQuestion = filteredQuestions[Math.floor(Math.random() * filteredQuestions.length)];
    setCurrentQuestion(randomQuestion);
    setTimeLeft(gameMode === 'speed' ? 5 : 10);
    setAnswered(false);
  };

  const endGame = () => {
    setGameStarted(false);
    setCurrentQuestion(null);
    setAnswered(false);
  };

  if (!gameStarted) {
    return (
      <div className="min-h-screen bg-gray-50 pb-20 sm:pb-4">
        <div className="px-4 py-6">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-orange-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="ri-gamepad-line text-2xl text-white"></i>
            </div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">성경 미니게임</h1>
            <p className="text-gray-600">재미있게 성경 지식을 테스트해보세요!</p>
          </div>

          <div className="space-y-4">
            <Card className="p-4 text-center hover:shadow-lg transition-shadow cursor-pointer" onClick={() => startGame('multiple')}>
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="ri-question-line text-2xl text-blue-600"></i>
              </div>
              <h3 className="text-lg font-bold text-gray-800 mb-2">객관식 퀴즈</h3>
              <p className="text-gray-600 mb-4 text-sm">4개의 선택지 중 정답을 골라보세요</p>
              <Button onClick={() => startGame('multiple')} className="w-full py-3 rounded-xl">게임 시작</Button>
            </Card>

            <Card className="p-4 text-center hover:shadow-lg transition-shadow cursor-pointer" onClick={() => startGame('ox')}>
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="ri-checkbox-circle-line text-2xl text-green-600"></i>
              </div>
              <h3 className="text-lg font-bold text-gray-800 mb-2">OX 퀴즈</h3>
              <p className="text-gray-600 mb-4 text-sm">참 또는 거짓을 선택하세요</p>
              <Button onClick={() => startGame('ox')} variant="success" className="w-full py-3 rounded-xl">게임 시작</Button>
            </Card>

            <Card className="p-4 text-center hover:shadow-lg transition-shadow cursor-pointer" onClick={() => startGame('speed')}>
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="ri-flashlight-line text-2xl text-orange-600"></i>
              </div>
              <h3 className="text-lg font-bold text-gray-800 mb-2">스피드 퀴즈</h3>
              <p className="text-gray-600 mb-4 text-sm">빠르게 단답형으로 답하세요</p>
              <Button onClick={() => startGame('speed')} className="w-full py-3 bg-orange-600 hover:bg-orange-700 rounded-xl">게임 시작</Button>
            </Card>
          </div>

          {/* Game Records */}
          <Card className="mt-8 p-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">최근 게임 기록</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                <div>
                  <span className="font-medium text-gray-800 text-sm">객관식 퀴즈</span>
                  <span className="text-sm text-gray-600 ml-2">2024.01.15</span>
                </div>
                <span className="text-lg font-bold text-blue-600">8/10</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                <div>
                  <span className="font-medium text-gray-800 text-sm">OX 퀴즈</span>
                  <span className="text-sm text-gray-600 ml-2">2024.01.14</span>
                </div>
                <span className="text-lg font-bold text-green-600">9/10</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                <div>
                  <span className="font-medium text-gray-800 text-sm">스피드 퀴즈</span>
                  <span className="text-sm text-gray-600 ml-2">2024.01.13</span>
                </div>
                <span className="text-lg font-bold text-orange-600">7/10</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20 sm:pb-4">
      <div className="px-4 py-6">
        {/* Game Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-xl font-bold text-gray-800">
              {gameMode === 'multiple' && '객관식 퀴즈'}
              {gameMode === 'ox' && 'OX 퀴즈'}
              {gameMode === 'speed' && '스피드 퀴즈'}
            </h1>
            <p className="text-gray-600 text-sm">점수: {score}점</p>
          </div>
          <div className="text-right">
            <div className={`text-2xl font-bold ${timeLeft <= 3 ? 'text-red-600' : 'text-blue-600'}`}>
              {timeLeft}
            </div>
            <Button onClick={endGame} variant="danger" size="sm" className="mt-1 rounded-lg">게임 종료</Button>
          </div>
        </div>

        {/* Question Card */}
        <Card className="mb-6 p-4">
          <div className="text-center mb-6">
            <h2 className="text-lg font-bold text-gray-800 mb-4">{currentQuestion?.question}</h2>
            
            {answered && (
              <div className={`text-base font-semibold ${
                answered ? 'text-green-600' : 'text-red-600'
              }`}>
                {currentQuestion?.answer === currentQuestion?.answer ? '정답!' : `정답: ${currentQuestion?.answer}`}
              </div>
            )}
          </div>

          {/* Multiple Choice */}
          {gameMode === 'multiple' && currentQuestion?.options && (
            <div className="space-y-3">
              {currentQuestion.options.map((option, index) => (
                <Button
                  key={index}
                  onClick={() => handleAnswer(option)}
                  variant={answered ? (option === currentQuestion.answer ? 'success' : 'secondary') : 'secondary'}
                  disabled={answered}
                  className="w-full p-4 text-left h-auto rounded-xl"
                >
                  {option}
                </Button>
              ))}
            </div>
          )}

          {/* OX Quiz */}
          {gameMode === 'ox' && (
            <div className="flex justify-center space-x-6">
              <Button
                onClick={() => handleAnswer('O')}
                variant={answered ? (currentQuestion?.answer === 'O' ? 'success' : 'secondary') : 'success'}
                disabled={answered}
                size="lg"
                className="w-20 h-20 rounded-full text-2xl"
              >
                O
              </Button>
              <Button
                onClick={() => handleAnswer('X')}
                variant={answered ? (currentQuestion?.answer === 'X' ? 'danger' : 'secondary') : 'danger'}
                disabled={answered}
                size="lg"
                className="w-20 h-20 rounded-full text-2xl"
              >
                X
              </Button>
            </div>
          )}

          {/* Speed Quiz */}
          {gameMode === 'speed' && (
            <div className="text-center">
              <input
                type="text"
                placeholder="답을 입력하세요"
                className="w-full px-4 py-3 text-base border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center bg-white"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleAnswer((e.target as HTMLInputElement).value);
                  }
                }}
                disabled={answered}
              />
              <p className="text-sm text-gray-600 mt-2">Enter를 눌러 답안을 제출하세요</p>
            </div>
          )}
        </Card>

        {/* Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-1000"
            style={{ width: `${(timeLeft / (gameMode === 'speed' ? 5 : 10)) * 100}%` }}
          ></div>
        </div>
      </div>
    </div>
  );
}