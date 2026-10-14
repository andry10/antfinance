import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import {
  Transaction,
  TransactionItem,
  ExpenseRecord,
  DebtRecord,
  MasterPPOBRange,
  MasterPPOBLain,
  MasterBarang,
  MasterBBM,
  MasterPSUnit,
  PSRentalSession,
  PSSisaWaktuRecord,
  UserAccount,
  StoreSettings
} from '../types';
import {
  initAuth,
  googleSignIn,
  logoutGoogle,
  getAccessToken
} from '../services/firebase';
import {
  createStoreSpreadsheet,
  syncAllToGoogleSheet
} from '../services/googleSheets';

interface AppContextType {
  // Auth state
  currentUser: UserAccount | null;
  googleUser: any | null;
  googleAccessToken: string | null;
  users: UserAccount[];
  loginManual: (username: string, pass: string) => boolean;
  loginGoogle: () => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  addUser: (user: Omit<UserAccount, 'id' | 'createdAt'>) => void;
  deleteUser: (id: string) => void;
  updateUserProfile: (name: string, username: string, password?: string) => void;
  toggleUserActive: (id: string) => void;
  resetUserPassword: (id: string, newPass: string) => void;

  // Active view
  activeTab: string;
  setActiveTab: (tab: string) => void;

  // Transactions
  transactions: Transaction[];
  addTransaction: (tx: Omit<Transaction, 'id' | 'nomorStruk' | 'waktu' | 'tanggal'>) => Transaction;
  deleteTransaction: (id: string) => void;

  // Debts
  debts: DebtRecord[];
  payDebt: (debtId: string, nominal: number, metode: any, catatan?: string) => void;
  deleteDebt: (id: string) => void;

  // Expenses
  expenses: ExpenseRecord[];
  addExpense: (exp: Omit<ExpenseRecord, 'id' | 'waktu' | 'tanggal' | 'kasirName' | 'kasirId'>) => void;
  deleteExpense: (id: string) => void;

  // Masters
  ppobRanges: MasterPPOBRange[];
  setPpobRanges: React.Dispatch<React.SetStateAction<MasterPPOBRange[]>>;
  addPpobRange: (item: Omit<MasterPPOBRange, 'id'>) => void;
  deletePpobRange: (id: string) => void;

  ppobLains: MasterPPOBLain[];
  setPpobLains: React.Dispatch<React.SetStateAction<MasterPPOBLain[]>>;
  addPpobLain: (item: Omit<MasterPPOBLain, 'id'>) => void;
  deletePpobLain: (id: string) => void;

  barangList: MasterBarang[];
  setBarangList: React.Dispatch<React.SetStateAction<MasterBarang[]>>;
  addBarang: (item: Omit<MasterBarang, 'id'>) => void;
  updateBarang: (item: MasterBarang) => void;
  deleteBarang: (id: string) => void;

  bbmList: MasterBBM[];
  setBbmList: React.Dispatch<React.SetStateAction<MasterBBM[]>>;
  updateBbmPricesAndStock: (id: string, hargaBeli: number, hargaJual: number, stokLiter: number) => void;

  psUnits: MasterPSUnit[];
  setPsUnits: React.Dispatch<React.SetStateAction<MasterPSUnit[]>>;
  addPsUnit: (unit: Omit<MasterPSUnit, 'id'>) => void;
  updatePsUnit: (unit: MasterPSUnit) => void;
  deletePsUnit: (id: string) => void;

  // PlayStation Live Rental Sessions
  activePsSessions: PSRentalSession[];
  startPsSession: (
    unitId: string,
    namaPelanggan: string,
    mode: 'open_billing' | 'paket_jam',
    durasiJam?: number,
    metodeBayar?: string,
    statusBayar?: 'lunas' | 'belum_bayar'
  ) => void;
  addItemToPsSession: (sessionId: string, barangId: string, qty: number) => void;
  finishPsSession: (sessionId: string, metodeBayar?: any) => Transaction | null;
  cancelPsSession: (sessionId: string) => void;
  markPsSessionPaid: (sessionId: string, metodeBayar?: string) => void;
  extendPsSession: (sessionId: string, hoursToAdd: number) => void;

  // PlayStation Sisa Waktu (Deposit Waktu)
  psSisaWaktuList: PSSisaWaktuRecord[];
  savePsSisaWaktu: (sessionId: string, namaPelanggan: string, sisaMenit: number, catatan?: string) => Transaction | null;
  usePsSisaWaktu: (sisaWaktuId: string, unitId: string) => void;
  deletePsSisaWaktu: (sisaWaktuId: string) => void;

  // Store Settings & Google Sheets Sync
  settings: StoreSettings;
  updateSettings: (newSettings: Partial<StoreSettings>) => void;
  isSyncing: boolean;
  syncStatusMessage: string;
  triggerGoogleSheetSync: (silent?: boolean) => Promise<boolean>;
  createNewGoogleSheet: () => Promise<string | null>;

  // Quick helper: modal opener
  isNewTxModalOpen: boolean;
  openNewTxModal: (initialCategory?: any) => void;
  closeNewTxModal: () => void;
  newTxInitialCategory: any;

  // Theme
  darkMode: boolean;
  setDarkMode: (val: boolean) => void;
}

const AppContext = createContext<AppContextType | null>(null);

const STORAGE_KEYS = {
  USERS: 'pos_users_v2',
  CURRENT_USER: 'pos_current_user_v2',
  TRANSACTIONS: 'pos_transactions_v2',
  DEBTS: 'pos_debts_v2',
  EXPENSES: 'pos_expenses_v2',
  PPOB_RANGES: 'pos_ppob_ranges_v2',
  PPOB_LAIN: 'pos_ppob_lain_v2',
  BARANG: 'pos_barang_v2',
  BBM: 'pos_bbm_v2',
  PS_UNITS: 'pos_ps_units_v2',
  PS_SESSIONS: 'pos_ps_sessions_v2',
  PS_SISA_WAKTU: 'pos_ps_sisa_waktu_v2',
  SETTINGS: 'pos_settings_v2',
  DARK_MODE: 'pos_dark_mode_v2'
};

const getTodayDateStr = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const todayStr = getTodayDateStr();

  // Dark Mode State & Synchronization
  const [darkMode, setDarkModeState] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.DARK_MODE);
      if (saved !== null) {
        const isDark = JSON.parse(saved) === true;
        if (typeof document !== 'undefined') {
          if (isDark) {
            document.documentElement.classList.add('dark');
          } else {
            document.documentElement.classList.remove('dark');
          }
        }
        return isDark;
      }
    } catch (e) {
      // default light
    }
    return false;
  });

  const setDarkMode = (val: boolean) => {
    setDarkModeState(val);
    try {
      localStorage.setItem(STORAGE_KEYS.DARK_MODE, JSON.stringify(val));
    } catch (e) {}
    if (val) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Auth States
  const [users, setUsers] = useState<UserAccount[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.USERS);
    if (saved) return JSON.parse(saved);
    return [
      {
        id: 'usr_owner',
        username: 'owner',
        password: '123',
        name: 'Andry Gunawan (Owner)',
        role: 'owner',
        email: 'andrygunawan1000@gmail.com',
        createdAt: new Date().toISOString()
      },
      {
        id: 'usr_kasir1',
        username: 'kasir',
        password: '123',
        name: 'Kasir Toko (Shift 1)',
        role: 'kasir',
        email: 'kasir@pos.local',
        createdAt: new Date().toISOString()
      }
    ];
  });

  const [currentUser, setCurrentUser] = useState<UserAccount | null>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return null;
      }
    }
    // Default to owner for easy initial preview, but logout will clear it to null
    return {
      id: 'usr_owner',
      username: 'owner',
      name: 'Andry Gunawan (Owner)',
      role: 'owner',
      email: 'andrygunawan1000@gmail.com',
      createdAt: new Date().toISOString()
    };
  });

  const [googleUser, setGoogleUser] = useState<any | null>(null);
  const [googleAccessToken, setGoogleAccessToken] = useState<string | null>(null);

  // Active view tab
  const [activeTab, setActiveTab] = useState<string>('dashboard');

  // Master Data
  const [ppobRanges, setPpobRanges] = useState<MasterPPOBRange[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.PPOB_RANGES);
    if (saved) return JSON.parse(saved);
    return [
      { id: 'rng_1', namaLayanan: 'DANA', minNominal: 10000, maxNominal: 100000, biayaAdmin: 2000, keterangan: 'Admin transfer DANA 10k-100k' },
      { id: 'rng_2', namaLayanan: 'DANA', minNominal: 100001, maxNominal: 500000, biayaAdmin: 3500, keterangan: 'Admin transfer DANA 100k-500k' },
      { id: 'rng_3', namaLayanan: 'DANA', minNominal: 500001, maxNominal: 1000000, biayaAdmin: 5000, keterangan: 'Admin transfer DANA 500k-1jt' },
      { id: 'rng_4', namaLayanan: 'GoPay', minNominal: 10000, maxNominal: 100000, biayaAdmin: 2000, keterangan: 'Admin GoPay 10k-100k' },
      { id: 'rng_5', namaLayanan: 'GoPay', minNominal: 100001, maxNominal: 500000, biayaAdmin: 3500, keterangan: 'Admin GoPay 100k-500k' },
      { id: 'rng_6', namaLayanan: 'OVO', minNominal: 10000, maxNominal: 100000, biayaAdmin: 2000, keterangan: 'Admin OVO 10k-100k' },
      { id: 'rng_7', namaLayanan: 'ShopeePay', minNominal: 10000, maxNominal: 100000, biayaAdmin: 2000, keterangan: 'Admin ShopeePay' },
      { id: 'rng_8', namaLayanan: 'Transfer Bank (BRI/BCA)', minNominal: 10000, maxNominal: 200000, biayaAdmin: 3000, keterangan: 'Transfer Antar Bank' },
      { id: 'rng_9', namaLayanan: 'Transfer Bank (BRI/BCA)', minNominal: 200001, maxNominal: 1000000, biayaAdmin: 5000, keterangan: 'Transfer Antar Bank' }
    ];
  });

  const [ppobLains, setPpobLains] = useState<MasterPPOBLain[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.PPOB_LAIN);
    if (saved) return JSON.parse(saved);
    return [
      { id: 'pl_1', namaLayanan: 'Pulsa Telkomsel 10.000', kategori: 'Pulsa', hargaModal: 10300, hargaJual: 12000, keterangan: 'Pulsa reguler Tsel 10k' },
      { id: 'pl_2', namaLayanan: 'Pulsa Telkomsel 25.000', kategori: 'Pulsa', hargaModal: 24900, hargaJual: 27000, keterangan: 'Pulsa reguler Tsel 25k' },
      { id: 'pl_3', namaLayanan: 'Pulsa Indosat 10.000', kategori: 'Pulsa', hargaModal: 10250, hargaJual: 12000, keterangan: 'Pulsa reguler Indosat' },
      { id: 'pl_4', namaLayanan: 'Top Up FF 140 Diamond', kategori: 'Game', hargaModal: 18500, hargaJual: 22000, keterangan: 'Free Fire 140 DM' },
      { id: 'pl_5', namaLayanan: 'Top Up FF 355 Diamond', kategori: 'Game', hargaModal: 46000, hargaJual: 52000, keterangan: 'Free Fire 355 DM' },
      { id: 'pl_6', namaLayanan: 'Top Up MLBB 86 Diamond', kategori: 'Game', hargaModal: 19000, hargaJual: 23000, keterangan: 'Mobile Legends' },
      { id: 'pl_7', namaLayanan: 'Token Listrik PLN 20.000', kategori: 'PLN', hargaModal: 20500, hargaJual: 23000, keterangan: 'Token PLN 20k' },
      { id: 'pl_8', namaLayanan: 'Token Listrik PLN 50.000', kategori: 'PLN', hargaModal: 50500, hargaJual: 53000, keterangan: 'Token PLN 50k' }
    ];
  });

  const [barangList, setBarangList] = useState<MasterBarang[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.BARANG);
    if (saved) return JSON.parse(saved);
    return [
      { id: 'brg_1', nama: 'Kopi Kapal Api Panas', satuan: 'cup', stok: 24, stokMinimum: 5, hargaModal: 2000, hargaJual: 4000, kategori: 'Minuman' },
      { id: 'brg_2', nama: 'Kopi Good Day Freeze', satuan: 'cup', stok: 16, stokMinimum: 5, hargaModal: 2500, hargaJual: 5000, kategori: 'Minuman' },
      { id: 'brg_3', nama: 'Indomie Goreng + Telur', satuan: 'porsi', stok: 28, stokMinimum: 10, hargaModal: 6000, hargaJual: 10000, kategori: 'Makanan' },
      { id: 'brg_4', nama: 'Aqua Botol 600ml', satuan: 'botol', stok: 4, stokMinimum: 10, hargaModal: 2500, hargaJual: 4000, kategori: 'Minuman' }, // Stok Menipis!
      { id: 'brg_5', nama: 'Teh Botol Sosro', satuan: 'botol', stok: 3, stokMinimum: 8, hargaModal: 3000, hargaJual: 5000, kategori: 'Minuman' }, // Stok Menipis!
      { id: 'brg_6', nama: 'Rokok Sampoerna Mild', satuan: 'bks', stok: 2, stokMinimum: 5, hargaModal: 32000, hargaJual: 35000, kategori: 'Rokok' }, // Stok Menipis!
      { id: 'brg_7', nama: 'Snack Chitato Sapi Panggang', satuan: 'bks', stok: 14, stokMinimum: 5, hargaModal: 8500, hargaJual: 11000, kategori: 'Snack' }
    ];
  });

  const [bbmList, setBbmList] = useState<MasterBBM[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.BBM);
    if (saved) {
      try {
        const parsed: MasterBBM[] = JSON.parse(saved);
        return parsed.map((b) => ({
          ...b,
          hargaBeli: b.hargaBeli ?? 10000,
          hargaJual: b.hargaJual ?? b.hargaPerLiter ?? 12000,
          hargaPerLiter: b.hargaJual ?? b.hargaPerLiter ?? 12000
        }));
      } catch (e) {}
    }
    return [
      { id: 'bbm_1', jenisBBM: 'Pertalite', hargaBeli: 10000, hargaJual: 12000, hargaPerLiter: 12000, stokLiter: 185.5 },
      { id: 'bbm_2', jenisBBM: 'Pertamax 92', hargaBeli: 11500, hargaJual: 13500, hargaPerLiter: 13500, stokLiter: 120.0 },
      { id: 'bbm_3', jenisBBM: 'Biosolar', hargaBeli: 6000, hargaJual: 7500, hargaPerLiter: 7500, stokLiter: 65.0 }
    ];
  });

  const [psUnits, setPsUnits] = useState<MasterPSUnit[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.PS_UNITS);
    if (saved) {
      try {
        const parsed: MasterPSUnit[] = JSON.parse(saved);
        // Ensure all units are configured with 6000/jam (Rp 3.000 / 30 menit)
        return parsed.map((u) => ({
          ...u,
          tarifPerJam: u.tarifPerJam && u.tarifPerJam >= 6000 ? u.tarifPerJam : 6000
        }));
      } catch (e) {}
    }
    return [
      { id: 'ps_1', kodeUnit: 'PS-01', namaUnit: 'PS5 TV 55" VIP 1', tarifPerJam: 6000, status: 'tersedia', tipeKonsol: 'PS5' },
      { id: 'ps_2', kodeUnit: 'PS-02', namaUnit: 'PS5 TV 55" VIP 2', tarifPerJam: 6000, status: 'tersedia', tipeKonsol: 'PS5' },
      { id: 'ps_3', kodeUnit: 'PS-03', namaUnit: 'PS4 TV 43" Stasiun 3', tarifPerJam: 6000, status: 'tersedia', tipeKonsol: 'PS4' },
      { id: 'ps_4', kodeUnit: 'PS-04', namaUnit: 'PS4 TV 43" Stasiun 4', tarifPerJam: 6000, status: 'tersedia', tipeKonsol: 'PS4' },
      { id: 'ps_5', kodeUnit: 'PS-05', namaUnit: 'PS3 Regular Stasiun 5', tarifPerJam: 6000, status: 'tersedia', tipeKonsol: 'PS3' }
    ];
  });

  const [activePsSessions, setActivePsSessions] = useState<PSRentalSession[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.PS_SESSIONS);
    if (saved) {
      try {
        const parsed: PSRentalSession[] = JSON.parse(saved);
        return parsed.map((s) => ({
          ...s,
          tarifPerJam: s.tarifPerJam && s.tarifPerJam >= 6000 ? s.tarifPerJam : 6000,
          statusBayar: s.statusBayar || 'lunas'
        }));
      } catch (e) {}
    }
    return [];
  });

  // PlayStation Sisa Waktu (Deposit Remaining Time) State
  const [psSisaWaktuList, setPsSisaWaktuList] = useState<PSSisaWaktuRecord[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.PS_SISA_WAKTU);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return [];
  });

  // Transactions State
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
    if (saved) return JSON.parse(saved);
    // Initial realistic transactions for today
    return [
      {
        id: 'tx_101',
        nomorStruk: 'TRX-20261013-0001',
        waktu: `${todayStr}T08:15:00.000Z`,
        tanggal: todayStr,
        kategoriUtama: 'bbm',
        items: [
          {
            nama: 'Pertalite',
            kategori: 'bbm',
            qty: 2,
            satuan: 'liter',
            hargaModal: 8500,
            hargaJual: 10000,
            subtotal: 20000,
            laba: 3000
          }
        ],
        totalModal: 17000,
        totalJual: 20000,
        totalLaba: 3000,
        metodePembayaran: 'tunai',
        statusPembayaran: 'lunas',
        kasirName: 'Kasir Toko (Shift Pagi)',
        kasirId: 'usr_kasir1'
      },
      {
        id: 'tx_102',
        nomorStruk: 'TRX-20261013-0002',
        waktu: `${todayStr}T09:30:00.000Z`,
        tanggal: todayStr,
        kategoriUtama: 'ppob_range',
        items: [
          {
            nama: 'DANA (Transfer Saldo 100.000)',
            kategori: 'ppob_range',
            qty: 1,
            hargaModal: 100000,
            hargaJual: 102000,
            subtotal: 102000,
            laba: 2000,
            catatan: 'Admin range: 2.000'
          }
        ],
        totalModal: 100000,
        totalJual: 102000,
        totalLaba: 2000,
        metodePembayaran: 'tunai',
        statusPembayaran: 'lunas',
        namaPelanggan: 'Pak Joko',
        kasirName: 'Pemilik Toko (Owner)',
        kasirId: 'usr_owner'
      },
      {
        id: 'tx_103',
        nomorStruk: 'TRX-20261013-0003',
        waktu: `${todayStr}T10:45:00.000Z`,
        tanggal: todayStr,
        kategoriUtama: 'ppob_lain',
        items: [
          {
            nama: 'Top Up FF 140 Diamond',
            kategori: 'ppob_lain',
            qty: 1,
            hargaModal: 18500,
            hargaJual: 22000,
            subtotal: 22000,
            laba: 3500
          }
        ],
        totalModal: 18500,
        totalJual: 22000,
        totalLaba: 3500,
        metodePembayaran: 'qris',
        statusPembayaran: 'lunas',
        namaPelanggan: 'Dimas',
        kasirName: 'Kasir Toko (Shift Pagi)',
        kasirId: 'usr_kasir1'
      },
      {
        id: 'tx_104',
        nomorStruk: 'TRX-20261013-0004',
        waktu: `${todayStr}T11:20:00.000Z`,
        tanggal: todayStr,
        kategoriUtama: 'barang',
        items: [
          {
            itemId: 'brg_1',
            nama: 'Kopi Kapal Api Panas',
            kategori: 'barang',
            qty: 2,
            satuan: 'cup',
            hargaModal: 2000,
            hargaJual: 4000,
            subtotal: 8000,
            laba: 4000
          },
          {
            itemId: 'brg_3',
            nama: 'Indomie Goreng + Telur',
            kategori: 'barang',
            qty: 1,
            satuan: 'porsi',
            hargaModal: 6000,
            hargaJual: 10000,
            subtotal: 10000,
            laba: 4000
          }
        ],
        totalModal: 10000,
        totalJual: 18000,
        totalLaba: 8000,
        metodePembayaran: 'tunai',
        statusPembayaran: 'lunas',
        kasirName: 'Pemilik Toko (Owner)',
        kasirId: 'usr_owner'
      },
      {
        id: 'tx_105',
        nomorStruk: 'TRX-20261013-0005',
        waktu: `${todayStr}T12:00:00.000Z`,
        tanggal: todayStr,
        kategoriUtama: 'barang',
        items: [
          {
            itemId: 'brg_6',
            nama: 'Rokok Sampoerna Mild',
            kategori: 'barang',
            qty: 1,
            satuan: 'bks',
            hargaModal: 32000,
            hargaJual: 35000,
            subtotal: 35000,
            laba: 3000
          }
        ],
        totalModal: 32000,
        totalJual: 35000,
        totalLaba: 3000,
        metodePembayaran: 'hutang',
        statusPembayaran: 'hutang',
        namaPelanggan: 'Mas Budi (Bengkel)',
        noHpPelanggan: '081234567890',
        catatan: 'Kasbon rokok, janji bayar sore',
        kasirName: 'Kasir Toko (Shift Pagi)',
        kasirId: 'usr_kasir1'
      }
    ];
  });

  // Debts State
  const [debts, setDebts] = useState<DebtRecord[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.DEBTS);
    if (saved) return JSON.parse(saved);
    return [
      {
        id: 'debt_1',
        transaksiId: 'tx_105',
        nomorStruk: 'TRX-20261013-0005',
        namaPelanggan: 'Mas Budi (Bengkel)',
        noHpPelanggan: '081234567890',
        tanggalTransaksi: todayStr,
        jatuhTempo: new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0],
        totalHutang: 35000,
        totalDibayar: 0,
        sisaHutang: 35000,
        status: 'belum_lunas',
        riwayatPembayaran: [],
        catatan: 'Kasbon rokok Sampoerna Mild'
      },
      {
        id: 'debt_2',
        transaksiId: 'tx_old_99',
        nomorStruk: 'TRX-20261011-0012',
        namaPelanggan: 'Bang Iwan Kontrakan',
        noHpPelanggan: '085678901234',
        tanggalTransaksi: '2026-10-11',
        jatuhTempo: todayStr,
        totalHutang: 45000,
        totalDibayar: 20000,
        sisaHutang: 25000,
        status: 'sebagian',
        riwayatPembayaran: [
          {
            id: 'pay_1',
            waktu: `${todayStr}T09:00:00.000Z`,
            nominal: 20000,
            metode: 'tunai',
            kasirName: 'Pemilik Toko (Owner)',
            catatan: 'Cicilan pertama'
          }
        ],
        catatan: 'Bensin & pulsa'
      }
    ];
  });

  // Expenses State
  const [expenses, setExpenses] = useState<ExpenseRecord[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.EXPENSES);
    if (saved) return JSON.parse(saved);
    return [
      {
        id: 'exp_1',
        waktu: `${todayStr}T07:30:00.000Z`,
        tanggal: todayStr,
        kategori: 'belanja_stok',
        deskripsi: 'Beli es batu kristal 2 karung',
        nominal: 24000,
        kasirName: 'Pemilik Toko (Owner)',
        kasirId: 'usr_owner'
      },
      {
        id: 'exp_2',
        waktu: `${todayStr}T10:00:00.000Z`,
        tanggal: todayStr,
        kategori: 'operasional_lain',
        deskripsi: 'Beli kantong kresek & sedotan',
        nominal: 12000,
        kasirName: 'Kasir Toko (Shift Pagi)',
        kasirId: 'usr_kasir1'
      }
    ];
  });

  // Store Settings
  const [settings, setSettings] = useState<StoreSettings>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (saved) return JSON.parse(saved);
    return {
      namaToko: 'Kios & Rental Berkah Jaya',
      alamat: 'Jl. Raya Sudirman No. 88, Samping SPBU',
      noTelepon: '0812-3456-7890',
      catatanStruk: 'Terima kasih telah berkunjung! Barang yang sudah dibeli tidak dapat ditukar.',
      spreadsheetId: '',
      spreadsheetUrl: '',
      autoSyncSheets: true
    };
  });

  // Google Sheets sync state
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncStatusMessage, setSyncStatusMessage] = useState<string>('Siap sinkron');

  // Quick New Transaction Modal
  const [isNewTxModalOpen, setIsNewTxModalOpen] = useState<boolean>(false);
  const [newTxInitialCategory, setNewTxInitialCategory] = useState<any>('ppob_range');

  const openNewTxModal = (category: any = 'ppob_range') => {
    setNewTxInitialCategory(category);
    setIsNewTxModalOpen(true);
  };

  const closeNewTxModal = () => {
    setIsNewTxModalOpen(false);
  };

  // Sync state persistence to LocalStorage
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users)); }, [users]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(currentUser)); }, [currentUser]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions)); }, [transactions]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.DEBTS, JSON.stringify(debts)); }, [debts]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(expenses)); }, [expenses]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.PPOB_RANGES, JSON.stringify(ppobRanges)); }, [ppobRanges]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.PPOB_LAIN, JSON.stringify(ppobLains)); }, [ppobLains]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.BARANG, JSON.stringify(barangList)); }, [barangList]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.BBM, JSON.stringify(bbmList)); }, [bbmList]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.PS_UNITS, JSON.stringify(psUnits)); }, [psUnits]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.PS_SESSIONS, JSON.stringify(activePsSessions)); }, [activePsSessions]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.PS_SISA_WAKTU, JSON.stringify(psSisaWaktuList)); }, [psSisaWaktuList]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings)); }, [settings]);

  // Firebase auth initialization listener
  useEffect(() => {
    initAuth(
      (user, token) => {
        setGoogleUser(user);
        setGoogleAccessToken(token);
      },
      () => {
        setGoogleUser(null);
        setGoogleAccessToken(null);
      }
    );
  }, []);

  const finishPsSessionRef = useRef<any>(null);

  // Timer interval for PlayStation active billing sessions
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setActivePsSessions((prevSessions) => {
        let changed = false;
        const updated = prevSessions.map((sess) => {
          if (sess.status !== 'aktif') return sess;

          // Auto finish if paket_jam time is reached (berhenti otomatis saat waktu habis)
          if (sess.mode === 'paket_jam' && sess.waktuSelesaiRencana) {
            const planEndMs = new Date(sess.waktuSelesaiRencana).getTime();
            if (now >= planEndMs) {
              if (finishPsSessionRef.current) {
                setTimeout(() => finishPsSessionRef.current(sess.id, sess.metodeBayar || 'tunai'), 0);
              }
            }
          }

          const startTimeMs = new Date(sess.waktuMulai).getTime();
          const elapsedMinutes = Math.max(1, Math.ceil((now - startTimeMs) / (60 * 1000)));

          let computedRentalCost = 0;
          const tarifPer30Mnt = Math.round((sess.tarifPerJam && sess.tarifPerJam >= 6000 ? sess.tarifPerJam : 6000) / 2); // Rp 3.000 per 30 menit
          if (sess.mode === 'paket_jam' && sess.durasiPaketJam) {
            computedRentalCost = Math.round((sess.durasiPaketJam / 0.5) * tarifPer30Mnt);
          } else {
            // Open billing: calculate strictly per minute at 83.33 / 83.34 rupiah per minute (5000 / 60)
            const ratePerMin = 5000 / 60; // ~83.3333 rupiah per minute
            computedRentalCost = Math.round(elapsedMinutes * ratePerMin);
          }

          const fnbTotal = sess.tambahanItem.reduce((acc, it) => acc + it.subtotal, 0);
          const newTotal = computedRentalCost + fnbTotal;

          if (elapsedMinutes !== sess.durasiMenitTerhitung || newTotal !== sess.totalBiaya) {
            changed = true;
            return {
              ...sess,
              durasiMenitTerhitung: elapsedMinutes,
              biayaRental: computedRentalCost,
              totalBiaya: newTotal
            };
          }
          return sess;
        });
        return changed ? updated : prevSessions;
      });
    }, 5000); // check every 5 seconds

    return () => clearInterval(interval);
  }, []);

  // Auth Functions
  const loginManual = (username: string, pass: string): boolean => {
    const match = users.find(
      (u) =>
        u.username.toLowerCase() === username.toLowerCase().trim() &&
        (u.password === pass || !u.password)
    );
    if (match) {
      if (match.isActive === false) {
        return false; // account deactivated
      }
      setCurrentUser(match);
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(match));
      return true;
    }
    return false;
  };

  const loginGoogle = async (): Promise<{ success: boolean; message?: string }> => {
    try {
      const result = await googleSignIn();
      if (!result) {
        return { success: false, message: 'Login Google dibatalkan atau tidak ada respon.' };
      }

      setGoogleUser(result.user);
      setGoogleAccessToken(result.accessToken);

      const email = (result.user.email || '').toLowerCase().trim();

      // Check if this Google email is registered by the Owner!
      const registeredUser = users.find(
        (u) => (u.email || '').toLowerCase().trim() === email
      );

      if (!registeredUser) {
        // Unregistered email! Reject login as requested
        logoutGoogle();
        setGoogleUser(null);
        setGoogleAccessToken(null);
        setCurrentUser(null);
        localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
        return {
          success: false,
          message: `Email Google "${email}" belum terdaftar oleh Owner. Hanya akun yang telah didaftarkan oleh Pemilik Toko (Owner) yang dapat masuk ke sistem.`
        };
      }

      if (registeredUser.isActive === false) {
        logoutGoogle();
        setGoogleUser(null);
        setGoogleAccessToken(null);
        setCurrentUser(null);
        localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
        return {
          success: false,
          message: `Akun Google "${email}" telah dinonaktifkan oleh Owner.`
        };
      }

      // Found registered user!
      setCurrentUser(registeredUser);
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(registeredUser));
      return { success: true };
    } catch (err: any) {
      console.error('Login Google failed:', err);
      return { success: false, message: err?.message || 'Terjadi kesalahan saat masuk dengan Google.' };
    }
  };

  const logout = () => {
    logoutGoogle();
    setGoogleUser(null);
    setGoogleAccessToken(null);
    setCurrentUser(null);
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
  };

  const addUser = (userData: Omit<UserAccount, 'id' | 'createdAt'>) => {
    const newUser: UserAccount = {
      ...userData,
      id: `usr_${Date.now()}`,
      isActive: true,
      createdAt: new Date().toISOString()
    };
    setUsers((prev) => [...prev, newUser]);
  };

  const deleteUser = (id: string) => {
    setUsers((prev) => prev.filter((u) => u.id !== id));
  };

  const updateUserProfile = (name: string, username: string, password?: string) => {
    if (!currentUser) return;
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id === currentUser.id) {
          const updated = {
            ...u,
            name: name.trim() || u.name,
            username: username.trim() || u.username,
            password: password && password.trim() ? password.trim() : u.password
          };
          setCurrentUser(updated);
          localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(updated));
          return updated;
        }
        return u;
      })
    );
  };

  const toggleUserActive = (id: string) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === id ? { ...u, isActive: u.isActive === false ? true : false } : u))
    );
  };

  const resetUserPassword = (id: string, newPass: string) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === id ? { ...u, password: newPass } : u))
    );
  };

  // Transaction Functions
  const addTransaction = (txData: Omit<Transaction, 'id' | 'nomorStruk' | 'waktu' | 'tanggal'>): Transaction => {
    const now = new Date();
    const dateStr = getTodayDateStr();
    const countToday = transactions.filter((t) => t.tanggal === dateStr).length + 1;
    const nomorStruk = `TRX-${dateStr.replace(/-/g, '')}-${String(countToday).padStart(4, '0')}`;

    const newTx: Transaction = {
      ...txData,
      id: `tx_${Date.now()}`,
      nomorStruk,
      waktu: now.toISOString(),
      tanggal: dateStr
    };

    setTransactions((prev) => [newTx, ...prev]);

    // Update Stock for Goods
    newTx.items.forEach((item) => {
      if (item.kategori === 'barang' && item.itemId) {
        setBarangList((prevList) =>
          prevList.map((b) => {
            if (b.id === item.itemId) {
              const updatedStok = Math.max(0, b.stok - item.qty);
              return { ...b, stok: updatedStok };
            }
            return b;
          })
        );
      } else if (item.kategori === 'bbm') {
        // deduct liter stock from BBM
        setBbmList((prevBbm) =>
          prevBbm.map((bm) => {
            if (bm.jenisBBM.toLowerCase() === item.nama.toLowerCase()) {
              const updatedLiter = Math.max(0, Number((bm.stokLiter - item.qty).toFixed(2)));
              return { ...bm, stokLiter: updatedLiter };
            }
            return bm;
          })
        );
      }
    });

    // If payment status is Hutang or Sebagian, automatically create a Debt record
    if (newTx.statusPembayaran === 'hutang' || newTx.statusPembayaran === 'sebagian') {
      const isSebagian = newTx.statusPembayaran === 'sebagian';
      const paidAmount = isSebagian ? (newTx.jumlahBayar || 0) : 0;
      const sisaAmount = isSebagian
        ? (newTx.sisaHutang !== undefined ? newTx.sisaHutang : Math.max(0, newTx.totalJual - paidAmount))
        : newTx.totalJual;

      const initialPayments = isSebagian && paidAmount > 0
        ? [
            {
              id: `pay_dp_${Date.now()}`,
              waktu: newTx.waktu,
              nominal: paidAmount,
              metode: newTx.metodePembayaran,
              kasirName: newTx.kasirName,
              catatan: 'Pembayaran sebagian (DP saat transaksi)'
            }
          ]
        : [];

      const newDebt: DebtRecord = {
        id: `debt_${Date.now()}`,
        transaksiId: newTx.id,
        nomorStruk: newTx.nomorStruk,
        namaPelanggan: newTx.namaPelanggan || 'Pelanggan Tanpa Nama',
        noHpPelanggan: newTx.noHpPelanggan || '',
        tanggalTransaksi: newTx.tanggal,
        jatuhTempo: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0], // 7 days default
        totalHutang: newTx.totalJual,
        totalDibayar: paidAmount,
        sisaHutang: sisaAmount,
        status: isSebagian ? 'sebagian' : 'belum_lunas',
        riwayatPembayaran: initialPayments,
        catatan: newTx.catatan || (isSebagian ? 'Bayar Sebagian Transaksi Baru' : 'Hutang Transaksi Baru')
      };
      setDebts((prev) => [newDebt, ...prev]);
    }

    return newTx;
  };

  const deleteTransaction = (id: string) => {
    setTransactions((prev) => prev.filter((t) => t.id !== id));
    setDebts((prev) => prev.filter((d) => d.transaksiId !== id));
  };

  const deleteDebt = (id: string) => {
    setDebts((prev) => prev.filter((d) => d.id !== id));
  };

  // Pay Debt Function
  const payDebt = (debtId: string, nominal: number, metode: any, catatan?: string) => {
    setDebts((prevDebts) =>
      prevDebts.map((d) => {
        if (d.id !== debtId) return d;
        const newPaid = d.totalDibayar + nominal;
        const newRemaining = Math.max(0, d.totalHutang - newPaid);
        const newStatus = newRemaining === 0 ? 'lunas' : 'sebagian';

        const paymentItem = {
          id: `pay_${Date.now()}`,
          waktu: new Date().toISOString(),
          nominal,
          metode,
          kasirName: currentUser?.name || 'Kasir',
          catatan
        };

        return {
          ...d,
          totalDibayar: newPaid,
          sisaHutang: newRemaining,
          status: newStatus,
          riwayatPembayaran: [paymentItem, ...d.riwayatPembayaran]
        };
      })
    );
  };

  // Expenses Functions
  const addExpense = (expData: Omit<ExpenseRecord, 'id' | 'waktu' | 'tanggal' | 'kasirName' | 'kasirId'>) => {
    const now = new Date();
    const newExp: ExpenseRecord = {
      ...expData,
      id: `exp_${Date.now()}`,
      waktu: now.toISOString(),
      tanggal: getTodayDateStr(),
      kasirName: currentUser?.name || 'Kasir',
      kasirId: currentUser?.id || 'usr_unknown'
    };
    setExpenses((prev) => [newExp, ...prev]);
  };

  const deleteExpense = (id: string) => {
    setExpenses((prev) => prev.filter((e) => e.id !== id));
  };

  // Masters
  const addPpobRange = (item: Omit<MasterPPOBRange, 'id'>) => {
    const newItem: MasterPPOBRange = { ...item, id: `rng_${Date.now()}` };
    setPpobRanges((prev) => [...prev, newItem]);
  };
  const deletePpobRange = (id: string) => {
    setPpobRanges((prev) => prev.filter((r) => r.id !== id));
  };

  const addPpobLain = (item: Omit<MasterPPOBLain, 'id'>) => {
    const newItem: MasterPPOBLain = { ...item, id: `pl_${Date.now()}` };
    setPpobLains((prev) => [...prev, newItem]);
  };
  const deletePpobLain = (id: string) => {
    setPpobLains((prev) => prev.filter((l) => l.id !== id));
  };

  const addBarang = (item: Omit<MasterBarang, 'id'>) => {
    const newItem: MasterBarang = { ...item, id: `brg_${Date.now()}` };
    setBarangList((prev) => [...prev, newItem]);
  };
  const updateBarang = (item: MasterBarang) => {
    setBarangList((prev) => prev.map((b) => (b.id === item.id ? item : b)));
  };
  const deleteBarang = (id: string) => {
    setBarangList((prev) => prev.filter((b) => b.id !== id));
  };

  const updateBbmPricesAndStock = (id: string, hargaBeli: number, hargaJual: number, stokLiter: number) => {
    setBbmList((prev) =>
      prev.map((b) => (b.id === id ? { ...b, hargaBeli, hargaJual, hargaPerLiter: hargaJual, stokLiter } : b))
    );
  };

  const addPsUnit = (unit: Omit<MasterPSUnit, 'id'>) => {
    const newUnit: MasterPSUnit = { ...unit, id: `ps_${Date.now()}` };
    setPsUnits((prev) => [...prev, newUnit]);
  };
  const updatePsUnit = (unit: MasterPSUnit) => {
    setPsUnits((prev) => prev.map((u) => (u.id === unit.id ? unit : u)));
  };
  const deletePsUnit = (id: string) => {
    setPsUnits((prev) => prev.filter((u) => u.id !== id));
  };

  // PlayStation Rental Session Handlers
  const startPsSession = (
    unitId: string,
    namaPelanggan: string,
    mode: 'open_billing' | 'paket_jam',
    durasiJam?: number,
    metodeBayar: string = 'tunai',
    statusBayar: 'lunas' | 'belum_bayar' = 'lunas'
  ) => {
    const unit = psUnits.find((u) => u.id === unitId);
    if (!unit) return;

    const now = new Date();
    let plannedEnd: string | undefined = undefined;
    const unitTarif = unit.tarifPerJam && unit.tarifPerJam >= 6000 ? unit.tarifPerJam : 6000;
    const tarifPer30Mnt = Math.round(unitTarif / 2); // Standar Rp 3.000 per 30 menit

    let initialCost = 0;
    if (mode === 'paket_jam' && durasiJam) {
      plannedEnd = new Date(now.getTime() + durasiJam * 60 * 60 * 1000).toISOString();
      initialCost = Math.round((durasiJam / 0.5) * tarifPer30Mnt);
    } else {
      initialCost = 0; // Open billing starts at 0, no upfront fee
    }

    const newSession: PSRentalSession = {
      id: `sess_${Date.now()}`,
      unitId,
      namaUnit: unit.namaUnit,
      namaPelanggan: namaPelanggan.trim() || 'Pelanggan PS',
      mode,
      durasiPaketJam: durasiJam,
      waktuMulai: now.toISOString(),
      waktuSelesaiRencana: plannedEnd,
      tarifPerJam: unitTarif,
      durasiMenitTerhitung: mode === 'paket_jam' && durasiJam ? Math.round(durasiJam * 60) : 1,
      biayaRental: initialCost,
      tambahanItem: [],
      totalBiaya: initialCost,
      status: 'aktif',
      kasirName: currentUser?.name || 'Kasir',
      metodeBayar: metodeBayar || 'tunai',
      statusBayar
    };

    setActivePsSessions((prev) => [newSession, ...prev]);

    // Set unit status to sedang_main
    setPsUnits((prev) =>
      prev.map((u) => (u.id === unitId ? { ...u, status: 'sedang_main' } : u))
    );
  };

  const markPsSessionPaid = (sessionId: string, metodeBayar: string = 'tunai') => {
    setActivePsSessions((prev) =>
      prev.map((s) => (s.id === sessionId ? { ...s, statusBayar: 'lunas', metodeBayar } : s))
    );
  };

  const addItemToPsSession = (sessionId: string, barangId: string, qty: number) => {
    const item = barangList.find((b) => b.id === barangId);
    if (!item) return;

    setActivePsSessions((prev) =>
      prev.map((s) => {
        if (s.id !== sessionId) return s;
        const subtotal = item.hargaJual * qty;
        const laba = (item.hargaJual - item.hargaModal) * qty;

        const newItem: TransactionItem = {
          itemId: item.id,
          nama: item.nama,
          kategori: 'barang',
          qty,
          satuan: item.satuan,
          hargaModal: item.hargaModal,
          hargaJual: item.hargaJual,
          subtotal,
          laba
        };

        const updatedItems = [...s.tambahanItem, newItem];
        const newTotal = s.biayaRental + updatedItems.reduce((acc, it) => acc + it.subtotal, 0);

        return {
          ...s,
          tambahanItem: updatedItems,
          totalBiaya: newTotal
        };
      })
    );

    // deduct item stock
    setBarangList((prev) =>
      prev.map((b) => (b.id === barangId ? { ...b, stok: Math.max(0, b.stok - qty) } : b))
    );
  };

  const finishPsSession = (
    sessionId: string,
    paymentOptions?: {
      metodeBayar?: any;
      statusPembayaran?: any;
      jumlahBayar?: number;
      sisaHutang?: number;
    } | string
  ): Transaction | null => {
    finishPsSessionRef.current = finishPsSession;
    const session = activePsSessions.find((s) => s.id === sessionId);
    if (!session) return null;

    let finalRentalCost = session.biayaRental;
    let finalDurasiLabel = `${session.durasiMenitTerhitung} Menit`;

    if (session.mode === 'open_billing') {
      const nowMs = Date.now();
      const startMs = new Date(session.waktuMulai).getTime();
      const diffSecs = Math.max(0, Math.floor((nowMs - startMs) / 1000));
      const elapsedMins = Math.max(1, Math.ceil(diffSecs / 60));
      finalDurasiLabel = `${elapsedMins} Menit (Open Billing)`;

      // Tarif: ~83.33 / 83.34 rupiah per minute (5000 / 60)
      const ratePerMin = 5000 / 60;
      let cost = Math.round(elapsedMins * ratePerMin);
      finalRentalCost = cost;
    } else {
      finalDurasiLabel = `${session.durasiPaketJam} Jam`;
    }

    const rentalItem: TransactionItem = {
      nama: `Rental ${session.namaUnit} (${finalDurasiLabel})`,
      kategori: 'rental_ps',
      qty: 1,
      satuan: 'sesi',
      hargaModal: 0,
      hargaJual: finalRentalCost,
      subtotal: finalRentalCost,
      laba: finalRentalCost,
      catatan: `Pelanggan: ${session.namaPelanggan}${session.statusBayar === 'lunas' ? ' (Bayar Diawal)' : ' (Bayar Diakhir)'}`
    };

    const allItems: TransactionItem[] = [rentalItem, ...session.tambahanItem];
    const totalModal = allItems.reduce((acc, it) => acc + (it.hargaModal * (it.qty || 1)), 0);
    const fnbTotal = session.tambahanItem.reduce((acc, it) => acc + it.subtotal, 0);
    const totalJual = finalRentalCost + fnbTotal;
    const totalLaba = totalJual - totalModal;

    const method = typeof paymentOptions === 'string'
      ? paymentOptions
      : (paymentOptions?.metodeBayar || session.metodeBayar || 'tunai');
    const status = typeof paymentOptions === 'object' && paymentOptions?.statusPembayaran
      ? paymentOptions.statusPembayaran
      : 'lunas';
    const jumlahBayar = typeof paymentOptions === 'object' ? paymentOptions?.jumlahBayar : undefined;
    const sisaHutang = typeof paymentOptions === 'object' ? paymentOptions?.sisaHutang : undefined;

    const createdTx = addTransaction({
      kategoriUtama: 'rental_ps',
      items: allItems,
      totalModal,
      totalJual,
      totalLaba,
      metodePembayaran: method as any,
      statusPembayaran: status as any,
      jumlahBayar,
      sisaHutang,
      namaPelanggan: session.namaPelanggan,
      kasirName: currentUser?.name || session.kasirName,
      kasirId: currentUser?.id || 'usr_unknown',
      catatan: `Selesai Rental ${session.namaUnit} (${finalDurasiLabel})`
    });

    // Remove from active sessions
    setActivePsSessions((prev) => prev.filter((s) => s.id !== sessionId));

    // Release unit
    setPsUnits((prev) =>
      prev.map((u) => (u.id === session.unitId ? { ...u, status: 'tersedia' } : u))
    );

    return createdTx;
  };

  const savePsSisaWaktu = (
    sessionId: string,
    namaPelangganInput: string,
    sisaMenit: number,
    catatan?: string
  ): Transaction | null => {
    const session = activePsSessions.find((s) => s.id === sessionId);
    if (!session) return null;

    const finalName = namaPelangganInput.trim() || session.namaPelanggan || 'Pelanggan PS';

    // Record session transaction ("tetap masuk transaksinya")
    const rentalItem: TransactionItem = {
      nama: `Rental ${session.namaUnit} (Sisa ${sisaMenit} mnt dicatat untuk ${finalName})`,
      kategori: 'rental_ps',
      qty: 1,
      satuan: 'sesi',
      hargaModal: 0,
      hargaJual: session.biayaRental,
      subtotal: session.biayaRental,
      laba: session.biayaRental,
      catatan: `Sisa waktu ${sisaMenit} menit dicatat untuk ${finalName}`
    };

    const allItems: TransactionItem[] = [rentalItem, ...session.tambahanItem];
    const totalModal = allItems.reduce((acc, it) => acc + (it.hargaModal * (it.qty || 1)), 0);
    const totalJual = session.totalBiaya;
    const totalLaba = totalJual - totalModal;

    const createdTx = addTransaction({
      kategoriUtama: 'rental_ps',
      items: allItems,
      totalModal,
      totalJual,
      totalLaba,
      metodePembayaran: (session.metodeBayar || 'tunai') as any,
      statusPembayaran: 'lunas',
      namaPelanggan: finalName,
      kasirName: currentUser?.name || session.kasirName,
      kasirId: currentUser?.id || 'usr_unknown',
      catatan: `Sisa waktu (${sisaMenit} mnt) disimpan untuk ${finalName} - Unit ${session.namaUnit}`
    });

    // Add to deposit sisa waktu list
    const newRecord: PSSisaWaktuRecord = {
      id: `sw_${Date.now()}`,
      namaPelanggan: finalName,
      namaUnit: session.namaUnit,
      sisaMenit: Math.max(1, sisaMenit),
      waktuSimpan: new Date().toISOString(),
      sudahDigunakan: false,
      catatan: catatan || `Sisa waktu dari sesi ${session.namaUnit}`,
      kasirName: currentUser?.name || 'Kasir'
    };

    setPsSisaWaktuList((prev) => [newRecord, ...prev]);

    // Release active session & unit
    setActivePsSessions((prev) => prev.filter((s) => s.id !== sessionId));
    setPsUnits((prev) =>
      prev.map((u) => (u.id === session.unitId ? { ...u, status: 'tersedia' } : u))
    );

    return createdTx;
  };

  const usePsSisaWaktu = (sisaWaktuId: string, unitId: string) => {
    const record = psSisaWaktuList.find((r) => r.id === sisaWaktuId);
    if (!record) return;

    const durasiJam = record.sisaMenit / 60;
    startPsSession(unitId, record.namaPelanggan, 'paket_jam', durasiJam, 'tunai', 'lunas');

    // Mark as used
    setPsSisaWaktuList((prev) =>
      prev.map((r) => (r.id === sisaWaktuId ? { ...r, sudahDigunakan: true } : r))
    );
  };

  const deletePsSisaWaktu = (sisaWaktuId: string) => {
    setPsSisaWaktuList((prev) => prev.filter((r) => r.id !== sisaWaktuId));
  };

  const extendPsSession = (sessionId: string, hoursToAdd: number) => {
    setActivePsSessions((prev) =>
      prev.map((s) => {
        if (s.id !== sessionId) return s;
        const currentEndMs = s.waktuSelesaiRencana ? new Date(s.waktuSelesaiRencana).getTime() : Date.now();
        const newEndMs = Math.max(Date.now(), currentEndMs) + hoursToAdd * 60 * 60 * 1000;
        const newDurasiJam = (s.durasiPaketJam || 0) + hoursToAdd;

        const tarifPer30Mnt = Math.round((s.tarifPerJam && s.tarifPerJam >= 6000 ? s.tarifPerJam : 6000) / 2);
        const newBiayaRental = Math.round((newDurasiJam / 0.5) * tarifPer30Mnt);
        const fnbTotal = s.tambahanItem.reduce((acc, it) => acc + it.subtotal, 0);

        return {
          ...s,
          durasiPaketJam: newDurasiJam,
          waktuSelesaiRencana: new Date(newEndMs).toISOString(),
          biayaRental: newBiayaRental,
          totalBiaya: newBiayaRental + fnbTotal
        };
      })
    );
  };

  const cancelPsSession = (sessionId: string) => {
    const session = activePsSessions.find((s) => s.id === sessionId);
    if (!session) return;

    // Rollback any F&B items consumed
    session.tambahanItem.forEach((it) => {
      if (it.itemId) {
        setBarangList((prev) =>
          prev.map((b) => (b.id === it.itemId ? { ...b, stok: b.stok + it.qty } : b))
        );
      }
    });

    setActivePsSessions((prev) => prev.filter((s) => s.id !== sessionId));
    setPsUnits((prev) =>
      prev.map((u) => (u.id === session.unitId ? { ...u, status: 'tersedia' } : u))
    );
  };

  // Store Settings & Sync
  const updateSettings = (newSettings: Partial<StoreSettings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
  };

  const triggerGoogleSheetSync = async (silent: boolean = false): Promise<boolean> => {
    let token = googleAccessToken;
    if (!token) {
      token = await getAccessToken();
    }

    if (!token) {
      if (!silent) {
        setSyncStatusMessage('Belum terhubung ke Akun Google. Silakan login terlebih dahulu.');
      }
      return false;
    }

    let sheetId = settings.spreadsheetId;
    if (!sheetId) {
      // Auto-create spreadsheet if not set yet
      try {
        setIsSyncing(true);
        setSyncStatusMessage('Membuat Google Spreadsheet baru di Drive...');
        const created = await createStoreSpreadsheet(token, `POS_${settings.namaToko.replace(/\s+/g, '_')}`);
        sheetId = created.spreadsheetId;
        updateSettings({
          spreadsheetId: sheetId,
          spreadsheetUrl: created.spreadsheetUrl
        });
      } catch (err: any) {
        setIsSyncing(false);
        if (!silent) setSyncStatusMessage(`Gagal membuat spreadsheet: ${err.message}`);
        return false;
      }
    }

    setIsSyncing(true);
    setSyncStatusMessage(silent ? 'Menyinkronkan otomatis ke Google Sheet...' : 'Sedang menyinkronkan data ke Google Sheet...');

    const result = await syncAllToGoogleSheet(token, sheetId, {
      transaksi: transactions,
      pengeluaran: expenses,
      hutang: debts,
      ppobRange: ppobRanges,
      ppobLain: ppobLains,
      barang: barangList,
      bbm: bbmList,
      rentalPS: activePsSessions
    });

    setIsSyncing(false);
    if (result.success) {
      const nowTime = new Date().toLocaleTimeString('id-ID');
      setSyncStatusMessage(`Otomatis tersinkron pukul ${nowTime}`);
      updateSettings({
        lastSyncedAt: new Date().toISOString(),
        spreadsheetUrl: result.spreadsheetUrl || settings.spreadsheetUrl
      });
      return true;
    } else {
      if (!silent) {
        setSyncStatusMessage(`Sinkron gagal: ${result.message}`);
      }
      return false;
    }
  };

  // Background debounced auto-sync to Google Sheet whenever transactions, expenses, debts, or masters change
  const isInitialSyncMount = React.useRef(true);
  useEffect(() => {
    if (isInitialSyncMount.current) {
      isInitialSyncMount.current = false;
      return;
    }
    // Only auto sync if Google account is connected
    if (!googleUser && !googleAccessToken) return;

    const timer = setTimeout(() => {
      triggerGoogleSheetSync(true);
    }, 2500);

    return () => clearTimeout(timer);
  }, [transactions, expenses, debts, barangList, bbmList, ppobRanges, ppobLains]);

  const createNewGoogleSheet = async (): Promise<string | null> => {
    let token = googleAccessToken;
    if (!token) {
      token = await getAccessToken();
    }
    if (!token) {
      throw new Error('Harap login dengan Akun Google terlebih dahulu.');
    }

    setIsSyncing(true);
    setSyncStatusMessage('Membuat spreadsheet baru...');
    try {
      const res = await createStoreSpreadsheet(token, `POS_${settings.namaToko.replace(/\s+/g, '_')}`);
      updateSettings({
        spreadsheetId: res.spreadsheetId,
        spreadsheetUrl: res.spreadsheetUrl,
        lastSyncedAt: new Date().toISOString()
      });
      setIsSyncing(false);
      setSyncStatusMessage('Spreadsheet baru berhasil dibuat dan ditautkan!');
      // Trigger initial sync
      await triggerGoogleSheetSync();
      return res.spreadsheetId;
    } catch (err: any) {
      setIsSyncing(false);
      setSyncStatusMessage(`Gagal: ${err.message}`);
      throw err;
    }
  };

  // Automatic Background Synchronization to Google Sheet when transactions/data mutate
  useEffect(() => {
    if (googleAccessToken && settings.autoSyncSheets && settings.spreadsheetId) {
      const syncTimeout = setTimeout(() => {
        triggerGoogleSheetSync().catch(() => {});
      }, 2500);
      return () => clearTimeout(syncTimeout);
    }
  }, [transactions, debts, expenses, activePsSessions, barangList, bbmList, googleAccessToken, settings.spreadsheetId]);

  return (
    <AppContext.Provider
      value={{
        currentUser,
        googleUser,
        googleAccessToken,
        users,
        loginManual,
        loginGoogle,
        logout,
        addUser,
        deleteUser,
        updateUserProfile,
        toggleUserActive,
        resetUserPassword,

        activeTab,
        setActiveTab,

        transactions,
        addTransaction,
        deleteTransaction,

        debts,
        payDebt,
        deleteDebt,

        expenses,
        addExpense,
        deleteExpense,

        ppobRanges,
        setPpobRanges,
        addPpobRange,
        deletePpobRange,

        ppobLains,
        setPpobLains,
        addPpobLain,
        deletePpobLain,

        barangList,
        setBarangList,
        addBarang,
        updateBarang,
        deleteBarang,

        bbmList,
        setBbmList,
        updateBbmPricesAndStock,

        psUnits,
        setPsUnits,
        addPsUnit,
        updatePsUnit,
        deletePsUnit,

        activePsSessions,
        startPsSession,
        addItemToPsSession,
        finishPsSession,
        cancelPsSession,
        markPsSessionPaid,
        extendPsSession,

        psSisaWaktuList,
        savePsSisaWaktu,
        usePsSisaWaktu,
        deletePsSisaWaktu,

        settings,
        updateSettings,
        isSyncing,
        syncStatusMessage,
        triggerGoogleSheetSync,
        createNewGoogleSheet,

        isNewTxModalOpen,
        openNewTxModal,
        closeNewTxModal,
        newTxInitialCategory,

        darkMode,
        setDarkMode
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
