import React from 'react';

interface ErrorBoundaryState {
  hasError: boolean;
  errorMessage: string;
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, errorMessage: '' };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      errorMessage: error.message || 'Đã xảy ra lỗi không mong muốn.',
    };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#FAF6EE] flex items-center justify-center p-6">
          <div className="max-w-lg w-full rounded-xl border border-[#DFD6C7] bg-[#FFFDF9] p-6 space-y-4">
            <h1 className="font-serif-display text-2xl font-semibold text-[#8F2D18]">
              Không thể hiển thị dữ liệu lúc này
            </h1>
            <p className="text-sm text-[#4A4036] leading-relaxed">
              Hệ thống gặp sự cố kết nối hoặc phân quyền dữ liệu. Bạn có thể tải lại trang để thử lại.
            </p>
            <pre className="max-h-40 overflow-auto rounded-lg bg-[#F5EFE4] p-3 text-xs text-[#5C5145] whitespace-pre-wrap">
              {this.state.errorMessage}
            </pre>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="inline-flex min-h-[44px] items-center rounded-lg bg-[#8F2D18] px-5 text-sm font-medium text-white"
            >
              Tải lại trang
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
