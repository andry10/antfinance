import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Store,
  KeyRound,
  Shield,
  UserCheck,
  AlertCircle,
  Sun,
  Moon,
  ArrowRight,
  Lock,
  User,
  Info
} from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { loginManual, loginGoogle, darkMode, setDarkMode } = useApp();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoggingInGoogle, setIsLoggingInGoogle] = useState(false);

  const handleManualLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    const success = loginManual(username.trim(), password.trim());
    if (!success) {
      setErrorMsg('Username atau password salah. Silakan coba lagi atau gunakan tombol demo di bawah.');
    }
  };

  const handleGoogleLogin = async () => {
    setErrorMsg('');
    setIsLoggingInGoogle(true);
    try {
      const res = await loginGoogle();
      if (!res.success) {
        setErrorMsg(res.message || 'Gagal masuk dengan Google. Pastikan email Anda sudah didaftarkan oleh Owner.');
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Login Google dibatalkan atau terjadi kesalahan.');
    } finally {
      setIsLoggingInGoogle(false);
    }
  };

  const handleQuickLogin = (uname: string, pwd: string) => {
    setErrorMsg('');
    loginManual(uname, pwd);
  };

  return (
    <div className="min-h-screen w-screen flex flex-col justify-between bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      {/* Top Bar with Brand & Theme Toggle */}
      <header className="px-6 py-4 flex items-center justify-between border-b border-slate-200/80 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
            <Store className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-extrabold text-sm sm:text-base tracking-tight text-slate-900 dark:text-white">
              POS Usaha Terpadu
            </h1>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Kasir, PPOB, BBM & Rental PS
            </p>
          </div>
        </div>

        <button
          onClick={() => setDarkMode(!darkMode)}
          className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title={darkMode ? 'Beralih ke Mode Terang' : 'Beralih ke Mode Gelap'}
        >
          {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
        </button>
      </header>

      {/* Main Login Card Area */}
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-200/80 dark:border-slate-800 p-6 sm:p-8 space-y-6">
          <div className="text-center space-y-1.5">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-xs">
              <KeyRound className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
              Masuk Kasir & Sistem Toko
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Silakan login untuk mengakses kasir, transaksi, dan pembukuan.
            </p>
          </div>

          {/* Error Alert Banner */}
          {errorMsg && (
            <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs flex items-start gap-2.5 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
              <div className="leading-relaxed">
                <strong>Gagal Masuk:</strong> {errorMsg}
              </div>
            </div>
          )}

          {/* 1. Official Google Sign-In Button */}
          <div className="space-y-2">
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={isLoggingInGoogle}
              className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs sm:text-sm shadow-xs transition-all active:scale-98"
            >
              <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-4 h-4 shrink-0">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
              </svg>
              <span>{isLoggingInGoogle ? 'Menghubungkan Akun Google...' : 'Masuk dengan Akun Google'}</span>
            </button>
            <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 px-1">
              <Info className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>Email Gmail harus sudah terdaftar oleh Owner toko.</span>
            </div>
          </div>

          {/* Divider */}
          <div className="relative flex py-1 items-center">
            <div className="flex-grow border-t border-slate-200 dark:border-slate-800"></div>
            <span className="flex-shrink mx-3 text-slate-400 text-[11px] uppercase tracking-wider font-semibold">
              atau login manual kasir
            </span>
            <div className="flex-grow border-t border-slate-200 dark:border-slate-800"></div>
          </div>

          {/* 2. Form Login Manual */}
          <form onSubmit={handleManualLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Username:
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="owner / kasir"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                  required
                />
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Password:
              </label>
              <div className="relative">
                <input
                  type="password"
                  placeholder="123"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                />
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 px-4 rounded-xl text-xs sm:text-sm font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm flex items-center justify-center gap-2 transition-all active:scale-98"
            >
              <span>Masuk ke Kasir</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* 3. Demo Quick Login Buttons */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2">
            <span className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Akses Cepat (Satu Klik):
            </span>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => handleQuickLogin('owner', '123')}
                className="p-3 rounded-2xl border border-amber-200/80 dark:border-amber-900/60 bg-amber-50/50 dark:bg-slate-800 hover:bg-amber-100/50 text-left transition-all"
              >
                <div className="font-bold text-xs text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
                  <Shield className="w-4 h-4" />
                  <span>Owner (Penuh)</span>
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 font-mono">
                  user: owner / 123
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('kasir', '123')}
                className="p-3 rounded-2xl border border-blue-200/80 dark:border-blue-900/60 bg-blue-50/50 dark:bg-slate-800 hover:bg-blue-100/50 text-left transition-all"
              >
                <div className="font-bold text-xs text-blue-700 dark:text-blue-400 flex items-center gap-1.5">
                  <UserCheck className="w-4 h-4" />
                  <span>Kasir Toko</span>
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 font-mono">
                  user: kasir / 123
                </div>
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-4 text-center text-xs text-slate-400">
        POS Usaha Terpadu &copy; {new Date().getFullYear()} · Multi-usaha Kasir, PPOB, BBM & Rental PS
      </footer>
    </div>
  );
};
