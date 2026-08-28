import { useState, useMemo } from 'react';
import { 
  Bell, 
  X, 
  CheckCheck, 
  AlertTriangle, 
  Clock, 
  Droplet, 
  Calendar, 
  CheckCircle2, 
  Trash2,
  ExternalLink
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface NotificationCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  time: string;
  type: 'warning' | 'info' | 'success' | 'tip';
  read: boolean;
  actionUrl?: string;
  actionText?: string;
}

export default function NotificationCenterModal({ isOpen, onClose }: NotificationCenterModalProps) {
  const navigate = useNavigate();

  // Generate dynamic clinical notifications based on real-time intake
  const [notifications, setNotifications] = useState<NotificationItem[]>(() => {
    return [
      {
        id: 'n1',
        title: 'Batas Jam Kopi Hari Ini',
        message: 'Waktu ideal konsumsi kopi terakhir hari ini adalah pukul 14:00 – 15:00 WIB agar reseptor adenosin otak bebas saat jam tidur malam.',
        time: 'Baru saja',
        type: 'warning',
        read: false,
        actionUrl: '/diagnosis',
        actionText: 'Cek Visualizer'
      },
      {
        id: 'n2',
        title: 'Siklus Evaluasi 7 Hari',
        message: 'Catat pola konsumsi dan kualitas tidur harian secara konsisten untuk membuka laporan klinis mingguan oleh AI.',
        time: '2 jam yang lalu',
        type: 'info',
        read: false,
        actionUrl: '/diagnosis',
        actionText: 'Isi Hari Ini'
      },
      {
        id: 'n3',
        title: 'Tips Hidrasi Pendamping Kopi',
        message: 'Kafein memiliki efek diuretik ringan. Pastikan minum minimal 1–2 gelas air putih untuk menjaga keseimbangan cairan tubuh dan fungsi ginjal.',
        time: '5 jam yang lalu',
        type: 'tip',
        read: true,
      },
      {
        id: 'n4',
        title: 'Batas Aman Harian FDA (400 mg)',
        message: 'Batas maksimal asupan kafein yang aman bagi orang dewasa adalah 400 mg per hari (~3-4 cangkir standar).',
        time: 'Kemarin',
        type: 'success',
        read: true,
      }
    ];
  });

  const [activeTab, setActiveTab] = useState<'all' | 'unread'>('all');

  const unreadCount = useMemo(() => {
    return notifications.filter(n => !n.read).length;
  }, [notifications]);

  const filteredNotifications = useMemo(() => {
    if (activeTab === 'unread') {
      return notifications.filter(n => !n.read);
    }
    return notifications;
  }, [notifications, activeTab]);

  const handleMarkAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const handleClearAll = () => {
    setNotifications([]);
  };

  const handleItemClick = (item: NotificationItem) => {
    setNotifications(prev => prev.map(n => n.id === item.id ? { ...n, read: true } : n));
    if (item.actionUrl) {
      navigate(item.actionUrl);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center sm:justify-start pt-16 sm:pt-20 sm:pl-72 px-4 bg-black/40 backdrop-blur-xs animate-fadeIn">
      <div 
        className="bg-white rounded-2xl w-full max-w-md shadow-2xl border border-gray-200/80 overflow-hidden flex flex-col max-h-[80vh] animate-scaleUp"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-orange-50 text-orange-600 border border-orange-200 flex items-center justify-center">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-900">Pusat Notifikasi</h3>
              <p className="text-[10px] text-gray-400">Pengingat klinis & aktivitas harian</p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                title="Tandai semua dibaca"
                className="text-[11px] text-gray-500 hover:text-gray-900 font-semibold px-2 py-1 rounded-lg hover:bg-gray-100 transition flex items-center gap-1 cursor-pointer"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span>Baca Semua</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="w-7 h-7 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 flex items-center justify-center transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tab Filter */}
        <div className="flex items-center justify-between px-5 py-2.5 bg-gray-50/70 border-b border-gray-100 text-xs">
          <div className="flex items-center gap-1">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1 rounded-lg font-semibold text-xs transition cursor-pointer ${
                activeTab === 'all'
                  ? 'bg-gray-900 text-white shadow-2xs'
                  : 'text-gray-600 hover:bg-gray-200/60'
              }`}
            >
              Semua ({notifications.length})
            </button>
            <button
              onClick={() => setActiveTab('unread')}
              className={`px-3 py-1 rounded-lg font-semibold text-xs transition cursor-pointer ${
                activeTab === 'unread'
                  ? 'bg-gray-900 text-white shadow-2xs'
                  : 'text-gray-600 hover:bg-gray-200/60'
              }`}
            >
              Belum Dibaca ({unreadCount})
            </button>
          </div>

          {notifications.length > 0 && (
            <button
              onClick={handleClearAll}
              className="text-[10px] text-gray-400 hover:text-rose-600 flex items-center gap-1 transition cursor-pointer"
            >
              <Trash2 className="w-3 h-3" />
              <span>Bersihkan</span>
            </button>
          )}
        </div>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2 max-h-[55vh]">
          {filteredNotifications.length > 0 ? (
            filteredNotifications.map((item) => {
              const isWarning = item.type === 'warning';
              const isTip = item.type === 'tip';
              const isSuccess = item.type === 'success';

              return (
                <div
                  key={item.id}
                  onClick={() => handleItemClick(item)}
                  className={`p-3 rounded-xl border transition-all cursor-pointer relative ${
                    item.read
                      ? 'bg-white border-gray-100 text-gray-700 hover:border-gray-300'
                      : 'bg-orange-50/30 border-orange-200/80 text-gray-900 shadow-2xs hover:bg-orange-50/50'
                  }`}
                >
                  {!item.read && (
                    <span className="w-2 h-2 rounded-full bg-orange-500 absolute top-3 right-3"></span>
                  )}
                  <div className="flex items-start gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                      isWarning
                        ? 'bg-amber-50 text-amber-700 border border-amber-200'
                        : isTip
                        ? 'bg-sky-50 text-sky-700 border border-sky-200'
                        : isSuccess
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                    }`}>
                      {isWarning ? <AlertTriangle className="w-4 h-4" /> :
                       isTip ? <Droplet className="w-4 h-4" /> :
                       isSuccess ? <CheckCircle2 className="w-4 h-4" /> :
                       <Calendar className="w-4 h-4" />}
                    </div>

                    <div className="flex-1 min-w-0 pr-4">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-gray-900">{item.title}</span>
                      </div>
                      <p className="text-[11px] text-gray-600 mt-1 leading-relaxed">
                        {item.message}
                      </p>

                      <div className="flex items-center justify-between mt-2.5 pt-1.5 border-t border-gray-100/80">
                        <div className="flex items-center gap-1 text-[10px] text-gray-400">
                          <Clock className="w-3 h-3" />
                          <span>{item.time}</span>
                        </div>

                        {item.actionUrl && (
                          <span className="text-[10px] font-bold text-orange-600 hover:text-orange-700 flex items-center gap-0.5">
                            <span>{item.actionText || 'Buka'}</span>
                            <ExternalLink className="w-3 h-3" />
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="py-12 text-center text-gray-400 text-xs">
              <Bell className="w-8 h-8 mx-auto mb-2 text-gray-300 stroke-1" />
              Tidak ada notifikasi saat ini.
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2.5 bg-gray-50 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-400">
          <span>Notifikasi tersinkronisasi lokal</span>
          <button 
            onClick={onClose}
            className="font-semibold text-gray-600 hover:text-gray-900 cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
