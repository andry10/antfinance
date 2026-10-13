import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { formatRupiah, formatDateTime } from '../../utils/format';
import { Transaction } from '../../types';
import { ConfirmDeleteModal } from '../common/ConfirmDeleteModal';
import {
  Calendar,
  Search,
  Filter,
  Plus,
  Printer,
  Trash2,
  ChevronDown,
  ArrowUpDown,
  Tag,
  Clock,
  User,
  CreditCard
} from 'lucide-react';

interface TransactionViewProps {
  onOpenReceipt: (tx: Transaction) => void;
}

export const TransactionView: React.FC<TransactionViewProps> = ({ onOpenReceipt }) => {
  const { transactions, deleteTransaction, openNewTxModal } = useApp();

  const [txToDelete, setTxToDelete] = useState<Transaction | null>(null);

  const getTodayStr = () => new Date().toISOString().split('T')[0];

  // Date Range Picker State (DEFAULT: today)
  const [startDate, setStartDate] = useState<string>(getTodayStr());
  const [endDate, setEndDate] = useState<string>(getTodayStr());

  // Filter States
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Quick Preset Handlers
  const setPresetToday = () => {
    const today = getTodayStr();
    setStartDate(today);
    setEndDate(today);
  };

  const setPresetYesterday = () => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    const yest = d.toISOString().split('T')[0];
    setStartDate(yest);
    setEndDate(yest);
  };

  const setPresetLast7Days = () => {
    const today = getTodayStr();
    const d = new Date();
    d.setDate(d.getDate() - 6);
    const start = d.toISOString().split('T')[0];
    setStartDate(start);
    setEndDate(today);
  };

  const setPresetThisMonth = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const start = `${year}-${month}-01`;
    const today = getTodayStr();
    setStartDate(start);
    setEndDate(today);
  };

  const setPresetAll = () => {
    setStartDate('');
    setEndDate('');
  };

  // Filtered transactions based on date range, query, and categories
  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      // 1. Date range filter
      if (startDate && tx.tanggal < startDate) return false;
      if (endDate && tx.tanggal > endDate) return false;

      // 2. Category filter
      if (categoryFilter !== 'all' && tx.kategoriUtama !== categoryFilter) {
        return false;
      }

      // 3. Status filter
      if (statusFilter !== 'all' && tx.statusPembayaran !== statusFilter) {
        return false;
      }

      // 4. Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchNumber = tx.nomorStruk.toLowerCase().includes(query);
        const matchCustomer = tx.namaPelanggan?.toLowerCase().includes(query) || false;
        const matchCashier = tx.kasirName.toLowerCase().includes(query);
        const matchItems = tx.items.some((it) => it.nama.toLowerCase().includes(query));
        if (!matchNumber && !matchCustomer && !matchCashier && !matchItems) {
          return false;
        }
      }

      return true;
    });
  }, [transactions, startDate, endDate, categoryFilter, statusFilter, searchQuery]);

  // Aggregate stats for filtered transactions
  const totalOmsetFiltered = filteredTransactions.reduce((acc, t) => acc + t.totalJual, 0);
  const totalModalFiltered = filteredTransactions.reduce((acc, t) => acc + t.totalModal, 0);
  const totalLabaFiltered = filteredTransactions.reduce((acc, t) => acc + t.totalLaba, 0);

  return (
    <div className="p-3 md:p-6 max-w-7xl mx-auto space-y-5 pb-24 md:pb-12">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white">
            Pencatatan Transaksi
          </h1>
          <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400">
            Seluruh transaksi penjualan barang, PPOB, BBM, dan rental PS sesuai rentang tanggal.
          </p>
        </div>

        <button
          onClick={() => openNewTxModal()}
          className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs md:text-sm font-bold shadow-sm transition-colors active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Transaksi Baru</span>
        </button>
      </div>

      {/* FILTER TANGGAL (RENTANG TANGGAL PICKER DENGAN DEFAULT HARI INI) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Date Picker Controls */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-emerald-600" />
              <span>Rentang Tanggal:</span>
            </span>

            <div className="flex items-center gap-1.5">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono"
              />
              <span className="text-xs text-slate-400">s/d</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono"
              />
            </div>
          </div>

          {/* Quick Presets */}
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              onClick={setPresetToday}
              className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-colors ${
                startDate === getTodayStr() && endDate === getTodayStr()
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
              }`}
            >
              Hari Ini
            </button>
            <button
              onClick={setPresetYesterday}
              className="px-2.5 py-1 text-xs rounded-lg font-medium bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
            >
              Kemarin
            </button>
            <button
              onClick={setPresetLast7Days}
              className="px-2.5 py-1 text-xs rounded-lg font-medium bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
            >
              7 Hari Terakhir
            </button>
            <button
              onClick={setPresetThisMonth}
              className="px-2.5 py-1 text-xs rounded-lg font-medium bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
            >
              Bulan Ini
            </button>
            <button
              onClick={setPresetAll}
              className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-colors ${
                !startDate && !endDate
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
              }`}
            >
              Semua
            </button>
          </div>
        </div>

        {/* Secondary Search & Category Filter Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari no struk, item, pelanggan..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          <div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              <option value="all">Semua Kategori</option>
              <option value="ppob_range">PPOB Range (Transfer/Topup Saldo)</option>
              <option value="ppob_lain">PPOB Lainnya (Pulsa, Game, PLN)</option>
              <option value="barang">Barang / Produk Toko</option>
              <option value="bbm">BBM / Pertamini</option>
              <option value="rental_ps">Rental PlayStation</option>
            </select>
          </div>

          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              <option value="all">Semua Status Bayar</option>
              <option value="lunas">Lunas (Tunai, QRIS, Trf)</option>
              <option value="hutang">Hutang / Kasbon</option>
            </select>
          </div>
        </div>
      </div>

      {/* FILTER SUMMARY METRICS (SOFT PASTEL CARDS in light mode, NEUTRAL SLATE in dark mode) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-indigo-50/80 dark:bg-slate-900 border border-indigo-200/80 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
          <span className="text-xs font-semibold text-indigo-800 dark:text-slate-400">Total Transaksi</span>
          <div className="text-lg sm:text-2xl font-bold text-indigo-950 dark:text-white font-mono mt-1">
            {filteredTransactions.length} Struk
          </div>
          <span className="text-[10px] text-indigo-700/70 dark:text-slate-500 font-medium">Sesuai rentang tanggal aktif</span>
        </div>
        <div className="bg-emerald-50/80 dark:bg-slate-900 border border-emerald-200/80 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
          <span className="text-xs font-semibold text-emerald-800 dark:text-slate-400">Total Omset Filter</span>
          <div className="text-lg sm:text-2xl font-bold text-emerald-950 dark:text-white font-mono mt-1">
            {formatRupiah(totalOmsetFiltered)}
          </div>
          <span className="text-[10px] text-emerald-700/70 dark:text-slate-500 font-medium">Bruto penerimaan penjualan</span>
        </div>
        <div className="bg-sky-50/80 dark:bg-slate-900 border border-sky-200/80 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
          <span className="text-xs font-semibold text-sky-800 dark:text-slate-400">Total Laba Kotor</span>
          <div className="text-lg sm:text-2xl font-bold text-sky-950 dark:text-white font-mono mt-1">
            {formatRupiah(totalLabaFiltered)}
          </div>
          <span className="text-[10px] text-sky-700/70 dark:text-slate-500 font-medium">Omset dikurangi modal HPP</span>
        </div>
      </div>

      {/* TRANSACTION LIST TABLE */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-semibold">
                <th className="py-3 px-3 sm:px-4">No. Struk & Waktu</th>
                <th className="py-3 px-3">Kategori</th>
                <th className="py-3 px-3">Rincian Item</th>
                <th className="py-3 px-3 text-right">Modal</th>
                <th className="py-3 px-3 text-right">Total Jual</th>
                <th className="py-3 px-3 text-right">Laba</th>
                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 px-3 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 text-xs">
                    Tidak ada transaksi ditemukan pada rentang tanggal ini.
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                    {/* No Struk & Waktu */}
                    <td className="py-3 px-3 sm:px-4">
                      <div className="font-mono font-bold text-slate-800 dark:text-white">
                        {tx.nomorStruk}
                      </div>
                      <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                        <Clock className="w-3 h-3" />
                        <span>{formatDateTime(tx.waktu)}</span>
                      </div>
                      <div className="text-[10px] text-slate-500">Kasir: {tx.kasirName}</div>
                    </td>

                    {/* Kategori Badge */}
                    <td className="py-3 px-3 whitespace-nowrap">
                      {tx.kategoriUtama === 'ppob_range' && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300">
                          PPOB Range
                        </span>
                      )}
                      {tx.kategoriUtama === 'ppob_lain' && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-cyan-50 text-cyan-700 dark:bg-cyan-950/60 dark:text-cyan-300">
                          PPOB Lainnya
                        </span>
                      )}
                      {tx.kategoriUtama === 'barang' && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                          Barang Toko
                        </span>
                      )}
                      {tx.kategoriUtama === 'bbm' && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-orange-50 text-orange-700 dark:bg-orange-950/60 dark:text-orange-300">
                          BBM
                        </span>
                      )}
                      {tx.kategoriUtama === 'rental_ps' && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300">
                          Rental PS
                        </span>
                      )}
                    </td>

                    {/* Rincian Item */}
                    <td className="py-3 px-3 max-w-[220px]">
                      <div className="font-medium text-slate-800 dark:text-slate-200">
                        {tx.items[0]?.nama} {tx.items[0] && tx.items[0].qty > 1 && `(${tx.items[0].qty}x)`}
                      </div>
                      {tx.items.length > 1 && (
                        <div className="text-[10px] text-slate-500">
                          +{tx.items.length - 1} item lainnya
                        </div>
                      )}
                      {tx.namaPelanggan && (
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          Pelanggan: <span className="font-semibold">{tx.namaPelanggan}</span>
                        </div>
                      )}
                    </td>

                    {/* Modal */}
                    <td className="py-3 px-3 text-right font-mono text-slate-500">
                      {formatRupiah(tx.totalModal)}
                    </td>

                    {/* Total Jual */}
                    <td className="py-3 px-3 text-right font-mono font-bold text-slate-900 dark:text-white">
                      {formatRupiah(tx.totalJual)}
                    </td>

                    {/* Laba */}
                    <td className="py-3 px-3 text-right font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                      +{formatRupiah(tx.totalLaba)}
                    </td>

                    {/* Status Bayar */}
                    <td className="py-3 px-3 text-center whitespace-nowrap">
                      {tx.statusPembayaran === 'lunas' ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                          LUNAS · {tx.metodePembayaran.toUpperCase()}
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300">
                          HUTANG
                        </span>
                      )}
                    </td>

                    {/* Aksi */}
                    <td className="py-3 px-3 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => onOpenReceipt(tx)}
                          title="Cetak / Lihat Struk"
                          className="p-1.5 text-slate-600 hover:text-emerald-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors"
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setTxToDelete(tx)}
                          title="Hapus Transaksi"
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* In-App Delete Confirmation Modal */}
      <ConfirmDeleteModal
        isOpen={!!txToDelete}
        title={`Hapus Transaksi ${txToDelete?.nomorStruk || ''}?`}
        message={`Data transaksi ini (${txToDelete?.items[0]?.nama || 'Penjualan'}) senilai ${formatRupiah(txToDelete?.totalJual || 0)} akan dihapus dari riwayat dan pembukuan.`}
        onConfirm={() => {
          if (txToDelete) {
            deleteTransaction(txToDelete.id);
            setTxToDelete(null);
          }
        }}
        onCancel={() => setTxToDelete(null)}
      />
    </div>
  );
};
