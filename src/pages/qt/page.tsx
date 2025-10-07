import { useState, useEffect, useMemo } from 'react';
import Card from '../../components/base/Card';
import Button from '../../components/base/Button';
import { qtAPI } from '../../utils/api';

type QtItem = {
  id: number;
  username?: string;
  qtDate: string;                 // 'YYYY-MM-DD'
  scriptureRef: string;
  meditation: string;
  prayerTopic?: string;
  likes?: number;
  shared?: boolean;
  createdAt?: string;
};

export default function QT() {
  // 로컬(한국시간) 기준 YYYY-MM-DD
  const formatLocalYmd = (d: Date) => {
    const yyyy = d.getFullYear();
    const mm = `${d.getMonth() + 1}`.padStart(2, '0');
    const dd = `${d.getDate()}`.padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const todayYmd = useMemo(() => formatLocalYmd(new Date()), []);
  const [selectedDate, setSelectedDate] = useState(todayYmd);

  const [verse, setVerse] = useState('');
  const [reflection, setReflection] = useState('');
  const [prayer, setPrayer] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  const [user, setUser] = useState<{ username: string } | null>(null);
  const [qtHistory, setQtHistory] = useState<QtItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) return;
    try {
      const parsed = JSON.parse(userData);
      setUser(parsed);
      loadQTHistory(parsed.username);
    } catch {
      localStorage.removeItem('user');
    }
  }, []);

  const loadQTHistory = async (username: string) => {
    try {
      const history = await qtAPI.getUserQTs(username);
      const list: QtItem[] = Array.isArray(history) ? history : [];
      // 날짜 최신순 정렬 (qtDate/createdAt 둘 다 대비)
      list.sort((a, b) => {
        const ad = new Date(a.createdAt || a.qtDate).getTime();
        const bd = new Date(b.createdAt || b.qtDate).getTime();
        return bd - ad;
      });
      setQtHistory(list);
    } catch (e) {
      console.error('Failed to load QT history:', e);
    }
  };

  const handleSubmit = async () => {
    if (!user) {
      alert('로그인이 필요합니다.');
      return;
    }
    if (!verse || !reflection || !prayer) {
      alert('모든 항목을 작성해주세요.');
      return;
    }

    setIsLoading(true);
    try {
      await qtAPI.create(user.username, selectedDate, verse, reflection, prayer);
      setIsSubmitted(true);
      setVerse('');
      setReflection('');
      setPrayer('');
      await loadQTHistory(user.username);
    } catch (e) {
      console.error('Failed to create QT:', e);
      alert('큐티 작성에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLike = async (qtId: number) => {
    if (!user) {
      alert('로그인이 필요합니다.');
      return;
    }
    try {
      await qtAPI.like(qtId);
      await loadQTHistory(user.username);
    } catch (e) {
      console.error('Failed to like QT:', e);
      alert('좋아요 처리에 실패했습니다.');
    }
  };

  const now = new Date();
  const thisMonth = now.getMonth() + 1;
  const thisYear = now.getFullYear();

  const thisMonthQTs = qtHistory.filter((qt) => {
    const d = new Date(qt.qtDate);
    return d.getMonth() + 1 === thisMonth && d.getFullYear() === thisYear;
  });

  const sharedQTs = qtHistory.filter((qt) => qt.shared).slice(0, 2);

  return (
    <div className="min-h-screen bg-gray-50 pb-20 sm:pb-4">
      <div className="px-4 py-6">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <i className="ri-book-open-line text-2xl text-white"></i>
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">큐티 작성</h1>
          <p className="text-gray-600">하나님의 말씀을 묵상하고 나누어보세요</p>
        </div>

        {/* QT Writing Form */}
        <Card className="mb-6 p-4">
          {!isSubmitted ? (
            <div className="space-y-4">
              <div className="text-center mb-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">오늘의 큐티 작성</h3>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">날짜</label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm bg-white"
                  disabled={isLoading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">본문 말씀</label>
                <input
                  type="text"
                  value={verse}
                  onChange={(e) => setVerse(e.target.value)}
                  placeholder="예: 시편 23:1-6"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm bg-white"
                  disabled={isLoading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">묵상 내용</label>
                <textarea
                  value={reflection}
                  onChange={(e) => setReflection(e.target.value)}
                  placeholder="오늘 말씀을 통해 깨달은 점이나 은혜받은 내용을 적어보세요..."
                  rows={5}
                  maxLength={500}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm resize-none bg-white"
                  disabled={isLoading}
                />
                <p className="text-xs text-gray-500 mt-1">{reflection.length}/500자</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">기도제목</label>
                <textarea
                  value={prayer}
                  onChange={(e) => setPrayer(e.target.value)}
                  placeholder="오늘의 기도제목을 적어보세요..."
                  rows={3}
                  maxLength={500}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm resize-none bg-white"
                  disabled={isLoading}
                />
                <p className="text-xs text-gray-500 mt-1">{prayer.length}/500자</p>
              </div>

              <div className="grid grid-cols-1 gap-3 mt-6">
                <Button
                  onClick={handleSubmit}
                  className="w-full py-3 bg-purple-600 hover:bg-purple-700 rounded-xl"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      저장 중...
                    </>
                  ) : (
                    <>
                      <i className="ri-save-line mr-2"></i>
                      큐티 저장하기
                    </>
                  )}
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center py-6">
              <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="ri-check-line text-3xl text-purple-600"></i>
              </div>
              <h3 className="text-xl font-bold text-purple-600 mb-2">큐티 작성 완료!</h3>
              <p className="text-gray-600 mb-4">오늘의 큐티가 저장되었습니다.</p>
              <Button onClick={() => setIsSubmitted(false)} variant="secondary" className="rounded-xl">
                새 큐티 작성하기
              </Button>
            </div>
          )}
        </Card>

        {/* QT Statistics */}
        <Card className="mb-6 p-4">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">큐티 현황</h3>
          <div className="text-center mb-4">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <i className="ri-book-open-line text-2xl text-purple-600"></i>
            </div>
            <p className="text-2xl font-bold text-purple-600">{thisMonthQTs.length}일</p>
            <p className="text-sm text-gray-600">이번 달 큐티</p>
          </div>

          <div className="border-t border-gray-200 pt-4 mb-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-600">이번 주 진행률</span>
              <span className="text-sm font-semibold text-purple-600">
                {Math.min(thisMonthQTs.length, 7)}/7일
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-purple-600 h-2 rounded-full"
                style={{ width: `${Math.min((thisMonthQTs.length / 7) * 100, 100)}%` }}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="text-center p-3 bg-blue-50 rounded-xl">
              <p className="text-lg font-bold text-blue-600">{qtHistory.length}</p>
              <p className="text-xs text-gray-600">총 큐티 수</p>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-xl">
              <p className="text-lg font-bold text-green-600">{sharedQTs.length}</p>
              <p className="text-xs text-gray-600">공유한 큐티</p>
            </div>
          </div>
        </Card>

        {/* My QT Records */}
        <Card className="mb-6 p-4">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">나의 큐티 기록</h3>
          <div className="space-y-3">
            {qtHistory.length > 0 ? (
              qtHistory.slice(0, 3).map((qt) => (
                <div key={qt.id} className="p-3 bg-gray-50 rounded-xl">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-sm font-medium text-gray-800">{qt.scriptureRef}</span>
                    {qt.shared && <i className="ri-share-line text-purple-500 text-sm"></i>}
                  </div>
                  <p className="text-xs text-gray-600 mb-1 line-clamp-2">{qt.meditation}</p>
                  <p className="text-xs text-gray-500">
                    {new Date(qt.qtDate).toLocaleDateString('ko-KR')}
                  </p>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <i className="ri-book-open-line text-4xl mb-2"></i>
                <p>큐티 기록이 없습니다.</p>
              </div>
            )}
            {qtHistory.length > 3 && (
              <Button variant="secondary" size="sm" className="w-full mt-3 rounded-xl">
                전체 기록 보기
              </Button>
            )}
          </div>
        </Card>

        {/* Shared QTs */}
        <Card className="p-4">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">함께 나누는 큐티</h3>
          <div className="space-y-4">
            {sharedQTs.length > 0 ? (
              sharedQTs.map((qt) => (
                <div key={qt.id} className="p-4 border border-gray-200 rounded-xl hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="font-semibold text-gray-800 text-sm">{qt.scriptureRef}</h4>
                      <p className="text-sm text-purple-600">
                        {new Date(qt.qtDate).toLocaleDateString('ko-KR')}
                      </p>
                    </div>
                    <button
                      onClick={() => handleLike(qt.id)}
                      className="flex items-center space-x-1 text-red-500 hover:text-red-600"
                    >
                      <i className="ri-heart-line text-sm"></i>
                      <span className="text-xs">{qt.likes ?? 0}</span>
                    </button>
                  </div>
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">{qt.meditation}</p>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-500">by {qt.username ?? ''}</span>
                    <span className="text-xs text-gray-500">
                      {new Date(qt.createdAt || qt.qtDate).toLocaleDateString('ko-KR')}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <i className="ri-share-line text-4xl mb-2"></i>
                <p>공유된 큐티가 없습니다.</p>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
