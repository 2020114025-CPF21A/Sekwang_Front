
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../components/base/Button';
import Card from '../../components/base/Card';
import { authAPI, setToken } from '../../utils/api';

export default function Login() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    if (formData.username.trim() === '' || formData.password.trim() === '') {
      setError('아이디와 비밀번호를 모두 입력해주세요.');
      setIsLoading(false);
      return;
    }

    try {
      const response = await authAPI.login(formData.username, formData.password);
      
      // 토큰과 사용자 정보 저장
      setToken(response.token);
      localStorage.setItem('user', JSON.stringify({
        username: response.username,
        displayName: response.displayName,
        role: response.role,
        loginTime: new Date().toISOString()
      }));
      
      navigate('/');
    } catch (error) {
      console.error('Login failed:', error);
      setError('로그인에 실패했습니다. 아이디와 비밀번호를 확인해주세요.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo Section */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
          <img
            src="/SekwangLogo.png"
            alt="Sekwang Logo"
            className="w-12 h-12 object-contain"
          />
        </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2" style={{ fontFamily: '"Pacifico", serif' }}>
            청소년부 행정
          </h1>
          <p className="text-gray-600 text-sm">로그인하여 시스템을 이용하세요</p>
        </div>

        {/* Login Form */}
        <Card className="p-6 shadow-xl">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
                아이디
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <i className="ri-user-line text-gray-400"></i>
                </div>
                <input
                  type="text"
                  id="username"
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm bg-gray-50 focus:bg-white"
                  placeholder="아이디를 입력하세요"
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                비밀번호
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <i className="ri-lock-line text-gray-400"></i>
                </div>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm bg-gray-50 focus:bg-white"
                  placeholder="비밀번호를 입력하세요"
                  required
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3">
                <div className="flex items-center">
                  <i className="ri-error-warning-line text-red-500 mr-2"></i>
                  <span className="text-sm text-red-700">{error}</span>
                </div>
              </div>
            )}

            <Button
              type="submit"
              className="w-full py-3 rounded-xl"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  로그인 중...
                </div>
              ) : (
                <div className="flex items-center justify-center">
                  <i className="ri-login-circle-line mr-2"></i>
                  로그인
                </div>
              )}
            </Button>
          </form>

          {/* Additional Options */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-4">
                처음 사용하시나요?
              </p>
              <Button
                variant="secondary"
                onClick={() => navigate('/register')}
                className="w-full rounded-xl"
              >
                <i className="ri-user-add-line mr-2"></i>
                회원가입
              </Button>
            </div>
          </div>
        </Card>

        {/* Demo Info */}
        <div className="mt-6">
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <h3 className="text-sm font-medium text-blue-800 mb-2 text-center">데모 계정</h3>
            <div className="space-y-2 text-xs text-blue-600">
              <div className="bg-white rounded-lg p-2 text-center">
                <p><strong>admin</strong> / admin123</p>
              </div>
              <div className="bg-white rounded-lg p-2 text-center">
                <p><strong>alice</strong> / 1234</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
