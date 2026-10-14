import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { formatRupiah, formatNumber, formatThousandInput, parseThousandInput } from '../../utils/format';
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
  Clock,
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

  // PPOB Range mapped form states (formatted with thousand separator)
  const [rangeNominalInput, setRangeNominalInput] = useState<string>('100.000');
  const [customRangeAdmin, setCustomRangeAdmin] = useState<number | null>(null);
  const [rangeNoTujuan, setRangeNoTujuan] = useState<string>('');

  // PPOB Lainnya mapped form states
  const [ppobLainNoTujuan, setPpobLainNoTujuan] = useState<string>('');

  // BBM mapped form states (formatted with thousand separator)
  const [bbmInputMode, setBbmInputMode] = useState<'rupiah' | 'liter'>('rupiah');
  const [bbmRupiahInput, setBbmRupiahInput] = useState<string>('20.000');
  const [bbmLiterInput, setBbmLiterInput] = useState<string>('2');

  // Common payment states
  const [metodePembayaran, setMetodePembayaran] = useState<PaymentMethod>('tunai');
  const [statusPembayaran, setStatusPembayaran] = useState<PaymentStatus>('lunas');
  const [bayarSebagianInput, setbayarSebagianInput] = useState<string>('0');
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
          subtitle: `Jual: ${formatRupiah(bbmList[0].hargaJual || bbmList[0].hargaPerLiter || 12000)}/L (Beli: ${formatRupiah(bbmList[0].hargaBeli || 10000)})`,
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
        subtitle: `Jual: ${formatRupiah(b.hargaJual || b.hargaPerLiter || 12000)}/L (Beli: ${formatRupiah(b.hargaBeli || 10000)}) · Stok: ${b.stokLiter.toFixed(1)} L`,
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
      setRangeNominalInput('100.000');
      setCustomRangeAdmin(null);
    } else if (item.type === 'bbm') {
      setBbmRupiahInput('20.000');
      setBbmInputMode('rupiah');
    }
  };

  // Synchronize BBM liter and rupiah
  const selectedBbmData = selectedItem?.type === 'bbm' ? selectedItem.rawData : null;
  useEffect(() => {
    if (!selectedBbmData) return;
    if (bbmInputMode === 'rupiah') {
      const rp = parseThousandInput(bbmRupiahInput);
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
      setBbmRupiahInput(formatThousandInput(Math.round(liters * selectedBbmData.hargaPerLiter)));
    }
  };

  const handleBbmRupiahChange = (val: string) => {
    const formatted = formatThousandInput(val);
    setBbmRupiahInput(formatted);
    setBbmInputMode('rupiah');
    const rp = parseThousandInput(formatted);
    if (selectedBbmData && selectedBbmData.hargaPerLiter > 0) {
      setBbmLiterInput((rp / selectedBbmData.hargaPerLiter).toFixed(2));
    }
  };

  // PPOB Range auto mapping rule
  const matchedRangeRule = useMemo(() => {
    if (selectedItem?.type !== 'ppob_range') return null;
    const nominal = parseThousandInput(rangeNominalInput);
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
      const nominal = parseThousandInput(rangeNominalInput);
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
      const rp = parseThousandInput(bbmRupiahInput);
      const liters = Number(bbmLiterInput) || 0;
      const bbmBuyPrice = selectedItem.rawData.hargaBeli || 10000;
      const bbmSellPrice = selectedItem.rawData.hargaJual || selectedItem.rawData.hargaPerLiter || 12000;

      const totalJual = bbmInputMode === 'rupiah' ? rp : Math.round(liters * bbmSellPrice);
      const totalModal = Math.round(liters * bbmBuyPrice);
      const totalLaba = totalJual - totalModal;

      modal = totalModal;
      jual = totalJual;
      laba = totalLaba;
      items = [
        {
          itemId: selectedItem.rawData.id,
          nama: selectedItem.rawData.jenisBBM,
          kategori: 'bbm',
          qty: liters,
          satuan: 'liter',
          hargaModal: bbmBuyPrice,
          hargaJual: bbmSellPrice,
          subtotal: totalJual,
          laba: totalLaba,
          catatan: `${liters.toFixed(2)} Liter @ ${formatRupiah(bbmSellPrice)} (Modal @ ${formatRupiah(bbmBuyPrice)})`
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

    // Validation for Hutang & Sebagian
    if ((statusPembayaran === 'hutang' || statusPembayaran === 'sebagian') && !namaPelanggan.trim()) {
      alert('Nama pelanggan wajib diisi untuk transaksi Kasbon / Bayar Sebagian.');
      return;
    }

    let jumlahBayarNum = undefined;
    let sisaHutangNum = undefined;

    if (statusPembayaran === 'sebagian') {
      jumlahBayarNum = parseThousandInput(bayarSebagianInput);
      if (jumlahBayarNum <= 0 || jumlahBayarNum >= totalJual) {
        alert('Nominal pembayaran sebagian harus lebih dari 0 dan kurang dari total tagihan.');
        return;
      }
      sisaHutangNum = Math.max(0, totalJual - jumlahBayarNum);
    }

    const createdTx = addTransaction({
      kategoriUtama,
      items: transactionItems,
      totalModal,
      totalJual,
      totalLaba,
      metodePembayaran: statusPembayaran === 'hutang' ? 'hutang' : metodePembayaran,
      statusPembayaran,
      jumlahBayar: jumlahBayarNum,
      sisaHutang: sisaHutangNum,
      namaPelanggan: namaPelanggan.trim() || undefined,
      noHpPelanggan: noHpPelanggan.trim() || undefined,
      catatan: catatan.trim() || undefined,
      kasirName: currentUser?.name || 'Kasir',
      kasirId: currentUser?.id || 'usr_kasir'
    });

    onSuccess(createdTx);
    onClose();
  };

  // Handle Key Down to Save Transaction on Enter
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (isDropdownOpen && !selectedItem && filteredSearchItems.length > 0) {
        e.preventDefault();
        handleSelectItem(filteredSearchItems[0]);
        return;
      }
      e.preventDefault();
      handleSaveTransaction();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/50 backdrop-blur-xs p-0 md:p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-t-3xl md:rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[92vh] overflow-hidden text-slate-800 dark:text-slate-100">
        {/* Modal Header: Clean, Light & Bright */}
        <div className="px-5 py-3.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900 shrink-0">
          <div>
            <h2 className="text-base md:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span>Tambah Transaksi Baru</span>
            </h2>
            <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400">
              Ketik nama belanjaan atau layanan, sistem langsung memetakan otomatis
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form Container with Enter Key Handler */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSaveTransaction();
          }}
          onKeyDown={handleKeyDown}
          className="flex flex-col flex-1 overflow-hidden"
        >
          {/* Modal Body (Scrollable) */}
          <div className="p-4 md:p-5 overflow-y-auto space-y-4 flex-1 bg-white dark:bg-slate-900">
            {/* ========================================================= */}
            {/* UNIFIED SINGLE SEARCH INPUT: CUKUP SATU LABEL PENCARIAN  */}
            {/* ========================================================= */}
            <div className="relative">
              <label className="block text-xs md:text-sm font-bold text-slate-800 dark:text-slate-200 mb-1.5 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Search className="w-4 h-4 text-emerald-600" />
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
                    className="text-xs font-semibold text-emerald-600 hover:underline"
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
                  className="w-full pl-10 pr-10 py-3 text-sm md:text-base rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white dark:focus:bg-slate-800 shadow-xs transition-all"
                />
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                  <Search className="w-4 h-4 text-emerald-600" />
                </div>
                {searchTerm && (
                  <button
                    type="button"
                    onClick={() => setSearchTerm('')}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-sm"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Quick Popular Suggestion Chips (Under Search Input) */}
              {!selectedItem && (
                <div className="flex flex-wrap items-center gap-1.5 mt-2">
                  <span className="text-xs font-medium text-slate-400">Populer:</span>
                  {['DANA', 'Pertalite', 'Indomie Goreng', 'Pulsa 10k', 'Token PLN'].map((chip) => (
                    <button
                      key={chip}
                      type="button"
                      onClick={() => {
                        setSearchTerm(chip);
                        setIsDropdownOpen(true);
                      }}
                      className="px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-emerald-50 hover:text-emerald-700 dark:hover:bg-slate-700 transition-colors"
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
                    <div className="p-4 text-center text-xs md:text-sm text-slate-400">
                      Tidak ditemukan item &quot;{searchTerm}&quot;. Coba kata kunci lain atau periksa Master Data.
                    </div>
                  ) : (
                    filteredSearchItems.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => handleSelectItem(item)}
                        className="w-full px-4 py-2.5 text-left hover:bg-slate-50 dark:hover:bg-slate-700/60 flex items-center justify-between gap-3 transition-colors"
                      >
                        <div className="space-y-0.5 truncate">
                          <div className="font-semibold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                            <span className="truncate">{item.title}</span>
                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full whitespace-nowrap ${item.badgeColor}`}>
                              {item.badge}
                            </span>
                          </div>
                          <div className="text-xs text-slate-500 dark:text-slate-400 truncate">
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
              <div className="bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200/80 dark:border-indigo-800 rounded-2xl p-4 md:p-5 space-y-4 animate-in fade-in duration-200">
                <div className="flex items-center justify-between border-b border-indigo-100 dark:border-indigo-900/60 pb-2.5">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 flex items-center justify-center">
                      <Zap className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-sm font-bold text-indigo-950 dark:text-indigo-200">
                        Layanan Terpetakan: {selectedItem.rawData.namaLayanan}
                      </span>
                      <span className="block text-xs text-indigo-600 dark:text-indigo-400 font-medium">
                        Otomatis mencocokkan nominal ke rentang biaya admin master data
                      </span>
                    </div>
                  </div>
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-indigo-100 text-indigo-800 border border-indigo-200">
                    PPOB Range
                  </span>
                </div>

                {/* Input Nominal Transfer / Saldo (ANGKA NOMINAL BESAR & TITIK RIBUAN OTOMATIS) */}
                <div>
                  <label className="block text-xs md:text-sm font-bold text-slate-800 dark:text-slate-200 mb-1.5">
                    1. Masukkan Nominal Saldo (Rp):
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-lg font-black text-indigo-500">
                      Rp
                    </span>
                    <input
                      type="text"
                      inputMode="numeric"
                      placeholder="0"
                      value={rangeNominalInput}
                      onChange={(e) => {
                        setRangeNominalInput(formatThousandInput(e.target.value));
                        setCustomRangeAdmin(null);
                      }}
                      className="w-full pl-12 pr-4 py-3 text-2xl md:text-3xl font-mono font-black rounded-2xl border-2 border-indigo-300 dark:border-indigo-700 bg-white dark:bg-slate-800 text-indigo-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm transition-all"
                    />
                  </div>

                  {/* Quick Nominal Chips */}
                  <div className="flex flex-wrap gap-1.5 mt-2.5">
                    {[20000, 50000, 100000, 200000, 500000, 1000000].map((nom) => (
                      <button
                        key={nom}
                        type="button"
                        onClick={() => {
                          setRangeNominalInput(formatThousandInput(nom));
                          setCustomRangeAdmin(null);
                        }}
                        className={`px-3 py-1.5 rounded-xl text-xs md:text-sm font-mono font-bold transition-all ${
                          rangeNominalInput === formatThousandInput(nom)
                            ? 'bg-indigo-600 text-white shadow-xs scale-105'
                            : 'bg-white dark:bg-slate-800 text-indigo-900 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100/50'
                        }`}
                      >
                        {formatNumber(nom)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Auto Mapped Rule Indicator */}
                <div className="p-3.5 bg-white/90 dark:bg-slate-800/90 rounded-xl border border-indigo-100 dark:border-indigo-800/70 text-xs md:text-sm space-y-2">
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
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-indigo-700 dark:text-indigo-300 font-mono text-sm md:text-base">
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
                        className="text-xs text-indigo-600 underline font-semibold"
                      >
                        (ubah)
                      </button>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-dashed border-indigo-100 dark:border-indigo-800 flex items-center justify-between font-bold">
                    <span className="text-slate-900 dark:text-white">Total Bayar Pelanggan:</span>
                    <span className="text-emerald-700 dark:text-emerald-400 font-mono text-base md:text-lg">
                      {formatRupiah(parseThousandInput(rangeNominalInput) + effectiveRangeAdmin)}
                    </span>
                  </div>
                </div>

                {/* No. Rekening / No. HP Tujuan */}
                <div>
                  <label className="block text-xs md:text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">
                    Nomor HP / No. Rekening Tujuan (Opsional):
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: 081234567890 / 1234567890"
                    value={rangeNoTujuan}
                    onChange={(e) => setRangeNoTujuan(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs md:text-sm rounded-xl border border-indigo-200 dark:border-indigo-800 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>
            )}

            {/* CASE 2: PPOB LAINNYA MAPPING (Pulsa, Game, Token PLN) */}
            {selectedItem?.type === 'ppob_lain' && (
              <div className="bg-cyan-50/70 dark:bg-cyan-950/30 border border-cyan-200/80 dark:border-cyan-800 rounded-2xl p-4 md:p-5 space-y-4 animate-in fade-in duration-200">
                <div className="flex items-center justify-between border-b border-cyan-100 dark:border-cyan-900/60 pb-2.5">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-cyan-100 dark:bg-cyan-900 text-cyan-700 dark:text-cyan-300 flex items-center justify-center">
                      <Smartphone className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-sm font-bold text-cyan-950 dark:text-cyan-200">
                        {selectedItem.rawData.namaLayanan}
                      </span>
                      <span className="block text-xs text-cyan-600 dark:text-cyan-400 font-medium">
                        Kategori: {selectedItem.rawData.kategori.toUpperCase()}
                      </span>
                    </div>
                  </div>
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-cyan-100 text-cyan-800 border border-cyan-200">
                    PPOB Lainnya
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center text-xs md:text-sm">
                  <div className="bg-white/90 dark:bg-slate-800/90 p-3 rounded-xl border border-cyan-100 dark:border-cyan-800">
                    <span className="text-xs text-slate-400">Harga Modal</span>
                    <div className="font-bold text-slate-700 dark:text-slate-300 font-mono text-sm md:text-base mt-0.5">
                      {formatRupiah(selectedItem.rawData.hargaModal)}
                    </div>
                  </div>
                  <div className="bg-white/90 dark:bg-slate-800/90 p-3 rounded-xl border border-cyan-100 dark:border-cyan-800">
                    <span className="text-xs text-slate-400">Harga Jual</span>
                    <div className="font-bold text-cyan-900 dark:text-cyan-300 font-mono text-sm md:text-base mt-0.5">
                      {formatRupiah(selectedItem.rawData.hargaJual)}
                    </div>
                  </div>
                  <div className="bg-white/90 dark:bg-slate-800/90 p-3 rounded-xl border border-cyan-100 dark:border-cyan-800">
                    <span className="text-xs text-slate-400">Laba Bersih</span>
                    <div className="font-bold text-emerald-600 dark:text-emerald-400 font-mono text-sm md:text-base mt-0.5">
                      +{formatRupiah(selectedItem.rawData.hargaJual - selectedItem.rawData.hargaModal)}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs md:text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">
                    Nomor HP / ID Game / No. Meter PLN Tujuan:
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: 081234567890 / 1405991823"
                    value={ppobLainNoTujuan}
                    onChange={(e) => setPpobLainNoTujuan(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs md:text-sm rounded-xl border border-cyan-200 dark:border-cyan-800 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-cyan-500"
                  />
                </div>
              </div>
            )}

            {/* CASE 3: BARANG TOKO MAPPING (Indomie, Sembako, Kopi, Rokok) */}
            {(selectedItem?.type === 'barang' || cartBarangItems.length > 0) && (
              <div className="bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-800 rounded-2xl p-4 md:p-5 space-y-3.5 animate-in fade-in duration-200">
                <div className="flex items-center justify-between border-b border-emerald-100 dark:border-emerald-900/60 pb-2.5">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 flex items-center justify-center">
                      <Package className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-sm font-bold text-emerald-950 dark:text-emerald-200">
                        Daftar Belanjaan Toko ({cartBarangItems.length} Macam Barang)
                      </span>
                      <span className="block text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                        Harga jual, stok, dan keuntungan langsung dihitung otomatis
                      </span>
                    </div>
                  </div>
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                    Barang Toko
                  </span>
                </div>

                {/* Items List Stepper */}
                <div className="space-y-2">
                  {cartBarangItems.map((c) => (
                    <div
                      key={c.barang.id}
                      className="p-3.5 bg-white dark:bg-slate-800 rounded-xl border border-emerald-100 dark:border-emerald-800/80 flex items-center justify-between gap-3 shadow-xs"
                    >
                      <div className="space-y-0.5">
                        <div className="font-bold text-sm text-slate-900 dark:text-white">
                          {c.barang.nama}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                          {formatRupiah(c.barang.hargaJual)} / {c.barang.satuan} ·{' '}
                          <span className={c.barang.stok <= c.barang.stokMinimum ? 'text-amber-600 font-semibold' : ''}>
                            Sisa Stok: {c.barang.stok}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        {/* Stepper Quantity */}
                        <div className="flex items-center border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden bg-slate-50 dark:bg-slate-800">
                          <button
                            type="button"
                            onClick={() => updateBarangQty(c.barang.id, -1)}
                            className="px-2.5 py-1.5 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="px-3 py-1 font-mono font-bold text-sm text-slate-900 dark:text-white">
                            {c.qty}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateBarangQty(c.barang.id, 1)}
                            className="px-2.5 py-1.5 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Subtotal */}
                        <div className="text-right font-mono min-w-[80px]">
                          <div className="font-bold text-sm text-slate-900 dark:text-white">
                            {formatRupiah(c.barang.hargaJual * c.qty)}
                          </div>
                          <div className="text-xs text-emerald-600 dark:text-emerald-400">
                            +{formatRupiah((c.barang.hargaJual - c.barang.hargaModal) * c.qty)}
                          </div>
                        </div>

                        {/* Delete */}
                        <button
                          type="button"
                          onClick={() => removeBarang(c.barang.id)}
                          className="text-slate-400 hover:text-rose-600 p-1.5 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* CASE 4: BBM BENSIN MAPPING (Pertalite, Pertamax, Solar) */}
            {selectedItem?.type === 'bbm' && (
              <div className="bg-orange-50/70 dark:bg-orange-950/30 border border-orange-200/80 dark:border-orange-800 rounded-2xl p-4 md:p-5 space-y-4 animate-in fade-in duration-200">
                <div className="flex items-center justify-between border-b border-orange-100 dark:border-orange-900/60 pb-2.5">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300 flex items-center justify-center">
                      <Fuel className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-sm font-bold text-orange-950 dark:text-orange-200">
                        BBM {selectedItem.rawData.jenisBBM}
                      </span>
                      <span className="block text-xs text-orange-600 dark:text-orange-400 font-medium">
                        Harga: {formatRupiah(selectedItem.rawData.hargaPerLiter)} / Liter · Sisa Stok: {selectedItem.rawData.stokLiter.toFixed(1)} L
                      </span>
                    </div>
                  </div>
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-orange-100 text-orange-800 border border-orange-200">
                    BBM Bensin
                  </span>
                </div>

                {/* Input Nominal Uang atau Liter (ANGKA NOMINAL BESAR & TITIK RIBUAN OTOMATIS) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs md:text-sm font-bold text-slate-800 dark:text-slate-200 mb-1.5">
                      Nominal Uang (Rp):
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-lg font-black text-orange-500">
                        Rp
                      </span>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={bbmRupiahInput}
                        onChange={(e) => handleBbmRupiahChange(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 text-2xl md:text-3xl font-mono font-black rounded-2xl border-2 border-orange-300 dark:border-orange-700 bg-white dark:bg-slate-800 text-orange-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500 shadow-sm transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs md:text-sm font-bold text-slate-800 dark:text-slate-200 mb-1.5">
                      Jumlah (Liter):
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={bbmLiterInput}
                      onChange={(e) => handleBbmLiterChange(e.target.value)}
                      className="w-full px-4 py-3 text-xl md:text-2xl font-mono font-black rounded-2xl border-2 border-orange-300 dark:border-orange-700 bg-white dark:bg-slate-800 text-orange-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500 shadow-sm"
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
                      className={`px-3 py-1.5 rounded-xl text-xs md:text-sm font-mono font-bold transition-all ${
                        bbmRupiahInput === formatThousandInput(nominal)
                          ? 'bg-orange-600 text-white shadow-xs scale-105'
                          : 'bg-white dark:bg-slate-800 text-orange-900 dark:text-orange-300 border border-orange-200 dark:border-orange-800 hover:bg-orange-100/50'
                      }`}
                    >
                      {formatThousandInput(nominal)}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* ========================================================= */}
            {/* RINGKASAN TOTAL TRANSAKSI & PEMBAYARAN (SOFT PASTEL CARD) */}
            {/* ========================================================= */}
            <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-2xl p-4 md:p-5 space-y-4">
              {/* Total Bayar & Estimasi Laba */}
              <div className="flex items-center justify-between p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Total Tagihan Belanja:
                  </span>
                  <div className="text-2xl md:text-3xl font-black font-mono text-slate-900 dark:text-white mt-0.5">
                    {formatRupiah(totalJual)}
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                    Laba Bersih Toko:
                  </span>
                  <div className="text-base md:text-lg font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-0.5">
                    +{formatRupiah(totalLaba)}
                  </div>
                </div>
              </div>

              {/* Status Pembayaran: LUNAS, SEBAGIAN, HUTANG */}
              <div className="space-y-2">
                <label className="block text-xs md:text-sm font-bold text-slate-800 dark:text-slate-200">
                  Status Pembayaran:
                </label>

                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setStatusPembayaran('lunas')}
                    className={`py-2.5 px-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border transition-all ${
                      statusPembayaran === 'lunas'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                        : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                    <span>Lunas</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setStatusPembayaran('sebagian');
                      if (bayarSebagianInput === '0' || !bayarSebagianInput) {
                        setbayarSebagianInput(formatThousandInput(Math.round(totalJual / 2)));
                      }
                    }}
                    className={`py-2.5 px-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border transition-all ${
                      statusPembayaran === 'sebagian'
                        ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                        : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <Clock className="w-3.5 h-3.5 shrink-0" />
                    <span>Sebagian</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setStatusPembayaran('hutang')}
                    className={`py-2.5 px-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border transition-all ${
                      statusPembayaran === 'hutang'
                        ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                        : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    <span>Hutang</span>
                  </button>
                </div>
              </div>

              {/* Jika Bayar Sebagian: Input nominal yang dibayar */}
              {statusPembayaran === 'sebagian' && (
                <div className="p-3.5 bg-amber-50 dark:bg-amber-950/40 rounded-2xl border border-amber-200 dark:border-amber-800/80 space-y-2 animate-in fade-in duration-200">
                  <label className="block text-xs font-bold text-amber-900 dark:text-amber-200">
                    Jumlah Nominal yang Dibayar Sekarang (DP):
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-amber-700">
                      Rp
                    </span>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={bayarSebagianInput}
                      onChange={(e) => {
                        const raw = parseThousandInput(e.target.value);
                        setbayarSebagianInput(formatThousandInput(raw));
                      }}
                      className="w-full pl-11 pr-3 py-2.5 text-lg font-mono font-bold rounded-xl border border-amber-300 dark:border-amber-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                  <div className="flex justify-between text-xs text-amber-800 dark:text-amber-300 font-mono">
                    <span>Sisa Piutang / Kasbon:</span>
                    <span className="font-bold text-rose-600 dark:text-rose-400">
                      {formatRupiah(Math.max(0, totalJual - parseThousandInput(bayarSebagianInput)))}
                    </span>
                  </div>
                </div>
              )}

              {/* Metode Bayar jika Lunas atau Sebagian */}
              {(statusPembayaran === 'lunas' || statusPembayaran === 'sebagian') && (
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400">
                    Metode Pembayaran ({statusPembayaran === 'sebagian' ? 'Untuk Nominal Dibayar' : ''}):
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['tunai', 'qris', 'transfer'] as PaymentMethod[]).map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setMetodePembayaran(m)}
                        className={`py-2 px-2 text-xs md:text-sm rounded-xl font-bold uppercase transition-all ${
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
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Nama Pelanggan {statusPembayaran === 'hutang' && <span className="text-rose-500 font-bold">*wajib kasbon</span>}:
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Mas Budi / Bu Dewi"
                    value={namaPelanggan}
                    onChange={(e) => setNamaPelanggan(e.target.value)}
                    className={`w-full px-3.5 py-2.5 text-xs md:text-sm rounded-xl border bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                      statusPembayaran === 'hutang' && !namaPelanggan.trim()
                        ? 'border-rose-300 dark:border-rose-700 ring-1 ring-rose-200'
                        : 'border-slate-200 dark:border-slate-700'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    No. HP / WhatsApp Pelanggan:
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: 081234567890"
                    value={noHpPelanggan}
                    onChange={(e) => setNoHpPelanggan(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs md:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Catatan Transaksi */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Catatan Tambahan (Opsional):
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Titip uang, transfer selesai, nota toko..."
                  value={catatan}
                  onChange={(e) => setCatatan(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs md:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* ========================================================= */}
          {/* MODAL ACTION FOOTER (SIMPAN TRANSAKSI DENGAN TOMBOL & ENTER) */}
          {/* ========================================================= */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-xs md:text-sm font-semibold rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              Batal
            </button>

            <button
              type="submit"
              className="flex-1 sm:flex-initial px-6 py-3 text-xs md:text-sm font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Simpan Transaksi</span>
              <span className="hidden sm:inline-block text-[11px] font-mono bg-emerald-700/80 px-2 py-0.5 rounded text-emerald-100 border border-emerald-500/40">
                Enter ↵
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
