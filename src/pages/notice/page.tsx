
import { useState } from 'react';
import Card from '../../components/base/Card';
import Button from '../../components/base/Button';

export default function Notice() {
  const [selectedNotice, setSelectedNotice] = useState<any>(null);
  const [isWriting, setIsWriting] = useState(false);
  const [newNotice, setNewNotice] = useState({
    title: '',
    content: '',
    important: false
  });

  const notices = [
    {
      id: 1,
      title: '2024년 청소년부 겨울수련회 안내',
      content: `안녕하세요, 청소년부 여러분!

2024년 겨울수련회를 다음과 같이 안내드립니다.

📅 일시: 2024년 2월 10일(토) ~ 2월 12일(월) 2박 3일
📍 장소: 양평 청소년 수련원
💰 참가비: 15만원 (교통비, 숙박비, 식비 포함)
📝 신청기한: 1월 25일(목)까지

프로그램:
- 말씀 집회 (3회)
- 소그룹 나눔
- 레크리에이션
- 캠프파이어
- 새벽기도회

참가를 원하시는 분들은 교역자에게 신청해주세요.
많은 참여 부탁드립니다!`,
      author: '김목사',
      date: '2024.01.15',
      views: 45,
      important: true,
      category: '행사'
    },
    {
      id: 2,
      title: '1월 청소년부 예배 시간 변경 안내',
      content: `청소년부 예배 시간이 다음과 같이 변경됩니다.

변경 전: 주일 오후 2시
변경 후: 주일 오후 1시 30분

변경 사유: 겨울철 일몰 시간을 고려하여
적용 일자: 2024년 1월 21일부터

많은 양해 부탁드립니다.`,
      author: '이전도사',
      date: '2024.01.12',
      views: 32,
      important: false,
      category: '일반'
    },
    {
      id: 3,
      title: '청소년부 찬양팀 모집',
      content: `청소년부 찬양팀에서 새로운 멤버를 모집합니다.

모집 분야:
- 보컬 (남/여 불문)
- 기타 (일렉기타, 어쿠스틱기타)
- 베이스
- 드럼
- 키보드

자격 요건:
- 청소년부 소속
- 정기적인 연습 참여 가능
- 섬김의 마음

관심 있으신 분들은 찬양팀장에게 연락주세요!`,
      author: '박찬양',
      date: '2024.01.10',
      views: 28,
      important: false,
      category: '모집'
    }
  ];

  const handleWriteNotice = () => {
    if (newNotice.title && newNotice.content) {
      setIsWriting(false);
      setNewNotice({ title: '', content: '', important: false });
      alert('공지사항이 등록되었습니다.');
    } else {
      alert('제목과 내용을 모두 입력해주세요.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20 sm:pb-4">
      <div className="px-4 py-6">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <i className="ri-notification-line text-2xl text-white"></i>
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">공지사항</h1>
          <p className="text-gray-600">청소년부의 소식과 안내사항을 확인하세요</p>
        </div>

        {/* Write Button */}
        <div className="mb-6">
          <Button onClick={() => setIsWriting(true)} className="w-full py-3 rounded-xl">
            <i className="ri-add-line mr-2"></i>
            공지 작성
          </Button>
        </div>

        {isWriting && (
          <Card className="mb-6 p-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">새 공지사항 작성</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">제목</label>
                <input
                  type="text"
                  value={newNotice.title}
                  onChange={(e) => setNewNotice({...newNotice, title: e.target.value})}
                  placeholder="공지사항 제목을 입력하세요"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">내용</label>
                <textarea
                  value={newNotice.content}
                  onChange={(e) => setNewNotice({...newNotice, content: e.target.value})}
                  placeholder="공지사항 내용을 입력하세요"
                  rows={6}
                  maxLength={500}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm resize-none bg-white"
                />
                <p className="text-xs text-gray-500 mt-1">{newNotice.content.length}/500자</p>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="important"
                  checked={newNotice.important}
                  onChange={(e) => setNewNotice({...newNotice, important: e.target.checked})}
                  className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
                />
                <label htmlFor="important" className="text-sm text-gray-700">중요 공지로 설정</label>
              </div>

              <div className="grid grid-cols-2 gap-3 mt-6">
                <Button onClick={handleWriteNotice} className="py-3 rounded-xl">
                  공지사항 등록
                </Button>
                <Button onClick={() => setIsWriting(false)} variant="secondary" className="py-3 rounded-xl">
                  취소
                </Button>
              </div>
            </div>
          </Card>
        )}

        {selectedNotice ? (
          <Card className="p-4">
            <div className="mb-4">
              <Button onClick={() => setSelectedNotice(null)} variant="secondary" size="sm" className="rounded-xl">
                <i className="ri-arrow-left-line mr-2"></i>
                목록으로
              </Button>
            </div>
            
            <div className="border-b border-gray-200 pb-4 mb-4">
              <div className="mb-4">
                {selectedNotice.important && (
                  <span className="inline-block bg-red-100 text-red-600 text-xs px-3 py-1 rounded-full mb-3">
                    중요
                  </span>
                )}
                <h2 className="text-xl font-bold text-gray-800 mb-3">{selectedNotice.title}</h2>
              </div>
              
              <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600">
                <span>작성자: {selectedNotice.author}</span>
                <span>•</span>
                <span>{selectedNotice.date}</span>
                <span>•</span>
                <span>조회수: {selectedNotice.views}</span>
                <span className="bg-blue-100 text-blue-600 px-2 py-1 rounded-full text-xs">
                  {selectedNotice.category}
                </span>
              </div>
            </div>
            
            <div className="prose max-w-none">
              <div className="whitespace-pre-wrap text-gray-700 leading-relaxed text-sm">
                {selectedNotice.content}
              </div>
            </div>
          </Card>
        ) : (
          <div className="space-y-4">
            {notices.map((notice) => (
              <Card key={notice.id} className="p-4 hover:shadow-md transition-shadow cursor-pointer" onClick={() => setSelectedNotice(notice)}>
                <div className="flex items-start justify-between">
                  <div className="flex-1 pr-3">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      {notice.important && (
                        <span className="bg-red-100 text-red-600 text-xs px-2 py-1 rounded-full">
                          중요
                        </span>
                      )}
                      <span className="bg-blue-100 text-blue-600 text-xs px-2 py-1 rounded-full">
                        {notice.category}
                      </span>
                    </div>
                    <h3 className="text-base font-semibold text-gray-800 mb-2 hover:text-blue-600 line-clamp-2">
                      {notice.title}
                    </h3>
                    <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600">
                      <span>작성자: {notice.author}</span>
                      <span>•</span>
                      <span>{notice.date}</span>
                      <span>•</span>
                      <span>조회수: {notice.views}</span>
                    </div>
                  </div>
                  <i className="ri-arrow-right-s-line text-gray-400 text-xl flex-shrink-0"></i>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}