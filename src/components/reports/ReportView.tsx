import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { formatRupiah, formatNumber, formatDate, formatDateTime } from '../../utils/format';
import {
  FileText,
  Calendar,
  TrendingUp,
  DollarSign,
  Download,
  Printer,
  FileSpreadsheet,
  Fuel,
  Gamepad2,
  Zap,
  Package,
  CreditCard,
  Layers,
  Search,
  CheckCircle2,
  Receipt,
  ArrowDownCircle,
  Clock,
  Sparkles
} from 'lucide-react';

export const ReportView: React.FC = () => {
  const { transactions, expenses, debts, bbmList, settings, triggerGoogleSheetSync, isSyncing } = useApp();

  const getTodayStr = () => new Date().toISOString().split('T')[0];

  // Active Report Tab: 'ringkasan' | 'transaksi' | 'pengeluaran' | 'hutang'
  const [reportSubTab, setReportSubTab] = useState<'ringkasan' | 'transaksi' | 'pengeluaran' | 'hutang'>('ringkasan');

  // Date Range Filter (Default: Bulan Ini)
  const [startDate, setStartDate] = useState<string>(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}-01`;
  });
  const [endDate, setEndDate] = useState<string>(getTodayStr());

  // Search filter inside detailed tables
  const [tableSearch, setTableSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  // Quick Presets
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
    setStartDate(d.toISOString().split('T')[0]);
    setEndDate(today);
  };

  const setPresetThisMonth = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    setStartDate(`${year}-${month}-01`);
    setEndDate(getTodayStr());
  };

  const setPresetLastMonth = () => {
    const now = new Date();
    const year = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
    const prevMonth = now.getMonth() === 0 ? 12 : now.getMonth();
    const monthStr = String(prevMonth).padStart(2, '0');
    const lastDay = new Date(year, prevMonth, 0).getDate();
    setStartDate(`${year}-${monthStr}-01`);
    setEndDate(`${year}-${monthStr}-${lastDay}`);
  };

  const setPresetAll = () => {
    setStartDate('');
    setEndDate('');
  };

  // Filtered Data based on Date Range
  const filteredTxs = useMemo(() => {
    return transactions.filter((t) => {
      if (startDate && t.tanggal < startDate) return false;
      if (endDate && t.tanggal > endDate) return false;
      return true;
    });
  }, [transactions, startDate, endDate]);

  const filteredExpenses = useMemo(() => {
    return expenses.filter((e) => {
      if (startDate && e.tanggal < startDate) return false;
      if (endDate && e.tanggal > endDate) return false;
      return true;
    });
  }, [expenses, startDate, endDate]);

  const filteredDebts = useMemo(() => {
    return debts.filter((d) => {
      if (startDate && d.tanggalTransaksi < startDate) return false;
      if (endDate && d.tanggalTransaksi > endDate) return false;
      return true;
    });
  }, [debts, startDate, endDate]);

  // Aggregate Calculations
  const totalOmset = filteredTxs.reduce((acc, t) => acc + t.totalJual, 0);
  const totalModal = filteredTxs.reduce((acc, t) => acc + t.totalModal, 0);
  const labaKotor = filteredTxs.reduce((acc, t) => acc + t.totalLaba, 0);
  const totalPengeluaran = filteredExpenses.reduce((acc, e) => acc + e.nominal, 0);
  const labaBersih = labaKotor - totalPengeluaran;
  const netMargin = totalOmset > 0 ? ((labaBersih / totalOmset) * 100).toFixed(1) : '0';

  // Category Breakdown
  const catBBM = filteredTxs.filter((t) => t.kategoriUtama === 'bbm');
  const catPS = filteredTxs.filter((t) => t.kategoriUtama === 'rental_ps');
  const catPPOBRange = filteredTxs.filter((t) => t.kategoriUtama === 'ppob_range');
  const catPPOBLain = filteredTxs.filter((t) => t.kategoriUtama === 'ppob_lain');
  const catBarang = filteredTxs.filter((t) => t.kategoriUtama === 'barang');

  const bbmOmset = catBBM.reduce((a, b) => a + b.totalJual, 0);
  const bbmLaba = catBBM.reduce((a, b) => a + b.totalLaba, 0);
  const bbmLiter = catBBM.reduce((acc, tx) => {
    const lit = tx.items.reduce((s, it) => (it.satuan === 'liter' ? s + it.qty : s), 0);
    return acc + lit;
  }, 0);

  const psOmset = catPS.reduce((a, b) => a + b.totalJual, 0);
  const psLaba = catPS.reduce((a, b) => a + b.totalLaba, 0);

  const ppobOmset = catPPOBRange.reduce((a, b) => a + b.totalJual, 0) + catPPOBLain.reduce((a, b) => a + b.totalJual, 0);
  const ppobLaba = catPPOBRange.reduce((a, b) => a + b.totalLaba, 0) + catPPOBLain.reduce((a, b) => a + b.totalLaba, 0);

  const barangOmset = catBarang.reduce((a, b) => a + b.totalJual, 0);
  const barangLaba = catBarang.reduce((a, b) => a + b.totalLaba, 0);

  // Arus Kas Breakdown
  const tunaiTotal = filteredTxs.filter((t) => t.metodePembayaran === 'tunai').reduce((a, b) => a + b.totalJual, 0);
  const qrisTotal = filteredTxs.filter((t) => t.metodePembayaran === 'qris').reduce((a, b) => a + b.totalJual, 0);
  const trfTotal = filteredTxs.filter((t) => t.metodePembayaran === 'transfer').reduce((a, b) => a + b.totalJual, 0);
  const hutangTotal = filteredTxs.filter((t) => t.statusPembayaran === 'hutang').reduce((a, b) => a + b.totalJual, 0);

  // Export to CSV Function
  const exportToCSV = () => {
    const headers = ['No Struk', 'Waktu', 'Tanggal', 'Kategori', 'Total Modal', 'Total Jual', 'Total Laba', 'Metode Bayar', 'Status', 'Kasir'];
    const rows = filteredTxs.map((t) => [
      t.nomorStruk,
      t.waktu,
      t.tanggal,
      t.kategoriUtama,
      t.totalModal,
      t.totalJual,
      t.totalLaba,
      t.metodePembayaran,
      t.statusPembayaran,
      `"${t.kasirName}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Laporan_Keuangan_${startDate || 'semua'}_sd_${endDate || 'semua'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filtered transactions for the detailed table tab
  const tableTransactions = useMemo(() => {
    return filteredTxs.filter((t) => {
      if (categoryFilter !== 'all' && t.kategoriUtama !== categoryFilter) return false;
      if (tableSearch.trim()) {
        const q = tableSearch.toLowerCase();
        const matchNum = t.nomorStruk.toLowerCase().includes(q);
        const matchCust = t.namaPelanggan?.toLowerCase().includes(q) || false;
        const matchItem = t.items.some((i) => i.nama.toLowerCase().includes(q));
        return matchNum || matchCust || matchItem;
      }
      return true;
    });
  }, [filteredTxs, categoryFilter, tableSearch]);

  return (
    <div className="p-3 md:p-6 max-w-7xl mx-auto space-y-6 pb-24 md:pb-12 print-area">
      {/* Title & Top Action Buttons (Soft Colors) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 no-print">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shadow-xs">
              <FileText className="w-4 h-4" />
            </div>
            <h1 className="text-xl md:text-2xl font-bold text-slate-900">
              Laporan Keuangan & Laba Rugi
            </h1>
          </div>
          <p className="text-xs md:text-sm text-slate-500 mt-1">
            Rekapitulasi lengkap omset penjualan, modal HPP, laba kotor, beban operasional, dan laba bersih riil.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => triggerGoogleSheetSync()}
            disabled={isSyncing}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 shadow-xs transition-colors"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>{isSyncing ? 'Menyinkronkan...' : 'Sinkron ke Sheets'}</span>
          </button>

          <button
            onClick={exportToCSV}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-200 shadow-xs transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-sky-600" />
            <span>Ekspor CSV</span>
          </button>

          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl bg-slate-800 text-white hover:bg-slate-900 shadow-xs transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Cetak Rekap</span>
          </button>
        </div>
      </div>

      {/* Date Filter Bar (Soft Pastel Mint Gradient) */}
      <div className="bg-gradient-to-r from-emerald-50/70 via-teal-50/40 to-sky-50/60 border border-emerald-200/90 rounded-2xl p-4 shadow-xs space-y-3 no-print">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-emerald-700" />
              <span>Periode Laporan:</span>
            </span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-2.5 py-1.5 text-xs rounded-xl border border-emerald-300 bg-white text-slate-900 font-mono shadow-xs focus:outline-emerald-500"
            />
            <span className="text-xs text-slate-500 font-semibold">s/d</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-2.5 py-1.5 text-xs rounded-xl border border-emerald-300 bg-white text-slate-900 font-mono shadow-xs focus:outline-emerald-500"
            />
          </div>

          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={setPresetToday}
              className={`px-2.5 py-1 text-xs rounded-lg font-semibold transition-colors ${
                startDate === getTodayStr() && endDate === getTodayStr()
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-white hover:bg-emerald-100 text-emerald-900 border border-emerald-200'
              }`}
            >
              Hari Ini
            </button>
            <button
              onClick={setPresetYesterday}
              className="px-2.5 py-1 text-xs rounded-lg font-semibold bg-white hover:bg-emerald-100 text-emerald-900 border border-emerald-200 transition-colors"
            >
              Kemarin
            </button>
            <button
              onClick={setPresetLast7Days}
              className="px-2.5 py-1 text-xs rounded-lg font-semibold bg-white hover:bg-emerald-100 text-emerald-900 border border-emerald-200 transition-colors"
            >
              7 Hari Terakhir
            </button>
            <button
              onClick={setPresetThisMonth}
              className={`px-2.5 py-1 text-xs rounded-lg font-semibold transition-colors ${
                startDate.endsWith('-01') && endDate === getTodayStr()
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-white hover:bg-emerald-100 text-emerald-900 border border-emerald-200'
              }`}
            >
              Bulan Ini
            </button>
            <button
              onClick={setPresetLastMonth}
              className="px-2.5 py-1 text-xs rounded-lg font-semibold bg-white hover:bg-emerald-100 text-emerald-900 border border-emerald-200 transition-colors"
            >
              Bulan Lalu
            </button>
            <button
              onClick={setPresetAll}
              className={`px-2.5 py-1 text-xs rounded-lg font-semibold transition-colors ${
                !startDate && !endDate
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-white hover:bg-emerald-100 text-emerald-900 border border-emerald-200'
              }`}
            >
              Semua Waktu
            </button>
          </div>
        </div>
      </div>

      {/* Printable Header Notice (Print only) */}
      <div className="hidden print:block border-b pb-4 mb-4 text-center">
        <h2 className="text-xl font-bold uppercase">{settings.namaToko || 'POS Usaha Terpadu'}</h2>
        <p className="text-xs text-slate-600">{settings.alamat} · Telp: {settings.noTelepon}</p>
        <p className="text-sm font-semibold mt-2">
          REKAPITULASI LAPORAN LABA RUGI PERIODE: {startDate ? formatDate(startDate) : 'Awal'} s/d {endDate ? formatDate(endDate) : 'Sekarang'}
        </p>
      </div>

      {/* 5 KPI MATRIX LABA RUGI (WARNA-WARNI SOFT PASTEL, TIDAK GELAP) */}
      <div>
        <div className="flex items-center justify-between mb-2.5">
          <h2 className="font-bold text-xs uppercase tracking-wider text-slate-500">
            Matriks Laba Rugi Periode Terpilih
          </h2>
          <span className="text-xs text-slate-500 font-mono">
            {filteredTxs.length} Transaksi Terhitung
          </span>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          {/* 1. Omset Penjualan (Soft Mint Pastel) */}
          <div className="bg-emerald-50/90 border border-emerald-200/90 p-4 rounded-2xl shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-emerald-900">1. Total Omset (Bruto)</span>
              <div className="w-7 h-7 rounded-lg bg-emerald-200/60 text-emerald-800 flex items-center justify-center">
                <TrendingUp className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="mt-2">
              <div className="text-base sm:text-xl font-extrabold font-mono text-emerald-950 tabular-nums">
                {formatRupiah(totalOmset)}
              </div>
              <div className="text-[10px] text-emerald-800 font-medium mt-0.5">Penerimaan kas bruto</div>
            </div>
          </div>

          {/* 2. Modal HPP (Soft Amber Pastel) */}
          <div className="bg-amber-50/90 border border-amber-200/90 p-4 rounded-2xl shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-amber-900">2. Modal Pokok (HPP)</span>
              <div className="w-7 h-7 rounded-lg bg-amber-200/60 text-amber-800 flex items-center justify-center">
                <DollarSign className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="mt-2">
              <div className="text-base sm:text-xl font-extrabold font-mono text-amber-950 tabular-nums">
                {formatRupiah(totalModal)}
              </div>
              <div className="text-[10px] text-amber-800 font-medium mt-0.5">Harga pokok barang & bbm</div>
            </div>
          </div>

          {/* 3. Laba Kotor (Soft Sky Pastel) */}
          <div className="bg-sky-50/90 border border-sky-200/90 p-4 rounded-2xl shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-sky-900">3. Laba Kotor Usaha</span>
              <div className="w-7 h-7 rounded-lg bg-sky-200/60 text-sky-800 flex items-center justify-center">
                <Sparkles className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="mt-2">
              <div className="text-base sm:text-xl font-extrabold font-mono text-sky-950 tabular-nums">
                {formatRupiah(labaKotor)}
              </div>
              <div className="text-[10px] text-sky-800 font-medium mt-0.5">Omset - Modal HPP</div>
            </div>
          </div>

          {/* 4. Pengeluaran Beban (Soft Rose Pastel) */}
          <div className="bg-rose-50/90 border border-rose-200/90 p-4 rounded-2xl shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-rose-900">4. Beban Operasional</span>
              <div className="w-7 h-7 rounded-lg bg-rose-200/60 text-rose-800 flex items-center justify-center">
                <ArrowDownCircle className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="mt-2">
              <div className="text-base sm:text-xl font-extrabold font-mono text-rose-950 tabular-nums">
                {formatRupiah(totalPengeluaran)}
              </div>
              <div className="text-[10px] text-rose-800 font-medium mt-0.5">{filteredExpenses.length} catatan pengeluaran</div>
            </div>
          </div>

          {/* 5. Laba Bersih Akhir (Soft Teal Pastel) */}
          <div className="col-span-2 lg:col-span-1 bg-teal-50/90 border border-teal-200/90 p-4 rounded-2xl shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-teal-900">5. Laba Bersih Akhir</span>
              <div className="w-7 h-7 rounded-lg bg-teal-200/60 text-teal-800 flex items-center justify-center">
                <CheckCircle2 className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="mt-2">
              <div className="text-lg sm:text-2xl font-black font-mono text-teal-950 tabular-nums">
                {formatRupiah(labaBersih)}
              </div>
              <div className="text-[10px] text-teal-800 font-bold mt-0.5">
                Net Profit Margin: {netMargin}%
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SUB-TABS NAVIGATION FOR REPORTS */}
      <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl overflow-x-auto no-print">
        <button
          onClick={() => setReportSubTab('ringkasan')}
          className={`px-3 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 shrink-0 ${
            reportSubTab === 'ringkasan'
              ? 'bg-white text-emerald-800 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Ringkasan Laba & Arus Kas</span>
        </button>

        <button
          onClick={() => setReportSubTab('transaksi')}
          className={`px-3 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 shrink-0 ${
            reportSubTab === 'transaksi'
              ? 'bg-white text-emerald-800 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Receipt className="w-3.5 h-3.5" />
          <span>Rincian Transaksi ({filteredTxs.length})</span>
        </button>

        <button
          onClick={() => setReportSubTab('pengeluaran')}
          className={`px-3 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 shrink-0 ${
            reportSubTab === 'pengeluaran'
              ? 'bg-white text-emerald-800 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <ArrowDownCircle className="w-3.5 h-3.5" />
          <span>Rekap Pengeluaran ({filteredExpenses.length})</span>
        </button>

        <button
          onClick={() => setReportSubTab('hutang')}
          className={`px-3 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 shrink-0 ${
            reportSubTab === 'hutang'
              ? 'bg-white text-emerald-800 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <CreditCard className="w-3.5 h-3.5" />
          <span>Rekap Piutang Kasbon ({filteredDebts.length})</span>
        </button>
      </div>

      {/* ======================================================== */}
      {/* TAB 1: RINGKASAN & ARUS KAS (WARNA-WARNI SOFT PASTEL)    */}
      {/* ======================================================== */}
      {reportSubTab === 'ringkasan' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Kontribusi Pendapatan Per Kategori */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3.5">
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-600" />
              <span>Pendapatan Per Lini Usaha</span>
            </h3>

            <div className="space-y-2.5 text-xs">
              {/* BBM */}
              <div className="p-3.5 rounded-xl border border-orange-200/80 bg-orange-50/70 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-orange-100 text-orange-700 flex items-center justify-center shadow-xs">
                    <Fuel className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-orange-950">Penjualan BBM / Pertamini</div>
                    <div className="text-[11px] text-orange-800">{catBBM.length} transaksi · {bbmLiter.toFixed(1)} Liter terjual</div>
                  </div>
                </div>
                <div className="text-right font-mono">
                  <div className="font-bold text-orange-950 text-sm">{formatRupiah(bbmOmset)}</div>
                  <div className="text-[11px] text-emerald-700 font-bold">Laba: +{formatRupiah(bbmLaba)}</div>
                </div>
              </div>

              {/* PlayStation */}
              <div className="p-3.5 rounded-xl border border-purple-200/80 bg-purple-50/70 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center shadow-xs">
                    <Gamepad2 className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-purple-950">Rental PlayStation</div>
                    <div className="text-[11px] text-purple-800">{catPS.length} sesi rental selesai</div>
                  </div>
                </div>
                <div className="text-right font-mono">
                  <div className="font-bold text-purple-950 text-sm">{formatRupiah(psOmset)}</div>
                  <div className="text-[11px] text-emerald-700 font-bold">Laba: +{formatRupiah(psLaba)}</div>
                </div>
              </div>

              {/* PPOB */}
              <div className="p-3.5 rounded-xl border border-indigo-200/80 bg-indigo-50/70 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center shadow-xs">
                    <Zap className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-indigo-950">PPOB (Range DANA/GoPay & Pulsa/Game)</div>
                    <div className="text-[11px] text-indigo-800">{catPPOBRange.length + catPPOBLain.length} transaksi topup & transfer</div>
                  </div>
                </div>
                <div className="text-right font-mono">
                  <div className="font-bold text-indigo-950 text-sm">{formatRupiah(ppobOmset)}</div>
                  <div className="text-[11px] text-emerald-700 font-bold">Admin: +{formatRupiah(ppobLaba)}</div>
                </div>
              </div>

              {/* Toko */}
              <div className="p-3.5 rounded-xl border border-emerald-200/80 bg-emerald-50/70 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shadow-xs">
                    <Package className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-emerald-950">Barang & Makanan Toko</div>
                    <div className="text-[11px] text-emerald-800">{catBarang.length} transaksi kasir retail</div>
                  </div>
                </div>
                <div className="text-right font-mono">
                  <div className="font-bold text-emerald-950 text-sm">{formatRupiah(barangOmset)}</div>
                  <div className="text-[11px] text-emerald-700 font-bold">Laba: +{formatRupiah(barangLaba)}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Arus Kas & Metode Pembayaran */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3.5">
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-emerald-600" />
              <span>Arus Kas Berdasarkan Metode Bayar</span>
            </h3>

            <div className="space-y-2.5 text-xs">
              <div className="p-3.5 rounded-xl border border-emerald-200/80 bg-emerald-50/60 flex justify-between items-center">
                <div>
                  <span className="font-bold text-emerald-950">Pembayaran Tunai (Cash)</span>
                  <p className="text-[11px] text-emerald-800">Uang fisik langsung masuk laci kasir toko</p>
                </div>
                <span className="font-mono font-bold text-base text-emerald-950">
                  {formatRupiah(tunaiTotal)}
                </span>
              </div>

              <div className="p-3.5 rounded-xl border border-sky-200/80 bg-sky-50/60 flex justify-between items-center">
                <div>
                  <span className="font-bold text-sky-950">Digital (QRIS & Transfer Bank)</span>
                  <p className="text-[11px] text-sky-800">QRIS: {formatRupiah(qrisTotal)} · Bank: {formatRupiah(trfTotal)}</p>
                </div>
                <span className="font-mono font-bold text-base text-sky-950">
                  {formatRupiah(qrisTotal + trfTotal)}
                </span>
              </div>

              <div className="p-3.5 rounded-xl border border-rose-200/80 bg-rose-50/60 flex justify-between items-center">
                <div>
                  <span className="font-bold text-rose-950">Kasbon / Piutang Belum Bayar</span>
                  <p className="text-[11px] text-rose-800">{filteredDebts.length} catatan hutang pada periode ini</p>
                </div>
                <span className="font-mono font-bold text-base text-rose-900">
                  {formatRupiah(hutangTotal)}
                </span>
              </div>

              {/* Pengeluaran Operasional Box */}
              <div className="p-3.5 rounded-xl border border-amber-200/80 bg-amber-50/60 flex justify-between items-center">
                <div>
                  <span className="font-bold text-amber-950">Total Pengeluaran Kas (Beban)</span>
                  <p className="text-[11px] text-amber-800">Biaya operasional & belanja stok usaha</p>
                </div>
                <span className="font-mono font-bold text-base text-amber-950">
                  -{formatRupiah(totalPengeluaran)}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 2: RINCIAN DAFTAR TRANSAKSI PENJUALAN                */}
      {/* ======================================================== */}
      {reportSubTab === 'transaksi' && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden space-y-3 p-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-700">Filter Transaksi:</span>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-2.5 py-1 text-xs rounded-xl border border-slate-300 bg-white text-slate-800 font-semibold"
              >
                <option value="all">Semua Kategori</option>
                <option value="bbm">BBM / Pertamini</option>
                <option value="rental_ps">Rental PlayStation</option>
                <option value="ppob_range">PPOB Range (DANA/Gopay)</option>
                <option value="ppob_lain">PPOB Lainnya (Pulsa/Game)</option>
                <option value="barang">Barang Toko</option>
              </select>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Cari no struk, item, pelanggan..."
                value={tableSearch}
                onChange={(e) => setTableSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-300 bg-white text-slate-800"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                  <th className="py-2.5 px-3">No. Struk</th>
                  <th className="py-2.5 px-3">Waktu</th>
                  <th className="py-2.5 px-3">Kategori & Item</th>
                  <th className="py-2.5 px-3 text-right">Modal</th>
                  <th className="py-2.5 px-3 text-right">Total Jual</th>
                  <th className="py-2.5 px-3 text-right">Laba</th>
                  <th className="py-2.5 px-3 text-center">Metode</th>
                  <th className="py-2.5 px-3">Kasir</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {tableTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-400 font-sans">
                      Tidak ada transaksi pada filter periode ini.
                    </td>
                  </tr>
                ) : (
                  tableTransactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-2.5 px-3 font-bold text-slate-900">{tx.nomorStruk}</td>
                      <td className="py-2.5 px-3 text-slate-500 font-sans text-[11px] whitespace-nowrap">
                        {formatDateTime(tx.waktu)}
                      </td>
                      <td className="py-2.5 px-3 font-sans">
                        <div className="font-semibold text-slate-800">
                          {tx.items[0]?.nama || 'Item'} {tx.items.length > 1 && `+${tx.items.length - 1} lainnya`}
                        </div>
                        {tx.namaPelanggan && (
                          <div className="text-[10px] text-slate-500">Pelanggan: {tx.namaPelanggan}</div>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-right text-slate-500">
                        {formatRupiah(tx.totalModal)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold text-slate-900">
                        {formatRupiah(tx.totalJual)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold text-emerald-600">
                        +{formatRupiah(tx.totalLaba)}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span className="font-sans px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-slate-100 text-slate-700">
                          {tx.metodePembayaran}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-sans text-slate-600 text-[11px]">
                        {tx.kasirName}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 3: REKAP PENGELUARAN USAHA                           */}
      {/* ======================================================== */}
      {reportSubTab === 'pengeluaran' && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden p-4 space-y-3">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="font-bold text-xs text-slate-800">
              Daftar Beban & Pengeluaran ({filteredExpenses.length} data)
            </h3>
            <span className="font-mono font-bold text-sm text-rose-700">
              Total Beban: {formatRupiah(totalPengeluaran)}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                  <th className="py-2.5 px-3">Tanggal & Waktu</th>
                  <th className="py-2.5 px-3">Kategori Beban</th>
                  <th className="py-2.5 px-3">Deskripsi / Keterangan</th>
                  <th className="py-2.5 px-3 text-right">Nominal (Rp)</th>
                  <th className="py-2.5 px-3">Pencatat</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredExpenses.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400">
                      Tidak ada catatan pengeluaran pada periode ini.
                    </td>
                  </tr>
                ) : (
                  filteredExpenses.map((exp) => (
                    <tr key={exp.id} className="hover:bg-slate-50/70">
                      <td className="py-2.5 px-3 text-slate-500 font-mono text-[11px]">
                        {formatDateTime(exp.waktu)}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase bg-rose-100 text-rose-800">
                          {exp.kategori.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-medium text-slate-800">
                        {exp.deskripsi}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-rose-700">
                        {formatRupiah(exp.nominal)}
                      </td>
                      <td className="py-2.5 px-3 text-slate-600 text-[11px]">
                        {exp.kasirName}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 4: REKAP PIUTANG KASBON PELANGGAN                    */}
      {/* ======================================================== */}
      {reportSubTab === 'hutang' && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden p-4 space-y-3">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="font-bold text-xs text-slate-800">
              Daftar Kasbon & Piutang Periode Ini ({filteredDebts.length} data)
            </h3>
            <span className="font-mono font-bold text-sm text-rose-700">
              Sisa Piutang: {formatRupiah(filteredDebts.filter((d) => d.status !== 'lunas').reduce((a, b) => a + b.sisaHutang, 0))}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                  <th className="py-2.5 px-3">Nama Pelanggan</th>
                  <th className="py-2.5 px-3">No. HP</th>
                  <th className="py-2.5 px-3">Tgl Transaksi</th>
                  <th className="py-2.5 px-3">Jatuh Tempo</th>
                  <th className="py-2.5 px-3 text-right">Total Hutang</th>
                  <th className="py-2.5 px-3 text-right">Sudah Dibayar</th>
                  <th className="py-2.5 px-3 text-right">Sisa Hutang</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredDebts.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-400">
                      Tidak ada catatan piutang pada periode ini.
                    </td>
                  </tr>
                ) : (
                  filteredDebts.map((d) => (
                    <tr key={d.id} className="hover:bg-slate-50/70">
                      <td className="py-2.5 px-3 font-bold text-slate-900">{d.namaPelanggan}</td>
                      <td className="py-2.5 px-3 text-slate-500 font-mono text-[11px]">{d.noHpPelanggan || '-'}</td>
                      <td className="py-2.5 px-3 text-slate-600">{formatDate(d.tanggalTransaksi)}</td>
                      <td className="py-2.5 px-3 text-slate-600">{d.jatuhTempo ? formatDate(d.jatuhTempo) : '-'}</td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold">{formatRupiah(d.totalHutang)}</td>
                      <td className="py-2.5 px-3 text-right font-mono text-emerald-600">+{formatRupiah(d.totalDibayar)}</td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-rose-700">{formatRupiah(d.sisaHutang)}</td>
                      <td className="py-2.5 px-3 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          d.status === 'lunas'
                            ? 'bg-emerald-100 text-emerald-800'
                            : d.status === 'sebagian'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}>
                          {d.status.replace(/_/g, ' ')}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
