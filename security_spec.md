# Security Specification — Hồ Sơ Số Gia Đình (Firestore Rules TDD)

## 1. Data Invariants
1. **Master Gate & Existence**: A contribution under `/documents/{docId}/contributions/{contributionId}` cannot be created unless parent `/documents/{docId}` exists and the user is authorized to view it.
2. **PII Isolation (Split Collection)**: User emails are stored strictly under `/users/{userId}/private/profile` and can NEVER be read by other users.
3. **Owner & Creator Immutability**: `ownerId`, `createdAt`, and original document fields (`noiDungPhienAm`, `danhSachAnh` for non-owners) cannot be spoofed or altered by contributors.
4. **Privacy Boundary Enforcement**: Documents marked `Hạn chế — Chỉ người lưu giữ` or with `coThongTinNhayCam == true && daDuocPhepCongBo == false` cannot be read or listed by unauthenticated visitors or non-custodians.
5. **Temporal Integrity**: `createdAt` and `updatedAt` timestamps must match `request.time` on creation and update.
6. **Strict Keys & Size Limits**: Every document write must pass `keys().hasAll(...)` and `keys().hasOnly(...)` on create, and `diff().affectedKeys().hasOnly(...)` on update, with explicit `.size()` bounds on every string and array.

## 2. The "Dirty Dozen" Adversarial Payloads (Must Return PERMISSION_DENIED)
1. **Shadow Field Injection on Document Create**: Creating `/documents/TL-999` with an extra ghost field `isVerified: true` or `adminOverride: true`.
2. **Identity Spoofing on Create**: Creating `/documents/TL-999` with `ownerId: "victim-uid"` when `request.auth.uid == "attacker-uid"`.
3. **Unverified Email Spoofing**: Calling any write or admin check with `request.auth.token.email == "macvnam2002@gmail.com"` while `request.auth.token.email_verified == false`.
4. **PII Read Leak**: Authenticated user A calling `get` on `/users/userB/private/profile`.
5. **Restricted Document Scrape**: Unauthenticated visitor or non-owner querying `/documents` where `mucDoRiengTu == "Hạn chế — Chỉ người lưu giữ"`.
6. **ID Poisoning**: Creating `/documents/invalid$id..with..dots` or a 1KB document ID string.
7. **Original Transcription Tampering**: Non-owner family contributor attempting to update `noiDungPhienAm` or `danhSachAnh` on `/documents/TL-1968-001`.
8. **Immutability Bypass**: Owner attempting to change `ownerId` or `createdAt` during an update on `/documents/TL-1968-001`.
9. **Client Timestamp Forgery**: Creating a document or contribution with a backdated `createdAt` not equal to `request.time`.
10. **Orphaned Contribution Write**: Creating `/documents/nonexistent-doc/contributions/c1` where the parent document does not exist.
11. **Array Exhaustion Attack**: Uploading 100+ items inside `taiLieuLienQuanIds` or `danhSachAnh` beyond bounded `.size() <= 20`.
12. **Type Poisoning Update**: Updating `tenTaiLieu` with a boolean `true` or an oversized 5,000-character string.
