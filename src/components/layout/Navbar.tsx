import React from 'react';
import { useApp } from '../../context/AppContext';
import {
  Store,
  RefreshCw,
  Sun,
  Moon,
  ExternalLink,
  Plus,
  Shield,
  UserCheck,
  LogIn,
  FileText,
  LogOut
} from 'lucide-react';

interface NavbarProps {
  onOpenAuth: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenAuth }) => {
  const {
    currentUser,
    googleUser,
    settings,
    isSyncing,
    syncStatusMessage,
    triggerGoogleSheetSync,
    openNewTxModal,
    darkMode,
    setDarkMode,
    activeTab,
    setActiveTab,
    logout,
    isGoogleTokenExpired
  } = useApp();

  return (
    <header className="h-14 shrink-0 w-full z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-2 sm:px-4 md:px-6 flex items-center justify-between no-print shadow-xs">
      {/* Brand Title (Zone 1) */}
      <div className="flex items-center gap-2 min-w-0">
        <button
          onClick={() => setActiveTab('dashboard')}
          className="flex items-center gap-2 text-left focus:outline-none min-w-0"
        >
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shadow-sm shrink-0">
            <Store className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-xs sm:text-sm md:text-base font-bold tracking-tight text-slate-900 dark:text-white truncate max-w-[110px] sm:max-w-[170px] md:max-w-[240px]">
              {settings.namaToko || 'POS Usaha Terpadu'}
            </span>
          </div>
        </button>
      </div>

      {/* Action Zone (Zone 3) */}
      <div className="flex items-center gap-1.5 sm:gap-2.5">
        {/* Quick Shortcut Laporan */}
        <button
          onClick={() => setActiveTab('laporan')}
          className={`flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-semibold transition-colors shrink-0 ${
            activeTab === 'laporan'
              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300'
              : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400'
          }`}
          title="Laporan Keuangan"
        >
          <FileText className="w-3.5 h-3.5" />
          <span className="hidden md:inline">Laporan</span>
        </button>

        {/* Google Sheet Sync Status Button */}
        <button
          type="button"
          onClick={() => triggerGoogleSheetSync(false, true)}
          disabled={isSyncing}
          title={syncStatusMessage}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
            isGoogleTokenExpired
              ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-xs font-bold'
              : googleUser
              ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
              : 'bg-amber-50 hover:bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
          }`}
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : isGoogleTokenExpired ? 'text-white' : googleUser ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`} />
          <span className="truncate max-w-[140px] hidden sm:inline">
            {isSyncing ? 'Sync...' : isGoogleTokenExpired ? 'Sambung Ulang Sheet' : googleUser ? 'Google Sheet Aktif' : 'Hubungkan Sheet'}
          </span>
        </button>

        {/* Dark Mode Toggle */}
        <button
          onClick={() => setDarkMode(!darkMode)}
          className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0"
          title={darkMode ? 'Mode Terang' : 'Mode Gelap'}
        >
          {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
        </button>

        {/* User Account Button */}
        {currentUser ? (
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => setActiveTab('profil')}
              title="Profil & Pengaturan"
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition-colors shrink-0"
            >
              {currentUser.role === 'owner' ? (
                <Shield className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              ) : (
                <UserCheck className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              )}
              <span className="max-w-[70px] sm:max-w-[110px] truncate">
                {currentUser.name}
              </span>
            </button>

            <button
              onClick={() => {
                if (window.confirm('Apakah Anda yakin ingin keluar (logout)?')) {
                  logout();
                }
              }}
              title="Keluar (Logout)"
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200 dark:border-rose-900/60 transition-colors shrink-0"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Keluar</span>
            </button>
          </div>
        ) : (
          <button
            onClick={onOpenAuth}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors shrink-0"
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Login</span>
          </button>
        )}
      </div>
    </header>
  );
};
