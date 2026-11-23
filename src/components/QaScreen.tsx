import React, { useState } from 'react';
import {
  Send,
  BookMarked,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  Loader2,
  HelpCircle,
} from 'lucide-react';
import type { QaResponse } from '../types/archive';

interface QaScreenProps {
  viewMode: 'public' | 'custodian';
  largeText: boolean;
  onOpenDetail: (id: string) => void;
}

interface QaTurn {
  id: string;
  question: string;
  response: QaResponse;
}

const SAMPLE_QUESTIONS = [
  'Bức thư ngày 14/10/1968 của ông Nguyễn Văn Đức viết về điều gì và hiện do ai lưu giữ?',
  'Những tài liệu nào liên quan đến địa bàn Hà Nội trong kho lưu trữ?',
  'Cuốn nhật ký năm 1974 hiện đã xác định được ai là tác giả chưa?',
  'Ông Lê Văn Minh quê ở đâu và có giấy tờ công tác nào trong hồ sơ?',
  'Gia đình có tư liệu nào về cụ cố tên là gì ở Hải Phòng không?',
];

export const QaScreen: React.FC<QaScreenProps> = ({
  viewMode,
  largeText,
  onOpenDetail,
}) => {
  const [question, setQuestion] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<QaTurn[]>([]);

  const submitQuestion = async (textToAsk: string) => {
    const clean = textToAsk.trim();
    if (!clean || isLoading) return;

    setIsLoading(true);
    setError(null);
    try {
      const resp = await fetch('/api/gemini/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: clean, viewMode }),
      });
      const data = await resp.json();
      if (!resp.ok) {
        setError(data.error || 'Không thể xử lý câu hỏi lúc này.');
        return;
      }
      setHistory((prev) => [
        {
          id: String(Date.now()),
          question: clean,
          response: data as QaResponse,
        },
        ...prev,
      ]);
      setQuestion('');
    } catch {
      setError('Lỗi kết nối tới máy chủ hỏi đáp.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitQuestion(question);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      {/* Header */}
      <div className="border-b border-[#DFD6C7] pb-5 space-y-2">
        <p className="text-xs font-medium tracking-widest uppercase text-[#8F2D18]">
          Tra cứu lịch sử gia đình có căn cứ tư liệu
        </p>
        <h1 className="font-serif-display text-3xl font-semibold text-[#241E18]">
          Hỏi đáp về tài liệu & lịch sử gia đình
        </h1>
        <p className="text-sm text-[#4A4036] leading-relaxed">
          Trợ lý Gemini chỉ trả lời dựa hoàn toàn trên tệp dữ liệu <span className="font-mono-archival text-[#8F2D18]">giadinh.json</span>, luôn trích dẫn mã tài liệu và nguồn lưu giữ. Nếu không có tư liệu làm căn cứ, hệ thống sẽ báo rõ là chưa có thông tin xác nhận.
        </p>
      </div>

      {/* Question Form */}
      <form onSubmit={handleSubmit} className="archival-card rounded-xl p-4 sm:p-5 space-y-4">
        <label
          htmlFor="qa-input"
          className="block text-sm font-semibold text-[#241E18]"
        >
          Đặt câu hỏi cho kho tư liệu gia đình
        </label>
        <div className="flex flex-col sm:flex-row gap-2.5">
          <input
            id="qa-input"
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Ví dụ: Ai là người lưu giữ bức ảnh gia đình năm 1962 ở Sài Gòn?"
            className="flex-1 min-h-[48px] rounded-xl border border-[#CFC1AC] bg-[#FAF6EE] px-4 text-base text-[#241E18] focus:border-[#8F2D18] focus:outline-none"
          />
          <button
            type="submit"
            disabled={isLoading || !question.trim()}
            className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl bg-[#8F2D18] px-6 text-sm font-medium text-white hover:bg-[#742312] disabled:opacity-50 transition-colors whitespace-nowrap shrink-0"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            <span>{isLoading ? 'Đang tra cứu...' : 'Tra cứu câu trả lời'}</span>
          </button>
        </div>

        {/* Starter questions */}
        <div className="space-y-2 pt-2 border-t border-[#EAE1D3]">
          <p className="text-xs font-medium text-[#685D51]">
            Câu hỏi gợi ý (nhấn để hỏi ngay):
          </p>
          <div className="flex flex-wrap gap-2">
            {SAMPLE_QUESTIONS.map((q) => (
              <button
                key={q}
                type="button"
                disabled={isLoading}
                onClick={() => submitQuestion(q)}
                className="min-h-[38px] rounded-lg border border-[#DFD6C7] bg-[#FAF6EE] px-3 py-1.5 text-left text-xs text-[#3B332A] hover:border-[#8F2D18] hover:text-[#8F2D18] transition-colors"
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      </form>

      {error && (
        <div className="rounded-xl border border-[#8F2D18] bg-[#FEF2F2] p-4 text-sm text-[#8F2D18]">
          {error}
        </div>
      )}

      {/* Results History */}
      {history.length === 0 ? (
        <div className="rounded-xl border border-[#DFD6C7] bg-[#FFFDF9] p-8 text-center space-y-2">
          <HelpCircle className="mx-auto h-8 w-8 text-[#7C5832]" />
          <p className="font-serif-display text-lg font-medium text-[#241E18]">
            Sẵn sàng tra cứu theo tài liệu lưu trữ
          </p>
          <p className="text-sm text-[#5C5145] max-w-lg mx-auto">
            Hãy nhập câu hỏi về nhân vật, ngày tháng, địa điểm hoặc mối quan hệ gia đình, hoặc chọn một câu hỏi gợi ý ở trên.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {history.map((turn) => (
            <article
              key={turn.id}
              className="archival-card rounded-xl p-5 sm:p-6 space-y-5"
            >
              <div className="border-b border-[#EAE1D3] pb-3">
                <p className="text-xs font-medium text-[#685D51]">Câu hỏi đã tra cứu</p>
                <h2 className="font-serif-display text-xl font-semibold text-[#241E18] mt-1">
                  {turn.question}
                </h2>
              </div>

              {/* Grounding status */}
              <div className="flex items-center gap-2 text-xs font-medium">
                {turn.response.coDuCanCu ? (
                  <span className="inline-flex items-center gap-1.5 text-[#14532D]">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Có tài liệu trong giadinh.json làm căn cứ</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-[#9A3412]">
                    <AlertTriangle className="h-4 w-4" />
                    <span>Chưa có tư liệu xác nhận đầy đủ trong kho lưu trữ</span>
                  </span>
                )}
              </div>

              {/* Answer prose */}
              <div
                className={`text-[#241E18] leading-relaxed whitespace-pre-line ${
                  largeText ? 'text-lg' : 'text-base'
                }`}
              >
                {turn.response.cauTraLoi}
              </div>

              {turn.response.luuYChuaXacDinh && (
                <div className="rounded-lg border border-[#FDE68A] bg-[#FFFBEB] px-4 py-3 text-xs text-[#92400E] leading-relaxed">
                  <strong>Lưu ý thông tin chưa rõ / riêng tư: </strong>
                  {turn.response.luuYChuaXacDinh}
                </div>
              )}

              {/* Citations */}
              {turn.response.taiLieuDanChieu &&
                turn.response.taiLieuDanChieu.length > 0 && (
                  <div className="space-y-2.5 border-t border-[#EAE1D3] pt-4">
                    <div className="flex items-center gap-2 text-xs font-semibold text-[#5C5145]">
                      <BookMarked className="h-4 w-4 text-[#8F2D18]" />
                      <span>Tài liệu & nguồn dẫn chiếu trong giadinh.json</span>
                    </div>
                    <div className="grid grid-cols-1 gap-2.5">
                      {turn.response.taiLieuDanChieu.map((cit, idx) => (
                        <div
                          key={cit.maTaiLieu + idx}
                          className="rounded-lg border border-[#DFD6C7] bg-[#FAF6EE] p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                        >
                          <div className="space-y-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2 text-xs">
                              <span className="font-mono-archival font-semibold text-[#8F2D18]">
                                {cit.maTaiLieu}
                              </span>
                              <span aria-hidden="true">·</span>
                              <span className="font-semibold text-[#241E18]">
                                {cit.tenTaiLieu}
                              </span>
                            </div>
                            <p className="text-xs text-[#5C5145]">
                              <strong>Nguồn:</strong> {cit.thongTinNguon}
                            </p>
                            <p className="text-xs italic text-[#4A4036]">
                              &ldquo;{cit.trichDanLienQuan}&rdquo;
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => onOpenDetail(cit.maTaiLieu)}
                            className="inline-flex min-h-[40px] items-center gap-1.5 rounded-lg border border-[#CFC1AC] bg-white px-3 text-xs font-medium text-[#241E18] hover:border-[#8F2D18] hover:text-[#8F2D18] whitespace-nowrap shrink-0 self-start sm:self-center"
                          >
                            <span>Xem tài liệu</span>
                            <ArrowRight className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
            </article>
          ))}
        </div>
      )}
    </div>
  );
};
