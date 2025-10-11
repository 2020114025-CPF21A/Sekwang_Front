import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../../components/base/Card';
import Button from '../../components/base/Button';
import { attendanceAPI, offeringAPI, qtAPI, noticeAPI } from '../../utils/api';

export default function Home() {
  const navigate = useNavigate();
  const [user, setUser] = useState<{ displayName: string; username: string; role: string } | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [notices, setNotices] = useState<any[]>([]);
  const [attendanceRate, setAttendanceRate] = useState<number | null>(null);
  const [totalOffering, setTotalOffering] = useState<number | null>(null);
  const [qtCount, setQtCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  // 유저 불러오기 + API 호출
  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
        fetchDashboardData(parsedUser.username);
      } catch (error) {
        console.error('Failed to parse user data:', error);
        localStorage.removeItem('user');
      }
    }
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchDashboardData = async (username: string) => {
    setLoading(true);
    try {
      const [attendData, offeringSummary, qtData, noticeList] = await Promise.all([
        attendanceAPI.getUserAttendance(username),
        offeringAPI.getUserSummary(username),
        qtAPI.getUserQTs(username),
        noticeAPI.getAll(),
      ]);

      // ✅ 출석률 계산
      if (Array.isArray(attendData)) {
        const thisMonth = new Date().getMonth();
        const filtered = attendData.filter((r) => new Date(r.attendDate || r.date).getMonth() === thisMonth);
        const totalDays = new Date(new Date().getFullYear(), thisMonth + 1, 0).getDate();
        const attended = filtered.filter((r) => String(r.status).toUpperCase() === 'PRESENT').length;
        setAttendanceRate(Math.round((attended / totalDays) * 100));
      }

      // ✅ 헌금 요약
      setTotalOffering(offeringSummary?.total || 0);

      // ✅ QT 작성 수
      setQtCount(Array.isArray(qtData) ? qtData.length : 0);

      // ✅ 공지사항
      setNotices(Array.isArray(noticeList) ? noticeList.slice(0, 3) : []);
    } catch (err) {
      console.error('대시보드 데이터 로드 실패:', err);
    } finally {
      setLoading(false);
    }
  };

  const quickActions = [
    { title: '출석체크', icon: 'ri-calendar-check-line', path: '/attendance', color: 'bg-blue-500', description: '오늘 출석하기' },
    { title: '헌금기록', icon: 'ri-hand-heart-line', path: '/offering', color: 'bg-green-500', description: '헌금 내역 확인' },
    { title: '큐티작성', icon: 'ri-book-open-line', path: '/qt', color: 'bg-purple-500', description: '오늘의 큐티' },
    { title: '미니게임', icon: 'ri-gamepad-line', path: '/game', color: 'bg-orange-500', description: '성경 퀴즈' },
  ];

  const menuItems = [
    { title: '공지사항', icon: 'ri-notification-line', path: '/notice' },
    { title: '사진첩', icon: 'ri-image-line', path: '/gallery' },
    { title: '일지', icon: 'ri-file-text-line', path: '/diary' },
    { title: '주보', icon: 'ri-newspaper-line', path: '/bulletin' },
    { title: '찬양악보', icon: 'ri-music-line', path: '/music' },
    { title: '월간출석', icon: 'ri-calendar-2-line', path: '/monthly' },
  ];

  // 로그인하지 않은 경우 로그인 유도 화면
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center px-4 pb-20">
        <div className="w-full max-w-md text-center">
          <div className="w-24 h-24 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
            <i className="ri-church-line text-4xl text-white"></i>
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-4" style={{ fontFamily: '"Pacifico", serif' }}>
            청소년부 행정시스템
          </h1>
          <p className="text-gray-600 mb-8 leading-relaxed">
            출석체크, 헌금기록, 큐티작성 등<br /> 다양한 기능을 이용하려면 로그인해주세요
          </p>
          <div className="space-y-3">
            <Button onClick={() => navigate('/login')} className="w-full py-4 text-lg rounded-xl">
              <i className="ri-login-circle-line mr-2"></i> 로그인하기
            </Button>
            <Button variant="secondary" onClick={() => navigate('/register')} className="w-full py-4 text-lg rounded-xl">
              <i className="ri-user-add-line mr-2"></i> 회원가입
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20 sm:pb-4">
      {/* 상단 인사 섹션 */}
      <div
  className="text-white bg-cover bg-center"
  style={{
    backgroundImage: `url("/background.jpeg")`,
  }}
>
  <div className="px-4 py-8 text-center bg-black/30">
  <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 bg-white/20">
  <img
    src="/SekwangLogo.png"
    alt="새광교회 로고"
    className="w-10 h-10 object-contain"
  />
</div>
    <h1
      className="text-2xl font-bold mb-2"
      style={{ fontFamily: '"Pacifico", serif' }}
    >
      청소년부 행정시스템
    </h1>
    <p className="text-blue-100 mb-4">
      {currentTime.toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        weekday: 'long',
      })}
    </p>
    <div className="bg-white/10 rounded-lg p-3 inline-block">
      <p className="text-sm">
        안녕하세요, <span className="font-semibold">{user.displayName}</span>님!
      </p>
      <p className="text-xs text-blue-200 mt-1">
        {user.role === 'ADMIN'
          ? '관리자'
          : user.role === 'LEADER'
          ? '리더'
          : '멤버'}
      </p>
    </div>
  </div>
</div>


      <div className="px-4 -mt-4">
        {/* 빠른 실행 */}
        <Card className="mb-6 p-4">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">빠른 실행</h2>
          <div className="grid grid-cols-2 gap-3">
            {quickActions.map((action) => (
              <button
                key={action.path}
                onClick={() => navigate(action.path)}
                className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition-all"
              >
                <div className={`w-12 h-12 ${action.color} rounded-full flex items-center justify-center mx-auto mb-3`}>
                  <i className={`${action.icon} text-xl text-white`}></i>
                </div>
                <h3 className="font-semibold text-gray-800 text-sm mb-1">{action.title}</h3>
                <p className="text-xs text-gray-600">{action.description}</p>
              </button>
            ))}
          </div>
        </Card>

        {/* 오늘의 현황 */}
        <Card className="mb-6 p-4">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">오늘의 현황</h2>
          {loading ? (
            <div className="text-center text-gray-500 py-4">불러오는 중...</div>
          ) : (
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-blue-600">{attendanceRate ?? 0}%</div>
                <div className="text-sm text-gray-600">출석률</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">{totalOffering?.toLocaleString() ?? 0}원</div>
                <div className="text-sm text-gray-600">헌금 총합</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-600">{qtCount ?? 0}</div>
                <div className="text-sm text-gray-600">큐티 작성 수</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-orange-600">-</div>
                <div className="text-sm text-gray-600">전체 멤버</div>
              </div>
            </div>
          )}
        </Card>

        {/* 메뉴 */}
        <Card className="mb-6 p-4">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">전체 메뉴</h2>
          <div className="grid grid-cols-2 gap-3">
            {menuItems.map((item) => (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all"
              >
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center mr-3">
                    <i className={`${item.icon} text-lg text-gray-600`}></i>
                  </div>
                  <div className="flex-1 text-left">
                    <h3 className="font-medium text-gray-800 text-sm">{item.title}</h3>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </Card>

        {/* 공지사항 미리보기 */}
        <Card className="mb-6 p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800">공지사항</h2>
            <Button variant="secondary" size="sm" onClick={() => navigate('/notice')}>
              전체보기
            </Button>
          </div>
          {notices.length > 0 ? (
            <div className="space-y-3">
              {notices.map((n) => (
                <div key={n.id} className="border-l-4 border-blue-500 pl-3">
                  <h3 className="font-medium text-gray-800 text-sm">{n.title}</h3>
                  <p className="text-xs text-gray-600 mt-1 line-clamp-2">{n.content}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">등록된 공지사항이 없습니다.</p>
          )}
        </Card>
      </div>
    </div>
  );
}
