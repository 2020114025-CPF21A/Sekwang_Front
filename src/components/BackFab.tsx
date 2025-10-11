// src/components/common/BackFab.tsx
import { useNavigate, useLocation } from 'react-router-dom';

type Props = {
  fallback?: string;          // 히스토리 없을 때 이동할 경로
  hideOnPaths?: string[];     // 이 경로들에서는 버튼 숨김
};

export default function BackFab({
  fallback = '/',
  hideOnPaths = ['/login'],
}: Props) {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  // 특정 경로는 표시 안 함
  if (hideOnPaths.some(p => p === pathname || pathname.startsWith(p))) return null;

  const canGoBack = (window.history?.length || 0) > 1;

  const onClick = () => {
    if (canGoBack) navigate(-1);
    else navigate(fallback);
  };

  return (
    <button
      onClick={onClick}
      aria-label="이전으로"
      className="
        fixed left-4 bottom-4 z-50
        rounded-full shadow-md border border-gray-200
        bg-white hover:bg-gray-50
        px-4 h-11 inline-flex items-center gap-2
      "
    >
      <i className="ri-arrow-left-line" />
      <span className="text-sm">이전</span>
    </button>
  );
}
