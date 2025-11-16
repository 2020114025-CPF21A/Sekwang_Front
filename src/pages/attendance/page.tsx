import { useState, useEffect, useMemo, useRef } from 'react';
import Card from '../../components/base/Card';
import Button from '../../components/base/Button';
import { attendanceAPI } from '../../utils/api';
import { QRCodeSVG } from 'qrcode.react';
import jsQR from 'jsqr';

type AttendanceRecord = {
  attendDate: string;        // 'YYYY-MM-DD'
  status: 'PRESENT' | 'LATE' | 'ABSENT' | string;
};

type LocalUser = {
  username: string;
  role?: string;
  roles?: string[];
  authorities?: Array<string | { authority: string }>;
  [k: string]: any;
};

export default function Attendance() {
  const [attendanceCode, setAttendanceCode] = useState('');
  const [isCheckedIn, setIsCheckedIn] = useState(false);

  const [showQRScanner, setShowQRScanner] = useState(false);
  const [scannerActive, setScannerActive] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [user, setUser] = useState<LocalUser | null>(null);
  const [attendanceHistory, setAttendanceHistory] = useState<AttendanceRecord[]>([]);

  // Admin QR 표시(만료 무시)
  const [qrInfo, setQrInfo] = useState<{ code: string } | null>(null);

  // --- jsQR 방식 스캐너 refs ---
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const [scannerMsg, setScannerMsg] = useState<string>('');

  // --- 유틸 ---
  const formatLocalYmd = (d: Date) => {
    const yyyy = d.getFullYear();
    const mm = `${d.getMonth() + 1}`.padStart(2, '0');
    const dd = `${d.getDate()}`.padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };
  const today = useMemo(() => new Date(), []);
  const todayYmd = useMemo(() => formatLocalYmd(today), [today]);

  // --- 유저/기록 로드 ---
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
      const already = arr.some((r) => r.attendDate === todayYmd && r.status !== 'ABSENT');
      setIsCheckedIn(already);
    } catch (error) {
      console.error('Failed to load attendance history:', error);
    }
  };

  // --- 관리자 판별 ---
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

  // --- QR 생성 응답 정규화 ---
  const normalizeQrResponse = (res: any) => ({ code: String(res?.code ?? '') });

  // --- 관리자: QR 생성 ---
  const handleGenerateQr = async () => {
    if (!user) { alert('로그인이 필요합니다.'); return; }
    setIsLoading(true);
    try {
      const res = await attendanceAPI.generateQr();
      setQrInfo(normalizeQrResponse(res));
    } catch (e: any) {
      console.error(e);
      alert(e?.message ?? 'QR 생성에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // --- 코드 제출 ---
  const handleCodeSubmit = async () => {
    if (!user) { alert('로그인이 필요합니다.'); return; }
    if (!attendanceCode.trim()) { alert('출석 코드를 입력하세요.'); return; }
    if (isCheckedIn) { alert('오늘은 이미 출석했습니다.'); return; }

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

  // --- 위치 기반 체크인 ---
  const handleLocationCheckIn = async () => {
    if (!user) { alert('로그인이 필요합니다.'); return; }
    if (isCheckedIn) { alert('오늘은 이미 출석했습니다.'); return; }

    if (!navigator.geolocation) {
      alert('이 브라우저는 위치 서비스를 지원하지 않습니다.');
      return;
    }

    setIsLoading(true);
    try {
      // 현재 위치 가져오기
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        });
      });

      const { latitude, longitude } = position.coords;
      
      const res = await attendanceAPI.checkInByLocation(latitude, longitude);
      
      if (!res.ok) {
        throw new Error(res.message || '위치 기반 출석 실패');
      }
      
      setIsCheckedIn(true);
      await loadAttendanceHistory(user.username);
      alert(res.message || '위치 기반 출석이 확인되었습니다.');
    } catch (error: any) {
      console.error('Failed to check-in by location:', error);
      if (error.code === 1) {
        alert('위치 권한이 필요합니다. 브라우저 설정에서 위치 권한을 허용해주세요.');
      } else if (error.code === 2) {
        alert('위치를 가져올 수 없습니다. GPS가 켜져있는지 확인해주세요.');
      } else if (error.code === 3) {
        alert('위치 요청 시간이 초과되었습니다.');
      } else {
        alert(error?.message ?? '위치 기반 출석에 실패했습니다.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // ========= jsQR 스캐너 =========
  const drawLine = (begin: {x:number; y:number}, end: {x:number; y:number}, color = '#FF0000') => {
    const ctx = ctxRef.current;
    if (!ctx) return;
    ctx.beginPath();
    ctx.moveTo(begin.x, begin.y);
    ctx.lineTo(end.x, end.y);
    ctx.lineWidth = 4;
    ctx.strokeStyle = color;
    ctx.stroke();
  };

  const tick = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = ctxRef.current;
    if (!video || !canvas || !ctx) {
      rafRef.current = requestAnimationFrame(tick);
      return;
    }

    if (video.readyState === video.HAVE_ENOUGH_DATA) {
      // 비디오 크기에 맞춰 캔버스 크기 조정
      if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
      }

      // 프레임 그리기
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      // 픽셀 데이터 추출
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

      // jsQR로 디코딩 (블로그 글과 동일한 핵심 부분)
      const result = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: 'dontInvert',
      });

      if (result) {
        // 감지 박스 표시
        const loc = result.location;
        drawLine(loc.topLeftCorner, loc.topRightCorner);
        drawLine(loc.topRightCorner, loc.bottomRightCorner);
        drawLine(loc.bottomRightCorner, loc.bottomLeftCorner);
        drawLine(loc.bottomLeftCorner, loc.topLeftCorner);

        // 성공 처리
        handleScanResult(result.data);
        return; // 중복 호출 방지
      } else {
        // 계속 스캔
        setScannerMsg('QR을 프레임 중앙에 맞춰주세요…');
      }
    }

    rafRef.current = requestAnimationFrame(tick);
  };

  const startScanner = async () => {
    if (scannerActive) return;
    if (!user) { alert('로그인이 필요합니다.'); return; }
    if (isCheckedIn) { alert('오늘은 이미 출석했습니다.'); return; }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });
      streamRef.current = stream;

      const video = videoRef.current!;
      video.setAttribute('playsinline', 'true');
      // @ts-ignore
      video.setAttribute('webkit-playsinline', 'true');
      video.muted = true;
      video.autoplay = true;

      video.srcObject = stream;

      // loadedmetadata 대기 후 play
      await new Promise<void>((resolve) => {
        if (video.readyState >= 1) return resolve();
        const onLoaded = () => { video.removeEventListener('loadedmetadata', onLoaded); resolve(); };
        video.addEventListener('loadedmetadata', onLoaded);
      });
      await video.play();

      const canvas = canvasRef.current!;
      ctxRef.current = canvas.getContext('2d');

      setScannerActive(true);
      setScannerMsg('스캔 중…');

      rafRef.current = requestAnimationFrame(tick);
    } catch (err: any) {
      console.error(err);
      alert(err?.message ?? '카메라를 열 수 없습니다. 권한/HTTPS를 확인하세요.');
      stopScanner();
    }
  };

  const stopScanner = () => {
    if (rafRef.current != null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    const video = videoRef.current;
    if (video) {
      try { video.pause(); } catch {}
      video.srcObject = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    setScannerActive(false);
    setScannerMsg('');
  };

  useEffect(() => {
    if (!showQRScanner) stopScanner();
    return () => stopScanner();
  }, [showQRScanner]);

  const handleScanResult = async (text: string) => {
    stopScanner(); // 중복 방지
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

  // 최근 5개 일요일 (오늘 포함)
  const recentSundays = useMemo(() => {
    const t = new Date(today);
    const day = t.getDay(); // 0=Sun, 1=Mon, ...
    
    // 오늘이 일요일이면 오늘, 아니면 가장 최근 지난 일요일
    const mostRecentSun = new Date(t);
    if (day !== 0) {
      mostRecentSun.setDate(t.getDate() - day);
    }

    // 최근 일요일부터 과거로 4개 더 (총 5개)
    const sundays: Date[] = [];
    for (let i = 0; i < 5; i++) {
      const d = new Date(mostRecentSun);
      d.setDate(mostRecentSun.getDate() - (7 * i));
      sundays.push(d);
    }

    return sundays.reverse().map(d => ({ date: d, ymd: formatLocalYmd(d) }));
  }, [today]);

  // 이번 달 출석률
  const monthSundays = useMemo(() => {
    const now = today;
    const y = now.getFullYear();
    const m = now.getMonth();
    const first = new Date(y, m, 1);
    const last = new Date(y, m + 1, 0);
    const list: { ymd: string; date: Date }[] = [];

    const start = new Date(first);
    const offsetToSunday = (7 - start.getDay()) % 7;
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
      <div className="max-w-5xl mx-auto px-4 py-6">
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
            
            {/* QR Code Scanner (jsQR) */}
            <div className="mb-6">
              <div className="flex gap-3">
                <Button
                  onClick={() => setShowQRScanner((prev) => !prev)}
                  className="w-full py-4 rounded-xl"
                  variant={showQRScanner ? 'secondary' : 'primary'}
                >
                  <i className="ri-qr-scan-line mr-2 text-xl"></i>
                  {showQRScanner ? '스캐너 닫기' : '스캐너 열기'}
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
                      autoPlay
                    />
                    {/* 캔버스 (분석/가이드) */}
                    <canvas
                      ref={canvasRef}
                      className="absolute inset-0 w-full h-full"
                    />
                    <div className="absolute inset-0 border-2 border-white/30 rounded-lg pointer-events-none" />
                  </div>
                  <div className="mt-2 text-xs text-gray-600 text-center">
                    카메라 권한을 허용하고, QR을 사각형 안에 맞춰주세요.
                  </div>
                  {scannerMsg && (
                    <div className="mt-2 text-xs text-amber-600 text-center">{scannerMsg}</div>
                  )}
                </div>
              )}
            </div>

            <div className="text-center text-gray-500 my-4">또는</div>

            {/* Location-based Check-in */}
            <div className="mb-6">
              <Button
                onClick={handleLocationCheckIn}
                className="w-full py-4 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
                disabled={isLoading}
              >
                <i className="ri-map-pin-line mr-2 text-xl"></i>
                위치 기반 출석체크
              </Button>
              <p className="text-xs text-gray-500 mt-2 text-center">
                교회 근처(10m 이내)에서만 인증 가능합니다
              </p>
            </div>

            <div className="text-center text-gray-500 my-4">또는</div>

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

        {/* 최근 출석 현황 */}
        <Card className="mb-6 p-4">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 text-center">최근 출석 현황</h3>
          <div className="flex justify-center items-center gap-4">
            {recentSundays.map(({ ymd, date }, idx) => {
              const record = attendanceHistory.find((r) => r.attendDate === ymd);
              const isToday = ymd === todayYmd;

              const baseCls =
                record
                  ? record.status === 'PRESENT'
                    ? 'bg-green-500'
                    : record.status === 'LATE'
                    ? 'bg-yellow-500'
                    : 'bg-red-500'
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
                <div key={`${ymd}-${idx}`} className="text-center flex-shrink-0">
                  <div className="text-xs text-gray-600 mb-2 font-medium">
                    {date.toLocaleDateString('ko-KR', { month: 'numeric', day: 'numeric' })} (일)
                    {isToday && <div className="text-blue-600 font-bold text-xs mt-1">오늘</div>}
                  </div>
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto ${baseCls} ${isToday ? 'ring-4 ring-blue-500 ring-offset-2' : ''} shadow-md`}>
                    {record && <i className={`text-white text-lg ${iconCls}`} />}
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

        {/* 출석 기록 */}
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
