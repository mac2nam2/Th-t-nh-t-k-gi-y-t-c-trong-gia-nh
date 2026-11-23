import React, { useCallback, useEffect, useState } from 'react';
import {
  Download,
  Home,
  FolderOpen,
  MessageSquareText,
  History,
  Info,
  Lock,
  Eye,
  Type as TypeIcon,
  LogIn,
  LogOut,
  Cloud,
} from 'lucide-react';
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  type User,
} from 'firebase/auth';
import { auth, googleProvider } from './lib/firebase';
import {
  fetchAccessibleCloudCount,
  syncRecordsToFirestore,
  syncUserProfileToFirestore,
} from './lib/firestoreSync';
import type {
  ActiveScreen,
  ArchiveDataset,
  ArchiveRecord,
  DocumentCategory,
} from './types/archive';
import { HomeScreen } from './components/HomeScreen';
import { CatalogScreen } from './components/CatalogScreen';
import { DocumentDetailScreen } from './components/DocumentDetailScreen';
import { QaScreen } from './components/QaScreen';
import { ProvenanceScreen } from './components/ProvenanceScreen';
import { AboutScreen } from './components/AboutScreen';

export default function App() {
  const [screen, setScreen] = useState<ActiveScreen>('home');
  const [dataset, setDataset] = useState<ArchiveDataset | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null);
  const [catalogSearch, setCatalogSearch] = useState('');
  const [catalogCategory, setCatalogCategory] = useState<
    DocumentCategory | 'Tất cả'
  >('Tất cả');

  const [viewMode, setViewMode] = useState<'public' | 'custodian'>('public');
  const [largeText, setLargeText] = useState(false);

  // Firebase Auth & Cloud Firestore state
  const [authReady, setAuthReady] = useState(false);
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [cloudDocCount, setCloudDocCount] = useState<number | null>(null);

  const fetchArchive = useCallback(async (mode: 'public' | 'custodian') => {
    setLoading(true);
    setError(null);
    try {
      const resp = await fetch(`/api/archive?mode=${mode}`);
      if (!resp.ok) {
        throw new Error('Không thể tải dữ liệu kho lưu trữ.');
      }
      const data = (await resp.json()) as ArchiveDataset;
      setDataset(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Không thể kết nối tới máy chủ lưu trữ.'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setAuthUser(user);
      setAuthReady(true);
      if (user) {
        try {
          await syncUserProfileToFirestore(user);
        } catch {
          // Handled via ErrorBoundary / handleFirestoreError
        }
      } else {
        setCloudDocCount(null);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    fetchArchive(viewMode);
  }, [viewMode, fetchArchive]);

  useEffect(() => {
    if (!authReady || !authUser || !dataset) return;
    let active = true;
    (async () => {
      try {
        await syncRecordsToFirestore(dataset.hoSoTaiLieu, authUser);
        const count = await fetchAccessibleCloudCount(authUser);
        if (active) setCloudDocCount(count);
      } catch {
        // Structured error logged in handleFirestoreError
      }
    })();
    return () => {
      active = false;
    };
  }, [authReady, authUser, dataset]);

  const handleGoogleSignIn = async () => {
    setAuthError(null);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      setAuthError(
        err instanceof Error
          ? 'Không thể đăng nhập Google: ' + err.message
          : 'Không thể đăng nhập Google lúc này.'
      );
    }
  };

  const handleSignOut = async () => {
    await signOut(auth);
    setViewMode('public');
  };

  const navigateTo = (nextScreen: ActiveScreen) => {
    setScreen(nextScreen);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSearchFromHome = (query: string) => {
    setCatalogSearch(query);
    setCatalogCategory('Tất cả');
    navigateTo('catalog');
  };

  const handleSelectCategoryFromHome = (category: DocumentCategory) => {
    setCatalogCategory(category);
    setCatalogSearch('');
    navigateTo('catalog');
  };

  const handleOpenDetail = (id: string) => {
    setSelectedRecordId(id);
    navigateTo('detail');
  };

  const handleExportArchive = () => {
    const link = document.createElement('a');
    link.href = '/api/export';
    link.download = 'giadinh.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const selectedRecord: ArchiveRecord | undefined =
    dataset?.hoSoTaiLieu.find((r) => r.id === selectedRecordId) ||
    dataset?.hoSoTaiLieu[0];

  const screenTitles: Record<ActiveScreen, string> = {
    home: 'Trang chủ',
    catalog: 'Kho tài liệu',
    detail: 'Chi tiết tài liệu',
    qa: 'Hỏi đáp gia đình',
    provenance: 'Nguồn tư liệu',
    about: 'Giới thiệu',
  };

  const navItems: {
    id: ActiveScreen;
    label: string;
    mobileLabel: string;
    icon: React.FC<{ className?: string }>;
  }[] = [
    { id: 'home', label: 'Trang chủ', mobileLabel: 'Trang chủ', icon: Home },
    { id: 'catalog', label: 'Kho tài liệu', mobileLabel: 'Tài liệu', icon: FolderOpen },
    { id: 'qa', label: 'Hỏi đáp', mobileLabel: 'Hỏi đáp', icon: MessageSquareText },
    { id: 'provenance', label: 'Nguồn tư liệu', mobileLabel: 'Nguồn gốc', icon: History },
    { id: 'about', label: 'Giới thiệu', mobileLabel: 'Giới thiệu', icon: Info },
  ];

  return (
    <div className="min-h-screen paper-grain flex flex-col">
      {/* Desktop Top Bar (Strictly 3 zones: Wordmark — 5 nav links — 1 primary Export CTA) */}
      <header className="hidden md:block sticky top-0 z-40 border-b border-[#DFD6C7] bg-[#FAF6EE]/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-8 px-6 py-3.5">
          <a
            href="#trang-chu"
            onClick={(e) => {
              e.preventDefault();
              navigateTo('home');
            }}
            className="font-serif-display text-xl font-semibold tracking-tight text-[#241E18] whitespace-nowrap shrink-0"
          >
            Hồ Sơ Gia Đình
          </a>

          <nav
            aria-label="Điều hướng chính"
            className="flex items-center gap-6 text-sm font-medium text-[#5C5145]"
          >
            {navItems.map((item) => {
              const isActive =
                screen === item.id ||
                (screen === 'detail' && item.id === 'catalog');
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => navigateTo(item.id)}
                  className={`py-1.5 whitespace-nowrap shrink-0 transition-colors border-b-2 ${
                    isActive
                      ? 'border-[#8F2D18] text-[#241E18] font-semibold'
                      : 'border-transparent hover:text-[#241E18] hover:border-[#CFC1AC]'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>

          <div className="shrink-0">
            <button
              type="button"
              onClick={handleExportArchive}
              className="inline-flex min-h-[40px] items-center gap-2 rounded-lg bg-[#8F2D18] px-4 py-2 text-xs font-medium text-white hover:bg-[#742312] transition-colors whitespace-nowrap shrink-0"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Xuất dữ liệu</span>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Compact Top App Bar (52px) */}
      <header className="md:hidden sticky top-0 z-40 h-[52px] border-b border-[#DFD6C7] bg-[#FAF6EE]/95 backdrop-blur-md px-4 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => navigateTo('home')}
          className="font-serif-display text-base font-semibold text-[#241E18] truncate"
        >
          {screen === 'home' ? 'Hồ Sơ Gia Đình' : screenTitles[screen]}
        </button>
        <button
          type="button"
          onClick={handleExportArchive}
          className="inline-flex min-h-[40px] items-center gap-1.5 rounded-lg bg-[#8F2D18] px-3 text-xs font-medium text-white whitespace-nowrap shrink-0"
        >
          <Download className="h-3.5 w-3.5" />
          <span>Xuất tệp</span>
        </button>
      </header>

      {/* Main Content Container */}
      <main className="flex-1 mx-auto w-full max-w-7xl px-4 sm:px-6 pt-5 pb-24 md:pb-12">
        {/* Workspace Utility Ribbon (Privacy View Mode + Firebase Auth + Senior Large Text Toggle) */}
        <div className="mb-6 flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-[#E4D7C5] pb-4 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[#685D51] font-medium">Quyền xem hiện tại:</span>
            <div className="inline-flex rounded-lg bg-[#EAE1D3] p-0.5">
              <button
                type="button"
                onClick={() => setViewMode('public')}
                className={`inline-flex min-h-[36px] items-center gap-1.5 rounded-md px-3 font-medium transition-colors whitespace-nowrap ${
                  viewMode === 'public'
                    ? 'bg-white text-[#241E18] shadow-sm'
                    : 'text-[#5C5145] hover:text-[#241E18]'
                }`}
              >
                <Lock className="h-3.5 w-3.5 text-[#8F2D18]" />
                <span>Chế độ công khai (ẩn thông tin nhạy cảm)</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('custodian')}
                className={`inline-flex min-h-[36px] items-center gap-1.5 rounded-md px-3 font-medium transition-colors whitespace-nowrap ${
                  viewMode === 'custodian'
                    ? 'bg-white text-[#241E18] shadow-sm'
                    : 'text-[#5C5145] hover:text-[#241E18]'
                }`}
              >
                <Eye className="h-3.5 w-3.5 text-[#14532D]" />
                <span>Thành viên / Người lưu giữ</span>
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {authReady && authUser ? (
              <div className="inline-flex items-center gap-2 rounded-lg border border-[#CFC1AC] bg-[#FFFDF9] px-3 min-h-[38px]">
                <Cloud className="h-3.5 w-3.5 text-[#14532D]" />
                <span className="text-[#241E18] font-medium truncate max-w-[160px]">
                  {authUser.displayName || authUser.email}
                </span>
                {cloudDocCount !== null && (
                  <span className="text-[#685D51] tabular-nums">
                    ({cloudDocCount} hồ sơ đám mây)
                  </span>
                )}
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="inline-flex items-center gap-1 text-[#8F2D18] hover:underline ml-1 whitespace-nowrap"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span>Đăng xuất</span>
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleGoogleSignIn}
                className="inline-flex min-h-[38px] items-center gap-1.5 rounded-lg border border-[#CFC1AC] bg-[#FFFDF9] px-3 font-medium text-[#241E18] hover:bg-[#F2EAE0] transition-colors whitespace-nowrap"
              >
                <LogIn className="h-3.5 w-3.5 text-[#8F2D18]" />
                <span>Đăng nhập Google (đồng bộ Firestore)</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setLargeText((s) => !s)}
              aria-pressed={largeText}
              className={`inline-flex min-h-[38px] items-center gap-1.5 rounded-lg border px-3 font-medium transition-colors whitespace-nowrap ${
                largeText
                  ? 'border-[#8F2D18] bg-[#8F2D18] text-white'
                  : 'border-[#CFC1AC] bg-[#FFFDF9] text-[#241E18] hover:bg-[#F2EAE0]'
              }`}
            >
              <TypeIcon className="h-3.5 w-3.5" />
              <span>{largeText ? 'Cỡ chữ lớn: Đang bật' : 'Bật cỡ chữ lớn'}</span>
            </button>
          </div>
        </div>

        {authError && (
          <div className="mb-4 rounded-lg border border-[#8F2D18] bg-[#FEF2F2] px-4 py-2.5 text-xs text-[#8F2D18]">
            {authError}
          </div>
        )}

        {/* Loading / Error / Active Screen */}
        {loading && !dataset ? (
          <div className="space-y-6 py-8">
            <div className="h-10 w-2/3 rounded-lg bg-[#EAE1D3] animate-pulse" />
            <div className="h-48 w-full rounded-xl bg-[#EAE1D3] animate-pulse" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="h-64 rounded-xl bg-[#EAE1D3] animate-pulse" />
              <div className="h-64 rounded-xl bg-[#EAE1D3] animate-pulse" />
              <div className="h-64 rounded-xl bg-[#EAE1D3] animate-pulse" />
            </div>
          </div>
        ) : error ? (
          <div className="archival-card rounded-xl p-8 text-center space-y-4">
            <h2 className="font-serif-display text-xl font-semibold text-[#8F2D18]">
              Không thể tải kho lưu trữ
            </h2>
            <p className="text-sm text-[#4A4036]">{error}</p>
            <button
              type="button"
              onClick={() => fetchArchive(viewMode)}
              className="inline-flex min-h-[44px] items-center rounded-lg bg-[#8F2D18] px-5 text-sm font-medium text-white"
            >
              Thử tải lại
            </button>
          </div>
        ) : dataset ? (
          <>
            {screen === 'home' && (
              <HomeScreen
                dataset={dataset}
                largeText={largeText}
                onSearchSubmit={handleSearchFromHome}
                onSelectCategory={handleSelectCategoryFromHome}
                onOpenDetail={handleOpenDetail}
                onOpenQa={() => navigateTo('qa')}
              />
            )}

            {screen === 'catalog' && (
              <CatalogScreen
                key={`${catalogSearch}-${catalogCategory}`}
                records={dataset.hoSoTaiLieu}
                initialSearch={catalogSearch}
                initialCategory={catalogCategory}
                largeText={largeText}
                onOpenDetail={handleOpenDetail}
                onRecordAdded={() => fetchArchive(viewMode)}
              />
            )}

            {screen === 'detail' && selectedRecord && (
              <DocumentDetailScreen
                record={selectedRecord}
                allRecords={dataset.hoSoTaiLieu}
                viewMode={viewMode}
                largeText={largeText}
                onBack={() => navigateTo('catalog')}
                onOpenDetail={handleOpenDetail}
                onSwitchToCustodian={() => setViewMode('custodian')}
                onRecordUpdated={() => fetchArchive(viewMode)}
              />
            )}

            {screen === 'qa' && (
              <QaScreen
                viewMode={viewMode}
                largeText={largeText}
                onOpenDetail={handleOpenDetail}
              />
            )}

            {screen === 'provenance' && (
              <ProvenanceScreen
                records={dataset.hoSoTaiLieu}
                largeText={largeText}
                onOpenDetail={handleOpenDetail}
                onContributionSaved={() => fetchArchive(viewMode)}
              />
            )}

            {screen === 'about' && (
              <AboutScreen
                largeText={largeText}
                onExportArchive={handleExportArchive}
              />
            )}
          </>
        ) : null}
      </main>

      {/* Quiet Archival Footer (Desktop & Scroll End) */}
      <footer className="border-t border-[#DFD6C7] bg-[#F5EFE4] py-6 px-4 sm:px-6 mb-16 md:mb-0">
        <div className="mx-auto max-w-7xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs text-[#5C5145]">
          <p>
            Sản phẩm thực tập của Mạc Văn Nam (PH61940) — Học kỳ 15 FPT Polytechnic & IMTA TECH · Dự án xã hội phi lợi nhuận.
          </p>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => navigateTo('about')}
              className="hover:text-[#8F2D18] underline underline-offset-4"
            >
              Giới thiệu & Hướng dẫn
            </button>
            <button
              type="button"
              onClick={handleExportArchive}
              className="hover:text-[#8F2D18] underline underline-offset-4"
            >
              Xuất giadinh.json
            </button>
          </div>
        </div>
      </footer>

      {/* Mobile Fixed Bottom Tab Bar (5 destinations, thumb-zone ergonomics) */}
      <nav
        aria-label="Thanh điều hướng nhanh trên điện thoại"
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 h-16 border-t border-[#DFD6C7] bg-[#FAF6EE]/95 backdrop-blur-md grid grid-cols-5 items-center"
      >
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            screen === item.id ||
            (screen === 'detail' && item.id === 'catalog');
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => navigateTo(item.id)}
              className={`flex flex-col items-center justify-center min-h-[48px] px-1 transition-colors ${
                isActive ? 'text-[#8F2D18] font-semibold' : 'text-[#5C5145]'
              }`}
            >
              <Icon className="h-5 w-5" />
              <span className="mt-1 text-[10px] leading-none tracking-tight whitespace-nowrap">
                {item.mobileLabel}
              </span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
