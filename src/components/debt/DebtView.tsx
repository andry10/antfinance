import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { formatRupiah, formatDateTime, formatDate } from '../../utils/format';
import { DebtRecord, PaymentMethod } from '../../types';
import {
  CreditCard,
  Search,
  CheckCircle,
  Clock,
  DollarSign,
  User,
  Phone,
  Calendar,
  X,
  History
} from 'lucide-react';

export const DebtView: React.FC = () => {
  const { debts, payDebt } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'belum_lunas' | 'sebagian' | 'lunas'>('all');

  // Modal Pay Debt States
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [selectedDebt, setSelectedDebt] = useState<DebtRecord | null>(null);
  const [payAmount, setPayAmount] = useState<string>('');
  const [payMethod, setPayMethod] = useState<PaymentMethod>('tunai');
  const [payNote, setPayNote] = useState<string>('');

  // Filtered debts
  const filteredDebts = useMemo(() => {
    return debts.filter((d) => {
      if (statusFilter !== 'all' && d.status !== statusFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          d.namaPelanggan.toLowerCase().includes(q) ||
          d.noHpPelanggan.toLowerCase().includes(q) ||
          d.nomorStruk.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [debts, statusFilter, searchQuery]);

  // Aggregate KPI
  const totalSisaHutang = debts
    .filter((d) => d.status !== 'lunas')
    .reduce((acc, d) => acc + d.sisaHutang, 0);

  const totalSudahDibayar = debts.reduce((acc, d) => acc + d.totalDibayar, 0);

  const openPayModal = (debt: DebtRecord) => {
    setSelectedDebt(debt);
    setPayAmount(debt.sisaHutang.toString());
    setPayMethod('tunai');
    setPayNote('');
    setIsPayModalOpen(true);
  };

  const handleConfirmPayment = () => {
    if (!selectedDebt) return;
    const amount = Number(payAmount) || 0;
    if (amount <= 0 || amount > selectedDebt.sisaHutang) {
      alert(`Nominal pembayaran harus antara Rp 1 s/d ${formatRupiah(selectedDebt.sisaHutang)}`);
      return;
    }

    payDebt(selectedDebt.id, amount, payMethod, payNote.trim() || undefined);
    setIsPayModalOpen(false);
  };

  return (
    <div className="p-3 md:p-6 max-w-7xl mx-auto space-y-6 pb-24 md:pb-12">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <CreditCard className="w-6 h-6 text-rose-600" />
            <span>Kelola Hutang & Kasbon Pelanggan</span>
          </h1>
          <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400">
            Daftar piutang pelanggan, pemantauan jatuh tempo, dan pencatatan cicilan pelunasan.
          </p>
        </div>
      </div>

      {/* KPI Cards (Soft Pastel Colors) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-rose-50/80 dark:bg-rose-950/40 border border-rose-200/80 dark:border-rose-900/60 rounded-2xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-rose-800 dark:text-rose-300">Total Sisa Hutang Belum Lunas</span>
            <div className="text-2xl font-bold font-mono text-rose-950 dark:text-white mt-1">
              {formatRupiah(totalSisaHutang)}
            </div>
            <span className="text-[11px] text-rose-700/80 dark:text-rose-400 font-medium">Piutang kasbon pelanggan aktif</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-900/60 text-rose-700 dark:text-rose-300 flex items-center justify-center shadow-xs">
            <CreditCard className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-900/60 rounded-2xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-emerald-800 dark:text-emerald-300">Total Pembayaran / Cicilan Masuk</span>
            <div className="text-2xl font-bold font-mono text-emerald-950 dark:text-white mt-1">
              {formatRupiah(totalSudahDibayar)}
            </div>
            <span className="text-[11px] text-emerald-700/80 dark:text-emerald-400 font-medium">Uang pelunasan berhasil diterima</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center shadow-xs">
            <CheckCircle className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Filter & Search */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Cari nama pelanggan atau no HP..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
          />
        </div>

        <div className="flex gap-1.5 w-full sm:w-auto overflow-x-auto">
          {(['all', 'belum_lunas', 'sebagian', 'lunas'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg capitalize whitespace-nowrap transition-colors ${
                statusFilter === st
                  ? 'bg-rose-600 text-white font-bold'
                  : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
              }`}
            >
              {st === 'all' ? 'Semua Hutang' : st.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Debt Table / List */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-semibold">
                <th className="py-3 px-4">Nama Pelanggan</th>
                <th className="py-3 px-3">No. Struk & Tanggal</th>
                <th className="py-3 px-3">Jatuh Tempo</th>
                <th className="py-3 px-3 text-right">Total Hutang</th>
                <th className="py-3 px-3 text-right">Sudah Dibayar</th>
                <th className="py-3 px-3 text-right">Sisa Hutang</th>
                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredDebts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 text-xs">
                    Tidak ada catatan hutang pelanggan.
                  </td>
                </tr>
              ) : (
                filteredDebts.map((debt) => (
                  <tr key={debt.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        <span>{debt.namaPelanggan}</span>
                      </div>
                      {debt.noHpPelanggan && (
                        <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                          <Phone className="w-3 h-3" />
                          <span>{debt.noHpPelanggan}</span>
                        </div>
                      )}
                    </td>

                    <td className="py-3 px-3 font-mono">
                      <div className="text-slate-700 dark:text-slate-300">{debt.nomorStruk}</div>
                      <div className="text-[10px] text-slate-400">{formatDate(debt.tanggalTransaksi)}</div>
                    </td>

                    <td className="py-3 px-3 text-slate-600 dark:text-slate-300">
                      {formatDate(debt.jatuhTempo)}
                    </td>

                    <td className="py-3 px-3 text-right font-mono text-slate-500">
                      {formatRupiah(debt.totalHutang)}
                    </td>

                    <td className="py-3 px-3 text-right font-mono text-emerald-600 font-semibold">
                      {formatRupiah(debt.totalDibayar)}
                    </td>

                    <td className="py-3 px-3 text-right font-mono font-bold text-rose-600 dark:text-rose-400 text-sm">
                      {formatRupiah(debt.sisaHutang)}
                    </td>

                    <td className="py-3 px-3 text-center whitespace-nowrap">
                      {debt.status === 'lunas' ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                          LUNAS
                        </span>
                      ) : debt.status === 'sebagian' ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
                          SEBAGIAN
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300">
                          BELUM LUNAS
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      {debt.status !== 'lunas' ? (
                        <button
                          onClick={() => openPayModal(debt)}
                          className="px-3 py-1.5 rounded-lg text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-xs transition-colors"
                        >
                          Bayar / Cicil
                        </button>
                      ) : (
                        <span className="text-slate-400 text-xs font-semibold">Selesai</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL BAYAR / CICIL HUTANG */}
      {isPayModalOpen && selectedDebt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl p-5 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                Pelunasan / Cicil Kasbon
              </h3>
              <button onClick={() => setIsPayModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Pelanggan:</span>
                <span className="font-bold text-slate-800 dark:text-white">{selectedDebt.namaPelanggan}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Sisa Hutang:</span>
                <span className="font-mono font-bold text-rose-600 text-sm">
                  {formatRupiah(selectedDebt.sisaHutang)}
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Nominal Pembayaran (Rp):
              </label>
              <input
                type="number"
                value={payAmount}
                onChange={(e) => setPayAmount(e.target.value)}
                className="w-full px-3 py-2 text-base font-bold font-mono rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
              <div className="flex gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => setPayAmount(selectedDebt.sisaHutang.toString())}
                  className="px-2.5 py-1 text-[11px] rounded bg-emerald-50 text-emerald-700 font-semibold"
                >
                  Lunasi Penuh ({formatRupiah(selectedDebt.sisaHutang)})
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Metode Pembayaran:
              </label>
              <div className="flex gap-2">
                {(['tunai', 'qris', 'transfer'] as PaymentMethod[]).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setPayMethod(m)}
                    className={`flex-1 py-1.5 text-xs font-bold uppercase rounded-lg border transition-colors ${
                      payMethod === m
                        ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Catatan (Opsional):
              </label>
              <input
                type="text"
                placeholder="Contoh: Cicilan transfer bank"
                value={payNote}
                onChange={(e) => setPayNote(e.target.value)}
                className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
              <button
                onClick={() => setIsPayModalOpen(false)}
                className="px-4 py-2 text-xs rounded-xl text-slate-500"
              >
                Batal
              </button>
              <button
                onClick={handleConfirmPayment}
                className="px-5 py-2 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                Simpan Pembayaran
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
