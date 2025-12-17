// src/pages/songs/Song.tsx  (원하는 경로/파일명에 배치)
import React, { useEffect, useMemo, useState } from 'react';
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
const KEYS = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];

export default function Song() {
  const [items, setItems] = useState<SongItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('전체');
  const [selectedGroupImages, setSelectedGroupImages] = useState<string[] | null>(null); // 그룹 이미지 전체 보기
  const [selectedImageIndex, setSelectedImageIndex] = useState<number>(0); // 그룹 내 인덱스
  const [showIndicator, setShowIndicator] = useState(true); // 페이지 인디케이터 표시 여부
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
    files: [] as File[],
    previews: [] as string[],
  });

  const user = useMemo(() => {
    try {
      const raw = localStorage.getItem('user');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }, []);
  const isAdmin = (user?.role || '').toString().toUpperCase() === 'ADMIN';

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

  // 모달이 열릴 때 인디케이터 표시 후 2초 뒤 숨김
  useEffect(() => {
    if (selectedGroupImages) {
      setShowIndicator(true);
      const timer = setTimeout(() => setShowIndicator(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [selectedGroupImages]);

  const filtered =
    selectedCategory === '전체'
      ? items
      : items.filter((s) => s.category === selectedCategory);

  // 그룹핑: 다중 업로드된 악보를 하나의 카드로 표시 (제목 패턴 기반)
  const groupedSongs = useMemo(() => {
    const groups = new Map<string, {
      key: string;
      title: string;
      uploader?: string;
      fileUrls: string[];
      items: SongItem[];
    }>();

    const extractBase = (title: string) => {
      const m = title.match(/^(.*)\s\(\d+\/\d+\)$/);
      return m ? m[1] : title;
    };

    filtered.forEach(s => {
      const base = extractBase(s.title || '');
      const key = `${base}::${s.uploader || ''}`;
      if (!groups.has(key)) {
        groups.set(key, { key, title: base, uploader: s.uploader, fileUrls: [], items: [] });
      }
      const g = groups.get(key)!;
      if (s.imageUrl) g.fileUrls.push(s.imageUrl);
      g.items.push(s);
    });

    return Array.from(groups.values());
  }, [filtered]);

  // --- 다중 파일 드래그&드롭 핸들러 ---
  const pickFiles = (fileList: FileList | File[] | null) => {
    const files = Array.from(fileList || []);
    if (files.length === 0) {
      form.previews.forEach(url => URL.revokeObjectURL(url));
      setForm((p) => ({ ...p, files: [], previews: [] }));
      return;
    }

    // 이미지만 필터링
    const imageFiles = files.filter(f => f.type.startsWith('image/'));
    if (imageFiles.length === 0) {
      alert('이미지 파일만 업로드할 수 있어요.');
      return;
    }

    form.previews.forEach(url => URL.revokeObjectURL(url));
    const previews = imageFiles.map(f => URL.createObjectURL(f));
    setForm((p) => ({ ...p, files: imageFiles, previews }));
  };

  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
    pickFiles(e.dataTransfer.files);
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
    pickFiles(e.target.files);
  };

  const fmtDate = (s?: string) => {
    if (!s) return '';
    const d = new Date(s);
    return isNaN(d.getTime()) ? s : d.toLocaleDateString('ko-KR');
  };

  const resetForm = () => {
    form.previews.forEach(url => URL.revokeObjectURL(url));
    setForm({
      title: '',
      artist: '',
      category: '찬양',
      musicalKey: 'C',
      tempoBpm: '120',
      files: [],
      previews: [],
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
    if (form.files.length === 0) {
      alert('악보 이미지를 선택하거나 드래그하여 넣어주세요.');
      return;
    }

    setUploading(true);
    setError(null);
    try {
      // 각 파일을 순차적으로 업로드
      for (let i = 0; i < form.files.length; i++) {
        const file = form.files[i];
        const title = form.files.length > 1
          ? `${form.title.trim()} (${i + 1}/${form.files.length})`
          : form.title.trim();

        await songAPI.upload(
          file,
          title,
          form.artist.trim(),
          form.category,
          form.musicalKey,
          Number(form.tempoBpm || 0),
          user.username
        );
      }

      setIsUploading(false);
      resetForm();
      await loadSongs();
      alert(`${form.files.length}개 악보가 업로드되었습니다.`);
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

        {/* 업로드 버튼 (관리자만 표시) */}
        {isAdmin && (
          <div className="mb-6">
            <Button onClick={() => setIsUploading(true)} className="w-full py-3 rounded-xl">
              <i className="ri-upload-line mr-2" />
              악보 업로드
            </Button>
          </div>
        )}

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
              className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors ${dragOver ? 'border-green-500 bg-green-50' : 'border-gray-300 bg-white'
                }`}
            >
              {form.files.length > 0 ? (
                <div className="space-y-3">
                  <div className="text-sm font-medium text-gray-700">
                    {form.files.length}개 파일 선택됨
                  </div>
                  <div className="grid grid-cols-3 gap-3 max-h-64 overflow-y-auto">
                    {form.files.map((_, idx) => (
                      <div key={idx} className="border rounded-lg p-2">
                        {form.previews[idx] && (
                          <img
                            src={form.previews[idx]}
                            alt={`preview-${idx}`}
                            className="w-full h-32 object-cover rounded"
                          />
                        )}
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2 justify-center">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => pickFiles(null)}
                      className="rounded-xl"
                    >
                      모두 제거
                    </Button>
                    <label className="inline-flex">
                      <span className="sr-only">파일 선택</span>
                      <input type="file" accept="image/*" multiple className="hidden" onChange={onFileChange} />
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
                    <input type="file" accept="image/*" multiple className="hidden" onChange={onFileChange} />
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
              <Button onClick={handleUpload} disabled={uploading || !isAdmin} className="py-3 rounded-xl">
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
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors cursor-pointer ${selectedCategory === c
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-600 hover:bg-blue-50 hover:text-blue-600 border border-gray-200'
                  }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* 리스트 (그룹화) */}
        <div className="space-y-3">
          {groupedSongs.length === 0 ? (
            <Card className="p-6 text-center text-gray-500">등록된 악보가 없습니다.</Card>
          ) : (
            groupedSongs.map((g) => (
              <Card key={g.key} className="p-4">
                <div className="flex gap-3 items-start">
                  {/* 여러 이미지 썸네일 그리드 */}
                  <div className="flex-shrink-0">
                    {g.fileUrls.length > 0 ? (
                      <div
                        className="cursor-pointer hover:opacity-90 transition"
                        onClick={() => {
                          setSelectedGroupImages(g.fileUrls);
                          setSelectedImageIndex(0);
                        }}
                      >
                        {g.fileUrls.length === 1 ? (
                          // 단일 이미지: 큰 썸네일
                          <img
                            src={g.fileUrls[0]}
                            alt={g.title}
                            className="w-24 h-24 rounded-lg object-cover bg-gray-100"
                            onError={(e) => ((e.target as HTMLImageElement).style.visibility = 'hidden')}
                          />
                        ) : g.fileUrls.length === 2 ? (
                          // 2개 이미지: 세로 2분할
                          <div className="grid grid-cols-1 gap-1 w-24">
                            {g.fileUrls.slice(0, 2).map((url, idx) => (
                              <img
                                key={idx}
                                src={url}
                                alt={`${g.title} ${idx + 1}`}
                                className="w-24 h-11 rounded object-cover bg-gray-100"
                                onError={(e) => ((e.target as HTMLImageElement).style.visibility = 'hidden')}
                              />
                            ))}
                          </div>
                        ) : g.fileUrls.length === 3 ? (
                          // 3개 이미지: 1개 크게 + 2개 작게
                          <div className="flex gap-1 w-24">
                            <img
                              src={g.fileUrls[0]}
                              alt={`${g.title} 1`}
                              className="w-16 h-24 rounded object-cover bg-gray-100"
                              onError={(e) => ((e.target as HTMLImageElement).style.visibility = 'hidden')}
                            />
                            <div className="grid grid-rows-2 gap-1 flex-1">
                              {g.fileUrls.slice(1, 3).map((url, idx) => (
                                <img
                                  key={idx}
                                  src={url}
                                  alt={`${g.title} ${idx + 2}`}
                                  className="w-7 h-11 rounded object-cover bg-gray-100"
                                  onError={(e) => ((e.target as HTMLImageElement).style.visibility = 'hidden')}
                                />
                              ))}
                            </div>
                          </div>
                        ) : (
                          // 4개 이상: 2x2 그리드 + 더보기
                          <div className="grid grid-cols-2 gap-1 w-24 h-24 relative">
                            {g.fileUrls.slice(0, 4).map((url, idx) => (
                              <div key={idx} className="relative">
                                <img
                                  src={url}
                                  alt={`${g.title} ${idx + 1}`}
                                  className="w-full h-11 rounded object-cover bg-gray-100"
                                  onError={(e) => ((e.target as HTMLImageElement).style.visibility = 'hidden')}
                                />
                                {idx === 3 && g.fileUrls.length > 4 && (
                                  <div className="absolute inset-0 bg-black bg-opacity-60 rounded flex items-center justify-center">
                                    <span className="text-white text-xs font-bold">+{g.fileUrls.length - 4}</span>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="w-24 h-24 rounded-lg border flex items-center justify-center bg-white">
                        <i className="ri-file-text-line text-gray-400" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-gray-800">{g.title}</h3>
                      <span className="bg-blue-100 text-blue-600 text-xs px-2 py-1 rounded-full">
                        {g.items[0]?.category ?? '기타'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">{g.items[0]?.artist}</p>
                    <div className="text-xs text-gray-500 mt-1">
                      업로더: {g.uploader || '-'}
                    </div>
                    <div className="text-xs text-gray-400">{fmtDate(g.items[0]?.createdAt)}</div>
                    {g.fileUrls.length > 1 && <div className="text-xs text-gray-500 mt-2">({g.fileUrls.length}장)</div>}
                    {isAdmin && (
                      <div className="mt-2">
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={async () => {
                            if (!confirm('이 악보 그룹을 삭제하시겠습니까?')) return;
                            try {
                              // delete each item in group
                              for (const it of g.items) {
                                await songAPI.delete(it.id);
                              }
                              await loadSongs();
                              alert('삭제되었습니다.');
                            } catch (err) {
                              console.error(err);
                              alert('삭제에 실패했습니다.');
                            }
                          }}
                          className="py-1 rounded-lg text-xs"
                        >
                          <i className="ri-delete-bin-line mr-1" />
                          삭제
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>


        {/* ✅ 그룹 이미지 전체보기 모달 (스와이프 지원) */}
        {selectedGroupImages && (
          <div
            className="fixed inset-0 bg-black bg-opacity-95 flex items-center justify-center z-50"
            onClick={() => {
              setSelectedGroupImages(null);
            }}
          >
            <div
              className="relative w-full h-full flex items-center justify-center"
              onTouchStart={(e) => {
                (e.currentTarget as any).touchStartX = e.touches[0].clientX;
              }}
              onTouchMove={(e) => {
                (e.currentTarget as any).touchEndX = e.touches[0].clientX;
              }}
              onTouchEnd={(e) => {
                const touchStartX = (e.currentTarget as any).touchStartX || 0;
                const touchEndX = (e.currentTarget as any).touchEndX || 0;
                const swipeThreshold = 50;
                const diff = touchStartX - touchEndX;

                if (Math.abs(diff) > swipeThreshold) {
                  if (diff > 0 && selectedImageIndex < selectedGroupImages.length - 1) {
                    // 왼쪽으로 스와이프 (다음)
                    setSelectedImageIndex(selectedImageIndex + 1);
                    setShowIndicator(true);
                    setTimeout(() => setShowIndicator(false), 2000);
                  } else if (diff < 0 && selectedImageIndex > 0) {
                    // 오른쪽으로 스와이프 (이전)
                    setSelectedImageIndex(selectedImageIndex - 1);
                    setShowIndicator(true);
                    setTimeout(() => setShowIndicator(false), 2000);
                  }
                }
              }}
            >
              {/* 이미지 컨테이너 - 좌우 클릭 영역 */}
              <div
                className="relative flex items-center justify-center w-full h-full px-4"
                onClick={(e) => {
                  e.stopPropagation();

                  const rect = e.currentTarget.getBoundingClientRect();
                  const clickX = e.clientX - rect.left;
                  const containerWidth = rect.width;
                  const isLeftHalf = clickX < containerWidth / 2;

                  if (isLeftHalf && selectedImageIndex > 0) {
                    setSelectedImageIndex(selectedImageIndex - 1);
                    setShowIndicator(true);
                    setTimeout(() => setShowIndicator(false), 2000);
                  } else if (!isLeftHalf && selectedImageIndex < selectedGroupImages.length - 1) {
                    setSelectedImageIndex(selectedImageIndex + 1);
                    setShowIndicator(true);
                    setTimeout(() => setShowIndicator(false), 2000);
                  }
                }}
                onMouseMove={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const mouseX = e.clientX - rect.left;
                  const containerWidth = rect.width;
                  const isLeftHalf = mouseX < containerWidth / 2;

                  if (isLeftHalf && selectedImageIndex > 0) {
                    e.currentTarget.style.cursor = 'w-resize';
                  } else if (!isLeftHalf && selectedImageIndex < selectedGroupImages.length - 1) {
                    e.currentTarget.style.cursor = 'e-resize';
                  } else {
                    e.currentTarget.style.cursor = 'default';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.cursor = 'default';
                }}
              >
                <img
                  src={selectedGroupImages[selectedImageIndex]}
                  alt={`Full size ${selectedImageIndex + 1}`}
                  className="max-w-full max-h-full object-contain rounded-lg shadow-2xl pointer-events-none"
                  style={{ maxWidth: '95%', maxHeight: '92vh' }}
                />
              </div>

              {/* 도트 페이지 인디케이터 - 2초 후 사라짐 */}
              {selectedGroupImages.length > 1 && (
                <div
                  className={`absolute bottom-8 left-1/2 transform -translate-x-1/2 flex gap-2 transition-opacity duration-300 ${showIndicator ? 'opacity-100' : 'opacity-0'
                    }`}
                >
                  {selectedGroupImages.map((_, idx) => (
                    <div
                      key={idx}
                      className={`w-2 h-2 rounded-full transition-all duration-300 ${idx === selectedImageIndex
                        ? 'bg-white scale-125'
                        : 'bg-white bg-opacity-40'
                        }`}
                    />
                  ))}
                </div>
              )}

              {/* 닫기 버튼 */}
              <button
                onClick={() => {
                  setSelectedGroupImages(null);
                }}
                className="absolute top-4 right-4 text-white text-3xl hover:text-gray-300 transition-colors bg-black bg-opacity-50 rounded-full w-10 h-10 flex items-center justify-center hover:bg-opacity-70"
              >
                ✕
              </button>
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
