import { useEffect, useState } from 'react';
import Card from '../../components/base/Card';
import Button from '../../components/base/Button';
import { noticeAPI } from '../../utils/api';

type NoticeItem = {
  id: number;
  title: string;
  content: string;
  isImportant: boolean;
  author?: string | { name?: string; username?: string };
  createdAt?: string;
  updatedAt?: string;
};

export default function Notice() {
  const [selectedNotice, setSelectedNotice] = useState<NoticeItem | null>(null);
  const [isWriting, setIsWriting] = useState(false);
  const [notices, setNotices] = useState<NoticeItem[]>([]);
  const [newNotice, setNewNotice] = useState({
    title: '',
    content: '',
    isImportant: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 로그인 사용자 정보 파싱
  const getCurrentUser = () => {
    try {
      const raw = localStorage.getItem('user');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  };

  const currentUser = getCurrentUser();
  const isAdmin = (currentUser?.role || '').toString().toUpperCase() === 'ADMIN';

  // 공지 목록 로드
  const fetchNotices = async () => {
    try {
      const data = await noticeAPI.getAll();
  
      const normalized = (data || []).map((n: any) => ({
        ...n,
        author: n.author
          ? typeof n.author === 'string'
            ? n.author
            : { username: n.author.username, name: n.author.displayName ?? n.author.name }
          : null,
      }));
  
      setNotices(normalized);
    } catch (err) {
      console.error('공지 목록 불러오기 실패:', err);
      alert('공지 목록을 불러오지 못했습니다.');
    }
  };

  useEffect(() => {
    fetchNotices();
  }, []);

  // 공지 등록
  const handleWriteNotice = async () => {
    if (!newNotice.title.trim() || !newNotice.content.trim()) {
      alert('제목과 내용을 모두 입력해주세요.');
      return;
    }

    if (!currentUser?.username) {
      alert('로그인이 필요합니다.');
      return;
    }

    setIsSubmitting(true);
    try {
      await noticeAPI.create(
        newNotice.title.trim(),
        newNotice.content.trim(),
        newNotice.isImportant,
        currentUser.username
      );
      alert('공지사항이 등록되었습니다.');
      setIsWriting(false);
      setNewNotice({ title: '', content: '', isImportant: false });
      await fetchNotices();
    } catch (err) {
      console.error('공지 등록 실패:', err);
      alert('공지 등록 중 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 공지 수정
  const handleEditNotice = async () => {
    if (!selectedNotice) return;
    const newTitle = prompt('새 제목을 입력하세요', selectedNotice.title);
    const newContent = prompt('새 내용을 입력하세요', selectedNotice.content);
    if (!newTitle || !newContent) return;

    try {
      await noticeAPI.update(selectedNotice.id, {
        title: newTitle,
        content: newContent,
        isImportant: selectedNotice.isImportant,
        authorId: currentUser.username,
      });
      alert('공지사항이 수정되었습니다.');
      await fetchNotices();
      setSelectedNotice(null);
    } catch (err) {
      console.error('공지 수정 실패:', err);
      alert('공지 수정 중 오류가 발생했습니다.');
    }
  };

  // 공지 삭제
  const handleDeleteNotice = async () => {
    if (!selectedNotice) return;
    if (!window.confirm('정말로 삭제하시겠습니까?')) return;

    try {
      await noticeAPI.remove(selectedNotice.id);
      alert('공지사항이 삭제되었습니다.');
      await fetchNotices();
      setSelectedNotice(null);
    } catch (err) {
      console.error('공지 삭제 실패:', err);
      alert('공지 삭제 중 오류가 발생했습니다.');
    }
  };

  // 작성자 텍스트
  const renderAuthor = (author: NoticeItem['author']) => {
    if (!author) return '-';
    if (typeof author === 'string') return author;
    return author.name || author.username || '-';
  };

  // 관리자 권한 여부
  const canAdmin = () => {
    return (currentUser?.role || '').toString().toUpperCase() === 'ADMIN';
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20 sm:pb-4">
      <div className="max-w-5xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <i className="ri-notification-line text-2xl text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">공지사항</h1>
          <p className="text-gray-600">청소년부의 소식과 안내사항을 확인하세요</p>
        </div>

        {/* 작성 버튼 (관리자만 표시) */}
        {isAdmin && (
          <div className="mb-6">
            <Button
              onClick={() => setIsWriting(true)}
              className="w-full py-3 rounded-xl"
            >
              <i className="ri-add-line mr-2" />
              공지 작성
            </Button>
          </div>
        )}

        {/* 공지 작성 폼 */}
        {isWriting && (
          <Card className="mb-6 p-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              새 공지사항 작성
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  제목
                </label>
                <input
                  type="text"
                  value={newNotice.title}
                  onChange={(e) =>
                    setNewNotice({ ...newNotice, title: e.target.value })
                  }
                  placeholder="공지사항 제목을 입력하세요"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  내용
                </label>
                <textarea
                  value={newNotice.content}
                  onChange={(e) =>
                    setNewNotice({ ...newNotice, content: e.target.value })
                  }
                  placeholder="공지사항 내용을 입력하세요"
                  rows={6}
                  maxLength={2000}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm resize-none bg-white"
                />
                <p className="text-xs text-gray-500 mt-1">
                  {newNotice.content.length}/2000자
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="important"
                  checked={newNotice.isImportant}
                  onChange={(e) =>
                    setNewNotice({
                      ...newNotice,
                      isImportant: e.target.checked,
                    })
                  }
                  className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
                />
                <label htmlFor="important" className="text-sm text-gray-700">
                  중요 공지로 설정
                </label>
              </div>

              <div className="grid grid-cols-2 gap-3 mt-6">
                <Button
                  onClick={handleWriteNotice}
                  className="py-3 rounded-xl"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      등록 중...
                    </>
                  ) : (
                    '공지사항 등록'
                  )}
                </Button>
                <Button
                  onClick={() => setIsWriting(false)}
                  variant="secondary"
                  className="py-3 rounded-xl"
                  disabled={isSubmitting}
                >
                  취소
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* 공지 단건 보기 */}
        {selectedNotice ? (
          <Card className="p-4">
            <div className="mb-4 flex justify-between items-center">
              <Button
                onClick={() => setSelectedNotice(null)}
                variant="secondary"
                size="sm"
                className="rounded-xl"
              >
                <i className="ri-arrow-left-line mr-2" />
                목록으로
              </Button>

              {/* 수정/삭제 버튼 (관리자만) */}
              {canAdmin() && (
                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    className="rounded-xl"
                    onClick={handleEditNotice}
                  >
                    <i className="ri-edit-line mr-1" />
                    수정
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    className="rounded-xl"
                    onClick={handleDeleteNotice}
                  >
                    <i className="ri-delete-bin-line mr-1" />
                    삭제
                  </Button>
                </div>
              )}
            </div>

            <div className="border-b border-gray-200 pb-4 mb-4">
              {selectedNotice.isImportant && (
                <span className="inline-block bg-red-100 text-red-600 text-xs px-3 py-1 rounded-full mb-3">
                  중요
                </span>
              )}
              <h2 className="text-xl font-bold text-gray-800 mb-3">
                {selectedNotice.title}
              </h2>
              <div className="text-sm text-gray-600 flex gap-2 flex-wrap">
                <span>작성자: {renderAuthor(selectedNotice.author)}</span>
                {selectedNotice.createdAt && (
                  <>
                    <span>•</span>
                    <span>
                      {new Date(selectedNotice.createdAt).toLocaleDateString(
                        'ko-KR'
                      )}
                    </span>
                  </>
                )}
              </div>
            </div>

            <div className="prose max-w-none">
              <div className="whitespace-pre-wrap text-gray-700 leading-relaxed text-sm">
                {selectedNotice.content}
              </div>
            </div>
          </Card>
        ) : (
          // 공지 목록
          <div className="space-y-4">
            {notices.length === 0 ? (
              <Card className="p-4 text-center text-gray-500">
                등록된 공지사항이 없습니다.
              </Card>
            ) : (
              notices.map((notice) => (
                <Card
                  key={notice.id}
                  className="p-4 hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => setSelectedNotice(notice)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 pr-3">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        {notice.isImportant && (
                          <span className="bg-red-100 text-red-600 text-xs px-2 py-1 rounded-full">
                            중요
                          </span>
                        )}
                      </div>
                      <h3 className="text-base font-semibold text-gray-800 mb-2 hover:text-blue-600 line-clamp-2">
                        {notice.title}
                      </h3>
                      <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600">
                        <span>작성자: {renderAuthor(notice.author)}</span>
                        <span>•</span>
                        <span>
                          {notice.createdAt
                            ? new Date(
                                notice.createdAt
                              ).toLocaleDateString('ko-KR')
                            : ''}
                        </span>
                      </div>
                    </div>
                    <i className="ri-arrow-right-s-line text-gray-400 text-xl flex-shrink-0" />
                  </div>
                </Card>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
