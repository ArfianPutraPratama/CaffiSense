import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import DashboardLayout from '../layouts/DashboardLayout';
import { updateProfileApi, uploadAvatarApi } from '../services/api';
import { 
  User, 
  Mail, 
  ShieldCheck, 
  Bell, 
  LogOut, 
  Camera, 
  X,
  Loader2,
  Edit3,
  Calendar,
  CheckCircle2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function ProfilePage() {
  const { user, logout, updateUserSession } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Profile Edit State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editName, setEditName] = useState(user?.name || '');
  const [editEmail, setEditEmail] = useState(user?.email || '');
  const [editPhone, setEditPhone] = useState(user?.phone || '');
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Toggles State
  const [notifications, setNotifications] = useState(user?.notifications_enabled ?? true);
  const [weeklyReport, setWeeklyReport] = useState(user?.weekly_report_enabled ?? true);

  // Sync state if user changes
  useEffect(() => {
    if (user) {
      setEditName(user.name);
      setEditEmail(user.email);
      setEditPhone(user.phone || '');
      setNotifications(user.notifications_enabled ?? true);
      setWeeklyReport(user.weekly_report_enabled ?? true);
    }
  }, [user]);

  const getInitials = (name?: string) => {
    if (!name) return 'CS';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const res = await updateProfileApi({
        name: editName,
        email: editEmail,
        phone: editPhone,
      });
      updateUserSession(res.user);
      setIsEditModalOpen(false);
    } catch (err) {
      console.error(err);
      alert('Gagal menyimpan profil');
    } finally {
      setIsSaving(false);
    }
  };

  const handleTogglePreference = async (type: 'notifications' | 'weeklyReport') => {
    const newNotifications = type === 'notifications' ? !notifications : notifications;
    const newWeeklyReport = type === 'weeklyReport' ? !weeklyReport : weeklyReport;
    
    // Optimistic UI update
    if (type === 'notifications') setNotifications(newNotifications);
    if (type === 'weeklyReport') setWeeklyReport(newWeeklyReport);

    try {
      const res = await updateProfileApi({
        notifications_enabled: newNotifications,
        weekly_report_enabled: newWeeklyReport,
      });
      updateUserSession(res.user);
    } catch (err) {
      console.error(err);
      // Revert on failure
      if (type === 'notifications') setNotifications(!newNotifications);
      if (type === 'weeklyReport') setWeeklyReport(!newWeeklyReport);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    
    setIsUploading(true);
    try {
      const res = await uploadAvatarApi(file);
      updateUserSession(res.user);
    } catch (err) {
      console.error(err);
      alert('Gagal mengunggah foto profil');
    } finally {
      setIsUploading(false);
      // Reset input so same file can be selected again
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const formatJoinDate = (dateStr?: string) => {
    if (!dateStr) return 'Oktober 2023';
    return new Date(dateStr).toLocaleDateString('id-ID', { year: 'numeric', month: 'long' });
  };

  const avatarUrl = user?.avatar ? `http://localhost:8000${user.avatar}` : null;

  return (
    <DashboardLayout>
      <div className="max-w-[1000px] mx-auto space-y-6 animate-fadeIn pb-12">
        
        {/* ─── HEADER BANNER (Clean SaaS Style) ─── */}
        <div className="bg-white rounded-2xl p-6 sm:p-7 shadow-xs border border-gray-200/80 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                Pengaturan Pengguna
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 border border-gray-200">
                Akun Saya
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
              Profil & Preferensi Akun
            </h2>
            <p className="text-xs sm:text-sm text-gray-500 max-w-xl leading-relaxed">
              Kelola informasi identitas, preferensi notifikasi, dan pengaturan akun CaffiSense kamu.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={handleLogout}
              className="bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-xl font-medium text-xs hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 transition shadow-xs flex items-center gap-2 cursor-pointer"
            >
              <LogOut className="w-4 h-4 text-gray-400 group-hover:text-rose-500" />
              <span>Keluar Sesi</span>
            </button>
          </div>
        </div>

        {/* ─── MAIN CONTENT LAYOUT ─── */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
          
          {/* LEFT COLUMN: Profile Identity Card (4 Cols) */}
          <div className="md:col-span-4 space-y-5">
            <div className="bg-white rounded-2xl p-6 shadow-xs border border-gray-200/80 text-center">
              
              {/* Avatar Container */}
              <div className="relative inline-block mb-4">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Avatar" className="w-24 h-24 rounded-full object-cover shadow-xs mx-auto border-2 border-gray-200" />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-gray-900 text-white flex items-center justify-center font-bold text-2xl shadow-xs mx-auto border-2 border-gray-200">
                    {getInitials(user?.name)}
                  </div>
                )}
                
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  title="Ganti Foto Profil"
                  className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-gray-900 text-white flex items-center justify-center border-2 border-white hover:bg-black transition shadow-sm cursor-pointer disabled:opacity-50"
                >
                  {isUploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Camera className="w-3.5 h-3.5" />}
                </button>
                
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleAvatarUpload} 
                  accept="image/*" 
                  className="hidden" 
                />
              </div>

              <h3 className="text-base font-bold text-gray-900">{user?.name || 'Pengguna CaffiSense'}</h3>
              <p className="text-xs text-gray-500 font-medium mb-5">{user?.email || 'email@example.com'}</p>

              {/* Status Pills */}
              <div className="bg-gray-50/70 rounded-xl p-3.5 border border-gray-100 space-y-3 text-left">
                <div className="flex items-center gap-3 text-xs text-gray-700">
                  <div className="w-7 h-7 rounded-lg bg-white border border-gray-200 flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">Status Akun</div>
                    <div className="text-[11px] text-gray-500 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                      <span>Aktif & Terverifikasi</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-xs text-gray-700 pt-2 border-t border-gray-100">
                  <div className="w-7 h-7 rounded-lg bg-white border border-gray-200 flex items-center justify-center shrink-0">
                    <Calendar className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">Terdaftar Sejak</div>
                    <div className="text-[11px] text-gray-500">{formatJoinDate(user?.created_at)}</div>
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* RIGHT COLUMN: Settings & Details (8 Cols) */}
          <div className="md:col-span-8 space-y-5">
            
            {/* Card 1: Informasi Pribadi */}
            <div className="bg-white rounded-2xl p-6 sm:p-7 shadow-xs border border-gray-200/80">
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-gray-50 border border-gray-200 flex items-center justify-center text-gray-700">
                    <User className="w-4 h-4" />
                  </div>
                  <h3 className="text-base font-bold text-gray-900">
                    Informasi Data Diri
                  </h3>
                </div>

                <button 
                  onClick={() => setIsEditModalOpen(true)}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-800 bg-gray-50 border border-gray-200 hover:bg-gray-100 px-3 py-1.5 rounded-lg transition cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5 text-gray-500" />
                  <span>Ubah Data</span>
                </button>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="bg-gray-50/60 p-3.5 rounded-xl border border-gray-100">
                  <div className="text-[11px] font-medium text-gray-500 mb-1">Nama Lengkap</div>
                  <div className="text-sm font-semibold text-gray-900">{user?.name || 'Tidak ada data'}</div>
                </div>

                <div className="bg-gray-50/60 p-3.5 rounded-xl border border-gray-100">
                  <div className="text-[11px] font-medium text-gray-500 mb-1">Alamat Email</div>
                  <div className="text-sm font-semibold text-gray-900">{user?.email || 'Tidak ada data'}</div>
                </div>

                <div className="bg-gray-50/60 p-3.5 rounded-xl border border-gray-100">
                  <div className="text-[11px] font-medium text-gray-500 mb-1">Nomor Telepon</div>
                  <div className="text-sm font-semibold text-gray-900">{user?.phone || '-'}</div>
                </div>

                <div className="bg-gray-50/60 p-3.5 rounded-xl border border-gray-100">
                  <div className="text-[11px] font-medium text-gray-500 mb-1">Tipe Akun</div>
                  <div className="text-sm font-semibold text-gray-900 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{user?.membership_type || 'Standard Health Plan'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 2: Preferensi Notifikasi */}
            <div className="bg-white rounded-2xl p-6 sm:p-7 shadow-xs border border-gray-200/80">
              <div className="flex items-center gap-2 pb-4 mb-4 border-b border-gray-100">
                <div className="w-7 h-7 rounded-lg bg-gray-50 border border-gray-200 flex items-center justify-center text-gray-700">
                  <Bell className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-gray-900">
                  Preferensi & Pengingat
                </h3>
              </div>
              
              <div className="space-y-3">
                {/* Toggle 1: Notifikasi Pengingat Tidur */}
                <div className="p-4 rounded-xl border border-gray-100 bg-gray-50/40 flex items-center justify-between hover:bg-gray-50 transition">
                  <div className="flex items-center gap-3.5">
                    <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center shrink-0">
                      <Bell className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs sm:text-sm font-bold text-gray-900">Notifikasi Pengingat Waktu Tidur</div>
                      <div className="text-[11px] text-gray-500">Peringatan otomatis saat mendekati ambang batas paruh kafein</div>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer ml-3">
                    <input type="checkbox" className="sr-only peer" checked={notifications} onChange={() => handleTogglePreference('notifications')} />
                    <div className="w-10 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
                  </label>
                </div>

                {/* Toggle 2: Laporan Mingguan via Email */}
                <div className="p-4 rounded-xl border border-gray-100 bg-gray-50/40 flex items-center justify-between hover:bg-gray-50 transition">
                  <div className="flex items-center gap-3.5">
                    <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center shrink-0">
                      <Mail className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs sm:text-sm font-bold text-gray-900">Laporan Mingguan via Email</div>
                      <div className="text-[11px] text-gray-500">Rangkuman tren metabolisme dan skor istirahat tiap pekan</div>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer ml-3">
                    <input type="checkbox" className="sr-only peer" checked={weeklyReport} onChange={() => handleTogglePreference('weeklyReport')} />
                    <div className="w-10 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
                  </label>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* ─── EDIT PROFILE MODAL ─── */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl border border-gray-100 overflow-hidden animate-scaleUp">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-base font-bold text-gray-900">Ubah Data Profil</h3>
              <button 
                onClick={() => setIsEditModalOpen(false)}
                className="w-7 h-7 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center hover:bg-gray-200 transition cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            
            <form onSubmit={handleSaveProfile} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Nama Lengkap</label>
                <input 
                  type="text" 
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-900 outline-none focus:border-gray-900 focus:bg-white transition"
                  required
                />
              </div>
              
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Alamat Email</label>
                <input 
                  type="email" 
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-900 outline-none focus:border-gray-900 focus:bg-white transition"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Nomor Telepon</label>
                <input 
                  type="tel" 
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  placeholder="08123456789"
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-900 outline-none focus:border-gray-900 focus:bg-white transition"
                />
              </div>

              <div className="pt-3 flex gap-2.5">
                <button 
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="flex-1 bg-white border border-gray-200 text-gray-700 font-semibold text-xs py-2.5 rounded-lg hover:bg-gray-50 transition cursor-pointer"
                >
                  Batal
                </button>
                <button 
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 bg-gray-950 text-white font-semibold text-xs py-2.5 rounded-lg hover:bg-black transition shadow-xs disabled:opacity-70 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Simpan Perubahan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
