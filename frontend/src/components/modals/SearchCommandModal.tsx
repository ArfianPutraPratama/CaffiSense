import { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, 
  Activity, 
  Sparkles, 
  History, 
  User, 
  Info, 
  Home, 
  Coffee, 
  ArrowRight, 
  X, 
  Clock, 
  Zap 
} from 'lucide-react';

interface SearchCommandModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface BeveragePreset {
  id: string;
  name: string;
  category: string;
  caffeineMg: number;
  description: string;
  serving: string;
}

const BEVERAGE_DATABASE: BeveragePreset[] = [
  { id: 'b1', name: 'Espresso Single', category: 'Kopi', caffeineMg: 64, description: '1 shot konsentrat pekat (30ml)', serving: '30 ml' },
  { id: 'b2', name: 'Espresso Double', category: 'Kopi', caffeineMg: 128, description: '2 shot espresso pekat (60ml)', serving: '60 ml' },
  { id: 'b3', name: 'Americano / Long Black', category: 'Kopi', caffeineMg: 154, description: 'Espresso + air panas/es', serving: '240 ml' },
  { id: 'b4', name: 'Kopi Tubruk Tradisional', category: 'Kopi', caffeineMg: 120, description: 'Seduhan bubuk kopi kasar tanpa filter', serving: '200 ml' },
  { id: 'b5', name: 'Kopi Susu Gula Aren', category: 'Kopi Susu', caffeineMg: 85, description: 'Espresso + susu segar + gula aren', serving: '250 ml' },
  { id: 'b6', name: 'Caffè Latte / Cappuccino', category: 'Kopi Susu', caffeineMg: 95, description: 'Espresso dengan steamed milk lembut', serving: '250 ml' },
  { id: 'b7', name: 'Cold Brew Coffee', category: 'Kopi Dingin', caffeineMg: 205, description: 'Ekstraksi perendaman dingin 12–24 jam', serving: '350 ml' },
  { id: 'b8', name: 'Matcha Latte', category: 'Teh Hijau', caffeineMg: 38, description: 'Bubuk teh hijau murni dengan susu', serving: '250 ml' },
  { id: 'b9', name: 'Minuman Energi (Energy Drink)', category: 'Minuman Berenergi', caffeineMg: 80, description: 'Minuman suplemen stimulan berkarbonasi', serving: '250 ml' },
  { id: 'b10', name: 'Teh Hitam / Earl Grey', category: 'Teh', caffeineMg: 47, description: 'Seduhan daun teh hitam beraroma', serving: '240 ml' },
];

const QUICK_PAGES = [
  { label: 'Diagnosis & Real-time Visualizer', path: '/diagnosis', icon: Activity, badge: 'Form & Grafik' },
  { label: 'Insights & Analisis Klinis AI', path: '/insights', icon: Sparkles, badge: 'Laporan AI' },
  { label: 'Riwayat Diagnosa & Tren', path: '/history', icon: History, badge: 'Log Sesi' },
  { label: 'Profil Pengguna & Target', path: '/profile', icon: User, badge: 'Akun' },
  { label: 'Tentang CaffiSense & Metodologi', path: '/about', icon: Info, badge: 'Edukasi' },
  { label: 'Halaman Beranda (Landing)', path: '/', icon: Home, badge: 'Utama' },
];

export default function SearchCommandModal({ isOpen, onClose }: SearchCommandModalProps) {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'pages' | 'coffee' | 'history'>('all');
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input on open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
    }
  }, [isOpen]);

  // Load history entries from localStorage for searching
  const historyRecords = useMemo(() => {
    try {
      const raw = localStorage.getItem('caffisense_assessment_history');
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }, [isOpen]);

  // Filtered pages
  const filteredPages = useMemo(() => {
    if (!query) return QUICK_PAGES;
    const q = query.toLowerCase();
    return QUICK_PAGES.filter(p => p.label.toLowerCase().includes(q) || p.badge.toLowerCase().includes(q));
  }, [query]);

  // Filtered beverages
  const filteredBeverages = useMemo(() => {
    if (!query) return BEVERAGE_DATABASE;
    const q = query.toLowerCase();
    return BEVERAGE_DATABASE.filter(b => 
      b.name.toLowerCase().includes(q) || 
      b.category.toLowerCase().includes(q) ||
      b.description.toLowerCase().includes(q)
    );
  }, [query]);

  // Filtered history records
  const filteredHistory = useMemo(() => {
    if (!query) return historyRecords.slice(0, 4);
    const q = query.toLowerCase();
    return historyRecords.filter(h => {
      const dateStr = h.date || h.assessment_date || '';
      const expStr = h.free_text_experience || '';
      const cupsStr = `${h.coffee_cups_per_day || 0} cangkir`;
      return dateStr.toLowerCase().includes(q) || expStr.toLowerCase().includes(q) || cupsStr.toLowerCase().includes(q);
    }).slice(0, 6);
  }, [query, historyRecords]);

  // Handle key shortcuts (ESC)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSelectPage = (path: string) => {
    navigate(path);
    onClose();
  };

  const handleSelectBeverage = (bev: BeveragePreset) => {
    navigate(`/diagnosis?presetMg=${bev.caffeineMg}&presetName=${encodeURIComponent(bev.name)}`);
    onClose();
  };

  const handleSelectHistory = (h: any) => {
    localStorage.setItem('assessmentResult', JSON.stringify(h));
    navigate('/insights');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-black/40 backdrop-blur-xs animate-fadeIn">
      <div 
        className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl border border-gray-200/80 overflow-hidden flex flex-col max-h-[80vh] animate-scaleUp"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Header Bar */}
        <div className="flex items-center px-4 py-3.5 border-b border-gray-100 gap-3">
          <Search className="w-5 h-5 text-gray-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ketik menu, nama kopi (Espresso, Latte), atau kata kunci riwayat..."
            className="flex-1 bg-transparent text-sm text-gray-900 font-medium placeholder-gray-400 outline-none"
          />
          {query && (
            <button 
              onClick={() => setQuery('')}
              className="w-5 h-5 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 flex items-center justify-center transition cursor-pointer"
            >
              <X className="w-3 h-3" />
            </button>
          )}
          <div className="flex items-center gap-1.5 text-[11px] text-gray-400 border border-gray-200 px-2 py-0.5 rounded-md font-mono shrink-0">
            <span>ESC</span>
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-1.5 px-4 py-2 bg-gray-50/70 border-b border-gray-100 overflow-x-auto text-xs">
          {[
            { key: 'all', label: 'Semua Hasil' },
            { key: 'pages', label: 'Halaman & Menu' },
            { key: 'coffee', label: 'Database Kafein' },
            { key: 'history', label: `Riwayat (${historyRecords.length})` }
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setSelectedCategory(tab.key as any)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer shrink-0 ${
                selectedCategory === tab.key
                  ? 'bg-gray-900 text-white shadow-2xs'
                  : 'text-gray-600 hover:bg-gray-200/60'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search Results List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-4 max-h-[60vh]">
          
          {/* Section: Pages Navigation */}
          {(selectedCategory === 'all' || selectedCategory === 'pages') && filteredPages.length > 0 && (
            <div className="space-y-1">
              <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400 px-3 py-1">
                Navigasi Cepat
              </div>
              {filteredPages.map((p) => {
                const Icon = p.icon;
                return (
                  <button
                    key={p.path}
                    onClick={() => handleSelectPage(p.path)}
                    className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-gray-50 transition text-left group cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-gray-100 group-hover:bg-gray-900 group-hover:text-white text-gray-600 flex items-center justify-center transition shrink-0">
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-gray-900 group-hover:text-gray-950">
                          {p.label}
                        </div>
                        <div className="text-[10px] text-gray-400">{p.path}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-medium bg-gray-100 text-gray-600 px-2 py-0.5 rounded-md">
                        {p.badge}
                      </span>
                      <ArrowRight className="w-3.5 h-3.5 text-gray-400 group-hover:text-gray-900 group-hover:translate-x-0.5 transition" />
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* Section: Beverage & Caffeine Lookup */}
          {(selectedCategory === 'all' || selectedCategory === 'coffee') && filteredBeverages.length > 0 && (
            <div className="space-y-1 pt-1 border-t border-gray-100">
              <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400 px-3 py-1 flex items-center justify-between">
                <span>Database Kafein Kopi ({filteredBeverages.length})</span>
                <span className="text-[9px] font-normal text-emerald-600">Klik untuk simulasikan ke Diagnosis</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                {filteredBeverages.map((bev) => (
                  <button
                    key={bev.id}
                    onClick={() => handleSelectBeverage(bev)}
                    className="flex items-center justify-between p-2.5 rounded-xl border border-gray-100 hover:border-gray-300 hover:bg-emerald-50/40 transition text-left group cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 border border-amber-200 flex items-center justify-center shrink-0">
                        <Coffee className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-gray-900 truncate group-hover:text-emerald-950">
                          {bev.name}
                        </div>
                        <div className="text-[10px] text-gray-400 truncate">{bev.serving} • {bev.category}</div>
                      </div>
                    </div>
                    <div className="text-right shrink-0 pl-2">
                      <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 rounded-md">
                        {bev.caffeineMg} mg
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Section: Assessment History Search */}
          {(selectedCategory === 'all' || selectedCategory === 'history') && filteredHistory.length > 0 && (
            <div className="space-y-1 pt-1 border-t border-gray-100">
              <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400 px-3 py-1">
                Riwayat Evaluasi Kafein
              </div>
              {filteredHistory.map((h, idx) => (
                <button
                  key={h.id || idx}
                  onClick={() => handleSelectHistory(h)}
                  className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-gray-50 transition text-left group cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200 flex items-center justify-center shrink-0">
                      <Clock className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-gray-900">
                        {h.date || h.assessment_date?.split(' ')[0] || 'Sesi Diagnosa'}
                      </div>
                      <div className="text-[10px] text-gray-400 truncate max-w-xs">
                        {h.free_text_experience || `${h.coffee_cups_per_day || 1} Cangkir (${h.coffee_size || 'Sedang'})`}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-gray-800">
                      {Math.round(h.estimated_caffeine_mg || 0)} mg
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 text-gray-400 group-hover:text-gray-900 transition" />
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Empty State */}
          {filteredPages.length === 0 && filteredBeverages.length === 0 && filteredHistory.length === 0 && (
            <div className="py-12 text-center text-gray-400 text-xs">
              <Search className="w-8 h-8 mx-auto mb-2 text-gray-300 stroke-1" />
              Tidak ditemukan hasil untuk "<strong className="text-gray-600">{query}</strong>".
            </div>
          )}

        </div>

        {/* Footer Quick Shortcuts */}
        <div className="px-4 py-2.5 bg-gray-50 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-400">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-white border border-gray-200 text-[10px] text-gray-600 font-mono">↵</kbd>
              <span>pilih</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-white border border-gray-200 text-[10px] text-gray-600 font-mono">ESC</kbd>
              <span>tutup</span>
            </span>
          </div>
          <div className="flex items-center gap-1 text-emerald-700 font-medium">
            <Zap className="w-3 h-3" />
            <span>CaffiSense Quick Palette</span>
          </div>
        </div>

      </div>
    </div>
  );
}
