import { useState, useEffect, useMemo, useRef } from 'react';
import Card from '../../components/base/Card';
import Button from '../../components/base/Button';
import { attendanceAPI } from '../../utils/api';
import { QRCodeSVG } from 'qrcode.react';

type AttendanceRecord = {
  attendDate: string;        // 'YYYY-MM-DD'
  status: 'PRESENT' | 'LATE' | 'ABSENT' | string;
};

// 로그인 응답이 다양한 케이스를 가정
type LocalUser = {
  username: string;
  role?: string;                  // "ADMIN" | "LEADER" | ...
  roles?: string[];               // ["ROLE_ADMIN", ...] 또는 ["ADMIN", ...]
  authorities?: Array<string | { authority: string }>; // ["ROLE_ADMIN"] | [{authority:"ROLE_ADMIN"}]
  [k: string]: any;
};

export default function Attendance() {
  const [attendanceCode, setAttendanceCode] = useState('');
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [scannerActive, setScannerActive] = useState(false);

  const [user, setUser] = useState<LocalUser | null>(null);
  const [attendanceHistory, setAttendanceHistory] = useState<AttendanceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // --- 관리자용: QR 세션 정보 (만료 여부 무시, 그대로 표시만) ---
  const [qrInfo, setQrInfo] = useState<{ code: string } | null>(null);

  // --- QR 카메라/디코딩 관련 ---
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const detectorRef = useRef<any>(null);
  const [detectorSupported, setDetectorSupported] = useState<boolean | null>(null);
  const [scannerMsg, setScannerMsg] = useState<string>('');

  // --- 유틸: 로컬(한국시간) 기준 YYYY-MM-DD ---
  const formatLocalYmd = (d: Date) => {
    const yyyy = d.getFullYear();
    const mm = `${d.getMonth() + 1}`.padStart(2, '0');
    const dd = `${d.getDate()}`.padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const today = useMemo(() => new Date(), []);
  const todayYmd = useMemo(() => formatLocalYmd(today), [today]);

  // --- 로그인 사용자 로드 & 기록 로드 ---
  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        const parsed: LocalUser = JSON.parse(userData);
        setUser(parsed);
        loadAttendanceHistory(parsed.username);
      } catch {
        localStorage.removeItem('user');
      }
    }
  }, []);

  const loadAttendanceHistory = async (username: string) => {
    try {
      const history = await attendanceAPI.getUserAttendance(username);
      const arr: AttendanceRecord[] = Array.isArray(history) ? history : [];
      setAttendanceHistory(arr);
      // 오늘 출석 여부 갱신
      const already = arr.some((r) => r.attendDate === todayYmd && r.status !== 'ABSENT');
      setIsCheckedIn(already);
    } catch (error) {
      console.error('Failed to load attendance history:', error);
    }
  };

  // --- 관리자 판별: 다양한 형태(role/roles/authorities) 모두 대응 ---
  const isAdmin = useMemo(() => {
    if (!user) return false;

    const add = (s: Set<string>, val?: string | null) => {
      if (!val) return;
      const up = String(val).toUpperCase();
      s.add(up);
      if (up.startsWith('ROLE_')) s.add(up.replace(/^ROLE_/, ''));
      else s.add(`ROLE_${up}`);
    };

    const bag = new Set<string>();
    add(bag, user.role);
    if (Array.isArray(user.roles)) user.roles.forEach((r) => add(bag, String(r)));
    if (Array.isArray(user.authorities)) {
      user.authorities.forEach((a) => {
        if (typeof a === 'string') add(bag, a);
        else if (a && typeof a === 'object' && 'authority' in a) add(bag, String((a as any).authority));
      });
    }
    return bag.has('ADMIN') || bag.has('ROLE_ADMIN');
  }, [user]);

  // --- QR 생성 응답 정규화: code만 사용 ---
  const normalizeQrResponse = (res: any) => {
    return { code: String(res?.code ?? '') } as { code: string };
  };

  // --- 관리자: QR 생성 ---
  const handleGenerateQr = async () => {
    if (!user) { alert('로그인이 필요합니다.'); return; }
    setIsLoading(true);
    try {
      const res = await attendanceAPI.generateQr(); // { code, ... }
      const normalized = normalizeQrResponse(res);
      setQrInfo(normalized); // 화면에 계속 유지
    } catch (e: any) {
      console.error(e);
      alert(e?.message ?? 'QR 생성에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // --- 코드 제출 → check-in 호출 ---
  const handleCodeSubmit = async () => {
    if (!user) { alert('로그인이 필요합니다.'); return; }
    if (!attendanceCode.trim()) {
      alert('출석 코드를 입력하세요.');
      return;
    }
    if (isCheckedIn) {
      alert('오늘은 이미 출석했습니다.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await attendanceAPI.checkIn(attendanceCode.trim());
      if (!res.ok) throw new Error(res.message || '출석 실패');
      setIsCheckedIn(true);
      setAttendanceCode('');
      await loadAttendanceHistory(user.username);
      alert('출석이 확인되었습니다.');
    } catch (error: any) {
      console.error('Failed to check-in:', error);
      alert(error?.message ?? '출석 등록에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // --- 스캐너 시작/종료 ---
  const startScanner = async () => {
    if (!user) { alert('로그인이 필요합니다.'); return; }
    if (isCheckedIn) { alert('오늘은 이미 출석했습니다.'); return; }

    try {
      // 지원 여부 확인
      const supported = 'BarcodeDetector' in window;
      setDetectorSupported(supported);

      if (supported) {
        // @ts-ignore
        const formats = await (window as any).BarcodeDetector.getSupportedFormats?.().catch(() => []);
        // @ts-ignore
        detectorRef.current = new (window as any).BarcodeDetector({
          formats: (formats && formats.length ? formats : ['qr_code'])
        });
      } else {
        setScannerMsg('이 브라우저는 BarcodeDetector를 지원하지 않습니다. 코드 입력을 사용하세요.');
      }

      // 카메라 열기
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } },
        audio: false
      });
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setScannerActive(true);
      setScannerMsg('');

      // 디코딩 루프 시작
      decodeLoop();
    } catch (err: any) {
      console.error(err);
      alert(err?.message ?? '카메라를 열 수 없습니다. 브라우저 권한을 확인하세요.');
      stopScanner();
    }
  };

  const stopScanner = () => {
    setScannerActive(false);

    if (rafRef.current != null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.srcObject = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
  };

  useEffect(() => {
    // 스캐너 영역 닫히면 정리
    if (!showQRScanner) {
      stopScanner();
    }
    // 언마운트 시 정리
    return () => stopScanner();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showQRScanner]);

  // --- 디코딩 루프 ---
  const decodeLoop = async () => {
    if (!scannerActive) return;

    try {
      if (detectorRef.current && videoRef.current) {
        const detections = await detectorRef.current.detect(videoRef.current);
        if (Array.isArray(detections) && detections.length > 0) {
          const candidate = detections.find((d: any) => d?.rawValue);
          const text = candidate?.rawValue || detections[0]?.rawValue;
          if (text) {
            await handleScanResult(text);
            return; // 일단 성공 시 루프 종료(필요 시 유지 스캔하도록 변경 가능)
          }
        }
      }
    } catch (e) {
      // 탐지 실패는 조용히 무시하고 다음 프레임
    }

    rafRef.current = requestAnimationFrame(decodeLoop);
  };

  const handleScanResult = async (text: string) => {
    // 스캔 성공 시 즉시 종료해서 중복 체크인 방지
    stopScanner();
    if (!user) { alert('로그인이 필요합니다.'); return; }
    if (isCheckedIn) { alert('오늘은 이미 출석했습니다.'); return; }

    try {
      setIsLoading(true);
      const res = await attendanceAPI.checkIn(text.trim());
      if (!res.ok) throw new Error(res.message || '출석 실패');
      setIsCheckedIn(true);
      await loadAttendanceHistory(user.username);
      alert('QR 스캔 성공! 출석이 확인되었습니다.');
      setShowQRScanner(false);
    } catch (error: any) {
      console.error('Failed to check-in via QR:', error);
      alert(error?.message ?? '출석 등록에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
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

  // =========================
  // 지난 4개 일요일 + 다음 일요일
  // =========================
  const last4SundaysPlusNext = useMemo(() => {
    const t = new Date(today);
    // "직전" 일요일 (오늘이 일요일이면 7일 전)
    const lastSun = new Date(t);
    const day = t.getDay(); // 0=Sun
    const diffToLast = day === 0 ? 7 : day;
    lastSun.setDate(t.getDate() - diffToLast);

    // 지난 4개 일요일
    const prevs: Date[] = [];
    for (let i = 3; i >= 0; i--) {
      const d = new Date(lastSun);
      d.setDate(lastSun.getDate() - 7 * i);
      prevs.push(d);
    }

    // 가까운 다음 일요일 (오늘이 일요일이어도 +7)
    const nextSun = new Date(t);
    const ahead = day === 0 ? 7 : 7 - day;
    nextSun.setDate(t.getDate() + ahead);

    const all = [...prevs, nextSun];
    return all.map(d => ({ date: d, ymd: formatLocalYmd(d) }));
  }, [today]);

  // =========================
  // 이번 달 출석률 (분모: 이번 달 모든 일요일)
  // =========================
  const monthSundays = useMemo(() => {
    const now = today;
    const y = now.getFullYear();
    const m = now.getMonth(); // 0~11
    const first = new Date(y, m, 1);
    const last = new Date(y, m + 1, 0);
    const list: { ymd: string; date: Date }[] = [];

    const start = new Date(first);
    const offsetToSunday = (7 - start.getDay()) % 7; // 첫 일요일까지 이동
    start.setDate(start.getDate() + offsetToSunday);

    while (start <= last) {
      list.push({ ymd: formatLocalYmd(start), date: new Date(start) });
      start.setDate(start.getDate() + 7);
    }
    return list;
  }, [today]);

  const monthAttendanceRate = useMemo(() => {
    const byYmd = new Map(attendanceHistory.map(r => [r.attendDate, r as AttendanceRecord]));
    const total = monthSundays.length;
    const present = monthSundays.reduce((acc, s) => acc + (byYmd.get(s.ymd)?.status === 'PRESENT' ? 1 : 0), 0);
    const rate = total > 0 ? Math.round((present / total) * 100) : 0;
    return { total, present, rate };
  }, [attendanceHistory, monthSundays]);

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

        {/* Admin-only: QR 생성 섹션 */}
        {isAdmin && (
          <Card className="mb-6 p-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-800">QR 코드 생성</h3>
                <p className="text-sm text-gray-600">
                  생성된 QR은 화면에 계속 표시됩니다. (유효성 검사는 서버에서 처리)
                </p>
              </div>
              <Button onClick={handleGenerateQr} className="rounded-xl" disabled={isLoading}>
                <i className="ri-qr-code-line mr-2" />
                생성
              </Button>
            </div>

            {qrInfo && (
              <div className="mt-4 flex flex-col items-center">
                <div className="p-3 bg-white rounded-xl border">
                  <QRCodeSVG value={qrInfo.code} size={180} />
                </div>
                <div className="mt-2 text-sm text-gray-700 text-center">
                  코드: <span className="font-mono">{qrInfo.code}</span>
                </div>
              </div>
            )}
          </Card>
        )}

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
              <div className="flex gap-3">
                <Button
                  onClick={() => {
                    setShowQRScanner((prev) => {
                      const next = !prev;
                      if (next) startScanner(); else stopScanner();
                      return next;
                    });
                  }}
                  className="w-full py-4 rounded-xl"
                  variant={showQRScanner ? 'secondary' : 'primary'}
                >
                  <i className="ri-qr-scan-line mr-2 text-xl"></i>
                  {showQRScanner ? '스캔 닫기' : '스캐너 열기'}
                </Button>

                {showQRScanner && !scannerActive && (
                  <Button onClick={startScanner} className="py-4 rounded-xl" variant="success">
                    <i className="ri-camera-line mr-2"></i>
                    스캔 시작
                  </Button>
                )}

                {scannerActive && (
                  <Button onClick={stopScanner} className="py-4 rounded-xl" variant="danger">
                    <i className="ri-stop-circle-line mr-2"></i>
                    스캔 종료
                  </Button>
                )}
              </div>

              {showQRScanner && (
                <div className="mt-4 p-4 bg-gray-100 rounded-xl">
                  <div className="relative w-full max-w-sm mx-auto aspect-[3/4] bg-black rounded-lg overflow-hidden">
                    {/* 비디오 프리뷰 */}
                    <video
                      ref={videoRef}
                      className="absolute inset-0 w-full h-full object-cover"
                      playsInline
                      muted
                    />
                    {/* 가이드 라인 */}
                    <div className="absolute inset-0 border-2 border-white/30 rounded-lg pointer-events-none" />
                  </div>
                  <div className="mt-2 text-xs text-gray-600 text-center">
                    카메라 권한을 허용하고, QR을 사각형 안에 맞춰주세요.
                  </div>
                  {detectorSupported === false && (
                    <div className="mt-2 text-xs text-red-500 text-center">
                      이 브라우저는 QR 자동 인식을 지원하지 않습니다. 아래 “코드 입력”을 사용해주세요.
                    </div>
                  )}
                  {scannerMsg && (
                    <div className="mt-2 text-xs text-amber-600 text-center">{scannerMsg}</div>
                  )}
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
                  onChange={(e) => setAttendanceCode(e.target.value.toUpperCase())}
                  placeholder="출석 코드를 입력하세요"
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center text-lg font-mono bg-gray-50 focus:bg-white"
                  maxLength={32}
                  disabled={isLoading}
                />
                <Button
                  onClick={handleCodeSubmit}
                  disabled={!attendanceCode || isLoading}
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
                유효성/만료 검사는 서버에서 판단합니다.
              </p>
            </div>
          </Card>
        )}

        {/* =========================
             지난 출석 현황 (이전 4개 일요일 + 다음 일요일)
           ========================= */}
        <Card className="mb-6 p-4">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">지난 출석 현황</h3>

          <div className="flex flex-wrap gap-3">
            {last4SundaysPlusNext.map(({ ymd, date }, idx) => {
              const record = attendanceHistory.find((r) => r.attendDate === ymd);
              const isFuture = date > today;

              const baseCls =
                record
                  ? record.status === 'PRESENT'
                    ? 'bg-green-500'
                    : record.status === 'LATE'
                    ? 'bg-yellow-500'
                    : 'bg-red-500'
                  : isFuture
                  ? 'bg-gray-200 opacity-60'
                  : 'bg-gray-200';

              const iconCls =
                record
                  ? record.status === 'PRESENT'
                    ? 'ri-check-line'
                    : record.status === 'LATE'
                    ? 'ri-time-line'
                    : 'ri-close-line'
                  : '';

              return (
                <div key={`${ymd}-${idx}`} className="text-center">
                  <div className="text-xs text-gray-600 mb-1">
                    {date.toLocaleDateString('ko-KR', { month: 'numeric', day: 'numeric' })} (일)
                  </div>
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center mx-auto ${baseCls}`}>
                    {record && <i className={`text-white text-sm ${iconCls}`} />}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-4 text-center">
            <span className="text-sm text-gray-600">이번 달 출석률: </span>
            <span className="font-semibold text-blue-600">{monthAttendanceRate.rate}%</span>
            <span className="text-xs text-gray-500 ml-2">
              ({monthAttendanceRate.present}/{monthAttendanceRate.total})
            </span>
          </div>
        </Card>

        {/* Attendance History */}
        <Card className="p-4">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">출석 기록</h3>
          <div className="space-y-3">
            {attendanceHistory.length > 0 ? (
              attendanceHistory
                .slice()
                .sort((a, b) => (a.attendDate < b.attendDate ? 1 : -1))
                .slice(0, 10)
                .map((record, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 ${
                          record.status === 'PRESENT'
                            ? 'bg-green-100'
                            : record.status === 'LATE'
                            ? 'bg-yellow-100'
                            : 'bg-red-100'
                        }`}
                      >
                        <i className={`text-sm ${getStatusIcon(record.status)}`} />
                      </div>
                      <div>
                        <p className="font-medium text-gray-800 text-sm">
                          {new Date(record.attendDate).toLocaleDateString('ko-KR', {
                            month: 'long',
                            day: 'numeric',
                          })}
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
