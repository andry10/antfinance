import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  UserCog,
  Store,
  Users,
  RefreshCw,
  Shield,
  UserCheck,
  Check,
  KeyRound,
  AlertCircle,
  CheckCircle2,
  Printer,
  Bluetooth,
  BluetoothConnected
} from 'lucide-react';
import { UserAccount } from '../../types';
import {
  isBluetoothSupported,
  getConnectedPrinterName,
  connectBluetoothPrinter,
  disconnectBluetoothPrinter,
  testPrintBluetooth
} from '../../services/bluetoothPrinter';

interface ProfileViewProps {
  onOpenAuthModal: () => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({ onOpenAuthModal }) => {
  const {
    currentUser,
    users,
    addUser,
    updateUserProfile,
    toggleUserActive,
    resetUserPassword,
    resetDatabase,
    settings,
    updateSettings,
    logout
  } = useApp();

  const isOwner = currentUser?.role === 'owner';

  // Store Settings Form (Owner only)
  const [namaToko, setNamaToko] = useState(settings.namaToko);
  const [alamat, setAlamat] = useState(settings.alamat);
  const [noTelepon, setNoTelepon] = useState(settings.noTelepon);
  const [catatanStruk, setCatatanStruk] = useState(settings.catatanStruk);
  const [isSavedStore, setIsSavedStore] = useState(false);

  // Profile Edit Form (Kasir or Owner identity/password edit)
  const [editName, setEditName] = useState(currentUser?.name || '');
  const [editUsername, setEditUsername] = useState(currentUser?.username || '');
  const [editPassword, setEditPassword] = useState('');
  const [isSavedProfile, setIsSavedProfile] = useState(false);

  // Bluetooth Thermal Printer state
  const [btPrinterName, setBtPrinterName] = useState<string | null>(getConnectedPrinterName());
  const [isBtConnecting, setIsBtConnecting] = useState(false);
  const [isBtTesting, setIsBtTesting] = useState(false);
  const [btNotice, setBtNotice] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);

  const handleConnectBt = async () => {
    setIsBtConnecting(true);
    setBtNotice({ text: 'Membuka dialog Bluetooth...', type: 'info' });
    try {
      const res = await connectBluetoothPrinter();
      if (res.success && res.deviceName) {
        setBtPrinterName(res.deviceName);
        setBtNotice({ text: `Terhubung ke ${res.deviceName}!`, type: 'success' });
      } else {
        setBtNotice({ text: res.error || 'Batal menyambungkan.', type: 'error' });
      }
    } finally {
      setIsBtConnecting(false);
    }
  };

  const handleTestPrintBt = async () => {
    setIsBtTesting(true);
    setBtNotice({ text: 'Mengirim teks uji cetak...', type: 'info' });
    try {
      const res = await testPrintBluetooth(settings);
      if (res.success) {
        setBtNotice({ text: 'Uji cetak berhasil ke printer 58mm!', type: 'success' });
      } else {
        setBtNotice({ text: res.error || 'Gagal uji cetak.', type: 'error' });
      }
    } finally {
      setIsBtTesting(false);
    }
  };

  const handleDisconnectBt = async () => {
    await disconnectBluetoothPrinter();
    setBtPrinterName(null);
    setBtNotice({ text: 'Printer Bluetooth telah diputus.', type: 'info' });
    setTimeout(() => setBtNotice(null), 3000);
  };

  // Add User Form (Owner only)
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

  const handleUpdateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim() || !editUsername.trim()) return;
    updateUserProfile(editName, editUsername, editPassword);
    setIsSavedProfile(true);
    setEditPassword('');
    setTimeout(() => setIsSavedProfile(false), 2500);
    alert('Identitas profil dan password berhasil diperbarui!');
  };

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername.trim() || !newName.trim()) return;
    addUser({
      username: newUsername.trim(),
      password: newPassword.trim() || '123',
      name: newName.trim(),
      role: newRole,
      isActive: true
    });
    setNewUsername('');
    setNewPassword('');
    setNewName('');
    alert(`Pengguna baru ${newName} (${newRole}) berhasil ditambahkan!`);
  };

  const handleResetPassword = (u: UserAccount) => {
    const newPass = prompt(`Masukkan password baru untuk kasir ${u.name}:`);
    if (newPass !== null && newPass.trim() !== '') {
      resetUserPassword(u.id, newPass.trim());
      alert(`Password untuk ${u.name} berhasil direset!`);
    }
  };

  return (
    <div className="p-3 md:p-6 max-w-7xl mx-auto space-y-6 pb-24 md:pb-12">
      {/* Title */}
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <UserCog className="w-6 h-6 text-emerald-600" />
          <span>{isOwner ? 'Profil, Kelola Pengguna & Pengaturan Toko' : 'Profil & Pengaturan Kasir'}</span>
        </h1>
        <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400">
          {isOwner
            ? 'Informasi akun owner, manajemen karyawan toko, dan pengaturan sistem.'
            : 'Kelola informasi identitas akun kasir dan ubah password Anda.'}
        </p>
      </div>

      <div className={`grid grid-cols-1 ${isOwner ? 'lg:grid-cols-3' : 'lg:grid-cols-2'} gap-6`}>
        {/* Kolom 1: Profil Pengguna Aktif & Edit Profil Kasir/Owner */}
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

          {/* Edit Identitas & Password (Khusus Kasir atau Umum) */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-emerald-600" />
              <span>Ubah Identitas & Password</span>
            </h3>
            <form onSubmit={handleUpdateProfile} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Nama Lengkap:
                </label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Username Login:
                </label>
                <input
                  type="text"
                  value={editUsername}
                  onChange={(e) => setEditUsername(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Password Baru (Kosongkan jika tidak diubah):
                </label>
                <input
                  type="password"
                  placeholder="••••••"
                  value={editPassword}
                  onChange={(e) => setEditPassword(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center gap-1.5 transition-colors"
              >
                {isSavedProfile ? <Check className="w-4 h-4" /> : null}
                <span>{isSavedProfile ? 'Berhasil Disimpan!' : 'Simpan Perubahan Profil'}</span>
              </button>
            </form>
          </div>
        </div>

        {/* Kolom 2 & 3: Hanya untuk Owner (Pengaturan Toko & Kelola Karyawan) */}
        {isOwner && (
          <>
            {/* Kolom 2: Pengaturan Toko & Struk */}
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

              {/* Card Printer Bluetooth Thermal 58mm */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                    <Bluetooth className="w-4 h-4 text-sky-600" />
                    <span>Printer Kasir Bluetooth 58mm</span>
                  </h2>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300">
                    ESC/POS 58mm
                  </span>
                </div>

                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Cetak struk penjualan otomatis menggunakan printer thermal Bluetooth 58mm (Panda, Iware, RPP02N, POS-58, GOOJPRT, dll.).
                </p>

                {/* Status indicator */}
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    {btPrinterName ? (
                      <>
                        <BluetoothConnected className="w-4 h-4 text-emerald-600 shrink-0" />
                        <div>
                          <div className="text-xs font-bold text-emerald-700 dark:text-emerald-400 truncate">
                            {btPrinterName}
                          </div>
                          <div className="text-[10px] text-slate-400">Terhubung & Siap Cetak</div>
                        </div>
                      </>
                    ) : (
                      <>
                        <Bluetooth className="w-4 h-4 text-slate-400 shrink-0" />
                        <div>
                          <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                            Belum Terhubung
                          </div>
                          <div className="text-[10px] text-slate-400">Klik tombol untuk pasangkan</div>
                        </div>
                      </>
                    )}
                  </div>

                  {btPrinterName && (
                    <button
                      type="button"
                      onClick={handleDisconnectBt}
                      className="text-[11px] px-2 py-1 rounded-lg text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950 font-medium"
                    >
                      Putus
                    </button>
                  )}
                </div>

                {btNotice && (
                  <div
                    className={`p-2.5 rounded-xl text-xs flex items-center gap-1.5 ${
                      btNotice.type === 'success'
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        : btNotice.type === 'error'
                        ? 'bg-rose-50 text-rose-800 border border-rose-200'
                        : 'bg-sky-50 text-sky-800 border border-sky-200'
                    }`}
                  >
                    {btNotice.type === 'success' ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    ) : btNotice.type === 'error' ? (
                      <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                    ) : (
                      <RefreshCw className="w-3.5 h-3.5 text-sky-600 animate-spin shrink-0" />
                    )}
                    <span className="text-[11px] font-medium">{btNotice.text}</span>
                  </div>
                )}

                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleConnectBt}
                    disabled={isBtConnecting || !isBluetoothSupported()}
                    className="flex-1 py-2 px-3 rounded-xl bg-sky-600 hover:bg-sky-700 disabled:bg-slate-300 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    <Bluetooth className="w-3.5 h-3.5" />
                    <span>{isBtConnecting ? 'Mencari...' : btPrinterName ? 'Ganti Printer' : 'Sambungkan Bluetooth'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleTestPrintBt}
                    disabled={isBtTesting}
                    className="py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold text-xs flex items-center gap-1"
                    title="Cetak struk percobaan ke printer 58mm"
                  >
                    <Printer className="w-3.5 h-3.5 text-slate-500" />
                    <span>{isBtTesting ? 'Menguji...' : 'Uji Cetak'}</span>
                  </button>
                </div>

                <div className="text-[10px] text-slate-400 bg-slate-50 dark:bg-slate-800/40 p-2 rounded-lg leading-relaxed">
                  📌 <b>Catatan Cetak:</b> Struk transaksi dicetak ke Bluetooth thermal 58mm. Sedangkan rekapitulasi laporan keuangan dicetak menggunakan kertas <b>A4 default browser</b>.
                </div>
              </div>
            </div>

            {/* Kolom 3: Kelola Karyawan & Reset Database (Owner Only) */}
            <div className="space-y-6">
              {isOwner && (
                <div className="bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 rounded-2xl p-5 shadow-sm space-y-3">
                  <h2 className="font-bold text-sm text-rose-800 dark:text-rose-300 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-600" />
                    <span>Reset Database & Sinkronisasi</span>
                  </h2>
                  <p className="text-xs text-rose-700 dark:text-rose-400 leading-relaxed">
                    Jika data di HP dan Desktop tidak sama, Anda dapat mereset database agar seluruh transaksi dikosongkan bersih dan tersinkron ulang ke semua perangkat. Akun pengguna (owner & kasir) tetap aman.
                  </p>
                  <button
                    type="button"
                    onClick={async () => {
                      if (window.confirm('PERINGATAN: Apakah Anda yakin ingin mereset database? Seluruh transaksi & sesi rental akan dikosongkan agar tersinkron bersih di semua perangkat, namun Akun Pengguna tetap aman.')) {
                        await resetDatabase();
                        alert('Database berhasil direset dan disinkronkan ke semua perangkat!');
                      }
                    }}
                    className="w-full py-2 px-4 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow transition-colors"
                  >
                    🔄 Reset Database (Kosongkan Transaksi, Akun Tetap)
                  </button>
                </div>
              )}

              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
                <h2 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  <Users className="w-4 h-4 text-emerald-600" />
                  <span>Kelola Karyawan & Hak Akses</span>
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

                {/* List User with Active/Inactive toggle & Reset Password */}
                <div className="space-y-2">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Daftar Akun Pengguna & Karyawan:</span>
                  <div className="divide-y divide-slate-100 dark:divide-slate-800">
                    {users.map((u) => {
                      const isInactive = u.isActive === false;
                      return (
                        <div key={u.id} className="py-3 flex items-center justify-between text-xs">
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
                              {isInactive && (
                                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-rose-100 text-rose-700">
                                  Nonaktif
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-400 font-mono">@{u.username}</div>
                          </div>

                          <div className="flex items-center gap-1.5">
                            {/* Reset Password Button */}
                            <button
                              onClick={() => handleResetPassword(u)}
                              className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] font-semibold transition-colors"
                              title="Reset Password Karyawan"
                            >
                              Reset Pass
                            </button>

                            {/* Toggle Aktif / Nonaktif */}
                            {u.id !== currentUser?.id && (
                              <button
                                onClick={() => toggleUserActive(u.id)}
                                className={`px-2 py-1 rounded text-[10px] font-bold transition-colors ${
                                  isInactive
                                    ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                                    : 'bg-rose-100 text-rose-800 hover:bg-rose-200'
                                }`}
                                title={isInactive ? 'Aktifkan Akun' : 'Nonaktifkan Akun'}
                              >
                                {isInactive ? 'Aktifkan' : 'Nonaktifkan'}
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
