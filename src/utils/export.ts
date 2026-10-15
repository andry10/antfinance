import { Transaction, ExpenseRecord, DebtRecord, MasterBarang } from '../types';

export function exportTransactionsToCSV(transactions: Transaction[]) {
  const headers = ['ID', 'No Struk', 'Waktu', 'Tanggal', 'Kategori', 'Item', 'Modal', 'Jual', 'Laba', 'Metode Pembayaran', 'Status', 'Kasir', 'Pelanggan'];
  const rows = transactions.map((t) => [
    t.id,
    t.nomorStruk,
    t.waktu,
    t.tanggal,
    t.kategoriUtama,
    `"${(t.items || []).map((i) => `${i.nama} (${i.qty})`).join('; ')}"`,
    t.totalModal,
    t.totalJual,
    t.totalLaba,
    t.metodePembayaran,
    t.statusPembayaran,
    `"${t.kasirName}"`,
    `"${t.namaPelanggan || '-'}"`
  ]);

  const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  downloadCSV(csvContent, `Laporan_Transaksi_${new Date().toISOString().split('T')[0]}.csv`);
}

export function exportExpensesToCSV(expenses: ExpenseRecord[]) {
  const headers = ['ID', 'Waktu', 'Tanggal', 'Kategori', 'Deskripsi', 'Nominal', 'Kasir'];
  const rows = expenses.map((e) => [
    e.id,
    e.waktu,
    e.tanggal,
    `"${e.kategori}"`,
    `"${e.deskripsi}"`,
    e.nominal,
    `"${e.kasirName}"`
  ]);

  const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  downloadCSV(csvContent, `Laporan_Pengeluaran_${new Date().toISOString().split('T')[0]}.csv`);
}

export function exportDebtsToCSV(debts: DebtRecord[]) {
  const headers = ['ID', 'No Struk', 'Pelanggan', 'No HP', 'Tanggal', 'Jatuh Tempo', 'Total Hutang', 'Dibayar', 'Sisa', 'Status'];
  const rows = debts.map((d) => [
    d.id,
    d.nomorStruk,
    `"${d.namaPelanggan}"`,
    d.noHpPelanggan || '',
    d.tanggalTransaksi,
    d.jatuhTempo,
    d.totalHutang,
    d.totalDibayar,
    d.sisaHutang,
    d.status
  ]);

  const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  downloadCSV(csvContent, `Laporan_Hutang_${new Date().toISOString().split('T')[0]}.csv`);
}

export function exportBarangToCSV(barangList: MasterBarang[]) {
  const headers = ['ID', 'Nama Barang', 'Kategori', 'Satuan', 'Stok', 'Stok Minimum', 'Harga Modal', 'Harga Jual'];
  const rows = barangList.map((b) => [
    b.id,
    `"${b.nama}"`,
    `"${b.kategori}"`,
    b.satuan,
    b.stok,
    b.stokMinimum,
    b.hargaModal,
    b.hargaJual
  ]);

  const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  downloadCSV(csvContent, `Master_Barang_${new Date().toISOString().split('T')[0]}.csv`);
}

function downloadCSV(csv: string, filename: string) {
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
