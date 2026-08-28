import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Activity, 
  Sparkles, 
  History, 
  Search, 
  HelpCircle, 
  Settings, 
  Bell, 
  LogOut, 
  LogIn, 
  User 
} from 'lucide-react';
import SearchCommandModal from '../components/modals/SearchCommandModal';
import NotificationCenterModal from '../components/modals/NotificationCenterModal';
import SettingsModal from '../components/modals/SettingsModal';
import HelpModal from '../components/modals/HelpModal';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const NAV_ITEMS = [
  { label: 'Diagnosis', to: '/diagnosis', icon: Activity },
  { label: 'Insights', to: '/insights', icon: Sparkles },
  { label: 'History', to: '/history', icon: History },
  { label: 'Profile', to: '/profile', icon: User },
];

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();

  // Modal Dialog States
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  // Global keyboard shortcut: Ctrl+K / Cmd+K for Search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const getInitials = (name?: string) => {
    if (!name) return 'CS';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };

  return (
    <div
      className="min-h-screen flex"
      style={{ background: '#f2f2ed', fontFamily: "'Inter', 'Segoe UI', sans-serif" }}
    >
      {/* Search Command Palette Modal */}
      <SearchCommandModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
      />

      {/* Notification Center Modal */}
      <NotificationCenterModal
        isOpen={isNotificationOpen}
        onClose={() => setIsNotificationOpen(false)}
      />

      {/* Quick Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />

      {/* Help & Medical FAQ Modal */}
      <HelpModal
        isOpen={isHelpOpen}
        onClose={() => setIsHelpOpen(false)}
      />

      {/* Sidebar - UXBooster Minimalist Clean Style */}
      <aside 
        className="w-64 flex-shrink-0 flex flex-col justify-between p-6 border-r border-[#e5e5df] h-screen sticky top-0"
        style={{ background: '#f2f2ed' }}
      >
        <div>
          {/* Brand Logo */}
          <div className="flex items-center justify-between mb-8 px-2">
            <Link to="/" className="font-black text-xl tracking-tight text-gray-950 flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-orange-500 inline-block"></span>
              CaffiSense
            </Link>
          </div>

          {/* Search Trigger Button Box */}
          <button 
            type="button"
            onClick={() => setIsSearchOpen(true)}
            className="w-full relative mb-6 bg-white border border-gray-200/80 rounded-full pl-9 pr-3 py-2 text-xs text-gray-400 hover:text-gray-700 hover:border-gray-400 transition shadow-2xs flex items-center justify-between group cursor-pointer"
          >
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 group-hover:text-gray-600" />
            <span className="text-xs">Cari menu & kopi...</span>
            <kbd className="text-[10px] font-mono bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded border border-gray-200">
              Ctrl K
            </kbd>
          </button>

          {/* Navigation Links */}
          <nav className="space-y-1.5">
            <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider px-3 mb-2">
              Menu
            </div>
            {NAV_ITEMS.map((item) => {
              const isActive = location.pathname === item.to;
              const Icon = item.icon;
              return (
                <Link
                  key={item.label}
                  to={item.to}
                  className="flex items-center gap-3 px-4 py-2.5 rounded-full text-sm font-semibold transition-all"
                  style={{
                    background: isActive ? '#111111' : 'transparent',
                    color: isActive ? '#ffffff' : '#666666',
                    boxShadow: isActive ? '0 2px 8px rgba(0,0,0,0.12)' : 'none',
                  }}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-gray-500'}`} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Bottom Profile / Tools */}
        <div className="space-y-4 pt-6 border-t border-[#e2e2dc]">
          <div className="flex items-center justify-between px-2 text-gray-500">
            <button 
              type="button"
              onClick={() => setIsHelpOpen(true)}
              title="Pusat Bantuan & FAQ"
              className="w-8 h-8 rounded-full bg-white flex items-center justify-center hover:bg-gray-100 transition shadow-2xs text-gray-600 hover:text-gray-900 cursor-pointer"
            >
              <HelpCircle className="w-4 h-4" />
            </button>
            <button 
              type="button"
              onClick={() => setIsNotificationOpen(true)}
              title="Pusat Notifikasi"
              className="w-8 h-8 rounded-full bg-white flex items-center justify-center hover:bg-gray-100 transition shadow-2xs text-gray-600 hover:text-gray-900 relative cursor-pointer"
            >
              <Bell className="w-4 h-4" />
              <span className="w-2 h-2 rounded-full bg-orange-500 absolute top-1.5 right-1.5 ring-2 ring-white"></span>
            </button>
            <button 
              type="button"
              onClick={() => setIsSettingsOpen(true)}
              title="Pengaturan & Preferensi"
              className="w-8 h-8 rounded-full bg-white flex items-center justify-center hover:bg-gray-100 transition shadow-2xs text-gray-600 hover:text-gray-900 cursor-pointer"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>

          {/* User Profile Card / Auth Status */}
          {isAuthenticated && user ? (
            <div className="bg-white rounded-2xl p-3 flex items-center justify-between shadow-2xs border border-gray-100">
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs text-white flex-shrink-0"
                  style={{ background: '#f97316' }}
                >
                  {getInitials(user.name)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold text-gray-900 truncate">{user.name}</div>
                  <div className="text-[10px] text-gray-400 truncate">{user.email}</div>
                </div>
              </div>
              <button
                onClick={handleLogout}
                title="Keluar"
                className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 transition ml-1 flex-shrink-0 cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <Link
              to="/login"
              className="bg-white rounded-2xl p-3.5 flex items-center justify-center gap-2 shadow-2xs border border-gray-200/80 text-xs font-bold text-gray-900 hover:bg-gray-50 transition"
            >
              <LogIn className="w-4 h-4 text-orange-500" />
              <span>Masuk / Daftar Akun</span>
            </Link>
          )}
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-h-screen overflow-x-hidden">
        {/* Top Header Bar */}
        <header className="h-16 flex items-center justify-between px-8 flex-shrink-0 border-b border-[#e5e5df]/60">
          <div>
            <h1 className="text-base font-bold text-gray-900">
              {location.pathname === '/diagnosis' 
                ? 'Diagnosis & Real-time Visualizer' 
                : location.pathname === '/insights'
                ? 'Insights & AI Sleep Impact Analysis'
                : location.pathname === '/history'
                ? 'Riwayat Diagnosa & Pelacakan Kopi'
                : location.pathname === '/profile'
                ? 'Profil & Pengaturan Akun'
                : 'Dashboard Overview'}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            {!isAuthenticated && (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="text-xs font-bold text-gray-700 hover:text-black px-3 py-1.5 transition"
                >
                  Masuk
                </Link>
                <Link
                  to="/register"
                  className="text-xs font-bold text-white bg-gray-950 px-4 py-1.5 rounded-full hover:bg-black transition shadow-2xs"
                >
                  Daftar
                </Link>
              </div>
            )}
            <div className="flex items-center gap-2 text-xs font-medium text-gray-500 bg-white/80 px-3 py-1.5 rounded-full border border-gray-200/60 shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              System Live
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
