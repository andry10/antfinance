import React, { useState, useEffect } from 'react';
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
  AlertCircle,
  Trash2,
  RotateCcw,
  UserCheck
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
    markPsSessionPaid,
    extendPsSession,
    psSisaWaktuList,
    savePsSisaWaktu,
    usePsSisaWaktu,
    deletePsSisaWaktu,
    barangList
  } = useApp();

  // Extend time modal states
  const [isExtendModalOpen, setIsExtendModalOpen] = useState(false);
  const [sessionForExtend, setSessionForExtend] = useState<any>(null);
  const [extendHoursVal, setExtendHoursVal] = useState<number>(0.5);

  const openExtendModal = (session: any) => {
    setSessionForExtend(session);
    setExtendHoursVal(0.5);
    setIsExtendModalOpen(true);
  };

  const handleConfirmExtend = () => {
    if (!sessionForExtend) return;
    extendPsSession(sessionForExtend.id, extendHoursVal);
    setIsExtendModalOpen(false);
    showNotice(`Waktu rental berhasil ditambah ${extendHoursVal === 0.5 ? '30 Menit' : `${extendHoursVal} Jam`}!`);
  };

  // Real-time clock formatted for Asia/Jakarta (WIB) with seconds
  const [wibTime, setWibTime] = useState<string>('');
  const [, setTick] = useState<number>(0);

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      const formatter = new Intl.DateTimeFormat('id-ID', {
        timeZone: 'Asia/Jakarta',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      });
      setWibTime(formatter.format(now));
      setTick((t) => t + 1);
    };
    updateClock();
    const t = setInterval(updateClock, 1000);
    return () => clearInterval(t);
  }, []);

  // Duration packages pricing rule: 30 mins = 3.000, 1 hr = 5.000, 1.5 hrs = 8.000, 2 hrs = 10.000, etc.
  const DURATION_PACKAGES = [
    { label: '30 Menit', val: 0.5, price: 3000 },
    { label: '1 Jam', val: 1, price: 5000 },
    { label: '1.5 Jam', val: 1.5, price: 8000 },
    { label: '2 Jam', val: 2, price: 10000 },
    { label: '2.5 Jam', val: 2.5, price: 13000 },
    { label: '3 Jam', val: 3, price: 15000 },
    { label: '4 Jam', val: 4, price: 20000 },
    { label: '5 Jam', val: 5, price: 25000 }
  ];

  const calculatePackagePrice = (durasi: number) => {
    const fullHours = Math.floor(durasi);
    const hasHalf = (durasi % 1) !== 0;
    return (fullHours * 5000) + (hasHalf ? 3000 : 0);
  };

  // Start modal states
  const [isStartModalOpen, setIsStartModalOpen] = useState(false);
  const [selectedUnitId, setSelectedUnitId] = useState<string>('');
  const [rentalMode, setRentalMode] = useState<'open_billing' | 'paket_jam'>('paket_jam');
  const [durasiJam, setDurasiJam] = useState<number>(1);
  const [namaPenyewa, setNamaPenyewa] = useState<string>('');
  const [statusBayar, setStatusBayar] = useState<'lunas' | 'belum_bayar'>('lunas');
  const [metodeBayar, setMetodeBayar] = useState<string>('tunai');

  // Add F&B modal states
  const [isAddFnbModalOpen, setIsAddFnbModalOpen] = useState(false);
  const [activeSessionForFnb, setActiveSessionForFnb] = useState<string>('');
  const [selectedBarangId, setSelectedBarangId] = useState<string>('');
  const [fnbQty, setFnbQty] = useState<number>(1);

  // Minta Sisa Waktu Modal states
  const [isSisaWaktuModalOpen, setIsSisaWaktuModalOpen] = useState(false);
  const [sessionForSisaWaktu, setSessionForSisaWaktu] = useState<any>(null);
  const [namaAkhirSisaWaktu, setNamaAkhirSisaWaktu] = useState<string>('');
  const [catatanSisaWaktu, setCatatanSisaWaktu] = useState<string>('');
  const [sisaMenitHitungan, setSisaMenitHitungan] = useState<number>(0);

  // Gunakan Sisa Waktu Modal states
  const [isUseSisaModalOpen, setIsUseSisaModalOpen] = useState(false);
  const [selectedSisaRecord, setSelectedSisaRecord] = useState<any>(null);
  const [targetUnitForSisa, setTargetUnitForSisa] = useState<string>('');

  // Notification feedback
  const [alertNotice, setAlertNotice] = useState<string | null>(null);
  const showNotice = (msg: string) => {
    setAlertNotice(msg);
    setTimeout(() => setAlertNotice(null), 4000);
  };

  const openStartModal = (unitId: string) => {
    setSelectedUnitId(unitId);
    setNamaPenyewa('');
    setRentalMode('paket_jam');
    setDurasiJam(1);
    setStatusBayar('lunas');
    setMetodeBayar('tunai');
    setIsStartModalOpen(true);
  };

  const handleStartSession = () => {
    if (!selectedUnitId) return;
    startPsSession(
      selectedUnitId,
      namaPenyewa.trim() || 'Pelanggan PS',
      rentalMode,
      durasiJam,
      metodeBayar,
      statusBayar
    );
    setIsStartModalOpen(false);
    showNotice(`Sesi rental ${psUnits.find((u) => u.id === selectedUnitId)?.namaUnit} berhasil dimulai!`);
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
    showNotice('Pesanan jajanan/minuman berhasil ditambahkan ke tagihan!');
  };

  // Direct finish without print modal (pencetakan struk dilakukan di menu transaksi)
  const handleDirectFinish = (session: any) => {
    const tx = finishPsSession(session.id, session.metodeBayar || 'tunai');
    if (tx && onSuccessTransaction) {
      onSuccessTransaction(tx);
    }
    showNotice(`Sesi rental ${session.namaUnit} selesai dan transaksi telah tercatat.`);
  };

  // Quick mark as paid if started with belum_bayar
  const handleMarkSessionPaid = (sessionId: string) => {
    markPsSessionPaid(sessionId, 'tunai');
    showNotice('Status sesi berhasil diubah menjadi LUNAS.');
  };

  // Open "Minta Sisa Waktu" modal
  const openSisaWaktuModal = (session: any) => {
    let remainingMinutes = 0;
    if (session.waktuSelesaiRencana) {
      const remainMs = new Date(session.waktuSelesaiRencana).getTime() - Date.now();
      remainingMinutes = Math.max(1, Math.ceil(remainMs / (60 * 1000)));
    } else {
      remainingMinutes = 30;
    }
    setSessionForSisaWaktu(session);
    setSisaMenitHitungan(remainingMinutes);
    setNamaAkhirSisaWaktu(session.namaPelanggan || '');
    setCatatanSisaWaktu('');
    setIsSisaWaktuModalOpen(true);
  };

  const handleConfirmSaveSisaWaktu = () => {
    if (!sessionForSisaWaktu) return;
    const finalName = namaAkhirSisaWaktu.trim() || sessionForSisaWaktu.namaPelanggan || 'Pelanggan PS';
    const tx = savePsSisaWaktu(sessionForSisaWaktu.id, finalName, sisaMenitHitungan, catatanSisaWaktu);
    setIsSisaWaktuModalOpen(false);
    if (tx && onSuccessTransaction) {
      onSuccessTransaction(tx);
    }
    showNotice(`Sisa waktu ${sisaMenitHitungan} menit berhasil disimpan atas nama "${finalName}".`);
  };

  // Open "Gunakan Sisa Waktu" modal
  const openUseSisaModal = (record: any) => {
    setSelectedSisaRecord(record);
    const availableUnit = psUnits.find((u) => u.status === 'tersedia');
    setTargetUnitForSisa(availableUnit?.id || '');
    setIsUseSisaModalOpen(true);
  };

  const handleConfirmUseSisa = () => {
    if (!selectedSisaRecord || !targetUnitForSisa) return;
    usePsSisaWaktu(selectedSisaRecord.id, targetUnitForSisa);
    setIsUseSisaModalOpen(false);
    showNotice(`Sisa waktu ${selectedSisaRecord.sisaMenit} menit untuk "${selectedSisaRecord.namaPelanggan}" telah diaktifkan!`);
  };

  const calculatedStartPrice = rentalMode === 'paket_jam'
    ? calculatePackagePrice(durasiJam)
    : 3000;

  return (
    <div className="p-3 md:p-6 max-w-7xl mx-auto space-y-6 pb-24 md:pb-12 text-sm">
      {/* Alert Notice Toast */}
      {alertNotice && (
        <div className="fixed top-4 right-4 z-50 bg-slate-900 text-white text-xs px-4 py-3 rounded-2xl shadow-xl border border-slate-700 flex items-center gap-2 animate-bounce">
          <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="font-medium">{alertNotice}</span>
        </div>
      )}

      {/* Header with Title and Prominent Real Time Clock */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Gamepad2 className="w-6 h-6 text-indigo-600 shrink-0" />
            <span>Rental PlayStation (Live Billing)</span>
          </h1>
          <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Tarif: <span className="font-bold text-indigo-600 dark:text-indigo-400">Rp 3.000 / 30 mnt</span> · <span className="font-bold text-indigo-600 dark:text-indigo-400">Rp 5.000 / Jam</span> (1.5 Jam = Rp 8.000)
          </p>
        </div>

        {/* Real Time Clock: Requested "Real Time : " with larger time display */}
        <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/70 border-2 border-indigo-300 dark:border-indigo-800 text-indigo-900 dark:text-indigo-200 shadow-sm self-start sm:self-auto">
          <Clock className="w-5 h-5 text-indigo-600 dark:text-indigo-400 animate-pulse shrink-0" />
          <div className="flex items-baseline gap-1.5 font-mono">
            <span className="text-xs sm:text-sm font-bold text-slate-600 dark:text-slate-300">Real Time :</span>
            <span className="text-lg sm:text-xl font-black text-indigo-600 dark:text-indigo-400 tracking-wider">
              {wibTime || '00:00:00'}
            </span>
          </div>
        </div>
      </div>

      {/* Grid Unit PlayStation */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {psUnits.map((unit) => {
          const activeSession = activePsSessions.find((s) => s.unitId === unit.id);
          const isPlaying = activeSession !== undefined;

          // Compute remaining time live for paket_jam and exact elapsed seconds for open_billing
          let remainingMinutesDisplay = 0;
          let isTimeUp = false;
          let runningTimerStr = '00:00';

          if (activeSession) {
            const startTimeMs = new Date(activeSession.waktuMulai).getTime();
            const nowMs = Date.now();
            const diffSecs = Math.max(0, Math.floor((nowMs - startTimeMs) / 1000));
            const hrs = Math.floor(diffSecs / 3600);
            const mins = Math.floor((diffSecs % 3600) / 60);
            const secs = diffSecs % 60;
            runningTimerStr = hrs > 0
              ? `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
              : `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

            if (activeSession.mode === 'paket_jam' && activeSession.waktuSelesaiRencana) {
              const remainMs = new Date(activeSession.waktuSelesaiRencana).getTime() - nowMs;
              if (remainMs <= 0) {
                isTimeUp = true;
              } else {
                remainingMinutesDisplay = Math.ceil(remainMs / (60 * 1000));
              }
            }
          }

          return (
            <div
              key={unit.id}
              className={`rounded-2xl border p-4 transition-all shadow-sm flex flex-col justify-between ${
                isPlaying
                  ? 'border-indigo-400 dark:border-indigo-800 bg-indigo-50/40 dark:bg-indigo-950/25'
                  : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900'
              }`}
            >
              {/* Unit Header */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-xs font-bold px-2.5 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                    {unit.kodeUnit} · {unit.tipeKonsol}
                  </span>
                  {isPlaying ? (
                    <span className="text-xs font-bold px-3 py-0.5 rounded-full bg-indigo-600 text-white flex items-center gap-1.5 animate-pulse shadow-xs">
                      <Clock className="w-3 h-3" />
                      <span>SEDANG MAIN</span>
                    </span>
                  ) : (
                    <span className="text-xs font-bold px-3 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                      TERSEDIA
                    </span>
                  )}
                </div>

                <div className="flex items-baseline justify-between">
                  <h3 className="font-bold text-base text-slate-900 dark:text-white">
                    {unit.namaUnit}
                  </h3>
                  <div className="text-xs text-slate-500 font-mono">
                    <span className="font-semibold text-indigo-600 dark:text-indigo-400">Rp 5.000</span> / jam
                  </div>
                </div>

                {/* Session Active Info */}
                {activeSession && (
                  <div className="mt-3.5 p-3.5 rounded-2xl bg-white dark:bg-slate-800 border border-indigo-100 dark:border-slate-700 space-y-3 shadow-xs">
                    {/* Penyewa & Status Bayar */}
                    <div className="flex items-center justify-between text-xs">
                      <div>
                        <span className="text-slate-400 text-xs block font-medium">Penyewa:</span>
                        <span className="font-bold text-slate-900 dark:text-white text-sm">
                          {activeSession.namaPelanggan}
                        </span>
                      </div>
                      <div>
                        {activeSession.statusBayar === 'belum_bayar' ? (
                          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-300">
                            BELUM BAYAR
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-300">
                            LUNAS (DIAWAL)
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Mode Billing */}
                    <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-300 pt-1.5 border-t border-slate-100 dark:border-slate-700">
                      <span className="text-slate-500">Mode:</span>
                      <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                        {activeSession.mode === 'paket_jam' ? `Paket ${activeSession.durasiPaketJam} Jam` : 'Open Billing'}
                      </span>
                    </div>

                    {/* PROMINENT SISA WAKTU / DURASI BERJALAN BOX WITH SECONDS */}
                    {activeSession.mode === 'paket_jam' ? (
                      <div className="p-3.5 rounded-xl bg-indigo-50/90 dark:bg-indigo-950/60 border-2 border-indigo-200 dark:border-indigo-800 text-center shadow-xs">
                        <div className="text-xs font-bold text-indigo-700 dark:text-indigo-300 uppercase tracking-wide flex items-center justify-center gap-1.5">
                          <Clock className="w-4 h-4 text-indigo-600 animate-pulse" />
                          <span>Sisa Waktu:</span>
                        </div>
                        <div className={`text-xl sm:text-2xl font-black font-mono mt-1 ${isTimeUp ? 'text-rose-600 animate-bounce' : 'text-indigo-950 dark:text-indigo-100'}`}>
                          {isTimeUp ? 'Waktu Habis' : formatDurationMinutes(remainingMinutesDisplay)}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-mono">
                          Berjalan: {runningTimerStr}
                        </div>
                      </div>
                    ) : (
                      <div className="p-3.5 rounded-xl bg-slate-100 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 text-center shadow-xs">
                        <div className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide flex items-center justify-center gap-1.5">
                          <Clock className="w-4 h-4" />
                          <span>Durasi Berjalan (Live):</span>
                        </div>
                        <div className="text-xl sm:text-2xl font-black font-mono text-slate-900 dark:text-white mt-1">
                          {runningTimerStr}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-mono">
                          Tarif Terhitung: {formatRupiah(activeSession.totalBiaya)}
                        </div>
                      </div>
                    )}

                    {/* F&B Items */}
                    {activeSession.tambahanItem.length > 0 && (
                      <div className="pt-2 border-t border-slate-100 dark:border-slate-700 text-xs">
                        <span className="text-xs text-slate-400 font-medium">Jajanan & Minuman:</span>
                        <div className="mt-1 space-y-1">
                          {activeSession.tambahanItem.map((it, idx) => (
                            <div key={idx} className="flex justify-between text-xs text-slate-600 dark:text-slate-300">
                              <span>{it.nama} ({it.qty}x)</span>
                              <span className="font-mono font-semibold">{formatRupiah(it.subtotal)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Total Billing */}
                    <div className="pt-2.5 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between font-mono">
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Total Tagihan:</span>
                      <span className="text-base sm:text-lg font-black text-indigo-700 dark:text-indigo-400">
                        {formatRupiah(activeSession.totalBiaya)}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
                {isPlaying ? (
                  <div className="grid grid-cols-2 gap-1.5">
                    {/* Add F&B */}
                    <button
                      onClick={() => openAddFnbModal(activeSession.id)}
                      className="py-2 px-2.5 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                      title="Tambah Jajanan/Minuman"
                    >
                      <Utensils className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                      <span className="truncate">+ Jajan</span>
                    </button>

                    {/* Tambah Jam (untuk paket_jam) */}
                    {activeSession.mode === 'paket_jam' && (
                      <button
                        onClick={() => openExtendModal(activeSession)}
                        className="py-2 px-2 rounded-xl text-xs font-bold bg-sky-600 hover:bg-sky-700 text-white flex items-center justify-center gap-1 shadow-xs transition-colors cursor-pointer"
                        title="Tambah durasi jam main"
                      >
                        <Plus className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">+ Tambah Jam</span>
                      </button>
                    )}

                    {/* SISA WAKTU BUTTON */}
                    {activeSession.mode === 'paket_jam' && (
                      <button
                        onClick={() => openSisaWaktuModal(activeSession)}
                        className="py-2 px-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white flex items-center justify-center gap-1 shadow-xs transition-colors cursor-pointer"
                        title="Catat dan simpan sisa waktu pelanggan"
                      >
                        <Clock className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">Sisa Waktu</span>
                      </button>
                    )}

                    {/* If belum bayar, quick Bayar button */}
                    {activeSession.statusBayar === 'belum_bayar' && (
                      <button
                        onClick={() => handleMarkSessionPaid(activeSession.id)}
                        className="py-2 px-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center gap-1 shadow-xs transition-colors cursor-pointer"
                        title="Tandai Sudah Dibayar"
                      >
                        <CheckCircle className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">Bayar</span>
                      </button>
                    )}

                    {/* SELESAI BUTTON */}
                    <button
                      onClick={() => handleDirectFinish(activeSession)}
                      className="col-span-2 py-2.5 px-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center gap-1.5 shadow-sm transition-colors cursor-pointer"
                      title="Hentikan sesi rental dan simpan ke riwayat transaksi"
                    >
                      <CheckCircle className="w-4 h-4 shrink-0" />
                      <span>Selesai & Catat Tagihan</span>
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => openStartModal(unit.id)}
                    className="w-full py-3 px-4 rounded-xl text-xs sm:text-sm font-bold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center gap-2 shadow-sm transition-all active:scale-95"
                  >
                    <Play className="w-4 h-4" />
                    <span>Mulai Main Rental</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* DAFTAR SISA WAKTU PELANGGAN (DEPOSIT SISA WAKTU) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm p-4 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 gap-2">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-500" />
            <h2 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white">
              Daftar Sisa Waktu Pelanggan (Deposit Waktu)
            </h2>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
              {psSisaWaktuList.filter((r) => !r.sudahDigunakan).length} Tersimpan
            </span>
          </div>
          <span className="text-xs text-slate-400">
            Pelanggan yang meminta sisa waktu dapat melanjutkan bermain kembali kapan saja
          </span>
        </div>

        {psSisaWaktuList.filter((r) => !r.sudahDigunakan).length === 0 ? (
          <div className="py-8 text-center text-slate-400 text-xs">
            Belum ada sisa waktu tersimpan. Jika ada pelanggan meminta sisa waktu saat bermain, klik tombol <span className="font-bold text-amber-600 dark:text-amber-400">"Sisa Waktu"</span> pada unit untuk mencatat namanya.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-semibold">
                  <th className="py-3 px-3">Nama Pelanggan</th>
                  <th className="py-3 px-3">Sisa Waktu</th>
                  <th className="py-3 px-3">Unit Asal</th>
                  <th className="py-3 px-3">Waktu Dicatat</th>
                  <th className="py-3 px-3">Catatan</th>
                  <th className="py-3 px-3 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {psSisaWaktuList
                  .filter((r) => !r.sudahDigunakan)
                  .map((record) => (
                    <tr key={record.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                      <td className="py-3 px-3 font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                        <UserCheck className="w-4 h-4 text-amber-500 shrink-0" />
                        <span className="text-sm">{record.namaPelanggan}</span>
                      </td>
                      <td className="py-3 px-3 font-mono font-bold text-amber-600 dark:text-amber-400 text-sm">
                        {formatDurationMinutes(record.sisaMenit)}
                      </td>
                      <td className="py-3 px-3 text-slate-500 font-medium">{record.namaUnit}</td>
                      <td className="py-3 px-3 text-slate-400">
                        {new Date(record.waktuSimpan).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </td>
                      <td className="py-3 px-3 text-slate-500 italic">
                        {record.catatan || '-'}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => openUseSisaModal(record)}
                            className="px-3 py-1.5 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1 shadow-xs transition-colors"
                            title="Aktifkan bermain kembali"
                          >
                            <Play className="w-3.5 h-3.5" />
                            <span>Gunakan</span>
                          </button>
                          <button
                            onClick={() => deletePsSisaWaktu(record.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg transition-colors"
                            title="Hapus"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL 1: MULAI MAIN RENTAL */}
      {isStartModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl p-5 sm:p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 my-auto max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <Gamepad2 className="w-5 h-5 text-indigo-600" />
                <span>Mulai Rental PlayStation</span>
              </h3>
              <button onClick={() => setIsStartModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body & Form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleStartSession();
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-xs md:text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Nama Penyewa:
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Rian & Kawan-kawan"
                  value={namaPenyewa}
                  onChange={(e) => setNamaPenyewa(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs md:text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Pilih Mode Billing:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setRentalMode('paket_jam')}
                    className={`p-3 rounded-xl border text-xs sm:text-sm font-bold transition-colors cursor-pointer ${
                      rentalMode === 'paket_jam'
                        ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    Paket Durasi
                    <span className="block text-xs font-normal text-slate-400 mt-0.5">Tentukan durasi dari awal</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setRentalMode('open_billing');
                      setStatusBayar('belum_bayar');
                    }}
                    className={`p-3 rounded-xl border text-xs sm:text-sm font-bold transition-colors cursor-pointer ${
                      rentalMode === 'open_billing'
                        ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    Open Billing
                    <span className="block text-xs font-normal text-slate-400 mt-0.5">Bayar di akhir sesuai waktu</span>
                  </button>
                </div>
              </div>

              {/* Pilihan Durasi Paket */}
              {rentalMode === 'paket_jam' && (
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs md:text-sm font-bold text-slate-700 dark:text-slate-300">
                      Pilih Durasi Paket:
                    </label>
                    <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 font-mono">
                      30 mnt = 3rb · 1 jam = 5rb · 1.5 jam = 8rb
                    </span>
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    {DURATION_PACKAGES.map((item) => (
                      <button
                        key={item.val}
                        type="button"
                        onClick={() => setDurasiJam(item.val)}
                        className={`p-2.5 text-center rounded-xl border transition-all cursor-pointer ${
                          durasiJam === item.val
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                            : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                        }`}
                      >
                        <div className="font-bold text-xs sm:text-sm">{item.label}</div>
                        <div
                          className={`text-xs font-mono mt-0.5 font-bold ${
                            durasiJam === item.val ? 'text-indigo-100' : 'text-indigo-600 dark:text-indigo-400'
                          }`}
                        >
                          {formatRupiah(item.price)}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Status Pembayaran (Hanya untuk Paket Durasi) */}
              {rentalMode === 'paket_jam' && (
                <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <label className="block text-xs md:text-sm font-bold text-slate-700 dark:text-slate-300">
                    Status Pembayaran Rental:
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setStatusBayar('lunas')}
                      className={`p-2.5 text-xs sm:text-sm font-bold rounded-xl border flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                        statusBayar === 'lunas'
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-300'
                          : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      <CheckCircle className="w-4 h-4" />
                      <span>Bayar Diawal (Lunas)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setStatusBayar('belum_bayar')}
                      className={`p-2.5 text-xs sm:text-sm font-bold rounded-xl border flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                        statusBayar === 'belum_bayar'
                          ? 'bg-amber-50 text-amber-800 border-amber-600 dark:bg-amber-950/50 dark:text-amber-300'
                          : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      <Clock className="w-4 h-4" />
                      <span>Belum Bayar (Jalan Dulu)</span>
                    </button>
                  </div>

                  {statusBayar === 'lunas' && (
                    <div className="pt-1.5">
                      <span className="block text-xs md:text-sm text-slate-500 mb-1 font-semibold">Metode Pembayaran:</span>
                      <div className="flex gap-2">
                        {['tunai', 'qris', 'transfer'].map((m) => (
                          <button
                            key={m}
                            type="button"
                            onClick={() => setMetodeBayar(m)}
                            className={`flex-1 py-2 text-xs sm:text-sm font-bold uppercase rounded-lg border transition-colors cursor-pointer ${
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
                  )}
                </div>
              )}

              {/* Total Harus Dibayar & Action Buttons */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div>
                  {rentalMode === 'paket_jam' ? (
                    <>
                      <span className="text-xs text-slate-400 block font-medium">Biaya Rental:</span>
                      <span className="text-xl md:text-2xl font-black text-indigo-700 dark:text-indigo-400 font-mono">
                        {formatRupiah(calculatedStartPrice)}
                      </span>
                    </>
                  ) : (
                    <span className="text-xs font-semibold text-slate-500 italic">
                      Tarif dihitung per menit saat dimainkan (Bayar di akhir)
                    </span>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setIsStartModalOpen(false)}
                    className="px-4 py-2.5 text-xs sm:text-sm rounded-xl text-slate-500 hover:bg-slate-100 font-medium cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 text-xs sm:text-sm font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm flex items-center gap-2 cursor-pointer active:scale-95"
                  >
                    <Play className="w-4 h-4" />
                    <span>{rentalMode === 'open_billing' ? 'Mulai Saja' : (statusBayar === 'lunas' ? 'Mulai & Bayar Diawal' : 'Mulai (Belum Bayar)')}</span>
                    <span className="hidden sm:inline-block text-[11px] font-mono bg-emerald-700 px-2 py-0.5 rounded text-emerald-100">
                      Enter ↵
                    </span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: CATAT & SIMPAN SISA WAKTU PELANGGAN */}
      {isSisaWaktuModalOpen && sessionForSisaWaktu && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2 text-amber-600">
                <Clock className="w-5 h-5" />
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  Catat & Simpan Sisa Waktu
                </h3>
              </div>
              <button onClick={() => setIsSisaWaktuModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleConfirmSaveSisaWaktu();
              }}
              className="space-y-4"
            >
              <div className="p-3.5 bg-amber-50 dark:bg-amber-950/40 rounded-2xl border border-amber-200 dark:border-amber-900/60 text-xs md:text-sm space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-400 font-medium">Unit PS:</span>
                  <span className="font-bold text-slate-900 dark:text-white">{sessionForSisaWaktu.namaUnit}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-600 dark:text-slate-400 font-medium">Sisa Waktu Dihitung:</span>
                  <span className="font-mono font-black text-amber-700 dark:text-amber-400 text-base md:text-lg">
                    {formatDurationMinutes(sisaMenitHitungan)}
                  </span>
                </div>
              </div>

              {/* Requested requirement: "sisa waktu tulis namanya diakhir saat dia Minta sisa waktu" */}
              <div>
                <label className="block text-xs md:text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Tulis Nama Pelanggan di Akhir:
                </label>
                <input
                  type="text"
                  placeholder="Masukkan nama pelanggan..."
                  value={namaAkhirSisaWaktu}
                  onChange={(e) => setNamaAkhirSisaWaktu(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500"
                  autoFocus
                />
                <span className="text-xs text-slate-400 mt-1 block">
                  Nama ini akan dicatat pada daftar sisa waktu untuk dapat dilanjutkan di waktu lain.
                </span>
              </div>

              <div>
                <label className="block text-xs md:text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Catatan Tambahan (Opsional):
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Lanjut nanti malam jam 8"
                  value={catatanSisaWaktu}
                  onChange={(e) => setCatatanSisaWaktu(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="text-xs md:text-sm text-slate-500 bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                Sesi unit {sessionForSisaWaktu.namaUnit} akan dihentikan dan unit menjadi tersedia kembali. Transaksi sesi tetap otomatis tercatat di laporan.
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsSisaWaktuModalOpen(false)}
                  className="px-4 py-2.5 text-xs sm:text-sm rounded-xl text-slate-500 hover:bg-slate-100 font-medium cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 text-xs sm:text-sm font-bold rounded-xl bg-amber-500 hover:bg-amber-600 text-white shadow-sm flex items-center gap-2 cursor-pointer active:scale-95"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>Simpan Sisa Waktu & Hentikan Sesi</span>
                  <span className="hidden sm:inline-block text-[11px] font-mono bg-amber-600 px-2 py-0.5 rounded text-amber-100">
                    Enter ↵
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: GUNAKAN SISA WAKTU PADA UNIT TERSEDIA */}
      {isUseSisaModalOpen && selectedSisaRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <RotateCcw className="w-5 h-5 text-emerald-600" />
                <span>Gunakan Sisa Waktu Pelanggan</span>
              </h3>
              <button onClick={() => setIsUseSisaModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 rounded-2xl border border-emerald-200 dark:border-emerald-900/60 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-600 dark:text-slate-400 font-medium">Pelanggan:</span>
                <span className="font-bold text-slate-900 dark:text-white text-sm">{selectedSisaRecord.namaPelanggan}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-600 dark:text-slate-400 font-medium">Sisa Waktu yang Diaktifkan:</span>
                <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400 text-sm">
                  {formatDurationMinutes(selectedSisaRecord.sisaMenit)}
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Pilih Unit PlayStation yang Tersedia:
              </label>
              <select
                value={targetUnitForSisa}
                onChange={(e) => setTargetUnitForSisa(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
              >
                {psUnits
                  .filter((u) => u.status === 'tersedia')
                  .map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.namaUnit} ({u.tipeKonsol}) - Tersedia
                    </option>
                  ))}
              </select>
              {psUnits.filter((u) => u.status === 'tersedia').length === 0 && (
                <p className="text-xs text-rose-500 mt-1">
                  Saat ini tidak ada unit PS yang tersedia. Mohon tunggu sesi lain selesai terlebih dahulu.
                </p>
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
              <button
                onClick={() => setIsUseSisaModalOpen(false)}
                className="px-4 py-2.5 text-xs rounded-xl text-slate-500 hover:bg-slate-100 font-medium"
              >
                Batal
              </button>
              <button
                onClick={handleConfirmUseSisa}
                disabled={!targetUnitForSisa}
                className="px-5 py-2.5 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm disabled:opacity-50 flex items-center gap-1.5"
              >
                <Play className="w-3.5 h-3.5" />
                <span>Mulai Main Sekarang</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: TAMBAH JAJANAN KE BILLING RENTAL */}
      {isAddFnbModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
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
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
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
                  className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 font-bold"
                >
                  -
                </button>
                <span className="font-mono font-bold text-base">{fnbQty}</span>
                <button
                  type="button"
                  onClick={() => setFnbQty(fnbQty + 1)}
                  className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 font-bold"
                >
                  +
                </button>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
              <button
                onClick={() => setIsAddFnbModalOpen(false)}
                className="px-4 py-2.5 text-xs rounded-xl text-slate-500 font-medium"
              >
                Batal
              </button>
              <button
                onClick={handleAddFnb}
                className="px-5 py-2.5 text-xs font-bold rounded-xl bg-amber-500 hover:bg-amber-600 text-white"
              >
                Tambahkan ke Tagihan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 5: TAMBAH JAM (EXTEND TIME) */}
      {isExtendModalOpen && sessionForExtend && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <Plus className="w-5 h-5 text-sky-600" />
                <span>Tambah Jam Main ({sessionForExtend.namaUnit})</span>
              </h3>
              <button onClick={() => setIsExtendModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-sky-50 dark:bg-sky-950/40 rounded-2xl border border-sky-200 dark:border-sky-900/60 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-600 dark:text-slate-400">Penyewa:</span>
                <span className="font-bold text-slate-900 dark:text-white">{sessionForExtend.namaPelanggan}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600 dark:text-slate-400">Durasi Saat Ini:</span>
                <span className="font-bold text-sky-700 dark:text-sky-300 font-mono">{sessionForExtend.durasiPaketJam} Jam</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                Pilih Tambahan Durasi:
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { label: '+30 Mnt', val: 0.5 },
                  { label: '+1 Jam', val: 1 },
                  { label: '+1.5 Jam', val: 1.5 },
                  { label: '+2 Jam', val: 2 }
                ].map((item) => (
                  <button
                    key={item.val}
                    type="button"
                    onClick={() => setExtendHoursVal(item.val)}
                    className={`py-2.5 text-center rounded-xl border transition-all cursor-pointer font-bold text-xs ${
                      extendHoursVal === item.val
                        ? 'bg-sky-600 text-white border-sky-600 shadow-sm'
                        : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
              <button
                onClick={() => setIsExtendModalOpen(false)}
                className="px-4 py-2.5 text-xs rounded-xl text-slate-500 font-medium cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={handleConfirmExtend}
                className="px-5 py-2.5 text-xs font-bold rounded-xl bg-sky-600 hover:bg-sky-700 text-white shadow-sm cursor-pointer"
              >
                Konfirmasi Tambah Jam
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
