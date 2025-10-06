
import { useState } from 'react';
import Card from '../../components/base/Card';
import Button from '../../components/base/Button';

export default function Diary() {
  const [selectedDiary, setSelectedDiary] = useState<any>(null);
  const [isWriting, setIsWriting] = useState(false);
  const [newDiary, setNewDiary] = useState({
    title: '',
    content: '',
    mood: '😊',
    weather: '☀️'
  });

  const moods = ['😊', '😢', '😍', '😴', '😤', '🤔', '😇', '🥳'];
  const weathers = ['☀️', '⛅', '☁️', '🌧️', '⛈️', '❄️', '🌈', '🌙'];

  const diaries = [
    {
      id: 1,
      title: '새해 첫 예배',
      content: `오늘은 2024년 첫 주일이었다. 새해 첫 예배라서 그런지 마음이 설렜다. 목사님께서 새해 계획에 대해 말씀해주셨는데, 특히 하나님과의 관계를 더욱 깊게 하라는 말씀이 마음에 와닿았다.

올해는 정말 큐티를 꾸준히 하고, 기도생활도 더 열심히 해야겠다. 그리고 친구들과도 더 좋은 관계를 만들어가고 싶다.

찬양 시간에 부른 '주님의 사랑'이라는 찬양이 정말 좋았다. 가사 하나하나가 마음에 스며들었다.`,
      date: '2024.01.07',
      mood: '😊',
      weather: '☀️',
      views: 12
    },
    {
      id: 2,
      title: '친구와의 갈등',
      content: `오늘 친구와 작은 다툼이 있었다. 사소한 일이었는데 서로 감정이 상해서 말다툼까지 했다. 집에 와서 생각해보니 내가 너무 고집을 부린 것 같다.

성경에서 '화를 내어도 죄를 짓지 말며'라는 말씀이 생각났다. 내일 친구에게 먼저 사과해야겠다. 하나님께서 우리를 용서해주시는 것처럼, 나도 친구를 용서하고 먼저 화해의 손을 내밀어야겠다.`,
      date: '2024.01.10',
      mood: '😢',
      weather: '☁️',
      views: 8
    },
    {
      id: 3,
      title: '봉사활동 후기',
      content: `오늘은 청소년부에서 지역 복지관에 봉사활동을 갔다. 처음에는 조금 부담스러웠는데, 막상 가보니 정말 보람찬 시간이었다.

할머니, 할아버지들께서 우리를 보시고 정말 좋아하셨다. 함께 이야기도 나누고, 간단한 게임도 했다. 한 할머니께서 "젊은 친구들이 와주니 정말 고맙다"고 하시면서 손을 꼭 잡아주셨는데, 그 순간 정말 감동받았다.

예수님께서 말씀하신 '섬김'의 의미를 조금이나마 깨달은 것 같다.`,
      date: '2024.01.13',
      mood: '😇',
      weather: '🌈',
      views: 15
    }
  ];

  const handleWriteDiary = () => {
    if (newDiary.title && newDiary.content) {
      setIsWriting(false);
      setNewDiary({ title: '', content: '', mood: '😊', weather: '☀️' });
      alert('일지가 저장되었습니다.');
    } else {
      alert('제목과 내용을 모두 입력해주세요.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20 sm:pb-4">
      <div className="px-4 py-6">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-orange-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <i className="ri-file-text-line text-2xl text-white"></i>
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">신앙 일지</h1>
          <p className="text-gray-600">하나님과 함께한 일상을 기록해보세요</p>
        </div>

        {/* Write Button */}
        <div className="mb-6">
          <Button onClick={() => setIsWriting(true)} className="w-full py-3 rounded-xl">
            <i className="ri-add-line mr-2"></i>
            일지 작성
          </Button>
        </div>

        {isWriting && (
          <Card className="mb-6 p-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">새 일지 작성</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">오늘의 기분</label>
                  <div className="grid grid-cols-4 gap-2">
                    {moods.map(mood => (
                      <button
                        key={mood}
                        onClick={() => setNewDiary({...newDiary, mood})}
                        className={`w-full aspect-square text-2xl rounded-xl border-2 transition-colors cursor-pointer ${
                          newDiary.mood === mood ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-300'
                        }`}
                      >
                        {mood}
                      </button>
                    ))}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">오늘의 날씨</label>
                  <div className="grid grid-cols-4 gap-2">
                    {weathers.map(weather => (
                      <button
                        key={weather}
                        onClick={() => setNewDiary({...newDiary, weather})}
                        className={`w-full aspect-square text-2xl rounded-xl border-2 transition-colors cursor-pointer ${
                          newDiary.weather === weather ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-300'
                        }`}
                      >
                        {weather}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">제목</label>
                <input
                  type="text"
                  value={newDiary.title}
                  onChange={(e) => setNewDiary({...newDiary, title: e.target.value})}
                  placeholder="오늘의 일지 제목을 입력하세요"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">내용</label>
                <textarea
                  value={newDiary.content}
                  onChange={(e) => setNewDiary({...newDiary, content: e.target.value})}
                  placeholder="오늘 하나님과 함께한 일상을 기록해보세요..."
                  rows={8}
                  maxLength={500}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm resize-none bg-white"
                />
                <p className="text-xs text-gray-500 mt-1">{newDiary.content.length}/500자</p>
              </div>

              <div className="grid grid-cols-2 gap-3 mt-6">
                <Button onClick={handleWriteDiary} className="py-3 rounded-xl">
                  일지 저장하기
                </Button>
                <Button onClick={() => setIsWriting(false)} variant="secondary" className="py-3 rounded-xl">
                  취소
                </Button>
              </div>
            </div>
          </Card>
        )}

        {selectedDiary ? (
          <Card className="p-4">
            <div className="mb-4">
              <Button onClick={() => setSelectedDiary(null)} variant="secondary" size="sm" className="rounded-xl">
                <i className="ri-arrow-left-line mr-2"></i>
                목록으로
              </Button>
            </div>
            
            <div className="border-b border-gray-200 pb-4 mb-4">
              <div className="flex items-center space-x-3 mb-3">
                <span className="text-3xl">{selectedDiary.mood}</span>
                <span className="text-3xl">{selectedDiary.weather}</span>
              </div>
              <h2 className="text-xl font-bold text-gray-800 mb-3">{selectedDiary.title}</h2>
              
              <div className="flex items-center space-x-4 text-sm text-gray-600">
                <span>작성일: {selectedDiary.date}</span>
                <span>조회수: {selectedDiary.views}</span>
              </div>
            </div>
            
            <div className="prose max-w-none">
              <div className="whitespace-pre-wrap text-gray-700 leading-relaxed text-sm">
                {selectedDiary.content}
              </div>
            </div>
          </Card>
        ) : (
          <div className="space-y-4">
            {diaries.map((diary) => (
              <Card key={diary.id} className="p-4 hover:shadow-md transition-shadow cursor-pointer" onClick={() => setSelectedDiary(diary)}>
                <div className="flex items-start justify-between">
                  <div className="flex-1 pr-3">
                    <div className="flex items-center space-x-3 mb-3">
                      <span className="text-2xl">{diary.mood}</span>
                      <span className="text-2xl">{diary.weather}</span>
                      <h3 className="text-base font-semibold text-gray-800 hover:text-blue-600 line-clamp-1">
                        {diary.title}
                      </h3>
                    </div>
                    <p className="text-gray-600 mb-3 line-clamp-2 text-sm">
                      {diary.content.substring(0, 100)}...
                    </p>
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <span>{diary.date}</span>
                      <span>조회수: {diary.views}</span>
                    </div>
                  </div>
                  <i className="ri-arrow-right-s-line text-gray-400 text-xl flex-shrink-0"></i>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Monthly Summary */}
        <Card className="mt-6 p-4">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">이번 달 일지 현황</h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <i className="ri-file-text-line text-xl text-blue-600"></i>
              </div>
              <p className="text-xl font-bold text-blue-600">12</p>
              <p className="text-xs text-gray-600">작성한 일지</p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <i className="ri-calendar-check-line text-xl text-green-600"></i>
              </div>
              <p className="text-xl font-bold text-green-600">18</p>
              <p className="text-xs text-gray-600">연속 작성일</p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <span className="text-xl">😊</span>
              </div>
              <p className="text-base font-bold text-purple-600">행복</p>
              <p className="text-xs text-gray-600">주요 기분</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}