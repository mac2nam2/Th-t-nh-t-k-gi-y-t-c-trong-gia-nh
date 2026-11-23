import type { User } from 'firebase/auth';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  where,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './firebase';
import type { ArchiveRecord } from '../types/archive';

// Volumetric bounds synchronized verbatim with firebase-blueprint.json & firestore.rules
function clampString(value: string | null | undefined, max: number, fallback = ''): string {
  const s = (value ?? fallback).trim();
  return s.slice(0, max);
}

export async function syncUserProfileToFirestore(user: User): Promise<void> {
  if (!user.emailVerified) return;

  const publicPath = `users/${user.uid}`;
  try {
    await setDoc(
      doc(db, 'users', user.uid),
      {
        uid: user.uid,
        displayName: clampString(user.displayName || user.email || 'Thành viên', 120),
        familyRelation: 'Thành viên gia đình',
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, publicPath);
  }

  const privatePath = `users/${user.uid}/private/profile`;
  try {
    const existingPrivate = await getDoc(doc(db, 'users', user.uid, 'private', 'profile'));
    if (!existingPrivate.exists()) {
      await setDoc(doc(db, 'users', user.uid, 'private', 'profile'), {
        uid: user.uid,
        email: clampString(user.email, 200),
        createdAt: serverTimestamp(),
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, privatePath);
  }
}

export async function syncRecordsToFirestore(
  records: ArchiveRecord[],
  user: User
): Promise<void> {
  if (!user.emailVerified) return;

  for (const rec of records) {
    const docPath = `documents/${rec.id}`;
    try {
      const ref = doc(db, 'documents', rec.id);
      const snap = await getDoc(ref);
      if (!snap.exists()) {
        await setDoc(ref, {
          id: clampString(rec.id, 64),
          tenTaiLieu: clampString(rec.tenTaiLieu, 240, 'Tài liệu gia đình'),
          loaiTaiLieu: rec.loaiTaiLieu,
          nguoiTao: clampString(rec.nguoiTao, 160, 'Chưa rõ'),
          nguoiNhan: rec.nguoiNhan ? clampString(rec.nguoiNhan, 160) : null,
          thoiGianTao: clampString(rec.thoiGianTao, 100, 'Chưa rõ'),
          namUocLuong:
            typeof rec.namUocLuong === 'number' &&
            rec.namUocLuong >= 1800 &&
            rec.namUocLuong <= 2100
              ? rec.namUocLuong
              : null,
          diaDiem: clampString(rec.diaDiem, 200, 'Chưa rõ'),
          tomTat: clampString(rec.tomTat, 1500, 'Chưa có thông tin'),
          noiDungPhienAm: clampString(rec.noiDungPhienAm, 12000, 'Chưa có thông tin'),
          noiDungBienTap: clampString(rec.noiDungBienTap, 12000, 'Chưa có thông tin'),
          ngonNgu: clampString(rec.ngonNgu, 60, 'Tiếng Việt'),
          tinhTrangTaiLieu: clampString(rec.tinhTrangTaiLieu, 500, 'Chưa rõ'),
          nguoiLuuGiu: clampString(rec.nguoiLuuGiu, 160, 'Chưa rõ'),
          nguonGoc: clampString(rec.nguonGoc, 500, 'Chưa rõ'),
          phamViCongBo: clampString(rec.phamViCongBo, 300, 'Nội bộ dòng họ'),
          mucDoRiengTu: rec.mucDoRiengTu,
          mucKiemChung: rec.mucKiemChung,
          daDuocPhepCongBo: Boolean(rec.daDuocPhepCongBo),
          coThongTinNhayCam: Boolean(rec.coThongTinNhayCam),
          laDuLieuMau: Boolean(rec.laDuLieuMau),
          ghiChu: clampString(rec.ghiChu, 3000),
          danhSachAnh: (rec.danhSachAnh || []).slice(0, 10),
          chuThichTuNgu: (rec.chuThichTuNgu || []).slice(0, 30),
          taiLieuLienQuanIds: (rec.taiLieuLienQuanIds || []).slice(0, 20),
          dublinCore: rec.dublinCore,
          ownerId: user.uid,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });

        for (const entry of rec.lichSuBoSung || []) {
          const contribRef = doc(db, 'documents', rec.id, 'contributions', entry.id);
          await setDoc(contribRef, {
            id: clampString(entry.id, 128),
            docId: clampString(rec.id, 64),
            docOwnerId: user.uid,
            docPrivacy: rec.mucDoRiengTu,
            authorUid: user.uid,
            ngay: clampString(entry.ngay, 32),
            nguoiThucHien: clampString(entry.nguoiThucHien, 160),
            quanHe: clampString(entry.quanHe, 120),
            hanhDong: clampString(entry.hanhDong, 200),
            noiDung: clampString(entry.noiDung, 3000),
            createdAt: serverTimestamp(),
          });
        }
      }
    } catch (error) {
      // Skip documents owned by another family custodian if rule denies cross-owner check,
      // while surfacing unexpected permission issues via handleFirestoreError.
      if (
        error instanceof Error &&
        !error.message.includes('Missing or insufficient permissions')
      ) {
        handleFirestoreError(error, OperationType.WRITE, docPath);
      }
    }
  }
}

export async function fetchAccessibleCloudCount(user: User): Promise<number> {
  if (!user.emailVerified) return 0;
  const path = 'documents';
  try {
    const q = query(
      collection(db, 'documents'),
      where('mucDoRiengTu', 'in', [
        'Công khai rộng rãi',
        'Công khai trong gia đình',
        'Nội bộ dòng họ',
      ])
    );
    const snap = await getDocs(q);
    return snap.size;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}
