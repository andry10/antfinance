import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  LayoutDashboard,
  Receipt,
  FileText,
  Gamepad2,
  Menu,
  Database,
  AlertCircle,
  ArrowDownCircle,
  UserCog,
  X
} from 'lucide-react';

export const BottomNav: React.FC = () => {
  const { activeTab, setActiveTab, debts, barangList, currentUser } = useApp();
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);

  const unpaidDebtsCount = debts.filter((d) => d.status !== 'lunas').length;
  const lowStockCount = barangList.filter((b) => b.stok <= b.stokMinimum).length;

  const tabs = [
    { id: 'dashboard', label: 'Beranda', icon: LayoutDashboard, badge: null },
    { id: 'transaksi', label: 'Transaksi', icon: Receipt, badge: null },
    { id: 'laporan', label: 'Laporan', icon: FileText, badge: null },
    { id: 'rental_ps', label: 'Rental PS', icon: Gamepad2, badge: null },
    { id: 'more', label: 'Lainnya', icon: Menu, badge: unpaidDebtsCount > 0 ? unpaidDebtsCount : null }
  ];

  const moreMenuItems = [
    ...(currentUser?.role === 'owner' ? [
      {
        id: 'master',
        label: 'Master Data & Harga BBM',
        desc: 'Kelola PPOB, barang, stok & tarif PS',
        icon: Database,
        badge: lowStockCount > 0 ? `${lowStockCount} Stok Rendah` : null,
        badgeColor: 'bg-amber-100 text-amber-800'
      }
    ] : []),
    {
      id: 'hutang',
      label: 'Hutang & Kasbon Pelanggan',
      desc: 'Catat kasbon & riwayat cicilan',
      icon: AlertCircle,
      badge: unpaidDebtsCount > 0 ? `${unpaidDebtsCount} Kasbon` : null,
      badgeColor: 'bg-rose-100 text-rose-800'
    },
    {
      id: 'pengeluaran',
      label: 'Kelola Pengeluaran Usaha',
      desc: 'Catat beban operasional & belanja stok',
      icon: ArrowDownCircle,
      badge: null
    },
    {
      id: 'laporan',
      label: 'Laporan Keuangan & Laba Rugi',
      desc: 'Rekapitulasi omset, laba, dan arus kas',
      icon: FileText,
      badge: null
    },
    {
      id: 'profil',
      label: 'Profil & Kelola User',
      desc: 'Akun kasir, owner, dan sync spreadsheet',
      icon: UserCog,
      badge: null
    }
  ];

  const handleSelectMenu = (tabId: string) => {
    setActiveTab(tabId);
    setIsMoreMenuOpen(false);
  };

  return (
    <>
      {/* Mobile More Sheet Modal */}
      {isMoreMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex flex-col justify-end">
          <div className="bg-white rounded-t-3xl border-t border-slate-200 p-4 pb-6 shadow-2xl space-y-3 animate-in slide-in-from-bottom duration-200">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <span className="font-bold text-sm text-slate-900">Menu Usaha Lainnya</span>
              <button
                onClick={() => setIsMoreMenuOpen(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-700 bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-1.5">
              {moreMenuItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleSelectMenu(item.id)}
                    className={`w-full flex items-center justify-between p-3 rounded-2xl text-left transition-colors ${
                      isActive
                        ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                        : 'bg-slate-50/70 hover:bg-slate-100 text-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shadow-xs ${
                        isActive ? 'bg-emerald-600 text-white' : 'bg-white text-slate-600 border border-slate-200'
                      }`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs md:text-sm font-bold">{item.label}</div>
                        <div className="text-xs text-slate-500">{item.desc}</div>
                      </div>
                    </div>
                    {item.badge && (
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${item.badgeColor}`}>
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Main Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 h-16 bg-white/95 backdrop-blur-md border-t border-slate-200 grid grid-cols-5 items-center px-1 pb-safe no-print shadow-lg shadow-slate-200/50">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive =
            tab.id === 'more'
              ? ['master', 'hutang', 'pengeluaran', 'profil'].includes(activeTab)
              : activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => {
                if (tab.id === 'more') {
                  setIsMoreMenuOpen(true);
                } else {
                  setActiveTab(tab.id);
                }
              }}
              className={`flex flex-col items-center justify-center h-full relative transition-colors ${
                isActive
                  ? 'text-emerald-600 font-bold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <div className="relative">
                <Icon className="w-5 h-5" />
                {tab.badge !== null && (
                  <span className="absolute -top-1 -right-2 bg-rose-500 text-white text-xs font-bold w-4 h-4 rounded-full flex items-center justify-center">
                    {tab.badge}
                  </span>
                )}
              </div>
              <span className="text-xs font-medium mt-1 tracking-tight">{tab.label}</span>
            </button>
          );
        })}
      </nav>
    </>
  );
};
