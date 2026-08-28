import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AreaChart, Area, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine,
} from 'recharts';
import {
  Loader2, ArrowRight, ArrowLeft,
  TrendingUp, Moon, Calendar, CheckCircle2, AlertTriangle, AlertCircle,
  Zap, Coffee, Lightbulb, Sparkles, Droplets, Utensils, ShieldCheck,
  Dumbbell, Activity, Flame
} from 'lucide-react';
import DashboardLayout from '../layouts/DashboardLayout';
import { submitAssessment, getAllAssessmentsApi } from '../services/api';

const getLocalDateString = (d: Date = new Date()) => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getSleepQualityInfo = (durationStr: string) => {
  const d = parseInt(durationStr.replace('+', '')) || 7;
  if (d <= 4) {
    return {
      quality: 'Sangat buruk',
      label: 'Sangat Buruk',
      badgeClass: 'bg-rose-50 text-rose-700 border-rose-200',
      description: 'Durasi tidur sangat minim (< 5 jam). Otak dan organ tubuh kekurangan waktu pemulihan biologis.'
    };
  }
  if (d === 5) {
    return {
      quality: 'Buruk',
      label: 'Buruk (Kurang)',
      badgeClass: 'bg-rose-50 text-rose-700 border-rose-200',
      description: 'Durasi 5 jam berada di bawah batas standar minimum pemulihan fisik harian.'
    };
  }
  if (d === 6) {
    return {
      quality: 'Cukup',
      label: 'Cukup (Ambang Batas)',
      badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
      description: 'Durasi 6 jam berada di batas ambang wajar, namun rentan terganggu jika kafein dikonsumsi sore/malam.'
    };
  }
  if (d === 7) {
    return {
      quality: 'Baik',
      label: 'Baik (Optimal)',
      badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      description: 'Durasi 7 jam memenuhi standar medis tidur sehat untuk pemulihan ritme sirkadian tubuh.'
    };
  }
  return {
    quality: 'Sangat baik',
    label: 'Sangat Baik (Ideal Emas)',
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    description: 'Durasi 8-9+ jam adalah durasi emas untuk regenerasi sel dan pemulihan reseptor adenosine otak.'
  };
};

const getWaterIntakeInfo = (waterMlStr: string) => {
  const ml = parseInt(waterMlStr.replace('+', '')) || 1500;
  if (ml <= 500) {
    return {
      label: 'Dehidrasi Berat (500 ml)',
      badgeClass: 'bg-rose-50 text-rose-700 border-rose-200',
      description: 'Asupan air sangat kurang. Ginjal bekerja sangat berat menyaring kafein dan berisiko memicu sakit kepala atau lemas.'
    };
  }
  if (ml === 1000) {
    return {
      label: 'Kurang (1.000 ml)',
      badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
      description: 'Asupan air di bawah rekomendasi hidrasi harian saat mengonsumsi minuman berkafein.'
    };
  }
  if (ml === 1500) {
    return {
      label: 'Cukup (1.500 ml)',
      badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      description: 'Asupan air standar untuk menjaga kestabilan cairan tubuh dan ekskresi metabolit kafein.'
    };
  }
  if (ml === 2000) {
    return {
      label: 'Ideal & Optimal (2.000 ml)',
      badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      description: 'Standar emas hidrasi harian (8 gelas) untuk mencegah dehidrasi seluler akibat efek diuretik kopi.'
    };
  }
  return {
    label: 'Sangat Baik (> 2.000 ml)',
    badgeClass: 'bg-cyan-50 text-cyan-700 border-cyan-200',
    description: 'Hidrasi sangat melimpah untuk mendukung fungsi ginjal, metabolisme hati, dan kestabilan detak jantung.'
  };
};

export default function Diagnosis() {
  const navigate = useNavigate();

  // Load previous assessment data as baseline
  const prevAssessment = useMemo<any>(() => {
    const saved = localStorage.getItem('assessmentResult');
    if (saved) {
      try { return JSON.parse(saved); } catch { return null; }
    }
    return null;
  }, []);

  // Reactive history list: initialized from localStorage and updated after each submit
  const [historyList, setHistoryList] = useState<any[]>(() => {
    const str = localStorage.getItem('caffisense_assessment_history');
    if (!str) return [];
    try {
      const parsed = JSON.parse(str);
      return Array.isArray(parsed) ? parsed : [];
    } catch { return []; }
  });

  // Keep historyList in sync from API on mount & whenever localStorage updates
  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await getAllAssessmentsApi();
        if (res && Array.isArray(res.assessments)) {
          setHistoryList(res.assessments);
          localStorage.setItem('caffisense_assessment_history', JSON.stringify(res.assessments));
          return;
        }
      } catch {
        // Fallback to local storage
      }

      const str = localStorage.getItem('caffisense_assessment_history');
      if (!str) { setHistoryList([]); return; }
      try {
        const parsed = JSON.parse(str);
        if (Array.isArray(parsed)) setHistoryList(parsed);
      } catch { setHistoryList([]); }
    };

    fetchHistory();
  }, []);

  // Step 1: Kopi & Makanan
  const [cups, setCups] = useState<string>(() => prevAssessment?.coffee_cups_per_day?.toString() || '2');
  const [size, setSize] = useState<string>(() => prevAssessment?.coffee_size || 'Sedang');
  const [coffeeDate, setCoffeeDate] = useState<string>(() => {
    return getLocalDateString();
  });
  const [time, setTime] = useState<string>(() => {
    const now = new Date();
    return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
  });
  const [mealStatus, setMealStatus] = useState<'sudah_makan' | 'belum_makan'>(() => (prevAssessment?.meal_status as any) || 'sudah_makan');
  const [mealTime, setMealTime] = useState<string>(() => prevAssessment?.last_meal_time || '12:30');
  const [exerciseTiming, setExerciseTiming] = useState<'sebelum_kopi' | 'sesudah_kopi' | 'tidak_olahraga'>(() => (prevAssessment?.exercise_timing as any) || 'tidak_olahraga');
  const [exerciseDuration, setExerciseDuration] = useState<string>(() => prevAssessment?.exercise_duration_minutes?.toString() || '30');
  const [smokingIntensity, setSmokingIntensity] = useState<'none' | '1-5' | '6-10' | '>10'>(() => (prevAssessment?.smoking_intensity as any) || 'none');

  // Step 2: Tidur
  const [sleepDuration, setSleepDuration] = useState<string>(() => prevAssessment?.sleep_duration?.toString() || '7');
  const [sleepDifficulty, setSleepDifficulty] = useState<string>(() => prevAssessment?.sleep_difficulty_frequency || 'Tidak pernah / Nyenyak');

  // Automatic sleep quality evaluation derived from duration
  const autoSleepQuality = useMemo(() => {
    return getSleepQualityInfo(sleepDuration);
  }, [sleepDuration]);

  // Step 3: Hidrasi Air Putih
  const [waterIntake, setWaterIntake] = useState<string>(() => prevAssessment?.water_intake_ml?.toString() || '1500');
  const waterIntakeInfo = useMemo(() => {
    return getWaterIntakeInfo(waterIntake);
  }, [waterIntake]);

  // Step 4: Pengalaman / Gejala
  const [experience, setExperience] = useState<string>('');

  const [currentStep, setCurrentStep] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Daily & Weekly Tracking Calculations
  const todayStr = useMemo(() => getLocalDateString(), []);

  const currentTrackingDay = useMemo(() => {
    // If history is empty (deleted or fresh), tracking day is Day 1
    if (!historyList || historyList.length === 0) {
      localStorage.setItem('caffisense_start_tracking_date', todayStr);
      return 1;
    }

    // Extract earliest recorded session date from historyList
    const validDates = historyList
      .map((h: any) => h.assessment_date || h.date || h.created_at || '')
      .filter(Boolean)
      .map((d: string) => {
        try {
          if (d.includes('T')) return d.split('T')[0];
          if (d.includes(' ')) return d.split(' ')[0];
          return d;
        } catch {
          return '';
        }
      })
      .filter(Boolean);

    if (validDates.length === 0) {
      localStorage.setItem('caffisense_start_tracking_date', todayStr);
      return 1;
    }

    validDates.sort();
    const earliestDateStr = validDates[0];
    localStorage.setItem('caffisense_start_tracking_date', earliestDateStr);

    const diffTime = Math.max(0, new Date(todayStr).getTime() - new Date(earliestDateStr).getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    return (diffDays % 7) + 1; // Day 1 to 7
  }, [todayStr, historyList]);

  // Interactive Testing / Simulation Mode for Tracking Day
  const [simulatedDay, setSimulatedDay] = useState<number | null>(null);
  const effectiveTrackingDay = simulatedDay !== null ? simulatedDay : currentTrackingDay;
  const isWeeklyMilestone = effectiveTrackingDay >= 7;
  const totalSteps = 7;

  // Real-time Caffeine Calculation for Current Input
  const estimatedCaffeineMg = useMemo(() => {
    const numCups = parseInt(cups.replace('+', '')) || 0;
    const baseMg = 94.8;
    let multiplier = 1;
    if (size === 'Kecil') multiplier = 0.75;
    if (size === 'Besar') multiplier = 1.25;
    return numCups * baseMg * multiplier;
  }, [cups, size]);

  // Previous Caffeine Baseline (from last submitted session)
  const prevCaffeineMg = useMemo(() => {
    return prevAssessment ? Math.round(prevAssessment.estimated_caffeine_mg || 0) : null;
  }, [prevAssessment]);

  // Real-time Chart Curve (Multi-Peak Pharmacokinetic Engine with Full History)
  // NOTE: historyList is reactive state, so chartData updates whenever history or form inputs change
  const chartData = useMemo(() => {
    if (!time) return [];
    const [curH, curM] = time.split(':').map(Number);
    const curHourFloat = curH + (curM / 60);
    const halfLife = 5;

    const selectedDateStr = coffeeDate || new Date().toISOString().split('T')[0];

    // Collect all unique earlier doses from reactive historyList state THAT ARE FROM TODAY
    const earlierDoses: Array<{ hourFloat: number; mg: number; label: string }> = [];
    for (const h of historyList) {
      // Check if this record belongs to the selectedDate
      const recordDate = h.date || h.assessment_date?.split(' ')[0] || h.created_at?.split('T')[0]?.split(' ')[0];
      if (recordDate === selectedDateStr && h.last_coffee_time && h.estimated_caffeine_mg) {
        const [ph, pm] = h.last_coffee_time.split(':').map(Number);
        const pHour = ph + (pm / 60);
        
        // Skip the dose if it has exactly the same time as our currently typed time
        // because we don't want to double-count the current session if it was already saved
        if (Math.abs(pHour - curHourFloat) < 0.05) continue;

        // Include history dose in the background curve
        if (!earlierDoses.some(d => Math.abs(d.hourFloat - pHour) < 0.05)) {
          earlierDoses.push({
            hourFloat: pHour,
            mg: Math.round(h.estimated_caffeine_mg),
            label: h.last_coffee_time,
          });
        }
      }
    }

    // Sort earlier doses chronologically (oldest first)
    earlierDoses.sort((a, b) => a.hourFloat - b.hourFloat);

    // Determine timeline: start from earliest dose, end 16h after the latest
    const allHourFloats = [...earlierDoses.map(d => d.hourFloat), curHourFloat];
    const earliestHour = Math.min(...allHourFloats);
    const startHourInt = Math.max(0, Math.floor(earliestHour));
    const latestHour = Math.max(...allHourFloats);
    const totalHours = Math.max(16, Math.ceil(latestHour - startHourInt) + 10);

    const points = [];
    const totalPoints = totalHours * 6; // Every 10 minutes
    for (let i = 0; i <= totalPoints; i++) {
      const currentPointHour = startHourInt + (i / 6);
      const displayHour = Math.floor(currentPointHour) % 24;
      const displayMin = Math.round((currentPointHour % 1) * 60);
      const timeLabel = `${displayHour.toString().padStart(2, '0')}:${displayMin.toString().padStart(2, '0')}`;

      // 1. Cumulative decay from all historical doses
      let baselineSum = 0;
      for (const d of earlierDoses) {
        if (currentPointHour >= d.hourFloat) {
          const elapsed = currentPointHour - d.hourFloat;
          baselineSum += d.mg * Math.pow(0.5, elapsed / halfLife);
        }
      }

      // 2. Current form input dose (live, reactive)
      let currentDoseActive = 0;
      if (currentPointHour >= curHourFloat) {
        const elapsed = currentPointHour - curHourFloat;
        currentDoseActive = estimatedCaffeineMg * Math.pow(0.5, elapsed / halfLife);
      }

      const totalActive = baselineSum + currentDoseActive;

      points.push({
        time: timeLabel,
        amount: Math.round(totalActive),
        prevAmount: earlierDoses.length > 0 ? Math.round(baselineSum) : null,
      });
    }

    return points;
  }, [time, estimatedCaffeineMg, historyList]);

  // Specific ticks every 2 hours for XAxis so they never disappear or get skipped
  const chartTicks = useMemo(() => {
    if (chartData.length === 0) return [];
    return chartData.filter((_, idx) => idx % 12 === 0).map((d) => d.time);
  }, [chartData]);

  // Total cumulative caffeine consumed TODAY (FDA limit applies to total intake, not peak blood level)
  const totalCaffeineToday = useMemo(() => {
    let sum = estimatedCaffeineMg;
    const selectedDateStr = coffeeDate || new Date().toISOString().split('T')[0];
    
    const [curH, curM] = time.split(':').map(Number);
    const curHourFloat = curH + (curM / 60);

    for (const h of historyList) {
      const recordDate = h.date || h.assessment_date?.split(' ')[0] || h.created_at?.split('T')[0]?.split(' ')[0];
      if (recordDate === selectedDateStr && h.estimated_caffeine_mg && h.last_coffee_time) {
        const [ph, pm] = h.last_coffee_time.split(':').map(Number);
        const pHour = ph + (pm / 60);
        // Prevent double counting if the user is currently editing a time that's already in history
        if (Math.abs(pHour - curHourFloat) < 0.05) continue;
        sum += Number(h.estimated_caffeine_mg);
      }
    }
    return Math.round(sum);
  }, [estimatedCaffeineMg, coffeeDate, time, historyList]);

  const safeTimePoint = useMemo(() => {
    if (estimatedCaffeineMg === 0) return 'Siap Sekarang';
    const point = chartData.find(d => d.amount <= 50 && d.amount > 0)?.time;
    return point ?? '> 14 jam';
  }, [estimatedCaffeineMg, chartData]);
  const overLimit = totalCaffeineToday > 400;

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError('');
    try {
      // Get previous assessment for fallback data if user skipped step 2 or 3
      const prevDataStr = localStorage.getItem('assessmentResult');
      const prevData = prevDataStr ? JSON.parse(prevDataStr) : null;

      const finalSleepDuration = isSleepSkipped
        ? (prevData?.sleep_duration ?? null)
        : (parseInt(sleepDuration.replace('+', '')) || 7);

      const finalSleepQuality = isWeekSkipped
        ? (prevData?.sleep_quality ?? null)
        : (autoSleepQuality.quality || 'Cukup');

      const finalSleepDifficulty = isWeeklyMilestone
        ? (sleepDifficulty || 'Tidak pernah / Nyenyak')
        : (prevData?.sleep_difficulty_frequency || 'Tidak pernah / Nyenyak');

      const finalData = {
        coffee_cups_per_day: parseInt(cups.replace('+', '')) || 1,
        coffee_size: size || 'Sedang',
        last_coffee_time: time || '15:00',
        meal_status: mealStatus,
        last_meal_time: mealStatus === 'sudah_makan' ? mealTime : null,
        exercise_timing: exerciseTiming,
        exercise_duration_minutes: exerciseTiming !== 'tidak_olahraga' ? parseInt(exerciseDuration) || 30 : 0,
        smoking_intensity: smokingIntensity,
        assessment_date: coffeeDate || todayStr,
        water_intake_ml: parseInt(waterIntake.replace('+', '')) || 1500,
        sleep_duration: finalSleepDuration,
        sleep_quality: finalSleepQuality,
        sleep_difficulty_frequency: finalSleepDifficulty,
        is_sleep_skipped: isSleepSkipped,
        is_week_skipped: isWeekSkipped,
        free_text_experience: experience || 'Tidak ada keluhan khusus',
        age: 22,
        gender: 'Male',
      };
      const response = await submitAssessment(finalData);

      // Save tracking date markers if not skipped
      if (!isSleepSkipped) {
        localStorage.setItem('caffisense_last_sleep_date', coffeeDate || todayStr);
      }

      const recordTimestamp = coffeeDate 
        ? `${coffeeDate}T${time || '12:00'}:00` 
        : new Date().toISOString();

      const newRecord = {
        id: response.assessment?.id || Date.now(),
        created_at: response.assessment?.created_at || recordTimestamp,
        date: coffeeDate || todayStr,
        ...response.assessment,
        is_sleep_skipped: isSleepSkipped,
        is_week_skipped: isWeekSkipped,
        ai_analysis: response.ai_analysis,
        ml_prediction: response.assessment?.ml_prediction ?? (response.assessment?.sleep_impact === 'High' ? 1 : 0),
      };

      // 1. Save as latest result for /insights
      localStorage.setItem('assessmentResult', JSON.stringify(newRecord));

      // 2. Append to persistent history array for /history
      // Use the reactive historyList state as the base (no need to re-read localStorage)
      let savedHistoryList: any[] = [...historyList];
      
      // If there's an older prevData that wasn't in history, preserve it
      if (prevData && !savedHistoryList.some((h) => h.id === prevData.id)) {
        savedHistoryList.push(prevData);
      }

      // Add new record to front
      const updatedHistory = [newRecord, ...savedHistoryList.filter((item) => item.id !== newRecord.id)];
      localStorage.setItem('caffisense_assessment_history', JSON.stringify(updatedHistory));
      setHistoryList(updatedHistory); // Keep reactive state in sync

      // Redirect to Insights in DashboardLayout
      navigate('/insights');
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan saat memproses data.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const [showSleepConfirmModal, setShowSleepConfirmModal] = useState<boolean>(false);
  const [isSleepSkipped, setIsSleepSkipped] = useState<boolean>(false);
  const isWeekSkipped = false;

  // Prepare data for the long-term trend chart
  const trendData = useMemo(() => {
    const dailyTotals: Record<string, number> = {};
    for (const h of historyList) {
      const date = h.date || h.assessment_date?.split(' ')[0] || h.created_at?.split('T')[0]?.split(' ')[0];
      if (!date) continue;
      if (!dailyTotals[date]) dailyTotals[date] = 0;
      if (h.estimated_caffeine_mg) {
        dailyTotals[date] += Number(h.estimated_caffeine_mg);
      }
    }
    
    // Inject the real-time calculated total for the currently selected date
    // This allows the trend chart to react instantly to form inputs!
    const selectedDateStr = coffeeDate || new Date().toISOString().split('T')[0];
    dailyTotals[selectedDateStr] = totalCaffeineToday;

    // Sort dates
    return Object.keys(dailyTotals).sort().map(date => ({
      date,
      totalCaffeine: Math.round(dailyTotals[date]),
      isOverLimit: dailyTotals[date] > 400,
      limit: 400 // FDA limit line
    }));
  }, [historyList, totalCaffeineToday, coffeeDate]);

  const handleNextStep = () => {
    if (currentStep === 5) {
      setShowSleepConfirmModal(true);
    } else {
      setCurrentStep((prev) => prev + 1);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-[1400px] mx-auto relative">
        
        {/* ── Confirmation Modal for Step 5 (1x per day sleep duration) ── */}
        {showSleepConfirmModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fadeIn">
            <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl border border-gray-100 space-y-5 animate-scaleUp">
              
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center flex-shrink-0">
                  <Moon className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-amber-600 bg-amber-50 px-2.5 py-0.5 rounded-full">
                    Konfirmasi 1x Per Hari
                  </span>
                  <h4 className="text-lg font-black text-gray-900 mt-1">
                    Yakin dengan Durasi Tidur?
                  </h4>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 space-y-2 text-xs text-gray-600">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-gray-500">Pilihanmu:</span>
                  <strong className="text-gray-950 text-base">{sleepDuration} Jam Tidur</strong>
                </div>
                <p className="text-[11px] text-gray-500 leading-relaxed pt-1.5 border-t border-gray-200/60 flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
                  <span>Durasi tidur malam dicatat <strong>1 kali dalam sehari</strong>. Jika sudah sesuai, sistem akan menyimpan data ini untuk hari ini.</span>
                </p>
              </div>

              <div className="space-y-2.5 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setIsSleepSkipped(false);
                    setShowSleepConfirmModal(false);
                    setCurrentStep(6);
                  }}
                  className="w-full bg-gray-950 text-white py-3.5 rounded-full font-bold text-sm hover:bg-black transition shadow-md flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Ya, Simpan {sleepDuration} Jam & Lanjutkan</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsSleepSkipped(true);
                    setShowSleepConfirmModal(false);
                    setCurrentStep(6);
                  }}
                  className="w-full bg-gray-100 text-gray-700 py-3 rounded-full font-bold text-xs hover:bg-gray-200 transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span>Lewati Slide Ini (Tidak Mengisi Hari Ini)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowSleepConfirmModal(false)}
                  className="w-full text-center text-xs text-gray-400 hover:text-gray-600 py-1 transition cursor-pointer"
                >
                  Batal & Ubah Pilihan Jam
                </button>
              </div>

            </div>
          </div>
        )}



        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          {/* ══════════════════════════════════════════════════════════
              LEFT SIDE (7 Cols): REAL-TIME CAFFEINE DECAY VISUALIZER 
          ══════════════════════════════════════════════════════════ */}
          <div className="lg:col-span-7 flex flex-col gap-5">
            
            {/* Main Chart Card */}
            <div className="bg-white rounded-2xl p-6 border border-gray-200/80 shadow-xs flex flex-col h-[520px]">
              
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Metabolisme Real-time</span>
                  </div>
                  <h2 className="text-lg sm:text-xl font-bold text-gray-900 tracking-tight">Kurva Eliminasi Waktu Paruh</h2>
                </div>

                {/* Legend Badges - Clean Modern Chip Style */}
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <div className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-200/70 px-2.5 py-1 rounded-lg">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    <span className="text-[11px] text-emerald-800 font-semibold">Total Kafein Aktif</span>
                  </div>
                  {chartData.some(d => d.prevAmount !== null) && (
                    <div className="flex items-center gap-1.5 bg-indigo-50 border border-indigo-200/70 px-2.5 py-1 rounded-lg">
                      <span className="w-3 h-0.5 border-b-2 border-dashed border-indigo-500"></span>
                      <span className="text-[11px] text-indigo-800 font-semibold">Sisa Sesi Sebelumnya</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 px-2.5 py-1 rounded-lg">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    <span className="text-[11px] text-gray-600 font-medium">Batas Tidur (50mg)</span>
                  </div>
                  <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 px-2.5 py-1 rounded-lg">
                    <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                    <span className="text-[11px] text-gray-600 font-medium">Batas Harian (400mg)</span>
                  </div>
                </div>
              </div>

              {/* Chart Canvas */}
              <div className="flex-1 w-full min-h-[300px]">
                {chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 15, right: 15, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="caffeineDecayGrad" x1="0" y1="0" x2="0" y2="1">
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
                        formatter={(value: any, name: any) => [
                          <span className="font-bold">{value} mg</span>,
                          <span className="text-gray-500 font-medium">{name === 'amount' ? 'Total Aktif' : 'Sisa Kopi Sebelumnya'}</span>
                        ]}
                        labelStyle={{ fontWeight: 600, color: '#9ca3af', marginBottom: '6px', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}
                      />
                      <ReferenceLine y={400} stroke="#fca5a5" strokeWidth={1} strokeDasharray="4 4" ifOverflow="extendDomain" />
                      <ReferenceLine y={50} stroke="#6ee7b7" strokeWidth={1} strokeDasharray="4 4" />
                      
                      {/* Current Simulated Decay Curve */}
                      <Area
                        type="monotone"
                        dataKey="amount"
                        name="amount"
                        stroke="#10b981"
                        strokeWidth={2.5}
                        fillOpacity={1}
                        fill="url(#caffeineDecayGrad)"
                        activeDot={{ r: 5, fill: '#10b981', stroke: '#ffffff', strokeWidth: 2 }}
                        dot={false}
                      />

                      {/* Previous Baseline Curve (Trend Comparison) */}
                      {prevCaffeineMg !== null && prevCaffeineMg > 0 && (
                        <Line
                          type="monotone"
                          dataKey="prevAmount"
                          name="prevAmount"
                          stroke="#818cf8"
                          strokeWidth={1.5}
                          strokeDasharray="3 4"
                          dot={false}
                          activeDot={{ r: 3, fill: '#818cf8' }}
                        />
                      )}
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-gray-400 text-sm">
                    Pilih jam ngopi untuk melihat visualisasi
                  </div>
                )}
              </div>
            </div>

            {/* Trend Chart Card */}
            <div className="bg-white rounded-2xl p-6 border border-gray-200/80 shadow-xs flex flex-col h-[380px]">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                    <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Riwayat Sesi</span>
                  </div>
                  <h2 className="text-lg sm:text-xl font-bold text-gray-900 tracking-tight">Tren Total Konsumsi Harian</h2>
                </div>
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <div className="flex items-center gap-1.5 bg-indigo-50 border border-indigo-200/70 px-2.5 py-1 rounded-lg">
                    <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                    <span className="text-[11px] text-indigo-800 font-semibold">Total Kafein Harian</span>
                  </div>
                  <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 px-2.5 py-1 rounded-lg">
                    <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                    <span className="text-[11px] text-gray-600 font-medium">Batas Harian (400mg)</span>
                  </div>
                </div>
              </div>

              <div className="flex-1 w-full mt-2">
                {trendData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={trendData} margin={{ top: 15, right: 15, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2}/>
                          <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis 
                        dataKey="date" 
                        tickFormatter={(val) => {
                          const d = new Date(val);
                          return `${d.getDate()}/${d.getMonth()+1}`;
                        }}
                        axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b', fontWeight: 500 }} dy={10} 
                      />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#cbd5e1', fontWeight: 500 }} dx={-8} />
                      <Tooltip 
                        contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)', padding: '10px 14px' }}
                        labelFormatter={(label) => `Tanggal: ${label}`}
                      />
                      <ReferenceLine y={400} stroke="#fca5a5" strokeWidth={1} strokeDasharray="4 4" ifOverflow="extendDomain" />
                      <Area 
                        type="monotone" 
                        dataKey="totalCaffeine" 
                        name="Total Kafein" 
                        stroke="#6366f1" 
                        strokeWidth={2} 
                        fill="url(#trendGradient)" 
                        activeDot={{ r: 5, fill: '#6366f1', stroke: '#fff', strokeWidth: 2 }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm border border-dashed border-gray-200 rounded-xl">
                    Belum ada riwayat kafein yang cukup untuk menampilkan tren.
                  </div>
                )}
              </div>
            </div>

            {/* 3 Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              
              {/* Card 1: Total Kafein */}
              <div className="bg-white rounded-2xl p-5 shadow-xs border border-gray-200/80 hover:border-gray-300 transition-all flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-100 flex items-center justify-center shrink-0">
                        <Zap className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Total Kafein</span>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      overLimit 
                        ? 'bg-rose-50 text-rose-700 border-rose-200' 
                        : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    }`}>
                      {overLimit ? 'Melebihi Batas' : 'Aman'}
                    </span>
                  </div>

                  <div className="text-xl font-bold text-gray-900">
                    {totalCaffeineToday} <span className="text-xs font-normal text-gray-400">/ 400 mg</span>
                  </div>

                  {/* Context Sub-Badge */}
                  <div className="mt-2 text-[11px]">
                    {cups === '0' ? (
                      <span className="text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md inline-block text-[10px] font-medium">
                        Hari Bebas Kafein
                      </span>
                    ) : totalCaffeineToday > Math.round(estimatedCaffeineMg) ? (
                      <span className="text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-md inline-flex items-center gap-1 text-[10px] font-medium">
                        <TrendingUp className="w-3 h-3 text-indigo-600" />
                        <span>Sisa Sebelumnya: {totalCaffeineToday - Math.round(estimatedCaffeineMg)} mg</span>
                      </span>
                    ) : (
                      <span className="text-gray-400 text-[10px] font-medium">
                        Asupan Baru Hari Ini
                      </span>
                    )}
                  </div>
                </div>

                {/* FDA Progress Bar Indicator */}
                <div className="mt-4 pt-3 border-t border-gray-100">
                  <div className="flex items-center justify-between text-[10px] text-gray-500 font-medium mb-1.5">
                    <span>Beban Harian FDA</span>
                    <span className={overLimit ? 'text-rose-600 font-bold' : 'text-gray-700 font-semibold'}>
                      {Math.round((totalCaffeineToday / 400) * 100)}%
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        overLimit
                          ? 'bg-rose-500'
                          : totalCaffeineToday > 300
                          ? 'bg-amber-500'
                          : 'bg-emerald-500'
                      }`}
                      style={{ width: `${Math.min(Math.round((totalCaffeineToday / 400) * 100), 100)}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Card 2: Jam Aman Tidur */}
              <div className="bg-white rounded-2xl p-5 shadow-xs border border-gray-200/80 hover:border-gray-300 transition-all flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-purple-50 text-purple-700 border border-purple-100 flex items-center justify-center shrink-0">
                        <Moon className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Jam Aman Tidur</span>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-50 text-purple-800 border border-purple-200">
                      &lt; 50mg
                    </span>
                  </div>

                  <div className="text-xl font-bold text-purple-950">
                    {safeTimePoint}
                  </div>
                </div>

                <div className="mt-4 text-[11px] bg-emerald-50/70 p-2.5 rounded-xl border border-emerald-200/60">
                  <div className="font-semibold text-emerald-900 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>{estimatedCaffeineMg === 0 ? 'Bebas Kafein' : 'Kondisi Optimal'}</span>
                  </div>
                  <div className="text-[10px] text-gray-500 font-medium mt-0.5">
                    {estimatedCaffeineMg === 0 ? 'Tidak ada stimulasi di otak' : 'Reseptor adenosin bebas aktif'}
                  </div>
                </div>
              </div>

              {/* Card 3: Status Sesi Kopi */}
              <div className="bg-white rounded-2xl p-5 shadow-xs border border-gray-200/80 hover:border-gray-300 transition-all flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-700 border border-amber-100 flex items-center justify-center shrink-0">
                        <Coffee className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Sesi Kopi</span>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-800 border border-blue-200">
                      Pukul {time}
                    </span>
                  </div>

                  <div className="text-xl font-bold text-gray-900">
                    {cups === '0' ? (
                      <>
                        0 Cangkir <span className="text-xs font-normal text-gray-400">Hari Ini</span>
                      </>
                    ) : (
                      <>
                        {cups} <span className="text-xs font-normal text-gray-500">Cangkir ({size})</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="mt-4 text-[11px] bg-gray-50 p-2.5 rounded-xl border border-gray-200/70">
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-gray-500 font-medium">Waktu Paruh:</span>
                    <span className="font-semibold text-gray-800">5 Jam / siklus</span>
                  </div>
                  <div className="text-[10px] text-gray-400 font-medium mt-0.5">Metabolisme alami hati</div>
                </div>
              </div>

            </div>

            {/* Quick Scientific Guidance Bar */}
            <div className="bg-white rounded-2xl p-4 shadow-xs border border-gray-200/80 flex items-center justify-between gap-4 text-xs">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center shrink-0">
                  <Lightbulb className="w-4 h-4" />
                </div>
                <div className="text-gray-600 leading-relaxed text-xs">
                  <strong className="text-gray-900 font-bold">Panduan Garis Grafik:</strong> Garis hijau (<span className="text-emerald-700 font-semibold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">50mg</span>) adalah batas aman agar otak masuk fase <em className="text-gray-900 font-medium">Deep Sleep</em>, sedangkan garis merah (<span className="text-rose-700 font-semibold bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">400mg</span>) adalah batas harian rekomendasi FDA.
                </div>
              </div>
            </div>

          </div>

          {/* ══════════════════════════════════════════════════════════
              RIGHT SIDE (5 Cols): MULTI-STEP WIZARD IN CARD
          ══════════════════════════════════════════════════════════ */}
          <div className="lg:col-span-5 flex flex-col">
            <div className="bg-white rounded-2xl p-6 sm:p-7 shadow-xs border border-gray-200/80 flex flex-col justify-between min-h-[620px]">
              
              <div>
                {/* Stepper Header */}
                <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-5">
                  <div>
                    <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                      Langkah {currentStep} dari {totalSteps}
                    </span>
                    <h3 className="text-lg font-bold text-gray-900 mt-0.5">
                      {currentStep === 1 && 'Konsumsi Kopi'}
                      {currentStep === 2 && 'Kondisi Perut & Makan'}
                      {currentStep === 3 && 'Aktivitas Olahraga'}
                      {currentStep === 4 && 'Konsumsi Rokok'}
                      {currentStep === 5 && 'Durasi Tidur Harian'}
                      {currentStep === 6 && 'Hidrasi & Siklus 7 Hari'}
                      {currentStep === 7 && 'Keluhan & Gejala'}
                    </h3>
                  </div>

                  {/* Progress Indicator Dots */}
                  <div className="flex items-center gap-1.5">
                    {Array.from({ length: totalSteps }, (_, i) => i + 1).map((step) => (
                      <div
                        key={step}
                        className={`h-1.5 rounded-full transition-all duration-300 ${
                          currentStep === step 
                            ? 'w-6 bg-gray-900' 
                            : currentStep > step 
                            ? 'w-2 bg-emerald-500' 
                            : 'w-2 bg-gray-200'
                        }`}
                      />
                    ))}
                  </div>
                </div>

                {/* 7-Day Cycle Progress Tracker (Ditampilkan di semua langkah) */}
                <div className="bg-gray-50/70 p-3.5 rounded-xl border border-gray-100 space-y-2 mb-5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-gray-700 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Siklus 7 Hari: <strong className="text-gray-900">Hari ke-{effectiveTrackingDay}</strong></span>
                    </span>
                    <div className="flex items-center gap-1.5">
                      {simulatedDay !== null && (
                        <button
                          type="button"
                          onClick={() => setSimulatedDay(null)}
                          className="text-[10px] font-semibold text-gray-600 hover:text-gray-900 bg-gray-200/80 px-2 py-0.5 rounded transition cursor-pointer"
                          title="Kembali ke otomatis"
                        >
                          Reset
                        </button>
                      )}
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                        effectiveTrackingDay >= 7
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-gray-200 text-gray-700'
                      }`}>
                        {effectiveTrackingDay >= 7 ? 'Siklus Lengkap' : `Sisa ${7 - effectiveTrackingDay} Hari`}
                      </span>
                    </div>
                  </div>

                  {/* 7 Segments Interactive Tracker Buttons */}
                  <div className="grid grid-cols-7 gap-1 pt-1">
                    {[1, 2, 3, 4, 5, 6, 7].map((day) => {
                      const isCurrent = day === effectiveTrackingDay;
                      const isPast = day < effectiveTrackingDay;
                      return (
                        <button
                          key={day}
                          type="button"
                          onClick={() => setSimulatedDay(day)}
                          title={`Simulasi Hari ke-${day}`}
                          className={`flex flex-col items-center gap-1 py-1 px-1 rounded-lg transition-all cursor-pointer ${
                            isCurrent
                              ? 'bg-white shadow-xs border border-gray-300'
                              : 'hover:bg-gray-200/50'
                          }`}
                        >
                          <div
                            className={`w-full h-1.5 rounded-full transition-all ${
                              isPast
                                ? 'bg-emerald-500'
                                : isCurrent
                                ? 'bg-gray-900'
                                : 'bg-gray-200'
                            }`}
                          />
                          <span className={`text-[9px] font-bold ${
                            isCurrent ? 'text-gray-950' : isPast ? 'text-emerald-700' : 'text-gray-400'
                          }`}>
                            H{day}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* ── STEP 1: KEBIASAAN KOPI ── */}
                {currentStep === 1 && (
                  <div className="space-y-5 animate-fadeIn">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-2">
                        Berapa kali kamu minum kopi dalam sehari?
                      </label>
                      <div className="grid grid-cols-6 gap-2">
                        {['0', '1', '2', '3', '4', '5+'].map((option) => (
                          <button
                            key={option}
                            type="button"
                            onClick={() => setCups(option)}
                            className={`py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                              cups === option
                                ? 'bg-gray-900 text-white shadow-xs'
                                : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200/80'
                            }`}
                          >
                            {option}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-2">
                        Ukuran kopi yang paling sering kamu minum?
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {['Kecil', 'Sedang', 'Besar'].map((option) => (
                          <button
                            key={option}
                            type="button"
                            onClick={() => setSize(option)}
                            className={`py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                              size === option
                                ? 'bg-gray-900 text-white shadow-xs'
                                : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200/80'
                            }`}
                          >
                            {option}
                          </button>
                        ))}
                      </div>
                      <p className="text-[11px] text-gray-400 mt-1.5">
                        *Estimasi standar USDA (1 cangkir sedang = ~94.8 mg kafein)
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1.5 flex items-center justify-between">
                          <span>Tanggal Sesi</span>
                          <span className="text-[10px] text-gray-500 font-medium bg-gray-100 px-2 py-0.5 rounded">
                            {coffeeDate === todayStr ? 'Hari Ini' : 'Manual'}
                          </span>
                        </label>
                        <input
                          type="date"
                          value={coffeeDate}
                          onChange={(e) => setCoffeeDate(e.target.value)}
                          className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-medium text-gray-900 outline-none focus:border-gray-900 focus:bg-white transition"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                          Jam Kopi Terakhir
                        </label>
                        <input
                          type="time"
                          value={time}
                          onChange={(e) => setTime(e.target.value)}
                          className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-medium text-gray-900 outline-none focus:border-gray-900 focus:bg-white transition"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* ── STEP 2: KONDISI PERUT & MAKAN ── */}
                {currentStep === 2 && (
                  <div className="space-y-4 animate-fadeIn">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1 flex items-center gap-1.5">
                        <Utensils className="w-3.5 h-3.5 text-amber-600" />
                        <span>Kondisi perut saat minum kopi terakhir:</span>
                      </label>
                      <p className="text-[11px] text-gray-400 mb-3">
                        Makanan dalam lambung memperlambat absorpsi kafein dan melindungi dinding mukosa dari asam lambung (HCl).
                      </p>

                      <div className="grid grid-cols-2 gap-2 mb-3">
                        <button
                          type="button"
                          onClick={() => setMealStatus('sudah_makan')}
                          className={`py-3 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 border ${
                            mealStatus === 'sudah_makan'
                              ? 'bg-gray-900 text-white border-gray-900 shadow-xs'
                              : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border-gray-200/80'
                          }`}
                        >
                          <CheckCircle2 className={`w-4 h-4 ${mealStatus === 'sudah_makan' ? 'text-emerald-400' : 'text-emerald-600'}`} />
                          <span>Sudah Makan</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setMealStatus('belum_makan')}
                          className={`py-3 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 border ${
                            mealStatus === 'belum_makan'
                              ? 'bg-rose-950 text-white border-rose-950 shadow-xs'
                              : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border-gray-200/80'
                          }`}
                        >
                          <AlertTriangle className={`w-4 h-4 ${mealStatus === 'belum_makan' ? 'text-rose-400' : 'text-amber-600'}`} />
                          <span>Belum Makan (Perut Kosong)</span>
                        </button>
                      </div>

                      {/* Input Jam Makan Terakhir jika Sudah Makan */}
                      {mealStatus === 'sudah_makan' && (
                        <div className="animate-fadeIn pb-2">
                          <div className="flex items-center justify-between mb-1.5">
                            <label className="block text-[11px] font-semibold text-gray-600">
                              Jam Makan Terakhir:
                            </label>
                            <span className="text-[10px] text-gray-400">Sebelum/bersama jam ngopi</span>
                          </div>
                          <input
                            type="time"
                            value={mealTime}
                            onChange={(e) => setMealTime(e.target.value)}
                            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-medium text-gray-900 outline-none focus:border-gray-900 focus:bg-white transition"
                          />
                        </div>
                      )}

                      {/* Kartu Status Lambung Instan */}
                      <div className={`p-3.5 rounded-xl border text-xs space-y-1.5 transition-all ${
                        mealStatus === 'sudah_makan'
                          ? 'bg-emerald-50/70 border-emerald-200/80 text-emerald-900'
                          : 'bg-amber-50/70 border-amber-200/80 text-amber-950'
                      }`}>
                        <div className="flex items-center gap-1.5 font-bold text-xs">
                          {mealStatus === 'sudah_makan' ? (
                            <>
                              <ShieldCheck className="w-4 h-4 text-emerald-600" />
                              <span className="text-emerald-800">Perlindungan Mukosa Lambung Optimal</span>
                            </>
                          ) : (
                            <>
                              <AlertTriangle className="w-4 h-4 text-amber-600" />
                              <span className="text-amber-800">Waspada: Penyerapan Kafein Cepat & Asam Lambung</span>
                            </>
                          )}
                        </div>
                        <p className={`text-[11px] leading-relaxed ${
                          mealStatus === 'sudah_makan' ? 'text-emerald-700/90' : 'text-amber-800/90'
                        }`}>
                          {mealStatus === 'sudah_makan'
                            ? 'Aman: Makanan memperlambat absorpsi kafein dan melindungi dinding lambung.'
                            : 'Waspada: Kafein diserap kilat (15 mnt), memicu lonjakan asam lambung (HCl) dan detak jantung.'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* ── STEP 3: AKTIVITAS OLAHRAGA ── */}
                {currentStep === 3 && (
                  <div className="space-y-4 animate-fadeIn">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1 flex items-center gap-1.5">
                        <Dumbbell className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Aktivitas olahraga hari ini:</span>
                      </label>
                      <p className="text-[11px] text-gray-400 mb-3">
                        Aktivitas fisik memengaruhi metabolisme kafein, pembakaran kalori, dan proses re-sintesis glikogen otot.
                      </p>

                      <div className="grid grid-cols-3 gap-2 mb-3">
                        <button
                          type="button"
                          onClick={() => setExerciseTiming('sebelum_kopi')}
                          className={`py-3 px-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex flex-col items-center justify-center gap-0.5 border ${
                            exerciseTiming === 'sebelum_kopi'
                              ? 'bg-gray-900 text-white border-gray-900 shadow-xs'
                              : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border-gray-200/80'
                          }`}
                        >
                          <span className="font-bold">Sebelum Kopi</span>
                          <span className={`text-[9px] font-medium ${exerciseTiming === 'sebelum_kopi' ? 'text-gray-300' : 'text-gray-400'}`}>(Pre-Workout)</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setExerciseTiming('sesudah_kopi')}
                          className={`py-3 px-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex flex-col items-center justify-center gap-0.5 border ${
                            exerciseTiming === 'sesudah_kopi'
                              ? 'bg-indigo-950 text-white border-indigo-950 shadow-xs'
                              : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border-gray-200/80'
                          }`}
                        >
                          <span className="font-bold">Sesudah Kopi</span>
                          <span className={`text-[9px] font-medium ${exerciseTiming === 'sesudah_kopi' ? 'text-indigo-200' : 'text-gray-400'}`}>(Post-Workout)</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setExerciseTiming('tidak_olahraga')}
                          className={`py-3 px-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex flex-col items-center justify-center gap-0.5 border ${
                            exerciseTiming === 'tidak_olahraga'
                              ? 'bg-gray-700 text-white border-gray-700 shadow-xs'
                              : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border-gray-200/80'
                          }`}
                        >
                          <span className="font-bold">Tidak Olahraga</span>
                          <span className={`text-[9px] font-medium ${exerciseTiming === 'tidak_olahraga' ? 'text-gray-300' : 'text-gray-400'}`}>(Pasif)</span>
                        </button>
                      </div>

                      {/* Input Durasi Olahraga jika Berolahraga */}
                      {exerciseTiming !== 'tidak_olahraga' && (
                        <div className="animate-fadeIn pb-2 space-y-1.5">
                          <div className="flex items-center justify-between">
                            <label className="block text-[11px] font-semibold text-gray-600">
                              Berapa lama durasi olahragamu?
                            </label>
                            <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                              {exerciseDuration} Menit
                            </span>
                          </div>
                          
                          <div className="grid grid-cols-5 gap-1.5">
                            {['15', '30', '45', '60', '90'].map((mins) => (
                              <button
                                key={mins}
                                type="button"
                                onClick={() => setExerciseDuration(mins)}
                                className={`py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer border ${
                                  exerciseDuration === mins
                                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                                    : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border-gray-200/80'
                                }`}
                              >
                                {mins} mnt
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Kartu Status Fisiologis Olahraga Instan */}
                      <div className={`p-3.5 rounded-xl border text-xs space-y-1.5 transition-all ${
                        exerciseTiming === 'sebelum_kopi'
                          ? 'bg-emerald-50/70 border-emerald-200/80 text-emerald-900'
                          : exerciseTiming === 'sesudah_kopi'
                          ? 'bg-indigo-50/70 border-indigo-200/80 text-indigo-900'
                          : 'bg-gray-50 border-gray-200/80 text-gray-700'
                      }`}>
                        <div className="flex items-center gap-1.5 font-bold text-xs">
                          {exerciseTiming === 'sebelum_kopi' ? (
                            <>
                              <Zap className="w-4 h-4 text-emerald-600" />
                              <span className="text-emerald-800">Pre-Workout: Peningkatan Performa & Metabolisme Cepat</span>
                            </>
                          ) : exerciseTiming === 'sesudah_kopi' ? (
                            <>
                              <Activity className="w-4 h-4 text-indigo-600" />
                              <span className="text-indigo-800">Post-Workout: Re-sintesis Glikogen & Pemulihan Otot</span>
                            </>
                          ) : (
                            <>
                              <Moon className="w-4 h-4 text-gray-500" />
                              <span className="text-gray-700">Metabolisme Pasif Standar</span>
                            </>
                          )}
                        </div>
                        <p className={`text-[11px] leading-relaxed ${
                          exerciseTiming === 'sebelum_kopi'
                            ? 'text-emerald-700/90'
                            : exerciseTiming === 'sesudah_kopi'
                            ? 'text-indigo-700/90'
                            : 'text-gray-500'
                        }`}>
                          {exerciseTiming === 'sebelum_kopi'
                            ? 'Kafein memicu pembakaran kalori lebih tinggi & mempercepat laju eliminasi kafein darah sekitar 20%.'
                            : exerciseTiming === 'sesudah_kopi'
                            ? 'Membantu pemulihan energi otot. Pastikan minum air putih cukup agar ginjal tetap ringan.'
                            : 'Laju pembersihan kafein mengikuti waktu paruh pasif standar (~5 jam).'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* ── STEP 4: KONSUMSI ROKOK ── */}
                {currentStep === 4 && (
                  <div className="space-y-4 animate-fadeIn">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1 flex items-center gap-1.5">
                        <Flame className="w-3.5 h-3.5 text-rose-500" />
                        <span>Konsumsi rokok hari ini:</span>
                      </label>
                      <p className="text-[11px] text-gray-400 mb-3">
                        Nikotin menginduksi enzim hati CYP1A2 yang memetabolisme dan membuang kafein dari aliran darah.
                      </p>

                      <div className="grid grid-cols-4 gap-1.5 mb-3">
                        {[
                          { id: 'none', label: 'Tidak Merokok', sub: '(Non-Perokok)' },
                          { id: '1-5', label: '1–5 Batang', sub: '(Ringan)' },
                          { id: '6-10', label: '6–10 Batang', sub: '(Sedang)' },
                          { id: '>10', label: '> 10 Batang', sub: '(Intensif)' }
                        ].map((item) => (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => setSmokingIntensity(item.id as any)}
                            className={`py-3 px-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex flex-col items-center justify-center gap-0.5 border ${
                              smokingIntensity === item.id
                                ? item.id === 'none'
                                  ? 'bg-gray-900 text-white border-gray-900 shadow-xs'
                                  : 'bg-rose-950 text-white border-rose-950 shadow-xs'
                                : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border-gray-200/80'
                            }`}
                          >
                            <span className="font-bold">{item.label}</span>
                            <span className={`text-[9px] font-medium ${
                              smokingIntensity === item.id
                                ? item.id === 'none' ? 'text-gray-300' : 'text-rose-200'
                                : 'text-gray-400'
                            }`}>
                              {item.sub}
                            </span>
                          </button>
                        ))}
                      </div>

                      {/* Kartu Status Metabolisme Rokok Instan */}
                      <div className={`p-3.5 rounded-xl border text-xs space-y-1.5 transition-all ${
                        smokingIntensity === 'none'
                          ? 'bg-gray-50 border-gray-200/80 text-gray-700'
                          : 'bg-amber-50/70 border-amber-200/80 text-amber-950'
                      }`}>
                        <div className="flex items-center gap-1.5 font-bold text-xs">
                          {smokingIntensity === 'none' ? (
                            <>
                              <ShieldCheck className="w-4 h-4 text-emerald-600" />
                              <span className="text-gray-900">Metabolisme Normal (Waktu Paruh Standar)</span>
                            </>
                          ) : (
                            <>
                              <Zap className="w-4 h-4 text-amber-600" />
                              <span className="text-amber-800">Akselerasi Enzim Hati (CYP1A2) & Beban Vaskular</span>
                            </>
                          )}
                        </div>
                        <p className={`text-[11px] leading-relaxed ${
                          smokingIntensity === 'none' ? 'text-gray-500' : 'text-amber-800/90'
                        }`}>
                          {smokingIntensity === 'none'
                            ? 'Eliminasi kafein berjalan stabil pada laju fisiologis standar tubuh (waktu paruh ±5 jam).'
                            : 'Nikotin memicu hati memecah kafein 2x lebih cepat (waktu paruh turun ke ±3 jam). Waspadai peningkatan asam lambung dan beban pompa jantung.'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* ── STEP 5: DURASI TIDUR HARIAN ── */}
                {currentStep === 5 && (
                  <div className="space-y-4 animate-fadeIn">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        Berapa jam rata-rata durasi tidurmu per malam?
                      </label>
                      <p className="text-[11px] text-gray-400 mb-3">
                        Pilih total jam tidur malam yang kamu dapatkan.
                      </p>

                      <div className="grid grid-cols-6 gap-2 mb-3">
                        {['4', '5', '6', '7', '8', '9+'].map((option) => (
                          <button
                            key={option}
                            type="button"
                            onClick={() => {
                              setSleepDuration(option);
                              setIsSleepSkipped(false);
                            }}
                            className={`py-3 rounded-xl text-sm font-bold transition-all cursor-pointer ${
                              sleepDuration === option && !isSleepSkipped
                                ? 'bg-gray-900 text-white shadow-xs'
                                : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200/80'
                            }`}
                          >
                            {option} <span className="text-[10px] font-normal block">Jam</span>
                          </button>
                        ))}
                      </div>

                      {/* Sleep Status Card Info (Otomatis Dinilai) */}
                      <div className="bg-gray-50/70 p-3.5 rounded-xl border border-gray-100 space-y-2 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="text-gray-500 font-medium">Kualitas Tidur:</span>
                          <span className={`font-semibold px-2.5 py-0.5 rounded text-[11px] flex items-center gap-1 border ${autoSleepQuality.badgeClass}`}>
                            {autoSleepQuality.quality === 'Sangat baik' || autoSleepQuality.quality === 'Baik' ? (
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            ) : autoSleepQuality.quality === 'Cukup' ? (
                              <AlertTriangle className="w-3 h-3 text-amber-600" />
                            ) : (
                              <AlertCircle className="w-3 h-3 text-rose-600" />
                            )}
                            <span>{autoSleepQuality.label}</span>
                          </span>
                        </div>
                        <p className="text-gray-500 text-[11px] leading-relaxed">
                          {autoSleepQuality.description}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* ── STEP 6: HIDRASI AIR PUTIH & SIKLUS MINGGUAN ── */}
                {currentStep === 6 && (
                  <div className="space-y-4 animate-fadeIn">
                    {/* 1. Input Air Putih Harian */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-xs font-semibold text-gray-700 flex items-center gap-1.5">
                          <Droplets className="w-3.5 h-3.5 text-cyan-600" />
                          <span>Berapa asupan air putih yang kamu minum hari ini?</span>
                        </label>
                      </div>
                      <p className="text-[11px] text-gray-400 mb-2.5">
                        Pilih total air putih harian untuk mengimbangi sifat diuretik kafein.
                      </p>

                      <div className="grid grid-cols-5 gap-1.5 mb-2.5">
                        {['500', '1000', '1500', '2000', '2000+'].map((option) => (
                          <button
                            key={option}
                            type="button"
                            onClick={() => setWaterIntake(option)}
                            className={`py-2.5 px-1 rounded-xl text-xs font-bold transition-all cursor-pointer text-center ${
                              waterIntake === option
                                ? 'bg-cyan-600 text-white shadow-xs'
                                : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200/80'
                            }`}
                          >
                            <span>{option === '2000+' ? '>2.000' : option}</span>
                            <span className="text-[9px] font-normal block opacity-80">ml</span>
                          </button>
                        ))}
                      </div>

                      {/* Status Hidrasi Info Card */}
                      <div className="bg-gray-50/70 p-3 rounded-xl border border-gray-100 space-y-1 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="text-gray-500 font-medium">Status Hidrasi:</span>
                          <span className={`font-semibold px-2 py-0.5 rounded text-[11px] border ${waterIntakeInfo.badgeClass}`}>
                            {waterIntakeInfo.label}
                          </span>
                        </div>
                        <p className="text-gray-500 text-[11px] leading-relaxed">
                          {waterIntakeInfo.description}
                        </p>
                      </div>
                    </div>

                    {/* 2. Informasi Siklus / Form Mingguan */}
                    {effectiveTrackingDay >= 7 ? (
                      /* ── HARI KE-7: FORM EVALUASI LENGKAP SIKLUS 7 HARI ── */
                      <div className="space-y-3 pt-3 border-t border-gray-100">
                        <div className="bg-indigo-50/70 border border-indigo-100 rounded-xl p-3 flex items-start gap-2.5">
                          <Sparkles className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                          <div className="text-xs">
                            <span className="font-bold text-indigo-950 block">Hari ke-7 Tercapai! Evaluasi Siklus Lengkap Terbuka</span>
                            <span className="text-indigo-700/90 text-[11px] leading-relaxed">
                              Silakan evaluasi akumulasi gangguan tidur yang kamu rasakan selama 1 minggu penuh ini.
                            </span>
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                            Selama 1 minggu ini, seberapa sering kamu merasa sulit tidur setelah minum kopi?
                          </label>
                          <div className="grid grid-cols-2 gap-2">
                            {['Tidak pernah / Nyenyak', 'Agak sulit (1–2 kali)', 'Cukup sering (3–4 kali)', 'Sering (5–6 kali)', 'Hampir setiap hari'].map((option) => (
                              <button
                                key={option}
                                type="button"
                                onClick={() => setSleepDifficulty(option)}
                                className={`p-2.5 text-left rounded-xl text-xs font-medium transition-all flex items-center justify-between cursor-pointer ${
                                  sleepDifficulty === option
                                    ? 'bg-gray-900 text-white shadow-xs'
                                    : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200/70'
                                }`}
                              >
                                <span>{option}</span>
                                {sleepDifficulty === option && (
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                                )}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    ) : (
                      /* ── HARI 1–6: KARTU INFORMASI SIKLUS MINGGUAN ── */
                      <div className="bg-indigo-50/60 p-3.5 rounded-xl border border-indigo-100/80 flex items-start gap-2.5 text-xs">
                        <div className="w-6 h-6 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <Calendar className="w-3.5 h-3.5" />
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-indigo-950">Informasi Siklus 7 Hari</span>
                            <span className="text-[10px] bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-full font-semibold border border-indigo-200">
                              Hari ke-{effectiveTrackingDay}
                            </span>
                          </div>
                          <p className="text-indigo-900/80 text-[11px] leading-relaxed">
                            Pertanyaan <strong>Evaluasi Gangguan Tidur Mingguan</strong> akan otomatis terbuka di langkah ini pada <strong>Hari ke-7</strong> (Sisa {7 - effectiveTrackingDay} hari). Tetap konsisten mencatat hidrasi dan kopimu setiap hari ya!
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* ── STEP 7: KELUHAN & GEJALA ── */}
                {currentStep === 7 && (
                  <div className="space-y-4 animate-fadeIn">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-xs font-semibold text-gray-700">
                          Pengalaman atau keluhan fisik yang dirasakan:
                        </label>
                        <span className="text-[10px] font-medium text-gray-400 bg-gray-100 px-2 py-0.5 rounded">
                          Opsional
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-400 mb-2.5">
                        Pilih gejala cepat atau ceritakan sensasi fisik yang kamu alami.
                      </p>

                      {/* Quick Symptom Chips */}
                      <div className="flex flex-wrap gap-1.5 mb-2.5">
                        {[
                          'Tidak ada keluhan (Biasa saja)',
                          'Sering mengantuk & lemas',
                          'Sakit kepala / pusing ringan',
                          'Sulit fokus & konsentrasi',
                          'Jantung berdebar / cemas'
                        ].map((chip) => (
                          <button
                            key={chip}
                            type="button"
                            onClick={() => {
                              if (chip.includes('Biasa saja')) {
                                setExperience(chip);
                              } else {
                                setExperience((prev) => {
                                  if (!prev || prev.includes('Biasa saja')) return chip;
                                  if (prev.includes(chip)) return prev;
                                  return `${prev}, ${chip}`;
                                });
                              }
                            }}
                            className={`px-2.5 py-1 rounded-lg text-xs transition-all cursor-pointer ${
                              experience.includes(chip)
                                ? 'bg-amber-50 border border-amber-300 text-amber-900 font-semibold'
                                : 'bg-gray-50 border border-gray-200 text-gray-600 hover:bg-gray-100'
                            }`}
                          >
                            + {chip}
                          </button>
                        ))}
                      </div>

                      <textarea
                        value={experience}
                        onChange={(e) => setExperience(e.target.value)}
                        placeholder="Contoh: Saya merasa biasa saja / terkadang mengantuk jika pagi hari belum ngopi..."
                        rows={3}
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs text-gray-900 outline-none focus:border-gray-900 focus:bg-white transition resize-none leading-relaxed"
                      ></textarea>
                    </div>

                    {error && (
                      <div className="p-3 bg-rose-50 text-rose-700 text-xs font-medium rounded-xl border border-rose-200">
                        {error}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Wizard Navigation Footer */}
              <div className="pt-4 border-t border-gray-100 flex items-center gap-2.5 mt-4">
                {currentStep > 1 && (
                  <button
                    type="button"
                    onClick={() => setCurrentStep((prev) => prev - 1)}
                    className="px-4 py-2.5 rounded-xl border border-gray-200 text-gray-700 font-medium text-xs hover:bg-gray-50 transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Kembali</span>
                  </button>
                )}

                {currentStep < totalSteps ? (
                  <button
                    type="button"
                    onClick={handleNextStep}
                    className="flex-1 bg-gray-950 text-white py-2.5 rounded-xl font-semibold text-xs hover:bg-black transition flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                  >
                    <span>Langkah Berikutnya</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="flex-1 bg-emerald-600 text-white py-2.5 rounded-xl font-semibold text-xs hover:bg-emerald-700 transition flex items-center justify-center gap-1.5 shadow-xs disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Memproses Evaluasi...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Simpan & Lihat Hasil</span>
                      </>
                    )}
                  </button>
                )}
              </div>

            </div>
          </div>

        </div>
      </div>
    </DashboardLayout>
  );
}
