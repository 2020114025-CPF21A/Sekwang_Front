// src/utils/api.ts

// ===== 기본 설정 =====
const API_BASE =
  (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_API_BASE_URL) ||
  'https://skchyouth.kr:8080'; // 43.200.61.18
const BASE_URL = `${API_BASE}/api`;

// ===== 로컬 상태 관리 =====
export const getToken = (): string | null => localStorage.getItem('token');
export const setToken = (token: string): void => localStorage.setItem('token', token);
export const removeToken = (): void => localStorage.removeItem('token');

export const getUser = (): any | null => {
  try { return JSON.parse(localStorage.getItem('user') || 'null'); } catch { return null; }
};
export const setUser = (user: any): void => localStorage.setItem('user', JSON.stringify(user));
export const removeUser = (): void => localStorage.removeItem('user');

// ===== 공통: 401 처리 → 로그인으로 보냄 =====
function handleUnauthorized() {
  removeToken();
  removeUser();
  if (typeof window !== 'undefined') {
    // 이미 /login이면 또 안 보냄
    if (!/\/login(?:\?|$)/.test(window.location.pathname)) {
      window.location.replace('/login');
    }
  }
}

// ===== 공통 요청 유틸 =====
async function apiRequest(
  endpoint: string,
  options: RequestInit = {},
  includeAuth: boolean = true
): Promise<any> {
  const url = `${BASE_URL}${endpoint}`;

  // 헤더 구성 (FormData면 Content-Type 자동 생략)
  const headers = new Headers(options.headers || {});
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }
  if (includeAuth) {
    const token = getToken();
    if (token) headers.set('Authorization', `Bearer ${token}`);
  }

  const config: RequestInit = {
    ...options,
    headers,
    credentials: options.credentials ?? 'omit', // Bearer 토큰 사용
  };

  let res: Response;
  try {
    res = await fetch(url, config);
  } catch (e) {
    console.error('Network error:', e);
    throw new Error('네트워크 오류가 발생했습니다.');
  }

  // 401 → 토큰/유저 제거 + /login 리다이렉트
  if (res.status === 401) {
    handleUnauthorized();
    throw new Error('인증이 필요합니다.');
  }

  if (!res.ok) {
    let msg = `${res.status} ${res.statusText}`;
    try {
      const ct = res.headers.get('content-type');
      if (ct && ct.includes('application/json')) {
        const j = await res.json();
        msg = j?.message || j?.error || msg;
      } else {
        const t = await res.text();
        if (t) msg = t;
      }
    } catch { /* noop */ }
    throw new Error(msg);
  }

  if (res.status === 204) return null;

  const contentType = res.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    return res.json();
  }
  return res;
}

// ===== 부팅 시 세션 검증 게이트 =====
// App.tsx 등에서 최초 한 번 호출: ensureLoginGate()
export async function ensureLoginGate(): Promise<void> {
  try {
    const me = await authAPI.me();     // 성공 → 서버 값으로 user 갱신
    setUser(me);
  } catch {
    handleUnauthorized();              // 실패 → /login
  }
}

// ===== 인증 API =====
export const authAPI = {
  // 서버 응답 예시 가정: { token, user: {username, displayName, roles: [...] } }
  login: async (username: string, password: string) => {
    const res = await apiRequest(
      '/auth/login',
      { method: 'POST', body: JSON.stringify({ username, password }) },
      false
    );
    if (res?.token) setToken(res.token);
    if (res?.user)  setUser(res.user);
    return res;
  },

  signup: (username: string, password: string, displayName: string, role: string = 'MEMBER') =>
    apiRequest(
      '/auth/signup',
      { method: 'POST', body: JSON.stringify({ username, password, displayName, role }) },
      false
    ),

  me: () => apiRequest('/auth/me', { method: 'GET' }, true),

  logout: async () => {
    try {
      await apiRequest('/auth/logout', { method: 'POST' }, true);
    } catch { /* 서버에 없을 수도 있음 */ }
    handleUnauthorized();
  },
};

// ===== 출석 API =====
export const attendanceAPI = {
  getUserAttendance: (username: string) =>
    apiRequest(`/attendance/user/${encodeURIComponent(username)}`),

  // 관리자: QR 생성 (JWT에서 관리자 식별 → 프론트 파라미터 불필요)
  generateQr: () =>
    apiRequest('/attendance/qr', { method: 'POST' }),

  // 일반: 코드로 체크인 (username은 서버가 JWT에서 추출)
  checkIn: (code: string) =>
    apiRequest('/attendance/check-in', {
      method: 'POST',
      body: JSON.stringify({ code }),
    }),
};

// ===== 헌금 API =====
export const offeringAPI = {
  register: (username: string, amount: number, note: string) =>
    apiRequest('/offerings', {
      method: 'POST',
      body: JSON.stringify({ username, amount, note }),
    }),
  getUserOfferings: (username: string) =>
    apiRequest(`/offerings/user/${encodeURIComponent(username)}`),
  getUserSummary: (username: string) =>
    apiRequest(`/offerings/summary/user/${encodeURIComponent(username)}`),
};

// ===== QT API =====
export const qtAPI = {
  create: (username: string, qtDate: string, scriptureRef: string, meditation: string, prayerTopic: string) =>
    apiRequest('/qt', {
      method: 'POST',
      body: JSON.stringify({ username, qtDate, scriptureRef, meditation, prayerTopic }),
    }),
  getUserQTs: (username: string) => apiRequest(`/qt/user/${username}`),
  like: (id: number) => apiRequest(`/qt/${id}/like`, { method: 'PATCH' }),
};

// ===== 공지사항 API =====
export type NoticeUpdatePayload = {
  title?: string;
  content?: string;
  isImportant?: boolean;
  authorId?: string;
};

export type NoticeDto = {
  id: number;
  title: string;
  content: string;
  isImportant: boolean;
  author?: { username?: string; displayName?: string } | string | null;
  createdAt: string;
  updatedAt: string;
};

export const noticeAPI = {
  create: (title: string, content: string, isImportant: boolean, authorId: string) =>
    apiRequest('/notices', {
      method: 'POST',
      body: JSON.stringify({ title, content, isImportant, authorId }),
    }),
  getAll: (): Promise<NoticeDto[]> => apiRequest('/notices'),
  getById: (id: number): Promise<NoticeDto> => apiRequest(`/notices/${id}`),
  update: (id: number, payload: NoticeUpdatePayload) =>
    apiRequest(`/notices/${id}`, { method: 'PATCH', body: JSON.stringify(payload) }),
  remove: (id: number) => apiRequest(`/notices/${id}`, { method: 'DELETE' }),
  canEdit: (notice: NoticeDto, currentUser?: { username: string; role?: string }) => {
    if (!currentUser) return false;
    const role = (currentUser.role || '').toUpperCase();
    if (role === 'ADMIN' || role === 'LEADER') return true;
    const authorUsername =
      typeof notice.author === 'string'
        ? notice.author
        : (notice.author?.username as string | undefined);
    return !!authorUsername && authorUsername === currentUser.username;
  },
};

// ===== 신앙 일지 API =====
export const faithAPI = {
  create: (author: string, moodCode: number, weatherCode: number, title: string, content: string) =>
    apiRequest('/faith-journals', {
      method: 'POST',
      body: JSON.stringify({ author, moodCode, weatherCode, title, content }),
    }),
  getUserJournals: (username: string, page = 0, size = 20) =>
    apiRequest(`/faith-journals/user/${username}?page=${page}&size=${size}`),
  getById: (id: number) => apiRequest(`/faith-journals/${id}`),
};

// ===== 사진첩 API (S3 업로드: /gallery/upload) =====
export const galleryAPI = {
  upload: (file: File, title: string, category: string, description: string, uploader: string) => {
    const fd = new FormData();
    fd.append('file', file);
    fd.append('title', title);
    fd.append('category', category || '');
    fd.append('description', description || '');
    fd.append('uploader', uploader);

    const token = getToken();
    return fetch(`${BASE_URL}/gallery/upload`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } as any : undefined,
      body: fd,
    }).then(async (res) => {
      if (res.status === 401) { handleUnauthorized(); throw new Error('인증이 필요합니다.'); }
      if (!res.ok) {
        const msg = await res.text();
        throw new Error(msg || `HTTP ${res.status}`);
      }
      return res.json();
    });
  },
  getAll: () => apiRequest('/gallery'),
  getById: (id: number) => apiRequest(`/gallery/${id}`),
  delete: (id: number) => apiRequest(`/gallery/${id}`, { method: 'DELETE' }),
};

// ===== 주보 API =====
export type BulletinRes = {
  bulletinNo: number;
  uploader: string | null;
  title: string;
  publishDate: string;
  fileUrl: string;
  views: number;
};

export const bulletinAPI = {
  upload: (file: File, uploader: string, title: string, publishDate: string) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('uploader', uploader);
    formData.append('title', title);
    formData.append('publishDate', publishDate);

    return apiRequest('/bulletins/upload', { method: 'POST', body: formData });
  },
  getAll: (page = 0, size = 20) => apiRequest(`/bulletins?page=${page}&size=${size}`),
  getByNo: (no: number) => apiRequest(`/bulletins/${no}`),
  remove: (no: number) => apiRequest(`/bulletins/${no}`, { method: 'DELETE' }),
};

// ===== 찬양 API =====
export const songAPI = {
  upload: (file: File, title: string, artist: string, category: string, musicalKey: string, tempoBpm: number, uploader: string) => {
    const fd = new FormData();
    fd.append('image', file);
    fd.append('title', title);
    fd.append('artist', artist || '');
    fd.append('category', category || '기타');
    fd.append('musicalKey', musicalKey || '');
    fd.append('tempoBpm', String(tempoBpm || 0));
    fd.append('uploader', uploader);

    const token = getToken();
    return fetch(`${BASE_URL}/songs/upload`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } as any : undefined,
      body: fd,
    }).then(async (res) => {
      if (res.status === 401) { handleUnauthorized(); throw new Error('인증이 필요합니다.'); }
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    });
  },
  getAll: () => apiRequest('/songs'),
  getById: (id: number) => apiRequest(`/songs/${id}`),
};

// ===== 퀴즈 API =====
export const mcAPI = {
  getAllSets: () => apiRequest('/mc/sets'),
  getSet: (setId: number) => apiRequest(`/mc/sets/${setId}`),
  saveResult: (username: string, setId: number, score: number) =>
    apiRequest('/mc/results', { method: 'POST', body: JSON.stringify({ username, setId, score }) }),
};

export const oxAPI = {
  getAllSets: () => apiRequest('/ox/sets'),
  getSet: (setId: number) => apiRequest(`/ox/sets/${setId}`),
  saveResult: (username: string, setId: number, score: number) =>
    apiRequest('/ox/results', { method: 'POST', body: JSON.stringify({ username, setId, score }) }),
};

export const speedAPI = {
  getAllSets: () => apiRequest('/speed/sets'),
  getSet: (setId: number) => apiRequest(`/speed/sets/${setId}`),
  saveResult: (username: string, setId: number, score: number) =>
    apiRequest('/speed/results', { method: 'POST', body: JSON.stringify({ username, setId, score }) }),
};

// 필요 시 공용 export
export { apiRequest };
