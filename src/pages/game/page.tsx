import { useEffect, useRef, useState } from 'react';
import Card from '../../components/base/Card';
import Button from '../../components/base/Button';
import { mcAPI, oxAPI, speedAPI, quizHistoryAPI } from '../../utils/api';

type GameMode = 'multiple' | 'ox' | 'speed';
type ViewMode = 'menu' | 'game' | 'result' | 'history';

type UIMcq = { type: 'multiple'; id: number; question: string; options: string[]; answer: string };
type UIOx = { type: 'ox'; id: number; question: string; answer: 'O' | 'X' };
type UISpd = { type: 'speed'; id: number; question: string; accepts: string[] };

type UIQuestion = UIMcq | UIOx | UISpd;

type AnswerRecord = {
  question: UIQuestion;
  userAnswer: string;
  correct: boolean;
};

type HistoryRecord = {
  id: number;
  score: number;
  takenAt: string;
  gameType: GameMode;
};

type DetailedAnswer = {
  questionIndex: number;
  question: string;
  userAnswer: string;
  correctAnswer: string;
  correct: boolean;
};

const QUESTIONS_PER_GAME = 20;

// HistoryCard 컴포넌트 (토글로 상세 정보 표시)
function HistoryCard({
  record,
  index,
  getGameTypeName,
  getGameTypeColor,
  formatDate,
}: {
  record: HistoryRecord;
  index: number;
  getGameTypeName: (type: GameMode) => string;
  getGameTypeColor: (type: GameMode) => string;
  formatDate: (date: string) => string;
}) {
  const [expanded, setExpanded] = useState(false);
  const [details, setDetails] = useState<DetailedAnswer[]>([]);
  const [loading, setLoading] = useState(false);

  const loadDetails = async () => {
    if (details.length > 0) {
      setExpanded(!expanded);
      return;
    }

    setLoading(true);
    try {
      const quizType = record.gameType === 'multiple' ? 'mc' : record.gameType === 'ox' ? 'ox' : 'speed';
      const data = await quizHistoryAPI.getByResult(quizType, record.id);
      setDetails(data as DetailedAnswer[]);
      setExpanded(true);
    } catch (e) {
      console.error('상세 기록 로드 실패:', e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="overflow-hidden">
      <div
        className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={loadDetails}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="text-2xl font-bold text-blue-600">{record.score}</div>
            <div>
              <span className={`text-xs px-2 py-1 rounded-full ${getGameTypeColor(record.gameType)}`}>
                {getGameTypeName(record.gameType)}
              </span>
              <p className="text-sm text-gray-500 mt-1">{formatDate(record.takenAt)}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-gray-400 text-sm">#{index}</span>
            <i className={`ri-arrow-${expanded ? 'up' : 'down'}-s-line text-gray-400`}></i>
          </div>
        </div>
      </div>

      {loading && (
        <div className="px-4 pb-4 text-center text-gray-500 text-sm">불러오는 중...</div>
      )}

      {expanded && details.length > 0 && (
        <div className="border-t border-gray-100 px-4 pb-4 pt-2 space-y-2 bg-gray-50">
          {details.map((d, idx) => (
            <div
              key={idx}
              className={`p-2 rounded-lg text-sm ${d.correct ? 'bg-green-50 border-l-2 border-green-500' : 'bg-red-50 border-l-2 border-red-500'
                }`}
            >
              <div className="font-medium text-gray-800 mb-1">
                {d.questionIndex + 1}. {d.question}
              </div>
              <div className="flex gap-2 text-xs">
                <span className={d.correct ? 'text-green-600' : 'text-red-600'}>
                  내 답: {d.userAnswer}
                </span>
                {!d.correct && (
                  <span className="text-green-600">
                    → 정답: {d.correctAnswer}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {expanded && details.length === 0 && !loading && (
        <div className="px-4 pb-4 text-center text-gray-400 text-sm">
          상세 기록이 없습니다.
        </div>
      )}
    </Card>
  );
}

export default function Game() {
  const [viewMode, setViewMode] = useState<ViewMode>('menu');
  const [gameMode, setGameMode] = useState<GameMode>('multiple');
  const [loading, setLoading] = useState(false);

  const [setId, setSetId] = useState<number | null>(null);
  const [questions, setQuestions] = useState<UIQuestion[]>([]);
  const [currentQ, setCurrentQ] = useState<UIQuestion | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  const [answering, setAnswering] = useState(false);
  const [score, setScore] = useState(0);
  const [answerHistory, setAnswerHistory] = useState<AnswerRecord[]>([]);

  const [timeLeft, setTimeLeft] = useState(10);
  const [speedInput, setSpeedInput] = useState('');
  const usedIdsRef = useRef<Set<number>>(new Set());

  // 기록 관련
  const [historyRecords, setHistoryRecords] = useState<HistoryRecord[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // 로그인 사용자 정보 (localStorage에서 읽기)
  const [user, setUser] = useState<{ username?: string }>({});

  useEffect(() => {
    const loadUser = () => {
      try {
        const userData = JSON.parse(localStorage.getItem('user') || '{}');
        setUser(userData);
      } catch {
        setUser({});
      }
    };

    // 초기 로드
    loadUser();

    // storage 이벤트로 다른 탭에서 로그인/로그아웃 감지
    window.addEventListener('storage', loadUser);

    // 페이지 포커스 시 다시 확인
    const handleFocus = () => loadUser();
    window.addEventListener('focus', handleFocus);

    return () => {
      window.removeEventListener('storage', loadUser);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  // 타이머
  useEffect(() => {
    if (viewMode !== 'game' || !currentQ) return;
    if (answering) return;
    if (timeLeft <= 0) { handleTimeUp(); return; }

    const t = setTimeout(() => setTimeLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [viewMode, currentQ, timeLeft, answering]);

  // 모드별 제한시간
  const limitByMode = (mode: GameMode) => (mode === 'speed' ? 5 : 10);

  // ===== 기록 로드 =====
  const loadHistory = async () => {
    if (!user?.username) return;
    setHistoryLoading(true);
    try {
      const [mcRes, oxRes, speedRes] = await Promise.all([
        mcAPI.getHistory(user.username),
        oxAPI.getHistory(user.username),
        speedAPI.getHistory(user.username),
      ]);

      const mcRecords = (mcRes as any[]).map((r: any) => ({
        id: r.id, score: r.score, takenAt: r.takenAt, gameType: 'multiple' as GameMode,
      }));
      const oxRecords = (oxRes as any[]).map((r: any) => ({
        id: r.id, score: r.score, takenAt: r.takenAt, gameType: 'ox' as GameMode,
      }));
      const speedRecords = (speedRes as any[]).map((r: any) => ({
        id: r.id, score: r.score, takenAt: r.takenAt, gameType: 'speed' as GameMode,
      }));

      const all = [...mcRecords, ...oxRecords, ...speedRecords]
        .sort((a, b) => new Date(b.takenAt).getTime() - new Date(a.takenAt).getTime());

      setHistoryRecords(all);
    } catch (e) {
      console.error('기록 로드 실패:', e);
    } finally {
      setHistoryLoading(false);
    }
  };

  // ===== 세트 로드 (랜덤 세트 선택) =====
  const loadRandomSet = async (mode: GameMode) => {
    setLoading(true);
    try {
      let sets: any[] = [];
      if (mode === 'multiple') sets = await mcAPI.getAllSets();
      else if (mode === 'ox') sets = await oxAPI.getAllSets();
      else sets = await speedAPI.getAllSets();

      if (!Array.isArray(sets) || sets.length === 0) {
        throw new Error('사용 가능한 세트가 없습니다.');
      }

      // 랜덤 세트 선택
      const randomSet = sets[Math.floor(Math.random() * sets.length)];
      const sid = Number(randomSet.setId ?? randomSet.id ?? randomSet?.set?.setId);
      setSetId(sid);

      // 세트 상세 (문제들) 로드
      let data: any;
      if (mode === 'multiple') data = await mcAPI.getSet(sid);
      else if (mode === 'ox') data = await oxAPI.getSet(sid);
      else data = await speedAPI.getSet(sid);

      const qs: any[] = data?.questions ?? data?.qRes ?? [];
      const uiQs: UIQuestion[] = qs.map((q: any) => {
        if (mode === 'multiple') {
          const options = [q.choice1, q.choice2, q.choice3, q.choice4].filter(Boolean);
          const idx = (q.answerNo ?? 1) - 1;
          return {
            type: 'multiple',
            id: q.id,
            question: q.question,
            options,
            answer: options[idx] ?? '',
          };
        }
        if (mode === 'ox') {
          let ans = String(q.answer).trim().toUpperCase();
          if (ans === '1') ans = 'O';
          if (ans === '2') ans = 'X';
          return { type: 'ox', id: q.id, question: q.question, answer: (ans === 'O' ? 'O' : 'X') as 'O' | 'X' };
        }
        // speed
        const accepts = [q.accept1, q.accept2, q.accept3]
          .filter(Boolean)
          .map((s: string) => s.trim())
          .filter((s: string) => s.length > 0);
        return { type: 'speed', id: q.id, question: q.question, accepts };
      });

      // 문제를 섞고 중복 제거 후 20개만 선택
      const shuffled = [...uiQs].sort(() => Math.random() - 0.5);

      // question 텍스트 기준으로 중복 제거
      const seen = new Set<string>();
      const uniqueQuestions = shuffled.filter((q) => {
        const key = q.question.trim().toLowerCase();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });

      const selected = uniqueQuestions.slice(0, QUESTIONS_PER_GAME);

      setQuestions(selected);
      usedIdsRef.current = new Set();
      setCurrentIndex(0);
      setCurrentQ(selected[0] || null);
      setTimeLeft(limitByMode(mode));
      setSpeedInput('');
    } catch (e) {
      console.error('세트 로드 실패:', e);
      setQuestions([]);
      setCurrentQ(null);
    } finally {
      setLoading(false);
    }
  };

  // ===== 게임 시작/종료 =====
  const startGame = async (mode: GameMode) => {
    setGameMode(mode);
    setScore(0);
    setAnswering(false);
    setViewMode('game');
    setAnswerHistory([]);
    setCurrentIndex(0);
    await loadRandomSet(mode);
  };

  const endGame = async (finalScore: number, finalAnswerHistory: AnswerRecord[]) => {
    setViewMode('result');
    setAnswering(false);
    setSpeedInput('');

    console.log('endGame 호출:', { username: user?.username, setId, finalScore, gameMode });

    // 결과 저장 시도
    try {
      if (user?.username && setId) {
        console.log('결과 저장 시도:', { username: user.username, setId, finalScore });

        let result: any;
        if (gameMode === 'multiple') result = await mcAPI.saveResult(user.username, setId, finalScore);
        else if (gameMode === 'ox') result = await oxAPI.saveResult(user.username, setId, finalScore);
        else result = await speedAPI.saveResult(user.username, setId, finalScore);

        console.log('결과 저장 성공!', result);

        // 상세 답변 기록 저장
        if (result?.id) {
          const quizType = gameMode === 'multiple' ? 'mc' : gameMode === 'ox' ? 'ox' : 'speed';
          const answers = finalAnswerHistory.map((record, idx) => ({
            questionIndex: idx,
            question: record.question.question,
            userAnswer: record.userAnswer,
            correctAnswer: record.question.type === 'multiple'
              ? (record.question as UIMcq).answer
              : record.question.type === 'ox'
                ? (record.question as UIOx).answer
                : (record.question as UISpd).accepts[0] || '',
            correct: record.correct,
          }));

          await quizHistoryAPI.saveHistory({
            username: user.username,
            quizType,
            resultId: result.id,
            answers,
          });
          console.log('상세 기록 저장 성공!');
        }
      } else {
        console.log('결과 저장 스킵: username 또는 setId 없음', { username: user?.username, setId });
      }
    } catch (e) {
      console.error('결과 저장 실패:', e);
    }
  };

  const resetGame = () => {
    setViewMode('menu');
    setCurrentQ(null);
    setQuestions([]);
    setSetId(null);
    setAnswerHistory([]);
    setCurrentIndex(0);
    setScore(0);
  };

  // ===== 정답/시간초과 처리 =====
  const handleAnswer = (input: string) => {
    if (!currentQ || answering) return;

    let correct = false;
    if (currentQ.type === 'multiple') {
      correct = input === (currentQ as UIMcq).answer;
    } else if (currentQ.type === 'ox') {
      correct = input.toUpperCase() === (currentQ as UIOx).answer;
    } else {
      const ans = input.trim().toLowerCase();
      const accepts = (currentQ as UISpd).accepts.map((a) => a.trim().toLowerCase());
      correct = accepts.includes(ans);
    }

    // 기록 저장
    setAnswerHistory((prev) => [...prev, { question: currentQ, userAnswer: input, correct }]);

    setAnswering(true);
    const newScore = correct ? score + 1 : score;
    if (correct) setScore((s) => s + 1);

    // 최종 기록 계산 (현재 답변 포함)
    const newRecord: AnswerRecord = { question: currentQ, userAnswer: input, correct };

    setTimeout(() => {
      const nextIndex = currentIndex + 1;

      if (nextIndex >= questions.length || nextIndex >= QUESTIONS_PER_GAME) {
        // 마지막 답변 포함된 기록 전달
        endGame(newScore, [...answerHistory, newRecord]);
      } else {
        setCurrentIndex(nextIndex);
        setCurrentQ(questions[nextIndex]);
        setTimeLeft(limitByMode(gameMode));
        setAnswering(false);
        setSpeedInput('');
      }
    }, 1200);
  };

  const handleTimeUp = () => {
    if (!currentQ) return;

    const newRecord: AnswerRecord = { question: currentQ, userAnswer: '(시간 초과)', correct: false };
    setAnswerHistory((prev) => [...prev, newRecord]);

    setAnswering(true);
    setTimeout(() => {
      const nextIndex = currentIndex + 1;

      if (nextIndex >= questions.length || nextIndex >= QUESTIONS_PER_GAME) {
        endGame(score, [...answerHistory, newRecord]);  // 시간 초과는 점수 변동 없음
      } else {
        setCurrentIndex(nextIndex);
        setCurrentQ(questions[nextIndex]);
        setTimeLeft(limitByMode(gameMode));
        setAnswering(false);
        setSpeedInput('');
      }
    }, 1000);
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`;
  };

  const getGameTypeName = (type: GameMode) => {
    if (type === 'multiple') return '객관식';
    if (type === 'ox') return 'OX 퀴즈';
    return '스피드';
  };

  const getGameTypeColor = (type: GameMode) => {
    if (type === 'multiple') return 'bg-blue-100 text-blue-600';
    if (type === 'ox') return 'bg-green-100 text-green-600';
    return 'bg-orange-100 text-orange-600';
  };

  // ===== 기록 화면 =====
  if (viewMode === 'history') {
    return (
      <div className="min-h-screen bg-gray-50 pb-20 sm:pb-4">
        <div className="max-w-2xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-xl font-bold text-gray-800">📊 내 게임 기록</h1>
            <Button onClick={() => setViewMode('menu')} variant="secondary" size="sm" className="rounded-lg">
              ← 돌아가기
            </Button>
          </div>

          {historyLoading ? (
            <Card className="p-6 text-center text-gray-500">불러오는 중...</Card>
          ) : historyRecords.length === 0 ? (
            <Card className="p-6 text-center text-gray-500">
              <i className="ri-gamepad-line text-4xl text-gray-300 mb-2"></i>
              <p>아직 플레이한 기록이 없습니다.</p>
              <Button onClick={() => setViewMode('menu')} className="mt-4 rounded-lg">
                게임 시작하기
              </Button>
            </Card>
          ) : (
            <div className="space-y-3">
              {historyRecords.map((r, idx) => (
                <HistoryCard
                  key={`${r.gameType}-${r.id}`}
                  record={r}
                  index={historyRecords.length - idx}
                  getGameTypeName={getGameTypeName}
                  getGameTypeColor={getGameTypeColor}
                  formatDate={formatDate}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ===== 결과 화면 =====
  if (viewMode === 'result') {
    const correctCount = answerHistory.filter((r) => r.correct).length;
    const wrongCount = answerHistory.length - correctCount;

    return (
      <div className="min-h-screen bg-gray-50 pb-20 sm:pb-4">
        <div className="max-w-2xl mx-auto px-4 py-6">
          {/* 결과 헤더 */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
              <i className="ri-trophy-line text-3xl text-white"></i>
            </div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">게임 결과</h1>
            <p className="text-gray-600">
              {gameMode === 'multiple' && '객관식 퀴즈'}
              {gameMode === 'ox' && 'OX 퀴즈'}
              {gameMode === 'speed' && '스피드 퀴즈'}
            </p>
          </div>

          {/* 점수 카드 */}
          <Card className="mb-6 p-6 text-center bg-gradient-to-br from-blue-50 to-purple-50">
            <div className="text-5xl font-bold text-blue-600 mb-2">{score}</div>
            <div className="text-gray-600">/ {answerHistory.length} 문제</div>
            <div className="mt-4 flex justify-center gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{correctCount}</div>
                <div className="text-sm text-gray-500">정답</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-500">{wrongCount}</div>
                <div className="text-sm text-gray-500">오답</div>
              </div>
            </div>
          </Card>

          {/* 문제별 결과 */}
          <h2 className="text-lg font-bold text-gray-800 mb-4">📝 문제별 결과</h2>
          <div className="space-y-3 mb-6">
            {answerHistory.map((record, idx) => (
              <Card
                key={idx}
                className={`p-4 border-l-4 ${record.correct ? 'border-l-green-500 bg-green-50' : 'border-l-red-500 bg-red-50'
                  }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold ${record.correct ? 'bg-green-500' : 'bg-red-500'
                    }`}>
                    {record.correct ? '✓' : '✗'}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-gray-800 mb-1">
                      {idx + 1}. {record.question.question}
                    </div>
                    <div className="text-sm">
                      <span className="text-gray-500">내 답: </span>
                      <span className={record.correct ? 'text-green-600 font-medium' : 'text-red-600'}>
                        {record.userAnswer}
                      </span>
                      {!record.correct && (
                        <>
                          <span className="text-gray-400 mx-2">→</span>
                          <span className="text-green-600 font-medium">
                            정답: {
                              record.question.type === 'multiple' ? (record.question as UIMcq).answer :
                                record.question.type === 'ox' ? (record.question as UIOx).answer :
                                  (record.question as UISpd).accepts[0]
                            }
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* 버튼 */}
          <div className="grid grid-cols-2 gap-4">
            <Button onClick={() => startGame(gameMode)} className="py-3 rounded-xl">
              다시 도전
            </Button>
            <Button onClick={resetGame} variant="secondary" className="py-3 rounded-xl">
              모드 선택
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ===== 시작 화면 =====
  if (viewMode === 'menu') {
    return (
      <div className="min-h-screen bg-gray-50 pb-20 sm:pb-4">
        <div className="px-4 py-6">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-orange-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="ri-gamepad-line text-2xl text-white"></i>
            </div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">성경 미니게임</h1>
            <p className="text-gray-600">재미있게 성경 지식을 테스트해보세요!</p>
            <p className="text-sm text-blue-600 mt-2">📝 게임당 {QUESTIONS_PER_GAME}문제</p>
          </div>

          {/* 내 기록 보기 버튼 */}
          <Button
            onClick={() => { loadHistory(); setViewMode('history'); }}
            variant="secondary"
            className="w-full py-3 rounded-xl mb-6"
          >
            <i className="ri-history-line mr-2"></i>
            내 게임 기록 보기
          </Button>

          <div className="space-y-4">
            <Card className="p-4 text-center hover:shadow-lg transition-shadow cursor-pointer" onClick={() => startGame('multiple')}>
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="ri-question-line text-2xl text-blue-600"></i>
              </div>
              <h3 className="text-lg font-bold text-gray-800 mb-2">객관식 퀴즈</h3>
              <p className="text-gray-600 mb-4 text-sm">4개의 선택지 중 정답을 골라보세요</p>
              <Button className="w-full py-3 rounded-xl">게임 시작</Button>
            </Card>

            <Card className="p-4 text-center hover:shadow-lg transition-shadow cursor-pointer" onClick={() => startGame('ox')}>
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="ri-checkbox-circle-line text-2xl text-green-600"></i>
              </div>
              <h3 className="text-lg font-bold text-gray-800 mb-2">OX 퀴즈</h3>
              <p className="text-gray-600 mb-4 text-sm">참 또는 거짓을 선택하세요</p>
              <Button variant="success" className="w-full py-3 rounded-xl">게임 시작</Button>
            </Card>

            <Card className="p-4 text-center hover:shadow-lg transition-shadow cursor-pointer" onClick={() => startGame('speed')}>
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="ri-flashlight-line text-2xl text-orange-600"></i>
              </div>
              <h3 className="text-lg font-bold text-gray-800 mb-2">스피드 퀴즈</h3>
              <p className="text-gray-600 mb-4 text-sm">빠르게 단답형으로 답하세요</p>
              <Button className="w-full py-3 bg-orange-600 hover:bg-orange-700 rounded-xl">게임 시작</Button>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // ===== 진행 화면 =====
  return (
    <div className="min-h-screen bg-gray-50 pb-20 sm:pb-4">
      <div className="max-w-5xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-xl font-bold text-gray-800">
              {gameMode === 'multiple' && '객관식 퀴즈'}
              {gameMode === 'ox' && 'OX 퀴즈'}
              {gameMode === 'speed' && '스피드 퀴즈'}
            </h1>
            <p className="text-gray-600 text-sm">
              문제 {currentIndex + 1} / {Math.min(questions.length, QUESTIONS_PER_GAME)} · 점수: {score}점
            </p>
          </div>
          <div className="text-right">
            <div className={`text-2xl font-bold ${timeLeft <= 3 ? 'text-red-600' : 'text-blue-600'}`}>
              {timeLeft}
            </div>
            <Button onClick={() => endGame(score, answerHistory)} variant="danger" size="sm" className="mt-1 rounded-lg">
              게임 종료
            </Button>
          </div>
        </div>

        {/* Question Card */}
        <Card className="mb-6 p-4">
          {loading ? (
            <div className="text-center text-gray-500 py-6">문제를 불러오는 중...</div>
          ) : (
            <>
              <div className="text-center mb-6">
                <h2 className="text-lg font-bold text-gray-800 mb-4">
                  {currentQ?.question ?? '문제가 없습니다.'}
                </h2>
                {answering && currentQ && (
                  <div className="text-base font-semibold text-green-600">다음 문제로 넘어갑니다…</div>
                )}
              </div>

              {/* Multiple */}
              {currentQ?.type === 'multiple' && (
                <div className="space-y-3">
                  {(currentQ as UIMcq).options.map((opt, i) => (
                    <Button
                      key={i}
                      onClick={() => handleAnswer(opt)}
                      variant={answering ? (opt === (currentQ as UIMcq).answer ? 'success' : 'secondary') : 'secondary'}
                      disabled={answering}
                      className="w-full p-4 text-left rounded-xl"
                    >
                      {opt}
                    </Button>
                  ))}
                </div>
              )}

              {/* OX */}
              {currentQ?.type === 'ox' && (
                <div className="flex justify-center space-x-6">
                  <Button
                    onClick={() => handleAnswer('O')}
                    variant={answering ? ((currentQ as UIOx).answer === 'O' ? 'success' : 'secondary') : 'success'}
                    disabled={answering}
                    size="lg"
                    className="w-20 h-20 rounded-full text-2xl"
                  >
                    O
                  </Button>
                  <Button
                    onClick={() => handleAnswer('X')}
                    variant={answering ? ((currentQ as UIOx).answer === 'X' ? 'success' : 'secondary') : 'danger'}
                    disabled={answering}
                    size="lg"
                    className="w-20 h-20 rounded-full text-2xl"
                  >
                    X
                  </Button>
                </div>
              )}

              {/* Speed */}
              {currentQ?.type === 'speed' && (
                <div className="text-center">
                  <input
                    type="text"
                    placeholder="답을 입력하세요"
                    className="w-full px-4 py-3 text-base border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center bg-white"
                    value={speedInput}
                    onChange={(e) => setSpeedInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleAnswer(speedInput);
                    }}
                    disabled={answering}
                  />
                  <p className="text-sm text-gray-600 mt-2">Enter를 눌러 답안을 제출하세요</p>
                </div>
              )}
            </>
          )}
        </Card>

        {/* Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-1000"
            style={{ width: `${(timeLeft / limitByMode(gameMode)) * 100}%` }}
          />
        </div>

        {/* Question Progress */}
        <div className="mt-4 flex justify-center gap-1">
          {Array.from({ length: Math.min(questions.length, QUESTIONS_PER_GAME) }).map((_, idx) => (
            <div
              key={idx}
              className={`w-2 h-2 rounded-full ${idx < currentIndex
                ? answerHistory[idx]?.correct
                  ? 'bg-green-500'
                  : 'bg-red-500'
                : idx === currentIndex
                  ? 'bg-blue-600'
                  : 'bg-gray-300'
                }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
