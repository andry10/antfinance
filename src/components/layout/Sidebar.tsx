import React from 'react';
import { useApp } from '../../context/AppContext';
import {
  LayoutDashboard,
  Receipt,
  FileText,
  Gamepad2,
  AlertCircle,
  ArrowDownCircle,
  Database,
  UserCog,
  LogOut
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const { activeTab, setActiveTab, debts, barangList, currentUser, logout } = useApp();

  const unpaidDebtsCount = debts.filter((d) => d.status !== 'lunas').length;
  const lowStockCount = barangList.filter((b) => b.stok <= b.stokMinimum).length;

  const navItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      badge: null
    },
    {
      id: 'transaksi',
      label: 'Transaksi',
      icon: Receipt,
      badge: null
    },
    {
      id: 'rental_ps',
      label: 'Rental PlayStation',
      icon: Gamepad2,
      badge: null
    },
    {
      id: 'laporan',
      label: 'Laporan Keuangan',
      icon: FileText,
      badge: null
    },
    {
      id: 'hutang',
      label: 'Hutang Pelanggan',
      icon: AlertCircle,
      badge: unpaidDebtsCount > 0 ? unpaidDebtsCount : null,
      badgeColor: 'bg-rose-500'
    },
    {
      id: 'pengeluaran',
      label: 'Kelola Pengeluaran',
      icon: ArrowDownCircle,
      badge: null
    },
    ...(currentUser?.role === 'owner' ? [
      {
        id: 'master',
        label: 'Master Data',
        icon: Database,
        badge: lowStockCount > 0 ? lowStockCount : null,
        badgeColor: 'bg-amber-500'
      }
    ] : []),
    {
      id: 'profil',
      label: 'Profil & Pengaturan',
      icon: UserCog,
      badge: null
    }
  ];

  return (
    <aside className="w-full h-full bg-white dark:bg-slate-900 flex flex-col justify-between shrink-0 z-20 no-print border-r border-slate-200 dark:border-slate-800">
      <nav className="p-3 space-y-1 flex-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs md:text-sm font-semibold transition-all ${
                isActive
                  ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-bold border border-emerald-200/80 dark:border-emerald-800 shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400 dark:text-slate-500'}`} />
                <span>{item.label}</span>
              </div>
              {item.badge !== null && (
                <span className={`text-xs font-bold text-white px-2 py-0.5 rounded-full ${item.badgeColor}`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Active User Card & Logout Button at Bottom */}
      {currentUser && (
        <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/40">
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 flex items-center justify-center font-bold text-xs shrink-0">
                {currentUser.name.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                  {currentUser.name}
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 capitalize font-medium">
                  {currentUser.role} · @{currentUser.username}
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={() => {
              if (window.confirm('Apakah Anda yakin ingin keluar (logout)?')) {
                logout();
              }
            }}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold bg-rose-50 hover:bg-rose-100 text-rose-600 dark:bg-rose-950/50 dark:hover:bg-rose-900/50 dark:text-rose-300 border border-rose-200/80 dark:border-rose-900/60 transition-colors"
            title="Keluar dari sistem POS"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Keluar (Logout)</span>
          </button>
        </div>
      )}
    </aside>
  );
};
