// src/pages/songs/Song.tsx  (원하는 경로/파일명에 배치)
import { useEffect, useMemo, useState } from 'react';
import Card from '../../components/base/Card';
import Button from '../../components/base/Button';
import { songAPI } from '../../utils/api';

type SongItem = {
  id: number;
  uploader?: string;
  title: string;
  artist?: string;
  imageUrl?: string;
  category: string;
  musicalKey?: string;
  tempoBpm?: number;
  createdAt?: string;
};

const CATEGORIES = ['전체', '찬양', '경배', '복음성가', 'CCM', '기타'];
const KEYS = ['C','Db','D','Eb','E','F','Gb','G','Ab','A','Bb','B'];

export default function Song() {
  const [items, setItems] = useState<SongItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('전체');
  const [selectedImage, setSelectedImage] = useState<string | null>(null); // ✅ 전체보기용 이미지 상태
  const [isUploading, setIsUploading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    title: '',
    artist: '',
    category: '찬양',
    musicalKey: 'C',
    tempoBpm: '120',
    file: null as File | null,
    preview: '' as string,
  });

  const user = useMemo(() => {
    try {
      const raw = localStorage.getItem('user');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }, []);

  const loadSongs = async () => {
    try {
      const data = await songAPI.getAll();
      const normalized: SongItem[] = (Array.isArray(data) ? data : []).map((it: any) => ({
        id: Number(it.id ?? 0),
        uploader: it.uploader ?? '',
        title: it.title ?? '',
        artist: it.artist ?? '',
        imageUrl: it.imageUrl ?? '',
        category: it.category ?? '기타',
        musicalKey: it.musicalKey ?? '',
        tempoBpm: Number(it.tempoBpm ?? 0),
        createdAt: it.createdAt ?? '',
      }));
      setItems(normalized);
    } catch (e) {
      console.error(e);
      setError('악보 목록을 불러오지 못했습니다.');
    }
  };

  useEffect(() => {
    loadSongs();
  }, []);

  const filtered =
    selectedCategory === '전체'
      ? items
      : items.filter((s) => s.category === selectedCategory);

  // --- 드래그&드롭 핸들러 ---
  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
    const f = e.dataTransfer.files?.[0];
    if (!f) return;
    pickFile(f);
  };

  const onDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(true);
  };

  const onDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] || null;
    if (!f) {
      if (form.preview) URL.revokeObjectURL(form.preview);
      setForm((p) => ({ ...p, file: null, preview: '' }));
      return;
    }
    pickFile(f);
  };

  const pickFile = (f: File) => {
    if (!f.type.startsWith('image/')) {
      alert('이미지 파일만 업로드할 수 있어요.');
      return;
    }
    if (form.preview) URL.revokeObjectURL(form.preview);
    const preview = URL.createObjectURL(f);
    setForm((p) => ({ ...p, file: f, preview }));
  };

  const fmtDate = (s?: string) => {
    if (!s) return '';
    const d = new Date(s);
    return isNaN(d.getTime()) ? s : d.toLocaleDateString('ko-KR');
    };

  const resetForm = () => {
    if (form.preview) URL.revokeObjectURL(form.preview);
    setForm({
      title: '',
      artist: '',
      category: '찬양',
      musicalKey: 'C',
      tempoBpm: '120',
      file: null,
      preview: '',
    });
  };

  const handleUpload = async () => {
    if (!user?.username) {
      alert('로그인이 필요합니다.');
      return;
    }
    if (!form.title.trim()) {
      alert('곡 제목을 입력하세요.');
      return;
    }
    if (!form.file) {
      alert('악보 이미지를 선택하거나 드래그하여 넣어주세요.');
      return;
    }
    setUploading(true);
    setError(null);
    try {
      await songAPI.upload(
        form.file,
        form.title.trim(),
        form.artist.trim(),
        form.category,
        form.musicalKey,
        Number(form.tempoBpm || 0),
        user.username
      );
      setIsUploading(false);
      resetForm();
      await loadSongs();
      alert('악보가 업로드되었습니다.');
    } catch (e: any) {
      console.error(e);
      setError(e?.message || '업로드에 실패했습니다.');
      alert('업로드에 실패했습니다.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20 sm:pb-4">
      <div className="max-w-5xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <i className="ri-music-2-line text-2xl text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">찬양 악보</h1>
          <p className="text-gray-600">청소년부 찬양을 위한 악보를 확인하고 다운로드하세요</p>
        </div>

        {/* 업로드 버튼 */}
        <div className="mb-6">
          <Button onClick={() => setIsUploading(true)} className="w-full py-3 rounded-xl">
            <i className="ri-upload-line mr-2" />
            악보 업로드
          </Button>
        </div>

        {/* 업로드 폼 (드래그&드롭) */}
        {isUploading && (
          <Card className="mb-6 p-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">찬양 악보 업로드</h3>
            {!user && (
              <div className="p-3 mb-3 rounded-lg bg-yellow-50 text-yellow-700 text-sm">
                업로드에는 로그인이 필요합니다.
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">곡 제목</label>
                <input
                  value={form.title}
                  onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                  placeholder="찬양 제목을 입력하세요"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm bg-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">아티스트</label>
                <input
                  value={form.artist}
                  onChange={(e) => setForm((p) => ({ ...p, artist: e.target.value }))}
                  placeholder="작곡가/가수명"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm bg-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">카테고리</label>
                <select
                  value={form.category}
                  onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm bg-white"
                >
                  {CATEGORIES.slice(1).map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">조성</label>
                  <select
                    value={form.musicalKey}
                    onChange={(e) => setForm((p) => ({ ...p, musicalKey: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm bg-white"
                  >
                    {KEYS.map((k) => <option key={k} value={k}>{k}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">템포</label>
                  <input
                    type="number"
                    min={30}
                    max={300}
                    value={form.tempoBpm}
                    onChange={(e) => setForm((p) => ({ ...p, tempoBpm: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm bg-white"
                  />
                </div>
              </div>
            </div>

            {/* 드롭존 */}
            <div
              onDrop={onDrop}
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors ${
                dragOver ? 'border-green-500 bg-green-50' : 'border-gray-300 bg-white'
              }`}
            >
              {form.preview ? (
                <div className="space-y-3">
                  <img
                    src={form.preview}
                    alt="미리보기"
                    className="mx-auto max-h-64 rounded-lg object-contain"
                  />
                  <div className="flex gap-2 justify-center">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        if (form.preview) URL.revokeObjectURL(form.preview);
                        setForm((p) => ({ ...p, file: null, preview: '' }));
                      }}
                      className="rounded-xl"
                    >
                      이미지 변경
                    </Button>
                    <label className="inline-flex">
                      <span className="sr-only">파일 선택</span>
                      <input type="file" accept="image/*" className="hidden" onChange={onFileChange} />
                      <span className="px-4 py-2 rounded-xl border text-sm cursor-pointer">
                        다른 파일 선택
                      </span>
                    </label>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <i className="ri-upload-2-line text-3xl text-gray-400" />
                  <p className="text-sm text-gray-600">이미지를 여기로 드래그하거나</p>
                  <label className="inline-flex">
                    <span className="sr-only">파일 선택</span>
                    <input type="file" accept="image/*" className="hidden" onChange={onFileChange} />
                    <span className="px-4 py-2 rounded-xl border text-sm cursor-pointer">
                      파일 선택
                    </span>
                  </label>
                </div>
              )}
            </div>

            {error && (
              <div className="mt-3 p-3 rounded-lg bg-red-50 text-red-600 text-sm">{error}</div>
            )}

            <div className="grid grid-cols-2 gap-3 mt-6">
              <Button onClick={handleUpload} disabled={uploading || !user} className="py-3 rounded-xl">
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
                variant="secondary"
                onClick={() => {
                  setIsUploading(false);
                  resetForm();
                }}
                className="py-3 rounded-xl"
                disabled={uploading}
              >
                취소
              </Button>
            </div>
          </Card>
        )}

        {/* 카테고리 필터 */}
        <div className="mb-6">
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((c) => (
              <button
                key={c}
                onClick={() => setSelectedCategory(c)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors cursor-pointer ${
                  selectedCategory === c
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-600 hover:bg-blue-50 hover:text-blue-600 border border-gray-200'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* 리스트 */}
        <div className="space-y-3">
          {filtered.length === 0 ? (
            <Card className="p-6 text-center text-gray-500">등록된 악보가 없습니다.</Card>
          ) : (
            filtered.map((song) => (
              <Card key={song.id} className="p-4">
                <div className="flex gap-3 items-start">
                  <img
                    src={song.imageUrl || ''}
                    alt={song.title}
                    className="w-16 h-16 rounded-lg object-cover bg-gray-100 cursor-zoom-in hover:opacity-80 transition" 
                    onClick={() => {
                      if (song.imageUrl) setSelectedImage(song.imageUrl); // ✅ 클릭 시 전체보기
                    }}
                    onError={(e) => ((e.target as HTMLImageElement).style.visibility = 'hidden')}
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-gray-800">{song.title}</h3>
                      <span className="bg-blue-100 text-blue-600 text-xs px-2 py-1 rounded-full">
                        {song.category}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">{song.artist}</p>
                    <div className="text-xs text-gray-500 mt-1">
                      조성: {song.musicalKey || '-'} / 템포: {song.tempoBpm || '-'} / 업로더: {song.uploader || '-'}
                    </div>
                    <div className="text-xs text-gray-400">{fmtDate(song.createdAt)}</div>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>

        {/* ✅ 전체화면 이미지 모달 */}
        {selectedImage && (
          <div
            className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50"
            onClick={() => setSelectedImage(null)} // 클릭 시 닫기
          >
            <img
              src={selectedImage}
              alt="Full size"
              className="max-w-full max-h-full object-contain"
              onClick={(e) => e.stopPropagation()} // 이미지 클릭 시 닫히지 않도록
            />
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute top-6 right-6 text-white text-3xl hover:text-gray-300"
            >
              ✕
            </button>
          </div>
        )}

        {error && !isUploading && (
          <div className="mt-4 p-3 rounded-lg bg-red-50 text-red-600 text-sm">{error}</div>
        )}
      </div>
    </div>
  );
}
