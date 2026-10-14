import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { formatRupiah, formatNumber, formatThousandInput, parseThousandInput } from '../../utils/format';
import {
  Database,
  Zap,
  Smartphone,
  Package,
  Fuel,
  Gamepad2,
  Plus,
  Trash2,
  Edit2,
  AlertTriangle,
  CheckCircle2,
  X
} from 'lucide-react';
import { MasterBarang, MasterPPOBRange, MasterPPOBLain, MasterPSUnit } from '../../types';

export const MasterDataView: React.FC = () => {
  const {
    ppobRanges,
    addPpobRange,
    deletePpobRange,
    ppobLains,
    addPpobLain,
    deletePpobLain,
    barangList,
    addBarang,
    updateBarang,
    deleteBarang,
    bbmList,
    updateBbmPricesAndStock,
    psUnits,
    addPsUnit,
    updatePsUnit,
    deletePsUnit,
    currentUser,
    setActiveTab: setGlobalActiveTab
  } = useApp();

  const [activeTab, setActiveTab] = useState<'ppob_range' | 'ppob_lain' | 'barang' | 'bbm' | 'ps'>('ppob_range');

  if (currentUser?.role === 'kasir') {
    return (
      <div className="p-4 md:p-8 max-w-lg mx-auto my-12 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-sm space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center mx-auto">
          <AlertTriangle className="w-7 h-7" />
        </div>
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">
          Akses Master Data Dibatasi
        </h2>
        <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
          Akun Anda memiliki hak akses sebagai <strong>Kasir</strong>. Sesuai kebijakan sistem, kasir hanya memiliki izin untuk mencatat transaksi dan melihat laporan. Pengelolaan data barang, PPOB, BBM, dan tarif rental hanya dapat diakses oleh <strong>Owner (Pemilik Toko)</strong>.
        </p>
        <button
          onClick={() => setGlobalActiveTab('transaksi')}
          className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs md:text-sm shadow-xs cursor-pointer"
        >
          Beralih ke Menu Transaksi
        </button>
      </div>
    );
  }

  // ==========================================
  // Form States: PPOB Range
  // ==========================================
  const [rangeNamaLayanan, setRangeNamaLayanan] = useState('DANA');
  const [rangeMinNominal, setRangeMinNominal] = useState('');
  const [rangeMaxNominal, setRangeMaxNominal] = useState('');
  const [rangeBiayaAdmin, setRangeBiayaAdmin] = useState('');

  const handleAddPpobRange = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rangeNamaLayanan || !rangeMinNominal || !rangeMaxNominal || !rangeBiayaAdmin) return;
    addPpobRange({
      namaLayanan: rangeNamaLayanan.trim(),
      minNominal: parseThousandInput(rangeMinNominal),
      maxNominal: parseThousandInput(rangeMaxNominal),
      biayaAdmin: parseThousandInput(rangeBiayaAdmin)
    });
    setRangeMinNominal('');
    setRangeMaxNominal('');
    setRangeBiayaAdmin('');
  };

  // ==========================================
  // Form States: PPOB Lain
  // ==========================================
  const [lainNamaLayanan, setLainNamaLayanan] = useState('');
  const [lainKategori, setLainKategori] = useState('Pulsa');
  const [lainHargaModal, setLainHargaModal] = useState('');
  const [lainHargaJual, setLainHargaJual] = useState('');

  const handleAddPpobLain = (e: React.FormEvent) => {
    e.preventDefault();
    if (!lainNamaLayanan || !lainHargaModal || !lainHargaJual) return;
    addPpobLain({
      namaLayanan: lainNamaLayanan.trim(),
      kategori: lainKategori,
      hargaModal: parseThousandInput(lainHargaModal),
      hargaJual: parseThousandInput(lainHargaJual)
    });
    setLainNamaLayanan('');
    setLainHargaModal('');
    setLainHargaJual('');
  };

  // ==========================================
  // Form States: Barang
  // ==========================================
  const [barangNama, setBarangNama] = useState('');
  const [barangSatuan, setBarangSatuan] = useState('pcs');
  const [barangStok, setBarangStok] = useState('');
  const [barangStokMin, setBarangStokMin] = useState('5');
  const [barangModal, setBarangModal] = useState('');
  const [barangJual, setBarangJual] = useState('');
  const [editingBarang, setEditingBarang] = useState<MasterBarang | null>(null);

  const handleSaveBarang = (e: React.FormEvent) => {
    e.preventDefault();
    if (!barangNama || !barangModal || !barangJual) return;

    if (editingBarang) {
      updateBarang({
        ...editingBarang,
        nama: barangNama.trim(),
        satuan: barangSatuan,
        stok: Number(barangStok) || 0,
        stokMinimum: Number(barangStokMin) || 0,
        hargaModal: parseThousandInput(barangModal),
        hargaJual: parseThousandInput(barangJual)
      });
      setEditingBarang(null);
    } else {
      addBarang({
        nama: barangNama.trim(),
        satuan: barangSatuan,
        stok: Number(barangStok) || 0,
        stokMinimum: Number(barangStokMin) || 0,
        hargaModal: parseThousandInput(barangModal),
        hargaJual: parseThousandInput(barangJual)
      });
    }

    setBarangNama('');
    setBarangStok('');
    setBarangModal('');
    setBarangJual('');
  };

  const startEditBarang = (b: MasterBarang) => {
    setEditingBarang(b);
    setBarangNama(b.nama);
    setBarangSatuan(b.satuan);
    setBarangStok(b.stok.toString());
    setBarangStokMin(b.stokMinimum.toString());
    setBarangModal(formatThousandInput(b.hargaModal));
    setBarangJual(formatThousandInput(b.hargaJual));
  };

  // ==========================================
  // Form States: Unit PS
  // ==========================================
  const [psKode, setPsKode] = useState('');
  const [psNama, setPsNama] = useState('');
  const [psTipe, setPsTipe] = useState<'PS3' | 'PS4' | 'PS5'>('PS4');
  const [psTarif, setPsTarif] = useState('6.000');

  const handleAddPs = (e: React.FormEvent) => {
    e.preventDefault();
    if (!psKode || !psNama || !psTarif) return;
    addPsUnit({
      kodeUnit: psKode.trim(),
      namaUnit: psNama.trim(),
      tipeKonsol: psTipe,
      tarifPerJam: parseThousandInput(psTarif),
      status: 'tersedia'
    });
    setPsKode('');
    setPsNama('');
    setPsTarif('6.000');
  };

  return (
    <div className="p-3 md:p-6 max-w-7xl mx-auto space-y-6 pb-24 md:pb-12">
      {/* Title */}
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Database className="w-6 h-6 text-emerald-600" />
          <span>Master Data & Pengaturan Harga</span>
        </h1>
        <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400">
          Atur skema range admin PPOB, pulsa & game, stok barang minimun, harga BBM, serta tarif rental PlayStation.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
        <button
          onClick={() => setActiveTab('ppob_range')}
          className={`px-3 py-2 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors ${
            activeTab === 'ppob_range' ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs' : 'text-slate-600 dark:text-slate-400'
          }`}
        >
          <Zap className="w-3.5 h-3.5" />
          <span>PPOB Range</span>
        </button>

        <button
          onClick={() => setActiveTab('ppob_lain')}
          className={`px-3 py-2 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors ${
            activeTab === 'ppob_lain' ? 'bg-white dark:bg-slate-900 text-cyan-600 dark:text-cyan-400 shadow-xs' : 'text-slate-600 dark:text-slate-400'
          }`}
        >
          <Smartphone className="w-3.5 h-3.5" />
          <span>PPOB Lainnya</span>
        </button>

        <button
          onClick={() => setActiveTab('barang')}
          className={`px-3 py-2 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors ${
            activeTab === 'barang' ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-xs' : 'text-slate-600 dark:text-slate-400'
          }`}
        >
          <Package className="w-3.5 h-3.5" />
          <span>Barang Toko & Stok</span>
        </button>

        <button
          onClick={() => setActiveTab('bbm')}
          className={`px-3 py-2 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors ${
            activeTab === 'bbm' ? 'bg-white dark:bg-slate-900 text-orange-600 dark:text-orange-400 shadow-xs' : 'text-slate-600 dark:text-slate-400'
          }`}
        >
          <Fuel className="w-3.5 h-3.5" />
          <span>Pengaturan BBM</span>
        </button>

        <button
          onClick={() => setActiveTab('ps')}
          className={`px-3 py-2 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors ${
            activeTab === 'ps' ? 'bg-white dark:bg-slate-900 text-purple-600 dark:text-purple-400 shadow-xs' : 'text-slate-600 dark:text-slate-400'
          }`}
        >
          <Gamepad2 className="w-3.5 h-3.5" />
          <span>Unit PlayStation</span>
        </button>
      </div>

      {/* ========================================================= */}
      {/* TAB 1: PPOB RANGE (DANA, Gopay, Transfer Bank)           */}
      {/* ========================================================= */}
      {activeTab === 'ppob_range' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Form Tambah Range (Soft Indigo Pastel) */}
          <div className="bg-gradient-to-br from-indigo-50/70 via-indigo-50/40 to-white border border-indigo-200/90 rounded-2xl p-5 shadow-xs space-y-4">
            <h2 className="font-bold text-sm text-indigo-950">Tambah Aturan Range PPOB</h2>
            <form onSubmit={handleAddPpobRange} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Nama Layanan (misal: DANA, GoPay, OVO, Transfer BCA):
                </label>
                <input
                  type="text"
                  value={rangeNamaLayanan}
                  onChange={(e) => setRangeNamaLayanan(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs md:text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Nominal Min (Rp):
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="10.000"
                    value={rangeMinNominal}
                    onChange={(e) => setRangeMinNominal(formatThousandInput(e.target.value))}
                    className="w-full px-3 py-2 text-xs md:text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs md:text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Nominal Max (Rp):
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="100.000"
                    value={rangeMaxNominal}
                    onChange={(e) => setRangeMaxNominal(formatThousandInput(e.target.value))}
                    className="w-full px-3 py-2 text-xs md:text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs md:text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Biaya Admin (Rp):
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="2.000"
                  value={rangeBiayaAdmin}
                  onChange={(e) => setRangeBiayaAdmin(formatThousandInput(e.target.value))}
                  className="w-full px-3 py-2 text-xs md:text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono font-bold"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 px-4 rounded-xl text-xs md:text-sm font-bold bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center gap-2 cursor-pointer shadow-xs active:scale-95"
              >
                <span>+ Simpan Aturan Range</span>
                <span className="hidden sm:inline-block text-[11px] font-mono bg-indigo-700 px-2 py-0.5 rounded text-indigo-100">
                  Enter ↵
                </span>
              </button>
            </form>
          </div>

          {/* Table Range */}
          <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
            <div className="p-3.5 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-xs text-slate-800 dark:text-white">Daftar Range & Biaya Admin PPOB</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-semibold">
                    <th className="py-2.5 px-4">Layanan</th>
                    <th className="py-2.5 px-3">Rentang Nominal</th>
                    <th className="py-2.5 px-3 text-right">Biaya Admin</th>
                    <th className="py-2.5 px-3 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {ppobRanges.map((r) => (
                    <tr key={r.id}>
                      <td className="py-2.5 px-4 font-bold text-indigo-700 dark:text-indigo-400">
                        {r.namaLayanan}
                      </td>
                      <td className="py-2.5 px-3 font-mono">
                        {formatNumber(r.minNominal)} s/d {formatNumber(r.maxNominal)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-600">
                        {formatRupiah(r.biayaAdmin)}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <button
                          onClick={() => deletePpobRange(r.id)}
                          className="p-1 text-slate-400 hover:text-rose-600"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 2: PPOB LAIN (Pulsa, Game FF/ML, Token PLN)          */}
      {/* ========================================================= */}
      {activeTab === 'ppob_lain' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-gradient-to-br from-cyan-50/70 via-cyan-50/40 to-white border border-cyan-200/90 rounded-2xl p-5 shadow-xs space-y-4">
            <h2 className="font-bold text-sm text-cyan-950">Tambah PPOB Lainnya</h2>
            <form onSubmit={handleAddPpobLain} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Nama Layanan (misal: Top Up FF 140 DM, Pulsa Tsel 10k):
                </label>
                <input
                  type="text"
                  value={lainNamaLayanan}
                  onChange={(e) => setLainNamaLayanan(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Kategori:
                </label>
                <select
                  value={lainKategori}
                  onChange={(e) => setLainKategori(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                >
                  <option value="Pulsa">Pulsa & Paket Data</option>
                  <option value="Game">Top Up Game (FF, ML, dll)</option>
                  <option value="PLN">Token Listrik PLN</option>
                  <option value="Lainnya">Lainnya</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs md:text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Harga Modal (Rp):
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="0"
                    value={lainHargaModal}
                    onChange={(e) => setLainHargaModal(formatThousandInput(e.target.value))}
                    className="w-full px-3 py-2 text-xs md:text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs md:text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Harga Jual (Rp):
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="0"
                    value={lainHargaJual}
                    onChange={(e) => setLainHargaJual(formatThousandInput(e.target.value))}
                    className="w-full px-3 py-2 text-xs md:text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono font-bold"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 px-4 rounded-xl text-xs md:text-sm font-bold bg-cyan-600 hover:bg-cyan-700 text-white flex items-center justify-center gap-2 cursor-pointer shadow-xs active:scale-95"
              >
                <span>+ Simpan PPOB Lainnya</span>
                <span className="hidden sm:inline-block text-[11px] font-mono bg-cyan-700 px-2 py-0.5 rounded text-cyan-100">
                  Enter ↵
                </span>
              </button>
            </form>
          </div>

          <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
            <div className="p-3.5 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-xs text-slate-800 dark:text-white">Daftar Layanan PPOB Lainnya</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-semibold">
                    <th className="py-2.5 px-4">Nama Layanan</th>
                    <th className="py-2.5 px-3">Kategori</th>
                    <th className="py-2.5 px-3 text-right">Modal</th>
                    <th className="py-2.5 px-3 text-right">Harga Jual</th>
                    <th className="py-2.5 px-3 text-right">Laba</th>
                    <th className="py-2.5 px-3 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {ppobLains.map((l) => (
                    <tr key={l.id}>
                      <td className="py-2.5 px-4 font-semibold text-slate-900 dark:text-white">
                        {l.namaLayanan}
                      </td>
                      <td className="py-2.5 px-3 text-slate-500">{l.kategori}</td>
                      <td className="py-2.5 px-3 text-right font-mono text-slate-500">{formatRupiah(l.hargaModal)}</td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900 dark:text-white">{formatRupiah(l.hargaJual)}</td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-600">
                        +{formatRupiah(l.hargaJual - l.hargaModal)}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <button
                          onClick={() => deletePpobLain(l.id)}
                          className="p-1 text-slate-400 hover:text-rose-600"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 3: MASTER BARANG (Nama, Satuan, Stok, Stok Min, Modal, Jual) */}
      {/* ========================================================= */}
      {activeTab === 'barang' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-gradient-to-br from-emerald-50/70 via-emerald-50/40 to-white border border-emerald-200/90 rounded-2xl p-5 shadow-xs space-y-4">
            <h2 className="font-bold text-sm text-emerald-950">
              {editingBarang ? 'Edit Barang' : 'Tambah Barang Baru'}
            </h2>
            <form onSubmit={handleSaveBarang} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Nama Barang:
                </label>
                <input
                  type="text"
                  value={barangNama}
                  onChange={(e) => setBarangNama(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Satuan (pcs, cup, bks, botol, porsi, pack):
                </label>
                <input
                  type="text"
                  value={barangSatuan}
                  onChange={(e) => setBarangSatuan(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Stok Saat Ini:
                  </label>
                  <input
                    type="number"
                    value={barangStok}
                    onChange={(e) => setBarangStok(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Stok Minimum (Alert):
                  </label>
                  <input
                    type="number"
                    value={barangStokMin}
                    onChange={(e) => setBarangStokMin(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs md:text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Harga Modal (Rp):
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="0"
                    value={barangModal}
                    onChange={(e) => setBarangModal(formatThousandInput(e.target.value))}
                    className="w-full px-3 py-2 text-xs md:text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs md:text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Harga Jual (Rp):
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="0"
                    value={barangJual}
                    onChange={(e) => setBarangJual(formatThousandInput(e.target.value))}
                    className="w-full px-3 py-2 text-xs md:text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono font-bold"
                    required
                  />
                </div>
              </div>

              <div className="flex gap-2">
                {editingBarang && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingBarang(null);
                      setBarangNama('');
                      setBarangStok('');
                      setBarangModal('');
                      setBarangJual('');
                    }}
                    className="px-4 py-2.5 text-xs md:text-sm font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 cursor-pointer"
                  >
                    Batal
                  </button>
                )}
                <button
                  type="submit"
                  className="flex-1 py-2.5 px-4 rounded-xl text-xs md:text-sm font-bold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center gap-2 cursor-pointer shadow-xs active:scale-95"
                >
                  <span>{editingBarang ? 'Simpan Perubahan' : '+ Tambah Barang'}</span>
                  <span className="hidden sm:inline-block text-[11px] font-mono bg-emerald-700 px-2 py-0.5 rounded text-emerald-100">
                    Enter ↵
                  </span>
                </button>
              </div>
            </form>
          </div>

          <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
            <div className="p-3.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <h3 className="font-bold text-xs md:text-sm text-slate-800 dark:text-white">Daftar Stok Barang Toko</h3>
              <span className="text-xs text-slate-400">Total {barangList.length} Barang</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-semibold">
                    <th className="py-2.5 px-4">Nama Barang</th>
                    <th className="py-2.5 px-3">Sisa Stok</th>
                    <th className="py-2.5 px-3 text-right">Modal</th>
                    <th className="py-2.5 px-3 text-right">Jual</th>
                    <th className="py-2.5 px-3 text-right">Laba</th>
                    <th className="py-2.5 px-3 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {barangList.map((b) => {
                    const isLow = b.stok <= b.stokMinimum;
                    return (
                      <tr key={b.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                        <td className="py-2.5 px-4">
                          <div className="font-semibold text-slate-900 dark:text-white">{b.nama}</div>
                          <div className="text-xs text-slate-400">Satuan: {b.satuan} · Min: {b.stokMinimum}</div>
                        </td>
                        <td className="py-2.5 px-3 font-mono">
                          {isLow ? (
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200">
                              {b.stok} {b.satuan} (MENIPIS!)
                            </span>
                          ) : (
                            <span className="text-slate-800 dark:text-slate-200 font-bold text-xs md:text-sm">
                              {b.stok} {b.satuan}
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-slate-500">{formatRupiah(b.hargaModal)}</td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900 dark:text-white">{formatRupiah(b.hargaJual)}</td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-600">
                          +{formatRupiah(b.hargaJual - b.hargaModal)}
                        </td>
                        <td className="py-2.5 px-3 text-center whitespace-nowrap">
                          <button
                            onClick={() => startEditBarang(b)}
                            className="p-1 text-slate-400 hover:text-emerald-600 mr-1"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => deleteBarang(b.id)}
                            className="p-1 text-slate-400 hover:text-rose-600"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 4: BBM (Harga per liter & stok tangki)                */}
      {/* ========================================================= */}
      {activeTab === 'bbm' && (
        <div className="space-y-4">
          <div className="bg-orange-50/60 dark:bg-orange-950/30 border border-orange-100 dark:border-orange-900/40 rounded-xl p-4 text-xs text-orange-900 dark:text-orange-300">
            <strong>Pengaturan Harga & Stok BBM:</strong> Perubahan harga per liter akan langsung merefleksikan hitungan otomatis di kalkulator transaksi BBM Pertamini/eceran.
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {bbmList.map((bbm) => (
              <div
                key={bbm.id}
                className="bg-gradient-to-br from-orange-50/70 via-orange-50/40 to-white border border-orange-200/90 rounded-2xl p-5 shadow-xs space-y-4"
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                    <Fuel className="w-5 h-5 text-orange-600" />
                    <span>{bbm.jenisBBM}</span>
                  </h3>
                  <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-orange-100 text-orange-800">
                    Aktif
                  </span>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Harga Beli / Modal (Rp / Liter):
                    </label>
                    <input
                      type="number"
                      step="500"
                      defaultValue={bbm.hargaBeli}
                      onBlur={(e) => {
                        const newBeli = Number(e.target.value);
                        if (newBeli > 0) updateBbmPricesAndStock(bbm.id, newBeli, bbm.hargaJual, bbm.stokLiter);
                      }}
                      className="w-full px-3 py-2 text-sm font-bold font-mono rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Harga Jual / Isian (Rp / Liter):
                    </label>
                    <input
                      type="number"
                      step="500"
                      defaultValue={bbm.hargaJual}
                      onBlur={(e) => {
                        const newJual = Number(e.target.value);
                        if (newJual > 0) updateBbmPricesAndStock(bbm.id, bbm.hargaBeli, newJual, bbm.stokLiter);
                      }}
                      className="w-full px-3 py-2 text-base font-bold font-mono rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-orange-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Sisa Stok Tangki (Liter):
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      defaultValue={bbm.stokLiter}
                      onBlur={(e) => {
                        const newStock = Number(e.target.value);
                        if (newStock >= 0) updateBbmPricesAndStock(bbm.id, bbm.hargaBeli, bbm.hargaJual, newStock);
                      }}
                      className="w-full px-3 py-2 text-sm font-bold font-mono rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 5: UNIT PLAYSTATION                                   */}
      {/* ========================================================= */}
      {activeTab === 'ps' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-gradient-to-br from-purple-50/70 via-purple-50/40 to-white border border-purple-200/90 rounded-2xl p-5 shadow-xs space-y-4">
            <h2 className="font-bold text-sm text-purple-950">Tambah Unit PlayStation</h2>
            <form onSubmit={handleAddPs} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Kode Unit (misal: PS-06):
                </label>
                <input
                  type="text"
                  placeholder="PS-06"
                  value={psKode}
                  onChange={(e) => setPsKode(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Nama Stasiun / Meja (misal: PS5 Stasiun VIP 3):
                </label>
                <input
                  type="text"
                  placeholder="PS5 Stasiun VIP 3"
                  value={psNama}
                  onChange={(e) => setPsNama(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Tipe Konsol:
                </label>
                <select
                  value={psTipe}
                  onChange={(e) => setPsTipe(e.target.value as any)}
                  className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                >
                  <option value="PS3">PlayStation 3</option>
                  <option value="PS4">PlayStation 4</option>
                  <option value="PS5">PlayStation 5</option>
                </select>
              </div>

              <div>
                <label className="block text-xs md:text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Tarif Sewa Per Jam (Rp) <span className="text-xs text-purple-600 font-normal">(Standar: 6.000 = Rp 3.000 / 30 mnt)</span>:
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="6.000"
                  value={psTarif}
                  onChange={(e) => setPsTarif(formatThousandInput(e.target.value))}
                  className="w-full px-3 py-2 text-xs md:text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono font-bold"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 px-4 rounded-xl text-xs md:text-sm font-bold bg-purple-600 hover:bg-purple-700 text-white flex items-center justify-center gap-2 cursor-pointer shadow-xs active:scale-95"
              >
                <span>+ Tambah Unit PS</span>
                <span className="hidden sm:inline-block text-[11px] font-mono bg-purple-700 px-2 py-0.5 rounded text-purple-100">
                  Enter ↵
                </span>
              </button>
            </form>
          </div>

          <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
            <div className="p-3.5 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-xs md:text-sm text-slate-800 dark:text-white">Daftar Unit PlayStation</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs md:text-sm">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-bold">
                    <th className="py-2.5 px-4">Kode & Nama Unit</th>
                    <th className="py-2.5 px-3">Tipe</th>
                    <th className="py-2.5 px-3 text-right">Tarif / Jam</th>
                    <th className="py-2.5 px-3 text-center">Status</th>
                    <th className="py-2.5 px-3 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {psUnits.map((u) => (
                    <tr key={u.id}>
                      <td className="py-2.5 px-4">
                        <div className="font-bold text-slate-900 dark:text-white">{u.namaUnit}</div>
                        <div className="text-xs text-slate-400 font-mono">{u.kodeUnit}</div>
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-purple-600">{u.tipeKonsol}</td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900 dark:text-white">
                        {formatRupiah(u.tarifPerJam)}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span className="capitalize px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                          {u.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <button
                          onClick={() => deletePsUnit(u.id)}
                          className="p-1 text-slate-400 hover:text-rose-600"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
