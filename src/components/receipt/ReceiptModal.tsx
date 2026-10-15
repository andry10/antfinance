import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { formatRupiah, formatDateTime } from '../../utils/format';
import { Transaction } from '../../types';
import {
  X,
  Printer,
  Bluetooth,
  BluetoothConnected,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Settings,
  ChevronDown,
  ChevronUp,
  FileText
} from 'lucide-react';
import {
  isBluetoothSupported,
  getConnectedPrinterName,
  connectBluetoothPrinter,
  disconnectBluetoothPrinter,
  printReceiptBluetooth,
  testPrintBluetooth
} from '../../services/bluetoothPrinter';

interface ReceiptModalProps {
  transaction: Transaction | null;
  onClose: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({ transaction, onClose }) => {
  const { settings } = useApp();

  const [printerName, setPrinterName] = useState<string | null>(getConnectedPrinterName());
  const [savedDeviceName, setSavedDeviceName] = useState<string | null>(
    typeof window !== 'undefined' ? localStorage.getItem('pos_bt_printer_name') : null
  );
  const [showBtSettings, setShowBtSettings] = useState(false);
  const [isPrintingBt, setIsPrintingBt] = useState(false);
  const [isConnectingBt, setIsConnectingBt] = useState(false);
  const [isTestingBt, setIsTestingBt] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);

  const hasBtSupport = isBluetoothSupported();

  useEffect(() => {
    // Refresh connected printer name
    const activeName = getConnectedPrinterName();
    if (activeName) {
      setPrinterName(activeName);
    }
  }, []);

  if (!transaction) return null;

  // Handle direct Bluetooth Thermal 58mm Printing
  const handlePrintBluetooth = async () => {
    setIsPrintingBt(true);
    setStatusMessage({ text: 'Sedang menghubungkan & mencetak ke Bluetooth 58mm...', type: 'info' });

    try {
      const result = await printReceiptBluetooth(transaction, settings);
      if (result.success) {
        const activeName = getConnectedPrinterName() || savedDeviceName || 'Printer Bluetooth';
        setPrinterName(activeName);
        setSavedDeviceName(activeName);
        setStatusMessage({
          text: `Struk berhasil dicetak ke ${activeName} (58mm)!`,
          type: 'success'
        });
        setTimeout(() => setStatusMessage(null), 4000);
      } else {
        setStatusMessage({
          text: result.error || 'Gagal mencetak ke printer Bluetooth.',
          type: 'error'
        });
      }
    } catch (err: any) {
      setStatusMessage({
        text: err.message || 'Terjadi kesalahan saat mencetak ke Bluetooth.',
        type: 'error'
      });
    } finally {
      setIsPrintingBt(false);
    }
  };

  // Handle manual Bluetooth pairing
  const handleConnectPrinter = async () => {
    setIsConnectingBt(true);
    setStatusMessage({ text: 'Membuka dialog pencarian printer Bluetooth...', type: 'info' });

    try {
      const result = await connectBluetoothPrinter();
      if (result.success && result.deviceName) {
        setPrinterName(result.deviceName);
        setSavedDeviceName(result.deviceName);
        setStatusMessage({
          text: `Berhasil tersambung ke ${result.deviceName}!`,
          type: 'success'
        });
        setTimeout(() => setStatusMessage(null), 3000);
      } else {
        setStatusMessage({
          text: result.error || 'Koneksi Bluetooth dibatalkan.',
          type: 'error'
        });
      }
    } finally {
      setIsConnectingBt(false);
    }
  };

  // Test Print Bluetooth
  const handleTestPrint = async () => {
    setIsTestingBt(true);
    setStatusMessage({ text: 'Mengirim perintah uji cetak...', type: 'info' });

    try {
      const result = await testPrintBluetooth(settings);
      if (result.success) {
        const activeName = getConnectedPrinterName() || 'Printer Bluetooth';
        setPrinterName(activeName);
        setStatusMessage({
          text: `Uji cetak berhasil ke ${activeName}! Kertas 58mm berfungsi normal.`,
          type: 'success'
        });
      } else {
        setStatusMessage({
          text: result.error || 'Gagal mengirim uji cetak ke Bluetooth.',
          type: 'error'
        });
      }
    } finally {
      setIsTestingBt(false);
    }
  };

  // Disconnect Bluetooth
  const handleDisconnect = async () => {
    await disconnectBluetoothPrinter();
    setPrinterName(null);
    setStatusMessage({ text: 'Koneksi Bluetooth diputuskan.', type: 'info' });
    setTimeout(() => setStatusMessage(null), 2500);
  };

  // Fallback: Browser Print formatted specifically for 58mm thermal paper roll
  const handlePrintBrowser58mm = () => {
    // Add dynamic page style for 58mm
    const styleEl = document.createElement('style');
    styleEl.id = 'print-58mm-dynamic-style';
    styleEl.innerHTML = `@page { size: 58mm auto; margin: 1mm 1.5mm; }`;
    document.head.appendChild(styleEl);

    document.body.classList.add('print-receipt-58mm');
    document.body.classList.remove('print-report-a4');

    const cleanUp = () => {
      document.body.classList.remove('print-receipt-58mm');
      const el = document.getElementById('print-58mm-dynamic-style');
      if (el) el.remove();
      window.removeEventListener('afterprint', cleanUp);
    };

    window.addEventListener('afterprint', cleanUp);
    window.print();

    // Fallback cleanup if afterprint doesn't fire
    setTimeout(cleanUp, 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 receipt-modal-backdrop">
      <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh] receipt-modal-container">
        
        {/* Top Header */}
        <div className="p-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between no-print bg-slate-50/70 dark:bg-slate-800/60">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400 flex items-center justify-center font-bold text-xs">
              58
            </div>
            <div>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block leading-tight">
                Struk Thermal 58mm
              </span>
              <span className="text-[10px] text-slate-500 font-mono">
                {transaction.nomorStruk}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Bluetooth Quick Bar & Settings */}
        <div className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 p-2.5 no-print">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 min-w-0">
              {printerName ? (
                <>
                  <BluetoothConnected className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 truncate">
                    {printerName}
                  </span>
                </>
              ) : (
                <>
                  <Bluetooth className="w-4 h-4 text-sky-600 shrink-0" />
                  <span className="text-[11px] text-slate-600 dark:text-slate-400 truncate">
                    {savedDeviceName ? `Tersimpan: ${savedDeviceName}` : 'Printer Bluetooth 58mm'}
                  </span>
                </>
              )}
            </div>

            <button
              type="button"
              onClick={() => setShowBtSettings(!showBtSettings)}
              className="text-[11px] font-medium text-slate-600 dark:text-slate-300 hover:text-emerald-600 flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-slate-200/60 dark:hover:bg-slate-700 transition-colors shrink-0"
            >
              <Settings className="w-3 h-3 text-slate-500" />
              <span>Pengaturan BT</span>
              {showBtSettings ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
          </div>

          {/* Expandable Bluetooth Settings */}
          {showBtSettings && (
            <div className="mt-2.5 pt-2.5 border-t border-slate-200 dark:border-slate-700 space-y-2 text-xs">
              <div className="flex gap-1.5 flex-wrap">
                <button
                  type="button"
                  onClick={handleConnectPrinter}
                  disabled={isConnectingBt || !hasBtSupport}
                  className="flex-1 py-1.5 px-2.5 rounded-lg bg-sky-600 hover:bg-sky-700 disabled:bg-slate-300 text-white font-medium text-[11px] flex items-center justify-center gap-1 shadow-2xs"
                >
                  <Bluetooth className="w-3 h-3" />
                  <span>{isConnectingBt ? 'Mencari...' : printerName ? 'Ganti Printer' : 'Sambungkan Printer'}</span>
                </button>

                {printerName && (
                  <>
                    <button
                      type="button"
                      onClick={handleTestPrint}
                      disabled={isTestingBt}
                      className="py-1.5 px-2.5 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100 font-medium text-[11px] flex items-center gap-1"
                    >
                      <Printer className="w-3 h-3 text-emerald-600" />
                      <span>{isTestingBt ? 'Menguji...' : 'Uji Cetak'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleDisconnect}
                      className="py-1.5 px-2 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-[11px] hover:bg-rose-100 hover:text-rose-700"
                    >
                      Putus
                    </button>
                  </>
                )}
              </div>

              {!hasBtSupport && (
                <div className="p-2 rounded-lg bg-amber-50 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 text-[10px] leading-relaxed flex items-start gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-amber-600" />
                  <span>
                    Browser ini tidak mengaktifkan Web Bluetooth. Anda tetap dapat menggunakan tombol <b>Cetak via Browser (58mm)</b> untuk mencetak ke printer thermal Bluetooth/USB Anda.
                  </span>
                </div>
              )}

              <p className="text-[10px] text-slate-500 leading-tight">
                💡 Kompatibel dengan semua printer thermal Bluetooth 58mm (Panda, Iware, RPP02N, POS-58, GOOJPRT, PT-210, MPT-II, Eppos, VSC, dll).
              </p>
            </div>
          )}
        </div>

        {/* Status Toast Message */}
        {statusMessage && (
          <div
            className={`px-3 py-2 text-xs flex items-center gap-2 border-b no-print ${
              statusMessage.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300'
                : statusMessage.type === 'error'
                ? 'bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300'
                : 'bg-sky-50 text-sky-800 border-sky-200 dark:bg-sky-950/60 dark:text-sky-300'
            }`}
          >
            {statusMessage.type === 'success' ? (
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-emerald-600" />
            ) : statusMessage.type === 'error' ? (
              <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-600" />
            ) : (
              <RefreshCw className="w-3.5 h-3.5 shrink-0 text-sky-600 animate-spin" />
            )}
            <span className="text-[11px] font-medium leading-tight">{statusMessage.text}</span>
          </div>
        )}

        {/* Thermal Receipt Content (58mm simulation & print target) */}
        <div className="p-5 overflow-y-auto space-y-3 font-mono text-xs text-slate-800 dark:text-slate-200 receipt-thermal-paper">
          {/* Store Brand Header */}
          <div className="text-center space-y-1 pb-3 border-b border-dashed border-slate-300 dark:border-slate-700">
            <h2 className="font-bold text-base md:text-lg uppercase text-slate-900 dark:text-white tracking-wide">
              {settings.namaToko || 'POS Usaha Terpadu'}
            </h2>
            {settings.alamat && <p className="text-xs text-slate-600 dark:text-slate-400">{settings.alamat}</p>}
            {settings.noTelepon && (
              <p className="text-xs text-slate-600 dark:text-slate-400">Telp: {settings.noTelepon}</p>
            )}
          </div>

          {/* Meta Info */}
          <div className="text-xs space-y-1 pb-2 border-b border-dashed border-slate-300 dark:border-slate-700">
            <div className="flex justify-between">
              <span>No. Struk:</span>
              <span className="font-bold">{transaction.nomorStruk}</span>
            </div>
            <div className="flex justify-between">
              <span>Waktu:</span>
              <span>{formatDateTime(transaction.waktu)}</span>
            </div>
            <div className="flex justify-between">
              <span>Kasir:</span>
              <span>{transaction.kasirName || 'Kasir'}</span>
            </div>
            {transaction.namaPelanggan && (
              <div className="flex justify-between font-bold">
                <span>Pelanggan:</span>
                <span>{transaction.namaPelanggan}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>Pembayaran:</span>
              <span className="uppercase font-bold">
                {transaction.metodePembayaran} ({transaction.statusPembayaran})
              </span>
            </div>
          </div>

          {/* Items List */}
          <div className="space-y-2 py-1.5 border-b border-dashed border-slate-300 dark:border-slate-700">
            {transaction.items.map((it, idx) => (
              <div key={idx} className="space-y-0.5">
                <div className="font-semibold text-slate-900 dark:text-white leading-tight">{it.nama}</div>
                <div className="flex justify-between text-xs text-slate-600 dark:text-slate-400">
                  <span>
                    {it.qty} {it.satuan || 'x'} @ {formatRupiah(it.hargaJual)}
                  </span>
                  <span className="font-bold text-slate-900 dark:text-white">{formatRupiah(it.subtotal)}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Summary Totals */}
          <div className="space-y-1.5 pt-1 text-xs">
            <div className="flex justify-between text-sm md:text-base font-bold text-slate-900 dark:text-white">
              <span>TOTAL BELANJA:</span>
              <span className="font-black">{formatRupiah(transaction.totalJual)}</span>
            </div>

            {transaction.statusPembayaran === 'sebagian' && (
              <>
                <div className="flex justify-between text-xs text-slate-700 dark:text-slate-300">
                  <span>Dibayar ({transaction.metodePembayaran.toUpperCase()}):</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">
                    {formatRupiah(transaction.jumlahBayar || 0)}
                  </span>
                </div>
                <div className="flex justify-between text-xs text-rose-600 dark:text-rose-400 font-bold">
                  <span>Sisa Hutang / Kasbon:</span>
                  <span>{formatRupiah(transaction.sisaHutang || 0)}</span>
                </div>
              </>
            )}

            <div className="flex justify-between text-xs text-slate-500">
              <span>Status Bayar:</span>
              <span
                className={`font-bold uppercase ${
                  transaction.statusPembayaran === 'lunas'
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : transaction.statusPembayaran === 'sebagian'
                    ? 'text-amber-600 dark:text-amber-400'
                    : 'text-rose-600 dark:text-rose-400'
                }`}
              >
                {transaction.statusPembayaran === 'lunas'
                  ? 'LUNAS'
                  : transaction.statusPembayaran === 'sebagian'
                  ? 'BAYAR SEBAGIAN'
                  : 'HUTANG / KASBON'}
              </span>
            </div>
          </div>

          {/* Footer note */}
          <div className="pt-4 text-center text-xs text-slate-500 dark:text-slate-400 space-y-1 border-t border-dashed border-slate-300 dark:border-slate-700">
            <p className="font-medium">{settings.catatanStruk || 'Terima kasih atas kunjungan Anda!'}</p>
            <p className="text-[10px] text-slate-400">Simpan struk ini sebagai bukti pembayaran sah.</p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-3 bg-slate-50 dark:bg-slate-800 border-t border-slate-100 dark:border-slate-800 space-y-2 no-print">
          <div className="flex gap-2">
            {/* Primary Action: Direct Bluetooth Thermal 58mm */}
            <button
              type="button"
              onClick={handlePrintBluetooth}
              disabled={isPrintingBt}
              className="flex-1 py-2.5 px-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/20 active:scale-[0.99] transition-all disabled:opacity-60"
            >
              {isPrintingBt ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Mencetak ke Bluetooth...</span>
                </>
              ) : (
                <>
                  <Bluetooth className="w-4 h-4" />
                  <span>Cetak Bluetooth 58mm</span>
                </>
              )}
            </button>
          </div>

          <div className="flex gap-2">
            {/* Secondary: Browser Print configured for 58mm */}
            <button
              type="button"
              onClick={handlePrintBrowser58mm}
              className="flex-1 py-2 text-xs font-semibold rounded-xl bg-slate-200/90 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600 flex items-center justify-center gap-1 transition-colors"
              title="Cetak lewat driver printer 58mm bawaan Windows/Android"
            >
              <Printer className="w-3.5 h-3.5 text-slate-500" />
              <span>Cetak via Browser (58mm)</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="py-2 px-4 text-xs font-semibold rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700"
            >
              Tutup
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
