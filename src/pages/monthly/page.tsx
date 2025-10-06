
import { useState } from 'react';
import Card from '../../components/base/Card';
import Button from '../../components/base/Button';

export default function Monthly() {
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const months = [
    '1월', '2월', '3월', '4월', '5월', '6월',
    '7월', '8월', '9월', '10월', '11월', '12월'
  ];

  // 포도알 출석 데이터 (1-31일)
  const attendanceData = {
    1: true, 2: true, 3: false, 4: true, 5: true, 6: false, 7: true,
    8: true, 9: true, 10: false, 11: true, 12: true, 13: true, 14: true,
    15: true, 16: false, 17: true, 18: true, 19: true, 20: true, 21: true,
    22: false, 23: true, 24: true, 25: true, 26: true, 27: true, 28: false,
    29: true, 30: true, 31: false
  };

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getAttendanceRate = () => {
    const daysInMonth = getDaysInMonth(selectedYear, selectedMonth);
    const attendedDays = Object.entries(attendanceData)
      .filter(([day, attended]) => parseInt(day) <= daysInMonth && attended)
      .length;
    return Math.round((attendedDays / daysInMonth) * 100);
  };

  const getAttendedDays = () => {
    const daysInMonth = getDaysInMonth(selectedYear, selectedMonth);
    return Object.entries(attendanceData)
      .filter(([day, attended]) => parseInt(day) <= daysInMonth && attended)
      .length;
  };

  const achievements = [
    { title: '완벽한 한 주', description: '일주일 연속 출석', achieved: true, icon: 'ri-trophy-line', color: 'text-yellow-600' },
    { title: '성실한 학생', description: '한 달 80% 이상 출석', achieved: true, icon: 'ri-medal-line', color: 'text-blue-600' },
    { title: '출석왕', description: '한 달 완벽 출석', achieved: false, icon: 'ri-crown-line', color: 'text-purple-600' },
    { title: '꾸준함의 힘', description: '3개월 연속 출석', achieved: true, icon: 'ri-fire-line', color: 'text-red-600' }
  ];

  return (
    <div className="min-h-screen bg-gray-50 pb-20 sm:pb-4">
      <div className="px-4 py-6">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <i className="ri-calendar-2-line text-2xl text-white"></i>
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">월간 출석표</h1>
          <p className="text-gray-600">포도알을 채워가며 출석의 기쁨을 느껴보세요</p>
        </div>

        {/* Month/Year Selector */}
        <div className="flex justify-center space-x-3 mb-6">
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm pr-8 bg-white"
          >
            <option value={2024}>2024년</option>
            <option value={2023}>2023년</option>
          </select>
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
            className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm pr-8 bg-white"
          >
            {months.map((month, index) => (
              <option key={index} value={index}>{month}</option>
            ))}
          </select>
        </div>

        {/* Grape Attendance Chart */}
        <Card className="mb-6 p-4">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">{selectedYear}년 {months[selectedMonth]} 출석표</h3>
          <div className="text-center mb-6">
            <div className="inline-block p-6 bg-gradient-to-br from-purple-100 to-pink-100 rounded-2xl">
              <div className="text-6xl mb-2">🍇</div>
              <p className="text-lg font-bold text-purple-600">
                {getAttendedDays()}일 / {getDaysInMonth(selectedYear, selectedMonth)}일
              </p>
              <p className="text-sm text-gray-600">출석률 {getAttendanceRate()}%</p>
            </div>
          </div>

          {/* Grape Grid */}
          <div className="grid grid-cols-7 gap-2 mb-6">
            {Array.from({ length: getDaysInMonth(selectedYear, selectedMonth) }, (_, i) => {
              const day = i + 1;
              const isAttended = attendanceData[day];
              return (
                <div key={day} className="text-center">
                  <div className="text-xs text-gray-600 mb-1">{day}일</div>
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xl transition-all duration-300 ${
                    isAttended 
                      ? 'bg-purple-100 scale-110 shadow-lg' 
                      : 'bg-gray-100 opacity-50'
                  }`}>
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
              ></div>
            </div>
          </div>

          {getAttendanceRate() === 100 && (
            <div className="text-center p-4 bg-gradient-to-r from-yellow-100 to-orange-100 rounded-xl">
              <div className="text-4xl mb-2">🎉</div>
              <p className="text-lg font-bold text-orange-600">완벽한 출석! 축하합니다!</p>
              <p className="text-sm text-gray-600">한 달 동안 한 번도 빠지지 않고 출석하셨네요!</p>
            </div>
          )}
        </Card>

        {/* Monthly Stats */}
        <Card className="mb-6 p-4">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">이번 달 통계</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">출석일</span>
              <span className="text-2xl font-bold text-purple-600">{getAttendedDays()}일</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">결석일</span>
              <span className="text-2xl font-bold text-red-600">
                {getDaysInMonth(selectedYear, selectedMonth) - getAttendedDays()}일
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
            {achievements.map((achievement, index) => (
              <div key={index} className={`flex items-center space-x-3 p-3 rounded-xl ${
                achievement.achieved ? 'bg-green-50 border border-green-200' : 'bg-gray-50 border border-gray-200'
              }`}>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                  achievement.achieved ? 'bg-green-100' : 'bg-gray-100'
                }`}>
                  <i className={`${achievement.icon} text-lg ${
                    achievement.achieved ? achievement.color : 'text-gray-400'
                  }`}></i>
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`font-medium text-sm ${
                    achievement.achieved ? 'text-gray-800' : 'text-gray-500'
                  }`}>
                    {achievement.title}
                  </p>
                  <p className="text-xs text-gray-600">{achievement.description}</p>
                </div>
                {achievement.achieved && (
                  <i className="ri-check-line text-green-500 flex-shrink-0"></i>
                )}
              </div>
            ))}
          </div>
        </Card>

        {/* Motivation */}
        <Card className="mb-6 p-4">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">격려의 말씀</h3>
          <div className="text-center p-4">
            <div className="text-4xl mb-3">📖</div>
            <p className="text-sm text-gray-700 mb-2 italic">
              "모이기를 폐하는 어떤 사람들의 습관과 같이 하지 말고 오직 권하여 그 날이 가까움을 볼수록 더욱 그리하자"
            </p>
            <p className="text-xs text-gray-500">히브리서 10:25</p>
          </div>
        </Card>

        {/* Yearly Overview */}
        <Card className="p-4">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">연간 출석 현황</h3>
          <div className="grid grid-cols-4 gap-3">
            {months.map((month, index) => (
              <div key={index} className="text-center">
                <div className="text-xs font-medium text-gray-700 mb-2">{month}</div>
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl mx-auto ${
                  index <= selectedMonth ? 'bg-purple-100' : 'bg-gray-100'
                }`}>
                  {index < selectedMonth ? '🍇' : index === selectedMonth ? '🍇' : '⚪'}
                </div>
                <div className="text-xs text-gray-600 mt-1">
                  {index <= selectedMonth ? '85%' : '-'}
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}