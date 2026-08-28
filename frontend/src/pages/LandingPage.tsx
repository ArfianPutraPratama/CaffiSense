import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Coffee,
  Moon,
  Activity,
  ArrowRight,
  Sparkles,
  HeartPulse,
  Clock,
  Zap,
  LogIn,
  UserPlus,
  LogOut,
  Brain,
  TrendingDown,
  ShieldCheck,
  ChevronDown,
  AlertTriangle,
  BarChart3,
  Bot,
  Calendar,
  ShieldAlert,
  Gauge,
  BedDouble,
  SlidersHorizontal,
  Layers
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import CoffeeCanvas3D from "../components/CoffeeCanvas3D";

function useScrollAnimation(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setIsVisible(true);
      },
      { threshold }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [threshold]);
  return { ref, isVisible };
}

function AnimatedCounter({
  target,
  suffix = "",
  duration = 1800
}: {
  target: number;
  suffix?: string;
  duration?: number;
}) {
  const [count, setCount] = useState(0);
  const { ref, isVisible } = useScrollAnimation(0.4);
  useEffect(() => {
    if (!isVisible) return;
    let start = 0;
    const increment = target / (duration / 16);
    const timer = setInterval(() => {
      start += increment;
      if (start >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);
    return () => clearInterval(timer);
  }, [isVisible, target, duration]);
  return <span ref={ref}>{count}{suffix}</span>;
}

export default function LandingPage() {
  const navigate = useNavigate();
  const { isAuthenticated, logout } = useAuth();
  const [isHovered, setIsHovered] = useState(false);
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const onScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleStartCheck = () => {
    if (isAuthenticated) {
      navigate("/diagnosis");
      return;
    }
    const hasRegistered = localStorage.getItem("caffisense_has_registered") === "true";
    if (hasRegistered) {
      navigate("/login");
      return;
    }
    navigate("/register");
  };

  const statsSection = useScrollAnimation();
  const howSection = useScrollAnimation();
  const featuresSection = useScrollAnimation();
  const riskSection = useScrollAnimation();
  const ctaSection = useScrollAnimation();

  return (
    <>
      <style>{`
        @keyframes floatChip {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        @keyframes pulseGlow {
          0%, 100% { box-shadow: 0 0 0 0 rgba(234, 88, 12, 0.4); }
          50% { box-shadow: 0 0 0 12px rgba(234, 88, 12, 0); }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(32px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideRight {
          from { opacity: 0; transform: translateX(-40px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes shimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        .anim-chip-1 { animation: floatChip 3.8s ease-in-out infinite; }
        .anim-chip-2 { animation: floatChip 4.2s ease-in-out infinite 1s; }
        .anim-chip-3 { animation: floatChip 3.6s ease-in-out infinite 2s; }
        .anim-slide-up { animation: slideUp 0.7s cubic-bezier(0.16, 1, 0.3, 1) both; }
        .anim-slide-right { animation: slideRight 0.7s cubic-bezier(0.16, 1, 0.3, 1) both; }
        .anim-fade-in { animation: fadeIn 0.8s ease both; }
        .delay-1 { animation-delay: 0.08s; }
        .delay-2 { animation-delay: 0.16s; }
        .delay-3 { animation-delay: 0.24s; }
        .delay-4 { animation-delay: 0.32s; }
        .delay-5 { animation-delay: 0.40s; }
        .shimmer-text {
          background: linear-gradient(90deg, #c2410c, #ea580c, #f97316, #ea580c, #c2410c);
          background-size: 200% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: shimmer 4s linear infinite;
        }
        .hover-lift {
          transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.25s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .hover-lift:hover {
          transform: translateY(-5px);
          box-shadow: 0 20px 35px -10px rgba(0, 0, 0, 0.08);
        }
      `}</style>

      <div className="min-h-screen bg-[#f7f7f3] text-gray-900 flex flex-col font-sans selection:bg-orange-200 selection:text-orange-950 overflow-x-hidden">
        {/* ─── NAVIGATION BAR ─── */}
        <header className="h-20 px-6 sm:px-12 flex items-center justify-between border-b border-gray-200/70 bg-[#f7f7f3]/90 backdrop-blur-md sticky top-0 z-40">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-2xl bg-orange-600 flex items-center justify-center text-white shadow-md shadow-orange-500/20 group-hover:scale-105 transition">
              <Coffee className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-black tracking-tight text-gray-950 leading-none">
                Caffi<span className="text-orange-600">Sense</span>
              </span>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">
                Metabolic & Sleep Intelligence
              </span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-8 text-xs font-bold text-gray-600">
            <a href="#how-it-works" className="hover:text-orange-600 transition">Cara Kerja</a>
            <a href="#features" className="hover:text-orange-600 transition">Fitur Skrining</a>
            <a href="#risks" className="hover:text-orange-600 transition flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5 text-amber-500" />
              <span>Risiko Kafein</span>
            </a>
            <a href="#sdg3" className="hover:text-orange-600 transition flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>SDG 3 Health</span>
            </a>
          </nav>

          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <div className="flex items-center gap-3">
                <Link
                  to="/diagnosis"
                  className="bg-gray-950 text-white px-5 py-2.5 rounded-full text-xs font-bold hover:bg-orange-600 transition shadow-sm flex items-center gap-2"
                >
                  <Activity className="w-3.5 h-3.5" />
                  <span>Buka Dashboard</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
                <button
                  onClick={() => logout()}
                  title="Keluar"
                  className="w-9 h-9 rounded-full bg-white border border-gray-200 text-gray-400 hover:text-red-500 hover:bg-red-50 flex items-center justify-center transition"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="text-xs font-bold text-gray-700 hover:text-gray-950 px-4 py-2 rounded-full hover:bg-gray-200/60 transition flex items-center gap-1.5"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Masuk</span>
                </Link>
                <Link
                  to="/register"
                  className="bg-orange-600 text-white text-xs font-bold px-5 py-2.5 rounded-full hover:bg-orange-700 transition shadow-sm shadow-orange-600/20 flex items-center gap-1.5"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Daftar Gratis</span>
                </Link>
              </div>
            )}
          </div>
        </header>

        {/* ─── HERO SECTION WITH 3D COFFEE CANVAS ─── */}
        <section className="relative px-6 sm:px-12 pt-10 pb-20 overflow-hidden">
          {/* Ambient background glows */}
          <div
            className="absolute top-[-5%] right-[-5%] w-[550px] h-[550px] bg-orange-300/20 rounded-full blur-[110px] pointer-events-none"
            style={{ transform: `translateY(${scrollY * 0.18}px)` }}
          />
          <div
            className="absolute bottom-[-15%] left-[-5%] w-[600px] h-[600px] bg-amber-200/15 rounded-full blur-[130px] pointer-events-none"
            style={{ transform: `translateY(${-scrollY * 0.1}px)` }}
          />

          <div className="max-w-7xl mx-auto grid lg:grid-cols-12 gap-12 items-center min-h-[82vh]">
            {/* LEFT COLUMN */}
            <div className="lg:col-span-7 space-y-7 z-10">
              <div className="anim-slide-right delay-1">
                <div className="inline-flex items-center gap-2.5 bg-white/95 border border-gray-200/80 px-4 py-1.5 rounded-full text-xs font-bold text-gray-700 shadow-xs">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span className="text-gray-900 font-extrabold">SDG 3: Good Health</span>
                  <span className="text-gray-300">•</span>
                  <span className="text-orange-600 font-bold">Caffeine & Circadian Science</span>
                </div>
              </div>

              <h1 className="text-4xl sm:text-6xl font-black text-gray-950 tracking-tight leading-[1.08] anim-slide-right delay-2">
                Kenali kebiasaan kopimu.{" "}
                <span className="shimmer-text">Pahami ritme tidurmu.</span>
              </h1>

              <p className="text-base text-gray-600 max-w-xl leading-relaxed font-medium anim-slide-right delay-3">
                Lacak estimasi kafein secara real-time, pantau kurva waktu paruh eliminasi hati (T½ ~5 jam), dan ketahui waktu aman tidurmu agar otak siap memasuki fase <em>Deep Sleep</em> secara optimal.
              </p>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 anim-slide-right delay-4 pt-1">
                <button
                  onClick={handleStartCheck}
                  onMouseEnter={() => setIsHovered(true)}
                  onMouseLeave={() => setIsHovered(false)}
                  className="bg-gray-950 text-white px-8 py-4 rounded-full font-black text-sm hover:bg-orange-600 transition-all shadow-xl shadow-gray-950/10 flex items-center justify-center gap-3 cursor-pointer"
                >
                  <Activity className="w-4 h-4 text-orange-400" />
                  <span>Mulai Cek Pola Kopi</span>
                  <ArrowRight
                    className={`w-4 h-4 transition-transform duration-300 ${
                      isHovered ? "translate-x-1.5" : ""
                    }`}
                  />
                </button>
                <a
                  href="#how-it-works"
                  className="bg-white text-gray-800 border border-gray-200 px-7 py-4 rounded-full font-bold text-sm hover:bg-gray-50 transition flex items-center justify-center gap-2 shadow-xs"
                >
                  <span>Pelajari Cara Kerja</span>
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                </a>
              </div>

              <div className="flex flex-wrap items-center gap-6 text-xs font-semibold text-gray-500 anim-slide-right delay-5 pt-2 border-t border-gray-200/60">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 stroke-[2.2]" />
                  <span>Standar FDA (Batas 400mg)</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-orange-600 stroke-[2.2]" />
                  <span>Waktu Paruh ~5 Jam</span>
                </div>
                <div className="flex items-center gap-2">
                  <Brain className="w-4 h-4 text-purple-600 stroke-[2.2]" />
                  <span>Analisis AI Edukatif</span>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: 3D THREE.JS COFFEE & FLOATING SCIENTIFIC METRICS */}
            <div className="lg:col-span-5 relative flex items-center justify-center anim-fade-in delay-3">
              {/* Glow background */}
              <div className="absolute inset-0 rounded-full bg-orange-400/15 blur-3xl scale-125 pointer-events-none" />

              {/* 3D Three.js Interactive Canvas */}
              <div className="relative w-full max-w-[440px] flex items-center justify-center">
                <CoffeeCanvas3D scrollY={scrollY} />

                {/* Floating Metric 1: Live Caffeine Level */}
                <div className="absolute -top-3 right-0 sm:right-2 bg-white/95 backdrop-blur-md rounded-2xl shadow-xl shadow-gray-200/60 border border-gray-200/80 p-3.5 text-left w-44 hover-lift anim-chip-1 pointer-events-auto">
                  <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wide flex items-center gap-1.5 mb-0.5">
                    <Zap className="w-3.5 h-3.5 text-amber-500" />
                    <span>Kafein Aktif</span>
                  </div>
                  <div className="text-2xl font-black text-gray-900">190 mg</div>
                  <div className="text-[10px] text-emerald-600 font-extrabold mt-0.5 flex items-center gap-1">
                    <TrendingDown className="w-3 h-3" />
                    <span>Luruh &lt;50mg jam 01:00</span>
                  </div>
                </div>

                {/* Floating Metric 2: Sleep Readiness Target */}
                <div className="absolute bottom-6 right-0 sm:-right-2 bg-white/95 backdrop-blur-md rounded-2xl shadow-xl shadow-gray-200/60 border border-gray-200/80 p-3.5 text-left w-40 hover-lift anim-chip-2 pointer-events-auto">
                  <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wide flex items-center gap-1.5 mb-0.5">
                    <Moon className="w-3.5 h-3.5 text-purple-500" />
                    <span>Aman Tidur</span>
                  </div>
                  <div className="text-2xl font-black text-purple-700">01:00</div>
                  <div className="text-[10px] text-gray-500 font-medium">Deep Sleep Ready</div>
                </div>

                {/* Floating Metric 3: Elimination Half-life */}
                <div className="absolute bottom-2 left-0 sm:-left-2 bg-white/95 backdrop-blur-md rounded-2xl shadow-xl shadow-gray-200/60 border border-gray-200/80 p-3.5 text-left w-40 hover-lift anim-chip-3 pointer-events-auto">
                  <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wide flex items-center gap-1.5 mb-0.5">
                    <Clock className="w-3.5 h-3.5 text-orange-500" />
                    <span>Waktu Paruh</span>
                  </div>
                  <div className="text-2xl font-black text-gray-900">T½ 5 Jam</div>
                  <div className="text-[10px] text-gray-500 font-medium">Metabolisme Hati</div>
                </div>
              </div>
            </div>
          </div>

          {/* Scroll Down Indicator */}
          <div className="flex justify-center mt-8">
            <a
              href="#stats"
              className="flex flex-col items-center gap-1 text-gray-400 hover:text-gray-700 transition"
            >
              <span className="text-[10px] font-extrabold uppercase tracking-widest">Jelajahi Fitur</span>
              <ChevronDown className="w-4 h-4 animate-bounce" />
            </a>
          </div>
        </section>

        {/* ─── CLINICAL STATS BAR ─── */}
        <section id="stats" className="py-16 px-6 sm:px-12 bg-gray-950 text-white">
          <div
            ref={statsSection.ref}
            className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center"
          >
            {[
              {
                icon: ShieldCheck,
                target: 400,
                suffix: "mg",
                label: "Batas Maksimal Harian Aman (FDA)",
                color: "text-orange-400"
              },
              {
                icon: Clock,
                target: 5,
                suffix: " Jam",
                label: "Waktu Paruh Eliminasi Alami Hati",
                color: "text-amber-400"
              },
              {
                icon: BedDouble,
                target: 50,
                suffix: "mg",
                label: "Batas Kafein Ideal Memulai Deep Sleep",
                color: "text-emerald-400"
              },
              {
                icon: Zap,
                target: 95,
                suffix: "%",
                label: "Kafein Terserap Cepat dalam 45 Menit",
                color: "text-purple-400"
              }
            ].map((stat, i) => {
              const Icon = stat.icon;
              return (
                <div
                  key={stat.label}
                  className={`space-y-2 hover-lift ${statsSection.isVisible ? "anim-slide-up" : "opacity-0"}`}
                  style={{ animationDelay: `${i * 0.12}s` }}
                >
                  <div className="w-10 h-10 rounded-2xl bg-white/5 border border-white/10 mx-auto flex items-center justify-center text-gray-300 mb-2">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className={`text-3xl sm:text-4xl font-black ${stat.color}`}>
                    {statsSection.isVisible ? (
                      <AnimatedCounter target={stat.target} suffix={stat.suffix} />
                    ) : (
                      `0${stat.suffix}`
                    )}
                  </div>
                  <div className="text-xs text-gray-400 font-medium leading-relaxed max-w-[200px] mx-auto">
                    {stat.label}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ─── HOW IT WORKS SECTION ─── */}
        <section id="how-it-works" className="py-24 px-6 sm:px-12 bg-white border-t border-gray-200/80">
          <div ref={howSection.ref} className="max-w-5xl mx-auto space-y-16">
            <div className={`text-center space-y-3 ${howSection.isVisible ? "anim-slide-up" : "opacity-0"}`}>
              <div className="inline-flex items-center gap-1.5 text-xs font-bold text-orange-600 uppercase tracking-widest bg-orange-50 px-3.5 py-1 rounded-full border border-orange-100">
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>Alur Skrining 3 Langkah</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-black text-gray-950 tracking-tight">
                Cara Kerja CaffiSense
              </h2>
              <p className="text-sm text-gray-500 max-w-lg mx-auto leading-relaxed">
                Metode terukur dan berbasis data medis untuk memetakan bagaimana tubuhmu memproses stimulan setiap hari.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  icon: Coffee,
                  step: "01",
                  title: "Catat Sesi Kopi",
                  desc: "Masukkan jumlah cangkir, ukuran gelas, serta jam terakhir konsumsi kopimu dengan antarmuka yang simpel dan cepat.",
                  badge: "Input Cepat",
                  color: "amber"
                },
                {
                  icon: Activity,
                  step: "02",
                  title: "Simulasi Kurva Waktu Paruh",
                  desc: "Sistem memetakan kurva eliminasi farmakokinetik secara matematis hingga kafein turun di bawah ambang batas tidur 50mg.",
                  badge: "Kalkulasi Akurat",
                  color: "emerald"
                },
                {
                  icon: Brain,
                  step: "03",
                  title: "Diagnosis & Rekomendasi AI",
                  desc: "Terima hasil analisis dampak tidur dari Machine Learning dan saran personal gaya hidup cerdas dari Gemini AI.",
                  badge: "AI Powered",
                  color: "purple"
                }
              ].map((item, i) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.step}
                    className={`bg-[#f9faf6] rounded-3xl p-8 border border-gray-200/80 space-y-5 relative hover-lift cursor-default ${
                      howSection.isVisible ? "anim-slide-up" : "opacity-0"
                    }`}
                    style={{ animationDelay: `${0.15 + i * 0.12}s` }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="w-12 h-12 rounded-2xl bg-white border border-gray-200/80 text-gray-900 flex items-center justify-center shadow-xs">
                        <Icon className="w-6 h-6 stroke-[2]" />
                      </div>
                      <span className="text-3xl font-black text-gray-300/80 select-none">
                        {item.step}
                      </span>
                    </div>

                    <div className="space-y-2">
                      <div className="text-[10px] font-extrabold uppercase tracking-widest text-orange-600">
                        {item.badge}
                      </div>
                      <h3 className="text-xl font-black text-gray-900">{item.title}</h3>
                      <p className="text-xs text-gray-600 leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className={`text-center ${howSection.isVisible ? "anim-slide-up" : "opacity-0"}`} style={{ animationDelay: "0.5s" }}>
              <button
                onClick={handleStartCheck}
                className="bg-gray-950 text-white px-8 py-4 rounded-full font-bold text-xs hover:bg-orange-600 transition shadow-md inline-flex items-center gap-2 cursor-pointer"
              >
                <span>Mulai Skrining Sekarang</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </section>

        {/* ─── COMPREHENSIVE FEATURES GRID ─── */}
        <section id="features" className="py-24 px-6 sm:px-12 bg-[#f7f7f3]">
          <div ref={featuresSection.ref} className="max-w-6xl mx-auto space-y-14">
            <div className={`text-center space-y-3 ${featuresSection.isVisible ? "anim-slide-up" : "opacity-0"}`}>
              <div className="inline-flex items-center gap-1.5 text-xs font-bold text-purple-700 uppercase tracking-widest bg-purple-50 px-3.5 py-1 rounded-full border border-purple-100">
                <Layers className="w-3.5 h-3.5" />
                <span>Teknologi &amp; Fitur Unggulan</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-black text-gray-950 tracking-tight">
                Solusi Menyeluruh untuk Kualitas Istirahat
              </h2>
              <p className="text-sm text-gray-500 max-w-lg mx-auto">
                Kombinasi sains medis, kecerdasan buatan, dan pelacakan kebiasaan harian dalam satu platform modern.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                {
                  icon: BarChart3,
                  title: "Grafik Real-time Decay",
                  desc: "Visualisasikan kurva eliminasi kafein secara interaktif berdasarkan rumus eksponensial farmakokinetik waktu paruh 5 jam.",
                  badge: "Visualizer"
                },
                {
                  icon: Brain,
                  title: "Analisis Gemini AI",
                  desc: "Dapatkan penjelasan medis naratif dan saran actionable yang disesuaikan dengan pola konsumsi dan jam tidur unikmu.",
                  badge: "Generative AI"
                },
                {
                  icon: Bot,
                  title: "Prediksi Machine Learning",
                  desc: "Algoritma klasifikasi mengevaluasi risiko gangguan tidur dan tingkat keparahan dampak kafein terhadap fase REM.",
                  badge: "Predictive ML"
                },
                {
                  icon: Calendar,
                  title: "Riwayat Sesi & Log Harian",
                  desc: "Pantau tren konsumsi kafeinmu dari hari ke hari dan lihat riwayat penilaian sebelumnya tanpa kehilangan data.",
                  badge: "History Log"
                },
                {
                  icon: ShieldAlert,
                  title: "Peringatan Batas FDA",
                  desc: "Deteksi dini saat konsumsi kafein mendekati atau melampaui batas aman harian 400mg untuk mencegah efek samping fisik.",
                  badge: "Safety Alert"
                },
                {
                  icon: BedDouble,
                  title: "Kalkulator Jam Tidur Aman",
                  desc: "Menghitung secara presisi jam kapan kadar kafein di pembuluh darahmu berada di zona aman (&lt;50mg) untuk terlelap nyenyak.",
                  badge: "Circadian Sync"
                }
              ].map((feature, i) => {
                const Icon = feature.icon;
                return (
                  <div
                    key={feature.title}
                    className={`bg-white border border-gray-200/80 rounded-3xl p-6 space-y-4 hover-lift cursor-default ${
                      featuresSection.isVisible ? "anim-slide-up" : "opacity-0"
                    }`}
                    style={{ animationDelay: `${0.08 + i * 0.08}s` }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="w-11 h-11 rounded-2xl bg-orange-50 border border-orange-100 flex items-center justify-center text-orange-600">
                        <Icon className="w-5 h-5 stroke-[2]" />
                      </div>
                      <span className="text-[10px] font-extrabold uppercase tracking-widest bg-gray-50 border border-gray-200/80 px-2.5 py-1 rounded-full text-gray-500">
                        {feature.badge}
                      </span>
                    </div>
                    <div className="space-y-1.5">
                      <h3 className="text-base font-black text-gray-900">{feature.title}</h3>
                      <p className="text-xs text-gray-600 leading-relaxed">{feature.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ─── CAFFEINE CYCLE & HEALTH EDUCATION TIMELINE ─── */}
        <section id="risks" className="py-24 px-6 sm:px-12 bg-white border-t border-gray-200/80">
          <div ref={riskSection.ref} className="max-w-5xl mx-auto space-y-14">
            <div className={`text-center space-y-3 ${riskSection.isVisible ? "anim-slide-up" : "opacity-0"}`}>
              <div className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-700 uppercase tracking-widest bg-amber-50 px-3.5 py-1 rounded-full border border-amber-100">
                <Gauge className="w-3.5 h-3.5" />
                <span>Edukasi Siklus Stimulan</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-black text-gray-950 tracking-tight">
                Kronologi Kafein di Dalam Tubuh
              </h2>
              <p className="text-sm text-gray-500 max-w-lg mx-auto leading-relaxed">
                Memahami fase penyerapan hingga eliminasi kafein adalah langkah awal menjaga kesehatan ritme sirkadian.
              </p>
            </div>

            <div className="relative">
              {/* Vertical connecting line */}
              <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-0.5 bg-gray-200 -translate-x-1/2" />

              {[
                {
                  time: "0 – 15 Menit",
                  icon: Coffee,
                  side: "left",
                  title: "Penyerapan Cepat di Saluran Cerna",
                  desc: "Kafein mulai diserap melalui lambung dan usus halus, lalu segera beredar melalui aliran darah ke seluruh organ utama."
                },
                {
                  time: "15 – 45 Menit",
                  icon: Zap,
                  side: "right",
                  title: "Puncak Konsentrasi & Blokade Adenosin",
                  desc: "Kadar kafein mencapai puncak di plasma darah. Molekulnya memblokir reseptor adenosin di otak, menunda sinyal rasa lelah dan kantuk."
                },
                {
                  time: "1 – 5 Jam",
                  icon: TrendingDown,
                  side: "left",
                  title: "Fase Waktu Paruh Metabolisme",
                  desc: "Enzim hati (CYP1A2) memecah kafein. Setelah 5 jam, rata-rata 50% dosis awal masih beredar aktif di dalam tubuhmu."
                },
                {
                  time: "6 – 12 Jam",
                  icon: Moon,
                  side: "right",
                  title: "Residu Kafein & Dampak Deep Sleep",
                  desc: "Jika sisa kafein masih di atas 50mg saat jam tidur, fase tidur gelombang lambat (Deep Sleep) dapat terdistorsi meski kamu bisa terpejam."
                },
                {
                  time: "&gt; 400 mg / Hari",
                  icon: AlertTriangle,
                  side: "left",
                  title: "Ambang Batas Kelebihan Dosis",
                  desc: "Konsumsi melebihi 400mg per hari berisiko memicu palpitasi jantung, kecemasan, gangguan lambung, dan desensitisasi reseptor otak."
                }
              ].map((item, i) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.time}
                    className={`flex items-center gap-8 mb-10 ${
                      item.side === "right" ? "md:flex-row-reverse" : ""
                    } flex-col md:flex-row ${
                      riskSection.isVisible ? "anim-slide-up" : "opacity-0"
                    }`}
                    style={{ animationDelay: `${0.1 + i * 0.12}s` }}
                  >
                    <div
                      className={`flex-1 ${
                        item.side === "right" ? "md:text-right" : "md:text-left"
                      } text-left`}
                    >
                      <span className="inline-block text-[11px] font-extrabold uppercase tracking-widest text-orange-700 bg-orange-50 border border-orange-100 px-3 py-1 rounded-full mb-2.5">
                        {item.time}
                      </span>
                      <h3 className="text-lg font-black text-gray-900 mb-1.5">{item.title}</h3>
                      <p className="text-xs text-gray-600 leading-relaxed">{item.desc}</p>
                    </div>

                    <div className="relative z-10 shrink-0 w-12 h-12 bg-white rounded-2xl border-2 border-gray-200 flex items-center justify-center text-gray-800 shadow-sm">
                      <Icon className="w-5 h-5" />
                    </div>

                    <div className="flex-1 hidden md:block" />
                  </div>
                );
              })}
            </div>

            {/* Medical Disclaimer Box */}
            <div
              className={`bg-amber-50/60 border border-amber-200/80 rounded-3xl p-6 flex items-start gap-4 ${
                riskSection.isVisible ? "anim-slide-up" : "opacity-0"
              }`}
              style={{ animationDelay: "0.7s" }}
            >
              <div className="w-9 h-9 rounded-2xl bg-amber-500 text-white flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="space-y-1 text-xs">
                <div className="font-extrabold text-amber-900 text-sm">Pemberitahuan Medis &amp; Edukasi</div>
                <p className="text-amber-800 leading-relaxed">
                  CaffiSense merupakan sarana skrining edukatif berbasis parameter farmakokinetik umum. Laju metabolisme kafein setiap individu dapat dipengaruhi oleh faktor genetik, usia, obat-obatan, dan kondisi kesehatan. Aplikasi ini tidak menggantikan konsultasi medis langsung dengan dokter.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ─── SDG 3 SECTION ─── */}
        <section id="sdg3" className="py-20 px-6 sm:px-12 bg-[#f7f7f3] border-t border-gray-200/80">
          <div className="max-w-4xl mx-auto bg-white rounded-3xl p-8 sm:p-10 border border-gray-200/80 shadow-sm flex flex-col md:flex-row items-center gap-8 hover-lift">
            <div className="w-16 h-16 rounded-3xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-lg shadow-emerald-600/20">
              <HeartPulse className="w-8 h-8 stroke-[2.2]" />
            </div>
            <div className="space-y-2 text-center md:text-left">
              <span className="text-[10px] font-extrabold uppercase tracking-widest bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full border border-emerald-100 inline-block">
                Komitmen Kesehatan Global
              </span>
              <h3 className="text-2xl font-black text-gray-950">Mendukung SDG 3: Good Health &amp; Well-being</h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                CaffiSense berkontribusi dalam mengedukasi masyarakat terhadap pentingnya menjaga pola istirahat berkualitas dan membatasi konsumsi stimulan berlebih untuk mencegah gangguan tidur kronis serta kelelahan mental.
              </p>
            </div>
          </div>
        </section>

        {/* ─── FINAL CTA SECTION ─── */}
        <section className="py-24 px-6 sm:px-12 bg-gray-950 text-white relative overflow-hidden">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[320px] bg-orange-950/40 rounded-full blur-[100px]" />
          </div>

          <div
            ref={ctaSection.ref}
            className={`max-w-3xl mx-auto text-center space-y-8 z-10 relative ${
              ctaSection.isVisible ? "anim-slide-up" : "opacity-0"
            }`}
          >
            <div className="w-14 h-14 rounded-3xl bg-orange-600 text-white mx-auto flex items-center justify-center shadow-lg shadow-orange-600/30">
              <Coffee className="w-7 h-7 stroke-[2.2]" />
            </div>

            <div className="space-y-3">
              <h2 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
                Sudah tahu berapa kafein<br />di tubuhmu saat ini?
              </h2>
              <p className="text-sm text-gray-400 max-w-lg mx-auto leading-relaxed">
                Mulai skrining mandiri secara gratis. Cukup masukkan data konsumsi kopimu untuk mendapatkan visualisasi dan analisis lengkap.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
              <button
                onClick={handleStartCheck}
                className="w-full sm:w-auto bg-orange-600 hover:bg-orange-500 text-white px-9 py-4 rounded-full font-black text-sm transition-all shadow-xl shadow-orange-600/25 flex items-center justify-center gap-3 cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                <span>Mulai Cek Gratis Sekarang</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              {!isAuthenticated && (
                <Link
                  to="/login"
                  className="w-full sm:w-auto border border-white/20 text-white px-8 py-4 rounded-full font-bold text-sm hover:bg-white/10 transition flex items-center justify-center gap-2"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Sudah punya akun? Masuk</span>
                </Link>
              )}
            </div>
          </div>
        </section>

        {/* ─── FOOTER ─── */}
        <footer className="bg-gray-950 text-gray-400 py-12 px-6 sm:px-12 border-t border-gray-800/60 text-xs">
          <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3 text-white font-black text-base">
              <div className="w-7 h-7 rounded-xl bg-orange-600 flex items-center justify-center text-white text-xs">
                <Coffee className="w-4 h-4" />
              </div>
              <span>CaffiSense Platform</span>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-6 font-semibold text-gray-400">
              <Link to="/" className="hover:text-white transition">Beranda</Link>
              <a href="#how-it-works" className="hover:text-white transition">Cara Kerja</a>
              <a href="#features" className="hover:text-white transition">Fitur</a>
              <a href="#risks" className="hover:text-white transition">Edukasi Kafein</a>
              <Link to="/about" className="hover:text-white transition">Tentang Kami</Link>
              <Link to="/login" className="hover:text-white transition">Masuk</Link>
              <Link to="/register" className="hover:text-white transition">Daftar</Link>
            </div>

            <div className="text-gray-500 text-[11px] text-center md:text-right">
              © 2026 CaffiSense. Alat skrining edukatif, bukan pengganti diagnosis medis dokter.
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
