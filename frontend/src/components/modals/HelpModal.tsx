import { useState } from 'react';
import { 
  HelpCircle, 
  X, 
  ChevronDown, 
  ChevronUp, 
  BookOpen, 
  MessageSquare, 
  ExternalLink, 
  Activity, 
  Moon, 
  Zap, 
  ShieldCheck 
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface FaqItem {
  question: string;
  answer: string;
  category: string;
}

const FAQS: FaqItem[] = [
  {
    question: 'Bagaimana CaffiSense menghitung grafik metabolisme kafein?',
    answer: 'CaffiSense mengaplikasikan model farmakokinetik eliminasi orde pertama (first-order elimination kinetics) dengan rumus: C(t) = C0 × (0.5)^(t / 5). Setiap 5 jam, konsentrasi kafein dalam aliran darah berkurang separuhnya.',
    category: 'Metodologi'
  },
  {
    question: 'Mengapa batas aman tidur ditetapkan pada angka <50 mg?',
    answer: 'Kafein adalah antagonis reseptor adenosin di otak. Kadar kafein di atas 50 mg dapat menunda timbulnya rasa kantuk alami dan secara signifikan mengurangi durasi tidur dalam fase gelombang lambat (Slow Wave Sleep / Deep Sleep).',
    category: 'Klinis & Tidur'
  },
  {
    question: 'Berapa batas aman konsumsi kafein menurut standar medis?',
    answer: 'Berdasarkan pedoman resmi US FDA dan Kementerian Kesehatan, batas aman harian untuk orang dewasa sehat adalah 400 mg per hari (~setara dengan 3-4 cangkir kopi sedang).',
    category: 'Pedoman FDA'
  },
  {
    question: 'Bagaimana cara membuka analisis rekap mingguan AI?',
    answer: 'Catat konsumsi kopi dan evaluasi tidur harianmu selama 7 hari berturut-turut pada form Diagnosis. Setelah siklus 7 hari tercapai, sistem AI akan menyajikan laporan komprehensif pola gaya hidupmu di menu Insights.',
    category: 'Fitur Aplikasi'
  },
  {
    question: 'Apakah hasil analisis ini menggantikan diagnosis dokter?',
    answer: 'Tidak. CaffiSense dirancang sebagai alat bantu pemantauan kebiasaan dan literasi kesehatan preventif (lifestyle tracking). Jika Anda memiliki riwayat aritmia, insomnia kronis, atau GERD berat, konsultasikan langsung dengan dokter spesialis.',
    category: 'Disclaimer'
  }
];

export default function HelpModal({ isOpen, onClose }: HelpModalProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  if (!isOpen) return null;

  const toggleFaq = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center sm:justify-start pt-16 sm:pt-20 sm:pl-72 px-4 bg-black/40 backdrop-blur-xs animate-fadeIn">
      <div 
        className="bg-white rounded-2xl w-full max-w-lg shadow-2xl border border-gray-200/80 overflow-hidden flex flex-col max-h-[85vh] animate-scaleUp"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-sky-50 text-sky-700 border border-sky-200 flex items-center justify-center">
              <HelpCircle className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-900">Pusat Bantuan & Edukasi</h3>
              <p className="text-[10px] text-gray-400">Panduan ilmiah farmakokinetik & FAQ</p>
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
        <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
          
          {/* Quick Guide Card */}
          <div className="bg-gray-50 p-4 rounded-xl border border-gray-200/80 space-y-2.5">
            <div className="flex items-center gap-2 font-bold text-gray-900 text-xs">
              <BookOpen className="w-4 h-4 text-emerald-600" />
              <span>Panduan Cepat 3 Indikator Utama</span>
            </div>
            <div className="grid grid-cols-3 gap-2 pt-1 text-[11px]">
              <div className="bg-white p-2.5 rounded-lg border border-gray-100 space-y-1">
                <div className="font-bold text-emerald-700 flex items-center gap-1">
                  <Moon className="w-3 h-3 text-emerald-600" />
                  <span>&lt; 50 mg</span>
                </div>
                <div className="text-[10px] text-gray-500">Batas aman masuk fase Deep Sleep.</div>
              </div>
              <div className="bg-white p-2.5 rounded-lg border border-gray-100 space-y-1">
                <div className="font-bold text-rose-700 flex items-center gap-1">
                  <Zap className="w-3 h-3 text-rose-600" />
                  <span>400 mg</span>
                </div>
                <div className="text-[10px] text-gray-500">Batas harian maksimal FDA.</div>
              </div>
              <div className="bg-white p-2.5 rounded-lg border border-gray-100 space-y-1">
                <div className="font-bold text-indigo-700 flex items-center gap-1">
                  <Activity className="w-3 h-3 text-indigo-600" />
                  <span>5 Jam</span>
                </div>
                <div className="text-[10px] text-gray-500">Siklus waktu paruh standar hati.</div>
              </div>
            </div>
          </div>

          {/* FAQ Accordion */}
          <div className="space-y-2">
            <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider px-1">
              Pertanyaan yang Sering Diajukan (FAQ)
            </div>

            {FAQS.map((faq, idx) => {
              const isOpen = openIndex === idx;
              return (
                <div 
                  key={idx}
                  className="border border-gray-200/80 rounded-xl overflow-hidden transition-all bg-white hover:border-gray-300"
                >
                  <button
                    type="button"
                    onClick={() => toggleFaq(idx)}
                    className="w-full p-3 text-left font-semibold text-gray-800 flex items-center justify-between gap-3 cursor-pointer"
                  >
                    <span className="text-xs">{faq.question}</span>
                    {isOpen ? (
                      <ChevronUp className="w-4 h-4 text-gray-400 shrink-0" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />
                    )}
                  </button>

                  {isOpen && (
                    <div className="px-3 pb-3 pt-1 text-[11px] text-gray-600 leading-relaxed border-t border-gray-50 bg-gray-50/40">
                      <p>{faq.answer}</p>
                      <div className="mt-2 flex items-center gap-1 text-[10px] text-gray-400">
                        <span className="bg-gray-100 px-1.5 py-0.5 rounded font-medium">{faq.category}</span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Contact Support & About Banner */}
          <div className="bg-emerald-50/60 border border-emerald-200/80 p-3.5 rounded-xl flex items-center justify-between gap-3">
            <div className="space-y-0.5">
              <div className="font-bold text-emerald-950 text-xs flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-emerald-700" />
                <span>Ingin Tahu Lebih Banyak?</span>
              </div>
              <div className="text-[11px] text-emerald-800">
                Baca metodologi riset lengkap & tim pengembang.
              </div>
            </div>
            <Link
              to="/about"
              onClick={onClose}
              className="bg-white text-emerald-900 border border-emerald-300 hover:bg-emerald-100/50 px-3 py-1.5 rounded-lg font-bold text-xs transition flex items-center gap-1 shrink-0 shadow-2xs"
            >
              <span>Tentang Kami</span>
              <ExternalLink className="w-3 h-3" />
            </Link>
          </div>

        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-400">
          <div className="flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-sky-600" />
            <span>CaffiSense Medical Literacy</span>
          </div>
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
