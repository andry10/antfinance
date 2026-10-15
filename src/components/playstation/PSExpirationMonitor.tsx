import React, { useEffect, useRef, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { playAlarmSound, playSuccessChime, stopAlarmSound } from '../../utils/audioAlert';
import { formatRupiah } from '../../utils/format';
import { Clock, AlertTriangle, CheckCircle, Volume2, VolumeX, ArrowRight } from 'lucide-react';

interface PSExpirationMonitorProps {
  onSessionAutoFinished?: (tx: any) => void;
}

export const PSExpirationMonitor: React.FC<PSExpirationMonitorProps> = ({ onSessionAutoFinished }) => {
  const { activePsSessions, finishPsSession, setActiveTab } = useApp();

  // Set of session IDs that have already been auto-finished to avoid duplicate triggers
  const autoFinishedSessionsRef = useRef<Set<string>>(new Set());
  
  // Set of session IDs whose alarm has already been played
  const alarmedSessionsRef = useRef<Set<string>>(new Set());

  // Local state for unpaid expired sessions to render prominent alert banner
  const [unpaidExpiredSessions, setUnpaidExpiredSessions] = useState<any[]>([]);
  
  // Notification toast for auto-finished sessions (lunas diawal)
  const [autoFinishNotif, setAutoFinishNotif] = useState<string | null>(null);

  // Whether alarm audio is currently playing
  const [isAlarmPlaying, setIsAlarmPlaying] = useState<boolean>(false);

  useEffect(() => {
    const checkSessions = () => {
      const now = Date.now();
      const currentUnpaidExpired: any[] = [];
      let shouldTriggerAlarm = false;

      // Clean up sets for sessions that no longer exist
      const activeIds = new Set(activePsSessions.map((s) => s.id));
      for (const id of autoFinishedSessionsRef.current) {
        if (!activeIds.has(id)) {
          autoFinishedSessionsRef.current.delete(id);
        }
      }
      for (const id of alarmedSessionsRef.current) {
        if (!activeIds.has(id)) {
          alarmedSessionsRef.current.delete(id);
        }
      }

      for (const session of activePsSessions) {
        if (session.mode === 'paket_jam' && session.waktuSelesaiRencana) {
          const plannedEndMs = new Date(session.waktuSelesaiRencana).getTime();

          if (now >= plannedEndMs) {
            // WAKTU HABIS!

            // 1. JIKA SUDAH BAYAR DIAWAL (statusBayar === 'lunas'):
            // Sesi berhenti dan OTOMATIS SELESAI
            if (session.statusBayar === 'lunas') {
              if (!autoFinishedSessionsRef.current.has(session.id)) {
                autoFinishedSessionsRef.current.add(session.id);

                try {
                  const tx = finishPsSession(session.id, session.metodeBayar || 'tunai');
                  playSuccessChime();

                  setAutoFinishNotif(
                    `⏰ Sesi Rental ${session.namaUnit} (${session.namaPelanggan}) waktu telah habis & otomatis selesai (Lunas Diawal).`
                  );

                  if (tx && onSessionAutoFinished) {
                    onSessionAutoFinished(tx);
                  }

                  setTimeout(() => {
                    setAutoFinishNotif(null);
                  }, 6000);
                } catch (err) {
                  console.error('Error auto-finishing PS session:', err);
                }
              }
            } 
            // 2. JIKA BELUM BAYAR (statusBayar === 'belum_bayar'):
            // Waktu berhenti, JANGAN auto selesai, TAPI kasih NOTIFIKASI dan SUARA ALARM!
            else {
              currentUnpaidExpired.push(session);

              if (!alarmedSessionsRef.current.has(session.id)) {
                alarmedSessionsRef.current.add(session.id);
                shouldTriggerAlarm = true;
              }
            }
          }
        }
      }

      setUnpaidExpiredSessions(currentUnpaidExpired);

      if (shouldTriggerAlarm) {
        setIsAlarmPlaying(true);
        playAlarmSound();
      }

      if (currentUnpaidExpired.length === 0 && isAlarmPlaying) {
        stopAlarmSound();
        setIsAlarmPlaying(false);
      }
    };

    checkSessions();
    const interval = setInterval(checkSessions, 1000);
    return () => clearInterval(interval);
  }, [activePsSessions, finishPsSession, onSessionAutoFinished, isAlarmPlaying]);

  const handleMuteAlarm = () => {
    stopAlarmSound();
    setIsAlarmPlaying(false);
  };

  const handleFinishUnpaidSession = (session: any) => {
    stopAlarmSound();
    setIsAlarmPlaying(false);
    const tx = finishPsSession(session.id, 'tunai');
    if (tx && onSessionAutoFinished) {
      onSessionAutoFinished(tx);
    }
  };

  return (
    <>
      {/* 1. TOAST NOTIFIKASI OTOMATIS SELESAI (LUNAS DIAWAL) */}
      {autoFinishNotif && (
        <div className="fixed top-16 right-4 z-50 max-w-md bg-emerald-950/95 text-white border-2 border-emerald-500 rounded-2xl p-4 shadow-2xl backdrop-blur-md flex items-start gap-3 animate-in fade-in slide-in-from-top-4 no-print">
          <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
            <CheckCircle className="w-5 h-5 text-emerald-200" />
          </div>
          <div className="flex-1 text-xs">
            <div className="font-bold text-sm text-emerald-300">Rental PS Selesai Otomatis!</div>
            <p className="mt-0.5 text-slate-200 leading-relaxed">{autoFinishNotif}</p>
          </div>
          <button
            onClick={() => setAutoFinishNotif(null)}
            className="text-slate-400 hover:text-white text-xs font-bold p-1 rounded-lg hover:bg-emerald-900"
          >
            ✕
          </button>
        </div>
      )}

      {/* 2. BANNER PERINGATAN GLOBAL: WAKTU HABIS & BELUM BAYAR (DENGAN SUARA ALARM) */}
      {unpaidExpiredSessions.length > 0 && (
        <div className="fixed bottom-20 md:bottom-5 left-4 right-4 md:left-72 md:right-6 z-50 bg-rose-900/95 text-white border-2 border-rose-500 rounded-2xl p-3.5 sm:p-4 shadow-2xl backdrop-blur-md animate-pulse no-print flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-md animate-bounce">
              <AlertTriangle className="w-6 h-6 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-sm sm:text-base text-rose-200 uppercase tracking-wide">
                  ⚠️ Waktu Rental Habis - Belum Bayar!
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-500 text-white uppercase">
                  Waktu Berhenti
                </span>
              </div>
              <div className="text-xs text-rose-100 mt-0.5 flex flex-wrap items-center gap-2">
                {unpaidExpiredSessions.map((s) => (
                  <span key={s.id} className="font-semibold bg-rose-950/80 px-2 py-0.5 rounded-md border border-rose-700">
                    {s.namaUnit} ({s.namaPelanggan}) · Tagihan: <b className="text-amber-300">{formatRupiah(s.totalBiaya)}</b>
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
            {/* Tombol Matikan Suara */}
            {isAlarmPlaying && (
              <button
                onClick={handleMuteAlarm}
                className="px-3 py-2 rounded-xl text-xs font-bold bg-rose-800 hover:bg-rose-700 text-rose-200 border border-rose-600 flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Hentikan bunyi alarm"
              >
                <VolumeX className="w-4 h-4 text-rose-300" />
                <span>Matikan Suara</span>
              </button>
            )}

            {/* Quick Action: Buka Tab Rental PS */}
            <button
              onClick={() => setActiveTab('rental_ps')}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-amber-400 hover:bg-amber-300 text-slate-950 flex items-center gap-1.5 shadow-md transition-all active:scale-95 cursor-pointer"
            >
              <span>Buka Rental PS</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>

            {/* Quick Selesai Single Session */}
            {unpaidExpiredSessions.length === 1 && (
              <button
                onClick={() => handleFinishUnpaidSession(unpaidExpiredSessions[0])}
                className="px-3.5 py-2 rounded-xl text-xs font-black bg-emerald-500 hover:bg-emerald-400 text-slate-950 flex items-center gap-1.5 shadow-md transition-all active:scale-95 cursor-pointer"
              >
                <CheckCircle className="w-3.5 h-3.5" />
                <span>Bayar & Selesai</span>
              </button>
            )}
          </div>
        </div>
      )}
    </>
  );
};
