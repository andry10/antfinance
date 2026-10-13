import {
  Transaction,
  ExpenseRecord,
  DebtRecord,
  MasterPPOBRange,
  MasterPPOBLain,
  MasterBarang,
  MasterBBM,
  MasterPSUnit,
  PSRentalSession
} from '../types';

export interface SyncResult {
  success: boolean;
  spreadsheetId?: string;
  spreadsheetUrl?: string;
  message: string;
}

const REQUIRED_SHEET_TITLES = [
  'TRANSAKSI',
  'PENGELUARAN',
  'HUTANG_PELANGGAN',
  'MASTER_PPOB_RANGE',
  'MASTER_PPOB_LAIN',
  'MASTER_BARANG',
  'MASTER_BBM',
  'RENTAL_PS',
  'RINGKASAN_KAS'
];

/**
 * Creates a new Google Spreadsheet with all required sheets and header rows
 */
export async function createStoreSpreadsheet(
  accessToken: string,
  title: string = 'POS_Usaha_Terpadu_Database'
): Promise<{ spreadsheetId: string; spreadsheetUrl: string }> {
  const requestBody = {
    properties: {
      title
    },
    sheets: REQUIRED_SHEET_TITLES.map((sheetTitle) => ({
      properties: {
        title: sheetTitle,
        gridProperties: {
          frozenRowCount: 1
        }
      }
    }))
  };

  const res = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(requestBody)
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData?.error?.message || `Gagal membuat spreadsheet: ${res.statusText}`);
  }

  const data = await res.json();
  const spreadsheetId = data.spreadsheetId;
  const spreadsheetUrl = data.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;

  // Initialize Header Rows for each sheet
  await initializeSheetHeaders(accessToken, spreadsheetId);

  return { spreadsheetId, spreadsheetUrl };
}

/**
 * Ensures header rows exist on each sheet tab
 */
export async function initializeSheetHeaders(accessToken: string, spreadsheetId: string) {
  const headerData = [
    {
      range: 'TRANSAKSI!A1:K1',
      values: [[
        'ID Transaksi', 'No Struk', 'Waktu', 'Tanggal', 'Kategori',
        'Rincian Item', 'Total Modal', 'Total Jual', 'Total Laba',
        'Metode Bayar', 'Status Bayar', 'Kasir'
      ]]
    },
    {
      range: 'PENGELUARAN!A1:G1',
      values: [[
        'ID Pengeluaran', 'Waktu', 'Tanggal', 'Kategori Beban',
        'Deskripsi', 'Nominal (Rp)', 'Kasir / Pencatat'
      ]]
    },
    {
      range: 'HUTANG_PELANGGAN!A1:J1',
      values: [[
        'ID Hutang', 'No Struk', 'Nama Pelanggan', 'No HP',
        'Tgl Transaksi', 'Jatuh Tempo', 'Total Hutang',
        'Total Dibayar', 'Sisa Hutang', 'Status'
      ]]
    },
    {
      range: 'MASTER_PPOB_RANGE!A1:E1',
      values: [[
        'ID', 'Nama Layanan', 'Nominal Minimum', 'Nominal Maximum', 'Biaya Admin'
      ]]
    },
    {
      range: 'MASTER_PPOB_LAIN!A1:E1',
      values: [[
        'ID', 'Nama Layanan', 'Kategori', 'Harga Modal', 'Harga Jual'
      ]]
    },
    {
      range: 'MASTER_BARANG!A1:G1',
      values: [[
        'ID', 'Nama Barang', 'Satuan', 'Stok Saat Ini',
        'Stok Minimum', 'Harga Modal', 'Harga Jual'
      ]]
    },
    {
      range: 'MASTER_BBM!A1:D1',
      values: [[
        'ID', 'Jenis BBM', 'Harga Per Liter', 'Stok Liter Tersedia'
      ]]
    },
    {
      range: 'RENTAL_PS!A1:H1',
      values: [[
        'ID Rental', 'Unit PS', 'Nama Pelanggan', 'Waktu Mulai',
        'Durasi (Menit)', 'Biaya Rental', 'F&B Tambahan', 'Total Biaya'
      ]]
    }
  ];

  await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchUpdate`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      valueInputOption: 'USER_ENTERED',
      data: headerData
    })
  });
}

/**
 * Sync entire application database to Google Sheet
 */
export async function syncAllToGoogleSheet(
  accessToken: string,
  spreadsheetId: string,
  payload: {
    transaksi: Transaction[];
    pengeluaran: ExpenseRecord[];
    hutang: DebtRecord[];
    ppobRange: MasterPPOBRange[];
    ppobLain: MasterPPOBLain[];
    barang: MasterBarang[];
    bbm: MasterBBM[];
    rentalPS: PSRentalSession[];
  }
): Promise<SyncResult> {
  try {
    // 1. Map Transaksi
    const transaksiRows = payload.transaksi.map((t) => [
      t.id,
      t.nomorStruk,
      t.waktu,
      t.tanggal,
      t.kategoriUtama,
      t.items.map((it) => `${it.nama} (${it.qty}${it.satuan || ''})`).join('; '),
      t.totalModal,
      t.totalJual,
      t.totalLaba,
      t.metodePembayaran,
      t.statusPembayaran,
      t.kasirName
    ]);

    // 2. Map Pengeluaran
    const pengeluaranRows = payload.pengeluaran.map((p) => [
      p.id,
      p.waktu,
      p.tanggal,
      p.kategori,
      p.deskripsi,
      p.nominal,
      p.kasirName
    ]);

    // 3. Map Hutang
    const hutangRows = payload.hutang.map((h) => [
      h.id,
      h.nomorStruk,
      h.namaPelanggan,
      h.noHpPelanggan,
      h.tanggalTransaksi,
      h.jatuhTempo,
      h.totalHutang,
      h.totalDibayar,
      h.sisaHutang,
      h.status
    ]);

    // 4. Map PPOB Range
    const ppobRangeRows = payload.ppobRange.map((r) => [
      r.id,
      r.namaLayanan,
      r.minNominal,
      r.maxNominal,
      r.biayaAdmin
    ]);

    // 5. Map PPOB Lain
    const ppobLainRows = payload.ppobLain.map((l) => [
      l.id,
      l.namaLayanan,
      l.kategori,
      l.hargaModal,
      l.hargaJual
    ]);

    // 6. Map Barang
    const barangRows = payload.barang.map((b) => [
      b.id,
      b.nama,
      b.satuan,
      b.stok,
      b.stokMinimum,
      b.hargaModal,
      b.hargaJual
    ]);

    // 7. Map BBM
    const bbmRows = payload.bbm.map((bm) => [
      bm.id,
      bm.jenisBBM,
      bm.hargaPerLiter,
      bm.stokLiter
    ]);

    // 8. Map Rental PS
    const rentalRows = payload.rentalPS.map((r) => [
      r.id,
      r.namaUnit,
      r.namaPelanggan,
      r.waktuMulai,
      r.durasiMenitTerhitung,
      r.biayaRental,
      r.tambahanItem.map((it) => `${it.nama} (${it.qty})`).join(', ') || '-',
      r.totalBiaya
    ]);

    // Ensure headers exist
    await initializeSheetHeaders(accessToken, spreadsheetId);

    // Overwrite content starting from row 2 (preserve row 1 header)
    const batchData = [
      {
        range: `TRANSAKSI!A2:L${Math.max(2, transaksiRows.length + 1)}`,
        values: transaksiRows.length > 0 ? transaksiRows : [['', '', '', '', '', '', '', '', '', '', '', '']]
      },
      {
        range: `PENGELUARAN!A2:G${Math.max(2, pengeluaranRows.length + 1)}`,
        values: pengeluaranRows.length > 0 ? pengeluaranRows : [['', '', '', '', '', '', '']]
      },
      {
        range: `HUTANG_PELANGGAN!A2:J${Math.max(2, hutangRows.length + 1)}`,
        values: hutangRows.length > 0 ? hutangRows : [['', '', '', '', '', '', '', '', '', '']]
      },
      {
        range: `MASTER_PPOB_RANGE!A2:E${Math.max(2, ppobRangeRows.length + 1)}`,
        values: ppobRangeRows.length > 0 ? ppobRangeRows : [['', '', '', '', '']]
      },
      {
        range: `MASTER_PPOB_LAIN!A2:E${Math.max(2, ppobLainRows.length + 1)}`,
        values: ppobLainRows.length > 0 ? ppobLainRows : [['', '', '', '', '']]
      },
      {
        range: `MASTER_BARANG!A2:G${Math.max(2, barangRows.length + 1)}`,
        values: barangRows.length > 0 ? barangRows : [['', '', '', '', '', '', '']]
      },
      {
        range: `MASTER_BBM!A2:D${Math.max(2, bbmRows.length + 1)}`,
        values: bbmRows.length > 0 ? bbmRows : [['', '', '', '']]
      },
      {
        range: `RENTAL_PS!A2:H${Math.max(2, rentalRows.length + 1)}`,
        values: rentalRows.length > 0 ? rentalRows : [['', '', '', '', '', '', '', '']]
      }
    ];

    const res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchUpdate`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        valueInputOption: 'USER_ENTERED',
        data: batchData
      })
    });

    if (!res.ok) {
      const errorJson = await res.json().catch(() => ({}));
      throw new Error(errorJson?.error?.message || `Gagal sinkron: ${res.statusText}`);
    }

    return {
      success: true,
      spreadsheetId,
      spreadsheetUrl: `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`,
      message: 'Berhasil sinkronisasi seluruh data ke Google Spreadsheet!'
    };
  } catch (error: any) {
    console.error('Error syncing to Google Sheet:', error);
    return {
      success: false,
      message: error?.message || 'Terjadi kesalahan saat menyinkronkan data ke Google Sheet.'
    };
  }
}
