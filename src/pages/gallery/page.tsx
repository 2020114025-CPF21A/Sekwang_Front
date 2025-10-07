import { useEffect, useMemo, useRef, useState } from 'react';
import Card from '../../components/base/Card';
import Button from '../../components/base/Button';
import { galleryAPI } from '../../utils/api';

type GalleryItem = {
  id: number;
  title: string;
  category: string;
  description?: string;
  fileUrl: string;     // S3 URL
  uploader?: string;   // 서버에서 username 문자열로 내려옴
  createdAt?: string;
  likes?: number;
};

export default function Gallery() {
  const [selectedCategory, setSelectedCategory] = useState('전체');
  const [selectedImage, setSelectedImage] = useState<GalleryItem | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // 업로드 폼 상태
  const [form, setForm] = useState({
    title: '',
    category: '예배',
    description: '',
    fileObj: null as File | null,
    filePreview: '' as string,
  });

  // 로그인 사용자
  const user = useMemo(() => {
    try {
      const raw = localStorage.getItem('user');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }, []);

  const categories = ['전체', '예배', '수련회', '봉사활동', '친교', '기타'];

  // 목록 로드
  const loadItems = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await galleryAPI.getAll();
      const normalized: GalleryItem[] = (Array.isArray(data) ? data : []).map((it: any) => ({
        id: Number(it.id ?? 0),
        title: it.title ?? '',
        category: it.category ?? '기타',
        description: it.description ?? '',
        fileUrl: it.fileUrl ?? '',
        uploader: typeof it.uploader === 'string' ? it.uploader : (it.uploader?.username ?? ''),
        createdAt: it.createdAt ?? '',
        likes: Number(it.likes ?? 0),
      }));
      setItems(normalized.filter((x) => x.fileUrl));
    } catch (e) {
      console.error('Failed to fetch gallery:', e);
      setError('사진 목록을 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadItems();
  }, []);

  const filtered =
    selectedCategory === '전체'
      ? items
      : items.filter((p) => p.category === selectedCategory);

  // 날짜 포맷
  const fmtDate = (s?: string) => {
    if (!s) return '';
    try {
      const d = new Date(s);
      if (isNaN(d.getTime())) return s;
      return d.toLocaleDateString('ko-KR');
    } catch {
      return s;
    }
  };

  // 파일 선택 (수동 업로드용)
  const onPickFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] || null;
    if (!f) {
      setForm((prev) => ({ ...prev, fileObj: null, filePreview: '' }));
      return;
    }
    const preview = URL.createObjectURL(f);
    setForm((prev) => ({ ...prev, fileObj: f, filePreview: preview }));
  };

  // 공용 업로드 함수 (드롭/버튼 모두 사용)
  const uploadFile = async (file: File, title: string, category: string, description: string) => {
    if (!user?.username) {
      alert('로그인이 필요합니다.');
      return;
    }
    setUploading(true);
    setError(null);
    try {
      await galleryAPI.upload(file, title, category, description, user.username);
      await loadItems();
      alert('사진이 업로드되었습니다.');
    } catch (e) {
      console.error('Upload failed:', e);
      setError('업로드에 실패했습니다.');
      alert('업로드에 실패했습니다.');
    } finally {
      setUploading(false);
    }
  };

  // 드래그 앤 드롭 핸들러
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!dragActive) setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (dragActive) setDragActive(false);
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = e.dataTransfer.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    // 미리보기 업데이트
    const preview = URL.createObjectURL(file);
    setForm((prev) => ({ ...prev, fileObj: file, filePreview: preview }));

    // 제목 비어있으면 파일명으로 자동 지정 (확장자 제거)
    const autoTitle =
      form.title.trim() ||
      (file.name.includes('.') ? file.name.replace(/\.[^/.]+$/, '') : file.name);

    // 곧바로 업로드 (요청사항)
    await uploadFile(file, autoTitle, form.category, form.description);

    // 미리보기 URL 정리 및 폼 리셋
    URL.revokeObjectURL(preview);
    setForm({ title: '', category: form.category, description: '', fileObj: null, filePreview: '' });
    setIsUploading(false);
  };

  // 수동 업로드 버튼
  const handleUploadClick = async () => {
    if (!form.fileObj) {
      alert('이미지 파일을 선택하거나 드래그해서 올려주세요.');
      return;
    }
    const title = form.title.trim() || (form.fileObj.name.includes('.') ? form.fileObj.name.replace(/\.[^/.]+$/, '') : form.fileObj.name);
    await uploadFile(form.fileObj, title, form.category, form.description);
    if (form.filePreview) URL.revokeObjectURL(form.filePreview);
    setForm({ title: '', category: '예배', description: '', fileObj: null, filePreview: '' });
    setIsUploading(false);
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

        {/* Upload Modal (드래그 앤 드롭 + 버튼 업로드) */}
        {isUploading && (
          <Card className="mb-6 p-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">사진 업로드</h3>
            {!user && (
              <div className="p-3 mb-3 rounded-lg bg-yellow-50 text-yellow-700 text-sm">
                업로드에는 로그인이 필요합니다.
              </div>
            )}

            {/* 드래그 앤 드롭 존 */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`relative w-full rounded-2xl border-2 border-dashed p-6 transition-colors ${
                dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-white'
              }`}
            >
              <div className="flex flex-col items-center justify-center text-center space-y-2">
                <i className="ri-upload-cloud-2-line text-3xl text-gray-400" />
                <p className="text-sm text-gray-600">
                  이 박스 위로 이미지를 <span className="font-semibold">드래그 & 드롭</span> 하면
                  즉시 업로드됩니다.
                </p>
                <p className="text-xs text-gray-400">또는</p>
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  variant="secondary"
                  size="sm"
                  className="rounded-xl"
                >
                  파일 선택
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={onPickFile}
                  className="hidden"
                />
              </div>
            </div>

            {/* 수동 업로드 폼 */}
            <div className="space-y-4 mt-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">사진 제목</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="사진 제목을 입력하세요 (미입력 시 파일명으로 저장)"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">카테고리</label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm pr-8 bg-white"
                  >
                    {['예배', '수련회', '봉사활동', '친교', '기타'].map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">선택한 이미지</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={form.fileObj?.name ?? ''}
                      placeholder="선택된 파일 없음"
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 text-sm"
                    />
                    <Button
                      onClick={() => fileInputRef.current?.click()}
                      variant="secondary"
                      size="sm"
                      className="rounded-xl"
                    >
                      찾기
                    </Button>
                  </div>
                  {form.filePreview && (
                    <img
                      src={form.filePreview}
                      alt="preview"
                      className="mt-3 h-32 w-full object-cover rounded-lg"
                    />
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">설명</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="사진에 대한 설명을 입력하세요"
                  rows={3}
                  maxLength={500}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm resize-none bg-white"
                />
              </div>

              {error && (
                <div className="p-3 rounded-lg bg-red-50 text-red-600 text-sm">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3 mt-6">
                <Button
                  onClick={handleUploadClick}
                  className="py-3 rounded-xl"
                  disabled={uploading || !user}
                >
                  {uploading ? (
                    <span className="inline-flex items-center">
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      업로드 중...
                    </span>
                  ) : (
                    '업로드'
                  )}
                </Button>
                <Button
                  onClick={() => {
                    setIsUploading(false);
                    if (form.filePreview) URL.revokeObjectURL(form.filePreview);
                    setForm({ title: '', category: '예배', description: '', fileObj: null, filePreview: '' });
                  }}
                  variant="secondary"
                  className="py-3 rounded-xl"
                  disabled={uploading}
                >
                  취소
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Category Filter */}
        <div className="mb-6">
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
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
          {loading ? (
            <Card className="p-6 text-center text-gray-500">불러오는 중...</Card>
          ) : items.length === 0 ? (
            <Card className="p-6 text-center text-gray-500">등록된 사진이 없습니다.</Card>
          ) : filtered.length === 0 ? (
            <Card className="p-6 text-center text-gray-500">해당 카테고리의 사진이 없습니다.</Card>
          ) : (
            filtered.map((photo) => (
              <Card
                key={photo.id}
                className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => setSelectedImage(photo)}
              >
                <div className="mb-3">
                  <img
                    src={photo.fileUrl}
                    alt={photo.title}
                    className="w-full h-48 object-cover object-center rounded-t-xl"
                    loading="lazy"
                  />
                </div>
                <div className="p-3 space-y-2">
                  <div className="flex justify-between items-start">
                    <h3 className="font-semibold text-gray-800 text-sm line-clamp-1">{photo.title}</h3>
                    <span className="bg-blue-100 text-blue-600 text-xs px-2 py-1 rounded-full whitespace-nowrap">
                      {photo.category}
                    </span>
                  </div>
                  {photo.description && (
                    <p className="text-sm text-gray-600 line-clamp-2">{photo.description}</p>
                  )}
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-500">{fmtDate(photo.createdAt)}</span>
                    <div className="flex items-center space-x-1 text-red-500">
                      <i className="ri-heart-line text-sm"></i>
                      <span className="text-xs">{photo.likes ?? 0}</span>
                    </div>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>

        {/* Image Modal */}
        {selectedImage && (
          <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-lg w-full max-h-full overflow-auto">
              <div className="p-4">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-gray-800">{selectedImage.title}</h3>
                    <p className="text-gray-600 text-sm">{fmtDate(selectedImage.createdAt)}</p>
                  </div>
                <button
                    onClick={() => setSelectedImage(null)}
                    className="text-gray-400 hover:text-gray-600 cursor-pointer"
                  >
                    <i className="ri-close-line text-2xl"></i>
                  </button>
                </div>

                <img
                  src={selectedImage.fileUrl}
                  alt={selectedImage.title}
                  className="w-full max-h-64 object-cover object-center rounded-xl mb-4"
                />

                {selectedImage.description && (
                  <p className="text-gray-700 mb-4 text-sm">{selectedImage.description}</p>
                )}

                <div className="flex justify-between items-center">
                  <span className="bg-blue-100 text-blue-600 text-sm px-3 py-1 rounded-full">
                    {selectedImage.category}
                  </span>
                  <div className="flex items-center space-x-4">
                    <button className="flex items-center space-x-1 text-red-500 hover:text-red-600 cursor-pointer">
                      <i className="ri-heart-line"></i>
                      <span className="text-sm">{selectedImage.likes ?? 0}</span>
                    </button>
                    <a
                      className="flex items-center space-x-1 text-blue-500 hover:text-blue-600 cursor-pointer"
                      href={selectedImage.fileUrl}
                      download
                      target="_blank"
                      rel="noreferrer"
                    >
                      <i className="ri-download-line"></i>
                      <span className="text-sm">다운로드</span>
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {error && !isUploading && (
          <div className="mt-4 p-3 rounded-lg bg-red-50 text-red-600 text-sm">{error}</div>
        )}
      </div>
    </div>
  );
}
