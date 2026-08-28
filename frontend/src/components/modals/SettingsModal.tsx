import { useState, useEffect } from 'react';
import { 
  Settings, 
  X, 
  ShieldCheck, 
  RotateCcw, 
  Volume2, 
  VolumeX, 
  Clock, 
  Check, 
  Save, 
  AlertCircle 
} from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  // Load or set default user preferences
  const [dailyLimit, setDailyLimit] = useState<number>(() => {
    const saved = localStorage.getItem('caffisense_daily_limit');
    return saved ? parseInt(saved, 10) : 400;
  });

  const [timeFormat, setTimeFormat] = useState<'24h' | '12h'>(() => {
    return (localStorage.getItem('caffisense_time_format') as any) || '24h';
  });

  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    return localStorage.getItem('caffisense_sound_notifications') !== 'false';
  });

  const [halfLifePreset, setHalfLifePreset] = useState<number>(() => {
    const saved = localStorage.getItem('caffisense_half_life_hours');
    return saved ? parseFloat(saved) : 5.0;
  });

  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);
  const [confirmReset, setConfirmReset] = useState<boolean>(false);

  useEffect(() => {
    if (!isOpen) {
      setSavedSuccess(false);
      setConfirmReset(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    localStorage.setItem('caffisense_daily_limit', dailyLimit.toString());
    localStorage.setItem('caffisense_time_format', timeFormat);
    localStorage.setItem('caffisense_sound_notifications', soundEnabled.toString());
    localStorage.setItem('caffisense_half_life_hours', halfLifePreset.toString());

    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 800);
  };

  const handleResetData = () => {
    localStorage.removeItem('caffisense_assessment_history');
    localStorage.removeItem('assessmentResult');
    localStorage.removeItem('caffisense_start_tracking_date');
    localStorage.removeItem('caffisense_last_sleep_date');
    setConfirmReset(false);
    onClose();
    window.location.reload();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center sm:justify-start pt-16 sm:pt-20 sm:pl-72 px-4 bg-black/40 backdrop-blur-xs animate-fadeIn">
      <div 
        className="bg-white rounded-2xl w-full max-w-md shadow-2xl border border-gray-200/80 overflow-hidden flex flex-col max-h-[85vh] animate-scaleUp"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gray-100 text-gray-800 border border-gray-200 flex items-center justify-center">
              <Settings className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-900">Pengaturan & Preferensi</h3>
              <p className="text-[10px] text-gray-400">Konfigurasi visualizer & parameter klinis</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5 text-xs">
          
          {/* Section 1: Target Batas Kafein */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="font-bold text-gray-800">
                Batas Kafein Harian Maksimal
              </label>
              <span className="font-extrabold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded text-[11px]">
                {dailyLimit} mg
              </span>
            </div>
            <p className="text-[11px] text-gray-500">
              Standar FDA adalah 400 mg. Jika Anda sensitif atau memiliki asam lambung / GERD, Anda bisa menurunkannya.
            </p>
            <div className="grid grid-cols-3 gap-2 pt-1">
              {[200, 300, 400].map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setDailyLimit(val)}
                  className={`py-2 rounded-xl text-xs font-bold transition cursor-pointer border ${
                    dailyLimit === val
                      ? 'bg-gray-900 text-white border-gray-900 shadow-2xs'
                      : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border-gray-200'
                  }`}
                >
                  {val} mg {val === 400 && '(FDA)'}
                </button>
              ))}
            </div>
          </div>

          {/* Section 2: Metabolisme Waktu Paruh Hati */}
          <div className="space-y-2 pt-3 border-t border-gray-100">
            <label className="font-bold text-gray-800 block">
              Laju Metabolisme Waktu Paruh (*Half-Life*)
            </label>
            <p className="text-[11px] text-gray-500">
              Waktu yang dibutuhkan tubuh untuk mengeliminasi 50% kadar kafein dalam darah.
            </p>
            <div className="grid grid-cols-3 gap-2 pt-1">
              {[
                { label: 'Cepat (4 Jam)', val: 4.0 },
                { label: 'Normal (5 Jam)', val: 5.0 },
                { label: 'Lambat (7 Jam)', val: 7.0 }
              ].map((item) => (
                <button
                  key={item.val}
                  type="button"
                  onClick={() => setHalfLifePreset(item.val)}
                  className={`p-2 rounded-xl text-[11px] font-bold text-center transition cursor-pointer border ${
                    halfLifePreset === item.val
                      ? 'bg-gray-900 text-white border-gray-900 shadow-2xs'
                      : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border-gray-200'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Section 3: Format Waktu & Suara */}
          <div className="space-y-3 pt-3 border-t border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-gray-500" />
                <span className="font-semibold text-gray-800">Format Waktu</span>
              </div>
              <div className="flex items-center bg-gray-100 p-0.5 rounded-lg">
                <button
                  type="button"
                  onClick={() => setTimeFormat('24h')}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition cursor-pointer ${
                    timeFormat === '24h' ? 'bg-white shadow-2xs text-gray-900' : 'text-gray-500'
                  }`}
                >
                  24 Jam (WIB)
                </button>
                <button
                  type="button"
                  onClick={() => setTimeFormat('12h')}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition cursor-pointer ${
                    timeFormat === '12h' ? 'bg-white shadow-2xs text-gray-900' : 'text-gray-500'
                  }`}
                >
                  12 Jam (AM/PM)
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {soundEnabled ? (
                  <Volume2 className="w-4 h-4 text-emerald-600" />
                ) : (
                  <VolumeX className="w-4 h-4 text-gray-400" />
                )}
                <span className="font-semibold text-gray-800">Efek Suara Notifikasi</span>
              </div>
              <button
                type="button"
                onClick={() => setSoundEnabled(!soundEnabled)}
                className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                  soundEnabled ? 'bg-emerald-600' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${
                    soundEnabled ? 'left-6' : 'left-1'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Section 4: Data Reset */}
          <div className="pt-3 border-t border-gray-100">
            <div className="bg-rose-50/70 border border-rose-200/80 rounded-xl p-3 space-y-2">
              <div className="flex items-center gap-1.5 text-rose-800 font-bold text-xs">
                <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                <span>Pembersihan Cache Data Lokal</span>
              </div>
              <p className="text-[10px] text-rose-700 leading-relaxed">
                Hapus semua riwayat diagnosa dan siklus pelacakan di peramban ini untuk memulai dari awal.
              </p>
              {!confirmReset ? (
                <button
                  type="button"
                  onClick={() => setConfirmReset(true)}
                  className="bg-white border border-rose-200 text-rose-700 hover:bg-rose-100 font-bold text-[11px] px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset Riwayat & Simulasi</span>
                </button>
              ) : (
                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleResetData}
                    className="bg-rose-600 text-white font-bold text-[11px] px-3 py-1.5 rounded-lg hover:bg-rose-700 transition cursor-pointer"
                  >
                    Ya, Hapus Semua
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmReset(false)}
                    className="text-gray-500 hover:text-gray-800 text-[11px] font-medium px-2 py-1 cursor-pointer"
                  >
                    Batal
                  </button>
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-1 text-[11px] text-gray-500">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Tersimpan di Browser</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3 py-1.5 rounded-xl text-gray-600 hover:bg-gray-200/60 font-semibold text-xs transition cursor-pointer"
            >
              Batal
            </button>
            <button
              onClick={handleSave}
              className="bg-gray-950 text-white px-4 py-1.5 rounded-xl font-bold text-xs hover:bg-black transition flex items-center gap-1.5 shadow-2xs cursor-pointer"
            >
              {savedSuccess ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Tersimpan!</span>
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  <span>Simpan Preferensi</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
