import express from 'express';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';
import type {
  ArchiveDataset,
  ArchiveRecord,
  ContributionHistoryEntry,
  DocumentCategory,
  PrivacyLevel,
  VerificationStatus,
} from './src/types/archive.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_FILE_PATH = path.resolve(__dirname, 'giadinh.json');
const IMAGE_DIR_PATH = path.resolve(__dirname, 'public', 'tailieu-anh');
const PORT = Number(process.env.PORT) || 3000;

function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

async function readArchiveData(): Promise<ArchiveDataset> {
  const raw = await fs.readFile(DATA_FILE_PATH, 'utf-8');
  return JSON.parse(raw) as ArchiveDataset;
}

async function writeArchiveData(dataset: ArchiveDataset): Promise<void> {
  dataset.ngayCapNhatCuoi = new Date().toISOString().slice(0, 10);
  await fs.writeFile(DATA_FILE_PATH, JSON.stringify(dataset, null, 2), 'utf-8');
}

function sanitizeRecordForViewMode(
  record: ArchiveRecord,
  viewMode: 'public' | 'custodian'
): ArchiveRecord {
  if (viewMode === 'custodian') {
    return record;
  }

  const isRestricted =
    record.mucDoRiengTu === 'Hạn chế — Chỉ người lưu giữ' ||
    (record.coThongTinNhayCam && !record.daDuocPhepCongBo);

  if (!isRestricted) {
    return record;
  }

  return {
    ...record,
    diaDiem: record.diaDiem.includes('Hà Nội')
      ? 'Hà Nội (ẩn địa chỉ chi tiết theo cài đặt riêng tư)'
      : 'Đã ẩn chi tiết địa điểm theo mức độ riêng tư',
    noiDungPhienAm:
      '[Nội dung bản gốc đang được ẩn một phần do có thông tin cá nhân/số giấy tờ chưa được người lưu giữ cho phép công khai. Chuyển sang Chế độ Thành viên / Người lưu giữ để xem đầy đủ.]',
    noiDungBienTap:
      record.tomTat +
      ' (Chi tiết số giấy tờ, địa chỉ hoặc nội dung riêng tư được bảo vệ theo phân quyền người lưu giữ.)',
    danhSachAnh: [],
  };
}

async function startServer() {
  await fs.mkdir(IMAGE_DIR_PATH, { recursive: true });

  const app = express();
  app.use(express.json({ limit: '15mb' }));
  app.use('/tailieu-anh', express.static(IMAGE_DIR_PATH));

  app.get('/api/archive', async (req, res) => {
    try {
      const viewMode = req.query.mode === 'custodian' ? 'custodian' : 'public';
      const dataset = await readArchiveData();
      res.json({
        ...dataset,
        hoSoTaiLieu: dataset.hoSoTaiLieu.map((rec) =>
          sanitizeRecordForViewMode(rec, viewMode)
        ),
      });
    } catch (error) {
      console.error('Lỗi đọc tệp giadinh.json:', error);
      res.status(500).json({ error: 'Không thể đọc tệp dữ liệu giadinh.json.' });
    }
  });

  app.get('/api/export', async (_req, res) => {
    try {
      const raw = await fs.readFile(DATA_FILE_PATH, 'utf-8');
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.setHeader(
        'Content-Disposition',
        'attachment; filename="giadinh.json"'
      );
      res.send(raw);
    } catch (error) {
      console.error('Lỗi xuất tệp giadinh.json:', error);
      res.status(500).json({ error: 'Không thể xuất tệp giadinh.json.' });
    }
  });

  app.post('/api/upload-image', async (req, res) => {
    try {
      const { fileName, base64Data } = req.body as {
        fileName?: string;
        base64Data?: string;
      };
      if (!fileName || !base64Data) {
        res.status(400).json({ error: 'Thiếu tên tệp hoặc dữ liệu ảnh.' });
        return;
      }

      const matches = base64Data.match(/^data:(image\/(jpeg|jpg|png|webp));base64,(.+)$/i);
      if (!matches) {
        res.status(400).json({ error: 'Chỉ hỗ trợ ảnh định dạng JPG, PNG hoặc WebP.' });
        return;
      }

      const ext = matches[2].toLowerCase() === 'jpeg' ? 'jpg' : matches[2].toLowerCase();
      const buffer = Buffer.from(matches[3], 'base64');
      if (buffer.byteLength > 10 * 1024 * 1024) {
        res.status(400).json({ error: 'Dung lượng ảnh vượt quá giới hạn 10MB.' });
        return;
      }

      const safeBase = fileName
        .replace(/\.[^.]+$/, '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-zA-Z0-9_-]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 48) || 'tailieu';
      const outputName = `GD-${Date.now()}-${safeBase}.${ext}`;
      const outputPath = path.join(IMAGE_DIR_PATH, outputName);

      await fs.writeFile(outputPath, buffer);
      res.json({
        tep: `/tailieu-anh/${outputName}`,
        fileName: outputName,
      });
    } catch (error) {
      console.error('Lỗi lưu ảnh tải lên:', error);
      res.status(500).json({ error: 'Không thể lưu tệp ảnh vào thư mục lưu trữ.' });
    }
  });

  app.post('/api/records', async (req, res) => {
    try {
      const body = req.body as Partial<ArchiveRecord> & {
        nguoiDongGop?: string;
        quanHeDongGop?: string;
      };

      if (!body.tenTaiLieu?.trim() || !body.loaiTaiLieu) {
        res.status(400).json({
          error: 'Vui lòng nhập ít nhất tên tài liệu và loại tài liệu.',
        });
        return;
      }

      const dataset = await readArchiveData();
      const seq = String(dataset.hoSoTaiLieu.length + 1).padStart(3, '0');
      const yearPart = body.namUocLuong ? String(body.namUocLuong) : 'CHUARO';
      const newId = `TL-${yearPart}-${seq}`;
      const today = new Date().toISOString().slice(0, 10);

      const nguoiTao = body.nguoiTao?.trim() || 'Chưa rõ';
      const nguoiNhan = body.nguoiNhan?.trim() ? body.nguoiNhan.trim() : null;
      const thoiGianTao = body.thoiGianTao?.trim() || 'Chưa rõ';
      const diaDiem = body.diaDiem?.trim() || 'Chưa rõ';
      const tomTat = body.tomTat?.trim() || 'Chưa có thông tin tóm tắt.';
      const noiDungPhienAm =
        body.noiDungPhienAm?.trim() || 'Chưa có nội dung phiên âm.';
      const noiDungBienTap =
        body.noiDungBienTap?.trim() || 'Chưa có nội dung biên tập.';
      const nguoiLuuGiu = body.nguoiLuuGiu?.trim() || 'Chưa rõ';
      const nguonGoc = body.nguonGoc?.trim() || 'Chưa rõ nguồn gốc chi tiết.';
      const phamViCongBo =
        body.phamViCongBo?.trim() || 'Chưa xác định phạm vi công bố.';
      const mucDoRiengTu: PrivacyLevel =
        body.mucDoRiengTu || 'Nội bộ dòng họ';
      const mucKiemChung: VerificationStatus =
        body.mucKiemChung || 'Chưa kiểm chứng';
      const loaiTaiLieu: DocumentCategory = body.loaiTaiLieu;
      const coThongTinNhayCam = Boolean(body.coThongTinNhayCam);
      const daDuocPhepCongBo = Boolean(body.daDuocPhepCongBo);

      const contributorName =
        body.nguoiDongGop?.trim() || nguoiLuuGiu || 'Thành viên gia đình';
      const contributorRole =
        body.quanHeDongGop?.trim() || 'Thành viên đóng góp';

      const newRecord: ArchiveRecord = {
        id: newId,
        tenTaiLieu: body.tenTaiLieu.trim(),
        loaiTaiLieu,
        nguoiTao,
        nguoiNhan,
        thoiGianTao,
        namUocLuong:
          typeof body.namUocLuong === 'number' && !Number.isNaN(body.namUocLuong)
            ? body.namUocLuong
            : null,
        diaDiem,
        tomTat,
        noiDungPhienAm,
        noiDungBienTap,
        ngonNgu: body.ngonNgu?.trim() || 'Tiếng Việt',
        tinhTrangTaiLieu:
          body.tinhTrangTaiLieu?.trim() || 'Chưa có thông tin đánh giá vật lý.',
        nguoiLuuGiu,
        nguonGoc,
        phamViCongBo,
        mucDoRiengTu,
        mucKiemChung,
        daDuocPhepCongBo,
        coThongTinNhayCam,
        laDuLieuMau: false,
        ghiChu: body.ghiChu?.trim() || '',
        danhSachAnh: Array.isArray(body.danhSachAnh) ? body.danhSachAnh : [],
        chuThichTuNgu: Array.isArray(body.chuThichTuNgu) ? body.chuThichTuNgu : [],
        taiLieuLienQuanIds: Array.isArray(body.taiLieuLienQuanIds)
          ? body.taiLieuLienQuanIds
          : [],
        lichSuBoSung: [
          {
            id: `LS-${Date.now()}`,
            ngay: today,
            nguoiThucHien: contributorName,
            quanHe: contributorRole,
            hanhDong: 'Tạo hồ sơ tài liệu mới',
            noiDung: `Nhập hồ sơ "${body.tenTaiLieu.trim()}" vào kho lưu trữ số gia đình.`,
          },
        ],
        dublinCore: {
          identifier: newId,
          title: body.tenTaiLieu.trim(),
          creator: nguoiTao,
          subject: `${loaiTaiLieu}; Tư liệu gia đình`,
          description: tomTat,
          publisher: 'Kho Lưu Trữ Gia Đình',
          contributor: contributorName,
          date: thoiGianTao,
          type: loaiTaiLieu,
          format:
            Array.isArray(body.danhSachAnh) && body.danhSachAnh.length > 0
              ? 'image/jpeg'
              : 'Chưa có tệp ảnh',
          source: nguonGoc,
          language: 'vi',
          relation: '',
          coverage: diaDiem,
          rights: mucDoRiengTu,
        },
      };

      dataset.hoSoTaiLieu.unshift(newRecord);
      await writeArchiveData(dataset);
      res.status(201).json(newRecord);
    } catch (error) {
      console.error('Lỗi thêm hồ sơ tài liệu:', error);
      res.status(500).json({ error: 'Không thể lưu hồ sơ mới vào giadinh.json.' });
    }
  });

  app.post('/api/records/:id/contribute', async (req, res) => {
    try {
      const { id } = req.params;
      const {
        nguoiThucHien,
        quanHe,
        hanhDong,
        noiDung,
        capNhatBienTap,
        capNhatGhiChu,
        capNhatKiemChung,
        capNhatNguoiTao,
        capNhatDiaDiem,
        themTuNgu,
        themLienKetId,
      } = req.body as {
        nguoiThucHien?: string;
        quanHe?: string;
        hanhDong?: string;
        noiDung?: string;
        capNhatBienTap?: string;
        capNhatGhiChu?: string;
        capNhatKiemChung?: VerificationStatus;
        capNhatNguoiTao?: string;
        capNhatDiaDiem?: string;
        themTuNgu?: { tuNgu: string; giaiThich: string }[];
        themLienKetId?: string;
      };

      if (!nguoiThucHien?.trim() || !noiDung?.trim()) {
        res.status(400).json({
          error: 'Vui lòng nhập tên người thực hiện và nội dung bổ sung.',
        });
        return;
      }

      const dataset = await readArchiveData();
      const idx = dataset.hoSoTaiLieu.findIndex((item) => item.id === id);
      if (idx === -1) {
        res.status(404).json({ error: 'Không tìm thấy mã tài liệu này.' });
        return;
      }

      const record = dataset.hoSoTaiLieu[idx];
      const historyEntry: ContributionHistoryEntry = {
        id: `LS-${Date.now()}`,
        ngay: new Date().toISOString().slice(0, 10),
        nguoiThucHien: nguoiThucHien.trim(),
        quanHe: quanHe?.trim() || 'Thành viên gia đình',
        hanhDong: hanhDong?.trim() || 'Bổ sung & xác nhận thông tin',
        noiDung: noiDung.trim(),
      };

      record.lichSuBoSung.unshift(historyEntry);

      if (capNhatBienTap?.trim()) {
        record.noiDungBienTap = capNhatBienTap.trim();
      }
      if (capNhatGhiChu?.trim()) {
        record.ghiChu = record.ghiChu
          ? `${record.ghiChu}\n[${historyEntry.ngay} - ${historyEntry.nguoiThucHien}]: ${capNhatGhiChu.trim()}`
          : `[${historyEntry.ngay} - ${historyEntry.nguoiThucHien}]: ${capNhatGhiChu.trim()}`;
      }
      if (capNhatKiemChung) {
        record.mucKiemChung = capNhatKiemChung;
      }
      if (capNhatNguoiTao?.trim()) {
        record.nguoiTao = capNhatNguoiTao.trim();
        record.dublinCore.creator = capNhatNguoiTao.trim();
      }
      if (capNhatDiaDiem?.trim()) {
        record.diaDiem = capNhatDiaDiem.trim();
        record.dublinCore.coverage = capNhatDiaDiem.trim();
      }
      if (Array.isArray(themTuNgu) && themTuNgu.length > 0) {
        const existingTerms = new Set(
          record.chuThichTuNgu.map((t) => t.tuNgu.toLowerCase())
        );
        for (const entry of themTuNgu) {
          if (entry.tuNgu?.trim() && !existingTerms.has(entry.tuNgu.trim().toLowerCase())) {
            record.chuThichTuNgu.push({
              tuNgu: entry.tuNgu.trim(),
              giaiThich: entry.giaiThich.trim(),
            });
          }
        }
      }
      if (
        themLienKetId?.trim() &&
        themLienKetId.trim() !== record.id &&
        !record.taiLieuLienQuanIds.includes(themLienKetId.trim())
      ) {
        record.taiLieuLienQuanIds.push(themLienKetId.trim());
      }

      if (!record.dublinCore.contributor.includes(nguoiThucHien.trim())) {
        record.dublinCore.contributor = `${record.dublinCore.contributor}; ${nguoiThucHien.trim()}`;
      }

      dataset.hoSoTaiLieu[idx] = record;
      await writeArchiveData(dataset);
      res.json(record);
    } catch (error) {
      console.error('Lỗi cập nhật đóng góp:', error);
      res.status(500).json({ error: 'Không thể lưu thông tin đóng góp.' });
    }
  });

  app.post('/api/gemini/ask', async (req, res) => {
    try {
      const { question, viewMode } = req.body as {
        question?: string;
        viewMode?: 'public' | 'custodian';
      };

      if (!question?.trim()) {
        res.status(400).json({ error: 'Vui lòng nhập câu hỏi.' });
        return;
      }

      const ai = getGeminiClient();
      if (!ai) {
        res.status(503).json({
          error:
            'Chưa cấu hình khóa Gemini API trên máy chủ (GEMINI_API_KEY). Vui lòng thiết lập trong phần Secrets của môi trường chạy.',
        });
        return;
      }

      const mode = viewMode === 'custodian' ? 'custodian' : 'public';
      const dataset = await readArchiveData();
      const sanitizedRecords = dataset.hoSoTaiLieu.map((rec) =>
        sanitizeRecordForViewMode(rec, mode)
      );

      const systemInstruction = `Bạn là trợ lý tra cứu lưu trữ gia đình tiếng Việt.
NGUYÊN TẮC BẮT BUỘC:
1. Chỉ trả lời HOÀN TOÀN dựa trên dữ liệu JSON của kho lưu trữ giadinh.json được cung cấp dưới đây. Tuyệt đối KHÔNG tự suy đoán, không bịa thông tin về người thân, ngày tháng, địa điểm, sự kiện hoặc mối quan hệ gia đình ngoài những gì đã viết trong dữ liệu.
2. Mọi nhận định về sự kiện, nhân vật hoặc mối quan hệ gia đình bắt buộc phải có tài liệu trong giadinh.json làm căn cứ và nêu rõ Mã tài liệu (ví dụ TL-1968-001) cùng nguồn gốc / người lưu giữ.
3. Nếu không tìm thấy thông tin trong dữ liệu, hoặc trường dữ liệu đang là "Chưa rõ" / null / đang bị ẩn vì quyền riêng tư, hãy trả lời rõ ràng là "Chưa có tư liệu xác nhận trong kho lưu trữ hiện tại" (hoặc nêu rõ phần đang ẩn do hạn chế quyền truy cập) và đặt coDuCanCu = false nếu hoàn toàn không có căn cứ.
4. Không khẳng định chắc chắn những chi tiết đang ghi "[chưa rõ]" hoặc "Đang chờ đối chiếu".
5. Trả lời bằng tiếng Việt có dấu, rõ ràng, ấm áp, trang trọng và dễ hiểu với người lớn tuổi.`;

      const prompt = `Dữ liệu kho lưu trữ (giadinh.json - chế độ xem: ${mode === 'custodian' ? 'Thành viên / Người lưu giữ' : 'Công khai'}):
${JSON.stringify(sanitizedRecords, null, 2)}

Câu hỏi của thành viên gia đình:
"${question.trim()}"`;

      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: prompt,
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              cauTraLoi: {
                type: Type.STRING,
                description:
                  'Câu trả lời chi tiết bằng tiếng Việt dựa hoàn toàn trên dữ liệu giadinh.json.',
              },
              coDuCanCu: {
                type: Type.BOOLEAN,
                description:
                  'true nếu tìm thấy căn cứ rõ ràng trong giadinh.json, false nếu chưa có tư liệu xác nhận.',
              },
              taiLieuDanChieu: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    maTaiLieu: { type: Type.STRING },
                    tenTaiLieu: { type: Type.STRING },
                    thongTinNguon: { type: Type.STRING },
                    trichDanLienQuan: { type: Type.STRING },
                  },
                  required: [
                    'maTaiLieu',
                    'tenTaiLieu',
                    'thongTinNguon',
                    'trichDanLienQuan',
                  ],
                },
              },
              luuYChuaXacDinh: {
                type: Type.STRING,
                description:
                  'Ghi chú về những thông tin còn thiếu, chưa rõ hoặc đang bị hạn chế quyền xem (nếu có).',
              },
            },
            required: ['cauTraLoi', 'coDuCanCu', 'taiLieuDanChieu'],
          },
        },
      });

      const text = response.text?.trim();
      if (!text) {
        res.status(502).json({ error: 'Gemini không trả về nội dung.' });
        return;
      }

      const parsed = JSON.parse(text);
      res.json(parsed);
    } catch (error) {
      console.error('Lỗi Gemini hỏi đáp:', error);
      res.status(500).json({
        error: 'Không thể xử lý câu hỏi với Gemini lúc này. Vui lòng thử lại sau.',
      });
    }
  });

  app.post('/api/gemini/assist', async (req, res) => {
    try {
      const { recordId, cheDo, viewMode } = req.body as {
        recordId?: string;
        cheDo?: 'phien_am' | 'giai_thich' | 'tom_tat' | 'lien_he';
        viewMode?: 'public' | 'custodian';
      };

      if (!recordId || !cheDo) {
        res.status(400).json({ error: 'Thiếu mã tài liệu hoặc chế độ hỗ trợ.' });
        return;
      }

      const ai = getGeminiClient();
      if (!ai) {
        res.status(503).json({
          error:
            'Chưa cấu hình khóa Gemini API trên máy chủ (GEMINI_API_KEY). Vui lòng kiểm tra phần Secrets.',
        });
        return;
      }

      const dataset = await readArchiveData();
      const rawRecord = dataset.hoSoTaiLieu.find((item) => item.id === recordId);
      if (!rawRecord) {
        res.status(404).json({ error: 'Không tìm thấy tài liệu.' });
        return;
      }

      const mode = viewMode === 'custodian' ? 'custodian' : 'public';
      const targetRecord = sanitizeRecordForViewMode(rawRecord, mode);

      const otherRecordsSummary = dataset.hoSoTaiLieu
        .filter((item) => item.id !== recordId)
        .map((item) => sanitizeRecordForViewMode(item, mode))
        .map((item) => ({
          id: item.id,
          tenTaiLieu: item.tenTaiLieu,
          loaiTaiLieu: item.loaiTaiLieu,
          nguoiTao: item.nguoiTao,
          nguoiNhan: item.nguoiNhan,
          thoiGianTao: item.thoiGianTao,
          diaDiem: item.diaDiem,
          tomTat: item.tomTat,
          nguoiLuuGiu: item.nguoiLuuGiu,
        }));

      const parts: Array<
        | { text: string }
        | { inlineData: { mimeType: string; data: string } }
      > = [];

      if (
        (cheDo === 'phien_am' || cheDo === 'giai_thich') &&
        targetRecord.danhSachAnh.length > 0
      ) {
        const firstImage = targetRecord.danhSachAnh[0].tep;
        const safeRel = firstImage.replace(/^\/tailieu-anh\//, '');
        const absImgPath = path.resolve(IMAGE_DIR_PATH, safeRel);
        if (absImgPath.startsWith(IMAGE_DIR_PATH)) {
          try {
            const imgBuf = await fs.readFile(absImgPath);
            const ext = path.extname(absImgPath).toLowerCase();
            const mimeType = ext === '.png' ? 'image/png' : 'image/jpeg';
            parts.push({
              inlineData: {
                mimeType,
                data: imgBuf.toString('base64'),
              },
            });
          } catch {
            // Continue with textual fields if image file is unavailable
          }
        }
      }

      const modeInstructions: Record<string, string> = {
        phien_am:
          'Nhiệm vụ: Hỗ trợ đọc và đối chiếu chữ viết tay / chữ in từ ảnh tài liệu và bản phiên âm hiện có. Bắt buộc tách bạch rõ phần ĐỌC ĐƯỢC CHẮC CHẮN và phần CHỮ MỜ / CHƯA RÕ (tuyệt đối không đoán bừa hoặc tự điền từ bị mất).',
        giai_thich:
          'Nhiệm vụ: Giải thích các từ ngữ cũ, thuật ngữ hành chính xưa, đơn vị hoặc bối cảnh ngôn ngữ xuất hiện trong tài liệu này một cách ngắn gọn, dễ hiểu cho con cháu.',
        tom_tat:
          'Nhiệm vụ: Đề xuất bản tóm tắt biên tập rõ ràng, dễ đọc cho người lớn tuổi và con cháu dựa trên nguyên văn tài liệu, nêu rõ điểm nào đã có căn cứ và điểm nào còn thiếu thông tin.',
        lien_he:
          'Nhiệm vụ: Đối chiếu tài liệu này với danh sách các tài liệu khác trong giadinh.json để gợi ý mối liên hệ (cùng nhân vật, cùng địa danh, cùng giai đoạn hoặc cùng nguồn lưu giữ). Chỉ nêu mối liên hệ có căn cứ dữ liệu.',
      };

      const systemInstruction = `Bạn là trợ lý biên tập hồ sơ lưu trữ gia đình tiếng Việt.
QUY TẮC BẮT BUỘC:
- Mọi kết quả chỉ là ĐỀ XUẤT để người dùng kiểm tra và xác nhận, KHÔNG khẳng định tuyệt đối nếu chữ viết không rõ.
- Phải phân biệt rõ "noiDungChacChan" (chỉ những gì đọc được rõ ràng hoặc ghi nhận trực tiếp trong tư liệu) và "noiDungChuaRo" (những chữ mờ, đoạn rách, tên người/địa điểm/năm còn thiếu).
- Không tự suy đoán hoặc bịa thêm quan hệ gia đình, ngày tháng, địa điểm không có trong tài liệu.`;

      parts.push({
        text: `${modeInstructions[cheDo]}

Thông tin tài liệu hiện tại:
${JSON.stringify(targetRecord, null, 2)}

Các tài liệu khác trong giadinh.json để đối chiếu:
${JSON.stringify(otherRecordsSummary, null, 2)}`,
      });

      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: { parts },
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              noiDungChacChan: {
                type: Type.STRING,
                description:
                  'Phần nội dung đọc được rõ ràng hoặc thông tin chắc chắn từ tài liệu.',
              },
              noiDungChuaRo: {
                type: Type.STRING,
                description:
                  'Phần chữ viết mờ, nét ký chưa rõ hoặc thông tin còn thiếu cần người thân đối chiếu.',
              },
              deXuatBienTap: {
                type: Type.STRING,
                description:
                  'Đề xuất văn bản biên tập dễ đọc hoặc bản ghi chú gợi ý để người dùng xem xét trước khi lưu.',
              },
              tuNguCu: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    tuNgu: { type: Type.STRING },
                    giaiThich: { type: Type.STRING },
                  },
                  required: ['tuNgu', 'giaiThich'],
                },
              },
              lienKetGoiY: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    maTaiLieu: { type: Type.STRING },
                    tenTaiLieu: { type: Type.STRING },
                    lyDoLienQuan: { type: Type.STRING },
                  },
                  required: ['maTaiLieu', 'tenTaiLieu', 'lyDoLienQuan'],
                },
              },
              luuYKiemChung: {
                type: Type.STRING,
                description:
                  'Khuyến nghị kiểm chứng với bản gốc hoặc hỏi thêm người thân trước khi xác nhận lưu.',
              },
            },
            required: [
              'noiDungChacChan',
              'noiDungChuaRo',
              'deXuatBienTap',
              'luuYKiemChung',
            ],
          },
        },
      });

      const text = response.text?.trim();
      if (!text) {
        res.status(502).json({ error: 'Gemini không trả về đề xuất.' });
        return;
      }

      const parsed = JSON.parse(text);
      res.json({
        cheDo,
        ...parsed,
      });
    } catch (error) {
      console.error('Lỗi Gemini hỗ trợ chi tiết:', error);
      res.status(500).json({
        error: 'Không thể tạo đề xuất từ Gemini lúc này. Vui lòng thử lại sau.',
      });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
