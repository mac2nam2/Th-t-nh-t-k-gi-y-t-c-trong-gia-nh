import React, { useState } from 'react';
import {
  ArrowLeft,
  BookOpen,
  FileText,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  Clock,
  Lock,
  Globe,
  Users,
  ChevronDown,
  ChevronUp,
  Link2,
  Check,
  Loader2,
} from 'lucide-react';
import type {
  ArchiveRecord,
  GeminiAssistResult,
  VerificationStatus,
} from '../types/archive';
import { ZoomableImageViewer } from './ZoomableImageViewer';

interface DocumentDetailScreenProps {
  record: ArchiveRecord;
  allRecords: ArchiveRecord[];
  viewMode: 'public' | 'custodian';
  largeText: boolean;
  onBack: () => void;
  onOpenDetail: (id: string) => void;
  onSwitchToCustodian: () => void;
  onRecordUpdated: () => Promise<void>;
}

export const DocumentDetailScreen: React.FC<DocumentDetailScreenProps> = ({
  record,
  allRecords,
  viewMode,
  largeText,
  onBack,
  onOpenDetail,
  onSwitchToCustodian,
  onRecordUpdated,
}) => {
  const [activeTextTab, setActiveTextTab] = useState<'compare' | 'raw' | 'edited'>(
    'compare'
  );
  const [showDublinCore, setShowDublinCore] = useState(false);

  // Gemini assistant state (proposals only, never auto-saved)
  const [assistLoading, setAssistLoading] = useState<string | null>(null);
  const [assistError, setAssistError] = useState<string | null>(null);
  const [assistResult, setAssistResult] = useState<GeminiAssistResult | null>(
    null
  );
  const [editableProposal, setEditableProposal] = useState('');
  const [reviewerName, setReviewerName] = useState('');
  const [reviewerRelation, setReviewerRelation] = useState('');
  const [markVerified, setMarkVerified] = useState(false);
  const [isSavingProposal, setIsSavingProposal] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  const isRestrictedHidden =
    viewMode === 'public' &&
    (record.mucDoRiengTu === 'Hạn chế — Chỉ người lưu giữ' ||
      (record.coThongTinNhayCam && !record.daDuocPhepCongBo));

  const relatedDocs = allRecords.filter((r) =>
    record.taiLieuLienQuanIds.includes(r.id)
  );

  const runGeminiAssist = async (
    cheDo: 'phien_am' | 'giai_thich' | 'tom_tat' | 'lien_he'
  ) => {
    setAssistLoading(cheDo);
    setAssistError(null);
    setSaveMessage(null);
    try {
      const resp = await fetch('/api/gemini/assist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recordId: record.id,
          cheDo,
          viewMode,
        }),
      });
      const data = await resp.json();
      if (!resp.ok) {
        setAssistError(data.error || 'Không thể nhận đề xuất từ Gemini.');
        return;
      }
      setAssistResult(data as GeminiAssistResult);
      setEditableProposal(data.deXuatBienTap || '');
    } catch {
      setAssistError('Lỗi kết nối khi gọi trợ lý Gemini.');
    } finally {
      setAssistLoading(null);
    }
  };

  const handleConfirmProposal = async (
    target: 'edited' | 'note'
  ) => {
    if (!reviewerName.trim()) {
      setAssistError(
        'Vui lòng nhập họ tên người kiểm tra và xác nhận trước khi lưu.'
      );
      return;
    }
    if (!editableProposal.trim()) {
      setAssistError('Nội dung đề xuất đang trống.');
      return;
    }

    setIsSavingProposal(true);
    setAssistError(null);
    try {
      const payload: {
        nguoiThucHien: string;
        quanHe: string;
        hanhDong: string;
        noiDung: string;
        capNhatBienTap?: string;
        capNhatGhiChu?: string;
        capNhatKiemChung?: VerificationStatus;
        themTuNgu?: { tuNgu: string; giaiThich: string }[];
        themLienKetId?: string;
      } = {
        nguoiThucHien: reviewerName.trim(),
        quanHe: reviewerRelation.trim() || 'Thành viên kiểm chứng',
        hanhDong:
          target === 'edited'
            ? 'Xác nhận và lưu đề xuất biên tập (không sửa bản gốc)'
            : 'Xác nhận và bổ sung ghi chú tham khảo',
        noiDung: `Đã đối chiếu đề xuất hỗ trợ từ AI và xác nhận lưu vào ${
          target === 'edited' ? 'nội dung đã biên tập' : 'ghi chú hồ sơ'
        }.`,
      };

      if (target === 'edited') {
        payload.capNhatBienTap = editableProposal.trim();
      } else {
        payload.capNhatGhiChu = editableProposal.trim();
      }

      if (markVerified) {
        payload.capNhatKiemChung = 'Đã kiểm chứng';
      }

      if (assistResult?.tuNguCu && assistResult.tuNguCu.length > 0) {
        payload.themTuNgu = assistResult.tuNguCu;
      }
      if (assistResult?.lienKetGoiY && assistResult.lienKetGoiY[0]?.maTaiLieu) {
        payload.themLienKetId = assistResult.lienKetGoiY[0].maTaiLieu;
      }

      const resp = await fetch(`/api/records/${record.id}/contribute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await resp.json();
      if (!resp.ok) {
        setAssistError(data.error || 'Không thể lưu đề xuất đã xác nhận.');
        return;
      }
      await onRecordUpdated();
      setSaveMessage(
        'Đã lưu nội dung sau khi bạn kiểm tra và xác nhận. Bản phiên âm nguyên văn và ảnh gốc vẫn được giữ nguyên.'
      );
      setAssistResult(null);
    } catch {
      setAssistError('Lỗi kết nối khi lưu xác nhận.');
    } finally {
      setIsSavingProposal(false);
    }
  };

  const displayOrUnknown = (val: string | null | undefined) => {
    if (!val || !val.trim()) return 'Chưa có thông tin';
    return val;
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Breadcrumb & Header */}
      <div className="space-y-4 border-b border-[#DFD6C7] pb-6">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex min-h-[44px] items-center gap-2 text-sm font-medium text-[#8F2D18] hover:underline underline-offset-4"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Quay lại Kho tài liệu</span>
        </button>

        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2.5 text-xs text-[#685D51]">
            <span className="font-mono-archival font-semibold text-[#8F2D18]">
              {record.id}
            </span>
            <span aria-hidden="true">·</span>
            <span>{record.loaiTaiLieu}</span>
            <span aria-hidden="true">·</span>
            <span>{displayOrUnknown(record.thoiGianTao)}</span>
            <span aria-hidden="true">·</span>
            {record.mucKiemChung === 'Đã kiểm chứng' ? (
              <span className="inline-flex items-center gap-1 font-medium text-[#14532D]">
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>Đã kiểm chứng bản gốc</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 font-medium text-[#9A3412]">
                <Clock className="h-3.5 w-3.5" />
                <span>{record.mucKiemChung}</span>
              </span>
            )}
            <span aria-hidden="true">·</span>
            {record.mucDoRiengTu === 'Hạn chế — Chỉ người lưu giữ' ||
            record.mucDoRiengTu === 'Nội bộ dòng họ' ? (
              <span className="inline-flex items-center gap-1 font-medium text-[#8F2D18]">
                <Lock className="h-3.5 w-3.5" />
                <span>{record.mucDoRiengTu}</span>
              </span>
            ) : record.mucDoRiengTu === 'Công khai rộng rãi' ? (
              <span className="inline-flex items-center gap-1 font-medium text-[#14532D]">
                <Globe className="h-3.5 w-3.5" />
                <span>Công khai rộng rãi</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[#5C5145]">
                <Users className="h-3.5 w-3.5" />
                <span>{record.mucDoRiengTu}</span>
              </span>
            )}
          </div>

          <h1
            className={`font-serif-display font-semibold text-[#241E18] leading-tight ${
              largeText ? 'text-3xl sm:text-4xl' : 'text-2xl sm:text-3xl'
            }`}
          >
            {record.tenTaiLieu}
          </h1>

          {record.laDuLieuMau && (
            <p className="text-xs text-[#685D51] bg-[#F2EAE0] border border-[#DFD6C7] rounded-lg px-3.5 py-2 inline-block">
              Lưu ý minh họa: Đây là bản ghi mẫu khởi tạo phục vụ trải nghiệm xem phóng to và đối chiếu phiên âm, không phải hiện vật lịch sử thật.
            </p>
          )}
        </div>
      </div>

      {/* Main Split: Left = Original Image Viewer, Right = Metadata & Layered Text */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column (7 cols on lg): Original Scan + Zoom */}
        <div className="lg:col-span-6 space-y-6">
          <section aria-label="Ảnh chụp hoặc bản quét gốc">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-serif-display text-xl font-semibold text-[#241E18]">
                1. Ảnh tài liệu gốc (Bản quét / Ảnh chụp)
              </h2>
              <span className="text-xs text-[#685D51]">
                Nhấn để phóng to đọc chữ nhỏ
              </span>
            </div>
            <ZoomableImageViewer
              images={record.danhSachAnh}
              title={record.tenTaiLieu}
              isRestrictedHidden={isRestrictedHidden}
              onRequestCustodianMode={onSwitchToCustodian}
            />
          </section>

          {/* Metadata Table */}
          <section className="archival-card rounded-xl p-5 space-y-4">
            <h2 className="font-serif-display text-xl font-semibold text-[#241E18]">
              Thông tin mô tả & bảo quản
            </h2>

            <dl className="divide-y divide-[#EAE1D3] text-sm">
              <div className="py-2.5 grid grid-cols-3 gap-3">
                <dt className="text-[#685D51]">Người viết / tạo</dt>
                <dd className="col-span-2 font-medium text-[#241E18]">
                  {displayOrUnknown(record.nguoiTao)}
                </dd>
              </div>
              <div className="py-2.5 grid grid-cols-3 gap-3">
                <dt className="text-[#685D51]">Người nhận</dt>
                <dd className="col-span-2 text-[#241E18]">
                  {displayOrUnknown(record.nguoiNhan)}
                </dd>
              </div>
              <div className="py-2.5 grid grid-cols-3 gap-3">
                <dt className="text-[#685D51]">Thời gian tạo</dt>
                <dd className="col-span-2 text-[#241E18]">
                  {displayOrUnknown(record.thoiGianTao)}
                </dd>
              </div>
              <div className="py-2.5 grid grid-cols-3 gap-3">
                <dt className="text-[#685D51]">Địa điểm</dt>
                <dd className="col-span-2 text-[#241E18]">
                  {displayOrUnknown(record.diaDiem)}
                </dd>
              </div>
              <div className="py-2.5 grid grid-cols-3 gap-3">
                <dt className="text-[#685D51]">Ngôn ngữ</dt>
                <dd className="col-span-2 text-[#241E18]">
                  {displayOrUnknown(record.ngonNgu)}
                </dd>
              </div>
              <div className="py-2.5 grid grid-cols-3 gap-3">
                <dt className="text-[#685D51]">Tình trạng vật lý</dt>
                <dd className="col-span-2 text-[#241E18] leading-relaxed">
                  {displayOrUnknown(record.tinhTrangTaiLieu)}
                </dd>
              </div>
              <div className="py-2.5 grid grid-cols-3 gap-3">
                <dt className="text-[#685D51]">Người lưu giữ hiện nay</dt>
                <dd className="col-span-2 font-medium text-[#241E18]">
                  {displayOrUnknown(record.nguoiLuuGiu)}
                </dd>
              </div>
              <div className="py-2.5 grid grid-cols-3 gap-3">
                <dt className="text-[#685D51]">Nguồn gốc tài liệu</dt>
                <dd className="col-span-2 text-[#241E18] leading-relaxed">
                  {displayOrUnknown(record.nguonGoc)}
                </dd>
              </div>
              <div className="py-2.5 grid grid-cols-3 gap-3">
                <dt className="text-[#685D51]">Phạm vi công bố</dt>
                <dd className="col-span-2 text-[#241E18] leading-relaxed">
                  {displayOrUnknown(record.phamViCongBo)}
                </dd>
              </div>
              <div className="py-2.5 grid grid-cols-3 gap-3">
                <dt className="text-[#685D51]">Ghi chú lưu trữ</dt>
                <dd className="col-span-2 text-[#4A4036] whitespace-pre-line leading-relaxed">
                  {displayOrUnknown(record.ghiChu)}
                </dd>
              </div>
            </dl>

            {/* Expandable Dublin Core technical block */}
            <div className="border-t border-[#DFD6C7] pt-3">
              <button
                type="button"
                onClick={() => setShowDublinCore((s) => !s)}
                className="flex min-h-[44px] w-full items-center justify-between text-xs font-medium text-[#5C5145] hover:text-[#8F2D18]"
              >
                <span>Xem đầy đủ 15 trường chuẩn Dublin Core (dành cho tra cứu lưu trữ)</span>
                {showDublinCore ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </button>
              {showDublinCore && (
                <dl className="mt-3 grid grid-cols-1 gap-2 rounded-lg bg-[#FAF6EE] border border-[#E4D7C5] p-3.5 text-xs">
                  {Object.entries(record.dublinCore).map(([key, value]) => (
                    <div key={key} className="grid grid-cols-3 gap-2">
                      <dt className="font-mono-archival text-[#8F2D18]">dc.{key}</dt>
                      <dd className="col-span-2 text-[#241E18] break-words">
                        {value || 'Chưa có thông tin'}
                      </dd>
                    </div>
                  ))}
                </dl>
              )}
            </div>
          </section>
        </div>

        {/* Right Column (6 cols on lg): Clear Visual Separation of Raw Transcription vs Edited Text + Gemini Tools */}
        <div className="lg:col-span-6 space-y-6">
          {/* Summary */}
          <section className="archival-card rounded-xl p-5 space-y-2">
            <h2 className="font-serif-display text-lg font-semibold text-[#241E18]">
              Tóm tắt nội dung
            </h2>
            <p
              className={`text-[#3B332A] leading-relaxed ${
                largeText ? 'text-base' : 'text-sm'
              }`}
            >
              {displayOrUnknown(record.tomTat)}
            </p>
          </section>

          {/* Visual Distinction Tabs: Original Transcription vs Edited Version */}
          <section className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-serif-display text-xl font-semibold text-[#241E18]">
                2. Phiên âm gốc & Nội dung đã biên tập
              </h2>
              <div className="flex items-center gap-1 rounded-lg bg-[#EAE1D3] p-1">
                <button
                  type="button"
                  onClick={() => setActiveTextTab('compare')}
                  className={`min-h-[36px] rounded-md px-2.5 text-xs font-medium transition-colors whitespace-nowrap ${
                    activeTextTab === 'compare'
                      ? 'bg-white text-[#241E18] shadow-sm'
                      : 'text-[#5C5145] hover:text-[#241E18]'
                  }`}
                >
                  Hiển thị tách biệt
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTextTab('raw')}
                  className={`min-h-[36px] rounded-md px-2.5 text-xs font-medium transition-colors whitespace-nowrap ${
                    activeTextTab === 'raw'
                      ? 'bg-white text-[#241E18] shadow-sm'
                      : 'text-[#5C5145] hover:text-[#241E18]'
                  }`}
                >
                  Chỉ phiên âm gốc
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTextTab('edited')}
                  className={`min-h-[36px] rounded-md px-2.5 text-xs font-medium transition-colors whitespace-nowrap ${
                    activeTextTab === 'edited'
                      ? 'bg-white text-[#241E18] shadow-sm'
                      : 'text-[#5C5145] hover:text-[#241E18]'
                  }`}
                >
                  Chỉ bản biên tập
                </button>
              </div>
            </div>

            {/* Layer A: Raw Diplomatic Transcription */}
            {(activeTextTab === 'compare' || activeTextTab === 'raw') && (
              <div className="rounded-xl border border-[#CDBEAA] bg-[#F4ECE0] p-5 space-y-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#DFD2BF] pb-2">
                  <div className="flex items-center gap-2 text-xs font-semibold text-[#7C2D12]">
                    <FileText className="h-4 w-4" />
                    <span>BẢN PHIÊN ÂM NGUYÊN VĂN (GIỮ NGUYÊN CHỮ MỜ / CHƯA RÕ)</span>
                  </div>
                  <span className="text-[11px] text-[#685D51]">
                    Không tự ý sửa đổi bản gốc
                  </span>
                </div>
                <pre
                  className={`whitespace-pre-wrap font-mono-archival text-[#241E18] leading-relaxed ${
                    largeText ? 'text-base' : 'text-[14px]'
                  }`}
                >
                  {displayOrUnknown(record.noiDungPhienAm)}
                </pre>
              </div>
            )}

            {/* Layer B: Edited Reading Version */}
            {(activeTextTab === 'compare' || activeTextTab === 'edited') && (
              <div className="rounded-xl border border-[#D4C7B4] bg-[#FFFDF9] p-5 space-y-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#EAE1D3] pb-2">
                  <div className="flex items-center gap-2 text-xs font-semibold text-[#14532D]">
                    <BookOpen className="h-4 w-4" />
                    <span>NỘI DUNG ĐÃ BIÊN TẬP (DỄ ĐỌC & CÓ CHÚ THÍCH)</span>
                  </div>
                  <span className="text-[11px] text-[#685D51]">
                    Đã qua kiểm tra của người lưu giữ
                  </span>
                </div>
                <p
                  className={`text-[#241E18] leading-relaxed ${
                    largeText ? 'text-lg' : 'text-base'
                  }`}
                >
                  {displayOrUnknown(record.noiDungBienTap)}
                </p>
              </div>
            )}
          </section>

          {/* Glossary of old terms */}
          {record.chuThichTuNgu.length > 0 && (
            <section className="archival-card rounded-xl p-5 space-y-3">
              <h3 className="font-serif-display text-lg font-semibold text-[#241E18]">
                Giải thích từ ngữ cũ trong tài liệu
              </h3>
              <dl className="space-y-2.5 text-sm">
                {record.chuThichTuNgu.map((item, idx) => (
                  <div key={idx} className="border-b border-[#EAE1D3] pb-2 last:border-b-0 last:pb-0">
                    <dt className="font-semibold text-[#8F2D18]">{item.tuNgu}</dt>
                    <dd className="text-[#4A4036] mt-0.5 leading-relaxed">
                      {item.giaiThich}
                    </dd>
                  </div>
                ))}
              </dl>
            </section>
          )}

          {/* Gemini Assistant Section */}
          <section className="rounded-xl border border-[#CDBEAA] bg-[#FAF6EE] p-5 space-y-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-[#8F2D18]">
                <Sparkles className="h-4 w-4" />
                <h2 className="font-serif-display text-xl font-semibold text-[#241E18]">
                  3. Nhờ Gemini hỗ trợ đọc và đối chiếu tài liệu
                </h2>
              </div>
              <p className="text-xs leading-relaxed text-[#5C5145]">
                Mọi kết quả do Gemini tạo ra chỉ là đề xuất tham khảo, phân biệt rõ phần đọc chắc chắn và phần chưa rõ. Hệ thống không tự động sửa tài liệu gốc nếu chưa có xác nhận của bạn.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <button
                type="button"
                disabled={Boolean(assistLoading)}
                onClick={() => runGeminiAssist('phien_am')}
                className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-lg border border-[#CFC1AC] bg-white px-3.5 py-2 text-xs font-medium text-[#241E18] hover:border-[#8F2D18] hover:text-[#8F2D18] disabled:opacity-50 transition-colors"
              >
                {assistLoading === 'phien_am' && (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                )}
                <span>Hỗ trợ phiên âm chữ viết tay</span>
              </button>
              <button
                type="button"
                disabled={Boolean(assistLoading)}
                onClick={() => runGeminiAssist('giai_thich')}
                className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-lg border border-[#CFC1AC] bg-white px-3.5 py-2 text-xs font-medium text-[#241E18] hover:border-[#8F2D18] hover:text-[#8F2D18] disabled:opacity-50 transition-colors"
              >
                {assistLoading === 'giai_thich' && (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                )}
                <span>Giải thích từ ngữ cũ</span>
              </button>
              <button
                type="button"
                disabled={Boolean(assistLoading)}
                onClick={() => runGeminiAssist('tom_tat')}
                className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-lg border border-[#CFC1AC] bg-white px-3.5 py-2 text-xs font-medium text-[#241E18] hover:border-[#8F2D18] hover:text-[#8F2D18] disabled:opacity-50 transition-colors"
              >
                {assistLoading === 'tom_tat' && (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                )}
                <span>Đề xuất tóm tắt nội dung</span>
              </button>
              <button
                type="button"
                disabled={Boolean(assistLoading)}
                onClick={() => runGeminiAssist('lien_he')}
                className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-lg border border-[#CFC1AC] bg-white px-3.5 py-2 text-xs font-medium text-[#241E18] hover:border-[#8F2D18] hover:text-[#8F2D18] disabled:opacity-50 transition-colors"
              >
                {assistLoading === 'lien_he' && (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                )}
                <span>Gợi ý mối liên hệ tài liệu</span>
              </button>
            </div>

            {assistError && (
              <div className="flex items-start gap-2 rounded-lg border border-[#8F2D18] bg-[#FEF2F2] p-3 text-xs text-[#8F2D18]">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{assistError}</span>
              </div>
            )}

            {saveMessage && (
              <div className="flex items-start gap-2 rounded-lg border border-[#14532D] bg-[#F0FDF4] p-3 text-xs text-[#14532D]">
                <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{saveMessage}</span>
              </div>
            )}

            {assistResult && (
              <div className="space-y-4 rounded-xl border border-[#8F2D18]/40 bg-white p-4">
                <div className="flex items-center justify-between border-b border-[#EAE1D3] pb-2">
                  <span className="text-xs font-semibold text-[#8F2D18]">
                    ĐỀ XUẤT TỪ GEMINI — CHƯA LƯU VÀO HỒ SƠ GỐC
                  </span>
                  <button
                    type="button"
                    onClick={() => setAssistResult(null)}
                    className="text-xs text-[#685D51] hover:text-[#241E18]"
                  >
                    Đóng đề xuất
                  </button>
                </div>

                {/* Clear separation of certain vs uncertain content */}
                <div className="space-y-3 text-sm">
                  <div className="rounded-lg bg-[#F0FDF4] border border-[#BBF7D0] p-3">
                    <p className="text-xs font-semibold text-[#14532D] mb-1">
                      Nội dung đọc được chắc chắn / có căn cứ rõ:
                    </p>
                    <p className="text-[#1F2937] whitespace-pre-line leading-relaxed">
                      {assistResult.noiDungChacChan}
                    </p>
                  </div>

                  <div className="rounded-lg bg-[#FFFBEB] border border-[#FDE68A] p-3">
                    <p className="text-xs font-semibold text-[#92400E] mb-1">
                      Phần chữ mờ / chưa rõ / cần đối chiếu thêm:
                    </p>
                    <p className="text-[#1F2937] whitespace-pre-line leading-relaxed">
                      {assistResult.noiDungChuaRo}
                    </p>
                  </div>

                  {assistResult.tuNguCu && assistResult.tuNguCu.length > 0 && (
                    <div className="rounded-lg bg-[#FAF6EE] border border-[#DFD6C7] p-3">
                      <p className="text-xs font-semibold text-[#241E18] mb-1.5">
                        Đề xuất giải thích từ ngữ cũ:
                      </p>
                      <ul className="space-y-1 text-xs text-[#4A4036]">
                        {assistResult.tuNguCu.map((t, i) => (
                          <li key={i}>
                            <strong>{t.tuNgu}:</strong> {t.giaiThich}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {assistResult.lienKetGoiY &&
                    assistResult.lienKetGoiY.length > 0 && (
                      <div className="rounded-lg bg-[#FAF6EE] border border-[#DFD6C7] p-3 space-y-2">
                        <p className="text-xs font-semibold text-[#241E18]">
                          Gợi ý mối liên hệ với tài liệu khác:
                        </p>
                        {assistResult.lienKetGoiY.map((lk, i) => (
                          <div
                            key={i}
                            className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs border-t border-[#EAE1D3] pt-2 first:border-t-0 first:pt-0"
                          >
                            <div>
                              <span className="font-mono-archival font-semibold text-[#8F2D18]">
                                {lk.maTaiLieu}
                              </span>{' '}
                              <span className="font-medium text-[#241E18]">
                                — {lk.tenTaiLieu}
                              </span>
                              <p className="text-[#5C5145] mt-0.5">
                                {lk.lyDoLienQuan}
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => onOpenDetail(lk.maTaiLieu)}
                              className="text-[#8F2D18] underline whitespace-nowrap shrink-0 self-start sm:self-center"
                            >
                              Mở xem
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                  <p className="text-xs italic text-[#5C5145]">
                    Khuyến nghị kiểm chứng: {assistResult.luuYKiemChung}
                  </p>
                </div>

                {/* Human confirmation & editing form */}
                <div className="border-t border-[#EAE1D3] pt-4 space-y-3">
                  <label className="block text-xs font-semibold text-[#241E18]">
                    Chỉnh sửa đề xuất trước khi xác nhận lưu (tùy chọn):
                  </label>
                  <textarea
                    rows={4}
                    value={editableProposal}
                    onChange={(e) => setEditableProposal(e.target.value)}
                    className="w-full rounded-lg border border-[#CFC1AC] bg-[#FAF6EE] p-3 text-sm text-[#241E18]"
                  />

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input
                      type="text"
                      value={reviewerName}
                      onChange={(e) => setReviewerName(e.target.value)}
                      placeholder="Họ tên người kiểm tra & xác nhận *"
                      className="min-h-[44px] rounded-lg border border-[#CFC1AC] bg-white px-3 text-sm"
                    />
                    <input
                      type="text"
                      value={reviewerRelation}
                      onChange={(e) => setReviewerRelation(e.target.value)}
                      placeholder="Quan hệ gia đình (vd: Con trai, Cháu...)"
                      className="min-h-[44px] rounded-lg border border-[#CFC1AC] bg-white px-3 text-sm"
                    />
                  </div>

                  <label className="flex items-center gap-2 text-xs text-[#4A4036]">
                    <input
                      type="checkbox"
                      checked={markVerified}
                      onChange={(e) => setMarkVerified(e.target.checked)}
                      className="h-4 w-4 rounded border-[#CFC1AC]"
                    />
                    <span>
                      Đánh dấu hồ sơ này thành &ldquo;Đã kiểm chứng&rdquo; sau khi đối chiếu bản gốc
                    </span>
                  </label>

                  <div className="flex flex-wrap gap-2.5 pt-1">
                    <button
                      type="button"
                      disabled={isSavingProposal}
                      onClick={() => handleConfirmProposal('edited')}
                      className="inline-flex min-h-[44px] items-center gap-1.5 rounded-lg bg-[#8F2D18] px-4 text-xs font-medium text-white hover:bg-[#742312] disabled:opacity-50"
                    >
                      <Check className="h-4 w-4" />
                      <span>Xác nhận lưu thành Nội dung đã biên tập</span>
                    </button>
                    <button
                      type="button"
                      disabled={isSavingProposal}
                      onClick={() => handleConfirmProposal('note')}
                      className="inline-flex min-h-[44px] items-center gap-1.5 rounded-lg border border-[#CFC1AC] bg-white px-4 text-xs font-medium text-[#241E18] hover:bg-[#F2EAE0] disabled:opacity-50"
                    >
                      <span>Lưu vào Ghi chú tham khảo</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </section>

          {/* Related Records */}
          {relatedDocs.length > 0 && (
            <section className="archival-card rounded-xl p-5 space-y-3">
              <div className="flex items-center gap-2">
                <Link2 className="h-4 w-4 text-[#8F2D18]" />
                <h3 className="font-serif-display text-lg font-semibold text-[#241E18]">
                  Tài liệu liên quan trong kho gia đình
                </h3>
              </div>
              <div className="divide-y divide-[#EAE1D3]">
                {relatedDocs.map((rel) => (
                  <button
                    key={rel.id}
                    type="button"
                    onClick={() => onOpenDetail(rel.id)}
                    className="w-full py-2.5 text-left hover:text-[#8F2D18] transition-colors flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <span className="font-mono-archival text-xs text-[#8F2D18] mr-2">
                        {rel.id}
                      </span>
                      <span className="text-sm font-medium text-[#241E18]">
                        {rel.tenTaiLieu}
                      </span>
                    </div>
                    <span className="text-xs text-[#685D51] whitespace-nowrap">
                      {rel.thoiGianTao}
                    </span>
                  </button>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
};
