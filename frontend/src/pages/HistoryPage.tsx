import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  AreaChart, Area, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine
} from 'recharts';
import {
  Coffee, Moon, Zap, HeartPulse, ArrowRight,
  Calendar, ChevronRight, ChevronLeft, ChevronDown, X, Eye, Activity,
  ShieldAlert, ShieldCheck, TrendingUp,
  ArrowDownRight, ArrowUpRight, Search, Plus,
  CheckCircle2, AlertTriangle, Clock,
  Download, FileText, FileSpreadsheet, RefreshCw
} from 'lucide-react';
import DashboardLayout from '../layouts/DashboardLayout';
import { getAllAssessmentsApi } from '../services/api';
import AiAnalysisView from '../components/AiAnalysisView';
import { useAuth } from '../context/AuthContext';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

export interface DayMetric {
  dayIndex: number;
  dayName: string;
  fullDayName: string;
  dateNumber: number;
  targetDate: Date;
  status: 'good' | 'moderate' | 'poor' | 'empty';
  statusLabel: string;
  totalCaffeine: number;
  cups: number;
  lastCoffeeTime: string | null;
  sleepHours: number | null;
  mealStatus: string | null;
  assessmentCount: number;
  issues: string[];
  positives: string[];
}

export default function HistoryPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [history, setHistory] = useState<any[]>([]);
  const [selectedItem, setSelectedItem] = useState<any | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterImpact, setFilterImpact] = useState<'all' | 'low' | 'high'>('all');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest' | 'highest_caffeine' | 'lowest_sleep'>('newest');
  const [isExporting, setIsExporting] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  
  // View Mode: 'daily' vs 'weekly'
  const [viewMode, setViewMode] = useState<'daily' | 'weekly'>('daily');
  const [selectedWeekOffset, setSelectedWeekOffset] = useState<number>(0);
  const [selectedDayFilter, setSelectedDayFilter] = useState<number | null>(null); // null = all days, 0-6 = specific day of week

  // Pagination State (10 items per page)
  const ITEMS_PER_PAGE = 10;
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Reset to page 1 when search or filter criteria change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterImpact, sortOrder, viewMode, selectedWeekOffset, selectedDayFilter]);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await getAllAssessmentsApi();
        if (res && Array.isArray(res.assessments)) {
          setHistory(res.assessments);
          localStorage.setItem('caffisense_assessment_history', JSON.stringify(res.assessments));
          return;
        } else if (res && Array.isArray(res.assessments) && res.assessments.length === 0) {
          setHistory([]);
          localStorage.removeItem('caffisense_assessment_history');
          localStorage.removeItem('caffisense_start_tracking_date');
          localStorage.removeItem('caffisense_last_sleep_date');
          return;
        }
      } catch {
        // Fallback to local storage
      }

      const saved = localStorage.getItem('caffisense_assessment_history');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setHistory(Array.isArray(parsed) ? parsed : []);
        } catch {
          setHistory([]);
        }
      } else {
        setHistory([]);
      }
    };

    fetchHistory();
  }, []);

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'Hari ini';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  // Modal Decay Chart calculation
  const modalChartData = useMemo(() => {
    if (!selectedItem || !selectedItem.last_coffee_time || selectedItem.estimated_caffeine_mg === undefined || selectedItem.estimated_caffeine_mg === null) return [];
    
    const [hours, minutes] = selectedItem.last_coffee_time.split(':').map(Number);
    const startHour = hours + (minutes / 60);
    const initialAmount = selectedItem.estimated_caffeine_mg || 0;
    const halfLife = 5;
    
    const data = [];
    const totalPoints = 14 * 6; // 14 hours
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
  }, [selectedItem]);

  const handleOpenInInsights = (item: any) => {
    localStorage.setItem('assessmentResult', JSON.stringify(item));
    navigate('/insights', { state: { fromHistory: true } });
  };

  const sortedHistory = useMemo(() => {
    return [...history].sort((a, b) => {
      const dateA = new Date(a.created_at || a.date || 0).getTime();
      const dateB = new Date(b.created_at || b.date || 0).getTime();
      return dateB - dateA;
    });
  }, [history]);

  // ─── WEEKLY METRICS & TRACK RECORD CALCULATION ───
  const weeklyMetrics = useMemo(() => {
    const now = new Date();
    // Monday is start of week (1), Sunday is end (0)
    const currentDay = now.getDay();
    const distanceToMonday = currentDay === 0 ? -6 : 1 - currentDay;

    const monday = new Date(now);
    monday.setDate(now.getDate() + distanceToMonday + (selectedWeekOffset * 7));
    monday.setHours(0, 0, 0, 0);

    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);

    const formatShortDate = (d: Date) => {
      return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
    };

    const isCurrentWeek = selectedWeekOffset === 0;
    const weekLabel = isCurrentWeek
      ? `Minggu Ini (${formatShortDate(monday)} – ${formatShortDate(sunday)} ${sunday.getFullYear()})`
      : `${formatShortDate(monday)} – ${formatShortDate(sunday)} ${sunday.getFullYear()}`;

    // Filter assessments in this week
    const weekAssessments = sortedHistory.filter(item => {
      const itemDate = new Date(item.created_at || item.date || 0);
      return itemDate >= monday && itemDate <= sunday;
    });

    const dayNames = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];
    const shortDayNames = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];

    const days: DayMetric[] = dayNames.map((fullName, idx): DayMetric => {
      const targetDate = new Date(monday);
      targetDate.setDate(monday.getDate() + idx);

      const dayMatches = weekAssessments.filter(item => {
        const d = new Date(item.created_at || item.date || 0);
        return d.getFullYear() === targetDate.getFullYear() &&
               d.getMonth() === targetDate.getMonth() &&
               d.getDate() === targetDate.getDate();
      });

      if (dayMatches.length === 0) {
        return {
          dayIndex: idx,
          dayName: shortDayNames[idx],
          fullDayName: fullName,
          dateNumber: targetDate.getDate(),
          targetDate,
          status: 'empty' as const,
          statusLabel: 'Belum Ada Catatan',
          totalCaffeine: 0,
          cups: 0,
          lastCoffeeTime: null as string | null,
          sleepHours: null as number | null,
          mealStatus: null as string | null,
          assessmentCount: 0,
          issues: [] as string[],
          positives: [] as string[],
        };
      }

      let totalCaffeine = 0;
      let totalCups = 0;
      let latestTime = '';
      let sleepHours: number | null = null;
      let hadEmptyStomach = false;
      let hadHighImpact = false;
      const dayIssues: string[] = [];
      const dayPositives: string[] = [];

      dayMatches.forEach(item => {
        const mg = Math.round(item.estimated_caffeine_mg || 0);
        totalCaffeine += mg;
        totalCups += (item.coffee_cups_per_day || 1);
        if (item.last_coffee_time) latestTime = item.last_coffee_time;
        if (item.sleep_duration) sleepHours = Number(item.sleep_duration);
        if (item.meal_status === 'belum_makan') hadEmptyStomach = true;
        if (item.ml_prediction === 1 || item.sleep_impact === 'High') hadHighImpact = true;
      });

      let penalty = 0;
      if (totalCaffeine > 350) {
        dayIssues.push(`Kafein tinggi (${totalCaffeine} mg)`);
        penalty += 1;
      }
      if (latestTime) {
        const [h] = latestTime.split(':').map(Number);
        if (h >= 17) {
          dayIssues.push(`Ngopi larut malam (${latestTime})`);
          penalty += 2;
        } else if (h >= 15) {
          dayIssues.push(`Ngopi sore hari (${latestTime})`);
          penalty += 1;
        } else {
          dayPositives.push(`Cut-off pagi/siang disiplin (${latestTime})`);
        }
      }
      if (hadEmptyStomach) {
        dayIssues.push('Minum kopi saat perut kosong');
        penalty += 1;
      } else {
        dayPositives.push('Lambung aman (sudah makan)');
      }
      if (sleepHours !== null) {
        if (sleepHours < 6) {
          dayIssues.push(`Tidur kurang (${sleepHours} jam)`);
          penalty += 1;
        } else if (sleepHours >= 7) {
          dayPositives.push(`Tidur cukup (${sleepHours} jam)`);
        }
      }
      if (hadHighImpact) {
        penalty += 1;
      }

      let status: 'good' | 'moderate' | 'poor' = 'good';
      let statusLabel = 'Bagus & Sehat';
      if (penalty >= 2) {
        status = 'poor';
        statusLabel = 'Perlu Perhatian';
      } else if (penalty === 1) {
        status = 'moderate';
        statusLabel = 'Cukup / Waspada';
      }

      return {
        dayIndex: idx,
        dayName: shortDayNames[idx],
        fullDayName: fullName,
        dateNumber: targetDate.getDate(),
        targetDate,
        status,
        statusLabel,
        totalCaffeine,
        cups: totalCups,
        lastCoffeeTime: latestTime || null,
        sleepHours,
        mealStatus: hadEmptyStomach ? 'belum_makan' : 'sudah_makan',
        assessmentCount: dayMatches.length,
        issues: dayIssues,
        positives: dayPositives,
      };
    });

    const recordedDays = days.filter(d => d.status !== 'empty');
    const goodDays = recordedDays.filter(d => d.status === 'good');
    const moderateDays = recordedDays.filter(d => d.status === 'moderate');
    const poorDays = recordedDays.filter(d => d.status === 'poor');

    let totalCaffeineWeek = 0;
    let totalSleepWeek = 0;
    let sleepDaysCount = 0;

    recordedDays.forEach(d => {
      totalCaffeineWeek += d.totalCaffeine;
      if (d.sleepHours !== null) {
        totalSleepWeek += d.sleepHours;
        sleepDaysCount++;
      }
    });

    const avgCaffeine = recordedDays.length > 0 ? Math.round(totalCaffeineWeek / recordedDays.length) : 0;
    const avgSleep = sleepDaysCount > 0 ? (totalSleepWeek / sleepDaysCount).toFixed(1) : '-';

    let score = 100;
    if (recordedDays.length === 0) {
      score = 0;
    } else {
      score = Math.max(30, Math.min(100, Math.round(100 - (poorDays.length * 20) - (moderateDays.length * 8))));
    }

    let scoreCategory = 'Sangat Baik';
    let scoreColor = 'emerald';
    if (score >= 80) {
      scoreCategory = 'Disiplin Sangat Baik';
      scoreColor = 'emerald';
    } else if (score >= 60) {
      scoreCategory = 'Cukup Stabil';
      scoreColor = 'amber';
    } else {
      scoreCategory = 'Perlu Evaluasi & Istirahat';
      scoreColor = 'rose';
    }

    // Dynamic positive bullet points
    const goodPoints: string[] = [];
    if (goodDays.length > 0) {
      goodPoints.push(`${goodDays.length} dari ${recordedDays.length} hari tercatat memiliki ritme konsumsi dan tidur sangat prima.`);
    }
    const emptyStomachCount = recordedDays.filter(d => d.mealStatus === 'belum_makan').length;
    if (emptyStomachCount === 0 && recordedDays.length > 0) {
      goodPoints.push('100% selalu makan sebelum ngopi, melindungi mukosa lambung dari iritasi asam klorida (HCl).');
    }
    if (avgCaffeine > 0 && avgCaffeine <= 250) {
      goodPoints.push(`Rata-rata kafein harian (${avgCaffeine} mg) berada di zona aman, jauh di bawah batas toleransi FDA 400 mg.`);
    }
    const earlyCutoffCount = recordedDays.filter(d => d.lastCoffeeTime && Number(d.lastCoffeeTime.split(':')[0]) < 15).length;
    if (earlyCutoffCount > 0) {
      goodPoints.push(`${earlyCutoffCount} hari berhasil mematuhi cut-off time sebelum jam 15:00 untuk mencegah insomnia.`);
    }
    if (avgSleep !== '-' && Number(avgSleep) >= 7) {
      goodPoints.push(`Rata-rata durasi tidur mencapai ${avgSleep} jam/malam, mendukung pemulihan adenosin dan regenerasi seluler.`);
    }
    if (goodPoints.length === 0) {
      goodPoints.push('Mulai membiasakan pencatatan harian secara konsisten untuk membangun ritme sirkadian sehat.');
    }

    // Dynamic improvement points
    const improvementPoints: string[] = [];
    if (poorDays.length > 0) {
      improvementPoints.push(`Terdapat ${poorDays.length} hari dengan beban metabolisme tinggi yang berisiko mengganggu fase deep sleep.`);
    }
    const lateCoffeeDays = recordedDays.filter(d => d.lastCoffeeTime && Number(d.lastCoffeeTime.split(':')[0]) >= 16);
    if (lateCoffeeDays.length > 0) {
      improvementPoints.push(`Ditemukan sesi ngopi sore/malam (${lateCoffeeDays.map(d => `${d.dayName} ${d.lastCoffeeTime}`).join(', ')}). Waktu paruh kafein 5 jam akan menunda kantuk.`);
    }
    if (emptyStomachCount > 0) {
      improvementPoints.push(`Tercatat ${emptyStomachCount} hari ngopi saat perut kosong. Disarankan mengisi perut dengan makanan ringan terlebih dahulu.`);
    }
    const shortSleepDays = recordedDays.filter(d => d.sleepHours !== null && d.sleepHours < 6);
    if (shortSleepDays.length > 0) {
      improvementPoints.push(`Durasi tidur kurang dari 6 jam pada ${shortSleepDays.length} hari, mengurangi efisiensi restorasi sirkadian.`);
    }
    if (improvementPoints.length === 0) {
      improvementPoints.push('Pola kebiasaan sudah sangat bagus! Pertahankan ritme ini untuk menjaga stamina dan kualitas tidur optimal.');
    }

    return {
      monday,
      sunday,
      weekLabel,
      isCurrentWeek,
      weekAssessments,
      days,
      recordedDaysCount: recordedDays.length,
      goodDaysCount: goodDays.length,
      moderateDaysCount: moderateDays.length,
      poorDaysCount: poorDays.length,
      avgCaffeine,
      avgSleep,
      score,
      scoreCategory,
      scoreColor,
      goodPoints,
      improvementPoints,
    };
  }, [sortedHistory, selectedWeekOffset]);

  // ─── DAILY PDF EXPORT (2-PAGE MEDICAL REPORT) ───
  const exportDailyPDF = async (item: any) => {
    if (!item) {
      alert("Pilih sesi yang ingin diekspor terlebih dahulu.");
      return;
    }
    setIsExporting(true);
    setShowExportMenu(false);
    try {
      const doc = new jsPDF('p', 'mm', 'a4');
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();

      let formattedDate = 'Hari Ini';
      try {
        const rawDate = item.created_at || item.date || item.assessment_date;
        if (rawDate) {
          const d = new Date(rawDate);
          if (!isNaN(d.getTime())) {
            formattedDate = d.toLocaleDateString('id-ID', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
              year: 'numeric'
            });
          } else {
            formattedDate = String(rawDate).split('T')[0];
          }
        }
      } catch {
        formattedDate = new Date().toLocaleDateString('id-ID');
      }

      const rawTime = item.last_coffee_time || '15:00';
      const cleanTime = rawTime.includes(':') 
        ? rawTime.split(':').slice(0, 2).join(':') + ' WIB' 
        : rawTime + ' WIB';

      const estimatedMg = Math.round(item.estimated_caffeine_mg || 0);
      const isHighImpact = item.ml_prediction === 1 || item.sleep_impact === 'High';
      const waterIntake = item.water_intake_ml || 1500;
      const mealInfo = item.meal_status === 'belum_makan' 
        ? 'Perut Kosong (Belum Makan)' 
        : `Sudah Makan (${item.last_meal_time || '12:30'})`;
      const exerciseInfo = item.exercise_timing === 'sebelum_kopi'
        ? `Sebelum Kopi (${item.exercise_duration_minutes || 30} mnt)`
        : (item.exercise_timing === 'sesudah_kopi' ? `Sesudah Kopi (${item.exercise_duration_minutes || 30} mnt)` : 'Tidak Olahraga');
      const smokingInfo = !item.smoking_intensity || item.smoking_intensity === 'none'
        ? 'Tidak Merokok'
        : `Merokok: ${item.smoking_intensity} Batang/Hari`;

      const [h] = (rawTime || '12:00').split(':').map(Number);
      const isNight = h >= 20;
      const isLate = h >= 16;
      const sleepDur = Number(item.sleep_duration) || 7;

      let bLoad = Math.min(100, Math.round((estimatedMg / 400) * 80));
      if (isNight && estimatedMg > 0) bLoad = Math.min(100, bLoad + 30);
      else if (isLate && estimatedMg > 0) bLoad = Math.min(100, bLoad + 20);
      if (sleepDur <= 5 && estimatedMg > 0) bLoad = Math.min(100, bLoad + 20);

      let hLoad = Math.min(100, Math.round((estimatedMg / 400) * 75));
      if (item.meal_status === 'belum_makan' && estimatedMg > 0) hLoad = Math.min(100, hLoad + 12);
      if (isNight && estimatedMg > 0) hLoad = Math.min(100, hLoad + 15);

      let sLoad = Math.min(100, Math.round((estimatedMg / 400) * 65));
      if (item.meal_status === 'belum_makan' && estimatedMg > 0) sLoad = Math.min(100, sLoad + 30);

      let kLoad = Math.min(100, Math.round((estimatedMg / 400) * 60));
      if (waterIntake < 1000) kLoad = Math.min(100, kLoad + 25);
      if (sleepDur <= 5 && estimatedMg > 0) kLoad = Math.min(100, kLoad + 15);

      let lLoad = Math.min(100, Math.round((estimatedMg / 400) * 70));
      if (item.smoking_intensity && item.smoking_intensity !== 'none') lLoad = Math.min(100, lLoad + 20);

      let blLoad = Math.min(100, Math.round((estimatedMg / 400) * 50));
      if (waterIntake < 1000 && estimatedMg > 0) blLoad = Math.min(100, blLoad + 15);
      if (isNight && estimatedMg > 150) blLoad = Math.min(100, blLoad + 30);

      let eLoad = Math.min(100, Math.round((estimatedMg / 400) * 35));
      if (waterIntake < 1000 && estimatedMg > 0) eLoad = Math.min(100, eLoad + 25);
      if (sleepDur <= 5) eLoad = Math.min(100, eLoad + 25);

      let mLoad = Math.min(100, Math.round((estimatedMg / 400) * 45));
      if (waterIntake < 1000 && estimatedMg > 0) mLoad = Math.min(100, mLoad + 25);
      if (sleepDur <= 5 && estimatedMg > 0) mLoad = Math.min(100, mLoad + 20);

      let safeTimePoint = '> 14 jam';
      if (estimatedMg < 50) safeTimePoint = 'Sudah Aman';
      else {
        const hoursNeeded = Math.ceil(Math.log(50 / estimatedMg) / Math.log(0.5) * 5);
        const finalH = (h + hoursNeeded) % 24;
        safeTimePoint = `pk. ${finalH.toString().padStart(2, '0')}:00 WIB`;
      }

      // ─── HALAMAN 1 ───
      doc.setFillColor(15, 23, 42);
      doc.rect(0, 0, pageWidth, 24, 'F');

      doc.setFontSize(13);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(255, 255, 255);
      doc.text("CAFFISENSE - LEMBAR KONSULTASI MEDIS HARIAN", 15, 11);

      doc.setFontSize(7.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(203, 213, 225);
      doc.text("Instrumen Skrining Klinis Metabolisme Kafein & Interaksi Fisiologis Tubuh (Kemenkes/FDA Standards)", 15, 17);

      // Metadata Box
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.4);
      doc.roundedRect(15, 28, pageWidth - 30, 20, 2, 2, 'FD');

      doc.setFontSize(7.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(30, 41, 59);
      doc.text(`Nama Pasien : ${user?.name || 'Pasien CaffiSense'}`, 18, 34);
      doc.text(`Email / Kontak : ${user?.email || '-'}`, 18, 39);
      doc.text(`Status Sirkadian : ${isHighImpact ? 'POTENSI GANGGUAN TINGGI' : 'OPTIMAL / AMAN'}`, 18, 44);

      doc.text(`Tanggal Pemeriksaan : ${formattedDate}`, pageWidth / 2 + 10, 34);
      doc.text(`Jam Sesi Terakhir : ${cleanTime}`, pageWidth / 2 + 10, 39);
      doc.text(`Beban Kafein Masuk : ${estimatedMg} mg (${Math.round((estimatedMg / 400) * 100)}% Batas FDA)`, pageWidth / 2 + 10, 44);

      // Table 1: Parameters
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text("1. Parameter Kebiasaan Harian Pasien (Sesi Terpilih)", 15, 53);

      autoTable(doc, {
        startY: 56,
        theme: 'grid',
        headStyles: { fillColor: [30, 41, 59], fontSize: 8, fontStyle: 'bold' },
        styles: { fontSize: 7.2, cellPadding: 1.4 },
        columnStyles: {
          0: { cellWidth: 48, fontStyle: 'bold' },
          1: { cellWidth: 46 },
          2: { cellWidth: 96 }
        },
        head: [["Parameter Klinis", "Data Input Pasien", "Interpretasi & Standar Klinis Medis"]],
        body: [
          ["Konsumsi Kopi", `${item.coffee_cups_per_day || 1} Cangkir (${item.coffee_size || 'Sedang'})`, "Batas aman wajar Kemenkes/FDA: Maksimal 3-4 cangkir standar per hari"],
          ["Beban Kafein", `${estimatedMg} mg (${Math.round((estimatedMg / 400) * 100)}% Batas FDA)`, estimatedMg > 400 ? "Melebihi ambang batas toleransi harian (400 mg/hari)" : "Berada dalam batas ambang toleransi harian aman"],
          ["Waktu Minum Terakhir", cleanTime, h >= 18 ? "Sangat dekat dengan jam tidur (< 6 jam sebelum tidur)" : "Waktu cut-off aman terhadap ritme tidur alami"],
          ["Kondisi Perut & Lambung", mealInfo, item.meal_status === 'belum_makan' ? "Sekresi asam HCl lambung berlebih tanpa buffer makanan" : "Mukosa lambung terlindungi buffer makanan"],
          ["Aktivitas Olahraga", exerciseInfo, "Olahraga memobilisasi glikogen otot dan sirkulasi peredaran darah perifer"],
          ["Konsumsi Nikotin / Rokok", smokingInfo, item.smoking_intensity && item.smoking_intensity !== 'none' ? "Nikotin mempercepat induksi enzim CYP1A2 hati hingga 2x lipat" : "Metabolisme eliminasi enzim CYP1A2 hati normal"],
          ["Asupan Air Putih", `${waterIntake} ml/hari`, waterIntake < 1000 ? "Dehidrasi berat; mengentalkan darah & memicu takikardia" : "Hidrasi mencukupi standar Kemenkes 2.000 ml"],
          ["Pola Istirahat / Tidur", item.sleep_duration ? `${item.sleep_duration} Jam (${item.sleep_quality || 'Cukup'})` : "Tidak dicatat", "Rekomendasi Kemenkes RI & AASM: 7-8 jam per malam"],
          ["Perkiraan Bebas Kafein", safeTimePoint, "Waktu paruh ~5 jam; ambang <50 mg untuk fase Deep Sleep nyenyak"]
        ]
      });

      // Table 2: 8 Organs
      const t1EndY = (doc as any).lastAutoTable.finalY + 4;
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text("2. Pemetaan Beban Fisiologis 8 Organ Tubuh", 15, t1EndY + 1);

      autoTable(doc, {
        startY: t1EndY + 3,
        head: [["Organ Tubuh", "Beban (%)", "Status Klinis", "Keterangan Medis & Mekanisme Fisiologis"]],
        theme: 'grid',
        headStyles: { fillColor: [51, 65, 85], fontSize: 8, fontStyle: 'bold' },
        styles: { fontSize: 7.2, cellPadding: 1.4 },
        columnStyles: {
          0: { cellWidth: 46, fontStyle: 'bold' },
          1: { cellWidth: 18 },
          2: { cellWidth: 28, fontStyle: 'bold' },
          3: { cellWidth: 98 }
        },
        body: [
          ["Otak & Sistem Saraf", `${bLoad}%`, bLoad >= 70 ? 'Hiperstimulasi' : bLoad >= 40 ? 'Waspada' : 'Optimal', "Blokade reseptor adenosin A1/A2A; menunda kantuk alami & fase tidur dalam"],
          ["Jantung & Sirkulasi", `${hLoad}%`, hLoad >= 70 ? 'Beban Tinggi' : hLoad >= 40 ? 'Waspada' : 'Stabil', "Pelepasan katekolamin adrenalin; beban kontraktilitas pompa ventrikel"],
          ["Lambung & Saluran Cerna", `${sLoad}%`, sLoad >= 70 ? 'Iritasi Asam' : sLoad >= 40 ? 'Waspada' : 'Normal', "Sekresi asam lambung HCl berlebih terhadap lapisan mukosa lambung"],
          ["Ginjal & Cairan", `${kLoad}%`, kLoad >= 70 ? 'Filtrasi Berat' : kLoad >= 40 ? 'Waspada' : 'Aman', "Diuresis akut; peningkatan ekskresi cairan & ion natrium/kalium"],
          ["Hati (Enzim CYP1A2)", `${lLoad}%`, lLoad >= 70 ? 'Beban Hepatik' : lLoad >= 40 ? 'Waspada' : 'Normal', "Metabolisme degradasi kafein oleh enzim sitokrom P450 di organ hati"],
          ["Kandung Kemih", `${blLoad}%`, blLoad >= 70 ? 'Risiko Nokturia' : blLoad >= 40 ? 'Waspada' : 'Normal', "Iritasi urin pekat & dorongan kencing berulang di jam tidur malam"],
          ["Mata & Saraf Visual", `${eLoad}%`, eLoad >= 70 ? 'Kering / Lelah' : eLoad >= 40 ? 'Waspada' : 'Optimal', "Astenopia otot siliaris kelopak & dehidrasi lapisan air mata (Dry Eye)"],
          ["Sistem Otot Somatik", `${mLoad}%`, mLoad >= 70 ? 'Ketegangan/Kram' : mLoad >= 40 ? 'Waspada' : 'Relaks', "Deplesi ion elektrolit kalsium/magnesium & keterbatasan pemulihan somatik"]
        ]
      });

      // Quick Clinical Summary Box
      const sumBoxY = (doc as any).lastAutoTable.finalY + 4;
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.4);
      doc.roundedRect(15, sumBoxY, pageWidth - 30, 26, 2, 2, 'FD');

      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text("Ringkasan Temuan Klinis Utama (Sesi Hari Ini):", 18, sumBoxY + 5);

      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(71, 85, 105);
      doc.text(`• Beban Kafein: ${estimatedMg} mg (${Math.round((estimatedMg / 400) * 100)}% dari Batas FDA 400 mg) ${estimatedMg > 400 ? '— Melebihi ambang batas toleransi harian.' : '— Berada dalam batas aman.'}`, 18, sumBoxY + 10);
      doc.text(`• Waktu Konsumsi: Sesi terakhir pukul ${cleanTime}. Perkiraan tubuh bebas kafein (<50 mg): ${safeTimePoint}.`, 18, sumBoxY + 14.5);
      doc.text(`• Status Hidrasi: Asupan air ${waterIntake} ml ${waterIntake < 1000 ? '(Dehidrasi berat — beban filtrasi ginjal & mata meningkat).' : '(Hidrasi tercukupi).' }`, 18, sumBoxY + 18.5);
      doc.text(`• Pola Istirahat: Tidur ${item.sleep_duration ? `${item.sleep_duration} Jam (${item.sleep_quality || 'Cukup'})` : 'tidak dicatat'} ${Number(item.sleep_duration) <= 5 ? '— defisit tidur akut menghambat pemulihan sirkadian.' : ''}`, 18, sumBoxY + 22.5);

      doc.setFontSize(6.5);
      doc.setTextColor(148, 163, 184);
      doc.text("CaffiSense Clinical Health Summary  |  Halaman 1 dari 2", pageWidth / 2, pageHeight - 5, { align: 'center' });

      // ─── HALAMAN 2 ───
      doc.addPage();

      doc.setFillColor(15, 23, 42);
      doc.rect(0, 0, pageWidth, 16, 'F');

      doc.setFontSize(9.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(255, 255, 255);
      doc.text("CAFFISENSE - LEMBAR EVALUASI MEDIS & KONSULTASI", 15, 7.5);

      doc.setFontSize(7.2);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(203, 213, 225);
      doc.text(`Pasien: ${user?.name || 'Pasien CaffiSense'}   |   Pemeriksaan: ${formattedDate}   |   Waktu: ${cleanTime}`, 15, 12.5);

      doc.setFillColor(249, 115, 22);
      doc.circle(pageWidth - 15, 8.5, 2, 'F');

      doc.setFontSize(9.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text("3. Ulasan Klinis & Panduan Pemulihan (Rekomendasi Sistem AI)", 15, 23);

      const rawLines = (item.ai_analysis || "Tidak ada evaluasi AI yang tercatat pada sesi ini.")
        .replace(/[*#]/g, '')
        .split('\n')
        .map((l: string) => l.trim())
        .filter(Boolean);

      const filteredLines = rawLines.filter((line: string) => {
        const lower = line.toLowerCase();
        if (line === '---' || line === '***' || line === '___') return false;
        if (lower.startsWith('halo') || lower.startsWith('terima kasih')) return false;
        if (lower.startsWith('sebagai praktisi') || lower.startsWith('mari kita bedah')) return false;
        if (lower.startsWith('profil yang anda') || lower.startsWith('jangan khawatir')) return false;
        if (lower.startsWith('tubuh anda saat ini sedang mengolah')) return false;
        if (lower.startsWith('inilah yang sedang dirasakan')) return false;
        if (lower.startsWith('semoga') || lower.startsWith('salam sehat')) return false;
        if (lower.startsWith('jika pola kombinasi')) return false;
        return true;
      });

      let currentY = 29;
      const maxTextY = pageHeight - 44;

      for (const line of filteredLines) {
        const isHeader = /^\d+\.\s+[A-Za-z]/.test(line) || /^[A-D]\.\s+[A-Za-z]/.test(line);

        if (isHeader) {
          if (currentY > maxTextY - 8) {
            doc.addPage();
            doc.setFillColor(15, 23, 42);
            doc.rect(0, 0, pageWidth, 16, 'F');
            doc.setFontSize(9.5);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(255, 255, 255);
            doc.text("CAFFISENSE - EVALUASI MEDIS (LANJUTAN)", 15, 7.5);
            doc.setFontSize(7.2);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(203, 213, 225);
            doc.text(`Pasien: ${user?.name || 'Pasien CaffiSense'}   |   Pemeriksaan: ${formattedDate}`, 15, 12.5);
            currentY = 24;
          } else {
            currentY += 1.5;
          }

          doc.setFontSize(7.8);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(15, 23, 42);
          doc.text(line, 15, currentY);
          currentY += 4;
        } else {
          const cleanItem = line.replace(/^[-•*]\s*/, '').replace(/^\d+\.\s*/, '');
          const bulletText = `•  ${cleanItem}`;

          const itemLines = doc.splitTextToSize(bulletText, 180);
          const blockHeight = (itemLines.length * 3.3) + 1.8;

          if (currentY + blockHeight > maxTextY) {
            doc.addPage();
            doc.setFillColor(15, 23, 42);
            doc.rect(0, 0, pageWidth, 16, 'F');
            doc.setFontSize(9.5);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(255, 255, 255);
            doc.text("CAFFISENSE - EVALUASI MEDIS (LANJUTAN)", 15, 7.5);
            doc.setFontSize(7.2);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(203, 213, 225);
            doc.text(`Pasien: ${user?.name || 'Pasien CaffiSense'}   |   Pemeriksaan: ${formattedDate}`, 15, 12.5);
            currentY = 24;
          }

          doc.setFontSize(7.2);
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(51, 65, 85);
          doc.text(bulletText, 15, currentY, { align: 'justify', maxWidth: 180 });
          currentY += (itemLines.length * 3.3) + 1.6;
        }
      }

      // Section 4: Catatan Dokter
      const sigBoxY = Math.max(currentY + 4, pageHeight - 42);
      doc.setDrawColor(203, 213, 225);
      doc.setLineWidth(0.4);
      doc.setFillColor(250, 250, 250);
      doc.roundedRect(15, sigBoxY, pageWidth - 30, 26, 2, 2, 'FD');

      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text("Catatan Dokter / Tenaga Medis Pemeriksa:", 18, sigBoxY + 5);

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(148, 163, 184);
      doc.text("..................................................................................................................................................................................................", 18, sigBoxY + 11);
      doc.text("..................................................................................................................................................................................................", 18, sigBoxY + 16);

      doc.setFontSize(7);
      doc.setTextColor(71, 85, 105);
      doc.text("Tanggal Konsultasi: .......................................", 18, sigBoxY + 22);
      doc.text("Tanda Tangan & Stempel Faskes: ___________________________", pageWidth - 98, sigBoxY + 22);

      doc.setFontSize(6.2);
      doc.setTextColor(148, 163, 184);
      doc.text("Dokumen klinis ini diterbitkan secara otomatis oleh CaffiSense sebagai instrumen skrining medis ritme sirkadian harian.", 15, pageHeight - 5);
      doc.text("Halaman 2 dari 2", pageWidth - 15, pageHeight - 5, { align: 'right' });

      const fileDate = (item.created_at || new Date().toISOString()).split('T')[0];
      doc.save(`CaffiSense_LaporanMedis_Harian_${fileDate}.pdf`);
    } catch (err) {
      console.error(err);
      alert("Gagal mencetak PDF Harian.");
    } finally {
      setIsExporting(false);
    }
  };

  // ─── DAILY EXCEL EXPORT (.XLS HTML SPREADSHEET TABLE) ───
  const exportDailyExcel = (item: any) => {
    if (!item) {
      alert("Pilih sesi yang ingin diekspor terlebih dahulu.");
      return;
    }
    setShowExportMenu(false);

    try {
      let formattedDate = 'Hari Ini';
      try {
        const rawDate = item.created_at || item.date || item.assessment_date;
        if (rawDate) {
          const d = new Date(rawDate);
          if (!isNaN(d.getTime())) {
            formattedDate = d.toLocaleDateString('id-ID', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
              year: 'numeric'
            });
          } else {
            formattedDate = String(rawDate).split('T')[0];
          }
        }
      } catch {
        formattedDate = new Date().toLocaleDateString('id-ID');
      }

      const rawTime = item.last_coffee_time || '15:00';
      const cleanTime = rawTime.includes(':') 
        ? rawTime.split(':').slice(0, 2).join(':') + ' WIB' 
        : rawTime + ' WIB';

      const estimatedMg = Math.round(item.estimated_caffeine_mg || 0);
      const waterIntake = item.water_intake_ml || 1500;
      const smokingInfo = !item.smoking_intensity || item.smoking_intensity === 'none'
        ? 'Tidak Merokok'
        : `Merokok: ${item.smoking_intensity} Batang/Hari`;
      const isHighImpact = item.ml_prediction === 1 || item.sleep_impact === 'High';

      const [h] = (rawTime || '12:00').split(':').map(Number);
      const isNight = h >= 20;
      const isLate = h >= 16;
      const sleepDur = Number(item.sleep_duration) || 7;

      let bLoad = Math.min(100, Math.round((estimatedMg / 400) * 80));
      if (isNight && estimatedMg > 0) bLoad = Math.min(100, bLoad + 30);
      else if (isLate && estimatedMg > 0) bLoad = Math.min(100, bLoad + 20);
      if (sleepDur <= 5 && estimatedMg > 0) bLoad = Math.min(100, bLoad + 20);

      let hLoad = Math.min(100, Math.round((estimatedMg / 400) * 75));
      if (item.meal_status === 'belum_makan' && estimatedMg > 0) hLoad = Math.min(100, hLoad + 12);
      if (isNight && estimatedMg > 0) hLoad = Math.min(100, hLoad + 15);

      let sLoad = Math.min(100, Math.round((estimatedMg / 400) * 65));
      if (item.meal_status === 'belum_makan' && estimatedMg > 0) sLoad = Math.min(100, sLoad + 30);

      let kLoad = Math.min(100, Math.round((estimatedMg / 400) * 60));
      if (waterIntake < 1000) kLoad = Math.min(100, kLoad + 25);
      if (sleepDur <= 5 && estimatedMg > 0) kLoad = Math.min(100, kLoad + 15);

      let lLoad = Math.min(100, Math.round((estimatedMg / 400) * 70));
      if (item.smoking_intensity && item.smoking_intensity !== 'none') lLoad = Math.min(100, lLoad + 20);

      let blLoad = Math.min(100, Math.round((estimatedMg / 400) * 50));
      if (waterIntake < 1000 && estimatedMg > 0) blLoad = Math.min(100, blLoad + 15);
      if (isNight && estimatedMg > 150) blLoad = Math.min(100, blLoad + 30);

      let eLoad = Math.min(100, Math.round((estimatedMg / 400) * 35));
      if (waterIntake < 1000 && estimatedMg > 0) eLoad = Math.min(100, eLoad + 25);
      if (sleepDur <= 5) eLoad = Math.min(100, eLoad + 25);

      let mLoad = Math.min(100, Math.round((estimatedMg / 400) * 45));
      if (waterIntake < 1000 && estimatedMg > 0) mLoad = Math.min(100, mLoad + 25);
      if (sleepDur <= 5 && estimatedMg > 0) mLoad = Math.min(100, mLoad + 20);

      let safeTimePoint = '> 14 jam';
      if (estimatedMg < 50) safeTimePoint = 'Sudah Aman';
      else {
        const hoursNeeded = Math.ceil(Math.log(50 / estimatedMg) / Math.log(0.5) * 5);
        const finalH = (h + hoursNeeded) % 24;
        safeTimePoint = `pk. ${finalH.toString().padStart(2, '0')}:00 WIB`;
      }

      const organs = [
        { name: "Otak & Sistem Saraf", load: bLoad, status: bLoad >= 70 ? 'Hiperstimulasi' : bLoad >= 40 ? 'Waspada' : 'Optimal', desc: "Blokade reseptor adenosin A1/A2A; menunda kantuk alami & fase tidur dalam" },
        { name: "Jantung & Sirkulasi", load: hLoad, status: hLoad >= 70 ? 'Beban Tinggi' : hLoad >= 40 ? 'Waspada' : 'Stabil', desc: "Pelepasan katekolamin adrenalin; beban kontraktilitas pompa ventrikel" },
        { name: "Lambung & Saluran Cerna", load: sLoad, status: sLoad >= 70 ? 'Iritasi Asam' : sLoad >= 40 ? 'Waspada' : 'Normal', desc: "Sekresi asam lambung HCl berlebih terhadap lapisan mukosa lambung" },
        { name: "Ginjal & Cairan", load: kLoad, status: kLoad >= 70 ? 'Filtrasi Berat' : kLoad >= 40 ? 'Waspada' : 'Aman', desc: "Diuresis akut; peningkatan ekskresi cairan & ion natrium/kalium" },
        { name: "Hati (Enzim CYP1A2)", load: lLoad, status: lLoad >= 70 ? 'Beban Hepatik' : lLoad >= 40 ? 'Waspada' : 'Normal', desc: "Metabolisme degradasi kafein oleh enzim sitokrom P450 di organ hati" },
        { name: "Kandung Kemih", load: blLoad, status: blLoad >= 70 ? 'Risiko Nokturia' : blLoad >= 40 ? 'Waspada' : 'Normal', desc: "Iritasi urin pekat & dorongan kencing berulang di jam tidur malam" },
        { name: "Mata & Saraf Visual", load: eLoad, status: eLoad >= 70 ? 'Kering / Lelah' : eLoad >= 40 ? 'Waspada' : 'Optimal', desc: "Astenopia otot siliaris kelopak & dehidrasi lapisan air mata (Dry Eye)" },
        { name: "Sistem Otot Somatik", load: mLoad, status: mLoad >= 70 ? 'Ketegangan/Kram' : mLoad >= 40 ? 'Waspada' : 'Relaks', desc: "Deplesi ion elektrolit kalsium/magnesium & keterbatasan pemulihan somatik" }
      ];

      const getBadgeStyle = (load: number) => {
        if (load >= 70) return 'background-color: #fee2e2; color: #b91c1c; font-weight: bold; text-align: center;';
        if (load >= 40) return 'background-color: #fef3c7; color: #b45309; font-weight: bold; text-align: center;';
        return 'background-color: #dcfce7; color: #15803d; font-weight: bold; text-align: center;';
      };

      const excelHtml = `
<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
<head>
  <meta http-equiv="content-type" content="application/vnd.ms-excel; charset=UTF-8">
  <style>
    body { font-family: 'Segoe UI', Calibri, Arial, sans-serif; font-size: 10.5pt; color: #1e293b; }
    table { border-collapse: collapse; width: 100%; margin-bottom: 20px; }
    th { border: 1px solid #cbd5e1; padding: 7px 10px; font-weight: bold; }
    td { border: 1px solid #cbd5e1; padding: 6px 10px; font-size: 10pt; }
    .header-banner { background-color: #0f172a; color: #ffffff; font-size: 13pt; font-weight: bold; text-align: center; height: 38px; }
    .section-title { background-color: #334155; color: #ffffff; font-size: 10.5pt; font-weight: bold; padding: 6px 10px; text-align: left; }
    .th-col { background-color: #f1f5f9; color: #0f172a; font-weight: bold; text-align: left; }
    .label-col { background-color: #f8fafc; font-weight: bold; color: #334155; width: 200px; }
    .val-col { width: 280px; }
  </style>
</head>
<body>
  <table>
    <tr>
      <th colspan="4" class="header-banner">CAFFISENSE - LEMBAR KONSULTASI MEDIS HARIAN</th>
    </tr>
    <tr>
      <td class="label-col">Nama Pasien / User</td>
      <td class="val-col">${user?.name || 'Pasien CaffiSense'}</td>
      <td class="label-col">Tanggal Pemeriksaan</td>
      <td class="val-col">${formattedDate}</td>
    </tr>
    <tr>
      <td class="label-col">Email / Kontak</td>
      <td class="val-col">${user?.email || '-'}</td>
      <td class="label-col">Jam Sesi Terakhir</td>
      <td class="val-col">${cleanTime}</td>
    </tr>
    <tr>
      <td class="label-col">Status Risiko Sirkadian</td>
      <td class="val-col" style="font-weight: bold; color: ${isHighImpact ? '#dc2626' : '#16a34a'};">
        ${isHighImpact ? 'POTENSI GANGGUAN TINGGI' : 'OPTIMAL / AMAN'}
      </td>
      <td class="label-col">Total Kafein Terdeteksi</td>
      <td class="val-col"><b>${estimatedMg} mg</b> (${Math.round((estimatedMg / 400) * 100)}% dari Batas FDA 400 mg)</td>
    </tr>
    <tr><td colspan="4" style="height: 12px; border: none;"></td></tr>
    <tr>
      <th colspan="4" class="section-title">1. DATA PARAMETER KEBIASAAN HARIAN (SESI INI)</th>
    </tr>
    <tr>
      <th class="th-col" style="width: 220px;">Parameter Klinis</th>
      <th class="th-col" style="width: 150px; text-align: center;">Nilai Sesi Ini</th>
      <th class="th-col" style="width: 140px; text-align: center;">Status Skrining</th>
      <th class="th-col">Interpretasi & Standar Medis</th>
    </tr>
    <tr>
      <td><b>Konsumsi Kopi Harian</b></td>
      <td style="text-align: center;">${item.coffee_cups_per_day || 1} Cangkir (${item.coffee_size || 'Sedang'})</td>
      <td style="text-align: center; ${(item.coffee_cups_per_day || 1) > 4 ? 'color: #dc2626; font-weight: bold;' : 'color: #16a34a;'}">${(item.coffee_cups_per_day || 1) > 4 ? 'Berlebih' : 'Normal'}</td>
      <td>Batas anjuran wajar 3-4 cangkir standar per hari</td>
    </tr>
    <tr style="background-color: #f8fafc;">
      <td><b>Beban Kafein Masuk</b></td>
      <td style="text-align: center;"><b>${estimatedMg} mg</b></td>
      <td style="text-align: center; ${estimatedMg > 400 ? 'color: #dc2626; font-weight: bold;' : 'color: #16a34a;'}">${Math.round((estimatedMg / 400) * 100)}% Batas FDA</td>
      <td>${estimatedMg > 400 ? 'Melebihi ambang batas toleransi FDA (400 mg/hari)' : 'Dalam batas aman FDA'}</td>
    </tr>
    <tr>
      <td><b>Waktu Minum Terakhir</b></td>
      <td style="text-align: center;">${cleanTime}</td>
      <td style="text-align: center; ${parseInt((rawTime || '12').split(':')[0]) >= 18 ? 'color: #d97706; font-weight: bold;' : 'color: #16a34a;'}">${parseInt((rawTime || '12').split(':')[0]) >= 18 ? 'Dekat Jam Tidur' : 'Aman'}</td>
      <td>Waktu cut-off ideal minimal 6 jam sebelum istirahat malam</td>
    </tr>
    <tr style="background-color: #f8fafc;">
      <td><b>Kondisi Lambung & Makan</b></td>
      <td style="text-align: center;">${item.meal_status === 'belum_makan' ? 'Perut Kosong' : 'Sudah Makan'}</td>
      <td style="text-align: center; ${item.meal_status === 'belum_makan' ? 'color: #dc2626; font-weight: bold;' : 'color: #16a34a;'}">${item.meal_status === 'belum_makan' ? 'Perhatian' : 'Optimal'}</td>
      <td>${item.meal_status === 'belum_makan' ? 'Asam lambung HCl meningkat masif tanpa penyangga (buffer)' : 'Aman terlapisi nutrisi makanan'}</td>
    </tr>
    <tr>
      <td><b>Aktivitas Olahraga</b></td>
      <td style="text-align: center;">${item.exercise_timing !== 'tidak_olahraga' ? `${item.exercise_duration_minutes || 30} Menit` : '0 Menit'}</td>
      <td style="text-align: center;">${item.exercise_timing !== 'tidak_olahraga' ? 'Aktif' : 'Metabolisme Pasif'}</td>
      <td>Olahraga meningkatkan efisiensi sirkulasi perifer dan otot</td>
    </tr>
    <tr style="background-color: #f8fafc;">
      <td><b>Konsumsi Nikotin / Rokok</b></td>
      <td style="text-align: center;">${smokingInfo}</td>
      <td style="text-align: center; ${item.smoking_intensity && item.smoking_intensity !== 'none' ? 'color: #d97706; font-weight: bold;' : 'color: #16a34a;'}">${item.smoking_intensity && item.smoking_intensity !== 'none' ? 'Induksi CYP1A2' : 'Normal'}</td>
      <td>Nikotin mempercepat degradasi waktu paruh kafein di organ hati</td>
    </tr>
    <tr>
      <td><b>Asupan Air Putih</b></td>
      <td style="text-align: center;">${waterIntake} ml</td>
      <td style="text-align: center; ${waterIntake < 1000 ? 'color: #dc2626; font-weight: bold;' : 'color: #16a34a;'}">${waterIntake < 1000 ? 'Dehidrasi Berat' : 'Tercukupi'}</td>
      <td>Standar Kemenkes RI: Minimal 2.000 ml (8 gelas) per hari</td>
    </tr>
    <tr style="background-color: #f8fafc;">
      <td><b>Pola Tidur Semalam</b></td>
      <td style="text-align: center;">${item.sleep_duration ? `${item.sleep_duration} Jam` : '-'}</td>
      <td style="text-align: center; ${Number(item.sleep_duration) <= 5 ? 'color: #dc2626; font-weight: bold;' : 'color: #16a34a;'}">${item.sleep_quality || '-'}</td>
      <td>Rekomendasi Kemenkes & AASM: 7-8 jam per malam</td>
    </tr>
    <tr>
      <td><b>Estimasi Tubuh Bebas Kafein</b></td>
      <td style="text-align: center;"><b>${safeTimePoint}</b></td>
      <td style="text-align: center;">Waktu Paruh ~5 Jam</td>
      <td>Kadar kafein darah di bawah ambang 50 mg untuk fase Deep Sleep</td>
    </tr>
    <tr><td colspan="4" style="height: 12px; border: none;"></td></tr>
    <tr>
      <th colspan="4" class="section-title">2. PEMETAAN BEBAN FISIOLOGIS 8 ORGAN TUBUH (SESI INI)</th>
    </tr>
    <tr>
      <th class="th-col" style="width: 220px;">Organ Tubuh</th>
      <th class="th-col" style="width: 150px; text-align: center;">Beban Fisiologis</th>
      <th class="th-col" style="width: 140px; text-align: center;">Status Klinis</th>
      <th class="th-col">Keterangan Medis & Mekanisme Fisiologis</th>
    </tr>
    ${organs.map(o => `
    <tr>
      <td><b>${o.name}</b></td>
      <td style="text-align: center; font-weight: bold;">${o.load}%</td>
      <td style="${getBadgeStyle(o.load)}">${o.status}</td>
      <td>${o.desc}</td>
    </tr>
    `).join('')}
    <tr><td colspan="4" style="height: 12px; border: none;"></td></tr>
    <tr>
      <th colspan="4" class="section-title">3. LEMBAR CATATAN KONSULTASI DOKTER & VALIDASI KLINIS</th>
    </tr>
    <tr>
      <td class="label-col">Catatan Dokter Pemeriksa</td>
      <td colspan="3" style="height: 35px; vertical-align: top; color: #94a3b8;">...................................................................................................................................................................</td>
    </tr>
    <tr>
      <td class="label-col">Rekomendasi Terapi / Resep</td>
      <td colspan="3" style="height: 35px; vertical-align: top; color: #94a3b8;">...................................................................................................................................................................</td>
    </tr>
    <tr>
      <td class="label-col">Tanggal Konsultasi</td>
      <td>........................................................</td>
      <td class="label-col">Tanda Tangan & Stempel</td>
      <td>______________________________________</td>
    </tr>
  </table>
</body>
</html>
      `;

      const blob = new Blob([excelHtml], { type: 'application/vnd.ms-excel;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      const fileDate = (item.created_at || new Date().toISOString()).split('T')[0];
      link.setAttribute("download", `CaffiSense_TabelMedis_Harian_${fileDate}.xls`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setShowExportMenu(false);
    } catch (err) {
      console.error(err);
      alert("Gagal mengekspor Excel");
    }
  };

  // ─── WEEKLY PDF EXPORT (CONSOLIDATED 7-DAY REPORT) ───
  const exportWeeklyPDF = async (metrics: any) => {
    if (!metrics) {
      alert("Data mingguan tidak tersedia untuk diekspor.");
      return;
    }
    setIsExporting(true);
    setShowExportMenu(false);
    try {
      const doc = new jsPDF('p', 'mm', 'a4');
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();

      // Header Banner Weekly
      doc.setFillColor(15, 23, 42);
      doc.rect(0, 0, pageWidth, 24, 'F');

      doc.setFontSize(13);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(255, 255, 255);
      doc.text("CAFFISENSE - RAPOR KLINIS SIRKADIAN MINGGUAN", 15, 11);

      doc.setFontSize(7.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(203, 213, 225);
      doc.text("Rekapitulasi Konsolidasi 7 Hari Ritme Sirkadian, Beban Organ & Metabolisme Kafein", 15, 17);

      // Metadata Card
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.4);
      doc.roundedRect(15, 28, pageWidth - 30, 22, 2, 2, 'FD');

      doc.setFontSize(7.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(30, 41, 59);
      doc.text(`Nama Pasien : ${user?.name || 'Pasien CaffiSense'}`, 18, 34);
      doc.text(`Email / Kontak : ${user?.email || '-'}`, 18, 39);
      doc.text(`Periode Evaluasi : ${metrics.weekLabel}`, 18, 44);

      doc.text(`Skor Sirkadian Mingguan : ${metrics.score} / 100 (${metrics.scoreCategory})`, pageWidth / 2 + 10, 34);
      doc.text(`Hari Aktif Tercatat : ${metrics.recordedDaysCount} dari 7 Hari (${metrics.goodDaysCount} Prima, ${metrics.poorDaysCount} Beban Tinggi)`, pageWidth / 2 + 10, 39);
      doc.text(`Rata-Rata Mingguan : Kafein ${metrics.avgCaffeine} mg/hari  |  Tidur ${metrics.avgSleep} Jam/malam`, pageWidth / 2 + 10, 44);

      // Table 1: 7-Day Recap
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text("1. Rekapitulasi Harian Konsumsi & Pola Istirahat (7 Hari)", 15, 55);

      const tableRows = metrics.days.map((d: DayMetric) => {
        const mealText = d.mealStatus === 'belum_makan' ? 'Perut Kosong' : (d.mealStatus ? 'Sudah Makan' : '-');
        return [
          d.fullDayName,
          d.totalCaffeine > 0 ? `${d.totalCaffeine} mg` : '0 mg',
          d.cups > 0 ? `${d.cups} cangkir` : '-',
          d.lastCoffeeTime ? `pk. ${d.lastCoffeeTime}` : '-',
          mealText,
          d.sleepHours ? `${d.sleepHours} Jam` : '-',
          d.statusLabel
        ];
      });

      autoTable(doc, {
        startY: 58,
        theme: 'grid',
        headStyles: { fillColor: [30, 41, 59], fontSize: 7.8, fontStyle: 'bold' },
        styles: { fontSize: 7.2, cellPadding: 1.4 },
        columnStyles: {
          0: { cellWidth: 26, fontStyle: 'bold' },
          1: { cellWidth: 24 },
          2: { cellWidth: 22 },
          3: { cellWidth: 24 },
          4: { cellWidth: 30 },
          5: { cellWidth: 24 },
          6: { cellWidth: 30, fontStyle: 'bold' }
        },
        head: [["Hari", "Kafein (mg)", "Cangkir", "Jam Terakhir", "Kondisi Perut", "Durasi Tidur", "Status Sirkadian"]],
        body: tableRows
      });

      // Table 2: 8 Organs Weekly
      const t1EndY = (doc as any).lastAutoTable.finalY + 4;
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text("2. Pemetaan Rata-Rata Beban Fisiologis 8 Organ Tubuh (Mingguan)", 15, t1EndY + 1);

      const avgCaffeine = metrics.avgCaffeine || 0;
      const bAvg = Math.min(100, Math.round((avgCaffeine / 400) * 80 + (metrics.lateCoffeeCount > 0 ? 15 : 0)));
      const hAvg = Math.min(100, Math.round((avgCaffeine / 400) * 75 + (metrics.poorDaysCount > 0 ? 10 : 0)));
      const sAvg = Math.min(100, Math.round((avgCaffeine / 400) * 65 + (metrics.days.some((d: DayMetric) => d.mealStatus === 'belum_makan') ? 20 : 0)));
      const kAvg = Math.min(100, Math.round((avgCaffeine / 400) * 60));
      const lAvg = Math.min(100, Math.round((avgCaffeine / 400) * 70));
      const blAvg = Math.min(100, Math.round((avgCaffeine / 400) * 50 + (metrics.lateCoffeeCount > 0 ? 15 : 0)));
      const eAvg = Math.min(100, Math.round((avgCaffeine / 400) * 35 + (metrics.avgSleep < 6 ? 20 : 0)));
      const mAvg = Math.min(100, Math.round((avgCaffeine / 400) * 45));

      autoTable(doc, {
        startY: t1EndY + 3,
        head: [["Organ Tubuh", "Rerata Beban (%)", "Status Evaluasi", "Keterangan Klinis Akumulatif Mingguan"]],
        theme: 'grid',
        headStyles: { fillColor: [51, 65, 85], fontSize: 8, fontStyle: 'bold' },
        styles: { fontSize: 7.2, cellPadding: 1.4 },
        columnStyles: {
          0: { cellWidth: 46, fontStyle: 'bold' },
          1: { cellWidth: 26 },
          2: { cellWidth: 28, fontStyle: 'bold' },
          3: { cellWidth: 90 }
        },
        body: [
          ["Otak & Sistem Saraf", `${bAvg}%`, bAvg >= 70 ? 'Hiperstimulasi' : bAvg >= 40 ? 'Waspada' : 'Optimal', "Akumulasi blokade reseptor adenosin dan potensi defisit slow-wave sleep"],
          ["Jantung & Sirkulasi", `${hAvg}%`, hAvg >= 70 ? 'Beban Tinggi' : hAvg >= 40 ? 'Waspada' : 'Stabil', "Frekuensi stimulasi katekolamin simpatis mingguan terhadap kontraktilitas miokardium"],
          ["Lambung & Saluran Cerna", `${sAvg}%`, sAvg >= 70 ? 'Iritasi Asam' : sAvg >= 40 ? 'Waspada' : 'Normal', "Intensitas sekresi asam lambung HCl berulang, khususnya saat minum tanpa makan"],
          ["Ginjal & Cairan", `${kAvg}%`, kAvg >= 70 ? 'Filtrasi Berat' : kAvg >= 40 ? 'Waspada' : 'Aman', "Laju filtrasi glomerulus mingguan dan pembuangan ion metabolit kafein"],
          ["Hati (Enzim CYP1A2)", `${lAvg}%`, lAvg >= 70 ? 'Beban Hepatik' : lAvg >= 40 ? 'Waspada' : 'Normal', "Konsistensi beban klirens enzim sitokrom P450 hati dalam mengeliminasi kafein"],
          ["Kandung Kemih", `${blAvg}%`, blAvg >= 70 ? 'Risiko Nokturia' : blAvg >= 40 ? 'Waspada' : 'Normal', "Frekuensi desakan berkemih nokturia di jam tidur malam akibat ngopi sore"],
          ["Mata & Saraf Visual", `${eAvg}%`, eAvg >= 70 ? 'Kering / Lelah' : eAvg >= 40 ? 'Waspada' : 'Optimal', "Astenopia penglihatan dan dehidrasi lapisan mukosa mata akibat kurang tidur"],
          ["Sistem Otot Somatik", `${mAvg}%`, mAvg >= 70 ? 'Ketegangan/Kram' : mAvg >= 40 ? 'Waspada' : 'Relaks', "Kebutuhan relaksasi neuromuskular dan restorasi energi pasca-stimulasi"]
        ]
      });

      // Quick Summary Box
      const sumBoxY = (doc as any).lastAutoTable.finalY + 4;
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.4);
      doc.roundedRect(15, sumBoxY, pageWidth - 30, 24, 2, 2, 'FD');

      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text("Ringkasan Tren & Capaian Mingguan:", 18, sumBoxY + 5);

      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(71, 85, 105);
      doc.text(`• Indeks Disiplin: ${metrics.goodDaysCount} hari prima (${Math.round((metrics.goodDaysCount / 7) * 100)}% dari target mingguan). ${metrics.score >= 80 ? 'Keteraturan konsumsi sangat terjaga.' : 'Perlu meningkatkan kepatuhan jam minum.'}`, 18, sumBoxY + 10);
      doc.text(`• Pengendalian Waktu: Terdeteksi ${metrics.lateCoffeeCount} kali sesi ngopi lewat pk. 17:00 yang berpotensi memotong durasi deep sleep.`, 18, sumBoxY + 14.5);
      doc.text(`• Keseimbangan Tidur: Rata-rata istirahat ${metrics.avgSleep} jam/malam ${metrics.avgSleep >= 7 ? '(Memenuhi standar ideal Kemenkes/AASM 7-8 jam).' : '(Defisit tidur, disarankan memajukan jam istirahat).' }`, 18, sumBoxY + 19);

      doc.setFontSize(6.5);
      doc.setTextColor(148, 163, 184);
      doc.text("CaffiSense Weekly Clinical Summary  |  Halaman 1 dari 2", pageWidth / 2, pageHeight - 5, { align: 'center' });

      // ─── HALAMAN 2 ───
      doc.addPage();

      doc.setFillColor(15, 23, 42);
      doc.rect(0, 0, pageWidth, 16, 'F');

      doc.setFontSize(9.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(255, 255, 255);
      doc.text("CAFFISENSE - RAPOR KLINIS SIRKADIAN MINGGUAN", 15, 7.5);

      doc.setFontSize(7.2);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(203, 213, 225);
      doc.text(`Pasien: ${user?.name || 'Pasien CaffiSense'}   |   Periode: ${metrics.weekLabel}   |   Skor: ${metrics.score}/100`, 15, 12.5);

      doc.setFillColor(249, 115, 22);
      doc.circle(pageWidth - 15, 8.5, 2, 'F');

      doc.setFontSize(9.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text("3. Ulasan Evaluasi Mingguan & Rencana Tindak Lanjut", 15, 23);

      const weeklyPoints = [
        {
          header: "A. Evaluasi Akumulasi Dosis & Toleransi Kafein Mingguan",
          bullets: [
            `Total asupan kafein tercatat selama pekan ini mencapai ${metrics.totalCaffeine || 0} mg dengan rata-rata harian ${metrics.avgCaffeine || 0} mg/hari. Angka ini ${metrics.avgCaffeine > 400 ? 'melebihi batas aman FDA (400 mg/hari), sehingga diperlukan penurunan porsi cangkir secara bertahap.' : 'berada dalam batas toleransi wajar Kemenkes dan FDA.'}`,
            "Kestabilan waktu paruh eliminasi kafein (5 jam) memerlukan jeda konsumsi yang disiplin agar tidak terjadi penumpukan metabolit paraksantin dan teobromin di pembuluh darah sebelum waktu tidur malam."
          ]
        },
        {
          header: "B. Analisis Kepatuhan Waktu Cut-Off & Ritme Hormon Sirkadian",
          bullets: [
            metrics.lateCoffeeCount > 0 
              ? `Terdapat ${metrics.lateCoffeeCount} sesi konsumsi melewati batas aman sore (pukul 15:00-17:00). Kafein di malam hari terbukti memblokir reseptor adenosin di otak, menunda pelepasan hormon melatonin alami, serta memotong proporsi fase Slow-Wave Sleep (Deep Sleep) hingga 20-40%.`
              : "Kepatuhan waktu cut-off kopi sangat baik sepanjang minggu ini. Pasien konsisten menghentikan asupan stimulan sebelum sore hari, memberikan waktu yang cukup bagi tubuh untuk meluruhkan kadar kafein darah di bawah 50 mg menjelang waktu istirahat malam.",
            `Rata-rata durasi tidur mingguan berada pada ${metrics.avgSleep || 0} jam/malam. Disarankan menjaga jam tidur konsisten (±30 menit) setiap hari untuk memperkuat sinkronisasi jam biologis internal inti suprachiasmatic nucleus (SCN).`
          ]
        },
        {
          header: "C. Interaksi Saluran Cerna (Gastrointestinal) & Rekomendasi Pekan Depan",
          bullets: [
            "Pencegahan Iritasi Lambung: Hindari mengonsumsi kopi dalam kondisi perut kosong. Selalu konsumsi makanan bernutrisi tinggi serat atau karbohidrat kompleks (seperti oatmeal atau pisang) sebagai penyangga (buffer) terhadap lonjakan asam klorida (HCl).",
            "Target Hidrasi Pekan Depan: Tingkatkan asupan air putih harian minimal 2.000 ml (8 gelas) guna mengimbangi sifat diuretik alami kafein dan memperlancar laju klirens ginjal.",
            "Jeda Hormon Kortisol Pagi: Berikan jeda 60–90 menit setelah bangun pagi sebelum menikmati cangkir kopi pertama untuk menghindari toleransi kafein dini saat lonjakan kortisol alami sedang memuncak."
          ]
        }
      ];

      let currentY = 29;

      for (const section of weeklyPoints) {
        doc.setFontSize(7.8);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(15, 23, 42);
        doc.text(section.header, 15, currentY);
        currentY += 4;

        for (const bullet of section.bullets) {
          const bulletText = `•  ${bullet}`;
          const lines = doc.splitTextToSize(bulletText, 180);
          
          doc.setFontSize(7.2);
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(51, 65, 85);
          doc.text(bulletText, 15, currentY, { align: 'justify', maxWidth: 180 });
          currentY += (lines.length * 3.3) + 1.8;
        }
        currentY += 1.5;
      }

      // Section 4: Catatan Dokter
      const sigBoxY = Math.max(currentY + 4, pageHeight - 42);
      doc.setDrawColor(203, 213, 225);
      doc.setLineWidth(0.4);
      doc.setFillColor(250, 250, 250);
      doc.roundedRect(15, sigBoxY, pageWidth - 30, 26, 2, 2, 'FD');

      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text("Catatan Evaluasi Mingguan Dokter / Konsultan Nutrisi:", 18, sigBoxY + 5);

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(148, 163, 184);
      doc.text("..................................................................................................................................................................................................", 18, sigBoxY + 11);
      doc.text("..................................................................................................................................................................................................", 18, sigBoxY + 16);

      doc.setFontSize(7);
      doc.setTextColor(71, 85, 105);
      doc.text("Tanggal Evaluasi: .......................................", 18, sigBoxY + 22);
      doc.text("Tanda Tangan & Stempel Faskes: ___________________________", pageWidth - 98, sigBoxY + 22);

      doc.setFontSize(6.2);
      doc.setTextColor(148, 163, 184);
      doc.text("Dokumen rapor mingguan ini diterbitkan secara otomatis oleh CaffiSense sebagai instrumen monitoring evaluasi sirkadian.", 15, pageHeight - 5);
      doc.text("Halaman 2 dari 2", pageWidth - 15, pageHeight - 5, { align: 'right' });

      doc.save(`CaffiSense_RaporMingguan_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (err) {
      console.error(err);
      alert("Gagal mencetak PDF Mingguan.");
    } finally {
      setIsExporting(false);
    }
  };

  // ─── WEEKLY EXCEL EXPORT (.XLS HTML SPREADSHEET TABLE) ───
  const exportWeeklyExcel = (metrics: any) => {
    if (!metrics) {
      alert("Data mingguan tidak tersedia untuk diekspor.");
      return;
    }
    setShowExportMenu(false);

    try {
      const avgCaffeine = metrics.avgCaffeine || 0;
      const bAvg = Math.min(100, Math.round((avgCaffeine / 400) * 80 + (metrics.lateCoffeeCount > 0 ? 15 : 0)));
      const hAvg = Math.min(100, Math.round((avgCaffeine / 400) * 75 + (metrics.poorDaysCount > 0 ? 10 : 0)));
      const sAvg = Math.min(100, Math.round((avgCaffeine / 400) * 65 + (metrics.days.some((d: DayMetric) => d.mealStatus === 'belum_makan') ? 20 : 0)));
      const kAvg = Math.min(100, Math.round((avgCaffeine / 400) * 60));
      const lAvg = Math.min(100, Math.round((avgCaffeine / 400) * 70));
      const blAvg = Math.min(100, Math.round((avgCaffeine / 400) * 50 + (metrics.lateCoffeeCount > 0 ? 15 : 0)));
      const eAvg = Math.min(100, Math.round((avgCaffeine / 400) * 35 + (metrics.avgSleep < 6 ? 20 : 0)));
      const mAvg = Math.min(100, Math.round((avgCaffeine / 400) * 45));

      const organs = [
        { name: "Otak & Sistem Saraf", load: bAvg, status: bAvg >= 70 ? 'Hiperstimulasi' : bAvg >= 40 ? 'Waspada' : 'Optimal', desc: "Akumulasi blokade reseptor adenosin dan potensi defisit slow-wave sleep" },
        { name: "Jantung & Sirkulasi", load: hAvg, status: hAvg >= 70 ? 'Beban Tinggi' : hAvg >= 40 ? 'Waspada' : 'Stabil', desc: "Frekuensi stimulasi katekolamin simpatis mingguan terhadap kontraktilitas miokardium" },
        { name: "Lambung & Saluran Cerna", load: sAvg, status: sAvg >= 70 ? 'Iritasi Asam' : sAvg >= 40 ? 'Waspada' : 'Normal', desc: "Intensitas sekresi asam lambung HCl berulang, khususnya saat minum tanpa makan" },
        { name: "Ginjal & Cairan", load: kAvg, status: kAvg >= 70 ? 'Filtrasi Berat' : kAvg >= 40 ? 'Waspada' : 'Aman', desc: "Laju filtrasi glomerulus mingguan dan pembuangan ion metabolit kafein" },
        { name: "Hati (Enzim CYP1A2)", load: lAvg, status: lAvg >= 70 ? 'Beban Hepatik' : lAvg >= 40 ? 'Waspada' : 'Normal', desc: "Konsistensi beban klirens enzim sitokrom P450 hati dalam mengeliminasi kafein" },
        { name: "Kandung Kemih", load: blAvg, status: blAvg >= 70 ? 'Risiko Nokturia' : blAvg >= 40 ? 'Waspada' : 'Normal', desc: "Frekuensi desakan berkemih nokturia di jam tidur malam akibat ngopi sore" },
        { name: "Mata & Saraf Visual", load: eAvg, status: eAvg >= 70 ? 'Kering / Lelah' : eAvg >= 40 ? 'Waspada' : 'Optimal', desc: "Astenopia penglihatan dan dehidrasi lapisan mukosa mata akibat kurang tidur" },
        { name: "Sistem Otot Somatik", load: mAvg, status: mAvg >= 70 ? 'Ketegangan/Kram' : mAvg >= 40 ? 'Waspada' : 'Relaks', desc: "Kebutuhan relaksasi neuromuskular dan restorasi energi pasca-stimulasi" }
      ];

      const getBadgeStyle = (load: number) => {
        if (load >= 70) return 'background-color: #fee2e2; color: #b91c1c; font-weight: bold; text-align: center;';
        if (load >= 40) return 'background-color: #fef3c7; color: #b45309; font-weight: bold; text-align: center;';
        return 'background-color: #dcfce7; color: #15803d; font-weight: bold; text-align: center;';
      };

      const excelHtml = `
<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
<head>
  <meta http-equiv="content-type" content="application/vnd.ms-excel; charset=UTF-8">
  <style>
    body { font-family: 'Segoe UI', Calibri, Arial, sans-serif; font-size: 10.5pt; color: #1e293b; }
    table { border-collapse: collapse; width: 100%; margin-bottom: 20px; }
    th { border: 1px solid #cbd5e1; padding: 7px 10px; font-weight: bold; }
    td { border: 1px solid #cbd5e1; padding: 6px 10px; font-size: 10pt; }
    .header-banner { background-color: #0f172a; color: #ffffff; font-size: 13pt; font-weight: bold; text-align: center; height: 38px; }
    .section-title { background-color: #334155; color: #ffffff; font-size: 10.5pt; font-weight: bold; padding: 6px 10px; text-align: left; }
    .th-col { background-color: #f1f5f9; color: #0f172a; font-weight: bold; text-align: left; }
    .label-col { background-color: #f8fafc; font-weight: bold; color: #334155; width: 200px; }
    .val-col { width: 280px; }
  </style>
</head>
<body>
  <table>
    <tr>
      <th colspan="7" class="header-banner">CAFFISENSE - RAPOR KLINIS SIRKADIAN MINGGUAN</th>
    </tr>
    <tr>
      <td class="label-col">Nama Pasien / User</td>
      <td colspan="2" class="val-col">${user?.name || 'Pasien CaffiSense'}</td>
      <td class="label-col">Periode Evaluasi</td>
      <td colspan="3" class="val-col">${metrics.weekLabel}</td>
    </tr>
    <tr>
      <td class="label-col">Email / Kontak</td>
      <td colspan="2" class="val-col">${user?.email || '-'}</td>
      <td class="label-col">Skor Sirkadian Mingguan</td>
      <td colspan="3" class="val-col"><b>${metrics.score} / 100</b> (${metrics.scoreCategory})</td>
    </tr>
    <tr>
      <td class="label-col">Rata-Rata Kafein</td>
      <td colspan="2" class="val-col"><b>${metrics.avgCaffeine} mg/hari</b></td>
      <td class="label-col">Rata-Rata Tidur</td>
      <td colspan="3" class="val-col"><b>${metrics.avgSleep} Jam/malam</b> (${metrics.recordedDaysCount} dari 7 hari tercatat)</td>
    </tr>
    <tr><td colspan="7" style="height: 12px; border: none;"></td></tr>

    <tr>
      <th colspan="7" class="section-title">1. REKAPITULASI HARIAN KONSUMSI & POLA ISTIRAHAT (SENIN – MINGGU)</th>
    </tr>
    <tr>
      <th class="th-col" style="width: 140px;">Hari</th>
      <th class="th-col" style="text-align: center; width: 120px;">Total Kafein</th>
      <th class="th-col" style="text-align: center; width: 100px;">Cangkir</th>
      <th class="th-col" style="text-align: center; width: 120px;">Jam Terakhir</th>
      <th class="th-col" style="width: 140px;">Kondisi Perut</th>
      <th class="th-col" style="text-align: center; width: 120px;">Durasi Tidur</th>
      <th class="th-col">Status Sirkadian & Keterangan</th>
    </tr>
    ${metrics.days.map((d: DayMetric) => `
    <tr>
      <td><b>${d.fullDayName}</b> (${d.dateNumber})</td>
      <td style="text-align: center; font-weight: bold;">${d.totalCaffeine > 0 ? `${d.totalCaffeine} mg` : '0 mg'}</td>
      <td style="text-align: center;">${d.cups > 0 ? `${d.cups} cangkir` : '-'}</td>
      <td style="text-align: center;">${d.lastCoffeeTime ? `pk. ${d.lastCoffeeTime}` : '-'}</td>
      <td>${d.mealStatus === 'belum_makan' ? 'Perut Kosong' : (d.mealStatus ? 'Sudah Makan' : '-')}</td>
      <td style="text-align: center;">${d.sleepHours ? `${d.sleepHours} Jam` : '-'}</td>
      <td style="${d.status === 'poor' ? 'color: #dc2626; font-weight: bold;' : d.status === 'good' ? 'color: #16a34a; font-weight: bold;' : 'color: #64748b;'}">${d.statusLabel}</td>
    </tr>
    `).join('')}
    <tr><td colspan="7" style="height: 12px; border: none;"></td></tr>

    <tr>
      <th colspan="7" class="section-title">2. PEMETAAN RATA-RATA BEBAN FISIOLOGIS 8 ORGAN TUBUH (MINGGUAN)</th>
    </tr>
    <tr>
      <th class="th-col" colspan="2" style="width: 220px;">Organ Tubuh</th>
      <th class="th-col" style="width: 140px; text-align: center;">Rerata Beban</th>
      <th class="th-col" style="width: 140px; text-align: center;">Status Evaluasi</th>
      <th class="th-col" colspan="3">Keterangan Medis & Dampak Akumulatif</th>
    </tr>
    ${organs.map(o => `
    <tr>
      <td colspan="2"><b>${o.name}</b></td>
      <td style="text-align: center; font-weight: bold;">${o.load}%</td>
      <td style="${getBadgeStyle(o.load)}">${o.status}</td>
      <td colspan="3">${o.desc}</td>
    </tr>
    `).join('')}
    <tr><td colspan="7" style="height: 12px; border: none;"></td></tr>

    <tr>
      <th colspan="7" class="section-title">3. LEMBAR CATATAN KONSULTASI DOKTER / AHLI GIZI</th>
    </tr>
    <tr>
      <td class="label-col" colspan="2">Catatan Evaluasi Mingguan</td>
      <td colspan="5" style="height: 40px; vertical-align: top; color: #94a3b8;">.......................................................................................................................................................................................................</td>
    </tr>
    <tr>
      <td class="label-col" colspan="2">Rekomendasi Terapi & Target Pekan Depan</td>
      <td colspan="5" style="height: 40px; vertical-align: top; color: #94a3b8;">.......................................................................................................................................................................................................</td>
    </tr>
    <tr>
      <td class="label-col" colspan="2">Tanggal Konsultasi</td>
      <td colspan="2">........................................................</td>
      <td class="label-col">Tanda Tangan & Stempel</td>
      <td colspan="2">______________________________________</td>
    </tr>
  </table>
</body>
</html>
      `;

      const blob = new Blob([excelHtml], { type: 'application/vnd.ms-excel;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      const fileDate = new Date().toISOString().split('T')[0];
      link.setAttribute("download", `CaffiSense_RaporMingguan_${fileDate}.xls`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setShowExportMenu(false);
    } catch (err) {
      console.error(err);
      alert("Gagal mengekspor Excel Mingguan");
    }
  };

  // Filtered & Sorted History based on viewMode, user search query & chips
  const filteredHistory = useMemo(() => {
    let list = [...sortedHistory];

    // If Weekly mode, filter by this week's assessments
    if (viewMode === 'weekly' && weeklyMetrics) {
      list = [...weeklyMetrics.weekAssessments];

      // If user clicked a specific day in the 7-day bar
      if (selectedDayFilter !== null && weeklyMetrics.days[selectedDayFilter]) {
        const targetDay = weeklyMetrics.days[selectedDayFilter];
        list = list.filter(item => {
          const d = new Date(item.created_at || item.date || 0);
          return d.getFullYear() === targetDay.targetDate.getFullYear() &&
                 d.getMonth() === targetDay.targetDate.getMonth() &&
                 d.getDate() === targetDay.targetDate.getDate();
        });
      }
    }

    // 1. Filter Impact
    if (filterImpact === 'low') {
      list = list.filter(item => item.ml_prediction === 0 || item.sleep_impact === 'Low');
    } else if (filterImpact === 'high') {
      list = list.filter(item => item.ml_prediction === 1 || item.sleep_impact === 'High');
    }

    // 2. Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(item => {
        const formattedDate = formatDate(item.created_at || item.date).toLowerCase();
        const mgStr = `${Math.round(item.estimated_caffeine_mg || 0)} mg`.toLowerCase();
        const cupsStr = `${item.coffee_cups_per_day || 0} gelas cangkir`.toLowerCase();
        const sizeStr = (item.coffee_cup_size || '').toLowerCase();
        const impactStr = (item.ml_prediction === 1 || item.sleep_impact === 'High') ? 'dampak tinggi high bahaya' : 'dampak rendah low aman';
        const lastCoffeeStr = (item.last_coffee_time || '').toLowerCase();

        return formattedDate.includes(q) ||
               mgStr.includes(q) ||
               cupsStr.includes(q) ||
               sizeStr.includes(q) ||
               impactStr.includes(q) ||
               lastCoffeeStr.includes(q);
      });
    }

    // 3. Sorting
    if (sortOrder === 'oldest') {
      list.sort((a, b) => new Date(a.created_at || a.date || 0).getTime() - new Date(b.created_at || b.date || 0).getTime());
    } else if (sortOrder === 'highest_caffeine') {
      list.sort((a, b) => (b.estimated_caffeine_mg || 0) - (a.estimated_caffeine_mg || 0));
    } else if (sortOrder === 'lowest_sleep') {
      list.sort((a, b) => (Number(a.sleep_duration) || 0) - (Number(b.sleep_duration) || 0));
    } else {
      // newest (default)
      list.sort((a, b) => new Date(b.created_at || b.date || 0).getTime() - new Date(a.created_at || a.date || 0).getTime());
    }

    return list;
  }, [sortedHistory, viewMode, weeklyMetrics, selectedDayFilter, filterImpact, searchQuery, sortOrder]);

  // Paginated List Calculation (Max 10 per page)
  const totalPages = Math.ceil(filteredHistory.length / ITEMS_PER_PAGE) || 1;
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = Math.min(startIndex + ITEMS_PER_PAGE, filteredHistory.length);
  const paginatedHistory = useMemo(() => {
    return filteredHistory.slice(startIndex, endIndex);
  }, [filteredHistory, startIndex, endIndex]);

  // Aggregate Metrics & Timeline Trend Calculation
  const overviewStats = useMemo(() => {
    if (!sortedHistory || sortedHistory.length === 0) return null;

    const totalSessions = sortedHistory.length;
    let totalCaffeine = 0;
    let totalCups = 0;
    let totalSleep = 0;
    let sleepCount = 0;
    let lowImpactCount = 0;
    let maxCaffeine = 0;

    // Timeline array (sorted oldest -> newest for chart X-axis)
    const chronological = [...sortedHistory].reverse();

    const chartPoints = chronological.map((item, idx) => {
      const mg = Math.round(item.estimated_caffeine_mg || 0);
      const cups = item.coffee_cups_per_day || 0;
      const sleep = item.sleep_duration ? Number(item.sleep_duration) : null;
      const isHigh = item.ml_prediction === 1 || item.sleep_impact === 'High';

      totalCaffeine += mg;
      totalCups += cups;
      if (mg > maxCaffeine) maxCaffeine = mg;
      if (sleep !== null && !isNaN(sleep)) {
        totalSleep += sleep;
        sleepCount++;
      }
      if (!isHigh) lowImpactCount++;

      // Date formatting for axis
      let dateLabel = `Sesi #${idx + 1}`;
      if (item.created_at || item.date) {
        try {
          const d = new Date(item.created_at || item.date);
          dateLabel = d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
        } catch {
          dateLabel = `Sesi #${idx + 1}`;
        }
      }

      return {
        sessionNum: `#${idx + 1}`,
        dateLabel,
        fullDate: item.created_at || item.date,
        caffeineMg: mg,
        cups,
        sleepHours: sleep,
        isHighImpact: isHigh,
      };
    });

    const avgCaffeine = Math.round(totalCaffeine / totalSessions);
    const avgCups = (totalCups / totalSessions).toFixed(1);
    const avgSleep = sleepCount > 0 ? (totalSleep / sleepCount).toFixed(1) : '-';
    const lowImpactPct = Math.round((lowImpactCount / totalSessions) * 100);

    const oldestItem = chronological[0];
    const newestItem = chronological[chronological.length - 1];

    const formatDateShort = (dStr?: string) => {
      if (!dStr) return '';
      try {
        const d = new Date(dStr);
        return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
      } catch {
        return dStr;
      }
    };

    const dateRangeLabel = totalSessions === 1
      ? formatDateShort(newestItem.created_at || newestItem.date)
      : `${formatDateShort(oldestItem.created_at || oldestItem.date)} – ${formatDateShort(newestItem.created_at || newestItem.date)}`;

    return {
      totalSessions,
      avgCaffeine,
      avgCups,
      avgSleep,
      lowImpactPct,
      maxCaffeine,
      dateRangeLabel,
      chartPoints,
    };
  }, [sortedHistory]);

  // Calculate session-to-session fluctuation change
  const latestTrend = useMemo(() => {
    if (!overviewStats || overviewStats.chartPoints.length < 2) return null;
    const pts = overviewStats.chartPoints;
    const last = pts[pts.length - 1];
    const prev = pts[pts.length - 2];

    const diffCaffeine = last.caffeineMg - prev.caffeineMg;
    const diffSleep = (last.sleepHours !== null && prev.sleepHours !== null)
      ? Number((last.sleepHours - prev.sleepHours).toFixed(1))
      : null;

    return {
      diffCaffeine,
      diffSleep,
      caffeineDecreased: diffCaffeine < 0,
      sleepImproved: diffSleep !== null ? diffSleep > 0 : null,
      prevDate: prev.dateLabel,
      lastDate: last.dateLabel,
    };
  }, [overviewStats]);

  return (
    <DashboardLayout>
      <div className="max-w-[1300px] mx-auto space-y-6 animate-fadeIn pb-12">
        
        {/* ─── HEADER BANNER ─── */}
        <div className="bg-white rounded-2xl p-6 sm:p-7 shadow-xs border border-gray-200/80 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                Log Catatan Harian
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 border border-gray-200">
                Histori Sesi
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
              Riwayat Diagnosa & Pemantauan
            </h2>
            <p className="text-xs sm:text-sm text-gray-500 max-w-xl leading-relaxed">
              Daftar seluruh catatan sesi konsumsi kopi dan riwayat evaluasi pengaruh metabolisme kafein pada tidurmu.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            {/* Export Dropdown Menu (Dynamic for Daily vs Weekly) */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowExportMenu(!showExportMenu)}
                disabled={isExporting || (viewMode === 'daily' && sortedHistory.length === 0) || (viewMode === 'weekly' && !weeklyMetrics)}
                className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white hover:bg-gray-50 text-gray-700 rounded-xl font-bold text-xs transition border border-gray-200 shadow-2xs disabled:opacity-50 cursor-pointer"
              >
                {isExporting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5 text-indigo-600" />}
                <span>{viewMode === 'daily' ? 'Ekspor Laporan Harian' : 'Ekspor Rapor Mingguan'}</span>
                <ChevronDown className="w-3 h-3 text-gray-400" />
              </button>

              {showExportMenu && (
                <div className="absolute top-full right-0 mt-1.5 w-60 bg-white rounded-xl shadow-xl border border-gray-100 py-1.5 z-50 overflow-hidden">
                  <button 
                    type="button"
                    onClick={() => {
                      setShowExportMenu(false);
                      if (viewMode === 'daily') {
                        const target = selectedItem || sortedHistory[0];
                        if (target) exportDailyPDF(target);
                        else alert("Tidak ada data sesi untuk diekspor.");
                      } else {
                        if (weeklyMetrics) exportWeeklyPDF(weeklyMetrics);
                      }
                    }} 
                    className="w-full text-left px-4 py-2.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 flex items-center gap-2.5 cursor-pointer"
                  >
                    <FileText className="w-4 h-4 text-indigo-600 shrink-0" />
                    <div>
                      <div className="font-bold text-gray-900">{viewMode === 'daily' ? 'Laporan Harian (PDF)' : 'Rapor Mingguan (PDF)'}</div>
                      <div className="text-[10px] text-gray-400">{viewMode === 'daily' ? 'Format 2 halaman sesi terkini' : 'Konsolidasi 7 hari dalam 1 dokumen'}</div>
                    </div>
                  </button>
                  <button 
                    type="button"
                    onClick={() => {
                      setShowExportMenu(false);
                      if (viewMode === 'daily') {
                        const target = selectedItem || sortedHistory[0];
                        if (target) exportDailyExcel(target);
                        else alert("Tidak ada data sesi untuk diekspor.");
                      } else {
                        if (weeklyMetrics) exportWeeklyExcel(weeklyMetrics);
                      }
                    }} 
                    className="w-full text-left px-4 py-2.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 flex items-center gap-2.5 cursor-pointer border-t border-gray-50"
                  >
                    <FileSpreadsheet className="w-4 h-4 text-emerald-600 shrink-0" />
                    <div>
                      <div className="font-bold text-gray-900">{viewMode === 'daily' ? 'Tabel Excel Harian (.xls)' : 'Tabel Excel Mingguan (.xls)'}</div>
                      <div className="text-[10px] text-gray-400">{viewMode === 'daily' ? 'Langsung tabel ber-border' : 'Rekapitulasi 7 hari ber-border'}</div>
                    </div>
                  </button>
                </div>
              )}
            </div>

            <Link
              to="/diagnosis"
              className="bg-gray-950 text-white px-5 py-2.5 rounded-xl font-bold text-xs hover:bg-black transition shadow-xs flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4 text-emerald-400" />
              <span>Input Sesi Baru</span>
            </Link>
          </div>
        </div>

        {/* ─── VIEW MODE SWITCHER (HARIAN vs MINGGUAN) ─── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-2 rounded-2xl border border-gray-100 shadow-xs">
          <div className="flex items-center gap-1 p-1 bg-gray-100/70 rounded-xl w-full sm:w-auto">
            <button
              type="button"
              onClick={() => { setViewMode('daily'); setSelectedDayFilter(null); }}
              className={`flex-1 sm:flex-initial px-4 py-2 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                viewMode === 'daily'
                  ? 'bg-white text-gray-900 shadow-xs'
                  : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              <Calendar className="w-3.5 h-3.5 text-gray-500" />
              <span>Mode Harian</span>
            </button>

            <button
              type="button"
              onClick={() => { setViewMode('weekly'); setSelectedDayFilter(null); }}
              className={`flex-1 sm:flex-initial px-4 py-2 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                viewMode === 'weekly'
                  ? 'bg-white text-gray-900 shadow-xs'
                  : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5 text-gray-500" />
              <span>Rapor Mingguan</span>
              {weeklyMetrics && weeklyMetrics.score > 0 && (
                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-gray-900 text-white">
                  {weeklyMetrics.score}
                </span>
              )}
            </button>
          </div>

          {/* Week Selector in Weekly Mode */}
          {viewMode === 'weekly' && weeklyMetrics && (
            <div className="flex items-center justify-between sm:justify-end gap-1.5 px-2 py-1">
              <button
                type="button"
                onClick={() => { setSelectedWeekOffset(prev => prev - 1); setSelectedDayFilter(null); }}
                className="p-1.5 rounded-lg border border-gray-200/80 bg-white hover:bg-gray-50 text-gray-700 transition cursor-pointer flex items-center gap-1 text-xs font-medium"
                title="Minggu Sebelumnya"
              >
                <ChevronLeft className="w-4 h-4" />
                <span className="hidden md:inline">Minggu Lalu</span>
              </button>

              <span className="text-xs font-semibold text-gray-700 px-3 py-1 bg-gray-50 rounded-lg border border-gray-100">
                {weeklyMetrics.weekLabel}
              </span>

              <button
                type="button"
                onClick={() => { setSelectedWeekOffset(prev => prev + 1); setSelectedDayFilter(null); }}
                disabled={selectedWeekOffset >= 0}
                className={`p-1.5 rounded-lg border transition cursor-pointer flex items-center gap-1 text-xs font-medium ${
                  selectedWeekOffset >= 0
                    ? 'bg-gray-50 text-gray-300 border-gray-100 cursor-not-allowed'
                    : 'border-gray-200/80 bg-white hover:bg-gray-50 text-gray-700'
                }`}
                title="Minggu Berikutnya"
              >
                <span className="hidden md:inline">Minggu Depan</span>
                <ChevronRight className="w-4 h-4" />
              </button>

              {selectedWeekOffset !== 0 && (
                <button
                  type="button"
                  onClick={() => { setSelectedWeekOffset(0); setSelectedDayFilter(null); }}
                  className="text-[11px] font-semibold text-gray-900 hover:text-black underline ml-1 cursor-pointer"
                >
                  Minggu Ini
                </button>
              )}
            </div>
          )}
        </div>

        {/* ─── WEEKLY TRACK & REVIEW COMPONENT (MINIMALIST & AESTHETIC) ─── */}
        {viewMode === 'weekly' && weeklyMetrics && (
          <div className="space-y-6">
            {/* Top Scorecard & Summary Banner */}
            <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-xs border border-gray-100 space-y-8">
              
              {/* Header Hero Row */}
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-gray-100">
                {/* Left: Score Badge & Title */}
                <div className="flex items-start sm:items-center gap-5">
                  <div className={`w-16 h-16 sm:w-18 sm:h-18 rounded-2xl flex flex-col items-center justify-center border transition-all shrink-0 ${
                    weeklyMetrics.score >= 80
                      ? 'bg-emerald-50/70 text-emerald-950 border-emerald-200/80 shadow-xs'
                      : weeklyMetrics.score >= 60
                      ? 'bg-amber-50/70 text-amber-950 border-amber-200/80 shadow-xs'
                      : 'bg-rose-50/70 text-rose-950 border-rose-200/80 shadow-xs'
                  }`}>
                    <span className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                      {weeklyMetrics.score}
                    </span>
                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">
                      Skor
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                        weeklyMetrics.score >= 80
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200/80'
                          : weeklyMetrics.score >= 60
                          ? 'bg-amber-50 text-amber-700 border-amber-200/80'
                          : 'bg-rose-50 text-rose-700 border-rose-200/80'
                      }`}>
                        {weeklyMetrics.scoreCategory}
                      </span>
                      <span className="text-xs text-gray-400 font-medium">
                        • {weeklyMetrics.recordedDaysCount} dari 7 hari tercatat
                      </span>
                    </div>

                    <h3 className="text-lg sm:text-xl font-bold text-gray-900 tracking-tight">
                      Rapor Ritme Sirkadian Minggu Ini
                    </h3>
                    <p className="text-xs sm:text-sm text-gray-500 max-w-xl leading-relaxed">
                      {weeklyMetrics.score >= 80
                        ? 'Ritme konsumsi kafeinmu sangat teratur, melindungi kualitas fase deep sleep dan fungsi metabolisme tubuh.'
                        : weeklyMetrics.score >= 60
                        ? 'Pola konsumsimu cukup stabil, namun ada beberapa catatan seperti jam ngopi sore yang perlu diperhatikan.'
                        : 'Beban kafein dan jam istirahat di minggu ini membutuhkan perbaikan dan reset cut-off time.'}
                    </p>
                  </div>
                </div>

                {/* Right: Minimalist Status Pills */}
                <div className="flex items-center gap-2 bg-gray-50/80 p-1.5 rounded-xl border border-gray-100 text-xs font-semibold self-start lg:self-auto">
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white shadow-xs border border-gray-100">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    <span className="text-gray-900 font-bold">{weeklyMetrics.goodDaysCount}</span>
                    <span className="text-gray-500 text-[11px]">Prima</span>
                  </div>
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg">
                    <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                    <span className="text-gray-900 font-bold">{weeklyMetrics.moderateDaysCount}</span>
                    <span className="text-gray-500 text-[11px]">Cukup</span>
                  </div>
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg">
                    <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                    <span className="text-gray-900 font-bold">{weeklyMetrics.poorDaysCount}</span>
                    <span className="text-gray-500 text-[11px]">Evaluasi</span>
                  </div>
                </div>
              </div>

              {/* 4 Minimalist Metric Tiles */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <div className="bg-gray-50/60 rounded-2xl p-4 sm:p-5 border border-gray-100/80 hover:border-gray-200 transition-all flex flex-col justify-between">
                  <span className="text-xs font-medium text-gray-500 flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-amber-500" />
                    Rata-rata Kafein
                  </span>
                  <div className="mt-3">
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-bold text-gray-900 tracking-tight">{weeklyMetrics.avgCaffeine}</span>
                      <span className="text-xs text-gray-500 font-medium">mg/hari</span>
                    </div>
                    <span className="text-[11px] text-gray-400 font-medium block mt-1">
                      {weeklyMetrics.avgCaffeine <= 200 ? 'Zona Aman (< 200 mg)' : weeklyMetrics.avgCaffeine <= 350 ? 'Sedang' : 'Mendekati Batas FDA'}
                    </span>
                  </div>
                </div>

                <div className="bg-gray-50/60 rounded-2xl p-4 sm:p-5 border border-gray-100/80 hover:border-gray-200 transition-all flex flex-col justify-between">
                  <span className="text-xs font-medium text-gray-500 flex items-center gap-1.5">
                    <Moon className="w-3.5 h-3.5 text-indigo-500" />
                    Rata-rata Tidur
                  </span>
                  <div className="mt-3">
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-bold text-gray-900 tracking-tight">{weeklyMetrics.avgSleep}</span>
                      <span className="text-xs text-gray-500 font-medium">jam/malam</span>
                    </div>
                    <span className="text-[11px] text-gray-400 font-medium block mt-1">
                      {weeklyMetrics.avgSleep !== '-' && Number(weeklyMetrics.avgSleep) >= 7 ? 'Rentang Ideal (7–9 Jam)' : 'Di Bawah Anjuran'}
                    </span>
                  </div>
                </div>

                <div className="bg-gray-50/60 rounded-2xl p-4 sm:p-5 border border-gray-100/80 hover:border-gray-200 transition-all flex flex-col justify-between">
                  <span className="text-xs font-medium text-gray-500 flex items-center gap-1.5">
                    <Coffee className="w-3.5 h-3.5 text-stone-600" />
                    Total Sesi Catatan
                  </span>
                  <div className="mt-3">
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-bold text-gray-900 tracking-tight">{weeklyMetrics.weekAssessments.length}</span>
                      <span className="text-xs text-gray-500 font-medium">sesi</span>
                    </div>
                    <span className="text-[11px] text-gray-400 font-medium block mt-1">
                      {weeklyMetrics.recordedDaysCount} Hari Aktif Minggu Ini
                    </span>
                  </div>
                </div>

                <div className="bg-gray-50/60 rounded-2xl p-4 sm:p-5 border border-gray-100/80 hover:border-gray-200 transition-all flex flex-col justify-between">
                  <span className="text-xs font-medium text-gray-500 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                    Rasio Hari Prima
                  </span>
                  <div className="mt-3">
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-bold text-emerald-600 tracking-tight">
                        {weeklyMetrics.recordedDaysCount > 0
                          ? Math.round((weeklyMetrics.goodDaysCount / weeklyMetrics.recordedDaysCount) * 100)
                          : 0}%
                      </span>
                      <span className="text-xs text-gray-500 font-medium">bebas beban</span>
                    </div>
                    <span className="text-[11px] text-gray-400 font-medium block mt-1">
                      Kualitas sirkadian terjaga
                    </span>
                  </div>
                </div>
              </div>

              {/* ─── 7-DAY INTERACTIVE VISUAL TRACK (SENIN - MINGGU) ─── */}
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h4 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-700" />
                      <span>Aktivitas 7 Hari (Senin – Minggu)</span>
                    </h4>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Pilih salah satu hari untuk memfilter catatan di bawah secara spesifik.
                    </p>
                  </div>

                  {selectedDayFilter !== null && (
                    <button
                      type="button"
                      onClick={() => setSelectedDayFilter(null)}
                      className="text-xs font-semibold text-gray-700 hover:text-gray-900 flex items-center gap-1.5 bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-lg transition cursor-pointer w-fit"
                    >
                      <X className="w-3.5 h-3.5 text-gray-400" />
                      <span>Tampilkan Seluruh Minggu Ini</span>
                    </button>
                  )}
                </div>

                {/* 7 Day Minimalist Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5 sm:gap-3">
                  {weeklyMetrics.days.map((day: DayMetric) => {
                    const isSelected = selectedDayFilter === day.dayIndex;
                    const isGood = day.status === 'good';
                    const isModerate = day.status === 'moderate';
                    const isPoor = day.status === 'poor';
                    const isEmpty = day.status === 'empty';

                    return (
                      <button
                        key={day.dayIndex}
                        type="button"
                        onClick={() => {
                          if (isEmpty) return;
                          setSelectedDayFilter(isSelected ? null : day.dayIndex);
                        }}
                        disabled={isEmpty}
                        className={`p-3.5 rounded-2xl text-left transition-all duration-200 relative flex flex-col justify-between min-h-[125px] ${
                          isEmpty
                            ? 'bg-gray-50/40 border border-dashed border-gray-200/60 opacity-50 cursor-not-allowed'
                            : isSelected
                            ? 'bg-white border-2 border-gray-900 shadow-md ring-4 ring-gray-900/5 -translate-y-0.5 cursor-pointer'
                            : 'bg-white border border-gray-200/80 hover:border-gray-300 hover:shadow-xs hover:-translate-y-0.5 cursor-pointer'
                        }`}
                      >
                        {/* Day & Date Header */}
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                            {day.dayName}
                          </span>
                          <span className={`text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center ${
                            isSelected
                              ? 'bg-gray-900 text-white'
                              : 'text-gray-700 bg-gray-100/70'
                          }`}>
                            {day.dateNumber}
                          </span>
                        </div>

                        {/* Middle Content */}
                        <div className="my-2.5 space-y-1">
                          {day.status === 'empty' ? (
                            <span className="text-[11px] text-gray-300 font-medium block">
                              —
                            </span>
                          ) : (
                            <>
                              <div className="flex items-center gap-1.5 text-xs font-bold text-gray-900">
                                <Coffee className="w-3 h-3 text-stone-600 shrink-0" />
                                <span>{day.totalCaffeine} mg</span>
                              </div>
                              {day.lastCoffeeTime && (
                                <div className="text-[10px] text-gray-500 font-medium flex items-center gap-1">
                                  <Clock className="w-2.5 h-2.5 text-gray-400 shrink-0" />
                                  <span>{day.lastCoffeeTime.slice(0, 5)}</span>
                                </div>
                              )}
                              {day.sleepHours !== null && day.sleepHours !== undefined && (
                                <div className="text-[10px] text-gray-500 font-medium flex items-center gap-1">
                                  <Moon className="w-2.5 h-2.5 text-indigo-400 shrink-0" />
                                  <span>{day.sleepHours}j tidur</span>
                                </div>
                              )}
                            </>
                          )}
                        </div>

                        {/* Status Footer Indicator */}
                        <div className="pt-1">
                          {isGood && (
                            <div className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-emerald-700 bg-emerald-50/80 px-2 py-0.5 rounded-md">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                              <span>Prima</span>
                            </div>
                          )}
                          {isModerate && (
                            <div className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-amber-700 bg-amber-50/80 px-2 py-0.5 rounded-md">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                              <span>Cukup</span>
                            </div>
                          )}
                          {isPoor && (
                            <div className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-rose-700 bg-rose-50/80 px-2 py-0.5 rounded-md">
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                              <span>Evaluasi</span>
                            </div>
                          )}
                          {isEmpty && (
                            <span className="text-[10px] text-gray-300">
                              Kosong
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* ─── DUA KOLOM EVALUASI: INSIGHTS & FOKUS MINGGUAN ─── */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 pt-2">
                {/* Left: Pencapaian Positif */}
                <div className="bg-gray-50/50 rounded-2xl p-5 sm:p-6 border border-gray-100 space-y-4">
                  <div className="flex items-center gap-2.5 pb-2 border-b border-gray-100">
                    <div className="w-7 h-7 rounded-lg bg-emerald-100/70 text-emerald-700 flex items-center justify-center shrink-0">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs sm:text-sm font-bold text-gray-900">
                        Kekuatan & Kebiasaan Baik
                      </h4>
                      <p className="text-[11px] text-gray-500">
                        Pola positif yang berhasil kamu pertahankan minggu ini.
                      </p>
                    </div>
                  </div>

                  <ul className="space-y-2.5">
                    {weeklyMetrics.goodPoints.map((pt, i) => (
                      <li key={i} className="flex items-start gap-2.5 text-xs text-gray-700 leading-relaxed">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0 mt-1.5"></span>
                        <span>{pt}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Right: Area Fokus & Peningkatan */}
                <div className="bg-gray-50/50 rounded-2xl p-5 sm:p-6 border border-gray-100 space-y-4">
                  <div className="flex items-center gap-2.5 pb-2 border-b border-gray-100">
                    <div className="w-7 h-7 rounded-lg bg-amber-100/70 text-amber-700 flex items-center justify-center shrink-0">
                      <AlertTriangle className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs sm:text-sm font-bold text-gray-900">
                        Catatan & Area Peningkatan
                      </h4>
                      <p className="text-[11px] text-gray-500">
                        Titik evaluasi untuk meningkatkan kualitas istirahat.
                      </p>
                    </div>
                  </div>

                  <ul className="space-y-2.5">
                    {weeklyMetrics.improvementPoints.map((pt, i) => (
                      <li key={i} className="flex items-start gap-2.5 text-xs text-gray-700 leading-relaxed">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0 mt-1.5"></span>
                        <span>{pt}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* ─── OVERALL ANALYTICS & TIMELINE TREND CONTAINER (MODE HARIAN) ─── */}
        {viewMode === 'daily' && overviewStats && overviewStats.totalSessions > 0 && (
          <div className="bg-white rounded-2xl p-6 sm:p-7 shadow-xs border border-gray-200/80 space-y-6">
            
            {/* Section Header with Date Range */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-gray-100">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                    Ringkasan Statistik
                  </span>
                  <span className="text-xs text-gray-500 font-medium flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-gray-400" />
                    <span>{overviewStats.dateRangeLabel}</span>
                  </span>
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-gray-900">
                  Tren Pola Konsumsi Kopi & Pengaruh Tidur
                </h3>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-gray-600 bg-gray-50 border border-gray-200 px-3 py-1 rounded-lg">
                  Total: <strong className="text-gray-900 font-bold">{overviewStats.totalSessions} Sesi Catatan</strong>
                </span>
              </div>
            </div>

            {/* 4 Clean Summary Stat Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
              {/* Stat 1: Rata-rata Kafein */}
              <div className="bg-white p-4 rounded-xl border border-gray-200/80 shadow-xs flex flex-col justify-between">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-700 border border-amber-100 flex items-center justify-center shrink-0">
                    <Zap className="w-3.5 h-3.5" />
                  </div>
                  <span className="font-semibold text-xs text-gray-500 truncate">Rata-rata Kafein</span>
                </div>
                <div>
                  <div className="font-bold text-gray-900 text-lg sm:text-xl">
                    {overviewStats.avgCaffeine} <span className="text-xs font-normal text-gray-500">mg</span>
                  </div>
                  <span className="text-[11px] text-gray-400 font-medium block mt-0.5">
                    {Math.round((overviewStats.avgCaffeine / 400) * 100)}% dari Batas FDA
                  </span>
                </div>
              </div>

              {/* Stat 2: Rata-rata Gelas */}
              <div className="bg-white p-4 rounded-xl border border-gray-200/80 shadow-xs flex flex-col justify-between">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-7 h-7 rounded-lg bg-orange-50 text-orange-700 border border-orange-100 flex items-center justify-center shrink-0">
                    <Coffee className="w-3.5 h-3.5" />
                  </div>
                  <span className="font-semibold text-xs text-gray-500 truncate">Rata-rata Kopi</span>
                </div>
                <div>
                  <div className="font-bold text-gray-900 text-lg sm:text-xl">
                    {overviewStats.avgCups} <span className="text-xs font-normal text-gray-500">cangkir / hari</span>
                  </div>
                  <span className="text-[11px] text-gray-400 font-medium block mt-0.5">
                    Puncak: {overviewStats.maxCaffeine} mg
                  </span>
                </div>
              </div>

              {/* Stat 3: Rata-rata Durasi Tidur */}
              <div className="bg-white p-4 rounded-xl border border-gray-200/80 shadow-xs flex flex-col justify-between">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-7 h-7 rounded-lg bg-purple-50 text-purple-700 border border-purple-100 flex items-center justify-center shrink-0">
                    <Moon className="w-3.5 h-3.5" />
                  </div>
                  <span className="font-semibold text-xs text-gray-500 truncate">Rata-rata Tidur</span>
                </div>
                <div>
                  <div className="font-bold text-gray-900 text-lg sm:text-xl">
                    {overviewStats.avgSleep} <span className="text-xs font-normal text-gray-500">Jam</span>
                  </div>
                  <span className="text-[11px] text-gray-400 font-medium block mt-0.5">
                    {Number(overviewStats.avgSleep) >= 7 ? 'Rentang Ideal (7–9 Jam)' : 'Kurang dari 7 Jam'}
                  </span>
                </div>
              </div>

              {/* Stat 4: Sesi Bebas Gangguan */}
              <div className="bg-white p-4 rounded-xl border border-gray-200/80 shadow-xs flex flex-col justify-between">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-100 flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-3.5 h-3.5" />
                  </div>
                  <span className="font-semibold text-xs text-gray-500 truncate">Sesi Optimal</span>
                </div>
                <div>
                  <div className="font-bold text-emerald-700 text-lg sm:text-xl">
                    {overviewStats.lowImpactPct}%
                  </div>
                  <span className="text-[11px] text-gray-400 font-medium block mt-0.5">
                    Tingkat bebas gangguan tidur
                  </span>
                </div>
              </div>
            </div>

            {/* Clean Line Chart */}
            <div className="bg-gray-50/50 p-5 rounded-xl border border-gray-200/80 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h4 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-emerald-600" />
                    <span>Fluktuasi Kafein & Durasi Tidur per Sesi</span>
                  </h4>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Perbandingan asupan kafein harian dengan lama waktu istirahat malam.
                  </p>
                </div>

                {/* Legend */}
                <div className="flex flex-wrap items-center gap-4 text-xs font-medium">
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-cyan-600"></span>
                    <span className="text-gray-700">Kafein (mg)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-amber-500"></span>
                    <span className="text-gray-700">Tidur (Jam)</span>
                  </div>
                </div>
              </div>

              {/* Clean Line Chart */}
              <div className="h-60 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={overviewStats.chartPoints} margin={{ top: 15, right: 10, left: -15, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" strokeOpacity={0.8} />
                    <XAxis 
                      dataKey="dateLabel" 
                      axisLine={false} 
                      tickLine={false} 
                      padding={{ left: 15, right: 15 }}
                      tick={{ fontSize: 11, fill: '#64748b', fontWeight: 500 }} 
                    />
                    <YAxis 
                      yAxisId="left" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={false}
                      domain={[0, (dataMax: number) => Math.max(400, Math.ceil((dataMax + 50) / 100) * 100)]} 
                    />
                    <YAxis 
                      yAxisId="right" 
                      orientation="right" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={false}
                      domain={[0, 12]} 
                    />
                    <Tooltip
                      contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.06)', padding: '10px 14px', fontSize: '12px' }}
                      formatter={(val: any, name: any) => [
                        <span className="font-bold text-gray-900">
                          {val} {name === 'caffeineMg' ? 'mg' : 'Jam'}
                        </span>,
                        name === 'caffeineMg' ? 'Kafein' : 'Tidur'
                      ]}
                      labelFormatter={(lbl: any, payload: any) => {
                        const item = payload?.[0]?.payload;
                        return item?.fullDate ? formatDate(item.fullDate) : lbl;
                      }}
                    />
                    
                    <Line
                      yAxisId="left"
                      type="monotone"
                      dataKey="caffeineMg"
                      name="caffeineMg"
                      stroke="#0891b2"
                      strokeWidth={2}
                      dot={{ r: 3, fill: '#0891b2' }}
                      activeDot={{ r: 5, fill: '#0891b2', stroke: '#fff', strokeWidth: 2 }}
                    />

                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="sleepHours"
                      name="sleepHours"
                      stroke="#f59e0b"
                      strokeWidth={2}
                      dot={{ r: 3, fill: '#f59e0b' }}
                      activeDot={{ r: 5, fill: '#f59e0b', stroke: '#fff', strokeWidth: 2 }}
                      connectNulls
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Dynamic Trend Comparison */}
              {latestTrend && (
                <div className="pt-3 border-t border-gray-200/60 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 text-xs">
                  <span className="text-gray-500 font-medium">
                    Perubahan Sesi Terakhir ({latestTrend.prevDate} ➔ {latestTrend.lastDate}):
                  </span>

                  <div className="flex flex-wrap items-center gap-2">
                    {/* Caffeine Trend Pill */}
                    <div className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 border ${
                      latestTrend.caffeineDecreased
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-amber-50 text-amber-800 border-amber-200'
                    }`}>
                      {latestTrend.caffeineDecreased ? (
                        <>
                          <ArrowDownRight className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Kafein Berkurang: {Math.abs(latestTrend.diffCaffeine)} mg</span>
                        </>
                      ) : (
                        <>
                          <ArrowUpRight className="w-3.5 h-3.5 text-amber-600" />
                          <span>Kafein Bertambah: +{latestTrend.diffCaffeine} mg</span>
                        </>
                      )}
                    </div>

                    {/* Sleep Trend Pill */}
                    {latestTrend.diffSleep !== null && (
                      <div className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 border ${
                        latestTrend.sleepImproved
                          ? 'bg-purple-50 text-purple-700 border-purple-200'
                          : 'bg-gray-100 text-gray-700 border-gray-200'
                      }`}>
                        {latestTrend.sleepImproved ? (
                          <>
                            <ArrowUpRight className="w-3.5 h-3.5 text-purple-600" />
                            <span>Durasi Tidur: +{latestTrend.diffSleep} Jam</span>
                          </>
                        ) : (
                          <>
                            <ArrowDownRight className="w-3.5 h-3.5 text-gray-500" />
                            <span>Durasi Tidur: {latestTrend.diffSleep} Jam</span>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

            </div>

          </div>
        )}

        {/* ─── HISTORY LIST ─── */}
        {sortedHistory.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-gray-200/80 shadow-xs space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-gray-50 border border-gray-200 text-gray-500 flex items-center justify-center mx-auto">
              <Coffee className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-gray-900">Belum Ada Riwayat Diagnosa</h3>
            <p className="text-xs sm:text-sm text-gray-500 max-w-md mx-auto">
              Kamu belum memiliki catatan diagnosa. Mulai input kebiasaan ngopimu untuk melihat tren dan analisis di sini.
            </p>
            <Link
              to="/diagnosis"
              className="inline-flex items-center gap-2 bg-gray-950 text-white px-5 py-2.5 rounded-xl text-xs font-bold hover:bg-black transition shadow-xs cursor-pointer"
            >
              <span>Mulai Diagnosa Sekarang</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Header List & Counter */}
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                {viewMode === 'weekly' && weeklyMetrics ? (
                  <>
                    Catatan Sesi Minggu Ini ({filteredHistory.length} Sesi)
                    {selectedDayFilter !== null && weeklyMetrics.days[selectedDayFilter] && (
                      <span className="text-indigo-600 font-bold ml-1.5 normal-case">
                        • Hari {weeklyMetrics.days[selectedDayFilter].fullDayName}
                      </span>
                    )}
                  </>
                ) : (
                  <>Daftar Catatan ({sortedHistory.length} Total)</>
                )}
              </span>
              <span className="text-xs text-gray-400 font-medium">
                {searchQuery || filterImpact !== 'all' ? `Menampilkan ${filteredHistory.length} hasil` : 'Diurutkan dari terbaru'}
              </span>
            </div>

            {/* ─── SEARCH & FILTER TOOLBAR ─── */}
            <div className="bg-white rounded-xl p-3 border border-gray-200/80 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
              {/* Search Box */}
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari tanggal, kafein (mg), cangkir kopi, atau dampak..."
                  className="w-full bg-gray-50 border border-gray-200/80 rounded-lg pl-9 pr-8 py-2 text-xs text-gray-800 placeholder-gray-400 outline-none focus:border-gray-900 focus:bg-white transition"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-0.5 rounded-full hover:bg-gray-200/60 transition cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Filter & Sort Controls */}
              <div className="flex flex-wrap items-center gap-2">
                {/* Filter Impact Pills */}
                <div className="flex items-center bg-gray-100 p-1 rounded-lg border border-gray-200/60">
                  <button
                    type="button"
                    onClick={() => setFilterImpact('all')}
                    className={`px-3 py-1 rounded-md text-xs font-semibold transition cursor-pointer ${
                      filterImpact === 'all'
                        ? 'bg-white text-gray-900 shadow-xs'
                        : 'text-gray-500 hover:text-gray-900'
                    }`}
                  >
                    Semua
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilterImpact('low')}
                    className={`px-3 py-1 rounded-md text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                      filterImpact === 'low'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-xs'
                        : 'text-gray-500 hover:text-emerald-700'
                    }`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    <span>Aman</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilterImpact('high')}
                    className={`px-3 py-1 rounded-md text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                      filterImpact === 'high'
                        ? 'bg-rose-50 text-rose-700 border border-rose-200 shadow-xs'
                        : 'text-gray-500 hover:text-rose-700'
                    }`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                    <span>Beban Tinggi</span>
                  </button>
                </div>

                {/* Sort Order Dropdown */}
                <div className="relative">
                  <select
                    value={sortOrder}
                    onChange={(e: any) => setSortOrder(e.target.value)}
                    className="bg-gray-50 border border-gray-200/80 text-gray-700 text-xs font-medium rounded-lg px-3 py-2 pr-7 outline-none focus:border-gray-900 transition cursor-pointer appearance-none"
                  >
                    <option value="newest">Terbaru</option>
                    <option value="oldest">Terlama</option>
                    <option value="highest_caffeine">Kafein Tertinggi</option>
                    <option value="lowest_sleep">Tidur Terpendek</option>
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 text-gray-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Empty Search State */}
            {filteredHistory.length === 0 ? (
              <div className="bg-white rounded-xl p-8 text-center border border-gray-200/80 shadow-xs space-y-3">
                <div className="w-10 h-10 rounded-xl bg-gray-100 text-gray-500 flex items-center justify-center mx-auto">
                  <Search className="w-4 h-4" />
                </div>
                <h4 className="text-sm font-bold text-gray-900">
                  {searchQuery
                    ? 'Tidak ada riwayat yang cocok'
                    : viewMode === 'weekly'
                    ? 'Belum Ada Catatan di Minggu Ini'
                    : 'Tidak ada riwayat yang cocok'}
                </h4>
                <p className="text-xs text-gray-500 max-w-sm mx-auto">
                  {searchQuery
                    ? `Tidak ditemukan data untuk pencarian "${searchQuery}".`
                    : viewMode === 'weekly'
                    ? (selectedDayFilter !== null && weeklyMetrics
                        ? `Belum ada sesi konsumsi kopi yang dicatat pada hari ${weeklyMetrics.days[selectedDayFilter].fullDayName}.`
                        : 'Belum ada sesi diagnosa yang tercatat pada rentang minggu ini. Mulai input sesi barumu!')
                    : 'Belum ada data riwayat yang tersimpan.'}
                </p>
                <div className="flex items-center justify-center gap-2 pt-1">
                  {searchQuery || filterImpact !== 'all' || selectedDayFilter !== null ? (
                    <button
                      type="button"
                      onClick={() => { setSearchQuery(''); setFilterImpact('all'); setSelectedDayFilter(null); }}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-900 bg-gray-100 hover:bg-gray-200 px-3.5 py-1.5 rounded-lg transition cursor-pointer"
                    >
                      <span>Reset Filter</span>
                    </button>
                  ) : viewMode === 'weekly' ? (
                    <Link
                      to="/diagnosis"
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-white bg-gray-950 hover:bg-black px-4 py-2 rounded-xl transition cursor-pointer shadow-xs"
                    >
                      <Plus className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Input Sesi Baru</span>
                    </Link>
                  ) : null}
                </div>
              </div>
            ) : (
              <>
                <div className="space-y-3">
                  {paginatedHistory.map((item, index) => {
                    const isHighImpact = item.ml_prediction === 1 || item.sleep_impact === 'High';
                    const estimatedMg = Math.round(item.estimated_caffeine_mg || 0);
                    const itemGlobalIndex = startIndex + index;

                    return (
                      <div
                        key={item.id || itemGlobalIndex}
                        className="bg-white rounded-xl p-4 sm:p-5 shadow-xs border border-gray-200/80 hover:border-gray-300 transition-all space-y-3.5"
                      >
                        {/* Top Bar of Card */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 border-b border-gray-100">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-gray-950 text-white flex items-center justify-center font-bold text-xs shrink-0">
                              #{sortedHistory.length - itemGlobalIndex}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <Calendar className="w-3.5 h-3.5 text-gray-400" />
                                <span className="text-xs font-bold text-gray-900">
                                  {formatDate(item.created_at)}
                                </span>
                                {itemGlobalIndex === 0 && (
                                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 border border-gray-200">
                                    Terbaru
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Impact Badge */}
                          <div className="flex items-center gap-2 self-start sm:self-auto">
                            <span className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border flex items-center gap-1.5 ${
                              isHighImpact
                                ? 'bg-rose-50 text-rose-700 border-rose-200'
                                : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            }`}>
                              {isHighImpact ? (
                                <>
                                  <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
                                  <span>Dampak Tinggi</span>
                                </>
                              ) : (
                                <>
                                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                                  <span>Dampak Rendah</span>
                                </>
                              )}
                            </span>
                          </div>
                        </div>

                        {/* 4 Minimal Metric Columns */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                          
                          {/* Metric 1: Konsumsi Kopi */}
                          <div className="bg-gray-50/60 p-3 rounded-lg border border-gray-100 flex flex-col justify-between">
                            <span className="font-medium text-[11px] text-gray-500">Konsumsi Kopi</span>
                            <div className="font-bold text-gray-900 text-sm mt-1">
                              {item.coffee_cups_per_day} <span className="text-xs font-normal text-gray-500">cangkir</span>
                            </div>
                            <span className="text-[10px] text-gray-400 font-medium block mt-0.5">Ukuran: {item.coffee_size || 'Sedang'}</span>
                          </div>

                          {/* Metric 2: Total Kafein */}
                          <div className="bg-gray-50/60 p-3 rounded-lg border border-gray-100 flex flex-col justify-between">
                            <span className="font-medium text-[11px] text-gray-500">Total Kafein</span>
                            <div className="font-bold text-gray-900 text-sm mt-1">
                              {estimatedMg} <span className="text-xs font-normal text-gray-500">mg</span>
                            </div>
                            <span className="text-[10px] text-gray-400 font-medium block mt-0.5">
                              {Math.round((estimatedMg / 400) * 100)}% Batas FDA
                            </span>
                          </div>

                          {/* Metric 3: Kopi Terakhir */}
                          <div className="bg-gray-50/60 p-3 rounded-lg border border-gray-100 flex flex-col justify-between">
                            <span className="font-medium text-[11px] text-gray-500">Kopi Terakhir</span>
                            <div className="font-bold text-gray-900 text-sm mt-1">
                              {item.last_coffee_time || '15:00'}
                            </div>
                            <span className="text-[10px] text-gray-400 font-medium block mt-0.5">Waktu paruh ~5 Jam</span>
                          </div>

                          {/* Metric 4: Pola Tidur */}
                          <div className="bg-gray-50/60 p-3 rounded-lg border border-gray-100 flex flex-col justify-between">
                            <span className="font-medium text-[11px] text-gray-500">Pola Istirahat</span>
                            <div>
                              {item.is_sleep_skipped || !item.sleep_duration ? (
                                <>
                                  <div className="font-bold text-gray-500 text-sm mt-1">
                                    Dilewati
                                  </div>
                                  <span className="text-[10px] text-gray-400 font-medium block mt-0.5">Tidak diisi</span>
                                </>
                              ) : (
                                <>
                                  <div className="font-bold text-gray-900 text-sm mt-1">
                                    {item.sleep_duration} <span className="text-xs font-normal text-gray-500">Jam</span>
                                  </div>
                                  <span className="text-[10px] text-gray-400 font-medium block mt-0.5">Kualitas: {item.sleep_quality || 'Cukup'}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Actions Footer of Card */}
                        <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-2.5 border-t border-gray-100">
                          <div className="flex items-center gap-1.5 w-full sm:w-auto">
                            <button
                              type="button"
                              onClick={() => setSelectedItem(item)}
                              className="flex-1 sm:flex-initial px-3.5 py-1.5 rounded-lg border border-gray-200 bg-white text-gray-700 font-semibold text-xs hover:bg-gray-50 transition flex items-center justify-center gap-1.5 cursor-pointer"
                            >
                              <Eye className="w-3.5 h-3.5 text-gray-500" />
                              <span>Lihat Kurva</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => exportDailyPDF(item)}
                              className="p-1.5 rounded-lg border border-gray-200 bg-white text-gray-700 hover:text-indigo-600 hover:bg-indigo-50 transition cursor-pointer"
                              title="Ekspor Laporan PDF Hari Ini"
                            >
                              <FileText className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => exportDailyExcel(item)}
                              className="p-1.5 rounded-lg border border-gray-200 bg-white text-gray-700 hover:text-emerald-600 hover:bg-emerald-50 transition cursor-pointer"
                              title="Ekspor Tabel Excel Hari Ini"
                            >
                              <FileSpreadsheet className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleOpenInInsights(item)}
                            className="w-full sm:w-auto bg-gray-900 text-white px-4 py-1.5 rounded-lg font-semibold text-xs hover:bg-black transition flex items-center justify-center gap-1.5 cursor-pointer group"
                          >
                            <span>Buka di Insights</span>
                            <ChevronRight className="w-3.5 h-3.5 text-gray-400 group-hover:translate-x-0.5 transition" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* ─── PAGINATION (Clean Modern SaaS Style) ─── */}
                {filteredHistory.length > 0 && (
                  <div className="bg-white rounded-xl p-3 sm:p-4 border border-gray-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3 mt-4">
                    <div className="text-xs text-gray-500 font-medium">
                      Menampilkan <strong className="text-gray-900 font-bold">{startIndex + 1}–{endIndex}</strong> dari <strong className="text-gray-900 font-bold">{filteredHistory.length}</strong> catatan
                    </div>

                    <div className="flex items-center gap-1.5 overflow-x-auto max-w-full pb-1 sm:pb-0">
                      {/* Prev Button */}
                      <button
                        type="button"
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        className="px-2.5 py-1 rounded-lg border border-gray-200 text-xs font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition flex items-center gap-1 cursor-pointer"
                      >
                        <ChevronLeft className="w-3.5 h-3.5" />
                        <span>Prev</span>
                      </button>

                      {/* Range Pills (1-10, 11-20, 21-30...) */}
                      {Array.from({ length: totalPages }, (_, i) => {
                        const pageNum = i + 1;
                        const from = (pageNum - 1) * ITEMS_PER_PAGE + 1;
                        const to = pageNum * ITEMS_PER_PAGE;
                        const label = `${from}–${to}`;
                        const isActive = currentPage === pageNum;

                        return (
                          <button
                            key={pageNum}
                            type="button"
                            onClick={() => setCurrentPage(pageNum)}
                            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                              isActive
                                ? 'bg-gray-950 text-white shadow-xs'
                                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                            }`}
                          >
                            {label}
                          </button>
                        );
                      })}

                      {/* Next Button */}
                      <button
                        type="button"
                        disabled={currentPage === totalPages}
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        className="px-2.5 py-1 rounded-lg border border-gray-200 text-xs font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition flex items-center gap-1 cursor-pointer"
                      >
                        <span>Next</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* ─── DETAIL POPUP MODAL (Clean Medical Dialog) ─── */}
        {selectedItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fadeIn">
            <div className="bg-white rounded-2xl p-6 sm:p-7 max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-100 space-y-5 animate-scaleUp">
              
              {/* Modal Header */}
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-gray-100 text-gray-600 border border-gray-200 px-2 py-0.5 rounded-full">
                      Detail Sesi
                    </span>
                    <span className="text-xs text-gray-500 font-medium">
                      {formatDate(selectedItem.created_at)}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mt-1">
                    Evaluasi & Grafik Waktu Paruh Kafein
                  </h3>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedItem(null)}
                  className="w-8 h-8 rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-900 flex items-center justify-center transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Mini Chart Card */}
              <div className="bg-gray-50/50 p-4 sm:p-5 rounded-xl border border-gray-200/80 shadow-xs space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-emerald-600" />
                    <span className="font-bold text-gray-900">Kurva Eliminasi Kafein:</span>
                  </div>
                  <span className="text-gray-500 font-medium">Waktu Paruh 5 Jam</span>
                </div>
                
                <div className="h-44 w-full">
                  {modalChartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={modalChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="modalGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#10b981" stopOpacity={0.2} />
                            <stop offset="100%" stopColor="#10b981" stopOpacity={0.0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                        <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b', fontWeight: 500 }} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 500 }} domain={[0, 420]} />
                        <Tooltip
                          contentStyle={{ borderRadius: '10px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
                          formatter={(val: any) => [<span className="font-bold">{val} mg</span>, 'Sisa Kafein']}
                        />
                        <ReferenceLine y={400} stroke="#fca5a5" strokeWidth={1} strokeDasharray="3 3" />
                        <ReferenceLine y={50} stroke="#6ee7b7" strokeWidth={1} strokeDasharray="3 3" />
                        <Area
                          type="monotone"
                          dataKey="amount"
                          stroke="#10b981"
                          strokeWidth={2}
                          fill="url(#modalGrad)"
                          dot={false}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : null}
                </div>
              </div>

              {/* AI Analysis Container */}
              <div className="space-y-2.5">
                <div className="flex items-center gap-2 text-xs font-bold text-gray-900">
                  <HeartPulse className="w-4 h-4 text-emerald-600" />
                  <span>Rencana Evaluasi & Panduan Pemulihan:</span>
                </div>
                <div className="max-h-96 overflow-y-auto pr-1">
                  <AiAnalysisView content={selectedItem.ai_analysis} />
                </div>
              </div>

              {/* Footer */}
              <div className="pt-3 border-t border-gray-100 flex flex-wrap items-center justify-between gap-2.5">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => exportDailyPDF(selectedItem)}
                    className="px-3.5 py-2 rounded-xl border border-gray-200 text-gray-700 font-semibold text-xs hover:bg-gray-50 transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
                    title="Cetak Laporan PDF Sesi Ini"
                  >
                    <FileText className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Cetak PDF</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => exportDailyExcel(selectedItem)}
                    className="px-3.5 py-2 rounded-xl border border-gray-200 text-gray-700 font-semibold text-xs hover:bg-gray-50 transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
                    title="Unduh Tabel Excel Sesi Ini"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Tabel Excel</span>
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedItem(null)}
                    className="px-4 py-2 rounded-xl border border-gray-200 text-gray-700 font-semibold text-xs hover:bg-gray-50 transition cursor-pointer"
                  >
                    Tutup
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      handleOpenInInsights(selectedItem);
                    }}
                    className="bg-gray-950 text-white px-4 py-2 rounded-xl font-semibold text-xs hover:bg-black transition flex items-center gap-1.5 shadow-xs cursor-pointer"
                  >
                    <span>Buka di Halaman Insights</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

            </div>
          </div>
        )}

      </div>
    </DashboardLayout>
  );
}
