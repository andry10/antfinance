import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { formatRupiah, formatNumber } from '../../utils/format';
import {
  X,
  Zap,
  Smartphone,
  Package,
  Fuel,
  Search,
  Check,
  ChevronRight,
  Info,
  CheckCircle2,
  AlertTriangle,
  Plus,
  Minus,
  Trash2,
  ArrowRight,
  Save
} from 'lucide-react';
import { TransactionCategory, PaymentMethod, PaymentStatus, TransactionItem } from '../../types';

interface NewTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (tx: any) => void;
}

// Unified searchable item definition
interface SearchableMasterItem {
  id: string;
  type: 'ppob_range' | 'ppob_lain' | 'barang' | 'bbm';
  title: string;
  subtitle: string;
  badge: string;
  badgeColor: string;
  rawData: any;
}

export const NewTransactionModal: React.FC<NewTransactionModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const {
    ppobRanges,
    ppobLains,
    barangList,
    bbmList,
    addTransaction,
    currentUser,
    newTxInitialCategory
  } = useApp();

  // Search input state
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Selected Item State for Mapping
  const [selectedItem, setSelectedItem] = useState<SearchableMasterItem | null>(null);

  // Cart for items when buying retail goods (Barang)
  const [cartBarangItems, setCartBarangItems] = useState<{
    barang: any;
    qty: number;
  }[]>([]);

  // PPOB Range mapped form states
  const [rangeNominalInput, setRangeNominalInput] = useState<string>('100000');
  const [customRangeAdmin, setCustomRangeAdmin] = useState<number | null>(null);
  const [rangeNoTujuan, setRangeNoTujuan] = useState<string>('');

  // PPOB Lainnya mapped form states
  const [ppobLainNoTujuan, setPpobLainNoTujuan] = useState<string>('');

  // BBM mapped form states
  const [bbmInputMode, setBbmInputMode] = useState<'rupiah' | 'liter'>('rupiah');
  const [bbmRupiahInput, setBbmRupiahInput] = useState<string>('20000');
  const [bbmLiterInput, setBbmLiterInput] = useState<string>('2');

  // Common payment states
  const [metodePembayaran, setMetodePembayaran] = useState<PaymentMethod>('tunai');
  const [statusPembayaran, setStatusPembayaran] = useState<PaymentStatus>('lunas');
  const [namaPelanggan, setNamaPelanggan] = useState<string>('');
  const [noHpPelanggan, setNoHpPelanggan] = useState<string>('');
  const [catatan, setCatatan] = useState<string>('');

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 150);
    }
  }, [isOpen]);

  // Handle initial category if opened with specific category
  useEffect(() => {
    if (isOpen && newTxInitialCategory && !selectedItem) {
      if (newTxInitialCategory === 'ppob_range') {
        const firstService = ppobRanges[0]?.namaLayanan || 'DANA';
        handleSelectItem({
          id: `range_${firstService}`,
          type: 'ppob_range',
          title: `${firstService} (Transfer Saldo / E-Wallet)`,
          subtitle: 'Pemetaan range nominal & admin otomatis',
          badge: 'PPOB Range',
          badgeColor: 'bg-indigo-100 text-indigo-800 border-indigo-200',
          rawData: { namaLayanan: firstService }
        });
      } else if (newTxInitialCategory === 'bbm' && bbmList.length > 0) {
        handleSelectItem({
          id: bbmList[0].id,
          type: 'bbm',
          title: `BBM ${bbmList[0].jenisBBM}`,
          subtitle: `Rp ${bbmList[0].hargaPerLiter.toLocaleString('id-ID')}/Liter`,
          badge: 'BBM Bensin',
          badgeColor: 'bg-orange-100 text-orange-800 border-orange-200',
          rawData: bbmList[0]
        });
      }
    }
  }, [isOpen, newTxInitialCategory, ppobRanges, bbmList]);

  // Master distinct PPOB range service names
  const distinctRangeServices = useMemo(() => {
    const map = new Map<string, any>();
    ppobRanges.forEach((r) => {
      if (!map.has(r.namaLayanan.toLowerCase())) {
        map.set(r.namaLayanan.toLowerCase(), r.namaLayanan);
      }
    });
    return Array.from(map.values());
  }, [ppobRanges]);

  // Aggregate master searchable catalogue
  const allMasterItems = useMemo<SearchableMasterItem[]>(() => {
    const list: SearchableMasterItem[] = [];

    // 1. PPOB Range items
    distinctRangeServices.forEach((service) => {
      list.push({
        id: `range_${service}`,
        type: 'ppob_range',
        title: service,
        subtitle: 'Kirim Saldo / E-Wallet / Bank (Admin Otomatis sesuai Nominal)',
        badge: 'PPOB Range',
        badgeColor: 'bg-indigo-50 text-indigo-700 border border-indigo-200/80',
        rawData: { namaLayanan: service }
      });
    });

    // 2. Barang Toko
    barangList.forEach((b) => {
      list.push({
        id: b.id,
        type: 'barang',
        title: b.nama,
        subtitle: `Stok: ${b.stok} ${b.satuan} · Jual: ${formatRupiah(b.hargaJual)} (Modal: ${formatRupiah(b.hargaModal)})`,
        badge: 'Barang Toko',
        badgeColor: 'bg-emerald-50 text-emerald-700 border border-emerald-200/80',
        rawData: b
      });
    });

    // 3. PPOB Lainnya
    ppobLains.forEach((p) => {
      list.push({
        id: p.id,
        type: 'ppob_lain',
        title: p.namaLayanan,
        subtitle: `Kategori: ${p.kategori.toUpperCase()} · Jual: ${formatRupiah(p.hargaJual)} · Laba: +${formatRupiah(p.hargaJual - p.hargaModal)}`,
        badge: 'PPOB Lainnya',
        badgeColor: 'bg-cyan-50 text-cyan-700 border border-cyan-200/80',
        rawData: p
      });
    });

    // 4. BBM Bensin
    bbmList.forEach((b) => {
      list.push({
        id: b.id,
        type: 'bbm',
        title: `BBM ${b.jenisBBM}`,
        subtitle: `${formatRupiah(b.hargaPerLiter)}/Liter · Stok: ${b.stokLiter.toFixed(1)} L`,
        badge: 'BBM Bensin',
        badgeColor: 'bg-orange-50 text-orange-700 border border-orange-200/80',
        rawData: b
      });
    });

    return list;
  }, [distinctRangeServices, barangList, ppobLains, bbmList]);

  // Filter searchable items based on user typing
  const filteredSearchItems = useMemo(() => {
    if (!searchTerm.trim()) {
      return allMasterItems.slice(0, 10);
    }
    const q = searchTerm.toLowerCase().trim();
    return allMasterItems.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        item.subtitle.toLowerCase().includes(q) ||
        item.badge.toLowerCase().includes(q)
    );
  }, [allMasterItems, searchTerm]);

  // When user selects an item from search dropdown
  const handleSelectItem = (item: SearchableMasterItem) => {
    setSelectedItem(item);
    setSearchTerm('');
    setIsDropdownOpen(false);

    // Initial setup based on item type
    if (item.type === 'barang') {
      setCartBarangItems((prev) => {
        const exists = prev.find((c) => c.barang.id === item.rawData.id);
        if (exists) {
          return prev.map((c) =>
            c.barang.id === item.rawData.id ? { ...c, qty: c.qty + 1 } : c
          );
        }
        return [...prev, { barang: item.rawData, qty: 1 }];
      });
    } else if (item.type === 'ppob_range') {
      setRangeNominalInput('100000');
      setCustomRangeAdmin(null);
    } else if (item.type === 'bbm') {
      setBbmRupiahInput('20000');
      setBbmInputMode('rupiah');
    }
  };

  // Synchronize BBM liter and rupiah
  const selectedBbmData = selectedItem?.type === 'bbm' ? selectedItem.rawData : null;
  useEffect(() => {
    if (!selectedBbmData) return;
    if (bbmInputMode === 'rupiah') {
      const rp = Number(bbmRupiahInput) || 0;
      const liters =
        rp > 0 && selectedBbmData.hargaPerLiter > 0
          ? Number((rp / selectedBbmData.hargaPerLiter).toFixed(2))
          : 0;
      setBbmLiterInput(liters.toString());
    }
  }, [bbmRupiahInput, selectedBbmData, bbmInputMode]);

  const handleBbmLiterChange = (val: string) => {
    setBbmLiterInput(val);
    setBbmInputMode('liter');
    const liters = Number(val) || 0;
    if (selectedBbmData) {
      setBbmRupiahInput(Math.round(liters * selectedBbmData.hargaPerLiter).toString());
    }
  };

  const handleBbmRupiahChange = (val: string) => {
    setBbmRupiahInput(val);
    setBbmInputMode('rupiah');
    const rp = Number(val) || 0;
    if (selectedBbmData && selectedBbmData.hargaPerLiter > 0) {
      setBbmLiterInput((rp / selectedBbmData.hargaPerLiter).toFixed(2));
    }
  };

  // PPOB Range auto mapping rule
  const matchedRangeRule = useMemo(() => {
    if (selectedItem?.type !== 'ppob_range') return null;
    const nominal = Number(rangeNominalInput) || 0;
    const serviceName = selectedItem.rawData.namaLayanan;
    if (!serviceName || nominal <= 0) return null;

    return ppobRanges.find(
      (r) =>
        r.namaLayanan.toLowerCase() === serviceName.toLowerCase() &&
        nominal >= r.minNominal &&
        nominal <= r.maxNominal
    );
  }, [selectedItem, rangeNominalInput, ppobRanges]);

  const effectiveRangeAdmin =
    customRangeAdmin !== null
      ? customRangeAdmin
      : matchedRangeRule
      ? matchedRangeRule.biayaAdmin
      : 2000;

  // Cart handlers for Barang Toko
  const updateBarangQty = (barangId: string, delta: number) => {
    setCartBarangItems((prev) =>
      prev
        .map((c) => {
          if (c.barang.id === barangId) {
            const newQty = c.qty + delta;
            return newQty > 0 ? { ...c, qty: newQty } : null;
          }
          return c;
        })
        .filter(Boolean) as { barang: any; qty: number }[]
    );
  };

  const removeBarang = (barangId: string) => {
    setCartBarangItems((prev) => prev.filter((c) => c.barang.id !== barangId));
  };

  // Compute Grand Totals
  const { totalModal, totalJual, totalLaba, transactionItems, kategoriUtama } = useMemo(() => {
    let modal = 0;
    let jual = 0;
    let laba = 0;
    let items: TransactionItem[] = [];
    let kat: TransactionCategory = 'barang';

    if (selectedItem?.type === 'ppob_range') {
      kat = 'ppob_range';
      const nominal = Number(rangeNominalInput) || 0;
      modal = nominal;
      jual = nominal + effectiveRangeAdmin;
      laba = effectiveRangeAdmin;
      items = [
        {
          nama: `${selectedItem.rawData.namaLayanan} (Saldo ${formatNumber(nominal)})`,
          kategori: 'ppob_range',
          qty: 1,
          hargaModal: modal,
          hargaJual: jual,
          subtotal: jual,
          laba: laba,
          catatan: `Biaya Admin Range: ${formatRupiah(effectiveRangeAdmin)}${rangeNoTujuan ? ` · Tujuan: ${rangeNoTujuan}` : ''}`
        }
      ];
    } else if (selectedItem?.type === 'ppob_lain') {
      kat = 'ppob_lain';
      const p = selectedItem.rawData;
      modal = p.hargaModal;
      jual = p.hargaJual;
      laba = p.hargaJual - p.hargaModal;
      items = [
        {
          itemId: p.id,
          nama: p.namaLayanan,
          kategori: 'ppob_lain',
          qty: 1,
          hargaModal: modal,
          hargaJual: jual,
          subtotal: jual,
          laba: laba,
          catatan: ppobLainNoTujuan ? `Tujuan: ${ppobLainNoTujuan}` : undefined
        }
      ];
    } else if (selectedItem?.type === 'barang' || cartBarangItems.length > 0) {
      kat = 'barang';
      cartBarangItems.forEach((c) => {
        const itemModal = c.barang.hargaModal * c.qty;
        const itemJual = c.barang.hargaJual * c.qty;
        const itemLaba = itemJual - itemModal;
        modal += itemModal;
        jual += itemJual;
        laba += itemLaba;
        items.push({
          itemId: c.barang.id,
          nama: c.barang.nama,
          kategori: 'barang',
          qty: c.qty,
          satuan: c.barang.satuan,
          hargaModal: c.barang.hargaModal,
          hargaJual: c.barang.hargaJual,
          subtotal: itemJual,
          laba: itemLaba
        });
      });
    } else if (selectedItem?.type === 'bbm') {
      kat = 'bbm';
      const rp = Number(bbmRupiahInput) || 0;
      const liters = Number(bbmLiterInput) || 0;
      const bbmModal = Math.round(rp * 0.88); // 88% modal
      const bbmLaba = rp - bbmModal;
      modal = bbmModal;
      jual = rp;
      laba = bbmLaba;
      items = [
        {
          itemId: selectedItem.rawData.id,
          nama: selectedItem.rawData.jenisBBM,
          kategori: 'bbm',
          qty: liters,
          satuan: 'liter',
          hargaModal: bbmModal,
          hargaJual: rp,
          subtotal: rp,
          laba: bbmLaba,
          catatan: `${liters.toFixed(2)} Liter @ ${formatRupiah(selectedItem.rawData.hargaPerLiter)}`
        }
      ];
    }

    return {
      totalModal: modal,
      totalJual: jual,
      totalLaba: laba,
      transactionItems: items,
      kategoriUtama: kat
    };
  }, [
    selectedItem,
    rangeNominalInput,
    effectiveRangeAdmin,
    rangeNoTujuan,
    ppobLainNoTujuan,
    cartBarangItems,
    bbmRupiahInput,
    bbmLiterInput
  ]);

  // Save Transaction Handler
  const handleSaveTransaction = () => {
    if (!selectedItem && cartBarangItems.length === 0) {
      alert('Harap ketik dan pilih belanjaan / layanan terlebih dahulu.');
      return;
    }

    if (totalJual <= 0 || transactionItems.length === 0) {
      alert('Nominal belanja tidak boleh Rp 0.');
      return;
    }

    // Validation for Hutang
    if (statusPembayaran === 'hutang' && !namaPelanggan.trim()) {
      alert('Nama pelanggan wajib diisi untuk transaksi dengan status Hutang / Kasbon.');
      return;
    }

    const createdTx = addTransaction({
      kategoriUtama,
      items: transactionItems,
      totalModal,
      totalJual,
      totalLaba,
      metodePembayaran: statusPembayaran === 'hutang' ? 'hutang' : metodePembayaran,
      statusPembayaran,
      namaPelanggan: namaPelanggan.trim() || undefined,
      noHpPelanggan: noHpPelanggan.trim() || undefined,
      catatan: catatan.trim() || undefined,
      kasirName: currentUser?.name || 'Kasir',
      kasirId: currentUser?.id || 'usr_kasir'
    });

    onSuccess(createdTx);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/50 backdrop-blur-xs p-0 md:p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-t-3xl md:rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[92vh] overflow-hidden text-slate-800 dark:text-slate-100">
        {/* Modal Header: Clean, Light & Bright */}
        <div className="px-5 py-3.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900 shrink-0">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span>Tambah Transaksi Baru</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Ketik nama belanjaan atau layanan, sistem langsung memetakan otomatis
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body (Scrollable) */}
        <div className="p-4 md:p-5 overflow-y-auto space-y-4 flex-1 bg-white dark:bg-slate-900">
          {/* ========================================================= */}
          {/* UNIFIED SINGLE SEARCH INPUT: CUKUP SATU LABEL PENCARIAN  */}
          {/* ========================================================= */}
          <div className="relative">
            <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Search className="w-3.5 h-3.5 text-emerald-600" />
                <span>Ketik Belanja / Layanan / Barang / BBM:</span>
              </span>
              {selectedItem && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedItem(null);
                    setSearchTerm('');
                    setIsDropdownOpen(true);
                  }}
                  className="text-[11px] font-semibold text-emerald-600 hover:underline"
                >
                  + Cari Belanja Lain
                </button>
              )}
            </label>

            <div className="relative">
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Ketik apa saja, misal: DANA, Indomie, Pulsa, Pertalite, FF, Token..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setIsDropdownOpen(true);
                }}
                onFocus={() => setIsDropdownOpen(true)}
                className="w-full pl-10 pr-10 py-2.5 text-xs md:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white dark:focus:bg-slate-800 shadow-xs transition-all"
              />
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                <Search className="w-4 h-4 text-emerald-600" />
              </div>
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Quick Popular Suggestion Chips (Under Search Input) */}
            {!selectedItem && (
              <div className="flex flex-wrap items-center gap-1.5 mt-2">
                <span className="text-[11px] font-medium text-slate-400">Populer:</span>
                {['DANA', 'Pertalite', 'Indomie Goreng', 'Pulsa 10k', 'Token PLN'].map((chip) => (
                  <button
                    key={chip}
                    type="button"
                    onClick={() => {
                      setSearchTerm(chip);
                      setIsDropdownOpen(true);
                    }}
                    className="px-2 py-0.5 rounded-lg text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-emerald-50 hover:text-emerald-700 dark:hover:bg-slate-700 transition-colors"
                  >
                    {chip}
                  </button>
                ))}
              </div>
            )}

            {/* AUTOCOMPLETE DROPDOWN RESULTS */}
            {isDropdownOpen && (
              <div className="absolute left-0 right-0 top-full mt-1.5 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 max-h-64 overflow-y-auto z-30 divide-y divide-slate-100 dark:divide-slate-700">
                {filteredSearchItems.length === 0 ? (
                  <div className="p-4 text-center text-xs text-slate-400">
                    Tidak ditemukan item &quot;{searchTerm}&quot;. Coba kata kunci lain atau periksa Master Data.
                  </div>
                ) : (
                  filteredSearchItems.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleSelectItem(item)}
                      className="w-full px-3.5 py-2.5 text-left hover:bg-slate-50 dark:hover:bg-slate-700/60 flex items-center justify-between gap-3 transition-colors"
                    >
                      <div className="space-y-0.5 truncate">
                        <div className="font-semibold text-xs md:text-sm text-slate-900 dark:text-white flex items-center gap-2">
                          <span className="truncate">{item.title}</span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap ${item.badgeColor}`}>
                            {item.badge}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                          {item.subtitle}
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-300 shrink-0" />
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          {/* ========================================================= */}
          {/* MAPPED FORM FIELDS (AUTOMATICALLY POPULATED & CUSTOMIZED) */}
          {/* ========================================================= */}

          {/* CASE 1: PPOB RANGE MAPPING (DANA, Gopay, Transfer Bank, dll) */}
          {selectedItem?.type === 'ppob_range' && (
            <div className="bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200/80 dark:border-indigo-800 rounded-2xl p-4 space-y-3.5 animate-in fade-in duration-200">
              <div className="flex items-center justify-between border-b border-indigo-100 dark:border-indigo-900/60 pb-2">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 flex items-center justify-center">
                    <Zap className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-indigo-950 dark:text-indigo-200">
                      Layanan Terpetakan: {selectedItem.rawData.namaLayanan}
                    </span>
                    <span className="block text-[10px] text-indigo-600 dark:text-indigo-400 font-medium">
                      Otomatis mencocokkan nominal ke rentang biaya admin master data
                    </span>
                  </div>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800">
                  PPOB Range
                </span>
              </div>

              {/* Input Nominal Transfer / Saldo */}
              <div>
                <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                  1. Masukkan Nominal Saldo (Rp):
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                    Rp
                  </span>
                  <input
                    type="number"
                    step="5000"
                    placeholder="Contoh: 100000"
                    value={rangeNominalInput}
                    onChange={(e) => {
                      setRangeNominalInput(e.target.value);
                      setCustomRangeAdmin(null);
                    }}
                    className="w-full pl-9 pr-3 py-2 text-sm font-mono font-bold rounded-xl border border-indigo-200 dark:border-indigo-800 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-xs"
                  />
                </div>

                {/* Quick Nominal Chips */}
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {[20000, 50000, 100000, 200000, 500000, 1000000].map((nom) => (
                    <button
                      key={nom}
                      type="button"
                      onClick={() => {
                        setRangeNominalInput(nom.toString());
                        setCustomRangeAdmin(null);
                      }}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-semibold transition-colors ${
                        rangeNominalInput === nom.toString()
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'bg-white dark:bg-slate-800 text-indigo-900 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-800 hover:bg-indigo-100/50'
                      }`}
                    >
                      {formatNumber(nom)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Auto Mapped Rule Indicator */}
              <div className="p-3 bg-white/90 dark:bg-slate-800/90 rounded-xl border border-indigo-100 dark:border-indigo-800/70 text-xs space-y-1.5">
                <div className="flex items-center justify-between text-indigo-900 dark:text-indigo-300">
                  <span className="font-medium">Rentang Master Terpetakan:</span>
                  {matchedRangeRule ? (
                    <span className="font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                      {formatRupiah(matchedRangeRule.minNominal)} s/d {formatRupiah(matchedRangeRule.maxNominal)}
                    </span>
                  ) : (
                    <span className="text-amber-600 font-medium">Default (Di luar range khusus)</span>
                  )}
                </div>

                <div className="flex items-center justify-between text-slate-700 dark:text-slate-300">
                  <span className="font-medium">Biaya Admin Otomatis:</span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-indigo-700 dark:text-indigo-300 font-mono">
                      {formatRupiah(effectiveRangeAdmin)}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        const val = prompt('Ubah biaya admin (Rp):', effectiveRangeAdmin.toString());
                        if (val && !isNaN(Number(val))) {
                          setCustomRangeAdmin(Number(val));
                        }
                      }}
                      className="text-[10px] text-indigo-600 underline font-medium"
                    >
                      (ubah)
                    </button>
                  </div>
                </div>

                <div className="pt-2 border-t border-dashed border-indigo-100 dark:border-indigo-800 flex items-center justify-between font-bold">
                  <span className="text-slate-900 dark:text-white">Total Bayar Pelanggan:</span>
                  <span className="text-emerald-700 dark:text-emerald-400 font-mono text-sm">
                    {formatRupiah(Number(rangeNominalInput || 0) + effectiveRangeAdmin)}
                  </span>
                </div>
              </div>

              {/* No. Rekening / No. HP Tujuan */}
              <div>
                <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Nomor HP / No. Rekening Tujuan (Opsional):
                </label>
                <input
                  type="text"
                  placeholder="Contoh: 081234567890 / 1234567890"
                  value={rangeNoTujuan}
                  onChange={(e) => setRangeNoTujuan(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs rounded-xl border border-indigo-200 dark:border-indigo-800 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>
          )}

          {/* CASE 2: PPOB LAINNYA MAPPING (Pulsa, Game, Token PLN) */}
          {selectedItem?.type === 'ppob_lain' && (
            <div className="bg-cyan-50/70 dark:bg-cyan-950/30 border border-cyan-200/80 dark:border-cyan-800 rounded-2xl p-4 space-y-3.5 animate-in fade-in duration-200">
              <div className="flex items-center justify-between border-b border-cyan-100 dark:border-cyan-900/60 pb-2">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-cyan-100 dark:bg-cyan-900 text-cyan-700 dark:text-cyan-300 flex items-center justify-center">
                    <Smartphone className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-cyan-950 dark:text-cyan-200">
                      {selectedItem.rawData.namaLayanan}
                    </span>
                    <span className="block text-[10px] text-cyan-600 dark:text-cyan-400 font-medium">
                      Kategori: {selectedItem.rawData.kategori.toUpperCase()}
                    </span>
                  </div>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-100 text-cyan-800">
                  PPOB Lainnya
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="bg-white/90 dark:bg-slate-800/90 p-2 rounded-xl border border-cyan-100 dark:border-cyan-800">
                  <span className="text-[10px] text-slate-400">Harga Modal</span>
                  <div className="font-bold text-slate-700 dark:text-slate-300 font-mono">
                    {formatRupiah(selectedItem.rawData.hargaModal)}
                  </div>
                </div>
                <div className="bg-white/90 dark:bg-slate-800/90 p-2 rounded-xl border border-cyan-100 dark:border-cyan-800">
                  <span className="text-[10px] text-slate-400">Harga Jual</span>
                  <div className="font-bold text-cyan-900 dark:text-cyan-300 font-mono">
                    {formatRupiah(selectedItem.rawData.hargaJual)}
                  </div>
                </div>
                <div className="bg-white/90 dark:bg-slate-800/90 p-2 rounded-xl border border-cyan-100 dark:border-cyan-800">
                  <span className="text-[10px] text-slate-400">Laba Bersih</span>
                  <div className="font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                    +{formatRupiah(selectedItem.rawData.hargaJual - selectedItem.rawData.hargaModal)}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Nomor HP / ID Game / No. Meter PLN Tujuan:
                </label>
                <input
                  type="text"
                  placeholder="Contoh: 081234567890 / 1405991823"
                  value={ppobLainNoTujuan}
                  onChange={(e) => setPpobLainNoTujuan(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs rounded-xl border border-cyan-200 dark:border-cyan-800 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-cyan-500"
                />
              </div>
            </div>
          )}

          {/* CASE 3: BARANG TOKO MAPPING (Indomie, Sembako, Kopi, Rokok) */}
          {(selectedItem?.type === 'barang' || cartBarangItems.length > 0) && (
            <div className="bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-800 rounded-2xl p-4 space-y-3 animate-in fade-in duration-200">
              <div className="flex items-center justify-between border-b border-emerald-100 dark:border-emerald-900/60 pb-2">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 flex items-center justify-center">
                    <Package className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-emerald-950 dark:text-emerald-200">
                      Daftar Belanjaan Toko ({cartBarangItems.length} Macam Barang)
                    </span>
                    <span className="block text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                      Harga jual, stok, dan keuntungan langsung dihitung otomatis
                    </span>
                  </div>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                  Barang Toko
                </span>
              </div>

              {/* Items List Stepper */}
              <div className="space-y-2">
                {cartBarangItems.map((c) => (
                  <div
                    key={c.barang.id}
                    className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-emerald-100 dark:border-emerald-800/80 flex items-center justify-between gap-3 shadow-xs"
                  >
                    <div className="space-y-0.5">
                      <div className="font-bold text-xs text-slate-900 dark:text-white">
                        {c.barang.nama}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                        {formatRupiah(c.barang.hargaJual)} / {c.barang.satuan} ·{' '}
                        <span className={c.barang.stok <= c.barang.stokMinimum ? 'text-amber-600 font-semibold' : ''}>
                          Sisa Stok: {c.barang.stok}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {/* Stepper Quantity */}
                      <div className="flex items-center border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden bg-slate-50 dark:bg-slate-800">
                        <button
                          type="button"
                          onClick={() => updateBarangQty(c.barang.id, -1)}
                          className="px-2 py-1 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="px-3 py-1 font-mono font-bold text-xs text-slate-900 dark:text-white">
                          {c.qty}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateBarangQty(c.barang.id, 1)}
                          className="px-2 py-1 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      {/* Subtotal */}
                      <div className="text-right font-mono min-w-[70px]">
                        <div className="font-bold text-xs text-slate-900 dark:text-white">
                          {formatRupiah(c.barang.hargaJual * c.qty)}
                        </div>
                        <div className="text-[10px] text-emerald-600 dark:text-emerald-400">
                          +{formatRupiah((c.barang.hargaJual - c.barang.hargaModal) * c.qty)}
                        </div>
                      </div>

                      {/* Delete */}
                      <button
                        type="button"
                        onClick={() => removeBarang(c.barang.id)}
                        className="text-slate-400 hover:text-rose-600 p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* CASE 4: BBM BENSIN MAPPING (Pertalite, Pertamax, Solar) */}
          {selectedItem?.type === 'bbm' && (
            <div className="bg-orange-50/70 dark:bg-orange-950/30 border border-orange-200/80 dark:border-orange-800 rounded-2xl p-4 space-y-3.5 animate-in fade-in duration-200">
              <div className="flex items-center justify-between border-b border-orange-100 dark:border-orange-900/60 pb-2">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300 flex items-center justify-center">
                    <Fuel className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-orange-950 dark:text-orange-200">
                      BBM {selectedItem.rawData.jenisBBM}
                    </span>
                    <span className="block text-[10px] text-orange-600 dark:text-orange-400 font-medium">
                      Harga: {formatRupiah(selectedItem.rawData.hargaPerLiter)} / Liter · Sisa Stok: {selectedItem.rawData.stokLiter.toFixed(1)} L
                    </span>
                  </div>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-100 text-orange-800">
                  BBM Bensin
                </span>
              </div>

              {/* Input Nominal Uang atau Liter */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                    Nominal Uang (Rp):
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                      Rp
                    </span>
                    <input
                      type="number"
                      step="5000"
                      value={bbmRupiahInput}
                      onChange={(e) => handleBbmRupiahChange(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-sm font-mono font-bold rounded-xl border border-orange-200 dark:border-orange-800 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500 shadow-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                    Jumlah (Liter):
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={bbmLiterInput}
                    onChange={(e) => handleBbmLiterChange(e.target.value)}
                    className="w-full px-3 py-2 text-sm font-mono font-bold rounded-xl border border-orange-200 dark:border-orange-800 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500 shadow-xs"
                  />
                </div>
              </div>

              {/* Quick Preset Buttons */}
              <div className="flex flex-wrap gap-1.5">
                {[10000, 15000, 20000, 25000, 30000, 50000].map((nominal) => (
                  <button
                    key={nominal}
                    type="button"
                    onClick={() => handleBbmRupiahChange(nominal.toString())}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-semibold transition-colors ${
                      bbmRupiahInput === nominal.toString()
                        ? 'bg-orange-600 text-white shadow-xs'
                        : 'bg-white dark:bg-slate-800 text-orange-900 dark:text-orange-300 border border-orange-100 dark:border-orange-800 hover:bg-orange-100/50'
                    }`}
                  >
                    {formatNumber(nominal)}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* RINGKASAN TOTAL TRANSAKSI & PEMBAYARAN (SOFT PASTEL CARD) */}
          {/* ========================================================= */}
          <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-2xl p-4 space-y-3.5">
            {/* Total Bayar & Estimasi Laba */}
            <div className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Total Tagihan Belanja:
                </span>
                <div className="text-lg md:text-xl font-bold font-mono text-slate-900 dark:text-white">
                  {formatRupiah(totalJual)}
                </div>
              </div>

              <div className="text-right">
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                  Laba Bersih Toko:
                </span>
                <div className="text-sm md:text-base font-bold font-mono text-emerald-600 dark:text-emerald-400">
                  +{formatRupiah(totalLaba)}
                </div>
              </div>
            </div>

            {/* Status Pembayaran: LUNAS vs HUTANG */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
                Status Pembayaran:
              </label>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setStatusPembayaran('lunas')}
                  className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 border transition-all ${
                    statusPembayaran === 'lunas'
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                      : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>LUNAS (SELESAI)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setStatusPembayaran('hutang')}
                  className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 border transition-all ${
                    statusPembayaran === 'hutang'
                      ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                      : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <AlertTriangle className="w-4 h-4" />
                  <span>HUTANG / KASBON</span>
                </button>
              </div>
            </div>

            {/* Metode Bayar jika Lunas */}
            {statusPembayaran === 'lunas' && (
              <div className="space-y-1.5">
                <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400">
                  Metode Pembayaran:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['tunai', 'qris', 'transfer'] as PaymentMethod[]).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setMetodePembayaran(m)}
                      className={`py-1.5 px-2 text-xs rounded-xl font-bold uppercase transition-all ${
                        metodePembayaran === m
                          ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xs'
                          : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Input Data Pelanggan */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-[11px] font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Nama Pelanggan {statusPembayaran === 'hutang' && <span className="text-rose-500 font-bold">*wajib kasbon</span>}:
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Mas Budi / Bu Dewi"
                  value={namaPelanggan}
                  onChange={(e) => setNamaPelanggan(e.target.value)}
                  className={`w-full px-3 py-1.5 text-xs rounded-xl border bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 ${
                    statusPembayaran === 'hutang' && !namaPelanggan.trim()
                      ? 'border-rose-300 dark:border-rose-700 ring-1 ring-rose-200'
                      : 'border-slate-200 dark:border-slate-700'
                  }`}
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-700 dark:text-slate-300 mb-1">
                  No. HP / WhatsApp Pelanggan:
                </label>
                <input
                  type="text"
                  placeholder="Contoh: 081234567890"
                  value={noHpPelanggan}
                  onChange={(e) => setNoHpPelanggan(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            </div>

            {/* Catatan Transaksi */}
            <div>
              <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                Catatan Tambahan (Opsional):
              </label>
              <input
                type="text"
                placeholder="Contoh: Titip uang, transfer selesai, nota toko..."
                value={catatan}
                onChange={(e) => setCatatan(e.target.value)}
                className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* MODAL ACTION FOOTER (SIMPAN TRANSAKSI - NO AUTO PRINT POPUP) */}
        {/* ========================================================= */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          >
            Batal
          </button>

          <button
            type="button"
            onClick={handleSaveTransaction}
            className="flex-1 sm:flex-initial px-6 py-2.5 text-xs md:text-sm font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm flex items-center justify-center gap-2 transition-all active:scale-95"
          >
            <Save className="w-4 h-4" />
            <span>Simpan Transaksi</span>
          </button>
        </div>
      </div>
    </div>
  );
};
