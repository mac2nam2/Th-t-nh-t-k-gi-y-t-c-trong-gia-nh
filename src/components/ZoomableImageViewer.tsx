import React, { useState } from 'react';
import {
  ZoomIn,
  ZoomOut,
  RotateCw,
  Maximize2,
  X,
  FileImage,
  ChevronLeft,
  ChevronRight,
  Lock,
} from 'lucide-react';
import type { DocumentImageRef } from '../types/archive';

interface ZoomableImageViewerProps {
  images: DocumentImageRef[];
  title: string;
  isRestrictedHidden?: boolean;
  onRequestCustodianMode?: () => void;
}

export const ZoomableImageViewer: React.FC<ZoomableImageViewerProps> = ({
  images,
  title,
  isRestrictedHidden = false,
  onRequestCustodianMode,
}) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});

  if (isRestrictedHidden) {
    return (
      <div className="archival-card rounded-xl p-6 sm:p-8 text-center bg-[#F5EFE4]">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full border border-[#D4C7B4] bg-[#FAF6EE] text-[#8F2D18]">
          <Lock className="h-5 w-5" />
        </div>
        <h3 className="text-lg font-semibold text-[#241E18]">
          Hình ảnh bản gốc đang được bảo vệ riêng tư
        </h3>
        <p className="mt-2 max-w-md mx-auto text-sm leading-relaxed text-[#5C5145]">
          Tài liệu này có chứa số giấy tờ hoặc địa chỉ cá nhân chưa được người lưu giữ cho phép công khai rộng rãi.
        </p>
        {onRequestCustodianMode && (
          <button
            type="button"
            onClick={onRequestCustodianMode}
            className="mt-4 inline-flex min-h-[44px] items-center justify-center rounded-lg bg-[#8F2D18] px-5 py-2.5 text-sm font-medium text-white hover:bg-[#742312] transition-colors whitespace-nowrap"
          >
            Chuyển sang chế độ Thành viên / Người lưu giữ
          </button>
        )}
      </div>
    );
  }

  if (!images || images.length === 0) {
    return (
      <div className="archival-card rounded-xl p-6 sm:p-8 text-center bg-[#F5EFE4]">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full border border-[#D4C7B4] bg-[#FAF6EE] text-[#7C5832]">
          <FileImage className="h-5 w-5" />
        </div>
        <h3 className="text-base font-semibold text-[#241E18]">
          Chưa có ảnh chụp hoặc bản quét số hóa
        </h3>
        <p className="mt-1.5 max-w-md mx-auto text-sm leading-relaxed text-[#5C5145]">
          Tư liệu gốc hiện vẫn đang bảo quản dưới dạng bản giấy. Thành viên gia đình có thể chụp ảnh và bổ sung vào hồ sơ để tránh thất lạc.
        </p>
      </div>
    );
  }

  const current = images[activeIndex] || images[0];
  const hasFailed = Boolean(failedImages[current.tep]);

  const handleZoomIn = () => setZoom((z) => Math.min(3, Number((z + 0.5).toFixed(1))));
  const handleZoomOut = () => setZoom((z) => Math.max(1, Number((z - 0.5).toFixed(1))));
  const handleRotate = () => setRotation((r) => (r + 90) % 360);
  const handleReset = () => {
    setZoom(1);
    setRotation(0);
  };

  return (
    <div className="space-y-3">
      <div className="archival-card rounded-xl overflow-hidden bg-[#EDE4D5]">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#DFD6C7] bg-[#FAF6EE] px-3 py-2.5">
          <div className="text-xs font-medium text-[#5C5145]">
            <span>{current.loaiAnh}</span>
            {images.length > 1 && (
              <>
                <span className="mx-2" aria-hidden="true">·</span>
                <span className="tabular-nums">
                  Trang {activeIndex + 1}/{images.length}
                </span>
              </>
            )}
            <span className="mx-2" aria-hidden="true">·</span>
            <span className="tabular-nums">Thu phóng {Math.round(zoom * 100)}%</span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleZoomOut}
              disabled={zoom <= 1}
              aria-label="Thu nhỏ ảnh"
              className="inline-flex min-h-[40px] min-w-[40px] items-center justify-center rounded-lg border border-[#D4C7B4] bg-white text-[#241E18] hover:bg-[#F2EAE0] disabled:opacity-40 transition-colors"
            >
              <ZoomOut className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={handleZoomIn}
              disabled={zoom >= 3}
              aria-label="Phóng to ảnh để đọc chữ viết tay"
              className="inline-flex min-h-[40px] min-w-[40px] items-center justify-center rounded-lg border border-[#D4C7B4] bg-white text-[#241E18] hover:bg-[#F2EAE0] disabled:opacity-40 transition-colors"
            >
              <ZoomIn className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={handleRotate}
              aria-label="Xoay ảnh 90 độ"
              className="inline-flex min-h-[40px] min-w-[40px] items-center justify-center rounded-lg border border-[#D4C7B4] bg-white text-[#241E18] hover:bg-[#F2EAE0] transition-colors"
            >
              <RotateCw className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setIsLightboxOpen(true)}
              className="inline-flex min-h-[40px] items-center gap-1.5 rounded-lg border border-[#D4C7B4] bg-white px-3 text-xs font-medium text-[#241E18] hover:bg-[#F2EAE0] transition-colors whitespace-nowrap"
            >
              <Maximize2 className="h-3.5 w-3.5" />
              <span>Phóng to toàn màn hình</span>
            </button>
          </div>
        </div>

        {/* Scrollable / Zoomable viewport */}
        <div className="relative max-h-[520px] min-h-[280px] overflow-auto bg-[#E8DEC9] p-4 flex items-center justify-center">
          {hasFailed ? (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
              <FileImage className="h-10 w-10 text-[#7C5832] mb-2" />
              <p className="text-sm font-medium text-[#241E18]">{title}</p>
              <p className="text-xs text-[#685D51] mt-1">
                Không thể hiển thị tệp ảnh ({current.tep})
              </p>
            </div>
          ) : (
            <img
              src={current.tep}
              alt={`${title} — ${current.chuThich}`}
              referrerPolicy="no-referrer"
              onError={() =>
                setFailedImages((prev) => ({ ...prev, [current.tep]: true }))
              }
              style={{
                transform: `scale(${zoom}) rotate(${rotation}deg)`,
                transformOrigin: 'center center',
              }}
              className="max-h-[460px] w-auto rounded shadow-sm transition-transform duration-150 ease-out cursor-zoom-in"
              onClick={() => setIsLightboxOpen(true)}
            />
          )}
        </div>

        {/* Page switcher if multiple images */}
        {images.length > 1 && (
          <div className="flex items-center justify-between border-t border-[#DFD6C7] bg-[#FAF6EE] px-3 py-2">
            <button
              type="button"
              onClick={() => {
                setActiveIndex((i) => (i - 1 + images.length) % images.length);
                handleReset();
              }}
              className="inline-flex min-h-[40px] items-center gap-1 rounded-lg px-3 text-xs font-medium text-[#241E18] hover:bg-[#EDE4D5]"
            >
              <ChevronLeft className="h-4 w-4" />
              <span>Ảnh trước</span>
            </button>
            <div className="flex items-center gap-1.5">
              {images.map((img, idx) => (
                <button
                  key={img.tep + idx}
                  type="button"
                  onClick={() => {
                    setActiveIndex(idx);
                    handleReset();
                  }}
                  className={`min-h-[36px] min-w-[36px] rounded-md text-xs font-medium tabular-nums transition-colors ${
                    idx === activeIndex
                      ? 'bg-[#8F2D18] text-white'
                      : 'bg-white border border-[#D4C7B4] text-[#241E18] hover:bg-[#F2EAE0]'
                  }`}
                >
                  {idx + 1}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => {
                setActiveIndex((i) => (i + 1) % images.length);
                handleReset();
              }}
              className="inline-flex min-h-[40px] items-center gap-1 rounded-lg px-3 text-xs font-medium text-[#241E18] hover:bg-[#EDE4D5]"
            >
              <span>Ảnh sau</span>
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      {/* Caption and source directly below the image as required */}
      <figcaption className="rounded-lg border border-[#E4D7C5] bg-[#FAF6EE] px-4 py-3 text-sm leading-relaxed text-[#4A4036]">
        <p>
          <span className="font-semibold text-[#241E18]">Chú thích ảnh: </span>
          {current.chuThich}
        </p>
        <p className="mt-1 text-xs text-[#685D51]">
          <span className="font-semibold text-[#4A4036]">Nguồn ảnh: </span>
          {current.nguonAnh}
        </p>
      </figcaption>

      {/* Fullscreen Lightbox Modal */}
      {isLightboxOpen && (
        <div
          className="fixed inset-0 z-50 flex flex-col bg-[#1A1511]/95 text-[#FAF6EE]"
          role="dialog"
          aria-modal="true"
          aria-label={`Phóng to ${title}`}
        >
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/15 px-4 py-3">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{title}</p>
              <p className="truncate text-xs text-[#D6CBB8]">{current.chuThich}</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleZoomOut}
                className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg bg-white/10 hover:bg-white/20"
                aria-label="Thu nhỏ"
              >
                <ZoomOut className="h-5 w-5" />
              </button>
              <span className="min-w-[56px] text-center text-xs font-mono-archival tabular-nums">
                {Math.round(zoom * 100)}%
              </span>
              <button
                type="button"
                onClick={handleZoomIn}
                className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg bg-white/10 hover:bg-white/20"
                aria-label="Phóng to"
              >
                <ZoomIn className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={handleRotate}
                className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg bg-white/10 hover:bg-white/20"
                aria-label="Xoay 90 độ"
              >
                <RotateCw className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={handleReset}
                className="inline-flex min-h-[44px] items-center rounded-lg bg-white/10 px-3 text-xs font-medium hover:bg-white/20 whitespace-nowrap"
              >
                Mặc định
              </button>
              <button
                type="button"
                onClick={() => setIsLightboxOpen(false)}
                className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg bg-[#8F2D18] text-white hover:bg-[#742312]"
                aria-label="Đóng trình phóng to"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-auto p-4 sm:p-8 flex items-center justify-center">
            {!hasFailed && (
              <img
                src={current.tep}
                alt={title}
                referrerPolicy="no-referrer"
                style={{
                  transform: `scale(${zoom}) rotate(${rotation}deg)`,
                  transformOrigin: 'center center',
                }}
                className="max-h-[82vh] w-auto rounded shadow-2xl transition-transform duration-150 ease-out"
              />
            )}
          </div>

          <div className="border-t border-white/15 px-4 py-2.5 text-center text-xs text-[#D6CBB8]">
            {current.nguonAnh}
          </div>
        </div>
      )}
    </div>
  );
};
