import { useEffect, useMemo, useState } from 'react';
import Card from '../../components/base/Card';
import Button from '../../components/base/Button';
import { faithAPI } from '../../utils/api'; // ← utils/api에서 앞서 맞춘 엔드포인트 사용

type DiaryItem = {
  id: number;
  title: string;
  content: string;
  moodCode: number;     // 0~7
  weatherCode: number;  // 0~7
  createdAt?: string;
  views?: number;
  author?: string;
};

const MOODS = ['😊','😢','😍','😴','😤','🤔','😇','🥳'];
const WEATHERS = ['☀️','⛅','☁️','🌧️','⛈️','❄️','🌈','🌙'];

export default function Diary() {
  const [selectedDiary, setSelectedDiary] = useState<DiaryItem | null>(null);
  const [isWriting, setIsWriting] = useState(false);
  const [newDiary, setNewDiary] = useState({ title: '', content: '', moodCode: 0, weatherCode: 0 });
  const [list, setList] = useState<DiaryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const user = useMemo(() => {
    try {
      const raw = localStorage.getItem('user');
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  }, []);
  const isAdmin = (user?.role || '').toString().toUpperCase() === 'ADMIN';

  const fmtDate = (s?: string) => {
    if (!s) return '';
    const d = new Date(s);
    return isNaN(d.getTime()) ? s : d.toLocaleDateString('ko-KR');
    };

  const load = async () => {
    if (!user?.username) return;
    setLoading(true);
    try {
      // GET /api/faith-journals/user/{username}?page=0&size=50
      const data = await faithAPI.getUserJournals(user.username, 0, 50);
      const normalized: DiaryItem[] = (Array.isArray(data) ? data : []).map((it: any) => ({
        id: Number(it.id),
        title: it.title ?? '',
        content: it.content ?? '',
        moodCode: Number(it.moodCode ?? 0),
        weatherCode: Number(it.weatherCode ?? 0),
        createdAt: it.createdAt ?? it.date,
        views: Number(it.views ?? 0),
        author: it.author,
      }));
      setList(normalized);
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [user?.username]);

  const handleWriteDiary = async () => {
    if (!user) { alert('로그인이 필요합니다.'); return; }
    if (!newDiary.title.trim() || !newDiary.content.trim()) {
      alert('제목과 내용을 모두 입력해주세요.'); return;
    }
    setSaving(true);
    try {
      // POST /api/faith-journals
      await faithAPI.create(
        user.username,
        newDiary.moodCode,
        newDiary.weatherCode,
        newDiary.title.trim(),
        newDiary.content.trim()
      );
      setIsWriting(false);
      setNewDiary({ title: '', content: '', moodCode: 0, weatherCode: 0 });
      await load();
      alert('일지가 저장되었습니다.');
    } catch (e) {
      console.error(e);
      alert('저장에 실패했습니다.');
    } finally { setSaving(false); }
  };

  const openDetail = async (d: DiaryItem) => {
    try {
      // GET /api/faith-journals/{id} (조회수 증가)
      const res = await faithAPI.getById(d.id);
      const normalized: DiaryItem = {
        id: res.id, title: res.title, content: res.content,
        moodCode: res.moodCode, weatherCode: res.weatherCode,
        createdAt: res.createdAt, views: res.views, author: res.author
      };
      setSelectedDiary(normalized);
      // 목록의 조회수도 갱신
      setList((prev) => prev.map(x => x.id === d.id ? { ...x, views: normalized.views } : x));
    } catch { setSelectedDiary(d); }
  };

  // 월 통계 간단 계산 (이달 작성 수/연속 작성은 샘플 로직)
  const thisMonth = new Date().getMonth();
  const thisYear = new Date().getFullYear();
  const thisMonthList = list.filter(x => {
    if (!x.createdAt) return false;
    const dt = new Date(x.createdAt);
    return dt.getFullYear() === thisYear && dt.getMonth() === thisMonth;
  });
  const topMoodCode =
    thisMonthList.length
      ? thisMonthList.reduce((acc, cur) => {
          acc[cur.moodCode] = (acc[cur.moodCode] ?? 0) + 1; return acc;
        }, {} as Record<number, number>)
      : {};
  const topMood =
    Object.keys(topMoodCode).length
      ? MOODS[Number(Object.entries(topMoodCode).sort((a,b)=>b[1]-a[1])[0][0])]
      : MOODS[0];

  return (
    <div className="min-h-screen bg-gray-50 pb-20 sm:pb-4">
      <div className="max-w-5xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-orange-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <i className="ri-file-text-line text-2xl text-white"></i>
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">신앙 일지</h1>
          <p className="text-gray-600">하나님과 함께한 일상을 기록해보세요</p>
        </div>

        {/* Write Button (관리자만 표시) */}
        {isAdmin && (
          <div className="mb-6">
            <Button onClick={() => setIsWriting(true)} className="w-full py-3 rounded-xl">
              <i className="ri-add-line mr-2"></i>
              일지 작성
            </Button>
          </div>
        )}

        {isWriting && (
          <Card className="mb-6 p-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">새 일지 작성</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">오늘의 기분</label>
                  <div className="grid grid-cols-4 gap-2">
                    {MOODS.map((mood, idx) => (
                      <button
                        key={mood}
                        onClick={() => setNewDiary({ ...newDiary, moodCode: idx })}
                        className={`w-full aspect-square text-2xl rounded-xl border-2 transition-colors cursor-pointer ${
                          newDiary.moodCode === idx ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-300'
                        }`}
                      >
                        {mood}
                      </button>
                    ))}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">오늘의 날씨</label>
                  <div className="grid grid-cols-4 gap-2">
                    {WEATHERS.map((w, idx) => (
                      <button
                        key={w}
                        onClick={() => setNewDiary({ ...newDiary, weatherCode: idx })}
                        className={`w-full aspect-square text-2xl rounded-xl border-2 transition-colors cursor-pointer ${
                          newDiary.weatherCode === idx ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-300'
                        }`}
                      >
                        {w}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">제목</label>
                <input
                  type="text"
                  value={newDiary.title}
                  onChange={(e) => setNewDiary({ ...newDiary, title: e.target.value })}
                  placeholder="오늘의 일지 제목을 입력하세요"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">내용</label>
                <textarea
                  value={newDiary.content}
                  onChange={(e) => setNewDiary({ ...newDiary, content: e.target.value })}
                  placeholder="오늘 하나님과 함께한 일상을 기록해보세요..."
                  rows={8}
                  maxLength={500}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm resize-none bg-white"
                />
                <p className="text-xs text-gray-500 mt-1">{newDiary.content.length}/500자</p>
              </div>

            <div className="grid grid-cols-2 gap-3 mt-6">
                <Button onClick={handleWriteDiary} className="py-3 rounded-xl" disabled={saving}>
                  {saving ? '저장 중...' : '일지 저장하기'}
                </Button>
                <Button onClick={() => setIsWriting(false)} variant="secondary" className="py-3 rounded-xl" disabled={saving}>
                  취소
                </Button>
              </div>
            </div>
          </Card>
        )}

        {selectedDiary ? (
          <Card className="p-4">
            <div className="mb-4">
              <Button onClick={() => setSelectedDiary(null)} variant="secondary" size="sm" className="rounded-xl">
                <i className="ri-arrow-left-line mr-2"></i>
                목록으로
              </Button>
            </div>
            {isAdmin && (
              <div className="mb-4 flex justify-end">
                <Button
                  variant="danger"
                  size="sm"
                  onClick={async () => {
                    if (!selectedDiary) return;
                    if (!confirm('이 일지를 삭제하시겠습니까?')) return;
                    try {
                      await faithAPI.remove(selectedDiary.id);
                      alert('삭제되었습니다.');
                      setSelectedDiary(null);
                      await load();
                    } catch (err) {
                      console.error(err);
                      alert('삭제에 실패했습니다.');
                    }
                  }}
                >
                  <i className="ri-delete-bin-line mr-1"></i> 삭제
                </Button>
              </div>
            )}
            
            <div className="border-b border-gray-200 pb-4 mb-4">
              <div className="flex items-center space-x-3 mb-3">
                <span className="text-3xl">{MOODS[selectedDiary.moodCode]}</span>
                <span className="text-3xl">{WEATHERS[selectedDiary.weatherCode]}</span>
              </div>
              <h2 className="text-xl font-bold text-gray-800 mb-3">{selectedDiary.title}</h2>
              
              <div className="flex items-center space-x-4 text-sm text-gray-600">
                <span>작성일: {fmtDate(selectedDiary.createdAt)}</span>
                <span>조회수: {selectedDiary.views ?? 0}</span>
              </div>
            </div>
            
            <div className="prose max-w-none">
              <div className="whitespace-pre-wrap text-gray-700 leading-relaxed text-sm">
                {selectedDiary.content}
              </div>
            </div>
          </Card>
        ) : (
          <div className="space-y-4">
            {loading ? (
              <Card className="p-4 text-center text-gray-500">불러오는 중...</Card>
            ) : list.length === 0 ? (
              <Card className="p-4 text-center text-gray-500">작성한 일지가 없습니다.</Card>
            ) : (
              list.map((d) => (
                <Card key={d.id} className="p-4 hover:shadow-md transition-shadow cursor-pointer" onClick={() => openDetail(d)}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1 pr-3">
                      <div className="flex items-center space-x-3 mb-3">
                        <span className="text-2xl">{MOODS[d.moodCode]}</span>
                        <span className="text-2xl">{WEATHERS[d.weatherCode]}</span>
                        <h3 className="text-base font-semibold text-gray-800 hover:text-blue-600 line-clamp-1">
                          {d.title}
                        </h3>
                      </div>
                      <p className="text-gray-600 mb-3 line-clamp-2 text-sm">
                        {d.content}
                      </p>
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <span>{fmtDate(d.createdAt)}</span>
                        <span>조회수: {d.views ?? 0}</span>
                      </div>
                    </div>
                    <i className="ri-arrow-right-s-line text-gray-400 text-xl flex-shrink-0"></i>
                  </div>
                </Card>
              ))
            )}
          </div>
        )}

        {/* Monthly Summary */}
        <Card className="mt-6 p-4">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">이번 달 일지 현황</h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <i className="ri-file-text-line text-xl text-blue-600"></i>
              </div>
              <p className="text-xl font-bold text-blue-600">{thisMonthList.length}</p>
              <p className="text-xs text-gray-600">작성한 일지</p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <i className="ri-calendar-check-line text-xl text-green-600"></i>
              </div>
              <p className="text-xl font-bold text-green-600">
                {/* 간단 샘플: 연속일 로직은 서버가 주면 교체 */}
                {Math.min(thisMonthList.length, 30)}
              </p>
              <p className="text-xs text-gray-600">연속 작성일</p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <span className="text-xl">{topMood}</span>
              </div>
              <p className="text-base font-bold text-purple-600">
                {topMood ? '주요 기분' : '-'}
              </p>
              <p className="text-xs text-gray-600">이번 달</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
