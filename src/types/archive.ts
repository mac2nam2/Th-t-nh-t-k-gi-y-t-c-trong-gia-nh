export type DocumentCategory =
  | 'Thư từ'
  | 'Nhật ký'
  | 'Giấy khai sinh'
  | 'Giấy chứng nhận'
  | 'Giấy tờ cá nhân'
  | 'Ảnh chụp'
  | 'Tài liệu khác';

export type PrivacyLevel =
  | 'Công khai rộng rãi'
  | 'Công khai trong gia đình'
  | 'Nội bộ dòng họ'
  | 'Hạn chế — Chỉ người lưu giữ';

export type VerificationStatus =
  | 'Đã kiểm chứng'
  | 'Đang chờ đối chiếu'
  | 'Chưa kiểm chứng';

export interface DocumentImageRef {
  tep: string;
  loaiAnh: 'Bản quét gốc' | 'Ảnh chụp gốc';
  chuThich: string;
  nguonAnh: string;
  doPhanGiai?: string;
}

export interface DublinCoreMetadata {
  identifier: string;
  title: string;
  creator: string;
  subject: string;
  description: string;
  publisher: string;
  contributor: string;
  date: string;
  type: string;
  format: string;
  source: string;
  language: string;
  relation: string;
  coverage: string;
  rights: string;
}

export interface ContributionHistoryEntry {
  id: string;
  ngay: string;
  nguoiThucHien: string;
  quanHe: string;
  hanhDong: string;
  noiDung: string;
}

export interface GlossaryEntry {
  tuNgu: string;
  giaiThich: string;
}

export interface ArchiveRecord {
  id: string;
  tenTaiLieu: string;
  loaiTaiLieu: DocumentCategory;
  nguoiTao: string;
  nguoiNhan: string | null;
  thoiGianTao: string;
  namUocLuong: number | null;
  diaDiem: string;
  tomTat: string;
  noiDungPhienAm: string;
  noiDungBienTap: string;
  ngonNgu: string;
  tinhTrangTaiLieu: string;
  nguoiLuuGiu: string;
  nguonGoc: string;
  phamViCongBo: string;
  mucDoRiengTu: PrivacyLevel;
  mucKiemChung: VerificationStatus;
  daDuocPhepCongBo: boolean;
  coThongTinNhayCam: boolean;
  laDuLieuMau?: boolean;
  ghiChu: string;
  danhSachAnh: DocumentImageRef[];
  chuThichTuNgu: GlossaryEntry[];
  taiLieuLienQuanIds: string[];
  lichSuBoSung: ContributionHistoryEntry[];
  dublinCore: DublinCoreMetadata;
}

export interface ArchiveDataset {
  tenKhoLuuTru: string;
  moTaKho: string;
  phienBanDuLieu: string;
  ngayCapNhatCuoi: string;
  chuanMoTa: string;
  thuMucAnh: string;
  ghiChuDuLieuMau: string;
  hoSoTaiLieu: ArchiveRecord[];
}

export interface GeminiAssistResult {
  cheDo: 'phien_am' | 'giai_thich' | 'tom_tat' | 'lien_he';
  noiDungChacChan: string;
  noiDungChuaRo: string;
  deXuatBienTap: string;
  tuNguCu?: GlossaryEntry[];
  lienKetGoiY?: {
    maTaiLieu: string;
    tenTaiLieu: string;
    lyDoLienQuan: string;
  }[];
  luuYKiemChung: string;
}

export interface QaCitation {
  maTaiLieu: string;
  tenTaiLieu: string;
  thongTinNguon: string;
  trichDanLienQuan: string;
}

export interface QaResponse {
  cauTraLoi: string;
  coDuCanCu: boolean;
  taiLieuDanChieu: QaCitation[];
  luuYChuaXacDinh: string | null;
}

export type ActiveScreen =
  | 'home'
  | 'catalog'
  | 'detail'
  | 'qa'
  | 'provenance'
  | 'about';
