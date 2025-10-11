// src/App.tsx
import { useEffect } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AppRoutes } from './router';
import { ensureLoginGate } from './utils/api';
import BackFab from '../src/components/BackFab';

// Vite 기준: BASE_URL 또는 커스텀 VITE_BASE_PATH 사용
const BASENAME =
  (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_BASE_PATH) ??
  (typeof import.meta !== 'undefined' && (import.meta as any).env?.BASE_URL) ??
  '/';

function App() {
  useEffect(() => {
    // 앱 첫 진입 시 세션 검증 → 없으면 /login으로
    ensureLoginGate();
  }, []);

  return (
    <BrowserRouter basename={BASENAME}>
      <AppRoutes />
      <BackFab fallback="/" hideOnPaths={['/login']} />
    </BrowserRouter>
  );
}

export default App;
