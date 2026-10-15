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
  isTokenExpired?: boolean;
}

export interface PullResult {
  success: boolean;
  message: string;
  isTokenExpired?: boolean;
  data?: {
    transaksi: Transaction[];
    pengeluaran: ExpenseRecord[];
    hutang: DebtRecord[];
    barang: MasterBarang[];
    bbm: MasterBBM[];
    ppobRange: MasterPPOBRange[];
    ppobLain: MasterPPOBLain[];
  };
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
    if (res.status === 401) {
      throw new Error('AUTH_EXPIRED: Sesi otorisasi Google kedaluwarsa. Silakan hubungkan ulang akun Google.');
    }
    throw new Error(errorData?.error?.message || `Gagal membuat spreadsheet: ${res.statusText}`);
  }

  const data = await res.json();
  const spreadsheetId = data.spreadsheetId;
  const spreadsheetUrl = data.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;

  // Initialize Header Rows for each sheet
  await ensureSheetTabsAndHeaders(accessToken, spreadsheetId);

  return { spreadsheetId, spreadsheetUrl };
}

/**
 * Ensures all required sheets exist in an existing spreadsheet and has headers.
 * If sheets are missing (e.g. user linked an existing or blank spreadsheet), creates them.
 */
export async function ensureSheetTabsAndHeaders(accessToken: string, spreadsheetId: string): Promise<void> {
  // 1. Get existing sheet metadata
  const metaRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?fields=sheets.properties.title`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    }
  );

  if (!metaRes.ok) {
    if (metaRes.status === 401) {
      throw new Error('AUTH_EXPIRED: Sesi login Google telah kedaluwarsa.');
    }
    const err = await metaRes.json().catch(() => ({}));
    throw new Error(err?.error?.message || 'Gagal membaca metadata spreadsheet Google.');
  }

  const metaData = await metaRes.json();
  const existingTitles = new Set(
    (metaData.sheets || []).map((s: any) => s.properties?.title)
  );

  // 2. Identify missing sheet tabs
  const missingTitles = REQUIRED_SHEET_TITLES.filter((title) => !existingTitles.has(title));

  if (missingTitles.length > 0) {
    const addSheetRequests = missingTitles.map((title) => ({
      addSheet: {
        properties: {
          title,
          gridProperties: {
            frozenRowCount: 1
          }
        }
      }
    }));

    const addRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        requests: addSheetRequests
      })
    });

    if (!addRes.ok) {
      console.warn('Gagal menambahkan beberapa sheet baru, melanjutkan dengan sheet yang tersedia...');
    }
  }

  // 3. Write / update standard headers
  const headerData = [
    {
      range: 'TRANSAKSI!A1:M1',
      values: [[
        'ID Transaksi', 'No Struk', 'Waktu', 'Tanggal', 'Kategori',
        'Rincian Item', 'Total Modal', 'Total Jual', 'Total Laba',
        'Metode Bayar', 'Status Bayar', 'Kasir', 'Data Detail'
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
      range: 'HUTANG_PELANGGAN!A1:K1',
      values: [[
        'ID Hutang', 'No Struk', 'Nama Pelanggan', 'No HP',
        'Tgl Transaksi', 'Jatuh Tempo', 'Total Hutang',
        'Total Dibayar', 'Sisa Hutang', 'Status', 'Riwayat Pembayaran'
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
      range: 'MASTER_BBM!A1:E1',
      values: [[
        'ID', 'Jenis BBM', 'Harga Beli Per Liter', 'Harga Jual Per Liter', 'Stok Liter Tersedia'
      ]]
    },
    {
      range: 'RENTAL_PS!A1:H1',
      values: [[
        'ID Rental', 'Unit PS', 'Nama Pelanggan', 'Waktu Mulai',
        'Durasi (Menit)', 'Biaya Rental', 'F&B Tambahan', 'Total Biaya'
      ]]
    },
    {
      range: 'RINGKASAN_KAS!A1:D1',
      values: [[
        'Tanggal Pembaruan', 'Total Omset', 'Total Beban Pengeluaran', 'Estimasi Saldo Kas Bersih'
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
 * Backward compatibility alias
 */
export const initializeSheetHeaders = ensureSheetTabsAndHeaders;

// In-memory cache of verified spreadsheets to prevent redundant API calls on every rapid sync
const verifiedSpreadsheets = new Set<string>();

export function markSpreadsheetUnverified(spreadsheetId?: string) {
  if (spreadsheetId) {
    verifiedSpreadsheets.delete(spreadsheetId);
  } else {
    verifiedSpreadsheets.clear();
  }
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
    // 1. Ensure tabs & headers exist once per spreadsheet session
    if (!verifiedSpreadsheets.has(spreadsheetId)) {
      await ensureSheetTabsAndHeaders(accessToken, spreadsheetId);
      verifiedSpreadsheets.add(spreadsheetId);
    }

    // 2. Map Transaksi
    const transaksiRows = payload.transaksi.map((t) => [
      t.id || '',
      t.nomorStruk || '',
      t.waktu || '',
      t.tanggal || '',
      t.kategoriUtama || '',
      (t.items || []).map((it) => `${it.nama} (${it.qty}${it.satuan || ''})`).join('; '),
      t.totalModal || 0,
      t.totalJual || 0,
      t.totalLaba || 0,
      t.metodePembayaran || 'Tunai',
      t.statusPembayaran || 'lunas',
      t.kasirName || '',
      JSON.stringify({
        items: t.items,
        namaPelanggan: t.namaPelanggan,
        noHpPelanggan: t.noHpPelanggan,
        catatan: t.catatan,
        jumlahBayar: t.jumlahBayar,
        sisaHutang: t.sisaHutang,
        kasirId: t.kasirId
      })
    ]);

    // 3. Map Pengeluaran
    const pengeluaranRows = payload.pengeluaran.map((p) => [
      p.id || '',
      p.waktu || '',
      p.tanggal || '',
      p.kategori || '',
      p.deskripsi || '',
      p.nominal || 0,
      p.kasirName || ''
    ]);

    // 4. Map Hutang
    const hutangRows = payload.hutang.map((h) => [
      h.id || '',
      h.nomorStruk || '',
      h.namaPelanggan || '',
      h.noHpPelanggan || '',
      h.tanggalTransaksi || '',
      h.jatuhTempo || '',
      h.totalHutang || 0,
      h.totalDibayar || 0,
      h.sisaHutang || 0,
      h.status || 'belum_lunas',
      JSON.stringify(h.riwayatPembayaran || [])
    ]);

    // 5. Map PPOB Range
    const ppobRangeRows = payload.ppobRange.map((r) => [
      r.id || '',
      r.namaLayanan || '',
      r.minNominal || 0,
      r.maxNominal || 0,
      r.biayaAdmin || 0
    ]);

    // 6. Map PPOB Lain
    const ppobLainRows = payload.ppobLain.map((l) => [
      l.id || '',
      l.namaLayanan || '',
      l.kategori || '',
      l.hargaModal || 0,
      l.hargaJual || 0
    ]);

    // 7. Map Barang
    const barangRows = payload.barang.map((b) => [
      b.id || '',
      b.nama || '',
      b.satuan || 'pcs',
      b.stok || 0,
      b.stokMinimum || 0,
      b.hargaModal || 0,
      b.hargaJual || 0
    ]);

    // 8. Map BBM
    const bbmRows = payload.bbm.map((bm) => [
      bm.id || '',
      bm.jenisBBM || '',
      bm.hargaBeli ?? 10000,
      bm.hargaJual ?? bm.hargaPerLiter ?? 12000,
      bm.stokLiter || 0
    ]);

    // 9. Map Rental PS
    const rentalRows = payload.rentalPS.map((r) => [
      r.id || '',
      r.namaUnit || '',
      r.namaPelanggan || '',
      r.waktuMulai || '',
      r.durasiMenitTerhitung || 0,
      r.biayaRental || 0,
      (r.tambahanItem || []).map((it) => `${it.nama} (${it.qty})`).join(', ') || '-',
      r.totalBiaya || 0
    ]);

    // 10. Summary Kas
    const totalOmset = payload.transaksi.reduce((sum, t) => sum + (t.totalJual || 0), 0);
    const totalBeban = payload.pengeluaran.reduce((sum, p) => sum + (p.nominal || 0), 0);
    const ringkasanRows = [
      [
        new Date().toLocaleString('id-ID'),
        totalOmset,
        totalBeban,
        totalOmset - totalBeban
      ]
    ];

    // Clear old data rows first to avoid ghost rows
    await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchClear`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        ranges: [
          'TRANSAKSI!A2:M',
          'PENGELUARAN!A2:G',
          'HUTANG_PELANGGAN!A2:K',
          'MASTER_PPOB_RANGE!A2:E',
          'MASTER_PPOB_LAIN!A2:E',
          'MASTER_BARANG!A2:G',
          'MASTER_BBM!A2:E',
          'RENTAL_PS!A2:H',
          'RINGKASAN_KAS!A2:D'
        ]
      })
    }).catch(() => {});

    // Overwrite content starting from row 2 (preserve row 1 header)
    const batchData = [
      {
        range: `TRANSAKSI!A2:M${Math.max(2, transaksiRows.length + 1)}`,
        values: transaksiRows.length > 0 ? transaksiRows : [['', '', '', '', '', '', '', '', '', '', '', '', '']]
      },
      {
        range: `PENGELUARAN!A2:G${Math.max(2, pengeluaranRows.length + 1)}`,
        values: pengeluaranRows.length > 0 ? pengeluaranRows : [['', '', '', '', '', '', '']]
      },
      {
        range: `HUTANG_PELANGGAN!A2:K${Math.max(2, hutangRows.length + 1)}`,
        values: hutangRows.length > 0 ? hutangRows : [['', '', '', '', '', '', '', '', '', '', '']]
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
        range: `MASTER_BBM!A2:E${Math.max(2, bbmRows.length + 1)}`,
        values: bbmRows.length > 0 ? bbmRows : [['', '', '', '', '']]
      },
      {
        range: `RENTAL_PS!A2:H${Math.max(2, rentalRows.length + 1)}`,
        values: rentalRows.length > 0 ? rentalRows : [['', '', '', '', '', '', '', '']]
      },
      {
        range: `RINGKASAN_KAS!A2:D${Math.max(2, ringkasanRows.length + 1)}`,
        values: ringkasanRows
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
      if (res.status === 401) {
        return {
          success: false,
          isTokenExpired: true,
          message: 'Sesi Google Anda telah berakhir. Silakan klik "Hubungkan Akun Google" kembali.'
        };
      }
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
    const isAuth = error?.message?.includes('AUTH_EXPIRED') || error?.message?.includes('401');
    if (isAuth) {
      console.warn('Google Sheets token expired, awaiting user reconnect.');
    } else {
      console.error('Error syncing to Google Sheet:', error);
    }
    return {
      success: false,
      isTokenExpired: isAuth,
      message: isAuth
        ? 'Sesi Google Anda telah berakhir. Silakan klik tombol "Sambung Ulang Sheet".'
        : (error?.message || 'Terjadi kesalahan saat menyinkronkan data ke Google Sheet.')
    };
  }
}

/**
 * Pull and restore entire store database from an existing Google Sheet
 */
export async function pullAllFromGoogleSheet(
  accessToken: string,
  spreadsheetId: string
): Promise<PullResult> {
  try {
    const ranges = [
      'TRANSAKSI!A2:M',
      'PENGELUARAN!A2:G',
      'HUTANG_PELANGGAN!A2:K',
      'MASTER_PPOB_RANGE!A2:E',
      'MASTER_PPOB_LAIN!A2:E',
      'MASTER_BARANG!A2:G',
      'MASTER_BBM!A2:E'
    ];

    const query = ranges.map((r) => `ranges=${encodeURIComponent(r)}`).join('&');
    const res = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchGet?${query}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      }
    );

    if (!res.ok) {
      if (res.status === 401) {
        return {
          success: false,
          isTokenExpired: true,
          message: 'Sesi Google telah kedaluwarsa. Silakan hubungkan ulang akun Google.'
        };
      }
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.error?.message || `Gagal mengambil data dari Google Sheet: ${res.statusText}`);
    }

    const data = await res.json();
    const valueRanges = data.valueRanges || [];

    // Helper safely get rows
    const getRows = (idx: number): any[][] => {
      return (valueRanges[idx]?.values || []).filter((row: any[]) => row && row.length > 0 && row[0] !== '');
    };

    // 1. TRANSAKSI
    const txRows = getRows(0);
    const transaksi: Transaction[] = txRows.map((r) => {
      let extra: any = {};
      if (r[12]) {
        try {
          extra = JSON.parse(r[12]);
        } catch (e) {}
      }

      return {
        id: String(r[0] || `tx_${Date.now()}`),
        nomorStruk: String(r[1] || ''),
        waktu: String(r[2] || new Date().toISOString()),
        tanggal: String(r[3] || (r[2] ? String(r[2]).split('T')[0] : '')),
        kategoriUtama: (r[4] as any) || 'barang',
        items: (extra.items && Array.isArray(extra.items) && extra.items.length > 0) ? extra.items : [
          {
            id: `it_${String(r[0] || '1')}`,
            nama: String(r[5] || 'Transaksi'),
            kategori: (r[4] as any) || 'barang',
            qty: 1,
            hargaModal: Number(r[6]) || 0,
            hargaJual: Number(r[7]) || 0,
            subtotal: Number(r[7]) || 0,
            laba: (Number(r[7]) || 0) - (Number(r[6]) || 0)
          }
        ],
        totalModal: Number(r[6]) || 0,
        totalJual: Number(r[7]) || 0,
        totalLaba: Number(r[8]) || (Number(r[7]) || 0) - (Number(r[6]) || 0),
        metodePembayaran: (r[9] as any) || 'tunai',
        statusPembayaran: (r[10] as any) || 'lunas',
        kasirName: String(r[11] || 'Kasir'),
        kasirId: extra.kasirId || 'usr_owner',
        namaPelanggan: extra.namaPelanggan || undefined,
        noHpPelanggan: extra.noHpPelanggan || undefined,
        catatan: extra.catatan || undefined,
        jumlahBayar: extra.jumlahBayar !== undefined ? extra.jumlahBayar : undefined,
        sisaHutang: extra.sisaHutang !== undefined ? extra.sisaHutang : undefined
      };
    });

    // 2. PENGELUARAN
    const expRows = getRows(1);
    const pengeluaran: ExpenseRecord[] = expRows.map((r) => ({
      id: String(r[0] || `exp_${Date.now()}`),
      waktu: String(r[1] || new Date().toISOString()),
      tanggal: String(r[2] || (r[1] ? String(r[1]).split('T')[0] : '')),
      kategori: (r[3] as any) || 'Operasional Lainnya',
      deskripsi: String(r[4] || ''),
      nominal: Number(r[5]) || 0,
      kasirName: String(r[6] || 'Kasir'),
      kasirId: 'usr_owner'
    }));

    // 3. HUTANG_PELANGGAN
    const debtRows = getRows(2);
    const hutang: DebtRecord[] = debtRows.map((r) => {
      let riwayat: any[] = [];
      if (r[10]) {
        try {
          riwayat = JSON.parse(r[10]);
        } catch (e) {}
      }
      return {
        id: String(r[0] || `debt_${Date.now()}`),
        transaksiId: String(r[0] || `tx_${Date.now()}`),
        nomorStruk: String(r[1] || ''),
        namaPelanggan: String(r[2] || 'Pelanggan'),
        noHpPelanggan: String(r[3] || ''),
        tanggalTransaksi: String(r[4] || ''),
        jatuhTempo: String(r[5] || ''),
        totalHutang: Number(r[6]) || 0,
        totalDibayar: Number(r[7]) || 0,
        sisaHutang: Number(r[8]) || 0,
        status: (r[9] as any) || 'belum_lunas',
        riwayatPembayaran: riwayat
      };
    });

    // 4. MASTER_PPOB_RANGE
    const ppobRangeRows = getRows(3);
    const ppobRange: MasterPPOBRange[] = ppobRangeRows.map((r) => ({
      id: String(r[0] || `rng_${Date.now()}`),
      namaLayanan: String(r[1] || ''),
      minNominal: Number(r[2]) || 0,
      maxNominal: Number(r[3]) || 0,
      biayaAdmin: Number(r[4]) || 0
    }));

    // 5. MASTER_PPOB_LAIN
    const ppobLainRows = getRows(4);
    const ppobLain: MasterPPOBLain[] = ppobLainRows.map((r) => ({
      id: String(r[0] || `pl_${Date.now()}`),
      namaLayanan: String(r[1] || ''),
      kategori: String(r[2] || 'Pulsa'),
      hargaModal: Number(r[3]) || 0,
      hargaJual: Number(r[4]) || 0
    }));

    // 6. MASTER_BARANG
    const brgRows = getRows(5);
    const barang: MasterBarang[] = brgRows.map((r) => ({
      id: String(r[0] || `brg_${Date.now()}`),
      nama: String(r[1] || ''),
      satuan: String(r[2] || 'pcs'),
      stok: Number(r[3]) || 0,
      stokMinimum: Number(r[4]) || 0,
      hargaModal: Number(r[5]) || 0,
      hargaJual: Number(r[6]) || 0
    }));

    // 7. MASTER_BBM
    const bbmRows = getRows(6);
    const bbm: MasterBBM[] = bbmRows.map((r) => ({
      id: String(r[0] || `bbm_${Date.now()}`),
      jenisBBM: String(r[1] || 'Pertalite'),
      hargaBeli: Number(r[2]) || 10000,
      hargaJual: Number(r[3]) || 12000,
      hargaPerLiter: Number(r[3]) || 12000,
      stokLiter: Number(r[4]) || 0
    }));

    return {
      success: true,
      message: `Berhasil memuat ${transaksi.length} transaksi, ${pengeluaran.length} pengeluaran, ${hutang.length} hutang, dan ${barang.length} produk dari Google Spreadsheet!`,
      data: {
        transaksi,
        pengeluaran,
        hutang,
        barang,
        bbm,
        ppobRange,
        ppobLain
      }
    };
  } catch (error: any) {
    const isAuth = error?.message?.includes('AUTH_EXPIRED') || error?.message?.includes('401');
    if (isAuth) {
      console.warn('Google Sheets token expired while pulling data.');
    } else {
      console.error('Error pulling from Google Sheet:', error);
    }
    return {
      success: false,
      isTokenExpired: isAuth,
      message: isAuth
        ? 'Sesi Google telah kedaluwarsa. Silakan hubungkan ulang akun Google.'
        : (error?.message || 'Gagal memuat data dari Google Spreadsheet.')
    };
  }
}

/**
 * Automatically discovers an existing POS spreadsheet in Google Drive for seamless multi-device sync
 */
export async function findExistingStoreSpreadsheet(
  accessToken: string
): Promise<{ spreadsheetId: string; spreadsheetUrl: string; name: string } | null> {
  try {
    const q = encodeURIComponent("name contains 'POS_' and mimeType='application/vnd.google-apps.spreadsheet' and trashed=false");
    const res = await fetch(
      `https://www.googleapis.com/drive/v3/files?q=${q}&fields=files(id,name,webViewLink)&orderBy=modifiedTime+desc`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      }
    );
    if (!res.ok) return null;
    const data = await res.json();
    if (data.files && data.files.length > 0) {
      const file = data.files[0];
      return {
        spreadsheetId: file.id,
        spreadsheetUrl: file.webViewLink || `https://docs.google.com/spreadsheets/d/${file.id}/edit`,
        name: file.name
      };
    }
  } catch (err) {
    console.warn('Could not query Drive for spreadsheets:', err);
  }
  return null;
}
