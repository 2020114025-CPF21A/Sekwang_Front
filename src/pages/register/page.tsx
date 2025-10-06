
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../components/base/Button';
import Card from '../../components/base/Card';
import { authAPI, setToken } from '../../utils/api';

export default function Register() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    displayName: '',
    role: 'MEMBER'
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
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

    // 유효성 검사
    if (!formData.username.trim() || !formData.password.trim() || !formData.displayName.trim()) {
      setError('모든 필드를 입력해주세요.');
      setIsLoading(false);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('비밀번호가 일치하지 않습니다.');
      setIsLoading(false);
      return;
    }

    if (formData.password.length < 4) {
      setError('비밀번호는 최소 4자 이상이어야 합니다.');
      setIsLoading(false);
      return;
    }

    try {
      const response = await authAPI.signup(
        formData.username,
        formData.password,
        formData.displayName,
        formData.role
      );
      
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
      console.error('Registration failed:', error);
      setError('회원가입에 실패했습니다. 이미 존재하는 아이디일 수 있습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-sm">
        {/* Logo Section */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
            <i className="ri-user-add-line text-3xl text-white"></i>
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2" style={{ fontFamily: '"Pacifico", serif' }}>
            회원가입
          </h1>
          <p className="text-gray-600 text-sm">청소년부 행정시스템에 가입하세요</p>
        </div>

        {/* Register Form */}
        <Card className="p-6 shadow-xl">
          <form onSubmit={handleSubmit} className="space-y-4">
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
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all text-sm bg-gray-50 focus:bg-white"
                  placeholder="아이디를 입력하세요"
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="displayName" className="block text-sm font-medium text-gray-700 mb-2">
                이름
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <i className="ri-account-circle-line text-gray-400"></i>
                </div>
                <input
                  type="text"
                  id="displayName"
                  name="displayName"
                  value={formData.displayName}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all text-sm bg-gray-50 focus:bg-white"
                  placeholder="이름을 입력하세요"
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
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all text-sm bg-gray-50 focus:bg-white"
                  placeholder="비밀번호를 입력하세요"
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                비밀번호 확인
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <i className="ri-lock-2-line text-gray-400"></i>
                </div>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all text-sm bg-gray-50 focus:bg-white"
                  placeholder="비밀번호를 다시 입력하세요"
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-2">
                역할
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <i className="ri-shield-user-line text-gray-400"></i>
                </div>
                <select
                  id="role"
                  name="role"
                  value={formData.role}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-8 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all text-sm bg-gray-50 focus:bg-white appearance-none"
                >
                  <option value="MEMBER">멤버</option>
                  <option value="LEADER">리더</option>
                  <option value="ADMIN">관리자</option>
                </select>
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <i className="ri-arrow-down-s-line text-gray-400"></i>
                </div>
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
              className="w-full py-3 rounded-xl bg-green-600 hover:bg-green-700"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  가입 중...
                </div>
              ) : (
                <div className="flex items-center justify-center">
                  <i className="ri-user-add-line mr-2"></i>
                  회원가입
                </div>
              )}
            </Button>
          </form>

          {/* Additional Options */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-4">
                이미 계정이 있으신가요?
              </p>
              <Button
                variant="secondary"
                onClick={() => navigate('/login')}
                className="w-full rounded-xl"
              >
                <i className="ri-login-circle-line mr-2"></i>
                로그인
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
