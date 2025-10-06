
import { useState, useEffect } from 'react';
import Card from '../../components/base/Card';
import Button from '../../components/base/Button';
import { attendanceAPI } from '../../utils/api';

export default function Attendance() {
  const [attendanceCode, setAttendanceCode] = useState('');
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [attendanceHistory, setAttendanceHistory] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const todayCode = '2024';

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
      loadAttendanceHistory(parsedUser.username);
    }
  }, []);

  const loadAttendanceHistory = async (username: string) => {
    try {
      const history = await attendanceAPI.getUserAttendance(username);
      setAttendanceHistory(history || []);
      
      // 오늘 출석 여부 확인
      const today = new Date().toISOString().split('T')[0];
      const todayAttendance = history?.find((record: any) => record.attendDate === today);
      if (todayAttendance) {
        setIsCheckedIn(true);
      }
    } catch (error) {
      console.error('Failed to load attendance history:', error);
    }
  };

  const handleCodeSubmit = async () => {
    if (!user) {
      alert('로그인이 필요합니다.');
      return;
    }

    if (attendanceCode === todayCode) {
      setIsLoading(true);
      try {
        const today = new Date().toISOString().split('T')[0];
        await attendanceAPI.register(user.username, today, 'PRESENT');
        setIsCheckedIn(true);
        setAttendanceCode('');
        loadAttendanceHistory(user.username);
      } catch (error) {
        console.error('Failed to register attendance:', error);
        alert('출석 등록에 실패했습니다.');
      } finally {
        setIsLoading(false);
      }
    } else {
      alert('출석 코드가 올바르지 않습니다.');
    }
  };

  const handleQRScan = async () => {
    if (!user) {
      alert('로그인이 필요합니다.');
      return;
    }

    setIsLoading(true);
    // QR 스캔 시뮬레이션
    setTimeout(async () => {
      try {
        const today = new Date().toISOString().split('T')[0];
        await attendanceAPI.register(user.username, today, 'PRESENT');
        setIsCheckedIn(true);
        setShowQRScanner(false);
        loadAttendanceHistory(user.username);
      } catch (error) {
        console.error('Failed to register attendance:', error);
        alert('출석 등록에 실패했습니다.');
      } finally {
        setIsLoading(false);
      }
    }, 2000);
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'PRESENT': return '출석';
      case 'LATE': return '지각';
      case 'ABSENT': return '결석';
      default: return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PRESENT': return 'bg-green-100 text-green-700';
      case 'LATE': return 'bg-yellow-100 text-yellow-700';
      case 'ABSENT': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PRESENT': return 'ri-check-line text-green-600';
      case 'LATE': return 'ri-time-line text-yellow-600';
      case 'ABSENT': return 'ri-close-line text-red-600';
      default: return 'ri-question-line text-gray-600';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20 sm:pb-4">
      <div className="px-4 py-6">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <i className="ri-calendar-check-line text-2xl text-white"></i>
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">출석체크</h1>
          <p className="text-gray-600">
            {new Date().toLocaleDateString('ko-KR', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric',
              weekday: 'long'
            })}
          </p>
        </div>

        {/* Attendance Status */}
        {isCheckedIn ? (
          <Card className="mb-6 p-6 text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="ri-check-line text-3xl text-green-600"></i>
            </div>
            <h2 className="text-xl font-bold text-green-600 mb-2">출석 완료!</h2>
            <p className="text-gray-600 mb-4">오늘 출석이 정상적으로 처리되었습니다.</p>
            <div className="bg-green-50 rounded-lg p-3">
              <p className="text-sm text-green-700">
                출석 시간: {new Date().toLocaleTimeString('ko-KR')}
              </p>
            </div>
          </Card>
        ) : (
          <Card className="mb-6 p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 text-center">출석 방법을 선택하세요</h2>
            
            {/* QR Code Scanner */}
            <div className="mb-6">
              <Button
                onClick={() => setShowQRScanner(!showQRScanner)}
                className="w-full py-4 rounded-xl"
                variant={showQRScanner ? 'secondary' : 'primary'}
                disabled={isLoading}
              >
                <i className="ri-qr-scan-line mr-2 text-xl"></i>
                QR 코드 스캔
              </Button>
              
              {showQRScanner && (
                <div className="mt-4 p-6 bg-gray-100 rounded-xl text-center">
                  <div className="w-48 h-48 bg-white border-4 border-dashed border-gray-300 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <div className="text-center">
                      <i className="ri-qr-scan-2-line text-4xl text-gray-400 mb-2"></i>
                      <p className="text-sm text-gray-600">QR 코드를 스캔하세요</p>
                    </div>
                  </div>
                  <Button 
                    onClick={handleQRScan} 
                    variant="success" 
                    className="rounded-xl"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                        처리 중...
                      </>
                    ) : (
                      <>
                        <i className="ri-camera-line mr-2"></i>
                        스캔 시작
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>

            <div className="text-center text-gray-500 mb-6">또는</div>

            {/* Code Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                출석 코드 입력
              </label>
              <div className="flex gap-3">
                <input
                  type="text"
                  value={attendanceCode}
                  onChange={(e) => setAttendanceCode(e.target.value)}
                  placeholder="출석 코드를 입력하세요"
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center text-lg font-mono bg-gray-50 focus:bg-white"
                  maxLength={4}
                  disabled={isLoading}
                />
                <Button
                  onClick={handleCodeSubmit}
                  disabled={attendanceCode.length !== 4 || isLoading}
                  className="px-4 py-3 rounded-xl flex-shrink-0"
                >
                  {isLoading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <i className="ri-check-line text-lg"></i>
                  )}
                </Button>
              </div>
              <p className="text-xs text-gray-500 mt-2 text-center">
                관리자가 알려준 4자리 코드를 입력하세요
              </p>
            </div>
          </Card>
        )}

        {/* Weekly Stats */}
        <Card className="mb-6 p-4">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">이번 주 출석 현황</h3>
          <div className="grid grid-cols-7 gap-2">
            {['일', '월', '화', '수', '목', '금', '토'].map((day, index) => {
              const dayDate = new Date();
              dayDate.setDate(dayDate.getDate() - dayDate.getDay() + index);
              const dateStr = dayDate.toISOString().split('T')[0];
              const dayRecord = attendanceHistory.find(record => record.attendDate === dateStr);
              
              return (
                <div key={day} className="text-center">
                  <div className="text-xs text-gray-600 mb-2">{day}</div>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center mx-auto ${
                    dayRecord 
                      ? dayRecord.status === 'PRESENT' ? 'bg-green-500' : 
                        dayRecord.status === 'LATE' ? 'bg-yellow-500' : 'bg-red-500'
                      : 'bg-gray-200'
                  }`}>
                    {dayRecord && (
                      <i className={`text-white text-sm ${
                        dayRecord.status === 'PRESENT' ? 'ri-check-line' :
                        dayRecord.status === 'LATE' ? 'ri-time-line' : 'ri-close-line'
                      }`}></i>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-4 text-center">
            <span className="text-sm text-gray-600">이번 주 출석률: </span>
            <span className="font-semibold text-blue-600">
              {attendanceHistory.length > 0 
                ? Math.round((attendanceHistory.filter(r => r.status === 'PRESENT').length / attendanceHistory.length) * 100)
                : 0}%
            </span>
          </div>
        </Card>

        {/* Attendance History */}
        <Card className="p-4">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">출석 기록</h3>
          <div className="space-y-3">
            {attendanceHistory.length > 0 ? (
              attendanceHistory.slice(0, 10).map((record, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 ${
                      record.status === 'PRESENT' ? 'bg-green-100' :
                      record.status === 'LATE' ? 'bg-yellow-100' : 'bg-red-100'
                    }`}>
                      <i className={`text-sm ${getStatusIcon(record.status)}`}></i>
                    </div>
                    <div>
                      <p className="font-medium text-gray-800 text-sm">
                        {new Date(record.attendDate).toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' })}
                      </p>
                      <p className="text-xs text-gray-600">
                        {new Date(record.attendDate).toLocaleDateString('ko-KR', { weekday: 'long' })}
                      </p>
                    </div>
                  </div>
                  <div className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(record.status)}`}>
                    {getStatusText(record.status)}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <i className="ri-calendar-line text-4xl mb-2"></i>
                <p>출석 기록이 없습니다.</p>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
