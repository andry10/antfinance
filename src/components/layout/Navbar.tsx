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
  FileText
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
    setActiveTab
  } = useApp();

  return (
    <header className="h-14 shrink-0 w-full z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 px-3 md:px-6 flex items-center justify-between no-print shadow-xs">
      {/* Brand Title (Zone 1) */}
      <div className="flex items-center gap-2.5">
        <button
          onClick={() => setActiveTab('dashboard')}
          className="flex items-center gap-2.5 text-left focus:outline-none"
        >
          <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shadow-sm">
            <Store className="w-4 h-4" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm md:text-base font-bold tracking-tight text-slate-900 whitespace-nowrap">
              {settings.namaToko || 'POS Usaha Terpadu'}
            </span>
            <span className="text-[10px] text-slate-500 hidden sm:inline">
              Kasir, PPOB, BBM & Rental PS
            </span>
          </div>
        </button>
      </div>

      {/* Action Zone (Zone 3) */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Quick Shortcut Laporan */}
        <button
          onClick={() => setActiveTab('laporan')}
          className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
            activeTab === 'laporan'
              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
              : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
          }`}
          title="Buka Laporan Keuangan & Laba Rugi"
        >
          <FileText className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Laporan Keuangan</span>
        </button>

        {/* Google Sheet Sync Status Button */}
        <button
          onClick={() => triggerGoogleSheetSync()}
          disabled={isSyncing}
          title={syncStatusMessage}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
            googleUser
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
              : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
          }`}
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-emerald-600' : googleUser ? 'text-emerald-600' : 'text-slate-500'}`} />
          <span className="hidden md:inline whitespace-nowrap">
            {isSyncing ? 'Menyinkronkan...' : googleUser ? 'Auto-Sync Google Sheet: Aktif' : 'Sinkron ke Google Sheet'}
          </span>
        </button>

        {settings.spreadsheetUrl && (
          <a
            href={settings.spreadsheetUrl}
            target="_blank"
            rel="noopener noreferrer"
            title="Buka Google Sheet di tab baru"
            className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors hidden sm:flex items-center justify-center"
          >
            <ExternalLink className="w-4 h-4" />
          </a>
        )}

        {/* Dark Mode Toggle */}
        <button
          onClick={() => setDarkMode(!darkMode)}
          className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title={darkMode ? 'Beralih ke Mode Terang' : 'Beralih ke Mode Gelap'}
        >
          {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
        </button>

        {/* Quick Transaction Action (Desktop) */}
        <button
          onClick={() => openNewTxModal()}
          className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm transition-colors whitespace-nowrap"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Transaksi</span>
        </button>

        {/* User Account Button */}
        {currentUser ? (
          <button
            onClick={onOpenAuth}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition-colors"
          >
            {currentUser.role === 'owner' ? (
              <Shield className="w-3.5 h-3.5 text-amber-600" />
            ) : (
              <UserCheck className="w-3.5 h-3.5 text-blue-600" />
            )}
            <span className="font-semibold max-w-[90px] sm:max-w-[130px] truncate">
              {currentUser.name}
            </span>
          </button>
        ) : (
          <button
            onClick={onOpenAuth}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors"
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Login</span>
          </button>
        )}
      </div>
    </header>
  );
};
