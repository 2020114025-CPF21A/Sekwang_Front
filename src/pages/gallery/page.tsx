
import { useState } from 'react';
import Card from '../../components/base/Card';
import Button from '../../components/base/Button';

export default function Gallery() {
  const [selectedCategory, setSelectedCategory] = useState('전체');
  const [selectedImage, setSelectedImage] = useState<any>(null);
  const [isUploading, setIsUploading] = useState(false);

  const categories = ['전체', '예배', '수련회', '봉사활동', '친교', '기타'];

  const photos = [
    {
      id: 1,
      title: '2024 신년 예배',
      category: '예배',
      date: '2024.01.07',
      image: 'https://readdy.ai/api/search-image?query=Korean%20church%20youth%20worship%20service%20with%20teenagers%20praying%20and%20singing%20together%20in%20modern%20church%20sanctuary%20with%20warm%20lighting%20and%20contemporary%20design&width=400&height=300&seq=1&orientation=landscape',
      description: '새해 첫 주일 청소년부 예배 모습입니다.',
      likes: 15
    },
    {
      id: 2,
      title: '겨울 수련회 준비',
      category: '수련회',
      date: '2024.01.10',
      image: 'https://readdy.ai/api/search-image?query=Korean%20teenagers%20preparing%20for%20winter%20church%20retreat%20with%20luggage%20and%20excited%20expressions%20in%20church%20hall%20with%20banners%20and%20preparation%20materials&width=400&height=300&seq=2&orientation=landscape',
      description: '겨울 수련회를 준비하는 청소년들의 모습',
      likes: 23
    },
    {
      id: 3,
      title: '지역 봉사활동',
      category: '봉사활동',
      date: '2024.01.13',
      image: 'https://readdy.ai/api/search-image?query=Korean%20church%20youth%20volunteers%20doing%20community%20service%20helping%20elderly%20people%20with%20warm%20smiles%20and%20caring%20gestures%20in%20bright%20outdoor%20setting&width=400&height=300&seq=3&orientation=landscape',
      description: '지역 어르신들을 위한 봉사활동',
      likes: 18
    },
    {
      id: 4,
      title: '찬양팀 연습',
      category: '예배',
      date: '2024.01.14',
      image: 'https://readdy.ai/api/search-image?query=Korean%20church%20youth%20praise%20team%20practicing%20with%20guitars%20keyboards%20and%20microphones%20in%20modern%20church%20music%20room%20with%20instruments%20and%20sound%20equipment&width=400&height=300&seq=4&orientation=landscape',
      description: '주일 예배를 위한 찬양팀 연습 시간',
      likes: 12
    },
    {
      id: 5,
      title: '친교 시간',
      category: '친교',
      date: '2024.01.15',
      image: 'https://readdy.ai/api/search-image?query=Korean%20church%20teenagers%20having%20fellowship%20time%20eating%20snacks%20and%20laughing%20together%20in%20bright%20church%20fellowship%20hall%20with%20tables%20and%20chairs&width=400&height=300&seq=5&orientation=landscape',
      description: '예배 후 함께하는 즐거운 친교 시간',
      likes: 20
    },
    {
      id: 6,
      title: '성경공부 모임',
      category: '기타',
      date: '2024.01.16',
      image: 'https://readdy.ai/api/search-image?query=Korean%20church%20youth%20bible%20study%20group%20sitting%20in%20circle%20with%20open%20bibles%20and%20notebooks%20discussing%20scripture%20in%20cozy%20church%20classroom%20setting&width=400&height=300&seq=6&orientation=landscape',
      description: '매주 화요일 성경공부 모임',
      likes: 14
    }
  ];

  const filteredPhotos = selectedCategory === '전체' 
    ? photos 
    : photos.filter(photo => photo.category === selectedCategory);

  const handleUpload = () => {
    setIsUploading(true);
    setTimeout(() => {
      setIsUploading(false);
      alert('사진이 업로드되었습니다.');
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20 sm:pb-4">
      <div className="px-4 py-6">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-pink-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <i className="ri-image-line text-2xl text-white"></i>
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">사진첩</h1>
          <p className="text-gray-600">청소년부의 소중한 추억들을 함께 나누어요</p>
        </div>

        {/* Upload Button */}
        <div className="mb-6">
          <Button onClick={() => setIsUploading(true)} className="w-full py-3 rounded-xl">
            <i className="ri-upload-line mr-2"></i>
            사진 업로드
          </Button>
        </div>

        {/* Upload Modal */}
        {isUploading && (
          <Card className="mb-6 p-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">사진 업로드</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">사진 제목</label>
                <input
                  type="text"
                  placeholder="사진 제목을 입력하세요"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">카테고리</label>
                <select className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm pr-8 bg-white">
                  {categories.slice(1).map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">사진 파일</label>
                <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center">
                  <i className="ri-image-add-line text-3xl text-gray-400 mb-2"></i>
                  <p className="text-gray-600 text-sm">사진을 드래그하거나 클릭하여 업로드하세요</p>
                  <input type="file" multiple accept="image/*" className="hidden" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">설명</label>
                <textarea
                  placeholder="사진에 대한 설명을 입력하세요"
                  rows={3}
                  maxLength={500}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm resize-none bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 mt-6">
                <Button onClick={handleUpload} className="py-3 rounded-xl">
                  업로드
                </Button>
                <Button onClick={() => setIsUploading(false)} variant="secondary" className="py-3 rounded-xl">
                  취소
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Category Filter */}
        <div className="mb-6">
          <div className="flex flex-wrap gap-2">
            {categories.map(category => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors cursor-pointer whitespace-nowrap ${
                  selectedCategory === category
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-600 hover:bg-blue-50 hover:text-blue-600 border border-gray-200'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* Photo Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {filteredPhotos.map(photo => (
            <Card key={photo.id} className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setSelectedImage(photo)}>
              <div className="aspect-w-4 aspect-h-3 mb-3">
                <img
                  src={photo.image}
                  alt={photo.title}
                  className="w-full h-48 object-cover object-top rounded-t-xl"
                />
              </div>
              <div className="p-3 space-y-2">
                <div className="flex justify-between items-start">
                  <h3 className="font-semibold text-gray-800 text-sm line-clamp-1">{photo.title}</h3>
                  <span className="bg-blue-100 text-blue-600 text-xs px-2 py-1 rounded-full whitespace-nowrap">
                    {photo.category}
                  </span>
                </div>
                <p className="text-sm text-gray-600 line-clamp-2">{photo.description}</p>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-500">{photo.date}</span>
                  <div className="flex items-center space-x-1 text-red-500">
                    <i className="ri-heart-line text-sm"></i>
                    <span className="text-xs">{photo.likes}</span>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Image Modal */}
        {selectedImage && (
          <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-lg w-full max-h-full overflow-auto">
              <div className="p-4">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-gray-800">{selectedImage.title}</h3>
                    <p className="text-gray-600 text-sm">{selectedImage.date}</p>
                  </div>
                  <button
                    onClick={() => setSelectedImage(null)}
                    className="text-gray-400 hover:text-gray-600 cursor-pointer"
                  >
                    <i className="ri-close-line text-2xl"></i>
                  </button>
                </div>
                
                <img
                  src={selectedImage.image}
                  alt={selectedImage.title}
                  className="w-full max-h-64 object-cover object-top rounded-xl mb-4"
                />
                
                <p className="text-gray-700 mb-4 text-sm">{selectedImage.description}</p>
                
                <div className="flex justify-between items-center">
                  <span className="bg-blue-100 text-blue-600 text-sm px-3 py-1 rounded-full">
                    {selectedImage.category}
                  </span>
                  <div className="flex items-center space-x-4">
                    <button className="flex items-center space-x-1 text-red-500 hover:text-red-600 cursor-pointer">
                      <i className="ri-heart-line"></i>
                      <span className="text-sm">{selectedImage.likes}</span>
                    </button>
                    <button className="flex items-center space-x-1 text-blue-500 hover:text-blue-600 cursor-pointer">
                      <i className="ri-share-line"></i>
                      <span className="text-sm">공유</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}