import { useEffect, useMemo, useState } from 'react';
import Card from '../../components/base/Card';
import Button from '../../components/base/Button';
import { attendanceAPI } from '../../utils/api';

type AttendanceRecord = {
  attendDate?: string; // "YYYY-MM-DD" 형태 가정
  date?: string;       // 백엔드가 다른 키를 쓰는 경우 대비
  status: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED' | string;
};

export default function Monthly() {
  const today = useMemo(() => new Date(), []);
  const [selectedMonth, setSelectedMonth] = useState(today.getMonth()); // 0~11
  const [selectedYear, setSelectedYear] = useState(today.getFullYear());
  const [user, setUser] = useState<{ username: string } | null>(null);

  const [allRecords, setAllRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const months = [
    '1월', '2월', '3월', '4월', '5월', '6월',
    '7월', '8월', '9월', '10월', '11월', '12월'
  ];

  // ✅ 유저 로드 & 출석 데이터 가져오기
  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) return;
    try {
      const parsed = JSON.parse(userData);
      if (parsed?.username) {
        setUser({ username: parsed.username });
        fetchAttendance(parsed.username);
      }
    } catch (e) {
      console.error('Failed to parse user from localStorage', e);
    }
  }, []);

  const fetchAttendance = async (username: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await attendanceAPI.getUserAttendance(username);
      setAllRecords(Array.isArray(data) ? data : []);
    } catch (e: any) {
      console.error('출석 데이터 로드 실패:', e);
      setError('출석 데이터를 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const getDaysInMonth = (year: number, month: number) =>
    new Date(year, month + 1, 0).getDate();

  // ✅ 선택된 월의 일요일 목록
  const monthSundays = useMemo(() => {
    const y = selectedYear;
    const m = selectedMonth;
    const first = new Date(y, m, 1);
    const last = new Date(y, m + 1, 0);
    const list: { ymd: string; date: Date; day: number }[] = [];

    const start = new Date(first);
    // 첫 번째 일요일 찾기
    const offsetToSunday = (7 - start.getDay()) % 7;
    start.setDate(start.getDate() + offsetToSunday);

    // 모든 일요일 수집
    while (start <= last) {
      list.push({ 
        ymd: formatLocalYmd(start), 
        date: new Date(start),
        day: start.getDate()
      });
      start.setDate(start.getDate() + 7);
    }
    return list;
  }, [selectedYear, selectedMonth]);

  // ✅ 일요일별 출석 여부 맵
  const attendanceMap = useMemo(() => {
    const byYmd = new Map(allRecords.map(r => [r.attendDate || r.date, r as AttendanceRecord]));
    const map: Record<number, boolean> = {};
    
    monthSundays.forEach(sunday => {
      const record = byYmd.get(sunday.ymd);
      map[sunday.day] = record ? String(record.status).toUpperCase() === 'PRESENT' : false;
    });
    
    return map;
  }, [allRecords, monthSundays]);

  const getAttendanceRate = () => {
    const total = monthSundays.length;
    const attended = monthSundays.filter(s => attendanceMap[s.day]).length;
    return total > 0 ? Math.round((attended / total) * 100) : 0;
  };

  const getAttendedDays = () => {
    return monthSundays.filter(s => attendanceMap[s.day]).length;
  };

  // 오늘 출석은 출석체크 페이지에서만 가능하도록 (QR/코드 체크인)
  // 월간 페이지는 조회 전용

  const achievements = [
    { title: '완벽한 한 주', description: '일주일 연속 출석', achieved: getAttendanceRate() >= 25, icon: 'ri-trophy-line', color: 'text-yellow-600' },
    { title: '성실한 학생', description: '한 달 80% 이상 출석', achieved: getAttendanceRate() >= 80, icon: 'ri-medal-line', color: 'text-blue-600' },
    { title: '출석왕', description: '한 달 완벽 출석', achieved: getAttendanceRate() === 100, icon: 'ri-crown-line', color: 'text-purple-600' },
    { title: '꾸준함의 힘', description: '3개월 연속 출석', achieved: false, icon: 'ri-fire-line', color: 'text-red-600' }
  ];

  return (
    <div className="min-h-screen bg-gray-50 pb-20 sm:pb-4">
      <div className="max-w-5xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <i className="ri-calendar-2-line text-2xl text-white"></i>
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">월간 출석표</h1>
          <p className="text-gray-600">포도알을 채워가며 출석의 기쁨을 느껴보세요</p>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-6">
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm pr-8 bg-white"
          >
            {/* 필요 시 동적 생성 */}
            <option value={today.getFullYear()}>{today.getFullYear()}년</option>
            <option value={today.getFullYear() - 1}>{today.getFullYear() - 1}년</option>
          </select>
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
            className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm pr-8 bg-white"
          >
            {months.map((m, idx) => (
              <option key={idx} value={idx}>{m}</option>
            ))}
          </select>

          <Button
            variant="secondary"
            className="rounded-xl"
            onClick={() => user && fetchAttendance(user.username)}
            disabled={loading}
          >
            <i className="ri-refresh-line mr-1" />
            새로고침
          </Button>
        </div>

        {error && (
          <Card className="mb-6 p-4 text-sm text-red-600 bg-red-50 border border-red-200">
            {error}
          </Card>
        )}

        {/* Grape Attendance Chart */}
        <Card className="mb-6 p-4">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            {selectedYear}년 {months[selectedMonth]} 출석표
          </h3>

          {loading ? (
            <div className="text-center py-8">불러오는 중…</div>
          ) : (
            <>
              <div className="text-center mb-6">
                <div className="inline-block p-6 bg-gradient-to-br from-purple-100 to-pink-100 rounded-2xl">
                  <div className="text-6xl mb-2">🍇</div>
                  <p className="text-lg font-bold text-purple-600">
                    {getAttendedDays()} / {monthSundays.length} 주일
                  </p>
                  <p className="text-sm text-gray-600">출석률 {getAttendanceRate()}%</p>
                </div>
              </div>

              {/* Sunday Grape Grid */}
              <div className="flex flex-wrap justify-center gap-4 mb-6">
                {monthSundays.map((sunday) => {
                  const isAttended = attendanceMap[sunday.day];
                  return (
                    <div key={sunday.ymd} className="text-center">
                      <div className="text-xs text-gray-600 mb-1">
                        {sunday.date.getMonth() + 1}/{sunday.date.getDate()} (일)
                      </div>
                      <div
                        className={`w-14 h-14 rounded-full flex items-center justify-center text-2xl transition-all duration-300 ${
                          isAttended ? 'bg-purple-100 scale-110 shadow-lg' : 'bg-gray-100 opacity-50'
                        }`}
                        title={isAttended ? '출석' : '결석'}
                      >
                        {isAttended ? '🍇' : '⚪'}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Progress Bar */}
              <div className="mb-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-700">이번 달 진행률</span>
                  <span className="text-sm font-bold text-purple-600">{getAttendanceRate()}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-gradient-to-r from-purple-500 to-pink-500 h-3 rounded-full transition-all duration-500"
                    style={{ width: `${getAttendanceRate()}%` }}
                  />
                </div>
              </div>

              {getAttendanceRate() === 100 && (
                <div className="text-center p-4 bg-gradient-to-r from-yellow-100 to-orange-100 rounded-xl">
                  <div className="text-4xl mb-2">🎉</div>
                  <p className="text-lg font-bold text-orange-600">완벽한 출석! 축하합니다!</p>
                  <p className="text-sm text-gray-600">한 달 동안 한 번도 빠지지 않고 출석하셨네요!</p>
                </div>
              )}
            </>
          )}
        </Card>

        {/* Monthly Stats */}
        <Card className="mb-6 p-4">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">이번 달 통계</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">전체 주일</span>
              <span className="text-2xl font-bold text-gray-700">{monthSundays.length}회</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">출석한 주일</span>
              <span className="text-2xl font-bold text-purple-600">{getAttendedDays()}회</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">결석한 주일</span>
              <span className="text-2xl font-bold text-red-600">
                {monthSundays.length - getAttendedDays()}회
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">출석률</span>
              <span className="text-2xl font-bold text-blue-600">{getAttendanceRate()}%</span>
            </div>

            <div className="border-t border-gray-200 pt-4">
              <div className="text-center">
                <div className="text-3xl mb-2">
                  {getAttendanceRate() >= 90 ? '🏆' : getAttendanceRate() >= 80 ? '🥈' : getAttendanceRate() >= 70 ? '🥉' : '💪'}
                </div>
                <p className="text-sm font-medium text-gray-700">
                  {getAttendanceRate() >= 90 ? '최우수' :
                   getAttendanceRate() >= 80 ? '우수' :
                   getAttendanceRate() >= 70 ? '양호' : '노력 필요'}
                </p>
              </div>
            </div>
          </div>
        </Card>

        {/* Achievements */}
        <Card className="mb-6 p-4">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">성취 배지</h3>
          <div className="space-y-3">
            {achievements.map((a, i) => (
              <div
                key={i}
                className={`flex items-center space-x-3 p-3 rounded-xl ${
                  a.achieved ? 'bg-green-50 border border-green-200' : 'bg-gray-50 border border-gray-200'
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                    a.achieved ? 'bg-green-100' : 'bg-gray-100'
                  }`}
                >
                  <i className={`${a.icon} text-lg ${a.achieved ? a.color : 'text-gray-400'}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`font-medium text-sm ${a.achieved ? 'text-gray-800' : 'text-gray-500'}`}>
                    {a.title}
                  </p>
                  <p className="text-xs text-gray-600">{a.description}</p>
                </div>
                {a.achieved && <i className="ri-check-line text-green-500 flex-shrink-0" />}
              </div>
            ))}
          </div>
        </Card>

        {/* Yearly Overview (샘플 표시는 유지) */}
        <Card className="p-4">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">연간 출석 현황</h3>
          <div className="grid grid-cols-4 gap-3">
            {months.map((month, index) => (
              <div key={index} className="text-center">
                <div className="text-xs font-medium text-gray-700 mb-2">{month}</div>
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl mx-auto ${
                    index <= selectedMonth ? 'bg-purple-100' : 'bg-gray-100'
                  }`}
                >
                  {index <= selectedMonth ? '🍇' : '⚪'}
                </div>
                <div className="text-xs text-gray-600 mt-1">
                  {index === selectedMonth ? `${getAttendanceRate()}%` : index < selectedMonth ? '—' : '-'}
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
