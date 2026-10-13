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
  UserCog
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const { activeTab, setActiveTab, debts, barangList, currentUser } = useApp();

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
    <aside className="w-full h-full bg-white dark:bg-slate-900 flex flex-col shrink-0 z-20 overflow-y-auto no-print">
      <nav className="p-3 space-y-1 flex-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
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
                <span className={`text-[10px] font-bold text-white px-2 py-0.5 rounded-full ${item.badgeColor}`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer subtle brand note */}
      <div className="p-4 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-400 dark:text-slate-500">
        <p className="font-semibold text-slate-700 dark:text-slate-300">POS Usaha Terpadu</p>
        <p className="text-[11px] mt-0.5 text-slate-400 dark:text-slate-500">Menu Tetap (Fixed Navigation)</p>
      </div>
    </aside>
  );
};
