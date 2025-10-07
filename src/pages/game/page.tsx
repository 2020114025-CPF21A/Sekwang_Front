import { useEffect, useMemo, useRef, useState } from 'react';
import Card from '../../components/base/Card';
import Button from '../../components/base/Button';
import { mcAPI, oxAPI, speedAPI } from '../../utils/api';

type GameMode = 'multiple' | 'ox' | 'speed';

type UIMcq = { type: 'multiple'; id: number; question: string; options: string[]; answer: string };
type UIOx  = { type: 'ox'; id: number; question: string; answer: 'O' | 'X' };
type UISpd = { type: 'speed'; id: number; question: string; accepts: string[] };

type UIQuestion = UIMcq | UIOx | UISpd;

export default function Game() {
  const [gameMode, setGameMode] = useState<GameMode>('multiple');
  const [gameStarted, setGameStarted] = useState(false);
  const [loading, setLoading] = useState(false);

  const [setId, setSetId] = useState<number | null>(null);
  const [questions, setQuestions] = useState<UIQuestion[]>([]);
  const [currentQ, setCurrentQ] = useState<UIQuestion | null>(null);

  const [answering, setAnswering] = useState(false);
  const [score, setScore] = useState(0);

  const [timeLeft, setTimeLeft] = useState(10);
  const [speedInput, setSpeedInput] = useState('');
  const usedIdsRef = useRef<Set<number>>(new Set());

  const user = useMemo(() => {
    try { return JSON.parse(localStorage.getItem('user') || '{}'); }
    catch { return {}; }
  }, []);

  // 타이머
  useEffect(() => {
    if (!gameStarted || !currentQ) return;
    if (answering) return;
    if (timeLeft <= 0) { handleTimeUp(); return; }

    const t = setTimeout(() => setTimeLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [gameStarted, currentQ, timeLeft, answering]);

  // 모드별 제한시간
  const limitByMode = (mode: GameMode) => (mode === 'speed' ? 5 : 10);

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
          if (ans === '0') ans = 'X';
          return { type: 'ox', id: q.id, question: q.question, answer: (ans === 'O' ? 'O' : 'X') as 'O' | 'X' };
        }
        // speed
        const accepts = [q.accept1, q.accept2, q.accept3]
          .filter(Boolean)
          .map((s: string) => s.trim())
          .filter((s: string) => s.length > 0);
        return { type: 'speed', id: q.id, question: q.question, accepts };
      });

      setQuestions(uiQs);
      usedIdsRef.current = new Set();
      setCurrentQ(pickNext(uiQs));
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

  const pickNext = (pool: UIQuestion[] = questions): UIQuestion | null => {
    if (!pool.length) return null;

    // 아직 안 쓴 문제 중에서 랜덤 선택
    const unused = pool.filter((q) => !usedIdsRef.current.has(q.id));
    const source = unused.length ? unused : pool; // 다 쓰면 재사용 가능
    const next = source[Math.floor(Math.random() * source.length)];
    usedIdsRef.current.add(next.id);
    return next;
  };

  // ===== 게임 시작/종료 =====
  const startGame = async (mode: GameMode) => {
    setGameMode(mode);
    setScore(0);
    setAnswering(false);
    setGameStarted(true);
    await loadRandomSet(mode);
  };

  const endGame = async () => {
    setGameStarted(false);
    setAnswering(false);
    setSpeedInput('');
    try {
      if (user?.username && setId) {
        if (gameMode === 'multiple') await mcAPI.saveResult(user.username, setId, score);
        else if (gameMode === 'ox') await oxAPI.saveResult(user.username, setId, score);
        else await speedAPI.saveResult(user.username, setId, score);
      }
    } catch (e) {
      console.error('결과 저장 실패:', e);
    } finally {
      setCurrentQ(null);
      setQuestions([]);
      setSetId(null);
    }
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

    setAnswering(true);
    if (correct) setScore((s) => s + 1);

    setTimeout(() => {
      const next = pickNext();
      setCurrentQ(next);
      setTimeLeft(limitByMode(gameMode));
      setAnswering(false);
      setSpeedInput('');
    }, 1200);
  };

  const handleTimeUp = () => {
    setAnswering(true);
    setTimeout(() => {
      const next = pickNext();
      setCurrentQ(next);
      setTimeLeft(limitByMode(gameMode));
      setAnswering(false);
      setSpeedInput('');
    }, 1000);
  };

  // ===== 시작 화면 =====
  if (!gameStarted) {
    return (
      <div className="min-h-screen bg-gray-50 pb-20 sm:pb-4">
        <div className="px-4 py-6">
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
      <div className="px-4 py-6">
        {/* Header */}
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
            <Button onClick={endGame} variant="danger" size="sm" className="mt-1 rounded-lg">
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
      </div>
    </div>
  );
}
