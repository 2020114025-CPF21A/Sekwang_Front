// src/pages/bulletin/Bulletin.tsx
import { useEffect, useMemo, useState } from 'react';
import Card from '../../components/base/Card';
import Button from '../../components/base/Button';
import { bulletinAPI } from '../../utils/api';

type BulletinItem = {
  bulletinNo: number;
  uploader?: string | null;
  title: string;
  publishDate: string; // ISO yyyy-MM-dd
  fileUrl: string;     // S3 URL (이미지 또는 PDF)
  views: number;
};

export default function Bulletin() {
  const [selected, setSelected] = useState<BulletinItem | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [items, setItems] = useState<BulletinItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  // 업로드 폼 상태
  const [form, setForm] = useState<{
    title: string;
    publishDate: string;
    file: File | null;
    previewUrl: string;
  }>({
    title: '',
    publishDate: '',
    file: null,
    previewUrl: '',
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

  // 목록 로드
  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await bulletinAPI.getAll(); // GET /api/bulletins
      const normalized: BulletinItem[] = (Array.isArray(data) ? data : []).map((b: any) => ({
        bulletinNo: Number(b.bulletinNo ?? b.id ?? 0),
        uploader: b.uploader ?? null,
        title: b.title ?? '',
        publishDate: b.publishDate ?? '',
        fileUrl: b.fileUrl ?? '',
        views: Number(b.views ?? 0),
      }));
      setItems(normalized);
    } catch (e: any) {
      console.error(e);
      setError(e?.message || '주보 목록을 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  // 상세 보기(조회수 증가 포함)
  const openDetail = async (no: number) => {
    try {
      const b = await bulletinAPI.getByNo(no); // GET /api/bulletins/{no} (조회수 +1)
      const normalized: BulletinItem = {
        bulletinNo: Number(b.bulletinNo ?? no),
        uploader: b.uploader ?? null,
        title: b.title ?? '',
        publishDate: b.publishDate ?? '',
        fileUrl: b.fileUrl ?? '',
        views: Number(b.views ?? 0),
      };
      setSelected(normalized);
      // 목록도 업데이트(조회수 반영)
      setItems((prev) =>
        prev.map((it) => (it.bulletinNo === normalized.bulletinNo ? normalized : it))
      );
    } catch (e: any) {
      console.error(e);
      alert(e?.message || '주보를 불러오지 못했습니다.');
    }
  };

  // 날짜 포맷
  const fmtDate = (s?: string) => {
    if (!s) return '';
    try {
      const d = new Date(s);
      return isNaN(d.getTime()) ? s : d.toLocaleDateString('ko-KR');
    } catch {
      return s || '';
    }
  };

  // 파일 선택/드래그
  const pickFile = (file: File | null) => {
    if (!file) {
      if (form.previewUrl) URL.revokeObjectURL(form.previewUrl);
      setForm((p) => ({ ...p, file: null, previewUrl: '' }));
      return;
    }
    // 이미지면 미리보기, PDF면 미리보기 생략
    const isImage = file.type.startsWith('image/');
    const preview = isImage ? URL.createObjectURL(file) : '';
    if (form.previewUrl) URL.revokeObjectURL(form.previewUrl);
    setForm((p) => ({ ...p, file, previewUrl: preview }));
  };

  const onInputFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    pickFile(e.target.files?.[0] || null);
  };

  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
    pickFile(e.dataTransfer.files?.[0] || null);
  };
  const onDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault(); e.stopPropagation(); setDragOver(true);
  };
  const onDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault(); e.stopPropagation(); setDragOver(false);
  };

  // 업로드
  const handleUpload = async () => {
    if (!user?.username) {
      alert('로그인이 필요합니다.');
      return;
    }
    if (!form.title.trim()) {
      alert('제목을 입력하세요.');
      return;
    }
    if (!form.publishDate) {
      alert('발행일을 선택하세요.');
      return;
    }
    if (!form.file) {
      alert('주보 파일을 선택하세요(이미지 또는 PDF).');
      return;
    }

    setUploading(true);
    setError(null);
    try {
      // POST /api/bulletins/upload (multipart)
      await bulletinAPI.upload(form.file, user.username, form.title.trim(), form.publishDate);
      setIsUploading(false);
      if (form.previewUrl) URL.revokeObjectURL(form.previewUrl);
      setForm({ title: '', publishDate: '', file: null, previewUrl: '' });
      await load();
      alert('주보가 업로드되었습니다.');
    } catch (e: any) {
      console.error(e);
      setError(e?.message || '업로드에 실패했습니다.');
      alert('업로드에 실패했습니다.');
    } finally {
      setUploading(false);
    }
  };

  // 통계(간단 합산)
  const total = items.length;
  const totalViews = items.reduce((sum, it) => sum + (it.views || 0), 0);

  // 파일 타입
  const isImageUrl = (url: string) =>
    url.match(/\.(png|jpe?g|gif|webp|bmp|svg)(\?.*)?$/i) != null;

  return (
    <div className="min-h-screen bg-gray-50 pb-20 sm:pb-4">
      <div className="max-w-5xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <i className="ri-newspaper-line text-2xl text-white"></i>
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">청소년부 주보</h1>
          <p className="text-gray-600">매주 발행되는 청소년부 주보를 확인하세요</p>
        </div>

        {/* Upload Button */}
        <div className="mb-6">
          <Button onClick={() => setIsUploading(true)} className="w-full py-3 rounded-xl">
            <i className="ri-upload-line mr-2"></i>
            주보 업로드
          </Button>
        </div>

        {/* Upload Modal */}
        {isUploading && (
          <Card className="mb-6 p-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">주보 업로드</h3>
            {!user && (
              <div className="p-3 mb-3 rounded-lg bg-yellow-50 text-yellow-700 text-sm">
                업로드에는 로그인이 필요합니다.
              </div>
            )}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">주보 제목</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                  placeholder="예: 2025년 10월 2주차 청소년부 주보"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">발행일</label>
                <input
                  type="date"
                  value={form.publishDate}
                  onChange={(e) => setForm((p) => ({ ...p, publishDate: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white"
                />
              </div>

              {/* 드래그&드롭 영역 */}
              <div
                onDrop={onDrop}
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors ${
                  dragOver ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-white'
                }`}
              >
                {form.file ? (
                  <div className="space-y-3">
                    {form.previewUrl ? (
                      <img
                        src={form.previewUrl}
                        alt="미리보기"
                        className="mx-auto max-h-64 rounded-lg object-contain"
                      />
                    ) : (
                      <div className="text-sm text-gray-600">
                        <i className="ri-file-pdf-2-line text-2xl mr-1"></i>
                        PDF 파일이 선택되었습니다: {form.file.name}
                      </div>
                    )}
                    <div className="flex gap-2 justify-center">
                      <label className="inline-flex">
                        <input type="file" accept="image/*,application/pdf" className="hidden" onChange={onInputFile} />
                        <span className="px-4 py-2 rounded-xl border text-sm cursor-pointer">
                          다른 파일 선택
                        </span>
                      </label>
                      <Button
                        variant="secondary"
                        size="sm"
                        className="rounded-xl"
                        onClick={() => pickFile(null)}
                      >
                        파일 제거
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <i className="ri-file-upload-line text-3xl text-gray-400 mb-1" />
                    <p className="text-gray-600 text-sm">이미지 또는 PDF 파일을 드래그하거나 클릭해서 업로드</p>
                    <p className="text-sm text-gray-500">최대 10MB</p>
                    <label className="inline-flex mt-2">
                      <input
                        type="file"
                        accept="image/*,application/pdf"
                        className="hidden"
                        onChange={onInputFile}
                      />
                      <span className="px-4 py-2 rounded-xl border text-sm cursor-pointer">
                        파일 선택
                      </span>
                    </label>
                  </div>
                )}
              </div>

              {error && (
                <div className="p-3 rounded-lg bg-red-50 text-red-600 text-sm">{error}</div>
              )}

              <div className="grid grid-cols-2 gap-3 mt-6">
                <Button onClick={handleUpload} className="py-3 rounded-xl" disabled={uploading || !user}>
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
                    pickFile(null);
                    setForm((p) => ({ ...p, title: '', publishDate: '' }));
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

        {/* 상세 보기 */}
        {selected ? (
          <Card className="p-4">
            <div className="mb-4">
              <Button
                onClick={() => setSelected(null)}
                variant="secondary"
                size="sm"
                className="rounded-xl"
              >
                <i className="ri-arrow-left-line mr-2"></i>
                목록으로
              </Button>
            </div>

            <div className="text-center">
              <h2 className="text-xl font-bold text-gray-800 mb-2">{selected.title}</h2>
              <p className="text-gray-600 mb-4">발행일: {fmtDate(selected.publishDate)}</p>

              <div className="mb-6">
                {isImageUrl(selected.fileUrl) ? (
                  <img
                    src={selected.fileUrl}
                    alt={selected.title}
                    className="w-full max-w-sm mx-auto rounded-xl shadow-lg"
                  />
                ) : (
                  <div className="p-6 border rounded-xl bg-gray-50 inline-flex items-center gap-3">
                    <i className="ri-file-pdf-2-line text-3xl text-red-500" />
                    <div className="text-left">
                      <div className="font-medium text-gray-800">PDF 파일</div>
                      <div className="text-sm text-gray-500 break-all">{selected.fileUrl}</div>
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 gap-3 mb-4">
                <Button onClick={() => window.open(selected.fileUrl, '_blank')} className="py-3 rounded-xl">
                  <i className="ri-download-line mr-2"></i>
                  파일 열기/다운로드
                </Button>
              </div>

              <p className="text-sm text-gray-500">조회수: {selected.views}</p>
            </div>
          </Card>
        ) : (
          // 목록
          <div className="space-y-4">
            {loading ? (
              <Card className="p-6 text-center text-gray-500">불러오는 중...</Card>
            ) : items.length === 0 ? (
              <Card className="p-6 text-center text-gray-500">등록된 주보가 없습니다.</Card>
            ) : (
              items.map((b) => (
                <Card
                  key={b.bulletinNo}
                  className="p-4 hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => openDetail(b.bulletinNo)}
                >
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                      {isImageUrl(b.fileUrl) ? (
                        <img
                          src={b.fileUrl}
                          alt={b.title}
                          className="w-20 h-28 object-cover object-top rounded-lg"
                        />
                      ) : (
                        <div className="w-20 h-28 rounded-lg border flex items-center justify-center bg-white">
                          <i className="ri-file-pdf-2-line text-2xl text-red-500" />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-800 mb-2 line-clamp-2 text-sm">
                        {b.title}
                      </h3>

                      <div className="flex justify-between items-center text-sm text-gray-600 mb-3">
                        <span>{fmtDate(b.publishDate)}</span>
                        <span>조회수: {b.views}</span>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <Button size="sm" className="py-2 rounded-lg text-xs">
                          <i className="ri-eye-line mr-1"></i>
                          보기
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={(e) => {
                            e.stopPropagation();
                            window.open(b.fileUrl, '_blank');
                          }}
                          className="py-2 rounded-lg text-xs"
                        >
                          <i className="ri-download-line mr-1"></i>
                          다운로드
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        )}

        {/* 간단 통계 */}
        <Card className="mt-6 p-4">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">주보 현황</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <i className="ri-newspaper-line text-xl text-blue-600"></i>
              </div>
              <p className="text-xl font-bold text-blue-600">{total}</p>
              <p className="text-xs text-gray-600">총 주보 수</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <i className="ri-eye-line text-xl text-purple-600"></i>
              </div>
              <p className="text-xl font-bold text-purple-600">{totalViews}</p>
              <p className="text-xs text-gray-600">총 조회수</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
