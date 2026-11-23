import React, { useState } from 'react';
import {
  Search,
  ArrowRight,
  BookOpen,
  FileText,
  Mail,
  Camera,
  Award,
  CheckCircle2,
  Clock,
  Lock,
} from 'lucide-react';
import type { ArchiveDataset, ArchiveRecord, DocumentCategory } from '../types/archive';

interface HomeScreenProps {
  dataset: ArchiveDataset;
  largeText: boolean;
  onSearchSubmit: (query: string) => void;
  onSelectCategory: (category: DocumentCategory) => void;
  onOpenDetail: (id: string) => void;
  onOpenQa: () => void;
}

const FEATURED_GROUPS: {
  title: string;
  category: DocumentCategory;
  description: string;
  icon: React.FC<{ className?: string }>;
}[] = [
  {
    title: 'Thư từ gia đình',
    category: 'Thư từ',
    description: 'Những lá thư viết tay gửi về quê nhà, lưu giữ giọng văn và tình cảm các thế hệ.',
    icon: Mail,
  },
  {
    title: 'Nhật ký & Ghi chép',
    category: 'Nhật ký',
    description: 'Trang sổ tay cá nhân ghi lại hành trình, tâm tư và những năm tháng nhiều biến động.',
    icon: BookOpen,
  },
  {
    title: 'Giấy khai sinh & Cá nhân',
    category: 'Giấy khai sinh',
    description: 'Hồ sơ hộ tịch, giấy giới thiệu và giấy tờ tùy thân gắn liền với các mốc cuộc đời.',
    icon: FileText,
  },
  {
    title: 'Ảnh chụp & Bằng cấp',
    category: 'Ảnh chụp',
    description: 'Khoảnh khắc sum họp ba thế hệ cùng văn bằng học tập được bảo quản nguyên vẹn.',
    icon: Camera,
  },
];

export const HomeScreen: React.FC<HomeScreenProps> = ({
  dataset,
  largeText,
  onSearchSubmit,
  onSelectCategory,
  onOpenDetail,
  onOpenQa,
}) => {
  const [searchInput, setSearchInput] = useState('');

  const records = dataset.hoSoTaiLieu;
  const verifiedCount = records.filter((r) => r.mucKiemChung === 'Đã kiểm chứng').length;
  const pendingCount = records.filter((r) => r.mucKiemChung !== 'Đã kiểm chứng').length;
  const imageCount = records.reduce((acc, r) => acc + r.danhSachAnh.length, 0);

  const featuredLead: ArchiveRecord | undefined =
    records.find((r) => r.id === 'TL-1968-001') || records[0];

  const pendingVerificationRecords = records.filter(
    (r) => r.mucKiemChung !== 'Đã kiểm chứng'
  );

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onSearchSubmit(searchInput.trim());
  };

  return (
    <div className="space-y-12 pb-10">
      {/* Hero Section */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        <div className="lg:col-span-7 flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <p className="text-xs font-medium tracking-widest uppercase text-[#8F2D18]">
              Kho Lưu Trữ Tư Liệu Gia Đình · Chuẩn Dublin Core
            </p>
            <h1
              className={`font-serif-display font-semibold text-[#241E18] leading-tight ${
                largeText ? 'text-4xl sm:text-5xl' : 'text-3xl sm:text-4xl lg:text-[42px]'
              }`}
              style={{ textWrap: 'balance' }}
            >
              Gìn giữ thư từ, nhật ký và ký ức gia đình qua từng thế hệ
            </h1>
            <p
              className={`text-[#4A4036] leading-relaxed max-w-2xl ${
                largeText ? 'text-lg' : 'text-base'
              }`}
            >
              Nơi lưu trữ số hóa các tài liệu giấy cũ dễ thất lạc hoặc phai mực, giúp ông bà kể lại câu chuyện xưa và con cháu dễ dàng tra cứu nguồn gốc gia đình trên điện thoại.
            </p>
          </div>

          {/* Search box */}
          <form onSubmit={handleSearch} className="space-y-3">
            <label htmlFor="home-archive-search" className="sr-only">
              Tìm kiếm tài liệu trong kho gia đình
            </label>
            <div className="flex flex-col sm:flex-row gap-2.5">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-[#685D51]" />
                <input
                  id="home-archive-search"
                  type="search"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Tìm tên tài liệu, người viết, năm (1968), địa điểm..."
                  className="w-full min-h-[48px] rounded-xl border border-[#CFC1AC] bg-[#FFFDF9] pl-11 pr-4 text-base text-[#241E18] placeholder:text-[#8A7D6D] focus:border-[#8F2D18] focus:outline-none focus:ring-2 focus:ring-[#8F2D18]/20"
                />
              </div>
              <button
                type="submit"
                className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl bg-[#8F2D18] px-6 text-sm font-medium text-white hover:bg-[#742312] transition-colors whitespace-nowrap shrink-0"
              >
                <span>Tra cứu kho</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#685D51]">
              <span>Gợi ý tìm nhanh:</span>
              {['Hà Nội', 'Nguyễn Văn Đức', '1974', 'Chưa rõ'].map((term) => (
                <button
                  key={term}
                  type="button"
                  onClick={() => onSearchSubmit(term)}
                  className="underline decoration-[#CFC1AC] underline-offset-4 hover:text-[#8F2D18] hover:decoration-[#8F2D18] py-1"
                >
                  {term}
                </button>
              ))}
            </div>
          </form>

          {/* Secondary Q&A prompt */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-t border-[#DFD6C7] pt-5">
            <p className="text-sm text-[#4A4036]">
              Muốn hỏi nhanh về nhân vật, sự kiện hoặc mối liên hệ giữa các tài liệu?
            </p>
            <button
              type="button"
              onClick={onOpenQa}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-lg border border-[#CFC1AC] bg-[#FFFDF9] px-4 py-2 text-sm font-medium text-[#241E18] hover:bg-[#F2EAE0] transition-colors whitespace-nowrap shrink-0"
            >
              <span>Mở trang Hỏi đáp gia đình</span>
              <ArrowRight className="h-4 w-4 text-[#8F2D18]" />
            </button>
          </div>
        </div>

        {/* Featured Archive Lead Card */}
        {featuredLead && (
          <div className="lg:col-span-5">
            <article className="archival-card h-full rounded-xl overflow-hidden flex flex-col">
              <div className="relative h-64 sm:h-72 bg-[#E8DEC9] overflow-hidden">
                {featuredLead.danhSachAnh[0] ? (
                  <img
                    src={featuredLead.danhSachAnh[0].tep}
                    alt={featuredLead.tenTaiLieu}
                    referrerPolicy="no-referrer"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-[#7C5832]">
                    <FileText className="h-12 w-12" />
                  </div>
                )}
              </div>
              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-[#685D51]">
                    <span className="font-mono-archival text-[#8F2D18]">{featuredLead.id}</span>
                    <span aria-hidden="true">·</span>
                    <span>{featuredLead.loaiTaiLieu}</span>
                    <span aria-hidden="true">·</span>
                    <span>{featuredLead.thoiGianTao}</span>
                  </div>
                  <h2 className="font-serif-display text-xl font-semibold text-[#241E18] leading-snug">
                    {featuredLead.tenTaiLieu}
                  </h2>
                  <p className="text-sm text-[#4A4036] leading-relaxed line-clamp-3">
                    {featuredLead.tomTat}
                  </p>
                  {featuredLead.danhSachAnh[0] && (
                    <p className="text-xs italic text-[#685D51] pt-1">
                      {featuredLead.danhSachAnh[0].chuThich} — {featuredLead.danhSachAnh[0].nguonAnh}
                    </p>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => onOpenDetail(featuredLead.id)}
                  className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-lg border border-[#8F2D18] bg-[#FAF6EE] px-4 text-sm font-medium text-[#8F2D18] hover:bg-[#8F2D18] hover:text-white transition-colors"
                >
                  <span>Xem bản gốc & phiên âm</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </article>
          </div>
        )}
      </section>

      {/* 4-Column Summary Strip (full-width below hero split) */}
      <section aria-label="Tổng quan kho lưu trữ" className="grid grid-cols-2 lg:grid-cols-4 gap-4 border-y border-[#DFD6C7] py-6">
        <div className="space-y-1">
          <p className="text-xs text-[#685D51]">Tổng số hồ sơ hiện có</p>
          <p className="text-2xl sm:text-3xl font-serif-display font-semibold text-[#241E18] tabular-nums">
            {records.length} tài liệu
          </p>
        </div>
        <div className="space-y-1">
          <p className="text-xs text-[#685D51]">Ảnh quét / chụp bảo quản</p>
          <p className="text-2xl sm:text-3xl font-serif-display font-semibold text-[#241E18] tabular-nums">
            {imageCount} bản ảnh
          </p>
        </div>
        <div className="space-y-1">
          <p className="text-xs text-[#685D51]">Đã kiểm chứng bản gốc</p>
          <p className="text-2xl sm:text-3xl font-serif-display font-semibold text-[#14532D] tabular-nums">
            {verifiedCount} hồ sơ
          </p>
        </div>
        <div className="space-y-1">
          <p className="text-xs text-[#685D51]">Đang chờ người thân đối chiếu</p>
          <p className="text-2xl sm:text-3xl font-serif-display font-semibold text-[#8F2D18] tabular-nums">
            {pendingCount} hồ sơ
          </p>
        </div>
      </section>

      {/* Featured Document Groups */}
      <section className="space-y-5">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="font-serif-display text-2xl sm:text-3xl font-semibold text-[#241E18]">
              Các nhóm tài liệu nổi bật
            </h2>
            <p className="mt-1 text-sm text-[#5C5145]">
              Chọn một nhóm tư liệu để xem danh sách hồ sơ, ảnh chụp và nội dung phiên âm liên quan.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onSearchSubmit('')}
            className="inline-flex min-h-[44px] items-center gap-1.5 text-sm font-medium text-[#8F2D18] hover:underline underline-offset-4 whitespace-nowrap"
          >
            <span>Xem toàn bộ kho tài liệu</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {FEATURED_GROUPS.map((group) => {
            const Icon = group.icon;
            const count = records.filter((r) => r.loaiTaiLieu === group.category).length;
            return (
              <button
                key={group.category}
                type="button"
                onClick={() => onSelectCategory(group.category)}
                className="archival-card group rounded-xl p-5 text-left hover:border-[#8F2D18] transition-colors flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#F2EAE0] text-[#8F2D18]">
                      <Icon className="h-5 w-5" />
                    </div>
                    <span className="text-xs font-mono-archival text-[#685D51] tabular-nums">
                      {count} hồ sơ
                    </span>
                  </div>
                  <h3 className="font-serif-display text-lg font-semibold text-[#241E18] group-hover:text-[#8F2D18] transition-colors">
                    {group.title}
                  </h3>
                  <p className="text-sm text-[#4A4036] leading-relaxed">
                    {group.description}
                  </p>
                </div>
                <span className="inline-flex items-center gap-1 text-xs font-medium text-[#8F2D18]">
                  <span>Mở nhóm tài liệu</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Records needing family verification */}
      <section className="space-y-5">
        <div>
          <h2 className="font-serif-display text-2xl font-semibold text-[#241E18]">
            Tư liệu cần người thân cùng xác nhận
          </h2>
          <p className="mt-1 text-sm text-[#5C5145]">
            Những tài liệu dưới đây còn chi tiết chưa rõ người viết, năm tạo hoặc danh tính nhân vật. Các bác, cô chú có thể mở xem và bổ sung ký ức.
          </p>
        </div>

        <div className="divide-y divide-[#DFD6C7] rounded-xl border border-[#DFD6C7] bg-[#FFFDF9]">
          {pendingVerificationRecords.map((rec) => {
            const isRestricted =
              rec.mucDoRiengTu === 'Hạn chế — Chỉ người lưu giữ' ||
              (rec.coThongTinNhayCam && !rec.daDuocPhepCongBo);
            return (
              <div
                key={rec.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 sm:p-5 hover:bg-[#FAF6EE] transition-colors"
              >
                <div className="space-y-1.5 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-[#685D51]">
                    <span className="font-mono-archival text-[#8F2D18]">{rec.id}</span>
                    <span aria-hidden="true">·</span>
                    <span>{rec.loaiTaiLieu}</span>
                    <span aria-hidden="true">·</span>
                    <span className="inline-flex items-center gap-1 text-[#9A3412]">
                      <Clock className="h-3.5 w-3.5" />
                      <span>{rec.mucKiemChung}</span>
                    </span>
                    {isRestricted ? (
                      <>
                        <span aria-hidden="true">·</span>
                        <span className="inline-flex items-center gap-1 text-[#7C2D12] font-medium">
                          <Lock className="h-3.5 w-3.5" />
                          <span>Hạn chế quyền truy cập</span>
                        </span>
                      </>
                    ) : (
                      <>
                        <span aria-hidden="true">·</span>
                        <span className="inline-flex items-center gap-1 text-[#14532D]">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          <span>{rec.mucDoRiengTu}</span>
                        </span>
                      </>
                    )}
                  </div>
                  <h3 className="font-serif-display text-lg font-semibold text-[#241E18]">
                    {rec.tenTaiLieu}
                  </h3>
                  <p className="text-sm text-[#4A4036] line-clamp-2">{rec.tomTat}</p>
                </div>

                <button
                  type="button"
                  onClick={() => onOpenDetail(rec.id)}
                  className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-lg border border-[#CFC1AC] bg-white px-4 text-sm font-medium text-[#241E18] hover:border-[#8F2D18] hover:text-[#8F2D18] transition-colors whitespace-nowrap shrink-0"
                >
                  <span>Xem & bổ sung</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            );
          })}
        </div>

        {/* Additional quick category link for Giấy chứng nhận */}
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-[#DFD6C7] bg-[#F5EFE4] p-4 sm:p-5">
          <div className="flex items-start gap-3">
            <Award className="h-5 w-5 text-[#8F2D18] mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-[#241E18]">
                Cũng có thể tra cứu theo Giấy chứng nhận, Giấy tờ cá nhân hoặc Tài liệu khác
              </p>
              <p className="text-xs text-[#5C5145] mt-0.5">
                Mỗi bản ghi đều lưu tách biệt bản quét gốc, nội dung phiên âm nguyên văn và bản biên tập chú thích.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onSelectCategory('Giấy chứng nhận')}
            className="inline-flex min-h-[44px] items-center gap-1.5 rounded-lg bg-[#241E18] px-4 text-xs font-medium text-white hover:bg-[#3A3128] whitespace-nowrap shrink-0"
          >
            <span>Xem Giấy chứng nhận</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </section>
    </div>
  );
};
