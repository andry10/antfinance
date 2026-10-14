import React from 'react';
import { useApp } from '../../context/AppContext';
import { formatRupiah, formatNumber, formatDateTime } from '../../utils/format';
import {
  TrendingUp,
  DollarSign,
  Receipt,
  AlertTriangle,
  Fuel,
  CreditCard,
  Plus,
  ArrowRight,
  Package,
  Calendar,
  Gamepad2,
  Clock,
  Sparkles,
  FileText,
  RefreshCw,
  ExternalLink,
  Printer
} from 'lucide-react';

interface DashboardViewProps {
  onOpenReceipt?: (tx: any) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ onOpenReceipt }) => {
  const {
    transactions,
    debts,
    expenses,
    barangList,
    bbmList,
    activePsSessions,
    setActiveTab,
    openNewTxModal,
    settings,
    isSyncing,
    syncStatusMessage,
    triggerGoogleSheetSync,
    googleUser
  } = useApp();

  // Date today string
  const todayStr = new Date().toISOString().split('T')[0];

  // 1. Transactions today
  const todayTransactions = transactions.filter((t) => t.tanggal === todayStr);

  // 2. Omset Hari Ini
  const omsetHariIni = todayTransactions.reduce((acc, t) => acc + t.totalJual, 0);

  // 3. Laba Kotor Hari Ini
  const labaKotorHariIni = todayTransactions.reduce((acc, t) => acc + t.totalLaba, 0);

  // 4. Expenses Hari Ini
  const todayExpenses = expenses.filter((e) => e.tanggal === todayStr);
  const totalPengeluaranHariIni = todayExpenses.reduce((acc, e) => acc + e.nominal, 0);

  // 5. Laba Bersih Hari Ini (Laba Kotor - Pengeluaran)
  const labaBersihHariIni = labaKotorHariIni - totalPengeluaranHariIni;

  // 6. Transaksi Count Hari Ini
  const jumlahTransaksiHariIni = todayTransactions.length;

  // 7. Jumlah Hutang Pelanggan (Total Unpaid Debts)
  const totalHutangPelanggan = debts
    .filter((d) => d.status !== 'lunas')
    .reduce((acc, d) => acc + d.sisaHutang, 0);

  // 8. Stok Menipis Items
  const lowStockItems = barangList.filter((b) => b.stok <= b.stokMinimum);
  const jumlahStokMenipis = lowStockItems.length;

  // 9. Total Stok BBM (Liter)
  const totalStokBbmLiter = bbmList.reduce((acc, b) => acc + b.stokLiter, 0);

  // 10. Top 5 Transaksi Terbaru
  const latestFiveTransactions = transactions.slice(0, 5);

  // 11. Top Hutang Pelanggan Aktif
  const activeDebts = debts.filter((d) => d.status !== 'lunas').slice(0, 5);

  return (
    <div className="p-3 md:p-6 max-w-7xl mx-auto space-y-6 pb-24 md:pb-12">
      {/* Top Banner (Bright & Soft Pastel Gradient, No Dark Colors) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-emerald-50 via-teal-50 to-sky-50 border border-emerald-200/90 rounded-2xl p-4 md:p-6 shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-emerald-800 text-xs font-bold uppercase tracking-wider">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <Calendar className="w-3.5 h-3.5 text-emerald-600" />
            <span>{new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span>
          </div>
          <h1 className="text-xl md:text-2xl font-extrabold text-emerald-950 mt-1">Dashboard Usaha Hari Ini</h1>
          <p className="text-xs md:text-sm text-emerald-800/80 mt-0.5">
            Ringkasan pendapatan toko, penjualan BBM, rental PS, dan sisa kasbon pelanggan.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setActiveTab('laporan')}
            className="flex items-center justify-center gap-1.5 px-3.5 py-2.5 bg-white hover:bg-emerald-100/60 text-emerald-800 border border-emerald-300 rounded-xl font-bold text-xs md:text-sm shadow-xs transition-all active:scale-95"
          >
            <FileText className="w-4 h-4 text-emerald-600" />
            <span>Laporan Lengkap</span>
          </button>

          <button
            onClick={() => openNewTxModal()}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs md:text-sm shadow-sm transition-all active:scale-95 shrink-0"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Buat Transaksi Baru</span>
          </button>
        </div>
      </div>

      {/* 7 KPI UTAMA DASHBOARD */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Metrik Utama Hari Ini
          </h2>
          <span className="text-xs text-slate-400">Pembaruan realtime</span>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          {/* KPI 1: Omset Hari Ini (Soft Emerald / Mint) */}
          <div className="bg-emerald-50/80 border border-emerald-200/80 rounded-2xl p-4 shadow-xs flex flex-col justify-between transition-all hover:shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-emerald-800">Omset Hari Ini</span>
              <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shadow-xs">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-lg md:text-2xl font-bold text-emerald-950 font-mono tabular-nums">
                {formatRupiah(omsetHariIni)}
              </div>
              <div className="text-xs text-emerald-700/80 mt-1 font-medium">
                {jumlahTransaksiHariIni} transaksi berhasil
              </div>
            </div>
          </div>

          {/* KPI 2: Laba Kotor (Soft Sky / Cyan) */}
          <div className="bg-sky-50/80 border border-sky-200/80 rounded-2xl p-4 shadow-xs flex flex-col justify-between transition-all hover:shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-sky-800">Laba Kotor</span>
              <div className="w-8 h-8 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center shadow-xs">
                <DollarSign className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-lg md:text-2xl font-bold text-sky-950 font-mono tabular-nums">
                {formatRupiah(labaKotorHariIni)}
              </div>
              <div className="text-xs text-sky-700/80 mt-1 font-medium">
                Total Omset - Modal
              </div>
            </div>
          </div>

          {/* KPI 3: Laba Bersih (Soft Teal / Mint) */}
          <div className="bg-teal-50/80 border border-teal-200/80 rounded-2xl p-4 shadow-xs flex flex-col justify-between transition-all hover:shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-teal-800">Laba Bersih</span>
              <div className="w-8 h-8 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center shadow-xs">
                <Sparkles className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-lg md:text-2xl font-bold font-mono tabular-nums text-teal-950">
                {formatRupiah(labaBersihHariIni)}
              </div>
              <div className="text-xs text-teal-700/80 mt-1 font-medium">
                Dikurangi beban: {formatRupiah(totalPengeluaranHariIni)}
              </div>
            </div>
          </div>

          {/* KPI 4: Total Transaksi Hari Ini (Soft Indigo / Lavender) */}
          <div className="bg-indigo-50/80 border border-indigo-200/80 rounded-2xl p-4 shadow-xs flex flex-col justify-between transition-all hover:shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-indigo-800">Transaksi Hari Ini</span>
              <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center shadow-xs">
                <Receipt className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-lg md:text-2xl font-bold text-indigo-950 font-mono tabular-nums">
                {formatNumber(jumlahTransaksiHariIni)}
              </div>
              <div className="text-xs text-indigo-700/80 mt-1 font-medium">
                Struk penjualan masuk
              </div>
            </div>
          </div>

          {/* KPI 5: Jumlah Hutang Pelanggan (Soft Rose / Blush) */}
          <div className="bg-rose-50/80 border border-rose-200/80 rounded-2xl p-4 shadow-xs flex flex-col justify-between transition-all hover:shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-rose-800">Hutang Pelanggan</span>
              <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center shadow-xs">
                <CreditCard className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-lg md:text-2xl font-bold text-rose-950 font-mono tabular-nums">
                {formatRupiah(totalHutangPelanggan)}
              </div>
              <div className="text-xs text-rose-700/80 mt-1 font-medium">
                {debts.filter((d) => d.status !== 'lunas').length} pelanggan berhutang
              </div>
            </div>
          </div>

          {/* KPI 6: Stok Menipis (Soft Amber / Butter) */}
          <div className="bg-amber-50/80 border border-amber-200/80 rounded-2xl p-4 shadow-xs flex flex-col justify-between transition-all hover:shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-amber-800">Stok Menipis</span>
              <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shadow-xs">
                <AlertTriangle className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-lg md:text-2xl font-bold font-mono tabular-nums text-amber-950">
                {jumlahStokMenipis} <span className="text-xs font-normal text-amber-800">item</span>
              </div>
              <div className="text-xs text-amber-700/80 mt-1 font-medium">
                Stok di bawah batas minimum
              </div>
            </div>
          </div>

          {/* KPI 7: Stok BBM (Soft Peach / Orange) */}
          <div className="bg-orange-50/80 border border-orange-200/80 rounded-2xl p-4 shadow-xs flex flex-col justify-between col-span-2 lg:col-span-2 transition-all hover:shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-orange-800">Stok BBM Tersedia</span>
              <div className="w-8 h-8 rounded-xl bg-orange-100 text-orange-700 flex items-center justify-center shadow-xs">
                <Fuel className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline justify-between flex-wrap gap-2">
              <div className="text-lg md:text-2xl font-bold text-orange-950 font-mono tabular-nums">
                {totalStokBbmLiter.toFixed(1)} <span className="text-sm font-semibold">Liter</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-orange-800 font-medium">
                {bbmList.map((b) => (
                  <span key={b.id} className="font-mono bg-white/70 px-2 py-0.5 rounded-lg border border-orange-100">
                    {b.jenisBBM}: <span className="font-bold text-orange-950">{b.stokLiter}L</span>
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>



      {/* LIVE RENTAL PS WIDGET ALERT (If any active) */}
      {activePsSessions.length > 0 && (
        <div className="bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-900/60 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 text-indigo-700 dark:text-indigo-400 font-semibold text-sm">
              <Gamepad2 className="w-4 h-4" />
              <span>Rental PlayStation Sedang Berjalan ({activePsSessions.length} Unit Aktif)</span>
            </div>
            <button
              onClick={() => setActiveTab('rental_ps')}
              className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 font-medium"
            >
              Buka Billing <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {activePsSessions.map((sess) => (
              <div key={sess.id} className="bg-white dark:bg-slate-900 border border-indigo-100 dark:border-slate-800 rounded-lg p-3 text-xs flex justify-between items-center shadow-xs">
                <div>
                  <div className="font-bold text-slate-800 dark:text-white">{sess.namaUnit}</div>
                  <div className="text-slate-500">{sess.namaPelanggan} · {sess.mode === 'paket_jam' ? `Paket ${sess.durasiPaketJam} Jam` : 'Open Billing'}</div>
                </div>
                <div className="text-right font-mono">
                  <div className="font-bold text-indigo-600 dark:text-indigo-400">{formatRupiah(sess.totalBiaya)}</div>
                  <div className="text-xs text-slate-400 flex items-center gap-1 justify-end font-mono">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{sess.durasiMenitTerhitung} mnt</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3 BLOK SEKURANG DI BAWAH KPI (WARNA-WARNI SOFT PASTEL): */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* BLOK 1: Riwayat Transaksi Dibatasi 5 Terbaru (Soft Emerald) */}
        <div className="bg-gradient-to-b from-emerald-50/60 to-white dark:from-slate-900 dark:to-slate-900/90 border border-emerald-200/70 dark:border-slate-800 rounded-2xl p-4 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-emerald-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <Receipt className="w-3.5 h-3.5" />
                </div>
                <h3 className="font-bold text-sm text-emerald-950 dark:text-white">
                  Riwayat Transaksi (5 Terbaru)
                </h3>
              </div>
            </div>

            <div className="divide-y divide-emerald-100/70 dark:divide-slate-800 mt-2">
              {latestFiveTransactions.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  Belum ada transaksi tercatat.
                </div>
              ) : (
                latestFiveTransactions.map((tx, idx) => (
                  <div key={`dash-${tx.id || 'tx'}-${idx}`} className="py-2.5 flex items-center justify-between text-xs md:text-sm">
                    <div className="space-y-0.5">
                      <div className="font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[170px]">
                        {tx.items[0]?.nama || 'Transaksi'} {tx.items.length > 1 && `+${tx.items.length - 1} item`}
                      </div>
                      <div className="text-xs text-slate-400 flex items-center gap-2">
                        <span>{tx.nomorStruk}</span>
                        <span>·</span>
                        <span className="font-semibold text-emerald-700 dark:text-emerald-400">{tx.metodePembayaran.toUpperCase()}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-right font-mono">
                        <div className="font-bold text-slate-900 dark:text-white">
                          {formatRupiah(tx.totalJual)}
                        </div>
                        <div className="text-xs text-emerald-600 dark:text-emerald-400 font-bold">
                          +{formatRupiah(tx.totalLaba)}
                        </div>
                      </div>
                      {onOpenReceipt && (
                        <button
                          type="button"
                          onClick={() => onOpenReceipt(tx)}
                          title="Cetak Struk Transaksi"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-700 hover:bg-emerald-100/60 dark:hover:bg-slate-800 transition-colors"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="pt-3 border-t border-emerald-100 dark:border-slate-800 mt-2">
            <button
              onClick={() => setActiveTab('transaksi')}
              className="w-full py-2.5 px-3 rounded-xl bg-emerald-100/70 hover:bg-emerald-200/70 dark:bg-emerald-950/40 text-xs md:text-sm font-bold text-emerald-800 dark:text-emerald-300 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <span>Lihat Selengkapnya</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* BLOK 2: Stok Menipis (Soft Amber) */}
        <div className="bg-gradient-to-b from-amber-50/60 to-white dark:from-slate-900 dark:to-slate-900/90 border border-amber-200/70 dark:border-slate-800 rounded-2xl p-4 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-amber-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
                  <AlertTriangle className="w-3.5 h-3.5" />
                </div>
                <h3 className="font-bold text-sm text-amber-950 dark:text-white">
                  Barang Stok Menipis
                </h3>
              </div>
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                {lowStockItems.length} Menipis
              </span>
            </div>

            <div className="divide-y divide-amber-100/70 dark:divide-slate-800 mt-2">
              {lowStockItems.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  Semua stok barang aman di atas batas minimum.
                </div>
              ) : (
                lowStockItems.slice(0, 5).map((item) => (
                  <div key={item.id} className="py-2.5 flex items-center justify-between text-xs md:text-sm">
                    <div>
                      <div className="font-semibold text-slate-800 dark:text-slate-200">
                        {item.nama}
                      </div>
                      <div className="text-xs text-slate-400">
                        Min. Stok: {item.stokMinimum} {item.satuan} · Jual: {formatRupiah(item.hargaJual)}
                      </div>
                    </div>
                    <div className="text-right font-mono">
                      <span className="font-bold text-rose-700 dark:text-rose-400 bg-rose-100/70 dark:bg-rose-950/60 border border-rose-200 px-2 py-0.5 rounded-lg text-xs">
                        Sisa: {item.stok} {item.satuan}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="pt-3 border-t border-amber-100 dark:border-slate-800 mt-2">
            <button
              onClick={() => setActiveTab('master')}
              className="w-full py-2.5 px-3 rounded-xl bg-amber-100/70 hover:bg-amber-200/70 dark:bg-amber-950/40 text-xs md:text-sm font-bold text-amber-800 dark:text-amber-300 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <span>Lihat Selengkapnya</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* BLOK 3: Hutang Pelanggan (Soft Rose) */}
        <div className="bg-gradient-to-b from-rose-50/60 to-white dark:from-slate-900 dark:to-slate-900/90 border border-rose-200/70 dark:border-slate-800 rounded-2xl p-4 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-rose-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center">
                  <CreditCard className="w-3.5 h-3.5" />
                </div>
                <h3 className="font-bold text-sm text-rose-950 dark:text-white">
                  Hutang Pelanggan
                </h3>
              </div>
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-200">
                {activeDebts.length} Kasbon
              </span>
            </div>

            <div className="divide-y divide-rose-100/70 dark:divide-slate-800 mt-2">
              {activeDebts.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  Tidak ada hutang pelanggan yang belum lunas.
                </div>
              ) : (
                activeDebts.map((debt) => (
                  <div key={debt.id} className="py-2.5 flex items-center justify-between text-xs md:text-sm">
                    <div>
                      <div className="font-semibold text-slate-800 dark:text-slate-200">
                        {debt.namaPelanggan}
                      </div>
                      <div className="text-xs text-slate-400">
                        Tempo: {debt.jatuhTempo || '-'} · {debt.noHpPelanggan || 'Tanpa No HP'}
                      </div>
                    </div>
                    <div className="text-right font-mono">
                      <div className="font-bold text-rose-700 dark:text-rose-400">
                        {formatRupiah(debt.sisaHutang)}
                      </div>
                      <div className="text-xs text-slate-400">
                        Dari {formatRupiah(debt.totalHutang)}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="pt-3 border-t border-rose-100 mt-2">
            <button
              onClick={() => setActiveTab('hutang')}
              className="w-full py-2 px-3 rounded-xl bg-rose-100/70 hover:bg-rose-200/70 text-xs font-bold text-rose-800 flex items-center justify-center gap-1.5 transition-colors"
            >
              <span>Lihat Selengkapnya</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* FLOATING ACTION BUTTON (FAB) FOR MOBILE & COMPACT DEVICES */}
      <button
        onClick={() => openNewTxModal()}
        aria-label="Tambah Transaksi Baru"
        className="fixed bottom-20 right-4 md:bottom-8 md:right-8 z-40 w-14 h-14 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-full flex items-center justify-center shadow-lg shadow-emerald-600/30 transition-transform cursor-pointer"
      >
        <Plus className="w-7 h-7 stroke-[2.5]" />
      </button>
    </div>
  );
};
