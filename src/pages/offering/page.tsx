
import { useState, useEffect } from 'react';
import Card from '../../components/base/Card';
import Button from '../../components/base/Button';
import { offeringAPI } from '../../utils/api';

export default function Offering() {
  const [amount, setAmount] = useState('');
  const [purpose, setPurpose] = useState('십일조');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [offeringHistory, setOfferingHistory] = useState<any[]>([]);
  const [totalOffering, setTotalOffering] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
      loadOfferingData(parsedUser.username);
    }
  }, []);

  const loadOfferingData = async (username: string) => {
    try {
      const [history, summary] = await Promise.all([
        offeringAPI.getUserOfferings(username),
        offeringAPI.getUserSummary(username)
      ]);
      
      setOfferingHistory(history || []);
      setTotalOffering(summary?.total || 0);
    } catch (error) {
      console.error('Failed to load offering data:', error);
    }
  };

  const handleSubmit = async () => {
    if (!user) {
      alert('로그인이 필요합니다.');
      return;
    }

    if (amount && parseFloat(amount) > 0) {
      setIsLoading(true);
      try {
        await offeringAPI.register(user.username, parseFloat(amount), purpose);
        setIsSubmitted(true);
        setAmount('');
        loadOfferingData(user.username);
      } catch (error) {
        console.error('Failed to register offering:', error);
        alert('헌금 기록에 실패했습니다.');
      } finally {
        setIsLoading(false);
      }
    } else {
      alert('올바른 헌금 금액을 입력해주세요.');
    }
  };

  const thisMonth = new Date().getMonth() + 1;
  const thisYear = new Date().getFullYear();
  
  const thisMonthOfferings = offeringHistory.filter(record => {
    const recordDate = new Date(record.createdAt || record.date);
    return recordDate.getMonth() + 1 === thisMonth && recordDate.getFullYear() === thisYear;
  });
  
  const lastMonthOfferings = offeringHistory.filter(record => {
    const recordDate = new Date(record.createdAt || record.date);
    const lastMonth = thisMonth === 1 ? 12 : thisMonth - 1;
    const lastMonthYear = thisMonth === 1 ? thisYear - 1 : thisYear;
    return recordDate.getMonth() + 1 === lastMonth && recordDate.getFullYear() === lastMonthYear;
  });

  const thisMonthTotal = thisMonthOfferings.reduce((sum, record) => sum + record.amount, 0);
  const lastMonthTotal = lastMonthOfferings.reduce((sum, record) => sum + record.amount, 0);

  return (
    <div className="min-h-screen bg-gray-50 pb-20 sm:pb-4">
      <div className="px-4 py-6">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <i className="ri-hand-heart-line text-2xl text-white"></i>
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">헌금 기록</h1>
          <p className="text-gray-600">하나님께 드리는 마음을 기록해보세요</p>
        </div>

        {/* Offering Form */}
        <Card className="mb-6 p-4">
          {!isSubmitted ? (
            <div className="space-y-4">
              <div className="text-center mb-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">헌금 드리기</h3>
                <p className="text-sm text-gray-600">감사한 마음으로 하나님께 드리는 헌금을 기록하세요</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">헌금 종류</label>
                <select
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm pr-8 bg-white"
                  disabled={isLoading}
                >
                  <option value="십일조">십일조</option>
                  <option value="감사헌금">감사헌금</option>
                  <option value="선교헌금">선교헌금</option>
                  <option value="건축헌금">건축헌금</option>
                  <option value="특별헌금">특별헌금</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">헌금 금액</label>
                <div className="relative">
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="헌금 금액을 입력하세요"
                    className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm bg-white"
                    disabled={isLoading}
                  />
                  <span className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">원</span>
                </div>
              </div>
              
              <Button 
                onClick={handleSubmit} 
                variant="success" 
                className="w-full py-3 rounded-xl mt-6"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    기록 중...
                  </>
                ) : (
                  <>
                    <i className="ri-hand-heart-line mr-2"></i>
                    헌금 기록하기
                  </>
                )}
              </Button>
            </div>
          ) : (
            <div className="text-center py-6">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="ri-check-line text-3xl text-green-600"></i>
              </div>
              <h3 className="text-xl font-bold text-green-600 mb-2">헌금 기록 완료!</h3>
              <p className="text-gray-600 mb-4">헌금이 정상적으로 기록되었습니다.</p>
              <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-4">
                <p className="text-sm text-green-700">
                  기록 시간: {new Date().toLocaleString('ko-KR')}
                </p>
              </div>
              <Button onClick={() => setIsSubmitted(false)} variant="secondary" className="rounded-xl">
                새 헌금 기록하기
              </Button>
            </div>
          )}
        </Card>

        {/* Monthly Statistics */}
        <Card className="mb-6 p-4">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">헌금 통계</h3>
          <div className="space-y-3">
            <div className="bg-green-50 border border-green-200 rounded-xl p-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-green-700">이번 달 헌금</span>
                <span className="text-lg font-bold text-green-600">
                  {thisMonthTotal.toLocaleString()}원
                </span>
              </div>
            </div>
            
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-blue-700">지난 달 헌금</span>
                <span className="text-lg font-bold text-blue-600">
                  {lastMonthTotal.toLocaleString()}원
                </span>
              </div>
            </div>
            
            <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-purple-700">총 헌금</span>
                <span className="text-lg font-bold text-purple-600">
                  {totalOffering.toLocaleString()}원
                </span>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-gray-200">
            <p className="text-sm text-gray-600 mb-3 text-center">이번 달 헌금 목표</p>
            <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
              <div 
                className="bg-green-600 h-3 rounded-full transition-all duration-500"
                style={{ width: `${Math.min((thisMonthTotal / 50000) * 100, 100)}%` }}
              ></div>
            </div>
            <p className="text-xs text-gray-500 text-center">목표: 50,000원 ({Math.round((thisMonthTotal / 50000) * 100)}% 달성)</p>
          </div>
        </Card>

        {/* Offering History */}
        <Card className="p-4">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">헌금 기록 내역</h3>
          <div className="space-y-3">
            {offeringHistory.length > 0 ? (
              offeringHistory.slice(0, 10).map((record, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-green-500 rounded-full flex-shrink-0"></div>
                    <div>
                      <p className="font-medium text-gray-800 text-sm">{record.note}</p>
                      <p className="text-xs text-gray-600">
                        {new Date(record.createdAt || record.date).toLocaleDateString('ko-KR')}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-green-600">{record.amount.toLocaleString()}원</p>
                    <p className="text-xs text-green-500">완료</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <i className="ri-hand-heart-line text-4xl mb-2"></i>
                <p>헌금 기록이 없습니다.</p>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
