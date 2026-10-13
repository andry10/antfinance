# Sistem Kasir & Manajemen Usaha Terpadu (PPOB Range, Toko/Barang, BBM, Rental PS, Hutang & Pengeluaran)

Aplikasi kasir dan pembukuan komprehensif yang dirancang adaptif untuk smartphone (mobile touch-first dengan bottom navigation & floating action button) serta desktop dashboard leluasa, tersimpan lokal (*instant offline-ready*) dan tersinkronisasi otomatis dengan Google Spreadsheet di Google Drive pengguna.

---

### User Review & Critical Decisions

> [!IMPORTANT]
> **Pembaruan Spesifikasi Sesuai Permintaan Pengguna:**
> 1. **7 KPI Utama di Dashboard**:
>    - **Omset Hari Ini**: Total penerimaan bruto penjualan.
>    - **Laba Kotor**: Total omset dikurangi harga modal (COGS) barang & PPOB.
>    - **Laba Bersih**: Laba kotor dikurangi total pengeluaran operasional hari ini.
>    - **Jumlah Transaksi**: Total struk/transaksi yang terjadi hari ini.
>    - **Jumlah Hutang Pelanggan**: Total nominal piutang kasbon pelanggan yang belum lunas.
>    - **Stok Menipis**: Jumlah jenis barang yang stoknya $\le$ stok minimum.
>    - **Stok BBM**: Sisa volume liter BBM aktif di tangki/dispenser.
>
> 2. **3 Blok Sekunder di Bawah KPI Dashboard**:
>    - **Riwayat Transaksi Terbaru**: Dibatasi 5 data terakhir + tombol interaktif *"Lihat Selengkapnya"* (beralih ke tab Transaksi).
>    - **Daftar Stok Menipis**: Menampilkan barang-barang yang mendekati habis + tombol *"Lihat Selengkapnya"* (beralih ke Master Barang).
>    - **Daftar Hutang Pelanggan**: Menampilkan daftar kasbon pelanggan + tombol *"Lihat Selengkapnya"* (beralih ke modul Kelola Hutang/Pelunasan).
>
> 3. **Filter Tanggal Transaksi**:
>    - Menggunakan *Date Range Picker* (Tanggal Mulai s/d Tanggal Selesai).
>    - *Default* otomatis mengikuti tanggal hari ini (`today`), dengan preset cepat (Hari Ini, Kemarin, 7 Hari Terakhir, Bulan Ini).
>
> 4. **Master Data & Mekanisme Otomatis Transaksi**:
>    - **PPOB Range**: Memiliki data `Nama Layanan` (DANA, Gopay, OVO, ShopeePay, Transfer Bank, dll.), `Nominal Minimum`, `Nominal Maximum`, dan `Admin`. Pada saat kasir mengetik nominal di transaksi (misal: DANA 100.000), sistem otomatis mencocokkan range (10.000 – 100.000) dan langsung memetakan biaya admin (2.000) serta harga modal/jual secara instan tanpa input manual.
>    - **PPOB Lainnya**: Untuk Pulsa, Paket Data, Top Up Game (Free Fire, Mobile Legends, dll.), dan Token PLN. Struktur master: `Nama Layanan`, `Harga Modal`, `Harga Jual`. Saat nama layanan diketik/dipilih di transaksi, langsung otomatis memetakan modal & harga jual.
>    - **Master Barang**: Struktur master: `Nama Barang`, `Satuan` (pcs, pack, botol, dll.), `Stok Saat Ini`, `Stok Minimum`, `Harga Modal`, `Harga Jual`. Saat diketik di transaksi, autocomplete langsung memetakan harga dan otomatis memotong stok saat disimpan.
>    - **Master BBM**: Jenis BBM (Pertalite, Pertamax, Solar, dll.), Harga/Liter, dan Sisa Stok Liter (dengan kalkulator otomatis Rupiah $\leftrightarrow$ Liter).
>    - **Master PlayStation**: Unit (PS3, PS4, PS5), Tarif/Jam, status aktif/kosong, dan billing stopwatch live.
>    - **Hutang Pelanggan**: Opsi status pembayaran Transaksi: Lunas (Tunai/QRIS/Transfer) atau Hutang (mencatat Nama Pelanggan, Jatuh Tempo, Riwayat Pembayaran/Cicilan).

---

### 1. Overview & Core Concept

- **Apa yang Dibuat**: Sistem POS & Ledger terpadu untuk pelaku usaha serbaguna (Konter Pulsa/PPOB/Top Up Game + Penjualan Barang Toko/Minuman + Pertamini/BBM Eceran + Rental PS + Kasbon Pelanggan + Pengeluaran).
- **Target Pengguna**: Pemilik toko & kasir dengan mobilitas tinggi yang membutuhkan entri cepat lewat HP di genggaman, serta pengawasan visual di laptop/desktop.
- **Nilai Utama**: Menghitung laba kotor & laba bersih secara riil dan instan, mencegah lupa mencatat hutang pelanggan, mengotomatisasi hitungan admin transfer/PPOB range, dan menyimpan seluruh rekapitulasi ke Google Spreadsheet pribadi pemilik toko.

---

### 2. User Experience & Visual Design

#### A. Desain Responsif & Tata Letak
- **Tampilan HP (Mobile Touch-First)**:
  - Header ramping ($52\text{px}$) dengan profil kasir, indikator koneksi Google Sheet, dan toggle tema/refresh.
  - Grid 2-kolom ringkas untuk 7 KPI utama (menggunakan tipografi tabular-nums besar yang mudah dipindai).
  - Tiga panel data berurutan:
    1. 5 Transaksi Terbaru $\to$ tombol "Lihat Selengkapnya".
    2. Barang Stok Menipis $\to$ tombol "Lihat Selengkapnya".
    3. Daftar Hutang Pelanggan $\to$ tombol "Lihat Selengkapnya".
  - Floating Action Button (FAB) `+` berukuran $56\text{px}$ di sudut kanan bawah dengan dialog modal cepat untuk membuat transaksi baru (PPOB Range, PPOB Lainnya, Barang, BBM, Rental PS, atau Pengeluaran).
  - Bottom Bar navigasi jempol ($60\text{px}$): **Dashboard**, **Transaksi**, **Rental PS**, **Hutang**, **Master & Lainnya**.
- **Tampilan Desktop (1024px–1440px)**:
  - Sidebar vertikal kiri ($260\text{px}$) dengan navigasi terstruktur.
  - Top Breadcrumb Bar dengan pencarian global dan tombol cepat Tambah Transaksi.
  - Dashboard multi-kolom: Baris atas menampilkan strip 7 kartu KPI, diikuti split-view 2-kolom untuk riwayat transaksi live, monitor stasiun PlayStation, dan alert stok & hutang.

#### B. Identitas Visual & Tema
- **Arah Desain**: *Clean Commercial POS*. Didesain bebas dari ornamen berlebihan (*anti-slop*), kontras tinggi untuk pemakaian di bawah terik matahari atau dalam ruangan.
- **Palet Warna**:
  - *Canvas (60%)*: Bersih Slate 50 (`#F8FAFC`) di mode terang, Deep Slate 900 (`#0F172A`) di mode gelap.
  - *Struktur & Card (30%)*: Card putih bersih dengan border halus 1px slate-200.
  - *Aksen Fungsional (10%)*:
    - Emerald (`#059669`) untuk Omzet, Laba, dan status Lunas.
    - Amber/Orange (`#D97706`) untuk Stok Menipis dan BBM.
    - Rose/Red (`#E11D48`) untuk Hutang Pelanggan dan Pengeluaran.
    - Indigo/Blue (`#4F46E5`) untuk PPOB dan Rental PlayStation.
- **Tipografi**:
  - Headings & Labels: `Plus Jakarta Sans`.
  - Nilai Rupiah, Volume Liter, Durasi Rental & Nomor HP: Monospace tabular (`font-mono tabular-nums`).

---

### 3. Key Product Decisions & Trade-Offs

- **Logika Otomatisasi PPOB Range**:
  - *Aturan*: Menggunakan pencocokan interval $[minNominal \le inputNominal \le maxNominal]$.
  - *Contoh*: Jika di Master Data terdapat aturan:
    - DANA Rp 10.000 – Rp 100.000: Admin Rp 2.000
    - DANA Rp 100.001 – Rp 500.000: Admin Rp 3.500
    - DANA Rp 500.001 – Rp 1.000.000: Admin Rp 5.000
  - Saat kasir memilih layanan "DANA" dan mengetik "100000", sistem langsung memetakan admin Rp 2.000, menghitung Total Bayar Rp 102.000, Modal Rp 100.000, dan Laba Kotor Rp 2.000.
- **Pencarian Cepat Autocomplete di Transaksi**:
  - Kasir cukup mengetik beberapa huruf dari nama layanan (misal "FF" atau "Pulsa Telkomsel" atau "Indomie"), sistem menampilkan saran instan; saat diklik langsung mengisi nama, harga modal, harga jual, dan stok otomatis.
- **Kalkulasi Laba Bersih yang Presisi**:
  - $\text{Laba Kotor} = \sum (\text{Harga Jual} - \text{Harga Modal}) \text{ untuk semua barang/PPOB/BBM} + \text{Pendapatan Rental PS}$.
  - $\text{Laba Bersih} = \text{Laba Kotor} - \sum \text{Pengeluaran Operasional Hari Ini}$.
- **Penyimpanan Ganda & Google Sheets Sync**:
  - *Local Persistence*: Menggunakan IndexedDB / LocalStorage reaktif untuk performa tanpa jeda (kasir tidak boleh macet saat melayani pembeli).
  - *Google Sheets Integration*: Tersinkronisasi ke Google Drive melalui Google OAuth / Google Sheets API. Tab terpisah yang rapi: `TRANSAKSI`, `PENGELUARAN`, `HUTANG_PELANGGAN`, `MASTER_PPOB_RANGE`, `MASTER_PPOB_LAIN`, `MASTER_BARANG`, `MASTER_BBM`, `RENTAL_PS`.

---

### 4. Technical Architecture & Component Mapping

```
┌────────────────────────────────────────────────────────────────────────┐
│                          APLIKASI KASIR WEB                            │
│                                                                        │
│  ┌──────────────────────────────┐    ┌──────────────────────────────┐  │
│  │    Mobile Layout (<768px)    │    │   Desktop Layout (>=768px)   │  │
│  │  • Top Compact Status Bar    │    │  • Collapsible Left Sidebar  │  │
│  │  • Bottom Tab Bar (5 Tabs)   │    │  • Multi-column Desktop Grid │  │
│  │  • Bottom Sheet Modal & FAB  │    │  • Top Breadcrumb / Action   │  │
│  └──────────────┬───────────────┘    └──────────────┬───────────────┘  │
└─────────────────┼───────────────────────────────────┼──────────────────┘
                  ▼                                   ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        MODUL-MODUL APLIKASI                            │
│                                                                        │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ 1. DASHBOARD UTAMA                                               │  │
│  │    • 7 KPI: Omset, Laba Kotor, Laba Bersih, Transaksi, Hutang,   │  │
│  │      Stok Menipis, Stok BBM                                      │  │
│  │    • 5 Riwayat Transaksi Terbaru + [Lihat Selengkapnya]          │  │
│  │    • List Stok Menipis + [Lihat Selengkapnya]                    │  │
│  │    • List Hutang Pelanggan + [Lihat Selengkapnya]                │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                        │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ 2. TRANSAKSI (POS & KASIR)                                       │  │
│  │    • Filter Date Range Picker (Default: Hari Ini / Today)        │  │
│  │    • Modal Tambah Cepat:                                         │  │
│  │      - Tab PPOB Range (Auto Match Admin by Nominal)              │  │
│  │      - Tab PPOB Lainnya (Pulsa, Topup FF, dll. Auto Map Modal/Jual)││
│  │      - Tab Barang (Auto Search, Auto Map, Auto Kurang Stok)      │  │
│  │      - Tab BBM (Kalkulator Rupiah <-> Liter)                     │  │
│  │      - Opsi Pembayaran: Lunas (Tunai/QRIS/Trf) vs Hutang         │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                        │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ 3. MASTER DATA                                                   │  │
│  │    • PPOB Range: Nama, Min, Max, Admin                           │  │
│  │    • PPOB Lainnya: Nama, Modal, Jual                             │  │
│  │    • Barang: Nama, Satuan, Stok, Stok Min, Modal, Jual           │  │
│  │    • BBM: Jenis, Harga/Liter, Stok Tangki                        │  │
│  │    • Rental PS: Unit, Tarif/Jam, Status                          │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                        │
│  ┌──────────────────────┐ ┌────────────────────┐ ┌──────────────────┐  │
│  │ 4. RENTAL PS BILLING │ │ 5. KELOLA HUTANG   │ │ 6. PENGELUARAN   │  │
│  │    • Live Stopwatch  │ │    • Pelunasan/Bayar│ │    • Catat Beban │  │
│  │    • Open/Paket Jam  │ │    • Jatuh Tempo   │ │    • Operasional │  │
│  └──────────────────────┘ └────────────────────┘ └──────────────────┘  │
│                                                                        │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ 7. PROFIL, KELOLA USER & GOOGLE SHEETS SYNC                      │  │
│  │    • Login Google OAuth / Manual User (Owner vs Kasir)           │  │
│  │    • Kelola Akun Karyawan/Kasir                                  │  │
│  │    • Status & Tombol Sinkronisasi Google Spreadsheet             │  │
│  └──────────────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────────┘
```

---

### Verification Plan

1. **Uji 7 Metrik KPI Dashboard**:
   - Menghitung kebenaran Omset, Laba Kotor (Omset - Modal), Laba Bersih (Laba Kotor - Pengeluaran), Jumlah Transaksi, Total Hutang, Jumlah Stok Menipis, dan Sisa Stok BBM.
2. **Uji 3 Blok Sekunder & "Lihat Selengkapnya"**:
   - Memastikan hanya 5 transaksi terbaru yang tampil di dashboard, dan tombol "Lihat Selengkapnya" mengarahkan ke tab Transaksi.
   - Memastikan stok menipis dan hutang pelanggan memiliki tombol navigasi ke modul masing-masing.
3. **Uji Filter Tanggal Transaksi**:
   - Filter default langsung aktif untuk transaksi hari ini.
   - Menguji pengubahan rentang tanggal (kemarin, 7 hari lalu, rentang kustom) dan memverifikasi data transaksi terfilter dengan akurat.
4. **Uji Auto-Mapping PPOB Range**:
   - Membuat aturan di Master Data: DANA 10.000–100.000 admin 2.000, 100.001–200.000 admin 3.000.
   - Input nominal 100.000 di transaksi $\to$ memverifikasi admin 2.000 terpilih otomatis. Input 150.000 $\to$ memverifikasi admin 3.000 terpilih otomatis.
5. **Uji Auto-Mapping PPOB Lainnya & Barang**:
   - Memilih "Top Up FF 140 Diamond" $\to$ otomatis memetakan modal & harga jual.
   - Mengetik "Indomie Goreng" $\to$ otomatis memetakan harga modal, harga jual, dan stok berkurang setelah disimpan.
6. **Uji Transaksi Hutang & Pelunasan**:
   - Membuat transaksi dengan status Hutang $\to$ memverifikasi bertambahnya KPI Hutang Pelanggan di dashboard $\to$ melakukan pelunasan hutang.
7. **Uji Sinkronisasi Google Sheets & Login Ganda**:
   - Menguji koneksi Google Drive / Sheets dan verifikasi struktur tab spreadsheet.
   - Menguji login manual dan login akun Google.
