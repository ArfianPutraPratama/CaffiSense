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

  const getAvatarSrc = (avatar?: string | null) => {
    if (!avatar) return null;
    if (avatar.includes('localhost:8000') || avatar.includes('127.0.0.1:8000')) {
      return avatar.replace(/^https?:\/\/(localhost|127\.0\.0\.1):8000/, '');
    }
    return avatar;
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

      {/* ─── SIDEBAR (DESKTOP: FULL w-64, TABLET: COMPACT w-20, MOBILE: HIDDEN) ─── */}
      <aside 
        className="hidden md:flex md:w-20 lg:w-64 flex-shrink-0 flex-col justify-between md:p-3 lg:p-6 border-r border-[#e5e5df] h-screen sticky top-0 transition-all duration-300 z-20"
        style={{ background: '#f2f2ed' }}
      >
        <div>
          {/* Brand Logo */}
          <div className="flex items-center justify-center lg:justify-between mb-6 lg:mb-8 px-1 lg:px-2">
            <Link to="/" className="font-black text-xl tracking-tight text-gray-950 flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-orange-500 inline-block flex-shrink-0"></span>
              <span className="hidden lg:inline">CaffiSense</span>
            </Link>
          </div>

          {/* Search Trigger Button Box */}
          <button 
            type="button"
            onClick={() => setIsSearchOpen(true)}
            className="w-full relative mb-6 bg-white border border-gray-200/80 rounded-full md:p-2.5 lg:pl-9 lg:pr-3 lg:py-2 text-xs text-gray-400 hover:text-gray-700 hover:border-gray-400 transition shadow-2xs flex items-center justify-center lg:justify-between group cursor-pointer"
            title="Cari menu & kopi (Ctrl+K)"
          >
            <Search className="w-4 h-4 text-gray-400 lg:absolute lg:left-3 lg:top-1/2 lg:-translate-y-1/2 group-hover:text-gray-600" />
            <span className="hidden lg:inline text-xs">Cari menu & kopi...</span>
            <kbd className="hidden lg:inline text-[10px] font-mono bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded border border-gray-200">
              Ctrl K
            </kbd>
          </button>

          {/* Navigation Links */}
          <nav className="space-y-1.5">
            <div className="hidden lg:block text-[11px] font-bold text-gray-400 uppercase tracking-wider px-3 mb-2">
              Menu
            </div>
            {NAV_ITEMS.map((item) => {
              const isActive = location.pathname === item.to;
              const Icon = item.icon;
              return (
                <Link
                  key={item.label}
                  to={item.to}
                  className="flex items-center justify-center lg:justify-start gap-3 md:p-2.5 lg:px-4 lg:py-2.5 rounded-full text-sm font-semibold transition-all relative group"
                  style={{
                    background: isActive ? '#111111' : 'transparent',
                    color: isActive ? '#ffffff' : '#666666',
                    boxShadow: isActive ? '0 2px 8px rgba(0,0,0,0.12)' : 'none',
                  }}
                  title={item.label}
                >
                  <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-white' : 'text-gray-500'}`} />
                  <span className="hidden lg:inline">{item.label}</span>

                  {/* Tablet Floating Tooltip */}
                  <span className="hidden md:group-hover:block lg:hidden absolute left-full ml-3 px-2 py-1 bg-gray-900 text-white text-xs rounded-md shadow-md whitespace-nowrap z-50 pointer-events-none">
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Bottom Profile / Tools */}
        <div className="space-y-4 pt-4 lg:pt-6 border-t border-[#e2e2dc]">
          <div className="flex flex-col lg:flex-row items-center justify-around lg:justify-between px-1 text-gray-500 gap-2 lg:gap-0">
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
            <div className="bg-white rounded-2xl md:p-2 lg:p-3 flex items-center justify-center lg:justify-between shadow-2xs border border-gray-100">
              <div className="flex items-center gap-3 min-w-0">
                {user.avatar ? (
                  <img
                    src={getAvatarSrc(user.avatar) || ''}
                    alt={user.name}
                    className="w-8 h-8 lg:w-9 lg:h-9 rounded-full object-cover shadow-xs border border-gray-200 flex-shrink-0"
                  />
                ) : (
                  <div
                    className="w-8 h-8 lg:w-9 lg:h-9 rounded-full flex items-center justify-center font-bold text-xs text-white flex-shrink-0"
                    style={{ background: '#f97316' }}
                    title={user.name}
                  >
                    {getInitials(user.name)}
                  </div>
                )}
                <div className="hidden lg:block flex-1 min-w-0">
                  <div className="text-xs font-bold text-gray-900 truncate">{user.name}</div>
                  <div className="text-[10px] text-gray-400 truncate">{user.email}</div>
                </div>
              </div>
              <button
                onClick={handleLogout}
                title="Keluar"
                className="hidden lg:flex w-8 h-8 rounded-full items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 transition ml-1 flex-shrink-0 cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <Link
              to="/login"
              className="bg-white rounded-2xl md:p-2.5 lg:p-3.5 flex items-center justify-center gap-2 shadow-2xs border border-gray-200/80 text-xs font-bold text-gray-900 hover:bg-gray-50 transition"
              title="Masuk / Daftar Akun"
            >
              <LogIn className="w-4 h-4 text-orange-500 flex-shrink-0" />
              <span className="hidden lg:inline">Masuk / Daftar</span>
            </Link>
          )}
        </div>
      </aside>

      {/* ─── MAIN CONTENT AREA (MOBILE, TABLET, DESKTOP) ─── */}
      <div className="flex-1 flex flex-col min-h-screen overflow-x-hidden pb-20 md:pb-0">
        
        {/* ─── MOBILE TOP APP HEADER (VISIBLE ONLY ON MOBILE < 768px) ─── */}
        <header className="flex md:hidden h-14 items-center justify-between px-4 sticky top-0 z-30 border-b border-[#e5e5df]/80 bg-[#f2f2ed]/90 backdrop-blur-md">
          <div className="flex items-center gap-2">
            <Link to="/" className="font-black text-lg tracking-tight text-gray-950 flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-orange-500 inline-block"></span>
              <span>CaffiSense</span>
            </Link>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse ml-1" title="System Live"></span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsSearchOpen(true)}
              className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-xs border border-gray-200/70 text-gray-600 cursor-pointer"
              title="Cari"
            >
              <Search className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setIsNotificationOpen(true)}
              className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-xs border border-gray-200/70 text-gray-600 relative cursor-pointer"
              title="Notifikasi"
            >
              <Bell className="w-3.5 h-3.5" />
              <span className="w-1.5 h-1.5 rounded-full bg-orange-500 absolute top-1.5 right-1.5"></span>
            </button>
            {isAuthenticated && user ? (
              <Link
                to="/profile"
                className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs text-white shadow-xs overflow-hidden border border-gray-200"
              >
                {user.avatar ? (
                  <img src={getAvatarSrc(user.avatar) || ''} alt={user.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="w-full h-full flex items-center justify-center" style={{ background: '#f97316' }}>
                    {getInitials(user.name)}
                  </span>
                )}
              </Link>
            ) : (
              <Link
                to="/login"
                className="text-[11px] font-bold text-white bg-gray-950 px-3 py-1.5 rounded-full"
              >
                Masuk
              </Link>
            )}
          </div>
        </header>

        {/* ─── DESKTOP & TABLET TOP HEADER BAR (HIDDEN ON MOBILE) ─── */}
        <header className="hidden md:flex h-16 items-center justify-between px-6 lg:px-8 flex-shrink-0 border-b border-[#e5e5df]/60">
          <div>
            <h1 className="text-sm lg:text-base font-bold text-gray-900">
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
        <main className="flex-1 p-3.5 sm:p-5 md:p-6 lg:p-8">
          {children}
        </main>
      </div>

      {/* ─── MOBILE FLOATING BOTTOM NAVIGATION BAR (VISIBLE ONLY ON MOBILE < 768px) ─── */}
      <nav 
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-lg border-t border-gray-200/80 px-2 py-1.5 shadow-lg flex items-center justify-around"
        style={{ paddingBottom: 'calc(0.4rem + env(safe-area-inset-bottom, 0px))' }}
      >
        {NAV_ITEMS.map((item) => {
          const isActive = location.pathname === item.to;
          const Icon = item.icon;
          return (
            <Link
              key={item.label}
              to={item.to}
              className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all ${
                isActive 
                  ? 'text-gray-950 font-bold scale-105' 
                  : 'text-gray-400 hover:text-gray-600 font-medium'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 ${isActive ? 'text-gray-950' : 'text-gray-400'}`} />
                {isActive && (
                  <span className="w-1 h-1 rounded-full bg-orange-500 absolute -bottom-1 left-1/2 -translate-x-1/2"></span>
                )}
              </div>
              <span className="text-[10px] mt-1 tracking-tight">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
