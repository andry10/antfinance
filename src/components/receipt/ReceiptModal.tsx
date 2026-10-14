import React from 'react';
import { useApp } from '../../context/AppContext';
import { formatRupiah, formatDateTime } from '../../utils/format';
import { Transaction } from '../../types';
import { X, Printer, CheckCircle } from 'lucide-react';

interface ReceiptModalProps {
  transaction: Transaction | null;
  onClose: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({ transaction, onClose }) => {
  const { settings } = useApp();

  if (!transaction) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Top Header */}
        <div className="p-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between no-print">
          <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Struk Pembayaran</span>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Thermal Receipt Content */}
        <div className="p-5 overflow-y-auto space-y-3 font-mono text-xs text-slate-800 dark:text-slate-200 print-area">
          {/* Store Brand */}
          <div className="text-center space-y-1 pb-3 border-b border-dashed border-slate-300 dark:border-slate-700">
            <h2 className="font-bold text-base md:text-lg uppercase text-slate-900 dark:text-white">
              {settings.namaToko || 'POS Usaha Terpadu'}
            </h2>
            <p className="text-xs text-slate-500">{settings.alamat}</p>
            <p className="text-xs text-slate-500">Telp: {settings.noTelepon}</p>
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
              <span>{transaction.kasirName}</span>
            </div>
            {transaction.namaPelanggan && (
              <div className="flex justify-between font-bold">
                <span>Pelanggan:</span>
                <span>{transaction.namaPelanggan}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>Pembayaran:</span>
              <span className="uppercase font-bold">{transaction.metodePembayaran} ({transaction.statusPembayaran})</span>
            </div>
          </div>

          {/* Items */}
          <div className="space-y-2 py-1.5 border-b border-dashed border-slate-300 dark:border-slate-700">
            {transaction.items.map((it, idx) => (
              <div key={idx} className="space-y-0.5">
                <div className="font-semibold text-slate-900 dark:text-white">{it.nama}</div>
                <div className="flex justify-between text-xs text-slate-600 dark:text-slate-400">
                  <span>{it.qty} {it.satuan || 'x'} @ {formatRupiah(it.hargaJual)}</span>
                  <span className="font-bold text-slate-900 dark:text-white">{formatRupiah(it.subtotal)}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Summary */}
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
              <span className={`font-bold uppercase ${
                transaction.statusPembayaran === 'lunas'
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : transaction.statusPembayaran === 'sebagian'
                  ? 'text-amber-600 dark:text-amber-400'
                  : 'text-rose-600 dark:text-rose-400'
              }`}>
                {transaction.statusPembayaran === 'lunas'
                  ? 'LUNAS'
                  : transaction.statusPembayaran === 'sebagian'
                  ? 'BAYAR SEBAGIAN'
                  : 'HUTANG / KASBON'}
              </span>
            </div>
          </div>

          {/* Footer note */}
          <div className="pt-4 text-center text-xs text-slate-400 space-y-1">
            <p>{settings.catatanStruk || 'Terima kasih atas kunjungan Anda!'}</p>
            <p className="font-sans text-xs text-slate-400/80">Simpan struk ini sebagai bukti pembayaran sah.</p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-3.5 bg-slate-50 dark:bg-slate-800 border-t border-slate-100 dark:border-slate-800 flex gap-2 no-print">
          <button
            onClick={onClose}
            className="flex-1 py-2 text-xs font-semibold rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300"
          >
            Tutup
          </button>
          <button
            onClick={handlePrint}
            className="flex-1 py-2 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center gap-1.5 shadow-sm"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Cetak Struk</span>
          </button>
        </div>
      </div>
    </div>
  );
};
