
// API 유틸리티 함수들
const BASE_URL = 'http://43.200.61.18:8080/api';

// 토큰 관리
export const getToken = (): string | null => {
  return localStorage.getItem('token');
};

export const setToken = (token: string): void => {
  localStorage.setItem('token', token);
};

export const removeToken = (): void => {
  localStorage.removeItem('token');
};

// API 요청 헤더 생성
const getHeaders = (includeAuth: boolean = true): HeadersInit => {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  
  if (includeAuth) {
    const token = getToken();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  }
  
  return headers;
};

// 공통 API 요청 함수
const apiRequest = async (
  endpoint: string,
  options: RequestInit = {},
  includeAuth: boolean = true
): Promise<any> => {
  const url = `${BASE_URL}${endpoint}`;
  const config: RequestInit = {
    ...options,
    headers: {
      ...getHeaders(includeAuth),
      ...options.headers,
    },
  };

  try {
    const response = await fetch(url, config);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return await response.json();
    }
    
    return response;
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
};

// 인증 API
export const authAPI = {
  login: (username: string, password: string) =>
    apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }, false),
    
  signup: (username: string, password: string, displayName: string, role: string = 'MEMBER') =>
    apiRequest('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ username, password, displayName, role }),
    }, false),
};

// 출석 API
export const attendanceAPI = {
  register: (username: string, attendDate: string, status: string = 'PRESENT') =>
    apiRequest('/attendance', {
      method: 'POST',
      body: JSON.stringify({ username, attendDate, status }),
    }),
    
  getUserAttendance: (username: string) =>
    apiRequest(`/attendance/user/${username}`),
};

// 헌금 API
export const offeringAPI = {
  register: (username: string, amount: number, note: string) =>
    apiRequest('/offerings', {
      method: 'POST',
      body: JSON.stringify({ username, amount, note }),
    }),
    
  getUserOfferings: (username: string) =>
    apiRequest(`/offerings/user/${username}`),
    
  getUserSummary: (username: string) =>
    apiRequest(`/offerings/summary/user/${username}`),
};

// QT API
export const qtAPI = {
  create: (username: string, qtDate: string, scriptureRef: string, meditation: string, prayerTopic: string) =>
    apiRequest('/qt', {
      method: 'POST',
      body: JSON.stringify({ username, qtDate, scriptureRef, meditation, prayerTopic }),
    }),
    
  getUserQTs: (username: string) =>
    apiRequest(`/qt/user/${username}`),
    
  like: (id: number) =>
    apiRequest(`/qt/${id}/like`, {
      method: 'PATCH',
    }),
};

// 공지사항 API
export const noticeAPI = {
  create: (title: string, content: string, isImportant: boolean, author: string) =>
    apiRequest('/notices', {
      method: 'POST',
      body: JSON.stringify({ title, content, isImportant, author }),
    }),
    
  getAll: () =>
    apiRequest('/notices'),
};

// 신앙 일지 API
export const faithAPI = {
  create: (author: string, moodCode: number, weatherCode: number, title: string, content: string) =>
    apiRequest('/faith', {
      method: 'POST',
      body: JSON.stringify({ author, moodCode, weatherCode, title, content }),
    }),
    
  getAll: () =>
    apiRequest('/faith'),
    
  getById: (id: number) =>
    apiRequest(`/faith/${id}`),
};

// 사진첩 API
export const galleryAPI = {
  create: (title: string, category: string, fileUrl: string, description: string, uploader: string) =>
    apiRequest('/gallery', {
      method: 'POST',
      body: JSON.stringify({ title, category, fileUrl, description, uploader }),
    }),
    
  getAll: () =>
    apiRequest('/gallery'),
    
  getById: (id: number) =>
    apiRequest(`/gallery/${id}`),
};

// 주보 API
export const bulletinAPI = {
  create: (uploader: string, title: string, publishDate: string, fileUrl: string) =>
    apiRequest('/bulletins', {
      method: 'POST',
      body: JSON.stringify({ uploader, title, publishDate, fileUrl }),
    }),
    
  getAll: () =>
    apiRequest('/bulletins'),
    
  getById: (id: number) =>
    apiRequest(`/bulletins/${id}`),
};

// 찬양 API
export const songAPI = {
  create: (uploader: string, title: string, artist: string, category: string, musicalKey: string, tempoBpm: number, imageUrl: string) =>
    apiRequest('/songs', {
      method: 'POST',
      body: JSON.stringify({ uploader, title, artist, category, musicalKey, tempoBpm, imageUrl }),
    }),
    
  getAll: () =>
    apiRequest('/songs'),
    
  getById: (id: number) =>
    apiRequest(`/songs/${id}`),
};

// 객관식 퀴즈 API
export const mcAPI = {
  createSet: (setName: string) =>
    apiRequest('/mc/sets', {
      method: 'POST',
      body: JSON.stringify({ setName }),
    }),
    
  addQuestion: (setId: number, question: string, choice1: string, choice2: string, choice3: string, choice4: string, answerNo: number) =>
    apiRequest(`/mc/sets/${setId}/questions`, {
      method: 'POST',
      body: JSON.stringify({ question, choice1, choice2, choice3, choice4, answerNo }),
    }),
    
  saveResult: (username: string, setId: number, score: number) =>
    apiRequest('/mc/results', {
      method: 'POST',
      body: JSON.stringify({ username, setId, score }),
    }),
};

// OX 퀴즈 API
export const oxAPI = {
  createSet: (setName: string) =>
    apiRequest('/ox/sets', {
      method: 'POST',
      body: JSON.stringify({ setName }),
    }),
    
  addQuestion: (setId: number, question: string, answer: number) =>
    apiRequest(`/ox/sets/${setId}/questions`, {
      method: 'POST',
      body: JSON.stringify({ question, answer }),
    }),
    
  saveResult: (username: string, setId: number, score: number) =>
    apiRequest('/ox/results', {
      method: 'POST',
      body: JSON.stringify({ username, setId, score }),
    }),
};

// 스피드 퀴즈 API
export const speedAPI = {
  createSet: (setName: string) =>
    apiRequest('/speed/sets', {
      method: 'POST',
      body: JSON.stringify({ setName }),
    }),
    
  addQuestion: (setId: number, question: string, accept1: string, accept2: string, accept3: string) =>
    apiRequest(`/speed/sets/${setId}/questions`, {
      method: 'POST',
      body: JSON.stringify({ question, accept1, accept2, accept3 }),
    }),
    
  saveResult: (username: string, setId: number, score: number) =>
    apiRequest('/speed/results', {
      method: 'POST',
      body: JSON.stringify({ username, setId, score }),
    }),
};
