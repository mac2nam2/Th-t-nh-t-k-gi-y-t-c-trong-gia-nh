import React from 'react';
import {
  Download,
  ShieldCheck,
  Smartphone,
  Layers,
  GraduationCap,
} from 'lucide-react';

interface AboutScreenProps {
  largeText: boolean;
  onExportArchive: () => void;
}

export const AboutScreen: React.FC<AboutScreenProps> = ({
  largeText,
  onExportArchive,
}) => {
  return (
    <div className="max-w-4xl mx-auto space-y-10 pb-12">
      {/* Header */}
      <div className="border-b border-[#DFD6C7] pb-5 space-y-2">
        <p className="text-xs font-medium tracking-widest uppercase text-[#8F2D18]">
          Giới thiệu dự án & Hướng dẫn sử dụng
        </p>
        <h1 className="font-serif-display text-3xl sm:text-4xl font-semibold text-[#241E18]">
          Hồ Sơ Số Lưu Trữ Ký Ức Gia Đình
        </h1>
        <p
          className={`text-[#4A4036] leading-relaxed ${
            largeText ? 'text-lg' : 'text-base'
          }`}
        >
          Ứng dụng được xây dựng nhằm giúp các gia đình Việt Nam số hóa, bảo quản và tra cứu thư từ cũ, nhật ký, giấy khai sinh, văn bằng và ảnh kỷ niệm qua nhiều thế hệ, hạn chế nguy cơ thất lạc hoặc hư hỏng tài liệu giấy theo thời gian.
        </p>
      </div>

      {/* Required Internship & Social Project Credit */}
      <section className="rounded-xl border border-[#8F2D18]/40 bg-[#F5EFE4] p-6 space-y-3">
        <div className="flex items-center gap-2 text-[#8F2D18]">
          <GraduationCap className="h-5 w-5" />
          <h2 className="font-serif-display text-xl font-semibold text-[#241E18]">
            Thông tin tác giả & Dự án xã hội
          </h2>
        </div>
        <p
          className={`font-medium text-[#241E18] leading-relaxed ${
            largeText ? 'text-lg' : 'text-base'
          }`}
        >
          Sản phẩm thực tập của Mạc Văn Nam, mã sinh viên PH61940, Chương trình Thực tập sinh Học kỳ 15 - FPT Polytechnic và IMTA TECH, dự án xã hội phi lợi nhuận.
        </p>
        <p className="text-xs text-[#5C5145]">
          Hướng đến cộng đồng người lớn tuổi, con cháu trong gia đình và những người tìm hiểu lịch sử gia đình không cần kiến thức chuyên sâu về lưu trữ.
        </p>
      </section>

      {/* 3 Core Principles */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="archival-card rounded-xl p-5 space-y-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#F2EAE0] text-[#8F2D18]">
            <Layers className="h-5 w-5" />
          </div>
          <h3 className="font-serif-display text-lg font-semibold text-[#241E18]">
            Phân tách 3 lớp tư liệu
          </h3>
          <p className="text-sm text-[#4A4036] leading-relaxed">
            Luôn tách bạch rõ giữa <strong>Ảnh bản gốc</strong>, <strong>Bản phiên âm nguyên văn</strong> (giữ nguyên chỗ chữ mờ) và <strong>Nội dung đã biên tập</strong>. Không bao giờ tự ý sửa đổi bản gốc.
          </p>
        </div>

        <div className="archival-card rounded-xl p-5 space-y-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#F2EAE0] text-[#8F2D18]">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <h3 className="font-serif-display text-lg font-semibold text-[#241E18]">
            Trung thực & Bảo mật riêng tư
          </h3>
          <p className="text-sm text-[#4A4036] leading-relaxed">
            Thông tin chưa xác định được ghi rõ là &ldquo;Chưa rõ&rdquo;, không tự suy đoán. Giấy tờ có số giấy tờ, địa chỉ cá nhân được bảo vệ riêng tư ở chế độ hạn chế quyền truy cập.
          </p>
        </div>

        <div className="archival-card rounded-xl p-5 space-y-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#F2EAE0] text-[#8F2D18]">
            <Smartphone className="h-5 w-5" />
          </div>
          <h3 className="font-serif-display text-lg font-semibold text-[#241E18]">
            Thân thiện trên điện thoại
          </h3>
          <p className="text-sm text-[#4A4036] leading-relaxed">
            Nút bấm lớn, hỗ trợ bật cỡ chữ lớn cho người cao tuổi, xem phóng to chữ viết tay trực tiếp và chụp ảnh bổ sung tài liệu ngay trên điện thoại.
          </p>
        </div>
      </section>

      {/* Simple 3-Step Preservation Guide for Seniors */}
      <section className="archival-card rounded-xl p-6 space-y-4">
        <h2 className="font-serif-display text-2xl font-semibold text-[#241E18]">
          Hướng dẫn 3 bước lưu giữ tài liệu bằng điện thoại
        </h2>
        <ol className="space-y-4 text-sm text-[#3B332A] leading-relaxed">
          <li>
            <strong className="text-[#241E18]">Bước 1 — Đặt tài liệu trên mặt phẳng đủ sáng:</strong> Trải nhẹ bức thư, trang sổ hoặc tấm ảnh cạnh cửa sổ có ánh sáng tự nhiên ban ngày, tránh bật đèn flash gây chói.
          </li>
          <li>
            <strong className="text-[#241E18]">Bước 2 — Chụp và tải lên ở mục Kho tài liệu:</strong> Nhấn nút <em>&ldquo;Lưu trữ tài liệu mới&rdquo;</em>, chọn ảnh vừa chụp. Những mục chưa nhớ rõ năm hay tác giả cứ để trống để hệ thống ghi là <em>Chưa rõ</em>.
          </li>
          <li>
            <strong className="text-[#241E18]">Bước 3 — Nhờ AI gợi ý đọc chữ cũ & cùng gia đình kiểm chứng:</strong> Mở chi tiết tài liệu để nhờ Gemini hỗ trợ đọc chữ viết tay hoặc giải thích từ ngữ xưa, sau đó kiểm tra lại với người thân trước khi xác nhận lưu.
          </li>
        </ol>
      </section>

      {/* Export Entire Archive Section */}
      <section className="archival-card rounded-xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h2 className="font-serif-display text-xl font-semibold text-[#241E18]">
            Sao lưu và xuất toàn bộ hồ sơ dữ liệu
          </h2>
          <p className="text-sm text-[#5C5145]">
            Tải về toàn bộ tệp dữ liệu chuẩn hóa <span className="font-mono-archival text-[#8F2D18]">giadinh.json</span> (bảng mã UTF-8, chuẩn Dublin Core) để lưu dự phòng trên máy tính hoặc USB gia đình.
          </p>
        </div>
        <button
          type="button"
          onClick={onExportArchive}
          className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl bg-[#8F2D18] px-5 text-sm font-medium text-white hover:bg-[#742312] transition-colors whitespace-nowrap shrink-0"
        >
          <Download className="h-4 w-4" />
          <span>Xuất toàn bộ dữ liệu (giadinh.json)</span>
        </button>
      </section>
    </div>
  );
};
