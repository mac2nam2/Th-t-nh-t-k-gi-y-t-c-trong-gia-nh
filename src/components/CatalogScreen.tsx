import React, { useMemo, useState } from 'react';
import {
  Search,
  RotateCcw,
  Plus,
  Lock,
  Globe,
  Users,
  FileText,
  ArrowRight,
  Upload,
  X,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import type {
  ArchiveRecord,
  DocumentCategory,
  PrivacyLevel,
} from '../types/archive';

interface CatalogScreenProps {
  records: ArchiveRecord[];
  initialSearch: string;
  initialCategory: DocumentCategory | 'Tất cả';
  largeText: boolean;
  onOpenDetail: (id: string) => void;
  onRecordAdded: () => Promise<void>;
}

const CATEGORIES: (DocumentCategory | 'Tất cả')[] = [
  'Tất cả',
  'Thư từ',
  'Nhật ký',
  'Giấy khai sinh',
  'Giấy chứng nhận',
  'Giấy tờ cá nhân',
  'Ảnh chụp',
  'Tài liệu khác',
];

const TIME_PERIODS = [
  'Tất cả thời kỳ',
  'Trước 1960',
  '1960 – 1975',
  '1976 – 1990',
  'Sau 1990',
  'Chưa rõ thời gian',
];

const PRIVACY_OPTIONS: (PrivacyLevel | 'Tất cả')[] = [
  'Tất cả',
  'Công khai rộng rãi',
  'Công khai trong gia đình',
  'Nội bộ dòng họ',
  'Hạn chế — Chỉ người lưu giữ',
];

export const CatalogScreen: React.FC<CatalogScreenProps> = ({
  records,
  initialSearch,
  initialCategory,
  largeText,
  onOpenDetail,
  onRecordAdded,
}) => {
  const [search, setSearch] = useState(initialSearch);
  const [category, setCategory] = useState<DocumentCategory | 'Tất cả'>(
    initialCategory
  );
  const [personFilter, setPersonFilter] = useState('Tất cả');
  const [timeFilter, setTimeFilter] = useState('Tất cả thời kỳ');
  const [privacyFilter, setPrivacyFilter] = useState<PrivacyLevel | 'Tất cả'>(
    'Tất cả'
  );

  // Add new document modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [uploadedImage, setUploadedImage] = useState<{
    tep: string;
    chuThich: string;
    nguonAnh: string;
    loaiAnh: 'Ảnh chụp gốc' | 'Bản quét gốc';
  } | null>(null);

  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState<DocumentCategory>('Thư từ');
  const [newCreator, setNewCreator] = useState('');
  const [newRecipient, setNewRecipient] = useState('');
  const [newDate, setNewDate] = useState('');
  const [newYear, setNewYear] = useState('');
  const [newLocation, setNewLocation] = useState('');
  const [newSummary, setNewSummary] = useState('');
  const [newTranscript, setNewTranscript] = useState('');
  const [newCondition, setNewCondition] = useState('');
  const [newCustodian, setNewCustodian] = useState('');
  const [newSource, setNewSource] = useState('');
  const [newPrivacy, setNewPrivacy] = useState<PrivacyLevel>('Nội bộ dòng họ');
  const [newSensitive, setNewSensitive] = useState(false);

  const personOptions = useMemo(() => {
    const names = new Set<string>();
    for (const r of records) {
      if (r.nguoiTao) names.add(r.nguoiTao);
      if (r.nguoiLuuGiu) names.add(r.nguoiLuuGiu);
    }
    return ['Tất cả', ...Array.from(names)];
  }, [records]);

  const filteredRecords = useMemo(() => {
    const q = search.trim().toLowerCase();
    return records.filter((rec) => {
      if (category !== 'Tất cả' && rec.loaiTaiLieu !== category) return false;
      if (
        personFilter !== 'Tất cả' &&
        rec.nguoiTao !== personFilter &&
        rec.nguoiLuuGiu !== personFilter
      ) {
        return false;
      }
      if (privacyFilter !== 'Tất cả' && rec.mucDoRiengTu !== privacyFilter) {
        return false;
      }

      if (timeFilter !== 'Tất cả thời kỳ') {
        const y = rec.namUocLuong;
        if (timeFilter === 'Chưa rõ thời gian') {
          if (y !== null) return false;
        } else if (y === null) {
          return false;
        } else if (timeFilter === 'Trước 1960' && y >= 1960) {
          return false;
        } else if (timeFilter === '1960 – 1975' && (y < 1960 || y > 1975)) {
          return false;
        } else if (timeFilter === '1976 – 1990' && (y < 1976 || y > 1990)) {
          return false;
        } else if (timeFilter === 'Sau 1990' && y <= 1990) {
          return false;
        }
      }

      if (q) {
        const haystack = [
          rec.id,
          rec.tenTaiLieu,
          rec.loaiTaiLieu,
          rec.nguoiTao,
          rec.nguoiNhan || '',
          rec.thoiGianTao,
          rec.diaDiem,
          rec.tomTat,
          rec.noiDungPhienAm,
          rec.nguoiLuuGiu,
          rec.nguonGoc,
        ]
          .join(' ')
          .toLowerCase();
        if (!haystack.includes(q)) return false;
      }

      return true;
    });
  }, [records, search, category, personFilter, timeFilter, privacyFilter]);

  const handleResetFilters = () => {
    setSearch('');
    setCategory('Tất cả');
    setPersonFilter('Tất cả');
    setTimeFilter('Tất cả thời kỳ');
    setPrivacyFilter('Tất cả');
  };

  const handleImageFileSelect = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFormError(null);

    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const base64Data = String(reader.result || '');
        const resp = await fetch('/api/upload-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fileName: file.name, base64Data }),
        });
        const data = await resp.json();
        if (!resp.ok) {
          setFormError(data.error || 'Không thể tải ảnh lên.');
          return;
        }
        setUploadedImage({
          tep: data.tep,
          loaiAnh: 'Ảnh chụp gốc',
          chuThich: `Ảnh chụp trực tiếp tài liệu "${newTitle || file.name}"`,
          nguonAnh: `Do thành viên gia đình tải lên từ thiết bị (${new Date().toLocaleDateString('vi-VN')}).`,
        });
      } catch {
        setFormError('Lỗi kết nối khi tải ảnh lên máy chủ.');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleCreateRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) {
      setFormError('Vui lòng nhập tên tài liệu.');
      return;
    }

    setIsSubmitting(true);
    setFormError(null);
    try {
      const parsedYear = newYear.trim() ? Number(newYear.trim()) : null;
      const resp = await fetch('/api/records', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenTaiLieu: newTitle.trim(),
          loaiTaiLieu: newCategory,
          nguoiTao: newCreator.trim() || 'Chưa rõ',
          nguoiNhan: newRecipient.trim() || null,
          thoiGianTao: newDate.trim() || 'Chưa rõ',
          namUocLuong:
            parsedYear && !Number.isNaN(parsedYear) ? parsedYear : null,
          diaDiem: newLocation.trim() || 'Chưa rõ',
          tomTat: newSummary.trim() || 'Chưa có thông tin tóm tắt.',
          noiDungPhienAm:
            newTranscript.trim() || 'Chưa có nội dung phiên âm.',
          noiDungBienTap: 'Chưa có nội dung biên tập.',
          tinhTrangTaiLieu:
            newCondition.trim() || 'Chưa có thông tin tình trạng vật lý.',
          nguoiLuuGiu: newCustodian.trim() || 'Chưa rõ',
          nguonGoc: newSource.trim() || 'Chưa rõ nguồn gốc chi tiết.',
          mucDoRiengTu: newPrivacy,
          phamViCongBo:
            newPrivacy === 'Công khai rộng rãi'
              ? 'Được người lưu giữ đồng ý công khai.'
              : 'Hạn chế theo phân quyền gia đình.',
          daDuocPhepCongBo: newPrivacy === 'Công khai rộng rãi',
          coThongTinNhayCam: newSensitive,
          mucKiemChung: 'Chưa kiểm chứng',
          danhSachAnh: uploadedImage ? [uploadedImage] : [],
        }),
      });
      const data = await resp.json();
      if (!resp.ok) {
        setFormError(data.error || 'Không thể lưu tài liệu mới.');
        return;
      }
      await onRecordAdded();
      setShowAddModal(false);
      setNewTitle('');
      setNewCreator('');
      setNewRecipient('');
      setNewDate('');
      setNewYear('');
      setNewLocation('');
      setNewSummary('');
      setNewTranscript('');
      setNewCondition('');
      setNewCustodian('');
      setNewSource('');
      setUploadedImage(null);
      onOpenDetail(data.id);
    } catch {
      setFormError('Lỗi kết nối khi lưu tài liệu mới.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 pb-10">
      {/* Page Title & Add Action */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#DFD6C7] pb-5">
        <div>
          <h1 className="font-serif-display text-3xl font-semibold text-[#241E18]">
            Kho tài liệu gia đình
          </h1>
          <p className="mt-1.5 text-sm text-[#5C5145]">
            Lọc theo loại tài liệu, người viết hoặc người giữ, thời gian và mức độ công khai. Các thông tin chưa rõ được giữ nguyên để tránh suy đoán.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowAddModal(true)}
          className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-lg bg-[#8F2D18] px-4 text-sm font-medium text-white hover:bg-[#742312] transition-colors whitespace-nowrap shrink-0"
        >
          <Plus className="h-4 w-4" />
          <span>Lưu trữ tài liệu mới</span>
        </button>
      </div>

      {/* Filter Panel */}
      <section
        aria-label="Bộ lọc tìm kiếm tài liệu"
        className="archival-card rounded-xl p-4 sm:p-5 space-y-4"
      >
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          <div className="md:col-span-5 relative">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#685D51]" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm từ khóa, mã tài liệu, nội dung phiên âm..."
              className="w-full min-h-[44px] rounded-lg border border-[#CFC1AC] bg-[#FAF6EE] pl-10 pr-3 text-sm text-[#241E18] focus:border-[#8F2D18] focus:outline-none"
            />
          </div>

          <div className="md:col-span-2">
            <label htmlFor="filter-category" className="sr-only">
              Loại tài liệu
            </label>
            <select
              id="filter-category"
              value={category}
              onChange={(e) =>
                setCategory(e.target.value as DocumentCategory | 'Tất cả')
              }
              className="w-full min-h-[44px] rounded-lg border border-[#CFC1AC] bg-[#FAF6EE] px-3 text-sm text-[#241E18] focus:border-[#8F2D18] focus:outline-none"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c === 'Tất cả' ? 'Loại: Tất cả' : c}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-2">
            <label htmlFor="filter-person" className="sr-only">
              Người viết hoặc người sở hữu
            </label>
            <select
              id="filter-person"
              value={personFilter}
              onChange={(e) => setPersonFilter(e.target.value)}
              className="w-full min-h-[44px] rounded-lg border border-[#CFC1AC] bg-[#FAF6EE] px-3 text-sm text-[#241E18] focus:border-[#8F2D18] focus:outline-none"
            >
              {personOptions.map((p) => (
                <option key={p} value={p}>
                  {p === 'Tất cả' ? 'Người liên quan: Tất cả' : p}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-3 flex gap-2">
            <select
              aria-label="Thời gian"
              value={timeFilter}
              onChange={(e) => setTimeFilter(e.target.value)}
              className="w-full min-h-[44px] rounded-lg border border-[#CFC1AC] bg-[#FAF6EE] px-3 text-sm text-[#241E18] focus:border-[#8F2D18] focus:outline-none"
            >
              {TIME_PERIODS.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Privacy filter segmented buttons */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[#EAE1D3]">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-medium text-[#5C5145] mr-1">
              Mức độ công khai:
            </span>
            {PRIVACY_OPTIONS.map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => setPrivacyFilter(opt)}
                className={`min-h-[38px] rounded-lg px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${
                  privacyFilter === opt
                    ? 'bg-[#241E18] text-white'
                    : 'bg-[#F2EAE0] text-[#4A4036] hover:bg-[#E4D7C5]'
                }`}
              >
                {opt}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={handleResetFilters}
            className="inline-flex min-h-[38px] items-center gap-1.5 text-xs font-medium text-[#8F2D18] hover:underline whitespace-nowrap"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Xóa bộ lọc</span>
          </button>
        </div>
      </section>

      {/* Results Header */}
      <div className="flex items-center justify-between text-sm text-[#5C5145]">
        <p className="tabular-nums">
          Hiển thị <strong className="text-[#241E18]">{filteredRecords.length}</strong> / {records.length} tài liệu
        </p>
      </div>

      {/* Document Grid */}
      {filteredRecords.length === 0 ? (
        <div className="archival-card rounded-xl p-10 text-center space-y-3">
          <FileText className="mx-auto h-10 w-10 text-[#7C5832]" />
          <h2 className="font-serif-display text-xl font-semibold text-[#241E18]">
            Không tìm thấy tài liệu phù hợp
          </h2>
          <p className="text-sm text-[#5C5145] max-w-md mx-auto">
            Thử đổi từ khóa tìm kiếm hoặc đặt lại bộ lọc thời gian, loại tài liệu để xem toàn bộ hồ sơ gia đình.
          </p>
          <button
            type="button"
            onClick={handleResetFilters}
            className="inline-flex min-h-[44px] items-center gap-2 rounded-lg bg-[#8F2D18] px-5 text-sm font-medium text-white hover:bg-[#742312]"
          >
            Xem tất cả tài liệu
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRecords.map((rec) => {
            const isRestricted =
              rec.mucDoRiengTu === 'Hạn chế — Chỉ người lưu giữ' ||
              rec.mucDoRiengTu === 'Nội bộ dòng họ' ||
              (rec.coThongTinNhayCam && !rec.daDuocPhepCongBo);

            return (
              <article
                key={rec.id}
                className="archival-card rounded-xl overflow-hidden flex flex-col justify-between hover:border-[#8F2D18] transition-colors"
              >
                <div>
                  {/* Thumbnail */}
                  <div className="relative h-52 bg-[#E8DEC9] overflow-hidden">
                    {rec.danhSachAnh[0] ? (
                      <img
                        src={rec.danhSachAnh[0].tep}
                        alt={rec.tenTaiLieu}
                        referrerPolicy="no-referrer"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full flex-col items-center justify-center px-4 text-center text-[#685D51]">
                        {rec.coThongTinNhayCam && !rec.daDuocPhepCongBo ? (
                          <>
                            <Lock className="h-7 w-7 text-[#8F2D18] mb-2" />
                            <span className="text-xs font-medium text-[#241E18]">
                              Ảnh bản gốc đang ẩn theo quyền riêng tư
                            </span>
                          </>
                        ) : (
                          <>
                            <FileText className="h-7 w-7 text-[#7C5832] mb-2" />
                            <span className="text-xs">
                              Chưa có ảnh bản quét đính kèm
                            </span>
                          </>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Card Body */}
                  <div className="p-5 space-y-3">
                    {/* Clean unboxed metadata */}
                    <div className="flex flex-wrap items-center gap-2 text-xs text-[#685D51]">
                      <span className="font-mono-archival text-[#8F2D18] font-medium">
                        {rec.id}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>{rec.loaiTaiLieu}</span>
                      <span aria-hidden="true">·</span>
                      <span>{rec.thoiGianTao}</span>
                    </div>

                    <h2
                      className={`font-serif-display font-semibold text-[#241E18] leading-snug ${
                        largeText ? 'text-xl' : 'text-lg'
                      }`}
                    >
                      {rec.tenTaiLieu}
                    </h2>

                    <p
                      className={`text-[#4A4036] leading-relaxed line-clamp-3 ${
                        largeText ? 'text-base' : 'text-sm'
                      }`}
                    >
                      {rec.tomTat}
                    </p>

                    <dl className="space-y-1 border-t border-[#EAE1D3] pt-3 text-xs text-[#5C5145]">
                      <div className="flex justify-between gap-2">
                        <dt className="text-[#7B6E60]">Người viết / tạo:</dt>
                        <dd className="font-medium text-[#241E18] text-right truncate max-w-[60%]">
                          {rec.nguoiTao || 'Chưa rõ'}
                        </dd>
                      </div>
                      <div className="flex justify-between gap-2">
                        <dt className="text-[#7B6E60]">Người lưu giữ:</dt>
                        <dd className="font-medium text-[#241E18] text-right truncate max-w-[60%]">
                          {rec.nguoiLuuGiu || 'Chưa rõ'}
                        </dd>
                      </div>
                    </dl>
                  </div>
                </div>

                {/* Footer access & action */}
                <div className="border-t border-[#EAE1D3] bg-[#FAF6EE] px-5 py-3 flex items-center justify-between gap-3">
                  <div className="space-y-0.5 min-w-0">
                    <div className="flex items-center gap-1.5 text-xs font-medium">
                      {isRestricted ? (
                        <span className="inline-flex items-center gap-1 text-[#8F2D18] truncate">
                          <Lock className="h-3.5 w-3.5 shrink-0" />
                          <span className="truncate">{rec.mucDoRiengTu}</span>
                        </span>
                      ) : rec.mucDoRiengTu === 'Công khai rộng rãi' ? (
                        <span className="inline-flex items-center gap-1 text-[#14532D] truncate">
                          <Globe className="h-3.5 w-3.5 shrink-0" />
                          <span className="truncate">Công khai rộng rãi</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[#5C5145] truncate">
                          <Users className="h-3.5 w-3.5 shrink-0" />
                          <span className="truncate">{rec.mucDoRiengTu}</span>
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-[11px] text-[#685D51]">
                      {rec.mucKiemChung === 'Đã kiểm chứng' ? (
                        <CheckCircle2 className="h-3 w-3 text-[#14532D]" />
                      ) : (
                        <Clock className="h-3 w-3 text-[#9A3412]" />
                      )}
                      <span>{rec.mucKiemChung}</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => onOpenDetail(rec.id)}
                    className="inline-flex min-h-[42px] items-center gap-1.5 rounded-lg border border-[#CFC1AC] bg-white px-3.5 text-xs font-medium text-[#241E18] hover:border-[#8F2D18] hover:text-[#8F2D18] transition-colors whitespace-nowrap shrink-0"
                  >
                    <span>Mở hồ sơ</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Modal Add New Document */}
      {showAddModal && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-[#1F1C18]/60 backdrop-blur-sm p-0 sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Lưu trữ tài liệu mới"
        >
          <div className="w-full max-w-2xl max-h-[92vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl bg-[#FAF6EE] border border-[#DFD6C7] shadow-xl">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[#DFD6C7] bg-[#FAF6EE] px-5 py-4">
              <div>
                <h2 className="font-serif-display text-xl font-semibold text-[#241E18]">
                  Lưu trữ tài liệu gia đình mới
                </h2>
                <p className="text-xs text-[#5C5145] mt-0.5">
                  Nếu thông tin nào chưa nhớ rõ, hãy để trống — hệ thống sẽ ghi là &ldquo;Chưa rõ&rdquo; chứ không tự suy đoán.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg hover:bg-[#EDE4D5]"
                aria-label="Đóng biểu mẫu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateRecord} className="p-5 space-y-4">
              {formError && (
                <div className="rounded-lg border border-[#8F2D18] bg-[#FEF2F2] px-4 py-3 text-sm text-[#8F2D18]">
                  {formError}
                </div>
              )}

              {/* Phone Camera / Image Upload */}
              <div className="rounded-xl border border-dashed border-[#B7A68E] bg-[#FFFDF9] p-4 space-y-2">
                <label
                  htmlFor="upload-doc-image"
                  className="flex cursor-pointer flex-col items-center justify-center gap-2 py-2 text-center"
                >
                  <Upload className="h-6 w-6 text-[#8F2D18]" />
                  <span className="text-sm font-medium text-[#241E18]">
                    Chụp ảnh hoặc chọn bản quét tài liệu thật từ điện thoại
                  </span>
                  <span className="text-xs text-[#685D51]">
                    Ảnh sẽ được lưu vào thư mục riêng /tailieu-anh trên máy chủ (JPG, PNG, tối đa 10MB).
                  </span>
                  <input
                    id="upload-doc-image"
                    type="file"
                    accept="image/*"
                    onChange={handleImageFileSelect}
                    className="sr-only"
                  />
                </label>
                {uploadedImage && (
                  <div className="flex items-center gap-3 rounded-lg border border-[#DFD6C7] bg-[#FAF6EE] p-2.5">
                    <img
                      src={uploadedImage.tep}
                      alt="Xem trước ảnh vừa tải"
                      className="h-14 w-14 rounded object-cover"
                    />
                    <div className="min-w-0 flex-1 text-xs">
                      <p className="font-medium text-[#14532D]">
                        Đã tải lên ảnh thành công
                      </p>
                      <p className="truncate text-[#5C5145]">
                        {uploadedImage.tep}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-[#241E18] mb-1">
                    Tên tài liệu *
                  </label>
                  <input
                    type="text"
                    required
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="Ví dụ: Thư ông nội gửi từ Đà Nẵng năm 1979"
                    className="w-full min-h-[44px] rounded-lg border border-[#CFC1AC] bg-white px-3 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#241E18] mb-1">
                    Loại tài liệu *
                  </label>
                  <select
                    value={newCategory}
                    onChange={(e) =>
                      setNewCategory(e.target.value as DocumentCategory)
                    }
                    className="w-full min-h-[44px] rounded-lg border border-[#CFC1AC] bg-white px-3 text-sm"
                  >
                    {CATEGORIES.filter((c) => c !== 'Tất cả').map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#241E18] mb-1">
                    Mức độ riêng tư
                  </label>
                  <select
                    value={newPrivacy}
                    onChange={(e) =>
                      setNewPrivacy(e.target.value as PrivacyLevel)
                    }
                    className="w-full min-h-[44px] rounded-lg border border-[#CFC1AC] bg-white px-3 text-sm"
                  >
                    {PRIVACY_OPTIONS.filter((o) => o !== 'Tất cả').map((o) => (
                      <option key={o} value={o}>
                        {o}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#241E18] mb-1">
                    Người viết / người tạo (để trống nếu chưa rõ)
                  </label>
                  <input
                    type="text"
                    value={newCreator}
                    onChange={(e) => setNewCreator(e.target.value)}
                    placeholder="Chưa rõ"
                    className="w-full min-h-[44px] rounded-lg border border-[#CFC1AC] bg-white px-3 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#241E18] mb-1">
                    Người nhận (nếu có)
                  </label>
                  <input
                    type="text"
                    value={newRecipient}
                    onChange={(e) => setNewRecipient(e.target.value)}
                    placeholder="Để trống nếu không có"
                    className="w-full min-h-[44px] rounded-lg border border-[#CFC1AC] bg-white px-3 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#241E18] mb-1">
                    Thời gian ghi trên tài liệu
                  </label>
                  <input
                    type="text"
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    placeholder="Ví dụ: 12/05/1979 hoặc Chưa rõ"
                    className="w-full min-h-[44px] rounded-lg border border-[#CFC1AC] bg-white px-3 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#241E18] mb-1">
                    Năm ước lượng (để lọc theo thời kỳ)
                  </label>
                  <input
                    type="number"
                    value={newYear}
                    onChange={(e) => setNewYear(e.target.value)}
                    placeholder="Ví dụ: 1979"
                    className="w-full min-h-[44px] rounded-lg border border-[#CFC1AC] bg-white px-3 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#241E18] mb-1">
                    Địa điểm
                  </label>
                  <input
                    type="text"
                    value={newLocation}
                    onChange={(e) => setNewLocation(e.target.value)}
                    placeholder="Ví dụ: Hà Nội hoặc Chưa rõ"
                    className="w-full min-h-[44px] rounded-lg border border-[#CFC1AC] bg-white px-3 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#241E18] mb-1">
                    Người lưu giữ hiện nay
                  </label>
                  <input
                    type="text"
                    value={newCustodian}
                    onChange={(e) => setNewCustodian(e.target.value)}
                    placeholder="Họ tên thành viên đang giữ bản gốc"
                    className="w-full min-h-[44px] rounded-lg border border-[#CFC1AC] bg-white px-3 text-sm"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-[#241E18] mb-1">
                    Nguồn gốc tài liệu & tình trạng giấy
                  </label>
                  <input
                    type="text"
                    value={newSource}
                    onChange={(e) => setNewSource(e.target.value)}
                    placeholder="Ví dụ: Tìm thấy trong rương gỗ của bà nội..."
                    className="w-full min-h-[44px] rounded-lg border border-[#CFC1AC] bg-white px-3 text-sm"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-[#241E18] mb-1">
                    Tình trạng vật lý của tài liệu
                  </label>
                  <input
                    type="text"
                    value={newCondition}
                    onChange={(e) => setNewCondition(e.target.value)}
                    placeholder="Ví dụ: Giấy ố vàng nhẹ, rách mép phải"
                    className="w-full min-h-[44px] rounded-lg border border-[#CFC1AC] bg-white px-3 text-sm"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-[#241E18] mb-1">
                    Nội dung tóm tắt
                  </label>
                  <textarea
                    rows={2}
                    value={newSummary}
                    onChange={(e) => setNewSummary(e.target.value)}
                    placeholder="Mô tả ngắn gọn nội dung chính của tài liệu..."
                    className="w-full rounded-lg border border-[#CFC1AC] bg-white p-3 text-sm"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-[#241E18] mb-1">
                    Nội dung phiên âm nguyên văn (nếu đã đọc được)
                  </label>
                  <textarea
                    rows={4}
                    value={newTranscript}
                    onChange={(e) => setNewTranscript(e.target.value)}
                    placeholder="Chép nguyên văn nội dung đọc được, dùng [chưa rõ] ở những chỗ chữ mờ..."
                    className="w-full rounded-lg border border-[#CFC1AC] bg-white p-3 text-sm font-mono-archival"
                  />
                </div>

                <div className="sm:col-span-2 flex items-start gap-2.5 pt-1">
                  <input
                    id="has-sensitive-info"
                    type="checkbox"
                    checked={newSensitive}
                    onChange={(e) => setNewSensitive(e.target.checked)}
                    className="mt-1 h-4 w-4 rounded border-[#CFC1AC] text-[#8F2D18]"
                  />
                  <label
                    htmlFor="has-sensitive-info"
                    className="text-xs leading-relaxed text-[#4A4036]"
                  >
                    Tài liệu có chứa thông tin cá nhân nhạy cảm (địa chỉ nhà, số giấy tờ, tài chính) — cần ẩn khi xem ở chế độ Công khai.
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 border-t border-[#DFD6C7] pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="min-h-[44px] rounded-lg border border-[#CFC1AC] bg-white px-4 text-sm font-medium text-[#241E18]"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="min-h-[44px] rounded-lg bg-[#8F2D18] px-5 text-sm font-medium text-white hover:bg-[#742312] disabled:opacity-50"
                >
                  {isSubmitting ? 'Đang lưu...' : 'Lưu vào kho gia đình'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
