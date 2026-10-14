/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar } from './components/layout/Navbar';
import { Sidebar } from './components/layout/Sidebar';
import { BottomNav } from './components/layout/BottomNav';
import { DashboardView } from './components/dashboard/DashboardView';
import { TransactionView } from './components/transaction/TransactionView';
import { ReportView } from './components/reports/ReportView';
import { PlayStationView } from './components/playstation/PlayStationView';
import { DebtView } from './components/debt/DebtView';
import { ExpenseView } from './components/expenses/ExpenseView';
import { MasterDataView } from './components/master/MasterDataView';
import { ProfileView } from './components/profile/ProfileView';
import { NewTransactionModal } from './components/transaction/NewTransactionModal';
import { ReceiptModal } from './components/receipt/ReceiptModal';
import { AuthModal } from './components/auth/AuthModal';
import { LoginPage } from './components/auth/LoginPage';
import { Transaction } from './types';

const MainLayout: React.FC = () => {
  const {
    currentUser,
    activeTab,
    isNewTxModalOpen,
    closeNewTxModal
  } = useApp();

  // If user is not logged in, show dedicated LoginPage immediately
  if (!currentUser) {
    return <LoginPage />;
  }

  // Modal receipt, auth states & saved transaction notification
  const [selectedReceiptTx, setSelectedReceiptTx] = useState<Transaction | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [savedNotificationTx, setSavedNotificationTx] = useState<Transaction | null>(null);

  useEffect(() => {
    if (savedNotificationTx) {
      const timer = setTimeout(() => {
        setSavedNotificationTx(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [savedNotificationTx]);

  return (
    <div className="h-screen w-screen overflow-hidden bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans flex flex-col antialiased">
      {/* Top Navbar Header */}
      <Navbar onOpenAuth={() => setIsAuthModalOpen(true)} />

      {/* Main Container: Fixed Sidebar on Left, Only Content Scrolls on Right */}
      <div className="flex-1 flex w-full overflow-hidden relative">
        {/* Desktop Sidebar (Fixed Left Nav) */}
        <div className="hidden md:block w-64 shrink-0 h-full border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 z-20">
          <Sidebar />
        </div>

        {/* Scrollable Content Viewport (Only this area scrolls) */}
        <main className="flex-1 h-full overflow-y-auto overflow-x-hidden bg-slate-50/70 dark:bg-slate-950/70 p-0">
          {activeTab === 'dashboard' && (
            <DashboardView onOpenReceipt={(tx) => setSelectedReceiptTx(tx)} />
          )}
          {activeTab === 'transaksi' && (
            <TransactionView onOpenReceipt={(tx) => setSelectedReceiptTx(tx)} />
          )}
          {activeTab === 'laporan' && <ReportView />}
          {activeTab === 'rental_ps' && (
            <PlayStationView onSuccessTransaction={(tx) => setSavedNotificationTx(tx)} />
          )}
          {activeTab === 'hutang' && <DebtView />}
          {activeTab === 'pengeluaran' && <ExpenseView />}
          {activeTab === 'master' && <MasterDataView />}
          {activeTab === 'profil' && (
            <ProfileView onOpenAuthModal={() => setIsAuthModalOpen(true)} />
          )}
        </main>
      </div>

      {/* Floating Success Toast when Transaction Saved (Shows Cetak Struk Icon Option) */}
      {savedNotificationTx && (
        <div className="fixed bottom-20 md:bottom-6 right-4 z-50 bg-white dark:bg-slate-900 border border-emerald-300 dark:border-emerald-700 shadow-xl rounded-2xl p-3.5 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
            <span className="text-lg">✓</span>
          </div>
          <div>
            <div className="text-xs font-bold text-slate-900 dark:text-white">
              Transaksi Berhasil Disimpan!
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
              {savedNotificationTx.nomorStruk} · Rp {savedNotificationTx.totalJual.toLocaleString('id-ID')}
            </div>
          </div>
          <div className="flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-slate-700">
            <button
              onClick={() => {
                setSelectedReceiptTx(savedNotificationTx);
                setSavedNotificationTx(null);
              }}
              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
              title="Cetak Struk Transaksi"
            >
              <span>🖨️ Cetak Struk</span>
            </button>
            <button
              onClick={() => setSavedNotificationTx(null)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Mobile Bottom Navigation */}
      <BottomNav />

      {/* Modals */}
      <NewTransactionModal
        isOpen={isNewTxModalOpen}
        onClose={closeNewTxModal}
        onSuccess={(tx) => setSavedNotificationTx(tx)}
      />

      <ReceiptModal
        transaction={selectedReceiptTx}
        onClose={() => setSelectedReceiptTx(null)}
      />

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainLayout />
    </AppProvider>
  );
}
