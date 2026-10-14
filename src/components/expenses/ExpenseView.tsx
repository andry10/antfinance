import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { formatRupiah, formatDateTime, formatThousandInput, parseThousandInput } from '../../utils/format';
import { ConfirmDeleteModal } from '../common/ConfirmDeleteModal';
import {
  ArrowDownCircle,
  Plus,
  Trash2,
  Calendar,
  DollarSign,
  Tag,
  Clock,
  User
} from 'lucide-react';

export const ExpenseView: React.FC = () => {
  const { expenses, addExpense, deleteExpense } = useApp();

  const [expToDelete, setExpToDelete] = useState<any | null>(null);
  const [deskripsi, setDeskripsi] = useState('');
  const [nominalInput, setNominalInput] = useState('');
  const [kategori, setKategori] = useState<any>('operasional_lain');
  const [dateFilter, setDateFilter] = useState('');

  const todayStr = new Date().toISOString().split('T')[0];

  const handleAddExpense = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseThousandInput(nominalInput);
    if (amount <= 0 || !deskripsi.trim()) {
      alert('Harap masukkan deskripsi dan nominal pengeluaran yang valid.');
      return;
    }

    addExpense({
      kategori,
      deskripsi: deskripsi.trim(),
      nominal: amount
    });

    setDeskripsi('');
    setNominalInput('');
  };

  const filteredExpenses = useMemo(() => {
    if (!dateFilter) return expenses;
    return expenses.filter((e) => e.tanggal === dateFilter);
  }, [expenses, dateFilter]);

  const totalPengeluaranHariIni = expenses
    .filter((e) => e.tanggal === todayStr)
    .reduce((acc, e) => acc + e.nominal, 0);

  const totalPengeluaranFiltered = filteredExpenses.reduce((acc, e) => acc + e.nominal, 0);

  return (
    <div className="p-3 md:p-6 max-w-7xl mx-auto space-y-6 pb-24 md:pb-12">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <ArrowDownCircle className="w-6 h-6 text-rose-600" />
            <span>Kelola Pengeluaran & Biaya Operasional</span>
          </h1>
          <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400">
            Catat beban usaha harian seperti belanja stok, listrik, gaji, dan keperluan toko untuk menghitung Laba Bersih riil.
          </p>
        </div>
      </div>

      {/* Top Cards & Form Split View */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form Catat Pengeluaran (Soft Pastel Rose Container) */}
        <div className="bg-gradient-to-b from-rose-50/60 to-white dark:from-slate-900 dark:to-slate-900/90 border border-rose-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
          <h2 className="font-bold text-sm md:text-base text-rose-950 dark:text-rose-200 flex items-center gap-2">
            <Plus className="w-4 h-4 text-rose-600" />
            <span>Catat Pengeluaran Baru</span>
          </h2>

          <form onSubmit={handleAddExpense} className="space-y-4">
            <div>
              <label className="block text-xs md:text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Kategori Beban:
              </label>
              <select
                value={kategori}
                onChange={(e) => setKategori(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs md:text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500 font-medium"
              >
                <option value="belanja_stok">Belanja Stok Barang / Dagangan</option>
                <option value="listrik_air">Listrik, Air & Internet</option>
                <option value="sewa_tempat">Sewa Tempat / Ruko</option>
                <option value="gaji">Gaji Karyawan / Uang Makan</option>
                <option value="servis_alat">Servis Stik PS / Perlengkapan</option>
                <option value="operasional_lain">Beban Operasional Lainnya</option>
              </select>
            </div>

            <div>
              <label className="block text-xs md:text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Keterangan / Deskripsi:
              </label>
              <input
                type="text"
                placeholder="Contoh: Beli es batu kristal 2 karung"
                value={deskripsi}
                onChange={(e) => setDeskripsi(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs md:text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>

            <div>
              <label className="block text-xs md:text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Nominal Biaya (Rp):
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-base md:text-lg font-black text-rose-500">Rp</span>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="0"
                  value={nominalInput}
                  onChange={(e) => setNominalInput(formatThousandInput(e.target.value))}
                  className="w-full pl-11 pr-4 py-3 text-xl md:text-2xl font-black font-mono rounded-xl border-2 border-rose-300 dark:border-rose-800 bg-white dark:bg-slate-800 text-rose-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500 shadow-xs"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 px-4 rounded-xl text-xs md:text-sm font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-sm transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Simpan Pengeluaran</span>
              <span className="text-[11px] font-mono bg-rose-700/90 px-2 py-0.5 rounded text-rose-100 border border-rose-500/40">
                Enter ↵
              </span>
            </button>
          </form>
        </div>

        {/* Metric Overview & Expense History Table */}
        <div className="lg:col-span-2 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-rose-50/80 dark:bg-slate-900 border border-rose-200/80 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
              <span className="text-xs font-semibold text-rose-800 dark:text-slate-400">Pengeluaran Hari Ini</span>
              <div className="text-xl md:text-2xl font-bold font-mono text-rose-950 dark:text-white mt-1">
                {formatRupiah(totalPengeluaranHariIni)}
              </div>
              <span className="text-xs text-rose-600/80 dark:text-slate-400 font-medium">Beban operasional harian</span>
            </div>

            <div className="bg-amber-50/80 dark:bg-slate-900 border border-amber-200/80 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
              <span className="text-xs font-semibold text-amber-800 dark:text-slate-400">Total Pengeluaran Filter</span>
              <div className="text-xl md:text-2xl font-bold font-mono text-amber-950 dark:text-white mt-1">
                {formatRupiah(totalPengeluaranFiltered)}
              </div>
              <span className="text-xs text-amber-600/80 dark:text-slate-400 font-medium">Akumulasi sesuai tanggal</span>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
            <div className="p-3.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <h3 className="font-bold text-xs md:text-sm text-slate-800 dark:text-white">Riwayat Pengeluaran</h3>
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="px-3 py-1.5 text-xs md:text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
              />
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs md:text-sm">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-bold">
                    <th className="py-3 px-4">Waktu</th>
                    <th className="py-3 px-3">Kategori</th>
                    <th className="py-3 px-3">Keterangan</th>
                    <th className="py-3 px-3 text-right">Nominal</th>
                    <th className="py-3 px-3">Pencatat</th>
                    <th className="py-3 px-3 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredExpenses.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400 text-sm">
                        Belum ada catatan pengeluaran.
                      </td>
                    </tr>
                  ) : (
                    filteredExpenses.map((exp) => (
                      <tr key={exp.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                        <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                          {formatDateTime(exp.waktu)}
                        </td>
                        <td className="py-3 px-3 whitespace-nowrap font-semibold text-slate-700 dark:text-slate-300 capitalize">
                          {exp.kategori.replace('_', ' ')}
                        </td>
                        <td className="py-3 px-3 text-slate-800 dark:text-slate-200 font-medium">
                          {exp.deskripsi}
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-bold text-rose-600 dark:text-rose-400 whitespace-nowrap text-sm md:text-base">
                          {formatRupiah(exp.nominal)}
                        </td>
                        <td className="py-3 px-3 text-slate-500 text-xs whitespace-nowrap">
                          {exp.kasirName}
                        </td>
                        <td className="py-3 px-3 text-center whitespace-nowrap">
                          <button
                            onClick={() => setExpToDelete(exp)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg transition-colors cursor-pointer"
                            title="Hapus Pengeluaran"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* In-App Delete Confirmation Modal */}
      <ConfirmDeleteModal
        isOpen={!!expToDelete}
        title="Hapus Catatan Pengeluaran?"
        message={`Pengeluaran "${expToDelete?.deskripsi || ''}" sebesar ${formatRupiah(expToDelete?.nominal || 0)} akan dihapus dari pembukuan.`}
        onConfirm={() => {
          if (expToDelete) {
            deleteExpense(expToDelete.id);
            setExpToDelete(null);
          }
        }}
        onCancel={() => setExpToDelete(null)}
      />
    </div>
  );
};
