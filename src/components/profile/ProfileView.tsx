import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  UserCog,
  Store,
  Users,
  FileSpreadsheet,
  Plus,
  Trash2,
  RefreshCw,
  ExternalLink,
  Shield,
  UserCheck,
  Check,
  AlertCircle
} from 'lucide-react';
import { UserAccount } from '../../types';

interface ProfileViewProps {
  onOpenAuthModal: () => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({ onOpenAuthModal }) => {
  const {
    currentUser,
    users,
    addUser,
    deleteUser,
    settings,
    updateSettings,
    googleUser,
    isSyncing,
    syncStatusMessage,
    triggerGoogleSheetSync,
    createNewGoogleSheet,
    logout
  } = useApp();

  // Store Settings Form
  const [namaToko, setNamaToko] = useState(settings.namaToko);
  const [alamat, setAlamat] = useState(settings.alamat);
  const [noTelepon, setNoTelepon] = useState(settings.noTelepon);
  const [catatanStruk, setCatatanStruk] = useState(settings.catatanStruk);
  const [isSavedStore, setIsSavedStore] = useState(false);

  // Add User Form
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState<'owner' | 'kasir'>('kasir');

  const handleSaveStoreSettings = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings({
      namaToko,
      alamat,
      noTelepon,
      catatanStruk
    });
    setIsSavedStore(true);
    setTimeout(() => setIsSavedStore(false), 2500);
  };

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername.trim() || !newName.trim()) return;
    addUser({
      username: newUsername.trim(),
      password: newPassword.trim() || '123',
      name: newName.trim(),
      role: newRole
    });
    setNewUsername('');
    setNewPassword('');
    setNewName('');
    alert(`Pengguna baru ${newName} (${newRole}) berhasil ditambahkan!`);
  };

  return (
    <div className="p-3 md:p-6 max-w-7xl mx-auto space-y-6 pb-24 md:pb-12">
      {/* Title */}
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <UserCog className="w-6 h-6 text-emerald-600" />
          <span>Profil, Kelola Pengguna & Google Sheets</span>
        </h1>
        <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400">
          Informasi profil kasir, manajemen hak akses pengguna toko, serta pengaturan sinkronisasi Google Spreadsheet.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Kolom 1: Profil Pengguna Aktif & Google Sheets Card */}
        <div className="space-y-6">
          {/* Active User Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 flex items-center justify-center font-bold text-lg">
                {currentUser?.name?.charAt(0) || 'U'}
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  {currentUser?.name || 'Kasir'}
                </h3>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="capitalize px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center gap-1">
                    {currentUser?.role === 'owner' ? <Shield className="w-3 h-3 text-amber-500" /> : <UserCheck className="w-3 h-3 text-blue-500" />}
                    <span>{currentUser?.role}</span>
                  </span>
                  <span className="text-[11px] text-slate-400 font-mono">@{currentUser?.username}</span>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex gap-2">
              <button
                onClick={onOpenAuthModal}
                className="flex-1 py-2 px-3 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
              >
                Ganti Akun
              </button>
              <button
                onClick={logout}
                className="py-2 px-3 text-xs font-semibold rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 transition-colors"
              >
                Keluar
              </button>
            </div>
          </div>

          {/* Google Sheets Sync Card (Soft Sky Pastel) */}
          <div className="bg-gradient-to-br from-sky-50/80 via-sky-50/40 to-white border border-sky-200/90 rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-sky-950 flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-sky-600" />
                <span>Google Spreadsheet Sync</span>
              </h3>
              {googleUser ? (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  Auto-Sync Aktif
                </span>
              ) : (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                  Lokal Saja
                </span>
              )}
            </div>

            <p className="text-xs text-sky-900/80 leading-relaxed">
              {googleUser
                ? `Akun Google: ${googleUser.email}. Sinkronisasi berjalan otomatis setiap kali ada transaksi, pelunasan kasbon, dan pengeluaran baru.`
                : 'Hubungkan Akun Google untuk sinkronisasi otomatis seluruh pembukuan ke Google Drive Anda.'}
            </p>

            {settings.spreadsheetUrl && (
              <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl space-y-1 text-xs">
                <span className="text-[11px] text-slate-400">Spreadsheet Terhubung:</span>
                <div className="font-mono text-slate-700 dark:text-slate-300 truncate">
                  {settings.spreadsheetId || 'POS_Database'}
                </div>
                <a
                  href={settings.spreadsheetUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 font-semibold hover:underline mt-1"
                >
                  <span>Buka di Google Sheets</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            )}

            <div className="space-y-2">
              <button
                onClick={() => triggerGoogleSheetSync()}
                disabled={isSyncing}
                className="w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center gap-2 shadow-xs transition-colors"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>{isSyncing ? 'Menyinkronkan...' : 'Sinkronkan Data Sekarang'}</span>
              </button>

              <button
                onClick={() => createNewGoogleSheet()}
                disabled={isSyncing}
                className="w-full py-2 px-4 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
              >
                + Buat Spreadsheet Baru di Drive
              </button>
            </div>

            <div className="text-[11px] text-slate-400 italic">
              Status: {syncStatusMessage}
            </div>
          </div>
        </div>

        {/* Kolom 2: Pengaturan Profil Toko & Struk */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
            <h2 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <Store className="w-4 h-4 text-emerald-600" />
              <span>Pengaturan Toko & Struk</span>
            </h2>

            <form onSubmit={handleSaveStoreSettings} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Nama Toko / Usaha:
                </label>
                <input
                  type="text"
                  value={namaToko}
                  onChange={(e) => setNamaToko(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Alamat Lengkap:
                </label>
                <input
                  type="text"
                  value={alamat}
                  onChange={(e) => setAlamat(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Nomor Telepon / WhatsApp:
                </label>
                <input
                  type="text"
                  value={noTelepon}
                  onChange={(e) => setNoTelepon(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Pesan Catatan Kaki Struk Kasir:
                </label>
                <textarea
                  rows={3}
                  value={catatanStruk}
                  onChange={(e) => setCatatanStruk(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-slate-900 dark:bg-white text-white dark:text-slate-900 transition-colors flex items-center justify-center gap-1.5"
              >
                {isSavedStore ? <Check className="w-4 h-4 text-emerald-400" /> : null}
                <span>{isSavedStore ? 'Tersimpan!' : 'Simpan Pengaturan Toko'}</span>
              </button>
            </form>
          </div>
        </div>

        {/* Kolom 3: Kelola Pengguna (Kasir & Owner) */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
            <h2 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <Users className="w-4 h-4 text-emerald-600" />
              <span>Kelola Pengguna & Kasir</span>
            </h2>

            {/* Form Tambah Pengguna */}
            <form onSubmit={handleAddUser} className="space-y-3 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Nama Lengkap Kasir / Karyawan:
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Siti Aisyah"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Username Login:
                  </label>
                  <input
                    type="text"
                    placeholder="kasir2"
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
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
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Peran / Hak Akses:
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setNewRole('kasir')}
                    className={`flex-1 py-1.5 text-xs font-bold rounded-lg border transition-colors ${
                      newRole === 'kasir'
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    Kasir (POS & Kasir)
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewRole('owner')}
                    className={`flex-1 py-1.5 text-xs font-bold rounded-lg border transition-colors ${
                      newRole === 'owner'
                        ? 'bg-amber-600 text-white border-amber-600'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    Owner (Akses Penuh)
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2 px-4 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                + Tambah Pengguna Baru
              </button>
            </form>

            {/* List User */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Daftar Akun Pengguna:</span>
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {users.map((u) => (
                  <div key={u.id} className="py-2.5 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                        <span>{u.name}</span>
                        {u.role === 'owner' ? (
                          <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-100 text-amber-800">
                            Owner
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-blue-100 text-blue-800">
                            Kasir
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono">@{u.username}</div>
                    </div>

                    {users.length > 1 && u.id !== currentUser?.id && (
                      <button
                        onClick={() => {
                          if (window.confirm(`Hapus pengguna ${u.name}?`)) {
                            deleteUser(u.id);
                          }
                        }}
                        className="p-1 text-slate-400 hover:text-rose-600"
                        title="Hapus Pengguna"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
