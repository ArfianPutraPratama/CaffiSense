import ReactMarkdown from 'react-markdown';
import {
  TrendingUp,
  ShieldCheck,
  FileText,
  Sparkles,
  Brain,
  Lightbulb,
  HeartPulse,
  Utensils
} from 'lucide-react';

interface AiAnalysisViewProps {
  content: string;
}

export default function AiAnalysisView({ content }: AiAnalysisViewProps) {
  if (!content) {
    return (
      <div className="p-8 bg-indigo-50/40 rounded-3xl text-center text-gray-500 text-xs flex flex-col sm:flex-row items-center justify-center gap-3 border border-indigo-200/60">
        <FileText className="w-5 h-5 text-indigo-500 animate-pulse" />
        <span className="font-semibold">Memuat rekomendasi dan evaluasi kesehatan personal...</span>
      </div>
    );
  }

  // Split text into distinct sections reliably
  const parseSections = (text: string) => {
    // Regex matching section numbers 1., 2., 3., 4. in markdown formats
    const sec1Idx = text.search(/(?:^|\n)\s*(?:###\s*)?(?:\*\*)?1\.\s*/i);
    const sec2Idx = text.search(/(?:^|\n)\s*(?:###\s*)?(?:\*\*)?2\.\s*/i);
    const sec3Idx = text.search(/(?:^|\n)\s*(?:###\s*)?(?:\*\*)?3\.\s*/i);
    const sec4Idx = text.search(/(?:^|\n)\s*(?:###\s*)?(?:\*\*)?4\.\s*/i);

    if (sec1Idx === -1 || sec2Idx === -1) {
      return null;
    }

    const intro = text.substring(0, sec1Idx).trim();
    const sec1 = (sec2Idx !== -1 ? text.substring(sec1Idx, sec2Idx) : text.substring(sec1Idx)).trim();
    const sec2 = (sec3Idx !== -1 ? text.substring(sec2Idx, sec3Idx) : (sec2Idx !== -1 ? text.substring(sec2Idx) : '')).trim();
    const sec3 = (sec4Idx !== -1 ? text.substring(sec3Idx, sec4Idx) : (sec3Idx !== -1 ? text.substring(sec3Idx) : '')).trim();
    const sec4 = sec4Idx !== -1 ? text.substring(sec4Idx).trim() : '';

    return { intro, sec1, sec2, sec3, sec4 };
  };

  const sections = parseSections(content);

  // High-Contrast, Clean Markdown Components
  const customMarkdownComponents = {
    h1: ({ children }: any) => (
      <h3 className="text-sm font-black text-gray-900 mb-2 tracking-tight">{children}</h3>
    ),
    h2: ({ children }: any) => (
      <h4 className="text-xs font-black text-gray-900 mb-2 tracking-tight">{children}</h4>
    ),
    h3: ({ children }: any) => (
      <h5 className="text-xs font-bold text-gray-900 mb-1">{children}</h5>
    ),
    strong: ({ children }: any) => (
      <strong className="font-black text-gray-950 bg-amber-100/90 text-amber-950 px-1.5 py-0.5 rounded-md text-[11.5px] inline-block my-0.5 shadow-2xs">
        {children}
      </strong>
    ),
    p: ({ children }: any) => (
      <p className="text-gray-700 text-xs sm:text-[13px] leading-relaxed mb-2.5 font-medium">{children}</p>
    ),
    ul: ({ children }: any) => (
      <ul className="space-y-2.5 mb-2">{children}</ul>
    ),
    li: ({ children }: any) => (
      <li className="flex items-start gap-2.5 text-xs sm:text-[13px] text-gray-800 bg-white/95 hover:bg-white p-3.5 rounded-2xl border border-gray-200/80 shadow-2xs transition-all">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-2 flex-shrink-0" />
        <div className="flex-1 leading-relaxed font-medium">{children}</div>
      </li>
    ),
    blockquote: ({ children }: any) => (
      <div className="bg-amber-50/80 border-l-4 border-amber-500 p-3.5 rounded-r-2xl my-2 text-xs text-amber-950 font-medium">
        {children}
      </div>
    ),
  };

  if (sections) {
    return (
      <div className="space-y-6">
        
        {/* ─── EXECUTIVE SUMMARY CARD (Ringkasan Pembuka) ─── */}
        {sections.intro && (
          <div className="bg-gradient-to-r from-orange-50 via-amber-50 to-orange-50/60 p-5 sm:p-6 rounded-3xl border border-orange-200/80 shadow-xs space-y-2">
            <div className="flex items-center gap-2 text-xs font-black text-orange-900 uppercase tracking-wider">
              <Sparkles className="w-4 h-4 text-orange-600" />
              <span>Ringkasan Evaluasi Fisiologis AI</span>
            </div>
            <div className="text-xs sm:text-[13px] text-gray-800 leading-relaxed font-medium">
              <ReactMarkdown components={customMarkdownComponents}>{sections.intro}</ReactMarkdown>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════
            2 KONTAINER SEJAJAR: KIRI (1 & 4) & KANAN (2 & 3)
        ═══════════════════════════════════════════════════════════════ */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          
          {/* ─── KONTAINER SEBELAH KIRI ─── */}
          <div className="bg-gradient-to-b from-white via-indigo-50/15 to-purple-50/20 rounded-3xl p-6 sm:p-7 border border-indigo-100/80 shadow-xs space-y-5">
            
            {/* Bagian 1: Analisis Pola Kafein, Makanan, Olahraga & Metabolisme Rokok */}
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3.5 border-b border-indigo-100/80">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-bold shadow-sm">
                    <Utensils className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-black text-gray-900 leading-snug">
                      1. Analisis Pola Kafein, Makanan, Olahraga & Rokok
                    </h3>
                    <span className="text-[10px] font-bold text-indigo-700">Metabolisme Enzim CYP1A2 & Lambung</span>
                  </div>
                </div>
                <span className="text-[9px] font-extrabold uppercase tracking-wider bg-indigo-100 text-indigo-800 px-2.5 py-1 rounded-full border border-indigo-200/60 shrink-0">
                  Sebelah Kiri
                </span>
              </div>

              <div className="text-xs sm:text-[13px] text-gray-700 leading-relaxed space-y-2">
                <ReactMarkdown components={customMarkdownComponents}>
                  {sections.sec1.replace(/^(?:###\s*)?(?:\*\*)?1\.\s*.*?\n/, '')}
                </ReactMarkdown>
              </div>
            </div>

            {/* Bagian 4: Saran Praktis & Rekomendasi Pemulihan */}
            {sections.sec4 && (
              <div className="pt-4 border-t border-indigo-100/80 space-y-3">
                <div className="flex items-center justify-between pb-2.5">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
                      <Lightbulb className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-gray-900 uppercase tracking-wide">
                        4. Solusi, Penanganan Cepat & Pemulihan
                      </h4>
                      <span className="text-[10px] font-bold text-purple-700">Saran Kebiasaan, Pertolongan Darurat & Reset Esok</span>
                    </div>
                  </div>
                  <span className="text-[9px] font-extrabold bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full">
                    Solusi & Penanganan
                  </span>
                </div>

                <div className="text-xs sm:text-[13px] text-gray-700 leading-relaxed">
                  <ReactMarkdown components={customMarkdownComponents}>
                    {sections.sec4.replace(/^(?:###\s*)?(?:\*\*)?4\.\s*.*?\n/, '')}
                  </ReactMarkdown>
                </div>
              </div>
            )}

            {/* Banner Reminder Evaluasi */}
            <div className="bg-emerald-50/90 border border-emerald-200 rounded-2xl p-4 flex items-start gap-3 shadow-2xs">
              <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-2xs mt-0.5">
                <Brain className="w-4 h-4" />
              </div>
              <div className="space-y-0.5">
                <span className="font-black text-gray-900 text-xs block">Panduan Evaluasi Pola Hidup:</span>
                <p className="text-[11px] text-gray-600 leading-relaxed">
                  Gunakan data waktu paruh kafein dan asupan air putih untuk menjaga kualitas fase <em>Deep Sleep</em> malam ini.
                </p>
              </div>
            </div>

          </div>

          {/* ─── KONTAINER SEBELAH KANAN ─── */}
          <div className="bg-gradient-to-b from-white via-emerald-50/15 to-blue-50/20 rounded-3xl p-6 sm:p-7 border border-emerald-100/80 shadow-xs space-y-5">
            
            {/* Bagian 2: Dampak Sirkadian & Risiko Organ */}
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3.5 border-b border-emerald-100/80">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-bold shadow-sm">
                    <HeartPulse className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-black text-gray-900 leading-snug">
                      2. Dampak Sirkadian & Risiko Organ
                    </h3>
                    <span className="text-[10px] font-bold text-emerald-700">Reseptor Adenosin, Jantung & Lambung</span>
                  </div>
                </div>
                <span className="text-[9px] font-extrabold uppercase tracking-wider bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-full border border-emerald-200/60 shrink-0">
                  Sebelah Kanan
                </span>
              </div>

              <div className="text-xs sm:text-[13px] text-gray-700 leading-relaxed space-y-2">
                <ReactMarkdown components={customMarkdownComponents}>
                  {sections.sec2.replace(/^(?:###\s*)?(?:\*\*)?2\.\s*.*?\n/, '')}
                </ReactMarkdown>
              </div>
            </div>

            {/* Bagian 3: Statistik Edukasi Risiko Penyakit */}
            {sections.sec3 && (
              <div className="pt-4 border-t border-emerald-100/80 space-y-3">
                <div className="flex items-center justify-between pb-2.5">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                      <TrendingUp className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-gray-900 uppercase tracking-wide">
                        3. Statistik Edukasi Risiko Penyakit
                      </h4>
                      <span className="text-[10px] font-bold text-blue-700">Rujukan & Benchmark Medis</span>
                    </div>
                  </div>
                  <span className="text-[9px] font-extrabold bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                    Statistik
                  </span>
                </div>

                <div className="text-xs sm:text-[13px] text-gray-700 leading-relaxed">
                  <ReactMarkdown components={customMarkdownComponents}>
                    {sections.sec3.replace(/^(?:###\s*)?(?:\*\*)?3\.\s*.*?\n/, '')}
                  </ReactMarkdown>
                </div>
              </div>
            )}

            {/* Medical Disclaimer Box */}
            <div className="bg-gray-100/70 p-3.5 rounded-2xl border border-gray-200/60 flex items-center gap-2.5 text-gray-600 text-[11px] leading-relaxed">
              <ShieldCheck className="w-4 h-4 text-gray-500 shrink-0" />
              <span>
                <strong>Catatan Medis:</strong> Informasi di atas disusun secara edukatif berdasarkan farmakokinetik kafein. Konsultasikan dengan dokter jika Anda memiliki keluhan berkepanjangan.
              </span>
            </div>

          </div>

        </div>

      </div>
    );
  }

  // Fallback layout
  return (
    <div className="space-y-3 bg-white p-6 sm:p-7 rounded-3xl border border-gray-200 shadow-sm">
      <ReactMarkdown components={customMarkdownComponents}>{content}</ReactMarkdown>
    </div>
  );
}
