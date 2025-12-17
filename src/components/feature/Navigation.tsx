
import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { removeToken } from '../../utils/api';

export default function Navigation() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [user, setUser] = useState<{ displayName: string; username: string; role: string } | null>(null);

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
  }, []);

  // 다른 탭/로그인 동작 또는 auth 변경 시 네비게이션 상태 갱신
  useEffect(() => {
    const handler = (e: Event) => {
      try {
        const detail = (e as CustomEvent)?.detail;
        if (detail?.user) {
          setUser(detail.user);
          return;
        }
      } catch (err) {
        // noop
      }
      const userData = localStorage.getItem('user');
      if (userData) {
        try { setUser(JSON.parse(userData)); } catch { setUser(null); }
      } else {
        setUser(null);
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('authChanged', handler as EventListener);
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('authChanged', handler as EventListener);
      }
    };
  }, []);

  const handleLogout = () => {
    removeToken();
    localStorage.removeItem('user');
    setUser(null);
    setIsMenuOpen(false);
    navigate('/login');
  };

  const menuItems = [
    { path: '/', label: '홈', icon: 'ri-home-line' },
    { path: '/attendance', label: '출석체크', icon: 'ri-calendar-check-line' },
    { path: '/offering', label: '헌금', icon: 'ri-hand-heart-line' },
    { path: '/qt', label: '큐티', icon: 'ri-book-open-line' },
    { path: '/notice', label: '공지사항', icon: 'ri-notification-line' },
    { path: '/diary', label: '일지', icon: 'ri-file-text-line' },
    { path: '/gallery', label: '사진첩', icon: 'ri-image-line' },
    { path: '/game', label: '미니게임', icon: 'ri-gamepad-line' },
    { path: '/bulletin', label: '주보', icon: 'ri-newspaper-line' },
    { path: '/music', label: '찬양악보', icon: 'ri-music-line' },
    { path: '/monthly', label: '월간출석', icon: 'ri-calendar-2-line' }
  ];

  return (
    <>
      {/* Mobile Top Navigation */}
      <nav className="bg-white shadow-lg border-b border-gray-200 sticky top-0 z-50">
        <div className="px-4">
          <div className="flex justify-between items-center h-14">
            <div className="flex items-center">
              <h1 className="text-lg font-bold text-blue-600 cursor-pointer" style={{ fontFamily: '"Pacifico", serif' }} onClick={() => navigate('/')}>
                청소년부
              </h1>
            </div>
            
            <div className="flex items-center space-x-3">
              {user ? (
                <>
                  <span className="text-sm text-gray-600 hidden sm:block">{user.displayName}</span>
                  <button
                    onClick={handleLogout}
                    className="hidden sm:flex items-center px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                  >
                    <i className="ri-logout-circle-line mr-1"></i>
                    로그아웃
                  </button>
                </>
              ) : (
                <button
                  onClick={() => navigate('/login')}
                  className="hidden sm:flex items-center px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                >
                  <i className="ri-login-circle-line mr-1"></i>
                  로그인
                </button>
              )}
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="w-8 h-8 flex items-center justify-center text-gray-600 hover:text-blue-600 cursor-pointer"
              >
                <i className={`text-xl ${isMenuOpen ? 'ri-close-line' : 'ri-menu-line'}`}></i>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Slide Menu */}
        <div className={`fixed inset-0 z-50 transform transition-transform duration-300 ${isMenuOpen ? 'translate-x-0' : 'translate-x-full'}`}>
          <div className="absolute inset-0 bg-black bg-opacity-50" onClick={() => setIsMenuOpen(false)}></div>
          <div className="absolute right-0 top-0 h-full w-80 max-w-sm bg-white shadow-xl">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-800">메뉴</h2>
              <button
                onClick={() => setIsMenuOpen(false)}
                className="w-8 h-8 flex items-center justify-center text-gray-600 hover:text-blue-600 cursor-pointer"
              >
                <i className="ri-close-line text-xl"></i>
              </button>
            </div>
            
            <div className="p-4">
              {user ? (
                <div className="bg-blue-50 rounded-lg p-3 mb-4">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center mr-3">
                      <i className="ri-user-line text-white"></i>
                    </div>
                    <div>
                      <p className="font-medium text-gray-800">{user.displayName}</p>
                      <p className="text-sm text-gray-600">@{user.username}</p>
                      <p className="text-xs text-blue-600">{user.role === 'ADMIN' ? '관리자' : user.role === 'LEADER' ? '리더' : '멤버'}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-gray-50 rounded-lg p-3 mb-4 text-center">
                  <p className="text-sm text-gray-600 mb-2">로그인이 필요합니다</p>
                  <button
                    onClick={() => {
                      navigate('/login');
                      setIsMenuOpen(false);
                    }}
                    className="text-blue-600 text-sm font-medium cursor-pointer"
                  >
                    로그인하기
                  </button>
                </div>
              )}
              
              <div className="space-y-1">
                {menuItems.map((item) => (
                  <button
                    key={item.path}
                    onClick={() => {
                      navigate(item.path);
                      setIsMenuOpen(false);
                    }}
                    className={`w-full flex items-center px-4 py-3 rounded-lg text-left transition-colors cursor-pointer ${
                      location.pathname === item.path
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <i className={`${item.icon} text-xl mr-3`}></i>
                    <span className="font-medium">{item.label}</span>
                  </button>
                ))}
              </div>
              
              <div className="border-t border-gray-200 pt-4 mt-6">
                {user ? (
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center px-4 py-3 rounded-lg text-left text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                  >
                    <i className="ri-logout-circle-line text-xl mr-3"></i>
                    <span className="font-medium">로그아웃</span>
                  </button>
                ) : (
                  <div className="space-y-2">
                    <button
                      onClick={() => {
                        navigate('/login');
                        setIsMenuOpen(false);
                      }}
                      className="w-full flex items-center px-4 py-3 rounded-lg text-left text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                    >
                      <i className="ri-login-circle-line text-xl mr-3"></i>
                      <span className="font-medium">로그인</span>
                    </button>
                    <button
                      onClick={() => {
                        navigate('/register');
                        setIsMenuOpen(false);
                      }}
                      className="w-full flex items-center px-4 py-3 rounded-lg text-left text-green-600 hover:bg-green-50 transition-colors cursor-pointer"
                    >
                      <i className="ri-user-add-line text-xl mr-3"></i>
                      <span className="font-medium">회원가입</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Bottom Navigation for Mobile */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40 sm:hidden">
        <div className="grid grid-cols-5 h-16">
          {menuItems.slice(0, 4).map((item) => (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`flex flex-col items-center justify-center cursor-pointer transition-colors ${
                location.pathname === item.path
                  ? 'text-blue-600 bg-blue-50'
                  : 'text-gray-600 hover:text-blue-600'
              }`}
            >
              <i className={`${item.icon} text-lg mb-1`}></i>
              <span className="text-xs font-medium">{item.label}</span>
            </button>
          ))}
          {/* Login/Logout Button in Bottom Nav */}
          {user ? (
            <button
              onClick={handleLogout}
              className="flex flex-col items-center justify-center cursor-pointer transition-colors text-red-600 hover:bg-red-50"
            >
              <i className="ri-logout-circle-line text-lg mb-1"></i>
              <span className="text-xs font-medium">로그아웃</span>
            </button>
          ) : (
            <button
              onClick={() => navigate('/login')}
              className="flex flex-col items-center justify-center cursor-pointer transition-colors text-blue-600 hover:bg-blue-50"
            >
              <i className="ri-login-circle-line text-lg mb-1"></i>
              <span className="text-xs font-medium">로그인</span>
            </button>
          )}
        </div>
      </div>
    </>
  );
}
