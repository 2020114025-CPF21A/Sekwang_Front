
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../../components/base/Card';
import Button from '../../components/base/Button';

export default function Home() {
  const navigate = useNavigate();
  const [user, setUser] = useState<{ displayName: string; username: string; role: string } | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        setUser(JSON.parse(userData));
      } catch (error) {
        console.error('Failed to parse user data:', error);
        localStorage.removeItem('user');
      }
    }

    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const quickActions = [
    { 
      title: '출석체크', 
      icon: 'ri-calendar-check-line', 
      path: '/attendance',
      color: 'bg-blue-500',
      description: '오늘 출석하기'
    },
    { 
      title: '헌금기록', 
      icon: 'ri-hand-heart-line', 
      path: '/offering',
      color: 'bg-green-500',
      description: '헌금 내역 확인'
    },
    { 
      title: '큐티작성', 
      icon: 'ri-book-open-line', 
      path: '/qt',
      color: 'bg-purple-500',
      description: '오늘의 큐티'
    },
    { 
      title: '미니게임', 
      icon: 'ri-gamepad-line', 
      path: '/game',
      color: 'bg-orange-500',
      description: '성경 퀴즈'
    }
  ];

  const menuItems = [
    { title: '공지사항', icon: 'ri-notification-line', path: '/notice', count: 3 },
    { title: '사진첩', icon: 'ri-image-line', path: '/gallery', count: 12 },
    { title: '일지', icon: 'ri-file-text-line', path: '/diary', count: 5 },
    { title: '주보', icon: 'ri-newspaper-line', path: '/bulletin', count: 2 },
    { title: '찬양악보', icon: 'ri-music-line', path: '/music', count: 8 },
    { title: '월간출석', icon: 'ri-calendar-2-line', path: '/monthly', count: null }
  ];

  const todayStats = {
    attendance: 85,
    offering: 12,
    qt: 23,
    totalMembers: 45
  };

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
            출석체크, 헌금기록, 큐티작성 등<br />
            다양한 기능을 이용하려면 로그인해주세요
          </p>
          
          <div className="space-y-3">
            <Button
              onClick={() => navigate('/login')}
              className="w-full py-4 text-lg rounded-xl"
            >
              <i className="ri-login-circle-line mr-2"></i>
              로그인하기
            </Button>
            
            <Button
              variant="secondary"
              onClick={() => navigate('/register')}
              className="w-full py-4 text-lg rounded-xl"
            >
              <i className="ri-user-add-line mr-2"></i>
              회원가입
            </Button>
          </div>
          
          <div className="mt-8 p-4 bg-white rounded-xl shadow-sm">
            <h3 className="font-semibold text-gray-800 mb-2">주요 기능</h3>
            <div className="grid grid-cols-2 gap-3 text-sm text-gray-600">
              <div className="flex items-center">
                <i className="ri-calendar-check-line text-blue-500 mr-2"></i>
                출석체크
              </div>
              <div className="flex items-center">
                <i className="ri-hand-heart-line text-green-500 mr-2"></i>
                헌금기록
              </div>
              <div className="flex items-center">
                <i className="ri-book-open-line text-purple-500 mr-2"></i>
                큐티작성
              </div>
              <div className="flex items-center">
                <i className="ri-gamepad-line text-orange-500 mr-2"></i>
                미니게임
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20 sm:pb-4">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-blue-600 to-purple-600 text-white">
        <div className="px-4 py-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="ri-church-line text-2xl"></i>
            </div>
            <h1 className="text-2xl font-bold mb-2" style={{ fontFamily: '"Pacifico", serif' }}>
              청소년부 행정시스템
            </h1>
            <p className="text-blue-100 mb-4">
              {currentTime.toLocaleDateString('ko-KR', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric',
                weekday: 'long'
              })}
            </p>
            <div className="bg-white/10 rounded-lg p-3 inline-block">
              <p className="text-sm">안녕하세요, <span className="font-semibold">{user.displayName}</span>님!</p>
              <p className="text-xs text-blue-200 mt-1">
                {user.role === 'ADMIN' ? '관리자' : user.role === 'LEADER' ? '리더' : '멤버'}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 -mt-4">
        {/* Quick Actions */}
        <Card className="mb-6 p-4">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">빠른 실행</h2>
          <div className="grid grid-cols-2 gap-3">
            {quickActions.map((action) => (
              <button
                key={action.path}
                onClick={() => navigate(action.path)}
                className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition-all cursor-pointer"
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

        {/* Today's Stats */}
        <Card className="mb-6 p-4">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">오늘의 현황</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{todayStats.attendance}%</div>
              <div className="text-sm text-gray-600">출석률</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{todayStats.offering}</div>
              <div className="text-sm text-gray-600">헌금 참여</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{todayStats.qt}</div>
              <div className="text-sm text-gray-600">큐티 작성</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{todayStats.totalMembers}</div>
              <div className="text-sm text-gray-600">전체 멤버</div>
            </div>
          </div>
        </Card>

        {/* Menu Grid */}
        <Card className="mb-6 p-4">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">전체 메뉴</h2>
          <div className="grid grid-cols-2 gap-3">
            {menuItems.map((item) => (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all cursor-pointer relative"
              >
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center mr-3">
                    <i className={`${item.icon} text-lg text-gray-600`}></i>
                  </div>
                  <div className="flex-1 text-left">
                    <h3 className="font-medium text-gray-800 text-sm">{item.title}</h3>
                    {item.count && (
                      <p className="text-xs text-gray-500">{item.count}개 항목</p>
                    )}
                  </div>
                </div>
                {item.count && (
                  <div className="absolute top-2 right-2 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                    <span className="text-xs text-white font-medium">{item.count}</span>
                  </div>
                )}
              </button>
            ))}
          </div>
        </Card>

        {/* Recent Activity */}
        <Card className="mb-6 p-4">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">최근 활동</h2>
          <div className="space-y-3">
            <div className="flex items-center p-3 bg-blue-50 rounded-lg">
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center mr-3">
                <i className="ri-calendar-check-line text-white text-sm"></i>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-800">출석체크 완료</p>
                <p className="text-xs text-gray-600">2시간 전</p>
              </div>
            </div>
            <div className="flex items-center p-3 bg-green-50 rounded-lg">
              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center mr-3">
                <i className="ri-book-open-line text-white text-sm"></i>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-800">큐티 작성</p>
                <p className="text-xs text-gray-600">어제</p>
              </div>
            </div>
            <div className="flex items-center p-3 bg-purple-50 rounded-lg">
              <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center mr-3">
                <i className="ri-gamepad-line text-white text-sm"></i>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-800">미니게임 참여</p>
                <p className="text-xs text-gray-600">3일 전</p>
              </div>
            </div>
          </div>
        </Card>

        {/* Announcements */}
        <Card className="mb-6 p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800">공지사항</h2>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => navigate('/notice')}
            >
              전체보기
            </Button>
          </div>
          <div className="space-y-3">
            <div className="border-l-4 border-red-500 pl-3">
              <h3 className="font-medium text-gray-800 text-sm">🔥 이번 주 특별 예배 안내</h3>
              <p className="text-xs text-gray-600 mt-1">일요일 오후 2시, 특별 찬양 예배가 있습니다.</p>
            </div>
            <div className="border-l-4 border-blue-500 pl-3">
              <h3 className="font-medium text-gray-800 text-sm">📚 새로운 큐티 교재 배포</h3>
              <p className="text-xs text-gray-600 mt-1">3월호 큐티 교재를 받아가세요.</p>
            </div>
            <div className="border-l-4 border-green-500 pl-3">
              <h3 className="font-medium text-gray-800 text-sm">🎵 찬양팀 모집</h3>
              <p className="text-xs text-gray-600 mt-1">새로운 찬양팀 멤버를 모집합니다.</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
