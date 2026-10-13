import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { X, LogIn, Shield, UserCheck, KeyRound, AlertCircle } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const { currentUser, loginManual, loginGoogle, logout, users } = useApp();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoggingInGoogle, setIsLoggingInGoogle] = useState(false);

  if (!isOpen) return null;

  const handleManualLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    const success = loginManual(username.trim(), password.trim());
    if (success) {
      onClose();
    } else {
      setErrorMsg('Username atau password salah. Coba akun demo di bawah.');
    }
  };

  const handleGoogleLogin = async () => {
    setErrorMsg('');
    setIsLoggingInGoogle(true);
    try {
      const ok = await loginGoogle();
      if (ok) {
        onClose();
      } else {
        setErrorMsg('Gagal masuk dengan Google.');
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Login Google dibatalkan atau terjadi kesalahan.');
    } finally {
      setIsLoggingInGoogle(false);
    }
  };

  const handleQuickLogin = (uname: string, pwd: string) => {
    const ok = loginManual(uname, pwd);
    if (ok) onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-5 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
              <KeyRound className="w-5 h-5 text-emerald-600" />
              <span>Autentikasi & Masuk Akun</span>
            </h3>
            <p className="text-xs text-slate-500">
              Pilih masuk dengan Google OAuth atau manual username & password.
            </p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* 1. Official Google Sign-In Button */}
        <div>
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={isLoggingInGoogle}
            className="w-full flex items-center justify-center gap-3 py-2.5 px-4 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 font-semibold text-xs shadow-xs transition-colors"
          >
            <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-4 h-4">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
            </svg>
            <span>{isLoggingInGoogle ? 'Menghubungkan Akun...' : 'Masuk dengan Akun Google'}</span>
          </button>
        </div>

        <div className="relative flex py-1 items-center">
          <div className="flex-grow border-t border-slate-200 dark:border-slate-800"></div>
          <span className="flex-shrink mx-3 text-slate-400 text-[11px] uppercase tracking-wider">atau login manual</span>
          <div className="flex-grow border-t border-slate-200 dark:border-slate-800"></div>
        </div>

        {/* 2. Manual Login Form */}
        <form onSubmit={handleManualLogin} className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Username:
            </label>
            <input
              type="text"
              placeholder="owner / kasir"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Password:
            </label>
            <input
              type="password"
              placeholder="123"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            />
          </div>

          <button
            type="submit"
            className="w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-slate-900 dark:bg-emerald-600 hover:bg-slate-800 dark:hover:bg-emerald-700 text-white shadow-xs transition-colors"
          >
            Masuk Kasir
          </button>
        </form>

        {/* Quick Demo Switcher */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
          <span className="block text-[11px] font-semibold text-slate-400 mb-1.5">
            Akun Cepat (Satu Klik):
          </span>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleQuickLogin('owner', '123')}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-left hover:border-amber-500 text-xs transition-colors"
            >
              <div className="font-bold text-amber-600 flex items-center gap-1">
                <Shield className="w-3.5 h-3.5" />
                <span>Owner</span>
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5 font-mono">user: owner / 123</div>
            </button>

            <button
              type="button"
              onClick={() => handleQuickLogin('kasir', '123')}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-left hover:border-blue-500 text-xs transition-colors"
            >
              <div className="font-bold text-blue-600 flex items-center gap-1">
                <UserCheck className="w-3.5 h-3.5" />
                <span>Kasir</span>
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5 font-mono">user: kasir / 123</div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
