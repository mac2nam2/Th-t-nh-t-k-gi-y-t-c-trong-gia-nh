import React, { useMemo, useState } from 'react';
import {
  History,
  UserCheck,
  FolderArchive,
  PlusCircle,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import type { ArchiveRecord, VerificationStatus } from '../types/archive';

interface ProvenanceScreenProps {
  records: ArchiveRecord[];
  largeText: boolean;
  onOpenDetail: (id: string) => void;
  onContributionSaved: () => Promise<void>;
}

export const ProvenanceScreen: React.FC<ProvenanceScreenProps> = ({
  records,
  largeText,
  onOpenDetail,
  onContributionSaved,
}) => {
  const [selectedDocId, setSelectedDocId] = useState(records[0]?.id || '');
  const [contributorName, setContributorName] = useState('');
  const [relation, setRelation] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [identifiedCreator, setIdentifiedCreator] = useState('');
  const [newVerification, setNewVerification] = useState<
    VerificationStatus | ''
  >('');
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const timelineEntries = useMemo(() => {
    const rows: {
      id: string;
      ngay: string;
      docId: string;
      docTitle: string;
      nguoiThucHien: string;
      quanHe: string;
      hanhDong: string;
      noiDung: string;
    }[] = [];

    for (const rec of records) {
      for (const item of rec.lichSuBoSung) {
        rows.push({
          ...item,
          docId: rec.id,
          docTitle: rec.tenTaiLieu,
        });
      }
    }

    return rows.sort((a, b) => b.ngay.localeCompare(a.ngay));
  }, [records]);

  const handleSubmitContribution = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDocId || !contributorName.trim() || !noteContent.trim()) {
      setFeedback({
        type: 'error',
        text: 'Vui lòng chọn tài liệu, nhập họ tên người đóng góp và nội dung bổ sung.',
      });
      return;
    }

    setIsSaving(true);
    setFeedback(null);
    try {
      const resp = await fetch(`/api/records/${selectedDocId}/contribute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nguoiThucHien: contributorName.trim(),
          quanHe: relation.trim() || 'Thành viên gia đình',
          hanhDong: 'Đóng góp bổ sung thông tin qua trang Nguồn tư liệu',
          noiDung: noteContent.trim(),
          capNhatGhiChu: noteContent.trim(),
          capNhatNguoiTao: identifiedCreator.trim() || undefined,
          capNhatKiemChung: newVerification || undefined,
        }),
      });
      const data = await resp.json();
      if (!resp.ok) {
        setFeedback({
          type: 'error',
          text: data.error || 'Không thể lưu đóng góp.',
        });
        return;
      }
      await onContributionSaved();
      setContributorName('');
      setRelation('');
      setNoteContent('');
      setIdentifiedCreator('');
      setNewVerification('');
      setFeedback({
        type: 'success',
        text: 'Đã ghi nhận đóng góp của bạn vào lịch sử bổ sung trong giadinh.json.',
      });
    } catch {
      setFeedback({
        type: 'error',
        text: 'Lỗi kết nối khi lưu thông tin đóng góp.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-10 pb-12">
      {/* Page Title */}
      <div className="border-b border-[#DFD6C7] pb-5 space-y-2">
        <p className="text-xs font-medium tracking-widest uppercase text-[#8F2D18]">
          Minh bạch xuất xứ & người gìn giữ
        </p>
        <h1 className="font-serif-display text-3xl font-semibold text-[#241E18]">
          Nguồn tư liệu và Ghi nhận đóng góp
        </h1>
        <p className="text-sm text-[#4A4036] max-w-3xl leading-relaxed">
          Mỗi tài liệu đều ghi nhận rõ xuất xứ ban đầu, người đang lưu giữ bản gốc ngoài đời thực và lịch sử từng lần thành viên bổ sung, đối chiếu thông tin.
        </p>
      </div>

      {/* Provenance & Custodians Table/Cards */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <FolderArchive className="h-5 w-5 text-[#8F2D18]" />
          <h2 className="font-serif-display text-2xl font-semibold text-[#241E18]">
            Bảng nguồn gốc và người lưu giữ hiện nay
          </h2>
        </div>

        <div className="overflow-x-auto rounded-xl border border-[#DFD6C7] bg-[#FFFDF9]">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-[#DFD6C7] bg-[#F5EFE4] text-xs font-semibold text-[#4A4036]">
                <th className="py-3.5 px-4 whitespace-nowrap">Mã TL</th>
                <th className="py-3.5 px-4">Tên tài liệu</th>
                <th className="py-3.5 px-4">Nguồn gốc (Xuất xứ)</th>
                <th className="py-3.5 px-4">Người lưu giữ hiện nay</th>
                <th className="py-3.5 px-4">Người đóng góp số hóa</th>
                <th className="py-3.5 px-4 whitespace-nowrap">Kiểm chứng</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EAE1D3]">
              {records.map((rec) => (
                <tr key={rec.id} className="hover:bg-[#FAF6EE] transition-colors">
                  <td className="py-3.5 px-4 font-mono-archival text-xs font-semibold text-[#8F2D18] whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => onOpenDetail(rec.id)}
                      className="hover:underline"
                    >
                      {rec.id}
                    </button>
                  </td>
                  <td className="py-3.5 px-4 font-medium text-[#241E18]">
                    <button
                      type="button"
                      onClick={() => onOpenDetail(rec.id)}
                      className="text-left hover:text-[#8F2D18] transition-colors"
                    >
                      {rec.tenTaiLieu}
                    </button>
                  </td>
                  <td className="py-3.5 px-4 text-[#4A4036]">{rec.nguonGoc}</td>
                  <td className="py-3.5 px-4 text-[#241E18] font-medium">
                    {rec.nguoiLuuGiu}
                  </td>
                  <td className="py-3.5 px-4 text-[#5C5145]">
                    {rec.dublinCore.contributor || 'Chưa có thông tin'}
                  </td>
                  <td className="py-3.5 px-4 text-xs whitespace-nowrap">
                    {rec.mucKiemChung}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Split: Contribution History + Supplement Form */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Contribution History */}
        <section className="lg:col-span-7 space-y-4">
          <div className="flex items-center gap-2">
            <History className="h-5 w-5 text-[#8F2D18]" />
            <h2 className="font-serif-display text-2xl font-semibold text-[#241E18]">
              Lịch sử bổ sung và xác nhận thông tin
            </h2>
          </div>

          <div className="divide-y divide-[#DFD6C7] rounded-xl border border-[#DFD6C7] bg-[#FFFDF9]">
            {timelineEntries.map((entry) => (
              <div key={entry.id} className="p-4 sm:p-5 space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[#685D51]">
                  <div className="flex items-center gap-2">
                    <span className="font-mono-archival text-[#8F2D18] font-medium tabular-nums">
                      {entry.ngay}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span className="font-semibold text-[#241E18]">
                      {entry.nguoiThucHien}
                    </span>
                    <span>({entry.quanHe})</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => onOpenDetail(entry.docId)}
                    className="inline-flex items-center gap-1 font-mono-archival text-[#8F2D18] hover:underline"
                  >
                    <span>{entry.docId}</span>
                    <ArrowRight className="h-3 w-3" />
                  </button>
                </div>

                <p className="text-xs font-medium text-[#5C5145]">
                  {entry.hanhDong} — {entry.docTitle}
                </p>
                <p
                  className={`text-[#241E18] leading-relaxed ${
                    largeText ? 'text-base' : 'text-sm'
                  }`}
                >
                  {entry.noiDung}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Supplement Form */}
        <section className="lg:col-span-5 archival-card rounded-xl p-5 sm:p-6 space-y-4">
          <div className="flex items-center gap-2">
            <PlusCircle className="h-5 w-5 text-[#8F2D18]" />
            <h2 className="font-serif-display text-xl font-semibold text-[#241E18]">
              Đóng góp ký ức & xác nhận chi tiết
            </h2>
          </div>
          <p className="text-xs text-[#5C5145] leading-relaxed">
            Nếu cô bác hoặc anh chị nhận ra chữ viết tay, người trong ảnh hoặc nhớ rõ hoàn cảnh của một tài liệu đang ghi &ldquo;Chưa rõ&rdquo;, hãy ghi lại tại đây.
          </p>

          {feedback && (
            <div
              className={`flex items-start gap-2 rounded-lg border p-3 text-xs ${
                feedback.type === 'success'
                  ? 'border-[#14532D] bg-[#F0FDF4] text-[#14532D]'
                  : 'border-[#8F2D18] bg-[#FEF2F2] text-[#8F2D18]'
              }`}
            >
              {feedback.type === 'success' ? (
                <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              )}
              <span>{feedback.text}</span>
            </div>
          )}

          <form onSubmit={handleSubmitContribution} className="space-y-3.5">
            <div>
              <label className="block text-xs font-medium text-[#241E18] mb-1">
                Chọn tài liệu cần bổ sung *
              </label>
              <select
                value={selectedDocId}
                onChange={(e) => setSelectedDocId(e.target.value)}
                className="w-full min-h-[44px] rounded-lg border border-[#CFC1AC] bg-[#FAF6EE] px-3 text-sm"
              >
                {records.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.id} — {r.tenTaiLieu}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#241E18] mb-1">
                Họ tên người đóng góp *
              </label>
              <input
                type="text"
                required
                value={contributorName}
                onChange={(e) => setContributorName(e.target.value)}
                placeholder="Ví dụ: Bác Trần Văn Bình"
                className="w-full min-h-[44px] rounded-lg border border-[#CFC1AC] bg-white px-3 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#241E18] mb-1">
                Quan hệ trong gia đình
              </label>
              <input
                type="text"
                value={relation}
                onChange={(e) => setRelation(e.target.value)}
                placeholder="Ví dụ: Cháu nội, Em gái, Con rể..."
                className="w-full min-h-[44px] rounded-lg border border-[#CFC1AC] bg-white px-3 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#241E18] mb-1">
                Xác nhận người viết / người tạo (nếu trước đây chưa rõ)
              </label>
              <input
                type="text"
                value={identifiedCreator}
                onChange={(e) => setIdentifiedCreator(e.target.value)}
                placeholder="Để trống nếu giữ nguyên"
                className="w-full min-h-[44px] rounded-lg border border-[#CFC1AC] bg-white px-3 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#241E18] mb-1">
                Cập nhật tình trạng kiểm chứng (tùy chọn)
              </label>
              <select
                value={newVerification}
                onChange={(e) =>
                  setNewVerification(e.target.value as VerificationStatus | '')
                }
                className="w-full min-h-[44px] rounded-lg border border-[#CFC1AC] bg-white px-3 text-sm"
              >
                <option value="">Giữ nguyên trạng thái hiện tại</option>
                <option value="Đã kiểm chứng">Đã kiểm chứng</option>
                <option value="Đang chờ đối chiếu">Đang chờ đối chiếu</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#241E18] mb-1">
                Nội dung bổ sung / giải thích *
              </label>
              <textarea
                rows={3}
                required
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
                placeholder="Ghi rõ ký ức, chi tiết vừa nhận diện được hoặc nguồn đối chiếu..."
                className="w-full rounded-lg border border-[#CFC1AC] bg-white p-3 text-sm"
              />
            </div>

            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-[#8F2D18] px-4 text-sm font-medium text-white hover:bg-[#742312] disabled:opacity-50 transition-colors"
            >
              <UserCheck className="h-4 w-4" />
              <span>{isSaving ? 'Đang lưu ghi nhận...' : 'Ghi nhận bổ sung vào hồ sơ'}</span>
            </button>
          </form>
        </section>
      </div>
    </div>
  );
};
