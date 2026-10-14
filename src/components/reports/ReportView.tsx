import React, { useState, useMemo, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { formatRupiah, formatNumber, formatDate, formatDateTime } from '../../utils/format';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
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

  // Print Preview Modal State
  const [showPrintPreview, setShowPrintPreview] = useState(false);
  const [showPdfPreview, setShowPdfPreview] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const pdfRef = useRef<HTMLDivElement>(null);

  const handleDownloadPdf = async () => {
    if (!pdfRef.current) return;
    setIsExportingPdf(true);
    try {
      const canvas = await html2canvas(pdfRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        onclone: (clonedDoc) => {
          // Replace oklch color function in style tags to avoid html2canvas error while preserving all Tailwind CSS styles
          clonedDoc.querySelectorAll('style').forEach(style => {
            if (style.textContent && style.textContent.includes('oklch')) {
              style.textContent = style.textContent.replace(/oklch\([^)]+\)/g, '#334155');
            }
          });
        }
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      let heightLeft = pdfHeight;
      let position = 0;
      const pageHeight = pdf.internal.pageSize.getHeight();

      pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - pdfHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`laporan-rekap-${startDate || 'semua'}-${endDate || 'semua'}.pdf`);
      setShowPdfPreview(false);
    } catch (err) {
      console.error('Failed to export PDF:', err);
      alert('Gagal menghasilkan PDF. Silakan coba lagi.');
    } finally {
      setIsExportingPdf(false);
    }
  };

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
            type="button"
            onClick={() => triggerGoogleSheetSync(false, true)}
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
            onClick={() => setShowPrintPreview(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl bg-slate-800 text-white hover:bg-slate-900 shadow-xs transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Cetak Rekap</span>
          </button>

          <button
            onClick={() => setShowPdfPreview(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl bg-rose-600 text-white hover:bg-rose-700 shadow-xs transition-colors"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Ekspor PDF</span>
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
              <span className="text-xs font-bold text-emerald-900">1. Total Omset (Bruto)</span>
              <div className="w-7 h-7 rounded-lg bg-emerald-200/60 text-emerald-800 flex items-center justify-center">
                <TrendingUp className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="mt-2">
              <div className="text-base sm:text-xl font-extrabold font-mono text-emerald-950 tabular-nums">
                {formatRupiah(totalOmset)}
              </div>
              <div className="text-xs text-emerald-800 font-medium mt-1">Penerimaan kas bruto</div>
            </div>
          </div>

          {/* 2. Modal HPP (Soft Amber Pastel) */}
          <div className="bg-amber-50/90 border border-amber-200/90 p-4 rounded-2xl shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-900">2. Modal Pokok (HPP)</span>
              <div className="w-7 h-7 rounded-lg bg-amber-200/60 text-amber-800 flex items-center justify-center">
                <DollarSign className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="mt-2">
              <div className="text-base sm:text-xl font-extrabold font-mono text-amber-950 tabular-nums">
                {formatRupiah(totalModal)}
              </div>
              <div className="text-xs text-amber-800 font-medium mt-1">Harga pokok barang & bbm</div>
            </div>
          </div>

          {/* 3. Laba Kotor (Soft Sky Pastel) */}
          <div className="bg-sky-50/90 border border-sky-200/90 p-4 rounded-2xl shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-sky-900">3. Laba Kotor Usaha</span>
              <div className="w-7 h-7 rounded-lg bg-sky-200/60 text-sky-800 flex items-center justify-center">
                <Sparkles className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="mt-2">
              <div className="text-base sm:text-xl font-extrabold font-mono text-sky-950 tabular-nums">
                {formatRupiah(labaKotor)}
              </div>
              <div className="text-xs text-sky-800 font-medium mt-1">Omset - Modal HPP</div>
            </div>
          </div>

          {/* 4. Pengeluaran Beban (Soft Rose Pastel) */}
          <div className="bg-rose-50/90 border border-rose-200/90 p-4 rounded-2xl shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-rose-900">4. Beban Operasional</span>
              <div className="w-7 h-7 rounded-lg bg-rose-200/60 text-rose-800 flex items-center justify-center">
                <ArrowDownCircle className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="mt-2">
              <div className="text-base sm:text-xl font-extrabold font-mono text-rose-950 tabular-nums">
                {formatRupiah(totalPengeluaran)}
              </div>
              <div className="text-xs text-rose-800 font-medium mt-1">{filteredExpenses.length} catatan pengeluaran</div>
            </div>
          </div>

          {/* 5. Laba Bersih Akhir (Soft Teal Pastel) */}
          <div className="col-span-2 lg:col-span-1 bg-teal-50/90 border border-teal-200/90 p-4 rounded-2xl shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-teal-900">5. Laba Bersih Akhir</span>
              <div className="w-7 h-7 rounded-lg bg-teal-200/60 text-teal-800 flex items-center justify-center">
                <CheckCircle2 className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="mt-2">
              <div className="text-lg sm:text-2xl font-black font-mono text-teal-950 tabular-nums">
                {formatRupiah(labaBersih)}
              </div>
              <div className="text-xs text-teal-800 font-bold mt-1">
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
                    <div className="text-xs text-orange-800">{catBBM.length} transaksi · {bbmLiter.toFixed(1)} Liter terjual</div>
                  </div>
                </div>
                <div className="text-right font-mono">
                  <div className="font-bold text-orange-950 text-sm">{formatRupiah(bbmOmset)}</div>
                  <div className="text-xs text-emerald-700 font-bold">Laba: +{formatRupiah(bbmLaba)}</div>
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
                    <div className="text-xs text-purple-800">{catPS.length} sesi rental selesai</div>
                  </div>
                </div>
                <div className="text-right font-mono">
                  <div className="font-bold text-purple-950 text-sm">{formatRupiah(psOmset)}</div>
                  <div className="text-xs text-emerald-700 font-bold">Laba: +{formatRupiah(psLaba)}</div>
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
                    <div className="text-xs text-indigo-800">{catPPOBRange.length + catPPOBLain.length} transaksi topup & transfer</div>
                  </div>
                </div>
                <div className="text-right font-mono">
                  <div className="font-bold text-indigo-950 text-sm">{formatRupiah(ppobOmset)}</div>
                  <div className="text-xs text-emerald-700 font-bold">Admin: +{formatRupiah(ppobLaba)}</div>
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
                    <div className="text-xs text-emerald-800">{catBarang.length} transaksi kasir retail</div>
                  </div>
                </div>
                <div className="text-right font-mono">
                  <div className="font-bold text-emerald-950 text-sm">{formatRupiah(barangOmset)}</div>
                  <div className="text-xs text-emerald-700 font-bold">Laba: +{formatRupiah(barangLaba)}</div>
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

            <div className="space-y-2.5 text-xs md:text-sm">
              <div className="p-3.5 rounded-xl border border-emerald-200/80 bg-emerald-50/60 flex justify-between items-center">
                <div>
                  <span className="font-bold text-emerald-950">Pembayaran Tunai (Cash)</span>
                  <p className="text-xs text-emerald-800">Uang fisik langsung masuk laci kasir toko</p>
                </div>
                <span className="font-mono font-bold text-base text-emerald-950">
                  {formatRupiah(tunaiTotal)}
                </span>
              </div>

              <div className="p-3.5 rounded-xl border border-sky-200/80 bg-sky-50/60 flex justify-between items-center">
                <div>
                  <span className="font-bold text-sky-950">Digital (QRIS & Transfer Bank)</span>
                  <p className="text-xs text-sky-800">QRIS: {formatRupiah(qrisTotal)} · Bank: {formatRupiah(trfTotal)}</p>
                </div>
                <span className="font-mono font-bold text-base text-sky-950">
                  {formatRupiah(qrisTotal + trfTotal)}
                </span>
              </div>

              <div className="p-3.5 rounded-xl border border-rose-200/80 bg-rose-50/60 flex justify-between items-center">
                <div>
                  <span className="font-bold text-rose-950">Kasbon / Piutang Belum Bayar</span>
                  <p className="text-xs text-rose-800">{filteredDebts.length} catatan hutang pada periode ini</p>
                </div>
                <span className="font-mono font-bold text-base text-rose-900">
                  {formatRupiah(hutangTotal)}
                </span>
              </div>

              {/* Pengeluaran Operasional Box */}
              <div className="p-3.5 rounded-xl border border-amber-200/80 bg-amber-50/60 flex justify-between items-center">
                <div>
                  <span className="font-bold text-amber-950">Total Pengeluaran Kas (Beban)</span>
                  <p className="text-xs text-amber-800">Biaya operasional & belanja stok usaha</p>
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
                  tableTransactions.map((tx, idx) => (
                    <tr key={`report-tx-${tx.id || 'tx'}-${idx}`} className="hover:bg-slate-50/70 transition-colors">
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
                  filteredExpenses.map((exp, idx) => (
                    <tr key={`report-exp-${exp.id || 'exp'}-${idx}`} className="hover:bg-slate-50/70">
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
                  filteredDebts.map((d, idx) => (
                    <tr key={`report-debt-${d.id || 'debt'}-${idx}`} className="hover:bg-slate-50/70">
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

      {/* Print Preview Modal */}
      {showPrintPreview && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white">Pratinjau Cetak Rekap Laporan</h3>
                <p className="text-xs text-slate-500">Periode: {startDate || 'Semua'} s.d. {endDate || 'Semua'}</p>
              </div>
              <button
                onClick={() => setShowPrintPreview(false)}
                className="text-slate-400 hover:text-slate-700 text-sm font-bold p-1 rounded-lg bg-slate-100 dark:bg-slate-800"
              >
                ✕
              </button>
            </div>

            {/* Print Preview Content */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl space-y-4 text-xs font-mono text-slate-800 dark:text-slate-200">
              <div className="text-center space-y-1">
                <div className="font-bold text-sm uppercase">{settings.namaToko || 'POS Usaha Terpadu'}</div>
                <div className="text-[11px] text-slate-500">{settings.alamat || 'Alamat Toko'} · Tel: {settings.noTelepon || '-'}</div>
                <div className="font-bold text-slate-700 dark:text-slate-300 mt-2">REKAPITULASI LAPORAN KEUANGAN & LABA RUGI</div>
                <div className="text-[11px] text-slate-500">Periode: {startDate} s.d. {endDate}</div>
              </div>

              <div className="border-t border-dashed border-slate-300 dark:border-slate-700 pt-3 space-y-2">
                <div className="flex justify-between font-semibold">
                  <span>Total Omset Penjualan:</span>
                  <span>{formatRupiah(totalOmset)}</span>
                </div>
                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span>Total Modal (HPP):</span>
                  <span>{formatRupiah(totalModal)}</span>
                </div>
                <div className="flex justify-between font-semibold text-emerald-600">
                  <span>Laba Kotor:</span>
                  <span>{formatRupiah(labaKotor)}</span>
                </div>
                <div className="flex justify-between text-rose-600">
                  <span>Total Beban Pengeluaran:</span>
                  <span>{formatRupiah(totalPengeluaran)}</span>
                </div>
                <div className="flex justify-between font-bold text-teal-700 dark:text-teal-400 text-sm pt-2 border-t border-slate-200 dark:border-slate-700">
                  <span>Laba Bersih Riil:</span>
                  <span>{formatRupiah(labaBersih)}</span>
                </div>
              </div>

              <div className="border-t border-dashed border-slate-300 dark:border-slate-700 pt-3 space-y-1 text-[11px] text-slate-500">
                <div>Jumlah Transaksi: {filteredTxs.length} struk</div>
                <div>Metode Bayar - Tunai: {formatRupiah(tunaiTotal)} | QRIS: {formatRupiah(qrisTotal)} | Transfer: {formatRupiah(trfTotal)} | Kasbon: {formatRupiah(hutangTotal)}</div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setShowPrintPreview(false)}
                className="py-2 px-4 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700"
              >
                Batal
              </button>
              <button
                onClick={() => {
                  setShowPrintPreview(false);
                  window.print();
                }}
                className="py-2 px-4 rounded-xl text-xs font-bold bg-slate-900 text-white hover:bg-slate-800 flex items-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Cetak Sekarang</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PDF Preview Modal */}
      {showPdfPreview && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-3xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white">Pratinjau Ekspor PDF & Lampiran Transaksi</h3>
                <p className="text-xs text-slate-500">Periode: {formatDate(startDate)} s.d. {formatDate(endDate)}</p>
              </div>
              <button
                onClick={() => setShowPdfPreview(false)}
                className="text-slate-400 hover:text-slate-700 text-sm font-bold p-1 rounded-lg bg-slate-100 dark:bg-slate-800"
              >
                ✕
              </button>
            </div>

            {/* PDF Document Container for Export */}
            <div ref={pdfRef} className="p-6 bg-white text-slate-900 rounded-xl space-y-5 text-xs font-mono shadow-xs border border-slate-200">
              {/* Store Header */}
              <div className="text-center space-y-1 pb-4 border-b border-slate-300">
                <div className="font-bold text-base uppercase">{settings.namaToko || 'POS Usaha Terpadu'}</div>
                <div className="text-[11px] text-slate-600">{settings.alamat || 'Alamat Toko'} · Tel: {settings.noTelepon || '-'}</div>
                <div className="font-bold text-slate-800 mt-2 text-sm">REKAPITULASI LAPORAN KEUANGAN & LAMPIRAN TRANSAKSI</div>
                <div className="text-[11px] text-slate-600">Periode: {formatDate(startDate)} s.d. {formatDate(endDate)}</div>
              </div>

              {/* Summary Section */}
              <div className="space-y-2 pb-4 border-b border-slate-300">
                <div className="font-bold text-slate-900 text-xs mb-1">1. RINGKASAN KEUANGAN</div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-slate-700">
                  <div className="flex justify-between"><span>Total Omset:</span> <span className="font-bold">{formatRupiah(totalOmset)}</span></div>
                  <div className="flex justify-between"><span>Total HPP:</span> <span>{formatRupiah(totalModal)}</span></div>
                  <div className="flex justify-between text-emerald-700"><span>Laba Kotor:</span> <span className="font-bold">{formatRupiah(labaKotor)}</span></div>
                  <div className="flex justify-between text-rose-700"><span>Beban Pengeluaran:</span> <span>{formatRupiah(totalPengeluaran)}</span></div>
                  <div className="flex justify-between font-bold text-teal-800 col-span-2 pt-1 border-t border-slate-200">
                    <span>Laba Bersih Riil:</span>
                    <span>{formatRupiah(labaBersih)}</span>
                  </div>
                </div>
                <div className="text-[10px] text-slate-600 pt-1">
                  Metode Bayar: Tunai ({formatRupiah(tunaiTotal)}) · QRIS ({formatRupiah(qrisTotal)}) · Transfer ({formatRupiah(trfTotal)}) · Kasbon ({formatRupiah(hutangTotal)})
                </div>
              </div>

              {/* Transaction Appendix Section */}
              <div className="space-y-2">
                <div className="font-bold text-slate-900 text-xs flex justify-between items-center">
                  <span>2. LAMPIRAN DETAIL TRANSAKSI ({filteredTxs.length} Struk)</span>
                  <span className="text-[10px] text-slate-500 font-normal">Sesuai Periode Laporan</span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-[9px] border-collapse">
                    <thead>
                      <tr className="bg-slate-100 border-b border-slate-300 text-slate-800">
                        <th className="p-1 font-bold">No</th>
                        <th className="p-1 font-bold">ID / Waktu</th>
                        <th className="p-1 font-bold">Kasir</th>
                        <th className="p-1 font-bold">Pelanggan</th>
                        <th className="p-1 font-bold">Item Ringkas</th>
                        <th className="p-1 font-bold">Bayar</th>
                        <th className="p-1 font-bold text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {filteredTxs.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="p-2 text-center text-slate-500 italic">Tidak ada transaksi pada periode ini.</td>
                        </tr>
                      ) : (
                        filteredTxs.map((tx, idx) => (
                          <tr key={`report-tx-detail-${tx.id || 'tx'}-${idx}`} className="hover:bg-slate-50">
                            <td className="p-1 text-slate-500">{idx + 1}</td>
                            <td className="p-1 font-mono">
                              <div className="font-bold">{tx.nomorStruk}</div>
                              <div className="text-[8px] text-slate-500">{formatDateTime(tx.waktu)}</div>
                            </td>
                            <td className="p-1">{tx.kasirName || 'Kasir'}</td>
                            <td className="p-1">{tx.namaPelanggan || 'Umum'}</td>
                            <td className="p-1 max-w-[150px] truncate">
                              {tx.items.map(i => `${i.nama} (${i.qty}x)`).join(', ')}
                            </td>
                            <td className="p-1 uppercase">{tx.metodePembayaran}</td>
                            <td className="p-1 text-right font-bold">{formatRupiah(tx.totalJual)}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setShowPdfPreview(false)}
                className="py-2 px-4 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700"
              >
                Batal
              </button>
              <button
                onClick={handleDownloadPdf}
                disabled={isExportingPdf}
                className="py-2 px-4 rounded-xl text-xs font-bold bg-rose-600 text-white hover:bg-rose-700 flex items-center gap-1.5 shadow-xs disabled:opacity-50"
              >
                <Download className="w-3.5 h-3.5" />
                <span>{isExportingPdf ? 'Membuat PDF...' : 'Download PDF'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
