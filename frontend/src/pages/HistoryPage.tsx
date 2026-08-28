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
  CheckCircle2, AlertTriangle, Clock
} from 'lucide-react';
import DashboardLayout from '../layouts/DashboardLayout';
import { getAllAssessmentsApi } from '../services/api';
import AiAnalysisView from '../components/AiAnalysisView';

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
  const [history, setHistory] = useState<any[]>([]);
  const [selectedItem, setSelectedItem] = useState<any | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterImpact, setFilterImpact] = useState<'all' | 'low' | 'high'>('all');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest' | 'highest_caffeine' | 'lowest_sleep'>('newest');
  
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

          <div className="flex items-center gap-3 shrink-0">
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
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-2.5 rounded-2xl border border-gray-200/80 shadow-xs">
          <div className="flex items-center gap-1.5 p-1 bg-gray-100/80 rounded-xl border border-gray-200/60 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => { setViewMode('daily'); setSelectedDayFilter(null); }}
              className={`flex-1 sm:flex-initial px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                viewMode === 'daily'
                  ? 'bg-white text-gray-900 shadow-xs'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              <Calendar className={`w-3.5 h-3.5 ${viewMode === 'daily' ? 'text-amber-600' : 'text-gray-400'}`} />
              <span>Mode Harian (Semua Sesi)</span>
            </button>

            <button
              type="button"
              onClick={() => { setViewMode('weekly'); setSelectedDayFilter(null); }}
              className={`flex-1 sm:flex-initial px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                viewMode === 'weekly'
                  ? 'bg-white text-gray-900 shadow-xs'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              <TrendingUp className={`w-3.5 h-3.5 ${viewMode === 'weekly' ? 'text-indigo-600' : 'text-gray-400'}`} />
              <span>Mode Mingguan (Rapor 7 Hari)</span>
              {weeklyMetrics && weeklyMetrics.score > 0 && (
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${
                  weeklyMetrics.score >= 80 ? 'bg-emerald-100 text-emerald-800' :
                  weeklyMetrics.score >= 60 ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'
                }`}>
                  {weeklyMetrics.score}
                </span>
              )}
            </button>
          </div>

          {/* Week Selector in Weekly Mode */}
          {viewMode === 'weekly' && weeklyMetrics && (
            <div className="flex items-center justify-between sm:justify-end gap-2 px-2 py-1">
              <button
                type="button"
                onClick={() => { setSelectedWeekOffset(prev => prev - 1); setSelectedDayFilter(null); }}
                className="p-1.5 rounded-lg border border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-700 transition cursor-pointer flex items-center gap-1 text-xs font-semibold"
                title="Minggu Sebelumnya"
              >
                <ChevronLeft className="w-4 h-4" />
                <span className="hidden md:inline">Minggu Lalu</span>
              </button>

              <span className="text-xs font-bold text-gray-800 px-2.5 py-1 bg-gray-50 rounded-lg border border-gray-200/80">
                {weeklyMetrics.weekLabel}
              </span>

              <button
                type="button"
                onClick={() => { setSelectedWeekOffset(prev => prev + 1); setSelectedDayFilter(null); }}
                disabled={selectedWeekOffset >= 0}
                className={`p-1.5 rounded-lg border border-gray-200 transition cursor-pointer flex items-center gap-1 text-xs font-semibold ${
                  selectedWeekOffset >= 0
                    ? 'bg-gray-100 text-gray-300 border-gray-100 cursor-not-allowed'
                    : 'bg-gray-50 hover:bg-gray-100 text-gray-700'
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
                  className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 underline ml-1 cursor-pointer"
                >
                  Ke Minggu Ini
                </button>
              )}
            </div>
          )}
        </div>

        {/* ─── WEEKLY TRACK & REVIEW COMPONENT ─── */}
        {viewMode === 'weekly' && weeklyMetrics && (
          <div className="space-y-6">
            {/* Top Scorecard & Summary Banner */}
            <div className="bg-white rounded-2xl p-6 sm:p-7 shadow-xs border border-gray-200/80 space-y-6">
              
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-6 border-b border-gray-100">
                {/* Score Left Column */}
                <div className="flex items-center gap-4">
                  <div className={`w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex flex-col items-center justify-center border shadow-xs shrink-0 ${
                    weeklyMetrics.score >= 80
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : weeklyMetrics.score >= 60
                      ? 'bg-amber-50 text-amber-700 border-amber-200'
                      : 'bg-rose-50 text-rose-700 border-rose-200'
                  }`}>
                    <span className="text-2xl sm:text-3xl font-extrabold tracking-tight leading-none">
                      {weeklyMetrics.score}
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-wider opacity-80 mt-1">
                      Skor / 100
                    </span>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                        weeklyMetrics.score >= 80
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : weeklyMetrics.score >= 60
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : 'bg-rose-50 text-rose-700 border-rose-200'
                      }`}>
                        {weeklyMetrics.scoreCategory}
                      </span>
                      <span className="text-xs text-gray-400 font-medium">
                        • {weeklyMetrics.recordedDaysCount} dari 7 Hari Tercatat
                      </span>
                    </div>
                    <h3 className="text-lg sm:text-xl font-bold text-gray-900">
                      Rapor Disiplin Ritme Kafein Minggu Ini
                    </h3>
                    <p className="text-xs sm:text-sm text-gray-500 max-w-xl">
                      {weeklyMetrics.score >= 80
                        ? 'Ritme konsumsi kafeinmu sangat teratur dan tidak membebani jam tidur maupun ritme sirkadian tubuh.'
                        : weeklyMetrics.score >= 60
                        ? 'Pola konsumsimu cukup baik, namun ada beberapa catatan seperti jam ngopi sore yang perlu diperhatikan.'
                        : 'Beban kafein dan jam istirahat di minggu ini membutuhkan perbaikan dan reset cut-off time.'}
                    </p>
                  </div>
                </div>

                {/* Status Badges Counts */}
                <div className="flex items-center gap-2 self-stretch sm:self-auto justify-between sm:justify-start bg-gray-50 p-2.5 rounded-xl border border-gray-200/60 shrink-0">
                  <div className="text-center px-3 py-1">
                    <span className="text-base font-extrabold text-emerald-600 block leading-tight">
                      {weeklyMetrics.goodDaysCount}
                    </span>
                    <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
                      Hari Prima 🟢
                    </span>
                  </div>
                  <div className="w-[1px] h-7 bg-gray-200"></div>
                  <div className="text-center px-3 py-1">
                    <span className="text-base font-extrabold text-amber-600 block leading-tight">
                      {weeklyMetrics.moderateDaysCount}
                    </span>
                    <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
                      Cukup 🟡
                    </span>
                  </div>
                  <div className="w-[1px] h-7 bg-gray-200"></div>
                  <div className="text-center px-3 py-1">
                    <span className="text-base font-extrabold text-rose-600 block leading-tight">
                      {weeklyMetrics.poorDaysCount}
                    </span>
                    <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
                      Evaluasi 🔴
                    </span>
                  </div>
                </div>
              </div>

              {/* 4 Weekly Quick Stat Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
                <div className="bg-gray-50/60 p-4 rounded-xl border border-gray-200/70 flex flex-col justify-between">
                  <span className="text-xs font-semibold text-gray-500 flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-amber-600" />
                    Rata-rata Kafein
                  </span>
                  <div className="mt-2">
                    <span className="text-xl font-bold text-gray-900">{weeklyMetrics.avgCaffeine}</span>
                    <span className="text-xs font-medium text-gray-500 ml-1">mg / hari</span>
                    <span className="text-[11px] text-gray-400 block mt-0.5">
                      {weeklyMetrics.avgCaffeine <= 200 ? 'Rendah & Sangat Aman' : weeklyMetrics.avgCaffeine <= 350 ? 'Sedang' : 'Tinggi'}
                    </span>
                  </div>
                </div>

                <div className="bg-gray-50/60 p-4 rounded-xl border border-gray-200/70 flex flex-col justify-between">
                  <span className="text-xs font-semibold text-gray-500 flex items-center gap-1.5">
                    <Moon className="w-3.5 h-3.5 text-purple-600" />
                    Rata-rata Tidur
                  </span>
                  <div className="mt-2">
                    <span className="text-xl font-bold text-gray-900">{weeklyMetrics.avgSleep}</span>
                    <span className="text-xs font-medium text-gray-500 ml-1">Jam / malam</span>
                    <span className="text-[11px] text-gray-400 block mt-0.5">
                      {weeklyMetrics.avgSleep !== '-' && Number(weeklyMetrics.avgSleep) >= 7 ? 'Rentang Ideal (7–9 Jam)' : 'Di Bawah Anjuran'}
                    </span>
                  </div>
                </div>

                <div className="bg-gray-50/60 p-4 rounded-xl border border-gray-200/70 flex flex-col justify-between">
                  <span className="text-xs font-semibold text-gray-500 flex items-center gap-1.5">
                    <Coffee className="w-3.5 h-3.5 text-orange-600" />
                    Total Sesi Catatan
                  </span>
                  <div className="mt-2">
                    <span className="text-xl font-bold text-gray-900">{weeklyMetrics.weekAssessments.length}</span>
                    <span className="text-xs font-medium text-gray-500 ml-1">Sesi Diagnosa</span>
                    <span className="text-[11px] text-gray-400 block mt-0.5">
                      {weeklyMetrics.recordedDaysCount} Hari Aktif Minggu Ini
                    </span>
                  </div>
                </div>

                <div className="bg-gray-50/60 p-4 rounded-xl border border-gray-200/70 flex flex-col justify-between">
                  <span className="text-xs font-semibold text-gray-500 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    Rasio Hari Prima
                  </span>
                  <div className="mt-2">
                    <span className="text-xl font-bold text-emerald-700">
                      {weeklyMetrics.recordedDaysCount > 0
                        ? Math.round((weeklyMetrics.goodDaysCount / weeklyMetrics.recordedDaysCount) * 100)
                        : 0}%
                    </span>
                    <span className="text-xs font-medium text-gray-500 ml-1">Bebas Gangguan</span>
                    <span className="text-[11px] text-gray-400 block mt-0.5">
                      Kualitas sirkadian terjaga
                    </span>
                  </div>
                </div>
              </div>

              {/* ─── 7-DAY INTERACTIVE VISUAL TRACK (SENIN - MINGGU) ─── */}
              <div className="space-y-3 pt-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h4 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-indigo-600" />
                      <span>Pelacak 7 Hari (Senin – Minggu)</span>
                    </h4>
                    <p className="text-xs text-gray-500">
                      Klik salah satu hari di bawah untuk menyaring riwayat khusus hari tersebut.
                    </p>
                  </div>

                  {selectedDayFilter !== null && (
                    <button
                      type="button"
                      onClick={() => setSelectedDayFilter(null)}
                      className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 bg-indigo-50 px-2.5 py-1 rounded-lg transition cursor-pointer w-fit"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>Tampilkan Semua Hari Minggu Ini</span>
                    </button>
                  )}
                </div>

                {/* 7 Day Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
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
                        className={`p-3 rounded-xl border text-left transition-all relative flex flex-col justify-between min-h-[115px] ${
                          isEmpty
                            ? 'bg-gray-50/50 border-gray-200/60 opacity-60 cursor-not-allowed'
                            : isSelected
                            ? 'bg-indigo-50/70 border-indigo-500 ring-2 ring-indigo-500/20 shadow-xs cursor-pointer'
                            : 'bg-white border-gray-200/80 hover:border-gray-300 hover:shadow-xs cursor-pointer'
                        }`}
                      >
                        {/* Day Header */}
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                            {day.dayName}
                          </span>
                          <span className="text-xs font-extrabold text-gray-900">
                            {day.dateNumber}
                          </span>
                        </div>

                        {/* Middle Content */}
                        <div className="my-2 space-y-1">
                          {day.status === 'empty' ? (
                            <span className="text-[10px] text-gray-400 font-medium block">
                              Belum ada data
                            </span>
                          ) : (
                            <>
                              <div className="flex items-center gap-1 text-xs font-bold text-gray-900">
                                <Coffee className="w-3 h-3 text-amber-600 shrink-0" />
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
                                  <Moon className="w-2.5 h-2.5 text-purple-400 shrink-0" />
                                  <span>{day.sleepHours}j tidur</span>
                                </div>
                              )}
                            </>
                          )}
                        </div>

                        {/* Status Footer Pill */}
                        <div>
                          {isGood && (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 inline-flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                              Bagus
                            </span>
                          )}
                          {isModerate && (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200 inline-flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                              Cukup
                            </span>
                          )}
                          {isPoor && (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-rose-50 text-rose-700 border border-rose-200 inline-flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                              Evaluasi
                            </span>
                          )}
                          {isEmpty && (
                            <span className="text-[9px] font-medium text-gray-400">
                              -
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* ─── DUA KOTAK KOMPARASI: YANG SUDAH BAGUS VS PERLU DITINGKATKAN ─── */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                {/* Positive Achievements (Kelebihan) */}
                <div className="bg-emerald-50/40 border border-emerald-200/80 rounded-2xl p-5 space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs sm:text-sm font-bold text-emerald-900">
                        Yang Sudah Bagus Minggu Ini
                      </h4>
                      <p className="text-[11px] text-emerald-700/80">
                        Pencapaian positif ritme konsumsi kopi dan sirkadianmu.
                      </p>
                    </div>
                  </div>

                  <ul className="space-y-2">
                    {weeklyMetrics.goodPoints.map((pt, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs text-emerald-800 leading-relaxed">
                        <span className="text-emerald-500 font-bold mt-0.5">•</span>
                        <span>{pt}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Improvement Points (Kekurangan / Perlu Evaluasi) */}
                <div className="bg-amber-50/40 border border-amber-200/80 rounded-2xl p-5 space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                      <AlertTriangle className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs sm:text-sm font-bold text-amber-900">
                        Catatan Evaluasi / Perlu Diperbaiki
                      </h4>
                      <p className="text-[11px] text-amber-700/80">
                        Poin kebiasaan yang berpotensi mengganggu kualitas istirahat.
                      </p>
                    </div>
                  </div>

                  <ul className="space-y-2">
                    {weeklyMetrics.improvementPoints.map((pt, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs text-amber-800 leading-relaxed">
                        <span className="text-amber-500 font-bold mt-0.5">•</span>
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
                          <button
                            type="button"
                            onClick={() => setSelectedItem(item)}
                            className="w-full sm:w-auto px-3.5 py-1.5 rounded-lg border border-gray-200 bg-white text-gray-700 font-semibold text-xs hover:bg-gray-50 transition flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5 text-gray-500" />
                            <span>Lihat Kurva & Evaluasi</span>
                          </button>

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
              <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-2.5">
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
        )}

      </div>
    </DashboardLayout>
  );
}
