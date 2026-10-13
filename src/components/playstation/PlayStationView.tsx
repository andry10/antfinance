import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { formatRupiah, formatDurationMinutes } from '../../utils/format';
import {
  Gamepad2,
  Clock,
  Play,
  CheckCircle,
  Plus,
  Utensils,
  X,
  Coffee,
  AlertCircle
} from 'lucide-react';

interface PlayStationViewProps {
  onSuccessTransaction?: (tx: any) => void;
}

export const PlayStationView: React.FC<PlayStationViewProps> = ({ onSuccessTransaction }) => {
  const {
    psUnits,
    activePsSessions,
    startPsSession,
    addItemToPsSession,
    finishPsSession,
    cancelPsSession,
    barangList
  } = useApp();

  // Start modal states
  const [isStartModalOpen, setIsStartModalOpen] = useState(false);
  const [selectedUnitId, setSelectedUnitId] = useState<string>('');
  const [rentalMode, setRentalMode] = useState<'open_billing' | 'paket_jam'>('open_billing');
  const [durasiJam, setDurasiJam] = useState<number>(1);
  const [namaPenyewa, setNamaPenyewa] = useState<string>('');

  // Add F&B modal states
  const [isAddFnbModalOpen, setIsAddFnbModalOpen] = useState(false);
  const [activeSessionForFnb, setActiveSessionForFnb] = useState<string>('');
  const [selectedBarangId, setSelectedBarangId] = useState<string>('');
  const [fnbQty, setFnbQty] = useState<number>(1);

  // Finish confirmation states
  const [isFinishModalOpen, setIsFinishModalOpen] = useState(false);
  const [sessionToFinish, setSessionToFinish] = useState<any>(null);
  const [metodeBayar, setMetodeBayar] = useState<string>('tunai');

  const openStartModal = (unitId: string) => {
    setSelectedUnitId(unitId);
    setNamaPenyewa('');
    setRentalMode('open_billing');
    setDurasiJam(1);
    setIsStartModalOpen(true);
  };

  const handleStartSession = () => {
    if (!selectedUnitId) return;
    startPsSession(selectedUnitId, namaPenyewa.trim() || 'Pelanggan PS', rentalMode, durasiJam);
    setIsStartModalOpen(false);
  };

  const openAddFnbModal = (sessionId: string) => {
    setActiveSessionForFnb(sessionId);
    setSelectedBarangId(barangList[0]?.id || '');
    setFnbQty(1);
    setIsAddFnbModalOpen(true);
  };

  const handleAddFnb = () => {
    if (!activeSessionForFnb || !selectedBarangId) return;
    addItemToPsSession(activeSessionForFnb, selectedBarangId, fnbQty);
    setIsAddFnbModalOpen(false);
  };

  const openFinishModal = (session: any) => {
    setSessionToFinish(session);
    setMetodeBayar('tunai');
    setIsFinishModalOpen(true);
  };

  const handleConfirmFinish = () => {
    if (!sessionToFinish) return;
    const tx = finishPsSession(sessionToFinish.id, metodeBayar);
    setIsFinishModalOpen(false);
    if (tx && onSuccessTransaction) {
      onSuccessTransaction(tx);
    }
  };

  return (
    <div className="p-3 md:p-6 max-w-7xl mx-auto space-y-6 pb-24 md:pb-12">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Gamepad2 className="w-6 h-6 text-indigo-600" />
            <span>Rental PlayStation (Live Billing)</span>
          </h1>
          <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400">
            Monitor stopwatch aktif per detik, paket jam, pesanan F&B, dan perhitungan billing otomatis.
          </p>
        </div>
      </div>

      {/* Grid Unit PlayStation */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {psUnits.map((unit) => {
          const activeSession = activePsSessions.find((s) => s.unitId === unit.id);
          const isPlaying = activeSession !== undefined;

          return (
            <div
              key={unit.id}
              className={`rounded-2xl border p-4 transition-all shadow-sm flex flex-col justify-between ${
                isPlaying
                  ? 'border-indigo-400 dark:border-indigo-800 bg-indigo-50/40 dark:bg-indigo-950/20'
                  : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900'
              }`}
            >
              {/* Unit Header */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                    {unit.kodeUnit} · {unit.tipeKonsol}
                  </span>
                  {isPlaying ? (
                    <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-indigo-600 text-white flex items-center gap-1.5 animate-pulse">
                      <Clock className="w-3 h-3" />
                      <span>SEDANG MAIN</span>
                    </span>
                  ) : (
                    <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                      TERSEDIA
                    </span>
                  )}
                </div>

                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  {unit.namaUnit}
                </h3>
                <div className="text-xs text-slate-500 font-mono mt-0.5">
                  Tarif: <span className="font-semibold text-indigo-600 dark:text-indigo-400">{formatRupiah(unit.tarifPerJam)}</span> / jam
                </div>

                {/* Session Active Info */}
                {activeSession && (
                  <div className="mt-4 p-3 rounded-xl bg-white dark:bg-slate-800 border border-indigo-100 dark:border-slate-700 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500">Penyewa:</span>
                      <span className="font-bold text-slate-900 dark:text-white">
                        {activeSession.namaPelanggan}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500">Mode:</span>
                      <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                        {activeSession.mode === 'paket_jam' ? `Paket ${activeSession.durasiPaketJam} Jam` : 'Open Billing'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500">Durasi Berjalan:</span>
                      <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                        {formatDurationMinutes(activeSession.durasiMenitTerhitung)}
                      </span>
                    </div>

                    {/* F&B Items */}
                    {activeSession.tambahanItem.length > 0 && (
                      <div className="pt-2 border-t border-slate-100 dark:border-slate-700 text-xs">
                        <span className="text-[11px] text-slate-400">Pesanan Jajan/Minuman:</span>
                        <div className="mt-1 space-y-0.5">
                          {activeSession.tambahanItem.map((it, idx) => (
                            <div key={idx} className="flex justify-between text-[11px] text-slate-600 dark:text-slate-300">
                              <span>{it.nama} ({it.qty}x)</span>
                              <span className="font-mono">{formatRupiah(it.subtotal)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Total Billing */}
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between font-mono">
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Total Tagihan:</span>
                      <span className="text-base font-bold text-indigo-700 dark:text-indigo-400">
                        {formatRupiah(activeSession.totalBiaya)}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
                {isPlaying ? (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => openAddFnbModal(activeSession.id)}
                      className="px-3 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center gap-1.5 transition-colors"
                    >
                      <Utensils className="w-3.5 h-3.5 text-amber-500" />
                      <span>+ Jajan</span>
                    </button>

                    <button
                      onClick={() => openFinishModal(activeSession)}
                      className="flex-1 py-2 px-3 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center gap-1.5 shadow-sm transition-colors"
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>Selesai & Bayar</span>
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => openStartModal(unit.id)}
                    className="w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center gap-2 shadow-sm transition-all active:scale-95"
                  >
                    <Play className="w-3.5 h-3.5" />
                    <span>Mulai Main Rental</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* MODAL 1: MULAI MAIN RENTAL */}
      {isStartModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl p-5 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-base text-slate-900 dark:text-white">Mulai Rental PlayStation</h3>
              <button onClick={() => setIsStartModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Nama Penyewa:
              </label>
              <input
                type="text"
                placeholder="Contoh: Rian & Kawan-kawan"
                value={namaPenyewa}
                onChange={(e) => setNamaPenyewa(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Pilih Mode Billing:
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setRentalMode('open_billing')}
                  className={`p-3 rounded-xl border text-xs font-bold transition-colors ${
                    rentalMode === 'open_billing'
                      ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  Open Billing
                  <span className="block text-[10px] font-normal text-slate-400 mt-0.5">Stop kapan saja, hitung per jam</span>
                </button>

                <button
                  type="button"
                  onClick={() => setRentalMode('paket_jam')}
                  className={`p-3 rounded-xl border text-xs font-bold transition-colors ${
                    rentalMode === 'paket_jam'
                      ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  Paket Jam
                  <span className="block text-[10px] font-normal text-slate-400 mt-0.5">Tentukan durasi dari awal</span>
                </button>
              </div>
            </div>

            {rentalMode === 'paket_jam' && (
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Pilih Durasi Paket (Jam):
                </label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((jam) => (
                    <button
                      key={jam}
                      type="button"
                      onClick={() => setDurasiJam(jam)}
                      className={`flex-1 py-2 text-xs font-bold rounded-lg border transition-colors ${
                        durasiJam === jam
                          ? 'bg-indigo-600 text-white border-indigo-600'
                          : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {jam} Jam
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
              <button
                onClick={() => setIsStartModalOpen(false)}
                className="px-4 py-2 text-xs rounded-xl text-slate-500 hover:bg-slate-100"
              >
                Batal
              </button>
              <button
                onClick={handleStartSession}
                className="px-5 py-2 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                Mulai Stopwatch
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: TAMBAH JAJANAN KE BILLING RENTAL */}
      {isAddFnbModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl p-5 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-base text-slate-900 dark:text-white">Tambah Makanan/Minuman</h3>
              <button onClick={() => setIsAddFnbModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Pilih Produk:
              </label>
              <select
                value={selectedBarangId}
                onChange={(e) => setSelectedBarangId(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              >
                {barangList.map((b) => (
                  <option key={b.id} value={b.id} disabled={b.stok <= 0}>
                    {b.nama} - {formatRupiah(b.hargaJual)} (Stok: {b.stok})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Jumlah (Qty):
              </label>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setFnbQty(Math.max(1, fnbQty - 1))}
                  className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 font-bold"
                >
                  -
                </button>
                <span className="font-mono font-bold text-sm">{fnbQty}</span>
                <button
                  type="button"
                  onClick={() => setFnbQty(fnbQty + 1)}
                  className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 font-bold"
                >
                  +
                </button>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
              <button
                onClick={() => setIsAddFnbModalOpen(false)}
                className="px-4 py-2 text-xs rounded-xl text-slate-500"
              >
                Batal
              </button>
              <button
                onClick={handleAddFnb}
                className="px-5 py-2 text-xs font-bold rounded-xl bg-amber-500 hover:bg-amber-600 text-white"
              >
                Tambahkan ke Tagihan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: SELESAI & CHECKOUT BILLING */}
      {isFinishModalOpen && sessionToFinish && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl p-5 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-base text-slate-900 dark:text-white">Checkout Rental Selesai</h3>
              <button onClick={() => setIsFinishModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Unit:</span>
                <span className="font-bold">{sessionToFinish.namaUnit}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Penyewa:</span>
                <span className="font-bold">{sessionToFinish.namaPelanggan}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Durasi:</span>
                <span className="font-mono font-bold">{sessionToFinish.durasiMenitTerhitung} Menit</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Biaya Rental PS:</span>
                <span className="font-mono">{formatRupiah(sessionToFinish.biayaRental)}</span>
              </div>
              {sessionToFinish.tambahanItem.length > 0 && (
                <div className="flex justify-between text-amber-600">
                  <span>Tambahan Jajan:</span>
                  <span className="font-mono">
                    +{formatRupiah(sessionToFinish.tambahanItem.reduce((a: any, b: any) => a + b.subtotal, 0))}
                  </span>
                </div>
              )}
              <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex justify-between font-bold text-sm">
                <span>Total Harus Dibayar:</span>
                <span className="font-mono text-emerald-600 dark:text-emerald-400">
                  {formatRupiah(sessionToFinish.totalBiaya)}
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Metode Pembayaran:
              </label>
              <div className="flex gap-2">
                {['tunai', 'qris', 'transfer'].map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setMetodeBayar(m)}
                    className={`flex-1 py-2 text-xs font-bold uppercase rounded-lg border transition-colors ${
                      metodeBayar === m
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
              <button
                onClick={() => setIsFinishModalOpen(false)}
                className="px-4 py-2 text-xs rounded-xl text-slate-500"
              >
                Batal
              </button>
              <button
                onClick={handleConfirmFinish}
                className="px-5 py-2 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
              >
                Bayar & Cetak Struk
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
