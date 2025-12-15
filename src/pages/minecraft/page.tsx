import { useState, useEffect } from 'react';
import Card from '../../components/base/Card';

interface ServerStatus {
  online: boolean;
  serverName: string;
  version: string;
  currentPlayers: number;
  maxPlayers: number;
  serverAddress: string;
  port: number;
  latency: number;
}

interface PlayerList {
  online: boolean;
  count: number;
  players: string[];
}

interface PlayerLog {
  id: number;
  playerName: string;
  eventType: 'JOIN' | 'LEAVE';
  eventTime: string;
  sessionDurationMinutes: number | null;
}

interface DailyStats {
  uniquePlayers: number;
  totalSessions: number;
  recentLogs: PlayerLog[];
}

interface PlayTimeRanking {
  rank: number;
  playerName: string;
  totalPlayTimeMinutes: number;
  formattedPlayTime: string;
}

const API_BASE = import.meta.env.VITE_API_URL || '';

export default function Minecraft() {
  const [status, setStatus] = useState<ServerStatus | null>(null);
  const [players, setPlayers] = useState<PlayerList | null>(null);
  const [logs, setLogs] = useState<PlayerLog[]>([]);
  const [dailyStats, setDailyStats] = useState<DailyStats | null>(null);
  const [ranking, setRanking] = useState<PlayTimeRanking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [activeTab, setActiveTab] = useState<'status' | 'logs' | 'ranking'>('status');

  const fetchServerStatus = async () => {
    try {
      setError(null);
      const [statusRes, playersRes] = await Promise.all([
        fetch(`${API_BASE}/api/minecraft/status`),
        fetch(`${API_BASE}/api/minecraft/players`)
      ]);

      if (!statusRes.ok || !playersRes.ok) {
        throw new Error('서버 상태를 가져올 수 없습니다');
      }

      const statusData = await statusRes.json();
      const playersData = await playersRes.json();

      setStatus(statusData);
      setPlayers(playersData);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Error fetching server status:', err);
      setError('서버 정보를 불러오는데 실패했습니다');
    } finally {
      setLoading(false);
    }
  };

  const fetchLogs = async () => {
    try {
      const [logsRes, statsRes, rankingRes] = await Promise.all([
        fetch(`${API_BASE}/api/minecraft/logs`),
        fetch(`${API_BASE}/api/minecraft/stats/daily`),
        fetch(`${API_BASE}/api/minecraft/stats/ranking`)
      ]);

      if (logsRes.ok) {
        const logsData = await logsRes.json();
        setLogs(logsData);
      }
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setDailyStats(statsData);
      }
      if (rankingRes.ok) {
        const rankingData = await rankingRes.json();
        setRanking(rankingData);
      }
    } catch (err) {
      console.error('Error fetching logs:', err);
    }
  };

  useEffect(() => {
    fetchServerStatus();
    fetchLogs();
    // 10초마다 자동 갱신 (로그는 실시간 감시)
    const statusInterval = setInterval(fetchServerStatus, 30000);
    const logsInterval = setInterval(fetchLogs, 10000);
    return () => {
      clearInterval(statusInterval);
      clearInterval(logsInterval);
    };
  }, []);

  const getStatusColor = (online: boolean) => {
    return online ? 'bg-green-500' : 'bg-red-500';
  };

  const getStatusText = (online: boolean) => {
    return online ? '온라인' : '오프라인';
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('서버 주소가 복사되었습니다!');
  };

  const formatEventTime = (eventTime: string) => {
    // 서버에서 오는 시간은 UTC이므로 'Z'를 붙여서 UTC로 파싱
    const utcTime = eventTime.endsWith('Z') ? eventTime : eventTime + 'Z';
    const date = new Date(utcTime);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return '방금 전';
    if (diffMins < 60) return `${diffMins}분 전`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}시간 전`;
    return date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const refreshAll = () => {
    setLoading(true);
    fetchServerStatus();
    fetchLogs();
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20 sm:pb-4">
      {/* 헤더 */}
      <div
        className="text-white bg-gradient-to-br from-green-600 to-emerald-800"
        style={{
          backgroundImage: `linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.4)), url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      >
        <div className="px-4 py-8 text-center">
          <div className="w-20 h-20 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
            <span className="text-4xl">⛏️</span>
          </div>
          <h1 className="text-2xl font-bold mb-2">마인크래프트 서버</h1>
          <p className="text-green-100">Sekwang Minecraft Server</p>
        </div>
      </div>

      {/* 탭 메뉴 */}
      <div className="max-w-2xl mx-auto px-4 -mt-4">
        <div className="flex bg-white rounded-xl shadow-lg mb-4 overflow-hidden">
          <button
            onClick={() => setActiveTab('status')}
            className={`flex-1 py-3 text-sm font-medium transition ${activeTab === 'status'
              ? 'bg-green-600 text-white'
              : 'text-gray-600 hover:bg-gray-100'
              }`}
          >
            🎮 서버 상태
          </button>
          <button
            onClick={() => setActiveTab('logs')}
            className={`flex-1 py-3 text-sm font-medium transition ${activeTab === 'logs'
              ? 'bg-green-600 text-white'
              : 'text-gray-600 hover:bg-gray-100'
              }`}
          >
            📋 접속 로그
          </button>
          <button
            onClick={() => setActiveTab('ranking')}
            className={`flex-1 py-3 text-sm font-medium transition ${activeTab === 'ranking'
              ? 'bg-green-600 text-white'
              : 'text-gray-600 hover:bg-gray-100'
              }`}
          >
            🏆 랭킹
          </button>
        </div>

        {/* 서버 상태 탭 */}
        {activeTab === 'status' && (
          <>
            <Card className="mb-6 p-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-green-100 rounded-full -mr-16 -mt-16 opacity-50"></div>

              <div className="relative">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold text-gray-800 flex items-center">
                    <span className="mr-2">🎮</span> 서버 상태
                  </h2>
                  <button
                    onClick={refreshAll}
                    disabled={loading}
                    className="text-sm text-blue-600 hover:text-blue-800 flex items-center disabled:opacity-50"
                  >
                    <i className={`ri-refresh-line mr-1 ${loading ? 'animate-spin' : ''}`}></i>
                    새로고침
                  </button>
                </div>

                {loading && !status ? (
                  <div className="text-center py-8">
                    <div className="w-12 h-12 border-4 border-green-200 border-t-green-600 rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-500">서버 정보를 불러오는 중...</p>
                  </div>
                ) : error ? (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <i className="ri-error-warning-line text-2xl text-red-500"></i>
                    </div>
                    <p className="text-red-500 mb-4">{error}</p>
                    <button
                      onClick={refreshAll}
                      className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
                    >
                      다시 시도
                    </button>
                  </div>
                ) : status ? (
                  <div>
                    <div className="flex items-center justify-center mb-6">
                      <div className={`w-4 h-4 rounded-full ${getStatusColor(status.online)} mr-3 animate-pulse`}></div>
                      <span className={`text-xl font-bold ${status.online ? 'text-green-600' : 'text-red-600'}`}>
                        {getStatusText(status.online)}
                      </span>
                    </div>

                    {status.online && (
                      <>
                        <div className="grid grid-cols-2 gap-4 mb-6">
                          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 text-center">
                            <div className="text-3xl font-bold text-blue-600">{status.currentPlayers}</div>
                            <div className="text-sm text-blue-700">/ {status.maxPlayers} 명</div>
                            <div className="text-xs text-blue-600 mt-1">접속 중</div>
                          </div>
                          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 text-center">
                            <div className="text-3xl font-bold text-purple-600">{status.latency}</div>
                            <div className="text-sm text-purple-700">ms</div>
                            <div className="text-xs text-purple-600 mt-1">지연시간</div>
                          </div>
                        </div>

                        <div className="space-y-3 bg-gray-50 rounded-xl p-4">
                          <div className="flex justify-between items-center">
                            <span className="text-gray-600 text-sm">서버 이름</span>
                            <span className="font-medium text-gray-800">{status.serverName}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-gray-600 text-sm">버전</span>
                            <span className="font-medium text-gray-800">{status.version}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-gray-600 text-sm">서버 주소</span>
                            <button
                              onClick={() => copyToClipboard(`${status.serverAddress}:${status.port}`)}
                              className="font-mono text-sm bg-gray-200 hover:bg-gray-300 px-3 py-1 rounded-lg transition flex items-center"
                            >
                              {status.serverAddress}:{status.port}
                              <i className="ri-file-copy-line ml-2 text-gray-500"></i>
                            </button>
                          </div>
                        </div>
                      </>
                    )}

                    {lastUpdated && (
                      <p className="text-xs text-gray-400 text-center mt-4">
                        마지막 업데이트: {lastUpdated.toLocaleTimeString('ko-KR')}
                      </p>
                    )}
                  </div>
                ) : null}
              </div>
            </Card>

            {/* 현재 접속자 */}
            {status?.online && players && (
              <Card className="mb-6 p-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                  <span className="mr-2">👥</span> 현재 접속자
                  <span className="ml-2 px-2 py-1 bg-green-100 text-green-700 text-sm rounded-full">
                    {players.count}명
                  </span>
                </h2>

                {players.count > 0 ? (
                  <div className="grid grid-cols-2 gap-2">
                    {players.players.length > 0 ? (
                      players.players.map((player, index) => (
                        <div
                          key={index}
                          className="flex items-center bg-gray-50 rounded-lg p-3"
                        >
                          <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-emerald-500 rounded-lg flex items-center justify-center mr-3">
                            <span className="text-white text-sm font-bold">
                              {player.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <span className="font-medium text-gray-800 truncate">{player}</span>
                        </div>
                      ))
                    ) : (
                      <div className="col-span-2 text-center py-4 text-gray-500">
                        <p className="text-sm">플레이어 {players.count}명 접속 중</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-400">
                    <i className="ri-user-line text-4xl mb-2"></i>
                    <p>현재 접속 중인 플레이어가 없습니다</p>
                  </div>
                )}
              </Card>
            )}

            {/* 접속 방법 안내 */}
            <Card className="mb-6 p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <span className="mr-2">📱</span> 접속 방법
              </h2>

              <div className="space-y-4">
                <div className="flex items-start">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                    <span className="text-blue-600 font-bold text-sm">1</span>
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-800">마인크래프트 베드락 에디션 실행</h3>
                    <p className="text-sm text-gray-600">모바일, PC (Windows 10/11), 콘솔 지원</p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                    <span className="text-blue-600 font-bold text-sm">2</span>
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-800">플레이 → 서버 → 서버 추가</h3>
                    <p className="text-sm text-gray-600">서버 탭에서 "서버 추가" 버튼 클릭</p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                    <span className="text-blue-600 font-bold text-sm">3</span>
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-800">서버 정보 입력</h3>
                    <div className="mt-2 bg-gray-100 rounded-lg p-3 font-mono text-sm">
                      <div className="flex justify-between mb-1">
                        <span className="text-gray-500">서버 주소:</span>
                        <span className="text-gray-800">13.209.16.201</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">포트:</span>
                        <span className="text-gray-800">19132</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </>
        )}

        {/* 접속 로그 탭 */}
        {activeTab === 'logs' && (
          <>
            {/* 오늘의 통계 */}
            {dailyStats && (
              <Card className="mb-6 p-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                  <span className="mr-2">📊</span> 오늘의 통계
                </h2>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-xl p-4 text-center">
                    <div className="text-3xl font-bold text-indigo-600">{dailyStats.uniquePlayers}</div>
                    <div className="text-sm text-indigo-700">고유 접속자</div>
                  </div>
                  <div className="bg-gradient-to-br from-pink-50 to-pink-100 rounded-xl p-4 text-center">
                    <div className="text-3xl font-bold text-pink-600">{dailyStats.totalSessions}</div>
                    <div className="text-sm text-pink-700">총 접속</div>
                  </div>
                </div>
              </Card>
            )}

            {/* 실시간 로그 */}
            <Card className="mb-6 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-800 flex items-center">
                  <span className="mr-2">📋</span> 접속 로그
                  <span className="ml-2 w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                </h2>
                <span className="text-xs text-gray-400">10초마다 자동 갱신</span>
              </div>

              {logs.length > 0 ? (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {logs.map((log) => (
                    <div
                      key={log.id}
                      className={`flex items-center p-3 rounded-lg ${log.eventType === 'JOIN'
                        ? 'bg-green-50 border-l-4 border-green-500'
                        : 'bg-red-50 border-l-4 border-red-500'
                        }`}
                    >
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 ${log.eventType === 'JOIN' ? 'bg-green-200' : 'bg-red-200'
                        }`}>
                        {log.eventType === 'JOIN' ? '🟢' : '🔴'}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center">
                          <span className="font-medium text-gray-800">{log.playerName}</span>
                          <span className={`ml-2 text-xs px-2 py-0.5 rounded ${log.eventType === 'JOIN'
                            ? 'bg-green-200 text-green-700'
                            : 'bg-red-200 text-red-700'
                            }`}>
                            {log.eventType === 'JOIN' ? '입장' : '퇴장'}
                          </span>
                        </div>
                        <div className="flex items-center text-xs text-gray-500 mt-1">
                          <span>{formatEventTime(log.eventTime)}</span>
                          {log.eventType === 'LEAVE' && log.sessionDurationMinutes && (
                            <span className="ml-2 text-purple-600">
                              ⏱️ {log.sessionDurationMinutes}분 플레이
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-400">
                  <i className="ri-file-list-3-line text-4xl mb-2"></i>
                  <p>아직 접속 기록이 없습니다</p>
                  <p className="text-sm mt-1">마인크래프트 서버에 접속해보세요!</p>
                </div>
              )}
            </Card>
          </>
        )}

        {/* 랭킹 탭 */}
        {activeTab === 'ranking' && (
          <Card className="mb-6 p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <span className="mr-2">🏆</span> 플레이 시간 랭킹
            </h2>

            {ranking.length > 0 ? (
              <div className="space-y-3">
                {ranking.map((player) => (
                  <div
                    key={player.rank}
                    className={`flex items-center p-4 rounded-xl ${player.rank === 1
                      ? 'bg-gradient-to-r from-yellow-100 to-amber-100 border border-yellow-300'
                      : player.rank === 2
                        ? 'bg-gradient-to-r from-gray-100 to-slate-100 border border-gray-300'
                        : player.rank === 3
                          ? 'bg-gradient-to-r from-orange-100 to-amber-100 border border-orange-300'
                          : 'bg-gray-50'
                      }`}
                  >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-4 text-lg font-bold ${player.rank === 1
                      ? 'bg-yellow-400 text-white'
                      : player.rank === 2
                        ? 'bg-gray-400 text-white'
                        : player.rank === 3
                          ? 'bg-orange-400 text-white'
                          : 'bg-gray-200 text-gray-600'
                      }`}>
                      {player.rank <= 3 ? ['🥇', '🥈', '🥉'][player.rank - 1] : player.rank}
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-gray-800">{player.playerName}</div>
                      <div className="text-sm text-gray-500">{player.formattedPlayTime}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-purple-600">
                        {player.totalPlayTimeMinutes}
                      </div>
                      <div className="text-xs text-gray-500">분</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-400">
                <i className="ri-trophy-line text-4xl mb-2"></i>
                <p>아직 랭킹 데이터가 없습니다</p>
                <p className="text-sm mt-1">서버에서 플레이하면 기록됩니다!</p>
              </div>
            )}
          </Card>
        )}
      </div>
    </div>
  );
}
