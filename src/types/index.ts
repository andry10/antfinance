export type UserRole = 'owner' | 'kasir';

export interface UserAccount {
  id: string;
  username: string;
  password?: string;
  name: string;
  role: UserRole;
  email?: string;
  isActive?: boolean;
  createdAt: string;
}

export type TransactionCategory = 'ppob_range' | 'ppob_lain' | 'barang' | 'bbm' | 'rental_ps';
export type PaymentStatus = 'lunas' | 'hutang' | 'sebagian';
export type PaymentMethod = 'tunai' | 'qris' | 'transfer' | 'hutang';

export interface TransactionItem {
  itemId?: string;
  nama: string;
  kategori: TransactionCategory;
  qty: number;
  satuan?: string;
  hargaModal: number;
  hargaJual: number;
  subtotal: number;
  laba: number;
  catatan?: string;
}

export interface Transaction {
  id: string;
  nomorStruk: string;
  waktu: string; // ISO date string
  tanggal: string; // YYYY-MM-DD
  kategoriUtama: TransactionCategory;
  items: TransactionItem[];
  totalModal: number;
  totalJual: number;
  totalLaba: number;
  metodePembayaran: PaymentMethod;
  statusPembayaran: PaymentStatus;
  jumlahBayar?: number; // Jumlah yang dibayar pelanggan (untuk bayar sebagian)
  sisaHutang?: number; // Sisa piutang yang belum dibayar
  namaPelanggan?: string;
  noHpPelanggan?: string;
  catatan?: string;
  kasirName: string;
  kasirId: string;
  syncedToSheets?: boolean;
}

export interface DebtRecord {
  id: string;
  transaksiId: string;
  nomorStruk: string;
  namaPelanggan: string;
  noHpPelanggan: string;
  tanggalTransaksi: string;
  jatuhTempo: string;
  totalHutang: number;
  totalDibayar: number;
  sisaHutang: number;
  status: 'belum_lunas' | 'sebagian' | 'lunas';
  riwayatPembayaran: {
    id: string;
    waktu: string;
    nominal: number;
    metode: PaymentMethod;
    kasirName: string;
    catatan?: string;
  }[];
  catatan?: string;
  syncedToSheets?: boolean;
}

export interface ExpenseRecord {
  id: string;
  waktu: string;
  tanggal: string; // YYYY-MM-DD
  kategori: 'belanja_stok' | 'listrik_air' | 'sewa_tempat' | 'gaji' | 'servis_alat' | 'operasional_lain';
  deskripsi: string;
  nominal: number;
  kasirName: string;
  kasirId: string;
  syncedToSheets?: boolean;
}

// Master Data Definitions
export interface MasterPPOBRange {
  id: string;
  namaLayanan: string; // misal DANA, OVO, Gopay, Transfer BCA
  minNominal: number;
  maxNominal: number;
  biayaAdmin: number;
  keterangan?: string;
}

export interface MasterPPOBLain {
  id: string;
  namaLayanan: string; // misal Pulsa Telkomsel 10k, Top Up FF 140 Diamond
  kategori: string; // Pulsa, Game, PLN, E-Money
  hargaModal: number;
  hargaJual: number;
  keterangan?: string;
}

export interface MasterBarang {
  id: string;
  nama: string;
  satuan: string; // pcs, bks, botol, sachet, pack
  stok: number;
  stokMinimum: number;
  hargaModal: number;
  hargaJual: number;
  kategori?: string;
}

export interface MasterBBM {
  id: string;
  jenisBBM: string; // Pertalite, Pertamax, Solar, Dexlite
  hargaBeli: number;
  hargaJual: number;
  hargaPerLiter?: number;
  stokLiter: number;
}

export type PSUnitStatus = 'tersedia' | 'sedang_main' | 'maintenance';
export type PSRentalMode = 'open_billing' | 'paket_jam';

export interface MasterPSUnit {
  id: string;
  kodeUnit: string; // PS-01, PS-02
  namaUnit: string; // PS5 Stasiun 1, PS4 TV 43 Inch
  tarifPerJam: number;
  status: PSUnitStatus;
  tipeKonsol: 'PS3' | 'PS4' | 'PS5';
}

export interface PSRentalSession {
  id: string;
  unitId: string;
  namaUnit: string;
  namaPelanggan: string;
  mode: PSRentalMode;
  tarifPerJam: number;
  waktuMulai: string; // ISO string
  durasiPaketJam?: number; // jika paket_jam
  waktuSelesaiRencana?: string; // ISO string jika paket_jam
  waktuSelesaiAktual?: string;
  durasiMenitTerhitung: number;
  biayaRental: number;
  tambahanItem: TransactionItem[];
  totalBiaya: number;
  status: 'aktif' | 'selesai' | 'dibatalkan';
  kasirName: string;
  metodeBayar?: string;
  statusBayar?: 'lunas' | 'belum_bayar';
}

export interface PSSisaWaktuRecord {
  id: string;
  namaPelanggan: string;
  namaUnit: string;
  sisaMenit: number;
  waktuSimpan: string;
  sudahDigunakan: boolean;
  catatan?: string;
  kasirName: string;
}

export interface StoreSettings {
  namaToko: string;
  alamat: string;
  noTelepon: string;
  catatanStruk: string;
  spreadsheetId: string;
  spreadsheetUrl: string;
  autoSyncSheets: boolean;
  lastSyncedAt?: string;
}
