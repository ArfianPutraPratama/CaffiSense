import { useEffect, useState, useMemo } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine,
} from 'recharts';
import { 
  HeartPulse, ArrowRight, RefreshCw, CheckCircle2, 
  Activity, Coffee, Zap, Clock, Moon, AlertTriangle, ShieldCheck,
  Download, FileText, FileSpreadsheet, Droplets
} from 'lucide-react';
import DashboardLayout from '../layouts/DashboardLayout';
import { getLatestAssessmentApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import AiAnalysisView from '../components/AiAnalysisView';
import OrganImpactMatrix from '../components/OrganImpactMatrix';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function InsightsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [result, setResult] = useState<any>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);

  useEffect(() => {
    const isFromHistory = location.state?.fromHistory;

    const syncLatest = async () => {
      // If we came from history page, prioritize the selected item in localStorage
      if (isFromHistory) {
        const savedData = localStorage.getItem('assessmentResult');
        if (savedData) {
          try {
            setResult(JSON.parse(savedData));
            return;
          } catch {
            navigate('/diagnosis');
            return;
          }
        }
      }

      // Otherwise, fetch latest from API to ensure sync (e.g. fresh reload, or coming from diagnosis)
      try {
        const res = await getLatestAssessmentApi();
        if (res && res.assessment) {
          setResult(res.assessment);
          localStorage.setItem('assessmentResult', JSON.stringify(res.assessment));
          return;
        } else if (res === null) {
          // Database was cleared / empty!
          localStorage.removeItem('assessmentResult');
          localStorage.removeItem('caffisense_assessment_history');
          navigate('/diagnosis');
          return;
        }
      } catch {
        // Fallback to local cache if offline
      }

      // Final fallback
      const savedData = localStorage.getItem('assessmentResult');
      if (savedData) {
        try {
          setResult(JSON.parse(savedData));
        } catch {
          navigate('/diagnosis');
        }
      } else {
        navigate('/diagnosis');
      }
    };

    syncLatest();
  }, [navigate, location.state]);

  // Real-time Caffeine Decay Chart Data based on actual stored result
  const chartData = useMemo(() => {
    if (!result || !result.last_coffee_time || result.estimated_caffeine_mg === undefined || result.estimated_caffeine_mg === null) return [];
    
    const [hours, minutes] = result.last_coffee_time.split(':').map(Number);
    const startHour = hours + (minutes / 60);
    const initialAmount = result.estimated_caffeine_mg || 0;
    const halfLife = 5;
    
    const data = [];
    const totalPoints = 14 * 6; // 14 hours, 6 points per hour (every 10 minutes)
    for (let i = 0; i <= totalPoints; i++) {
      const elapsedHours = i / 6;
      const currentHourFloat = startHour + elapsedHours;
      const amount = initialAmount * Math.pow(0.5, elapsedHours / halfLife);
      const displayHour = Math.floor(currentHourFloat) % 24;
      const displayMin = Math.round((currentHourFloat % 1) * 60);
      data.push({
        time: `${displayHour.toString().padStart(2, '0')}:${displayMin.toString().padStart(2, '0')}`,
        amount: Math.round(amount),
      });
    }
    return data;
  }, [result]);

  const chartTicks = useMemo(() => {
    if (chartData.length === 0) return [];
    return chartData.filter((_, idx) => idx % 12 === 0).map((d) => d.time);
  }, [chartData]);

  const handleExportCSV = () => {
    try {
      const historyStr = localStorage.getItem('caffisense_assessment_history');
      let historyList = [];
      if (historyStr) {
        historyList = JSON.parse(historyStr);
      }
      if (!Array.isArray(historyList) || historyList.length === 0) {
        alert("Tidak ada riwayat data untuk diekspor.");
        return;
      }
      
      const headers = ["Tanggal", "Waktu Kopi Terakhir", "Total Kafein (mg)", "Kondisi Perut", "Aktivitas Olahraga", "Konsumsi Rokok", "Asupan Air (ml)", "Durasi Tidur (Jam)", "Kualitas Tidur", "Keluhan"];
      const rows = historyList.map(h => {
        const exTiming = h.exercise_timing === 'sebelum_kopi' 
          ? `Sebelum Kopi (${h.exercise_duration_minutes || 30} mnt)` 
          : (h.exercise_timing === 'sesudah_kopi' ? `Sesudah Kopi (${h.exercise_duration_minutes || 30} mnt)` : 'Tidak Olahraga');
        const smokingText = !h.smoking_intensity || h.smoking_intensity === 'none'
          ? 'Tidak Merokok'
          : `${h.smoking_intensity} Batang/Hari`;
        return [
          h.assessment_date || h.date || h.created_at || "-",
          h.last_coffee_time || "-",
          Math.round(h.estimated_caffeine_mg || 0),
          h.meal_status === 'belum_makan' ? "Perut Kosong" : `Sudah Makan (${h.last_meal_time || '12:30'})`,
          exTiming,
          smokingText,
          h.water_intake_ml || 1500,
          h.sleep_duration || "-",
          h.sleep_quality || "-",
          h.free_text_experience ? `"${h.free_text_experience.replace(/"/g, '""')}"` : "-"
        ];
      });
      
      const csvContent = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `CaffiSense_Riwayat_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setShowExportMenu(false);
    } catch (err) {
      console.error(err);
      alert("Gagal mengekspor CSV");
    }
  };

  const handleExportPDF = async () => {
    setIsExporting(true);
    setShowExportMenu(false);
    try {
      const doc = new jsPDF('p', 'mm', 'a4');
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      
      // 1. Official Medical Header Banner (Dark Navy)
      doc.setFillColor(15, 23, 42); // Slate-900
      doc.rect(0, 0, pageWidth, 26, 'F');

      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(255, 255, 255);
      doc.text("CAFFISENSE - LEMBAR KONSULTASI MEDIS HARIAN", 15, 11);

      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(203, 213, 225);
      doc.text("Laporan Evaluasi Beban Farmakokinetik Kafein & Ritme Sirkadian Tubuh untuk Dokter / Tenaga Medis", 15, 17);

      // System Accent Dot
      doc.setFillColor(249, 115, 22); // Orange-500
      doc.circle(pageWidth - 16, 13, 2.5, 'F');

      // 2. Metadata Box Sesi Hari Ini
      const sessionDate = result.assessment_date || result.date || (result.created_at ? result.created_at.split(' ')[0] : new Date().toISOString().split('T')[0]);
      const sessionTime = result.last_coffee_time || '15:00';
      const estimatedMg = Math.round(result.estimated_caffeine_mg || 0);
      const waterIntake = result.water_intake_ml || 1500;
      const mealInfo = result.meal_status === 'belum_makan' ? 'Perut Kosong (Belum Makan)' : `Sudah Makan (${result.last_meal_time || '12:30'})`;
      const exerciseInfo = result.exercise_timing === 'sebelum_kopi'
        ? `Sebelum Kopi (${result.exercise_duration_minutes || 30} Menit)`
        : (result.exercise_timing === 'sesudah_kopi' ? `Sesudah Kopi (${result.exercise_duration_minutes || 30} Menit)` : 'Tidak Berolahraga');
      const smokingInfo = !result.smoking_intensity || result.smoking_intensity === 'none'
        ? 'Tidak Merokok'
        : `Merokok: ${result.smoking_intensity} Batang/Hari`;
      const isHighImpact = result.ml_prediction === 1;

      autoTable(doc, {
        startY: 29,
        theme: 'plain',
        styles: { fontSize: 8, cellPadding: 1.2, textColor: [30, 41, 59] },
        columnStyles: {
          0: { fontStyle: 'bold', cellWidth: 30 },
          1: { cellWidth: 62 },
          2: { fontStyle: 'bold', cellWidth: 32 },
          3: { cellWidth: 63 }
        },
        body: [
          ["Nama Pasien / User:", `${user?.name || 'Pasien CaffiSense'}`, "Tanggal Pemeriksaan:", `${sessionDate}`],
          ["Email / Kontak:", `${user?.email || 'Konsultasi Mandiri'}`, "Jam Sesi Terakhir:", `${sessionTime} WIB`],
          ["Status Risiko Sirkadian:", isHighImpact ? "TINGGI (Beresiko Disrupsi Tidur)" : "OPTIMAL / AMAN", "Total Kafein Terdeteksi:", `${estimatedMg} mg (${Math.round((estimatedMg / 400) * 100)}% Batas FDA)`]
        ]
      });

      // 3. SECTION 1: TABEL PARAMETER VITAL KONSUMSI SESI INI
      const nextY1 = (doc as any).lastAutoTable.finalY + 3.5;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text("1. Data Parameter Kebiasaan Harian (Sesi Ini)", 15, nextY1);

      autoTable(doc, {
        startY: nextY1 + 1.5,
        head: [["Parameter Pemeriksaan", "Hasil Input Pasien", "Interpretasi & Standar Klinis"]],
        theme: 'grid',
        headStyles: { fillColor: [30, 41, 59], fontSize: 8, fontStyle: 'bold' },
        styles: { fontSize: 7.5, cellPadding: 1.8 },
        columnStyles: {
          0: { cellWidth: 50, fontStyle: 'bold' },
          1: { cellWidth: 55 },
          2: { cellWidth: 85 }
        },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        body: [
          ["Konsumsi Kopi", `${result.coffee_cups_per_day} Cangkir (${result.coffee_size || 'Sedang'})`, "Ambang batas wajar dewasa: Maksimal 3-4 cangkir/hari"],
          ["Beban Kafein Harian", `${estimatedMg} mg (${Math.round((estimatedMg / 400) * 100)}% Batas FDA)`, estimatedMg > 400 ? "Melebihi batas aman FDA (400 mg/hari)" : "Berada dalam rentang toleransi aman FDA"],
          ["Waktu Terakhir Minum", `${sessionTime} WIB`, parseInt((sessionTime || '12').split(':')[0]) >= 18 ? "Perhatian: Sangat dekat jam tidur (< 6 jam sebelum tidur)" : "Waktu cut-off aman terhadap ritme sirkadian"],
          ["Kondisi Lambung & Makan", mealInfo, result.meal_status === 'belum_makan' ? "Peringatan: Asam HCl naik tajam tanpa perlindungan bolus makanan" : "Aman terlapisi nutrisi makanan"],
          ["Aktivitas Fisik / Olahraga", exerciseInfo, "Olahraga memobilisasi glikogen otot dan denyut kardiovaskular"],
          ["Konsumsi Nikotin / Rokok", smokingInfo, result.smoking_intensity && result.smoking_intensity !== 'none' ? "Nikotin menginduksi enzim hati CYP1A2 mempercepat pemecahan kafein" : "Laju degradasi hepatik dalam kisaran normal"],
          ["Asupan Air Putih", `${waterIntake} ml`, waterIntake >= 2000 ? "Optimal (Standar Kemenkes 8 Gelas)" : waterIntake >= 1500 ? "Cukup" : "Kurang / Dehidrasi (< 1.000 ml)"],
          ["Durasi & Mutu Tidur", result.sleep_duration ? `${result.sleep_duration} Jam (Mutu: ${result.sleep_quality})` : "Dilewati / Tidak Diisi", "Rekomendasi Kemenkes & AASM: 7-8 jam/malam"],
          ["Perkiraan Bebas Kafein", safeTimePoint, "Waktu paruh 5 jam; kadar kafein < 50 mg untuk Deep Sleep"]
        ]
      });

      // 4. SECTION 2: EVALUASI BEBAN ORGAN FISIOLOGIS (SESI INI)
      const nextY2 = (doc as any).lastAutoTable.finalY + 4;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text("2. Pemetaan Beban Fisiologis Organ Tubuh (Multi-Factorial Scoring)", 15, nextY2);

      const [h] = (sessionTime || '12:00').split(':').map(Number);
      const isNight = h >= 20;
      const isLate = h >= 16;
      const sleepDur = Number(result.sleep_duration) || 7;

      let bLoad = Math.min(100, Math.round((estimatedMg / 400) * 80));
      if (isNight && estimatedMg > 0) bLoad = Math.min(100, bLoad + 30);
      else if (isLate && estimatedMg > 0) bLoad = Math.min(100, bLoad + 20);
      if (sleepDur <= 5 && estimatedMg > 0) bLoad = Math.min(100, bLoad + 20);

      let hLoad = Math.min(100, Math.round((estimatedMg / 400) * 75));
      if (result.meal_status === 'belum_makan' && estimatedMg > 0) hLoad = Math.min(100, hLoad + 12);
      if (isNight && estimatedMg > 0) hLoad = Math.min(100, hLoad + 15);

      let sLoad = Math.min(100, Math.round((estimatedMg / 400) * 65));
      if (result.meal_status === 'belum_makan' && estimatedMg > 0) sLoad = Math.min(100, sLoad + 30);

      let kLoad = Math.min(100, Math.round((estimatedMg / 400) * 60));
      if (waterIntake < 1000) kLoad = Math.min(100, kLoad + 25);
      if (sleepDur <= 5 && estimatedMg > 0) kLoad = Math.min(100, kLoad + 15);

      let lLoad = Math.min(100, Math.round((estimatedMg / 400) * 70));
      if (result.smoking_intensity && result.smoking_intensity !== 'none') lLoad = Math.min(100, lLoad + 20);

      let blLoad = Math.min(100, Math.round((estimatedMg / 400) * 50));
      if (waterIntake < 1000 && estimatedMg > 0) blLoad = Math.min(100, blLoad + 15);
      if (isNight && estimatedMg > 150) blLoad = Math.min(100, blLoad + 30);

      let eLoad = Math.min(100, Math.round((estimatedMg / 400) * 35));
      if (waterIntake < 1000 && estimatedMg > 0) eLoad = Math.min(100, eLoad + 25);
      if (sleepDur <= 5) eLoad = Math.min(100, eLoad + 25);

      let mLoad = Math.min(100, Math.round((estimatedMg / 400) * 45));
      if (waterIntake < 1000 && estimatedMg > 0) mLoad = Math.min(100, mLoad + 25);
      if (sleepDur <= 5 && estimatedMg > 0) mLoad = Math.min(100, mLoad + 20);

      autoTable(doc, {
        startY: nextY2 + 1.5,
        head: [["Organ Tubuh", "Beban", "Status", "Keterangan Klinis"]],
        theme: 'grid',
        headStyles: { fillColor: [51, 65, 85], fontSize: 8, fontStyle: 'bold' },
        styles: { fontSize: 7.5, cellPadding: 1.6 },
        columnStyles: {
          0: { cellWidth: 45, fontStyle: 'bold' },
          1: { cellWidth: 18 },
          2: { cellWidth: 28, fontStyle: 'bold' },
          3: { cellWidth: 99 }
        },
        body: [
          ["Otak & Sistem Saraf", `${bLoad}%`, bLoad >= 70 ? 'Hiperstimulasi' : bLoad >= 40 ? 'Waspada' : 'Optimal', "Blokade reseptor adenosin A1/A2A; menunda kantuk alami & fase tidur dalam"],
          ["Jantung & Sirkulasi", `${hLoad}%`, hLoad >= 70 ? 'Beban Tinggi' : hLoad >= 40 ? 'Waspada' : 'Stabil', "Pelepasan katekolamin adrenalin; beban kontraktilitas pompa ventrikel"],
          ["Lambung & Saluran Cerna", `${sLoad}%`, sLoad >= 70 ? 'Iritasi Asam' : sLoad >= 40 ? 'Waspada' : 'Normal', "Sekresi asam lambung HCl berlebih terhadap lapisan mukosa lambung"],
          ["Ginjal & Keseimbangan Cairan", `${kLoad}%`, kLoad >= 70 ? 'Filtrasi Berat' : kLoad >= 40 ? 'Waspada' : 'Aman', "Diuresis akut; peningkatan ekskresi cairan & ion natrium/kalium"],
          ["Hati (Enzim CYP1A2)", `${lLoad}%`, lLoad >= 70 ? 'Beban Hepatik' : lLoad >= 40 ? 'Waspada' : 'Normal', "Metabolisme degradasi kafein oleh enzim sitokrom P450 di organ hati"],
          ["Kandung Kemih", `${blLoad}%`, blLoad >= 70 ? 'Risiko Nokturia' : blLoad >= 40 ? 'Waspada' : 'Normal', "Iritasi urin pekat & dorongan kencing berulang di jam tidur malam"],
          ["Mata & Saraf Visual", `${eLoad}%`, eLoad >= 70 ? 'Kering / Lelah' : eLoad >= 40 ? 'Waspada' : 'Optimal', "Astenopia otot siliaris kelopak & dehidrasi lapisan air mata (Dry Eye)"],
          ["Sistem Otot Somatik", `${mLoad}%`, mLoad >= 70 ? 'Ketegangan/Kram' : mLoad >= 40 ? 'Waspada' : 'Relaks', "Deplesi ion elektrolit kalsium/magnesium & keterbatasan pemulihan somatik"]
        ]
      });

      // 5. SECTION 3: REKOMENDASI KLINIS & SARAN DOKTER
      const nextY3 = (doc as any).lastAutoTable.finalY + 4;
      let targetY = nextY3;
      if (targetY > pageHeight - 65) {
        doc.addPage();
        targetY = 18;
      }

      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text("3. Ulasan Klinis & Panduan Pemulihan (Rekomendasi Sistem AI)", 15, targetY);

      doc.setFontSize(7.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(71, 85, 105);

      let cleanAiText = (result.ai_analysis || "Tidak ada evaluasi AI yang tercatat pada sesi ini.")
        .replace(/[*#]/g, '')
        .trim();
        
      const splitAiText = doc.splitTextToSize(cleanAiText, pageWidth - 30);
      doc.text(splitAiText, 15, targetY + 4);

      const nextY4 = targetY + 4 + (splitAiText.length * 3.5) + 6;

      let sigY = nextY4;
      if (sigY > pageHeight - 38) {
        doc.addPage();
        sigY = 20;
      }

      // 6. LEMBAR CATATAN KONSULTASI DOKTER & TANDA TANGAN
      doc.setDrawColor(203, 213, 225);
      doc.setLineWidth(0.4);
      doc.roundedRect(15, sigY, pageWidth - 30, 26, 2, 2);

      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text("Catatan Dokter / Tenaga Medis Pemeriksa:", 18, sigY + 5);

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(148, 163, 184);
      doc.text("..................................................................................................................................................................................................", 18, sigY + 11);
      doc.text("..................................................................................................................................................................................................", 18, sigY + 16);

      doc.setFontSize(7.5);
      doc.setTextColor(71, 85, 105);
      doc.text("Tanda Tangan & Stempel Faskes: ___________________________", pageWidth - 100, sigY + 22);

      // Disclaimer Footer
      doc.setFontSize(6.5);
      doc.setTextColor(148, 163, 184);
      doc.text(
        "* Dokumen ini diterbitkan oleh CaffiSense sebagai instrumen skrining farmakokinetik harian untuk bahan konsultasi bersama dokter/ahli kesehatan profesional.",
        pageWidth / 2,
        pageHeight - 5,
        { align: 'center' }
      );

      doc.save(`CaffiSense_LaporanMedis_${sessionDate}.pdf`);
    } catch (err: any) {
      console.error(err);
      alert("Gagal mengekspor PDF: " + (err.message || err));
    } finally {
      setIsExporting(false);
    }
  };

  if (!result) return null;

  const isHighImpact = result.ml_prediction === 1;
  const estimatedMg = Math.round(result.estimated_caffeine_mg || 0);
  const isOverFda = estimatedMg > 400;
  const safeTimePoint = estimatedMg === 0 ? 'Siap Sekarang' : (chartData.find(d => d.amount <= 50)?.time ?? '> 14 jam');

  return (
    <DashboardLayout>
      <div className="max-w-[1300px] mx-auto space-y-6 animate-fadeIn pb-12">
        
        {/* ─── TOP STATUS BANNER & EXPORT (Clean Modern Health-Tech Aesthetic) ─── */}
        <div className="bg-white rounded-2xl p-6 sm:p-7 shadow-xs border border-gray-200/80 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                Hasil Skrining Harian
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 border border-gray-200">
                Sirkadian & Metabolisme
              </span>
            </div>
            
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
              Potensi Pengaruh Kafein pada Kualitas Tidur
            </h2>
            <p className="text-xs sm:text-sm text-gray-500 max-w-xl leading-relaxed">
              Berdasarkan model farmakokinetik waktu paruh dan riwayat istirahat, berikut hasil evaluasi untuk sesi hari ini:
            </p>
          </div>

          <div className="flex flex-col sm:flex-row md:flex-col items-start md:items-end gap-2.5 shrink-0 w-full md:w-auto">
            {/* Action Buttons: Status Badge & Export Report */}
            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              
              {/* Export Dropdown Menu */}
              <div className="relative flex-1 md:flex-initial">
                <button
                  type="button"
                  onClick={() => setShowExportMenu(!showExportMenu)}
                  disabled={isExporting}
                  className="w-full md:w-auto flex items-center justify-center gap-2 px-4 py-2.5 bg-white hover:bg-gray-50 text-gray-700 rounded-xl font-bold text-xs transition border border-gray-200 shadow-2xs disabled:opacity-50 cursor-pointer"
                >
                  {isExporting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5 text-indigo-600" />}
                  <span>Ekspor Laporan (PDF)</span>
                </button>
                {showExportMenu && (
                  <div className="absolute top-full right-0 mt-1.5 w-56 bg-white rounded-xl shadow-xl border border-gray-100 py-1.5 z-50 overflow-hidden">
                    <button 
                      type="button"
                      onClick={handleExportPDF} 
                      className="w-full text-left px-4 py-2.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 flex items-center gap-2.5 cursor-pointer"
                    >
                      <FileText className="w-4 h-4 text-indigo-600 shrink-0" />
                      <div>
                        <div className="font-bold text-gray-900">Laporan Medis (PDF)</div>
                        <div className="text-[10px] text-gray-400">Ringkasan Sesi Hari Ini untuk Dokter</div>
                      </div>
                    </button>
                    <button 
                      type="button"
                      onClick={handleExportCSV} 
                      className="w-full text-left px-4 py-2.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 flex items-center gap-2.5 cursor-pointer border-t border-gray-50"
                    >
                      <FileSpreadsheet className="w-4 h-4 text-emerald-600 shrink-0" />
                      <div>
                        <div className="font-bold text-gray-900">Unduh Tabel Riwayat (CSV)</div>
                        <div className="text-[10px] text-gray-400">Data mentah untuk spreadsheet</div>
                      </div>
                    </button>
                  </div>
                )}
              </div>

              {/* Status Badge */}
              <div className={`px-4 py-2.5 rounded-xl font-bold text-xs tracking-wide flex items-center gap-2 border shadow-2xs shrink-0 ${
                isHighImpact 
                  ? 'bg-rose-50 text-rose-700 border-rose-200' 
                  : 'bg-emerald-50 text-emerald-700 border-emerald-200'
              }`}>
                {isHighImpact ? (
                  <>
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                    <span>Potensi Gangguan Tinggi</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Kondisi Aman / Optimal</span>
                  </>
                )}
              </div>
            </div>

            <span className="text-[11px] text-gray-400 font-medium">
              {isHighImpact ? 'Disarankan memajukan jam ngopi' : 'Ritme tidur dalam ambang aman'}
            </span>
          </div>
        </div>

        <div id="pdf-capture-area" className="space-y-6">
          {/* ─── 5 SUMMARY METRIC CARDS ─── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
          
          {/* Card 1: Kebiasaan Kopi */}
          <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-xs border border-gray-200/80 hover:border-gray-300 transition-all flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 border border-amber-100 flex items-center justify-center shrink-0">
              <Coffee className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-0.5">
                Konsumsi Kopi
              </span>
              <div className="text-base sm:text-lg font-bold text-gray-900 truncate">
                {result.coffee_cups_per_day} <span className="text-xs font-semibold text-gray-500">cangkir</span>
              </div>
              <span className="text-[10px] text-gray-400 font-medium block mt-0.5 truncate">Porsi: {result.coffee_size || 'Sedang'}</span>
            </div>
          </div>

          {/* Card 2: Estimasi Kafein */}
          <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-xs border border-gray-200/80 hover:border-gray-300 transition-all flex items-start gap-3.5">
            <div className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${
              isOverFda 
                ? 'bg-rose-50 border-rose-100 text-rose-600' 
                : 'bg-emerald-50 border-emerald-100 text-emerald-600'
            }`}>
              <Zap className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-0.5">
                Total Kafein
              </span>
              <div className="text-base sm:text-lg font-bold text-gray-900 truncate">
                {estimatedMg} <span className="text-xs font-semibold text-gray-500">mg</span>
              </div>
              <span className={`text-[10px] font-bold block mt-0.5 truncate ${isOverFda ? 'text-rose-600' : 'text-emerald-600'}`}>
                {Math.round((estimatedMg / 400) * 100)}% dari Batas FDA
              </span>
            </div>
          </div>

          {/* Card 3: Asupan Air Putih */}
          <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-xs border border-gray-200/80 hover:border-gray-300 transition-all flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-cyan-50 border border-cyan-100 text-cyan-600 flex items-center justify-center shrink-0">
              <Droplets className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-0.5">
                Asupan Air Putih
              </span>
              <div className="text-base sm:text-lg font-bold text-gray-900 truncate">
                {result.water_intake_ml || 1500} <span className="text-xs font-semibold text-gray-500">ml</span>
              </div>
              <span className="text-[10px] text-cyan-700 font-semibold block mt-0.5 truncate">
                {(result.water_intake_ml || 1500) >= 2000 ? 'Hidrasi Optimal' : (result.water_intake_ml || 1500) >= 1500 ? 'Hidrasi Cukup' : 'Perlu Ditambah'}
              </span>
            </div>
          </div>

          {/* Card 4: Kopi Terakhir */}
          <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-xs border border-gray-200/80 hover:border-gray-300 transition-all flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-0.5">
                Sesi Terakhir
              </span>
              <div className="text-base sm:text-lg font-bold text-gray-900 truncate">
                {result.last_coffee_time || '15:00'}
              </div>
              <span className="text-[10px] text-gray-400 font-medium block mt-0.5 truncate">Aman: {safeTimePoint}</span>
            </div>
          </div>

          {/* Card 5: Ringkasan Tidur */}
          <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-xs border border-gray-200/80 hover:border-gray-300 transition-all flex items-start gap-3.5">
            <div className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${
              result.is_sleep_skipped || !result.sleep_duration 
                ? 'bg-gray-50 border-gray-200 text-gray-400' 
                : 'bg-purple-50 border-purple-100 text-purple-600'
            }`}>
              <Moon className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-0.5">
                Pola Istirahat
              </span>
              {result.is_sleep_skipped || !result.sleep_duration ? (
                <>
                  <div className="text-sm font-bold text-gray-500 truncate">
                    Dilewati
                  </div>
                  <span className="text-[10px] text-gray-400 font-medium block mt-0.5 truncate">
                    Belum diisi
                  </span>
                </>
              ) : (
                <>
                  <div className="text-base sm:text-lg font-bold text-gray-900 truncate">
                    {result.sleep_duration} Jam
                  </div>
                  <span className="text-[10px] text-gray-500 font-medium block mt-0.5 truncate">
                    {result.sleep_quality || 'Cukup'}
                  </span>
                </>
              )}
            </div>
          </div>
          </div>
        </div>

        {/* ─── CAFFEINE DECAY VISUALIZER CHART ─── */}
        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-gray-200/80 shadow-xs flex flex-col h-[400px]">
            {/* Chart Header & Legend */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-4">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <div className="w-5 h-5 rounded-lg bg-emerald-100 border border-emerald-200 flex items-center justify-center">
                    <Activity className="w-3 h-3 text-emerald-700" />
                  </div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Real-time Decay Curve</span>
                </div>
                <h3 className="text-xl font-extrabold text-gray-900 tracking-tight">Grafik Metabolisme Kafein Harian</h3>
              </div>
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-100 px-2.5 py-1 rounded-full">
                  <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                  <span className="text-[11px] text-gray-600 font-medium">Batas Tidur Nyenyak (50mg)</span>
                </div>
                <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-100 px-2.5 py-1 rounded-full">
                  <span className="w-2 h-2 rounded-full bg-red-400"></span>
                  <span className="text-[11px] text-gray-600 font-medium">Batas Maksimal FDA (400mg)</span>
                </div>
              </div>
            </div>

          <div className="h-[280px] w-full">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 15, right: 15, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="insightsGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10b981" stopOpacity={0.2} />
                      <stop offset="100%" stopColor="#10b981" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f9fafb" />
                  <XAxis
                    dataKey="time"
                    ticks={chartTicks}
                    interval={0}
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fill: '#64748b', fontWeight: 600 }}
                    dy={10}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10, fill: '#cbd5e1', fontWeight: 500 }}
                    domain={[0, (dataMax: number) => Math.max(dataMax, 420)]}
                    dx={-8}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: '12px',
                      border: '1px solid #f3f4f6',
                      boxShadow: '0 4px 20px -2px rgba(0, 0, 0, 0.05)',
                      padding: '10px 14px',
                    }}
                    formatter={(value: any) => [<span className="font-bold">{value} mg</span>, <span className="text-gray-500 font-medium">Sisa Kafein</span>]}
                    labelStyle={{ fontWeight: 600, color: '#9ca3af', marginBottom: '6px', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}
                  />
                  <ReferenceLine y={400} stroke="#fca5a5" strokeWidth={1} strokeDasharray="4 4" ifOverflow="extendDomain" />
                  <ReferenceLine y={50} stroke="#6ee7b7" strokeWidth={1} strokeDasharray="4 4" />
                  <Area
                    type="monotone"
                    dataKey="amount"
                    stroke="#10b981"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#insightsGrad)"
                    activeDot={{ r: 5, fill: '#10b981', stroke: '#ffffff', strokeWidth: 2 }}
                    dot={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : null}
          </div>
        </div>

        {/* ─── INTERACTIVE ORGAN IMPACT MATRIX (CLINICAL LOAD MAPPING) ─── */}
        <OrganImpactMatrix 
          caffeineMg={result.estimated_caffeine_mg || 0}
          lastCoffeeTime={result.last_coffee_time || '15:00'}
          waterIntakeMl={result.water_intake_ml || 1500}
          sleepDuration={result.sleep_duration ? Number(result.sleep_duration) : 7}
          mealStatus={result.meal_status || 'sudah_makan'}
          exerciseTiming={result.exercise_timing || 'tidak_olahraga'}
          exerciseDurationMinutes={result.exercise_duration_minutes || 0}
          smokingIntensity={result.smoking_intensity || 'none'}
          freeTextExperience={result.free_text_experience || ''}
          aiAnalysis={result.ai_analysis || ''}
        />

        {/* ─── HEALTH EVALUATION & RECOMMENDATION SECTION ─── */}
        <div className="mt-8 space-y-6">
          
          {/* Header Section */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-white border border-gray-200 text-gray-800 flex items-center justify-center font-bold shadow-sm">
                <HeartPulse className="w-6 h-6 stroke-[2.2]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg sm:text-xl font-bold text-gray-900">Rekomendasi & Evaluasi Klinis</h3>
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-gray-100 text-gray-600 border border-gray-200 px-2.5 py-0.5 rounded-full">
                    Saran Praktis
                  </span>
                </div>
                <p className="text-xs text-gray-500 font-medium mt-0.5">Panduan penyesuaian metabolisme kafein dan pemulihan ritme sirkadian</p>
              </div>
            </div>

            <Link
              to="/diagnosis"
              className="px-5 py-2.5 rounded-full border border-gray-200 bg-white text-gray-800 font-bold text-xs hover:bg-gray-50 transition flex items-center gap-2 self-start sm:self-auto shadow-sm"
            >
              <RefreshCw className="w-3.5 h-3.5 text-gray-500" />
              <span>Update Data di Diagnosis</span>
            </Link>
          </div>

          {/* Render Rich Modular AI Analysis Containers (These are the Left-Right containers) */}
          <AiAnalysisView content={result.ai_analysis} />

          {/* Action Footer */}
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-xs font-medium text-gray-500">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span>Data tersimpan otomatis di sesi akunmu</span>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <Link
                to="/diagnosis"
                className="flex-1 sm:flex-none bg-gray-950 text-white px-6 py-3 rounded-full font-bold text-xs hover:bg-black transition flex items-center justify-center gap-2 shadow-md"
              >
                <span>Kembali ke Visualizer</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
