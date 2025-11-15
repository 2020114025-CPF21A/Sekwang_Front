import { useState, useEffect, useMemo } from 'react';
import Card from '../../components/base/Card';
import Button from '../../components/base/Button';
import { offeringAPI } from '../../utils/api';

type OfferingRecord = {
  id?: number;
  note?: string;                       // 헌금 종류/메모
  amount: number | string;             // BigDecimal이 문자열로 올 수도 있음
  offeredAt?: string;                  // 백엔드 필드명
  createdAt?: string;                  // 혹시 다른 이름으로 올 수도 있어 대비
  date?: string;                       // 구형 대비
};

export default function Offering() {
  const [amount, setAmount] = useState('');
  const [purpose, setPurpose] = useState('십일조');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [user, setUser] = useState<{ username: string } | null>(null);

  const [offeringHistory, setOfferingHistory] = useState<OfferingRecord[]>([]);
  const [totalOffering, setTotalOffering] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  // 로그인 사용자
  useEffect(() => {
    try {
      const raw = localStorage.getItem('user');
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (parsed?.username) {
        setUser(parsed);
        loadOfferingData(parsed.username);
      }
    } catch {
      localStorage.removeItem('user');
    }
  }, []);

  // 안전 날짜 파서 (스페이스 -> 'T' 치환, 실패 시 원문 유지)
  const parseDate = (s?: string) => {
    if (!s) return null;
    const iso = s.includes('T') ? s : s.replace(' ', 'T');
    const d = new Date(iso);
    return isNaN(d.getTime()) ? null : d;
  };

  // 금액 숫자화
  const toNumber = (v: number | string | undefined | null) => {
    if (v === null || v === undefined) return 0;
    if (typeof v === 'number') return v;
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  };

  const loadOfferingData = async (username: string) => {
    try {
      const [history, summary] = await Promise.all([
        offeringAPI.getUserOfferings(username),
        offeringAPI.getUserSummary(username),
      ]);

      const list: OfferingRecord[] = (Array.isArray(history) ? history : []).map((r: any) => ({
        id: Number(r.id ?? 0),
        note: r.note ?? r.purpose ?? '',
        amount: r.amount,                         // 숫자/문자열 모두 허용
        offeredAt: r.offeredAt ?? r.createdAt ?? r.date,
      }));

      // 최신순 정렬 (offeredAt 우선)
      list.sort((a, b) => {
        const ad = parseDate(a.offeredAt || a.createdAt || a.date)?.getTime() ?? 0;
        const bd = parseDate(b.offeredAt || b.createdAt || b.date)?.getTime() ?? 0;
        return bd - ad;
      });

      setOfferingHistory(list);
      setTotalOffering(toNumber(summary?.total));
    } catch (error) {
      console.error('Failed to load offering data:', error);
    }
  };

  const handleSubmit = async () => {
    if (!user?.username) {
      alert('로그인이 필요합니다.');
      return;
    }
    if (!amount || Number(amount) <= 0) {
      alert('올바른 헌금 금액을 입력해주세요.');
      return;
    }

    setIsLoading(true);
    try {
      await offeringAPI.register(user.username, Number(amount), purpose);
      setIsSubmitted(true);
      setAmount('');
      await loadOfferingData(user.username);
    } catch (error) {
      console.error('Failed to register offering:', error);
      alert('헌금 기록에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // 월별 집계
  const now = useMemo(() => new Date(), []);
  const thisMonth = now.getMonth() + 1;
  const thisYear = now.getFullYear();
  const lastMonth = thisMonth === 1 ? 12 : thisMonth - 1;
  const lastMonthYear = thisMonth === 1 ? thisYear - 1 : thisYear;

  const monthFilter = (rec: OfferingRecord, y: number, m: number) => {
    const d =
      parseDate(rec.offeredAt) ||
      parseDate(rec.createdAt) ||
      parseDate(rec.date);
    return d ? d.getFullYear() === y && d.getMonth() + 1 === m : false;
  };

  const thisMonthTotal = offeringHistory
    .filter((r) => monthFilter(r, thisYear, thisMonth))
    .reduce((sum, r) => sum + toNumber(r.amount), 0);

  const lastMonthTotal = offeringHistory
    .filter((r) => monthFilter(r, lastMonthYear, lastMonth))
    .reduce((sum, r) => sum + toNumber(r.amount), 0);

  const fmtKRW = (n: number) => `${n.toLocaleString()}원`;

  return (
    <div className="min-h-screen bg-gray-50 pb-20 sm:pb-4">
      <div className="max-w-5xl mx-auto px-4 py-6">
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
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm">원</span>
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
                <p className="text-sm text-green-700">기록 시간: {new Date().toLocaleString('ko-KR')}</p>
              </div>
              <Button onClick={() => setIsSubmitted(false)} variant="secondary" className="rounded-xl">
                새 헌금 기록하기
              </Button>
            </div>
          )}
        </Card>

        {/* Monthly Statistics (목표 바 제거됨) */}
        <Card className="mb-6 p-4">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">헌금 통계</h3>
          <div className="space-y-3">
            <div className="bg-green-50 border border-green-200 rounded-xl p-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-green-700">이번 달 헌금</span>
                <span className="text-lg font-bold text-green-600">{fmtKRW(thisMonthTotal)}</span>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-blue-700">지난 달 헌금</span>
                <span className="text-lg font-bold text-blue-600">{fmtKRW(lastMonthTotal)}</span>
              </div>
            </div>

            <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-purple-700">총 헌금</span>
                <span className="text-lg font-bold text-purple-600">{fmtKRW(totalOffering)}</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Offering History */}
        <Card className="p-4">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">헌금 기록 내역</h3>
          <div className="space-y-3">
            {offeringHistory.length > 0 ? (
              offeringHistory.slice(0, 10).map((record, idx) => {
                const d =
                  parseDate(record.offeredAt) ||
                  parseDate(record.createdAt) ||
                  parseDate(record.date);
                return (
                  <div
                    key={record.id ?? idx}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-xl"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-3 h-3 bg-green-500 rounded-full flex-shrink-0"></div>
                      <div>
                        <p className="font-medium text-gray-800 text-sm">{record.note || '헌금'}</p>
                        <p className="text-xs text-gray-600">
                          {d ? d.toLocaleDateString('ko-KR') : (record.offeredAt || record.createdAt || record.date || '')}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-green-600">
                        {fmtKRW(toNumber(record.amount))}
                      </p>
                      <p className="text-xs text-green-500">완료</p>
                    </div>
                  </div>
                );
              })
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
