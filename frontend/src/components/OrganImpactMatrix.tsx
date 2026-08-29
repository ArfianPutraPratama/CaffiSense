import React, { useState, useMemo } from 'react';
import { 
  Brain, Heart, Activity, Droplets, AlertTriangle, 
  CheckCircle2, ChevronRight, ShieldAlert,
  Zap, ShieldCheck, Sparkles, Eye, Info, Box,
  Waves, Dumbbell, Wind, GlassWater
} from 'lucide-react';
import Heart3DCanvas from './Heart3DCanvas';
import Stomach3DCanvas from './Stomach3DCanvas';
import Brain3DCanvas from './Brain3DCanvas';
import Kidney3DCanvas from './Kidney3DCanvas';
import Liver3DCanvas from './Liver3DCanvas';
import Intestine3DCanvas from './Intestine3DCanvas';
import Muscle3DCanvas from './Muscle3DCanvas';
import Bladder3DCanvas from './Bladder3DCanvas';
import Lungs3DCanvas from './Lungs3DCanvas';
import Eye3DCanvas from './Eye3DCanvas';
import Adrenal3DCanvas from './Adrenal3DCanvas';

interface OrganImpactProps {
  caffeineMg?: number;
  lastCoffeeTime?: string;
  waterIntakeMl?: number;
  sleepDuration?: number;
  mealStatus?: string;
  exerciseTiming?: string;
  exerciseDurationMinutes?: number;
  smokingIntensity?: string;
  freeTextExperience?: string;
  aiAnalysis?: string;
}

interface OrganData {
  id: string;
  name: string;
  subName: string;
  icon: React.ReactNode;
  imageSrc: string;
  status: 'safe' | 'warning' | 'danger';
  loadPercentage: number;
  statusLabel: string;
  shortDesc: string;
  directEffect: string;
  longTermRisk: string;
  recoveryAction: string;
  position: { top: string; left: string }; // Exact center of the organ on the anatomy image
  labelAlign: 'left' | 'right';
}

export default function OrganImpactMatrix({
  caffeineMg = 0,
  lastCoffeeTime = '15:00',
  waterIntakeMl = 1500,
  sleepDuration = 7,
  mealStatus = 'sudah_makan',
  exerciseTiming = 'tidak_olahraga',
  exerciseDurationMinutes = 0,
  smokingIntensity = 'none',
  freeTextExperience = '',
  aiAnalysis = ''
}: OrganImpactProps) {
  const [selectedOrgan, setSelectedOrgan] = useState<OrganData | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [hoveredOrganId, setHoveredOrganId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'2d' | '3d'>('2d');

  const openDrawer = (organ: OrganData) => {
    setSelectedOrgan(organ);
    setViewMode('2d');
    // Trigger transition on next frame
    requestAnimationFrame(() => {
      setIsDrawerOpen(true);
    });
  };

  const closeDrawer = () => {
    setIsDrawerOpen(false);
    setTimeout(() => {
      setSelectedOrgan(null);
    }, 320);
  };

  // Close drawer on ESC key
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && selectedOrgan) {
        closeDrawer();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedOrgan]);

  // Analyze text and metrics to determine organ impacts
  const organList = useMemo<OrganData[]>(() => {
    // Extract symptom keywords ONLY from user explicit complaints (freeTextExperience), NOT from educational aiAnalysis text
    const userText = (freeTextExperience || '').toLowerCase();
    const isNormalOrNoComplaint = userText.includes('tidak ada keluhan') || userText.includes('biasa saja') || userText.includes('sehat') || userText.trim() === '';

    const hasBrainSymptoms = !isNormalOrNoComplaint && (userText.includes('sakit kepala') || userText.includes('pusing') || userText.includes('migrain') || userText.includes('insomnia') || userText.includes('sulit tidur') || userText.includes('sulit fokus'));
    const hasHeartSymptoms = !isNormalOrNoComplaint && (userText.includes('debar') || userText.includes('berdebar') || userText.includes('jantung berdebar') || userText.includes('palpitasi') || userText.includes('tekanan darah tinggi'));
    const hasStomachSymptoms = !isNormalOrNoComplaint && (userText.includes('perih') || userText.includes('mual') || userText.includes('maag') || userText.includes('asam lambung') || userText.includes('gerd') || userText.includes('kembung') || userText.includes('nyeri ulu hati'));
    const hasIntestineSymptoms = !isNormalOrNoComplaint && (userText.includes('diare') || userText.includes('mulas') || userText.includes('sembelit') || userText.includes('bab cair'));
    const hasMuscleSymptoms = !isNormalOrNoComplaint && (userText.includes('tremor') || userText.includes('gemetar') || userText.includes('kram') || userText.includes('kedutan otot'));
    const hasBladderSymptoms = !isNormalOrNoComplaint && (userText.includes('beser') || userText.includes('sering kencing') || userText.includes('kebelet'));
    const hasLungsSymptoms = !isNormalOrNoComplaint && (userText.includes('sesak') || userText.includes('ngos-ngosan') || userText.includes('asma') || userText.includes('napas berat'));
    const hasEyeSymptoms = !isNormalOrNoComplaint && (userText.includes('kedutan kelopak') || userText.includes('mata lelah') || userText.includes('pandangan kabur'));
    const hasAdrenalSymptoms = !isNormalOrNoComplaint && (userText.includes('panik') || userText.includes('gelisah') || userText.includes('keringat dingin') || userText.includes('anxiety'));
    
    // 1. Brain & Nervous System
    const [h] = (lastCoffeeTime || '12:00').split(':').map(Number);
    const isLateCoffee = h >= 16; // 4 PM or later
    const isNightCoffee = h >= 20; // 8 PM or later (larut malam)
    
    let brainLoad = Math.min(100, Math.round((caffeineMg / 400) * 80));
    if (isNightCoffee && caffeineMg > 0) brainLoad = Math.min(100, brainLoad + 30);
    else if (isLateCoffee && caffeineMg > 0) brainLoad = Math.min(100, brainLoad + 20);
    if (sleepDuration <= 5 && caffeineMg > 0) brainLoad = Math.min(100, brainLoad + 20); // Kurang tidur memperlambat klirens adenosin
    if (hasBrainSymptoms) brainLoad = Math.max(75, brainLoad + 25);
    if (caffeineMg === 0 && !hasBrainSymptoms) brainLoad = 0;

    const brainStatus: 'safe' | 'warning' | 'danger' = 
      brainLoad >= 70 ? 'danger' : brainLoad >= 40 ? 'warning' : 'safe';

    // 2. Heart & Cardiovascular
    let heartLoad = Math.min(100, Math.round((caffeineMg / 400) * 75));
    if (mealStatus === 'belum_makan' && caffeineMg > 0) heartLoad = Math.min(100, heartLoad + 12);
    if (smokingIntensity !== 'none' && caffeineMg > 0) heartLoad = Math.min(100, heartLoad + 15);
    if (isNightCoffee && caffeineMg > 0) heartLoad = Math.min(100, heartLoad + 15);
    if (hasHeartSymptoms) heartLoad = Math.max(75, heartLoad + 30);
    if (caffeineMg === 0 && !hasHeartSymptoms) heartLoad = 0;

    const heartStatus: 'safe' | 'warning' | 'danger' = 
      heartLoad >= 70 ? 'danger' : heartLoad >= 40 ? 'warning' : 'safe';

    // 3. Stomach & Gastrointestinal
    let stomachLoad = Math.min(100, Math.round((caffeineMg / 400) * 65));
    if (mealStatus === 'belum_makan' && caffeineMg > 0) {
      stomachLoad = Math.min(100, stomachLoad + 30); // Fasting gastric HCl acid spike
    }
    if (smokingIntensity !== 'none' && caffeineMg > 0) {
      stomachLoad = Math.min(100, stomachLoad + 12); // Nicotine relaxes lower esophageal sphincter
    }
    if (hasStomachSymptoms) stomachLoad = Math.max(80, stomachLoad + 30);
    if (caffeineMg === 0 && !hasStomachSymptoms) stomachLoad = 0;

    const stomachStatus: 'safe' | 'warning' | 'danger' = 
      stomachLoad >= 70 ? 'danger' : stomachLoad >= 35 ? 'warning' : 'safe';

    // 4. Kidneys & Fluid Balance
    let kidneyLoad = Math.min(100, Math.round((caffeineMg / 400) * 60));
    if (waterIntakeMl < 1000) kidneyLoad = Math.min(100, kidneyLoad + 25);
    else if (waterIntakeMl >= 2000) kidneyLoad = Math.max(10, kidneyLoad - 15);
    if (sleepDuration <= 5 && caffeineMg > 0) kidneyLoad = Math.min(100, kidneyLoad + 15);
    if (caffeineMg === 0 && waterIntakeMl >= 1500) kidneyLoad = 0;
    const kidneyStatus: 'safe' | 'warning' | 'danger' = 
      kidneyLoad >= 70 ? 'danger' : kidneyLoad >= 40 ? 'warning' : 'safe';

    // 5. Liver & Hepatic Metabolism (CYP1A2 Enzyme Induction)
    let liverLoad = Math.min(100, Math.round((caffeineMg / 400) * 70));
    if (smokingIntensity !== 'none') {
      liverLoad = Math.min(100, liverLoad + 20); // Hepatic CYP1A2 hyper-induction
    }
    if (caffeineMg === 0) liverLoad = smokingIntensity !== 'none' ? 25 : 0;
    const liverStatus: 'safe' | 'warning' | 'danger' = 
      liverLoad >= 70 ? 'danger' : liverLoad >= 40 ? 'warning' : 'safe';

    // 6. Intestine (Usus)
    let intestineLoad = Math.min(100, Math.round((caffeineMg / 400) * 50));
    if (waterIntakeMl < 1000 && caffeineMg > 0) intestineLoad = Math.min(100, intestineLoad + 20); // Dehidrasi mengganggu motilitas & mukosa usus
    if (caffeineMg >= 300) intestineLoad = Math.min(100, intestineLoad + 15); // Dosis tinggi memicu spasme peristaltik
    if (hasIntestineSymptoms) intestineLoad = Math.max(75, intestineLoad + 30);
    if (caffeineMg === 0 && !hasIntestineSymptoms) intestineLoad = 0;
    const intestineStatus: 'safe' | 'warning' | 'danger' = intestineLoad >= 70 ? 'danger' : intestineLoad >= 40 ? 'warning' : 'safe';

    // 7. Muscle (Otot)
    let muscleLoad = Math.min(100, Math.round((caffeineMg / 400) * 45));
    if (waterIntakeMl < 1000 && caffeineMg > 0) muscleLoad = Math.min(100, muscleLoad + 25); // Deplesi cairan & elektrolit memicu kram/tremor
    if (sleepDuration <= 5 && caffeineMg > 0) muscleLoad = Math.min(100, muscleLoad + 20); // Kegagalan fase deep sleep untuk pemulihan otot
    if (exerciseTiming === 'sebelum_kopi' && exerciseDurationMinutes >= 30) {
      muscleLoad = Math.max(10, muscleLoad - 15); // Pre-workout improves muscular glycogen mobilization
    }
    if (hasMuscleSymptoms) muscleLoad = Math.max(75, muscleLoad + 30);
    if (caffeineMg === 0 && !hasMuscleSymptoms) muscleLoad = 0;
    const muscleStatus: 'safe' | 'warning' | 'danger' = muscleLoad >= 70 ? 'danger' : muscleLoad >= 40 ? 'warning' : 'safe';

    // 8. Bladder (Kandung Kemih)
    let bladderLoad = Math.min(100, Math.round((caffeineMg / 400) * 50));
    if (waterIntakeMl < 1000 && caffeineMg > 0) bladderLoad = Math.min(100, bladderLoad + 15); // Konsentrasi asam urin tinggi
    if (isNightCoffee && caffeineMg > 150) bladderLoad = Math.min(100, bladderLoad + 30); // Nokturia parah (terbangun kencing di jam tidur)
    else if (isLateCoffee && caffeineMg > 150) bladderLoad = Math.min(100, bladderLoad + 15);
    if (hasBladderSymptoms) bladderLoad = Math.max(75, bladderLoad + 25);
    if (caffeineMg === 0 && !hasBladderSymptoms) bladderLoad = 0;
    const bladderStatus: 'safe' | 'warning' | 'danger' = bladderLoad >= 70 ? 'danger' : bladderLoad >= 40 ? 'warning' : 'safe';

    // 9. Lungs (Paru-Paru)
    let lungsLoad = Math.min(100, Math.round((caffeineMg / 400) * 40));
    if (exerciseTiming !== 'tidak_olahraga' && exerciseDurationMinutes >= 30) {
      lungsLoad = Math.max(10, lungsLoad - 10); // Aerobic conditioning benefits
    }
    if (smokingIntensity === '1-5') lungsLoad = Math.min(100, lungsLoad + 25);
    else if (smokingIntensity === '6-10') lungsLoad = Math.min(100, lungsLoad + 45);
    else if (smokingIntensity === '>10') lungsLoad = Math.min(100, lungsLoad + 65);
    
    if (hasLungsSymptoms) lungsLoad = Math.max(75, lungsLoad + 30);
    if (caffeineMg === 0 && smokingIntensity === 'none' && !hasLungsSymptoms) lungsLoad = 0;
    const lungsStatus: 'safe' | 'warning' | 'danger' = lungsLoad >= 70 ? 'danger' : lungsLoad >= 40 ? 'warning' : 'safe';

    // 10. Eye (Mata)
    let eyeLoad = Math.min(100, Math.round((caffeineMg / 400) * 35));
    if (waterIntakeMl < 1000 && caffeineMg > 0) eyeLoad = Math.min(100, eyeLoad + 25); // Mata kering (Dry Eye Syndrome) akibat dehidrasi
    if (sleepDuration <= 5) eyeLoad = Math.min(100, eyeLoad + 25); // Kelelahan otot siliaris/astenopia & tekanan intraokular
    if (isNightCoffee && caffeineMg > 0) eyeLoad = Math.min(100, eyeLoad + 15); // Midriasis pupil larut malam
    if (hasEyeSymptoms) eyeLoad = Math.max(65, eyeLoad + 30);
    if (caffeineMg === 0 && !hasEyeSymptoms && sleepDuration >= 7 && waterIntakeMl >= 1500) eyeLoad = 0;
    const eyeStatus: 'safe' | 'warning' | 'danger' = eyeLoad >= 70 ? 'danger' : eyeLoad >= 40 ? 'warning' : 'safe';

    // 11. Adrenal Glands (Kelenjar Adrenal)
    let adrenalLoad = Math.min(100, Math.round((caffeineMg / 400) * 70));
    if (mealStatus === 'belum_makan' && caffeineMg > 0) adrenalLoad = Math.min(100, adrenalLoad + 10);
    if (sleepDuration <= 5 && caffeineMg > 0) adrenalLoad = Math.min(100, adrenalLoad + 15); // Disregulasi sumbu HPA & lonjakan kortisol malam
    if (isNightCoffee && caffeineMg > 0) adrenalLoad = Math.min(100, adrenalLoad + 15);
    if (hasAdrenalSymptoms) adrenalLoad = Math.max(75, adrenalLoad + 30);
    if (caffeineMg === 0 && !hasAdrenalSymptoms) adrenalLoad = 0;
    const adrenalStatus: 'safe' | 'warning' | 'danger' = adrenalLoad >= 70 ? 'danger' : adrenalLoad >= 40 ? 'warning' : 'safe';

    return [
      {
        id: 'brain',
        name: 'Otak & Sistem Saraf',
        subName: 'Reseptor Adenosin & Ritme Tidur',
        icon: <Brain className="w-5 h-5 text-indigo-600" />,
        imageSrc: '/organs/brain.jpg',
        status: brainStatus,
        loadPercentage: brainLoad,
        statusLabel: brainStatus === 'danger' ? 'Beban Tinggi' : brainStatus === 'warning' ? 'Waspada' : 'Optimal',
        shortDesc: brainStatus === 'danger' 
          ? 'Reseptor adenosin terblokir total, menghambat transisi gelombang tidur dalam (Deep Sleep).' 
          : brainStatus === 'warning' 
          ? 'Tingkat kewaspadaan meningkat, potensi menggeser jam kantuk alami.' 
          : 'Aktivitas neurotransmitter dalam ritme sirkadian yang stabil.',
        directEffect: 'Kafein mengikat reseptor adenosin A1 dan A2A di otak, menipu tubuh agar tidak merasakan sinyal kantuk.',
        longTermRisk: 'Jika terjadi terus-menerus: Desensitisasi reseptor (toleransi meningkat), kecemasan kronis, dan fragmentasi siklus tidur REM.',
        recoveryAction: 'Terapkan cut-off minum kopi maks jam 14:00 dan lakukan relaksasi pernapasan 5 menit sebelum tidur.',
        position: { top: '7.8%', left: '50.5%' },
        labelAlign: 'right'
      },
      {
        id: 'heart',
        name: 'Jantung & Sirkulasi',
        subName: 'Laju Denyut & Hormon Adrenalin',
        icon: <Heart className="w-5 h-5 text-rose-600" />,
        imageSrc: '/organs/heart.jpg',
        status: heartStatus,
        loadPercentage: heartLoad,
        statusLabel: heartStatus === 'danger' ? 'Hiperstimulasi' : heartStatus === 'warning' ? 'Stimulasi Sedang' : 'Normal',
        shortDesc: heartStatus === 'danger'
          ? 'Peningkatan pelepasan epinefrin memicu denyut nadi berlebih (palpitasi).'
          : heartStatus === 'warning'
          ? 'Tekanan sistolik mengalami kenaikan sementara yang wajar.'
          : 'Laju kardiovaskular stabil tanpa beban kontraksi berlebih.',
        directEffect: 'Merangsang kelenjar adrenal memproduksi adrenalin, mempercepat pompa ventrikel jantung.',
        longTermRisk: 'Fluktuasi tekanan darah tinggi mendadak jika dikonsumsi berlebih pada kondisi stres/kelelahan.',
        recoveryAction: 'Minum 1-2 gelas air mineral suhu ruang untuk membantu pengenceran zat stimulan dalam darah.',
        position: { top: '31.5%', left: '51.5%' },
        labelAlign: 'right'
      },
      {
        id: 'stomach',
        name: 'Lambung & Pencernaan',
        subName: 'Sekresi Asam Hidroklorida (HCl)',
        icon: <Activity className="w-5 h-5 text-amber-600" />,
        imageSrc: '/organs/stomach.jpg',
        status: stomachStatus,
        loadPercentage: stomachLoad,
        statusLabel: stomachStatus === 'danger' ? 'Risiko Iritasi' : stomachStatus === 'warning' ? 'Sekresi Naik' : 'Aman',
        shortDesc: stomachStatus === 'danger'
          ? 'Asam lambung terstimulasi kuat, berisiko refluks atau rasa perih ulu hati.'
          : stomachStatus === 'warning'
          ? 'Motilitas usus meningkat, sekresi getah lambung sedikit naik.'
          : 'Dinding mukosa lambung terlindungi dengan baik.',
        directEffect: 'Asam klorogenat dan kafein memicu sel parietal lambung memproduksi asam lambung secara agresif.',
        longTermRisk: 'Erosi mukosa lambung, risiko gastritis berulang, dan gangguan penyerapan nutrisi esensial.',
        recoveryAction: 'Hindari minum kopi saat perut kosong; beri jeda makan ringan berprotein/serat sebelum ngopi.',
        position: { top: '41.5%', left: '55.5%' },
        labelAlign: 'right'
      },
      {
        id: 'kidney',
        name: 'Ginjal & Keseimbangan Cairan',
        subName: 'Filtrasi Glomerulus & Elektrolit',
        icon: <Droplets className="w-5 h-5 text-blue-600" />,
        imageSrc: '/organs/kidney.jpg',
        status: kidneyStatus,
        loadPercentage: kidneyLoad,
        statusLabel: kidneyStatus === 'danger' ? 'Dehidrasi Ringan' : kidneyStatus === 'warning' ? 'Efek Diuretik' : 'Terhidrasi',
        shortDesc: kidneyStatus === 'danger'
          ? 'Ekskresi cairan meningkat cepat, perlu kompensasi hidrasi segera.'
          : kidneyStatus === 'warning'
          ? 'Peningkatan frekuensi buang air kecil ringan.'
          : 'Keseimbangan cairan dan elektrolit tubuh terjaga baik.',
        directEffect: 'Kafein menghambat reabsorpsi natrium di tubulus ginjal, meningkatkan volume urin (efek diuresis).',
        longTermRisk: 'Kehilangan mineral mikro (magnesium & kalsium) jika tidak diimbangi hidrasi yang cukup.',
        recoveryAction: 'Gunakan aturan kompensasi 1:2 (setiap 1 cangkir kopi, minum 2 gelas air mineral tambahan).',
        position: { top: '48.5%', left: '42.5%' },
        labelAlign: 'left'
      },
      {
        id: 'liver',
        name: 'Hati & Metabolisme Enzim',
        subName: 'Sitokrom P450 (CYP1A2)',
        icon: <ShieldCheck className="w-5 h-5 text-emerald-600" />,
        imageSrc: '/organs/liver.jpg',
        status: liverStatus,
        loadPercentage: liverLoad,
        statusLabel: liverStatus === 'danger' ? 'Beban Enzimatik Tinggi' : liverStatus === 'warning' ? 'Metabolisme Aktif' : 'Optimal',
        shortDesc: liverStatus === 'danger'
          ? 'Beban kerja enzim hepatik CYP1A2 sangat tinggi untuk mengeliminasi stimulan.'
          : liverStatus === 'warning'
          ? 'Enzim CYP1A2 di hati aktif memecah metabolit kafein secara teratur.'
          : 'Fungsi detoksifikasi dan pemecahan metabolit hepar berjalan optimal.',
        directEffect: 'Enzim hepar memetabolisme kafein menjadi metabolit aktif dengan laju waktu paruh rata-rata 5 jam.',
        longTermRisk: 'Overload metabolisme jika dikombinasikan dengan kurang tidur kronis atau konsumsi obat tertentu.',
        recoveryAction: 'Beri jeda istirahat metabolisme hepar dengan tidak mengonsumsi kafein berulang dalam waktu singkat.',
        position: { top: '38.0%', left: '44.0%' },
        labelAlign: 'left'
      },
      {
        id: 'intestine',
        name: 'Usus & Pencernaan Bawah',
        subName: 'Motilitas & Refleks Gastrokolik',
        icon: <Waves className="w-5 h-5 text-teal-600" />,
        imageSrc: '/organs/intestine.jpg',
        status: intestineStatus,
        loadPercentage: intestineLoad,
        statusLabel: intestineStatus === 'danger' ? 'Hiperaktif' : intestineStatus === 'warning' ? 'Motilitas Naik' : 'Normal',
        shortDesc: intestineStatus === 'danger'
          ? 'Motilitas kolon hiperaktif, berisiko memicu mulas atau gangguan pencernaan.'
          : intestineStatus === 'warning'
          ? 'Stimulasi peristaltik usus ringan, mempercepat transit makanan.'
          : 'Peristaltik usus dan penyerapan nutrisi berjalan normal.',
        directEffect: 'Memicu pelepasan hormon gastrin dan kolesistokinin yang menyebabkan kontraksi usus.',
        longTermRisk: 'Jika sensitif, dapat memicu kram perut, diare, atau memperburuk gejala IBS (Irritable Bowel Syndrome).',
        recoveryAction: 'Perbanyak konsumsi serat larut air dan hidrasi yang cukup untuk menormalkan konsistensi feses.',
        position: { top: '55.0%', left: '50.0%' },
        labelAlign: 'right'
      },
      {
        id: 'muscle',
        name: 'Sistem Otot & Saraf Motorik',
        subName: 'Pelepasan Kalsium Seluler',
        icon: <Dumbbell className="w-5 h-5 text-orange-600" />,
        imageSrc: '/organs/muscle.jpg', 
        status: muscleStatus,
        loadPercentage: muscleLoad,
        statusLabel: muscleStatus === 'danger' ? 'Tremor / Kelelahan' : muscleStatus === 'warning' ? 'Tegang' : 'Rileks',
        shortDesc: muscleStatus === 'danger'
          ? 'Fluks kalsium sarkoplasma tinggi memicu ketegangan otot atau tremor ringan.'
          : muscleStatus === 'warning'
          ? 'Kontraktilitas serat otot sedikit meningkat untuk kesiapan aktivitas.'
          : 'Tonus otot dalam keadaan rileks dan fleksibel.',
        directEffect: 'Memfasilitasi pelepasan kalsium dari retikulum sarkoplasma di dalam serat otot.',
        longTermRisk: 'Ketegangan otot kronis, kedutan (fasciculation), dan kelelahan adrenal yang merembet ke kelemahan otot.',
        recoveryAction: 'Lakukan peregangan ringan dan cukupi asupan kalium/magnesium dari buah-buahan (misal: pisang).',
        position: { top: '25.0%', left: '70.0%' },
        labelAlign: 'right'
      },
      {
        id: 'bladder',
        name: 'Kandung Kemih',
        subName: 'Otot Detrusor',
        icon: <GlassWater className="w-5 h-5 text-cyan-600" />,
        imageSrc: '/organs/bladder.jpg',
        status: bladderStatus,
        loadPercentage: bladderLoad,
        statusLabel: bladderStatus === 'danger' ? 'Iritasi' : bladderStatus === 'warning' ? 'Sensitif' : 'Normal',
        shortDesc: bladderStatus === 'danger'
          ? 'Kontraksi otot detrusor sering, memicu urgensi berkemih berulang.'
          : bladderStatus === 'warning'
          ? 'Peningkatan volume filtrasi kemih ringan.'
          : 'Kapasitas dan tonus otot kandung kemih dalam batas normal.',
        directEffect: 'Kafein merangsang otot detrusor, menyebabkan kontraksi urgensi saluran kemih.',
        longTermRisk: 'Overactive bladder (OAB) jika dikonsumsi berlebih setiap hari.',
        recoveryAction: 'Banyak minum air putih untuk mengencerkan konsentrasi urin di kandung kemih.',
        position: { top: '65.0%', left: '50.0%' },
        labelAlign: 'left'
      },
      {
        id: 'lungs',
        name: 'Paru-Paru',
        subName: 'Sistem Pernapasan',
        icon: <Wind className="w-5 h-5 text-sky-600" />,
        imageSrc: '/organs/lungs.jpg',
        status: lungsStatus,
        loadPercentage: lungsLoad,
        statusLabel: lungsStatus === 'danger' ? 'Napas Pendek' : lungsStatus === 'warning' ? 'Hiperventilasi' : 'Normal',
        shortDesc: lungsStatus === 'danger'
          ? 'Hiperventilasi atau napas memendek akibat stimulasi stimulan berlebih.'
          : lungsStatus === 'warning'
          ? 'Laju pernapasan sedikit terstimulasi namun masih dalam batas aman.'
          : 'Kapasitas dan laju pernapasan stabil dalam kondisi relaksasi optimal.',
        directEffect: 'Mirip teofilin, dapat melebarkan jalan napas namun memicu napas pendek saat panik.',
        longTermRisk: 'Ketegangan otot pernapasan sekunder akibat kecemasan/anxiety terinduksi.',
        recoveryAction: 'Latih pernapasan perut (diaphragmatic breathing) 4-7-8 untuk meredakan detak jantung.',
        position: { top: '25.0%', left: '42.0%' },
        labelAlign: 'left'
      },
      {
        id: 'eye',
        name: 'Mata',
        subName: 'Tekanan Intraokular',
        icon: <Eye className="w-5 h-5 text-indigo-400" />,
        imageSrc: '/organs/eye.jpg',
        status: eyeStatus,
        loadPercentage: eyeLoad,
        statusLabel: eyeStatus === 'danger' ? 'Tegang' : eyeStatus === 'warning' ? 'Kedutan' : 'Normal',
        shortDesc: eyeStatus === 'danger'
          ? 'Tekanan intraokular naik sesaat atau otot mikro kelopak mata berkedut.'
          : eyeStatus === 'warning'
          ? 'Refleks pupil dan daya akomodasi mata sedikit lebih peka.'
          : 'Tekanan cairan bola mata dan fokus penglihatan rileks & jernih.',
        directEffect: 'Dapat meningkatkan tekanan intraokular sementara dan memicu kedutan kelopak.',
        longTermRisk: 'Risiko bagi penderita glaukoma karena fluktuasi tekanan cairan mata.',
        recoveryAction: 'Istirahatkan mata dari layar (rule 20-20-20) dan kompres kelopak mata yang berkedut.',
        position: { top: '4.0%', left: '54.0%' },
        labelAlign: 'right'
      },
      {
        id: 'adrenal',
        name: 'Kelenjar Adrenal',
        subName: 'Produksi Hormon Stres',
        icon: <Zap className="w-5 h-5 text-yellow-600" />,
        imageSrc: '/organs/adrenal.jpg',
        status: adrenalStatus,
        loadPercentage: adrenalLoad,
        statusLabel: adrenalStatus === 'danger' ? 'Fight/Flight' : adrenalStatus === 'warning' ? 'Waspada' : 'Stabil',
        shortDesc: adrenalStatus === 'danger'
          ? 'Sekresi hormon stres (epinefrin & kortisol) berlebih memicu respons fight-or-flight.'
          : adrenalStatus === 'warning'
          ? 'Pelepasan adrenalin terkontrol meningkatkan kewaspadaan wajar.'
          : 'Keseimbangan hormon stres (kortisol) stabil dan tidak terbebani.',
        directEffect: 'Kelenjar adrenal terus dipaksa memproduksi kortisol dan epinefrin tanpa ancaman fisik nyata.',
        longTermRisk: 'Kelelahan adrenal (adrenal fatigue), kecemasan kronis, dan gangguan ritme sirkadian total.',
        recoveryAction: 'Minum suplemen adaptogen (seperti Ashwagandha) atau L-Theanine untuk menyeimbangkan stimulasi.',
        position: { top: '46.0%', left: '54.0%' },
        labelAlign: 'right'
      }
    ];
  }, [caffeineMg, lastCoffeeTime, freeTextExperience, aiAnalysis]);

  const activeOrgan = useMemo(() => {
    if (hoveredOrganId) {
      return organList.find(o => o.id === hoveredOrganId) || null;
    }
    return null;
  }, [hoveredOrganId, organList]);

  return (
    <div className="bg-white rounded-2xl p-6 sm:p-7 shadow-xs border border-gray-200/80 space-y-6">
      
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
              Pemetaan Respons Organ
            </span>
          </div>
          <h3 className="text-xl font-bold text-gray-900 tracking-tight">
            Analisis Beban Fisiologis Tubuh
          </h3>
          <p className="text-xs text-gray-500 font-medium mt-0.5">
            Estimasi pengaruh metabolik pada organ utama dari asupan <strong className="text-gray-800">{caffeineMg} mg kafein</strong> hari ini
          </p>
        </div>

        {/* Global Summary Badge */}
        <div className="flex items-center gap-2">
          {organList.some(o => o.status === 'danger') ? (
            <div className="flex items-center gap-1.5 bg-rose-50 text-rose-700 border border-rose-200 px-3.5 py-1.5 rounded-full text-xs font-bold shadow-2xs">
              <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
              <span>Perlu Pemulihan</span>
            </div>
          ) : organList.some(o => o.status === 'warning') ? (
            <div className="flex items-center gap-1.5 bg-amber-50 text-amber-800 border border-amber-200 px-3.5 py-1.5 rounded-full text-xs font-bold shadow-2xs">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Beban Moderat</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200 px-3.5 py-1.5 rounded-full text-xs font-bold shadow-2xs">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Semua Organ Optimal</span>
            </div>
          )}
        </div>
      </div>

      {/* Main Content Layout: Left (Clean White 2D Anatomy Image + Glowing Hotspots) | Right (Organ Cards) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* ─── LEFT: REALISTIC ANATOMICAL HUMAN BODY VISUALIZER (PRECISELY PINPOINTED) ─── */}
        <div className="lg:col-span-5 bg-white rounded-3xl p-5 sm:p-6 border border-gray-200/80 flex flex-col items-center justify-between relative shadow-xs min-h-[540px] lg:sticky lg:top-24">
          
          {/* Top Visualizer Status */}
          <div className="w-full flex items-center justify-between z-10">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              <span className="text-[11px] font-extrabold text-emerald-700 uppercase tracking-widest bg-emerald-50 border border-emerald-200/80 px-2.5 py-0.5 rounded-full">
                Anatomi Medis 2D
              </span>
            </div>
            <span className="text-[10px] text-gray-500 font-semibold bg-gray-50 border border-gray-200/80 px-2.5 py-0.5 rounded-full flex items-center gap-1">
              <Info className="w-3 h-3 text-indigo-500" />
              Klik Titik Organ
            </span>
          </div>

          {/* Clean Anatomy Image Container with Pixel-Perfect Anchored Hotspots */}
          <div className="relative w-full max-w-[280px] h-[430px] my-auto flex items-center justify-center select-none">
            {/* High-Detail Anatomy Medical Illustration on White */}
            <img
              src="/anatomy_diagram.jpg"
              alt="Anatomi Tubuh Manusia"
              className="w-full h-full object-contain rounded-2xl pointer-events-none"
            />

            {/* Interactive Hotspots Anchored Exactly at the Organ Centers */}
            {organList.map((organ) => {
              const isHovered = hoveredOrganId === organ.id;
              const isDanger = organ.status === 'danger';
              const isWarning = organ.status === 'warning';

              const ringBg = isDanger
                ? 'bg-red-500 ring-red-300'
                : isWarning
                ? 'bg-amber-500 ring-amber-300'
                : 'bg-emerald-500 ring-emerald-300';

              const badgeStyle = isDanger
                ? 'bg-red-50/95 text-red-700 border-red-200 shadow-red-100'
                : isWarning
                ? 'bg-amber-50/95 text-amber-800 border-amber-200 shadow-amber-100'
                : 'bg-emerald-50/95 text-emerald-800 border-emerald-200 shadow-emerald-100';

              const isLeftAligned = organ.labelAlign === 'left';

              return (
                <div
                  key={organ.id}
                  style={{ top: organ.position.top, left: organ.position.left }}
                  className="absolute -translate-x-1/2 -translate-y-1/2 z-20 cursor-pointer group"
                  onMouseEnter={() => setHoveredOrganId(organ.id)}
                  onMouseLeave={() => setHoveredOrganId(null)}
                  onClick={() => setSelectedOrgan(organ)}
                >
                  {/* Pulsing Ping Aura Ring */}
                  {(isDanger || isHovered) && (
                    <span className={`absolute -inset-2 rounded-full opacity-75 animate-ping pointer-events-none ${isDanger ? 'bg-red-400' : 'bg-indigo-400'}`} />
                  )}

                  {/* Exact Center Hotspot Button */}
                  <button
                    type="button"
                    title={`Klik untuk melihat detail ${organ.name}`}
                    onClick={() => openDrawer(organ)}
                    className={`relative w-4 h-4 rounded-full border-2 border-white flex items-center justify-center transition-all duration-300 shadow-md ${ringBg} ${
                      isHovered ? 'scale-125 ring-4 ring-indigo-300' : 'scale-100 ring-2'
                    }`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-white shadow-xs" />
                  </button>

                  {/* Floating Target Label Chip - Positioned Outside Without Moving the Dot */}
                  <div
                    onClick={() => openDrawer(organ)}
                    className={`absolute top-1/2 -translate-y-1/2 whitespace-nowrap hidden sm:flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border text-[10px] font-extrabold shadow-md backdrop-blur-md transition-all ${
                      isLeftAligned
                        ? 'right-full mr-2.5'
                        : 'left-full ml-2.5'
                    } ${badgeStyle} ${isHovered ? 'scale-110 ring-2 ring-indigo-300 shadow-lg' : 'opacity-90'}`}
                  >
                    <span>{organ.name.split(' ')[0]}</span>
                    <span className="font-black">({organ.loadPercentage}%)</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Bottom Interactive Guide */}
          <div className="w-full text-center z-10 pt-2 border-t border-gray-100">
            {activeOrgan ? (
              <p className="text-xs text-indigo-700 font-bold flex items-center justify-center gap-1.5 animate-fadeIn">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>{activeOrgan.name}: <strong className="text-gray-900">{activeOrgan.statusLabel} ({activeOrgan.loadPercentage}%)</strong></span>
              </p>
            ) : (
              <p className="text-[11px] text-gray-500 font-medium flex items-center justify-center gap-1.5">
                <Eye className="w-3.5 h-3.5 text-gray-400" />
                <span>Klik titik organ pada tubuh untuk detail klinis</span>
              </p>
            )}
          </div>

        </div>

        {/* ─── RIGHT: 4 ORGAN CARDS ─── */}
        <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {organList.map((organ) => {
            const isDanger = organ.status === 'danger';
            const isWarning = organ.status === 'warning';
            const isHovered = hoveredOrganId === organ.id;

            return (
              <div
                key={organ.id}
                onMouseEnter={() => setHoveredOrganId(organ.id)}
                onMouseLeave={() => setHoveredOrganId(null)}
                onClick={() => openDrawer(organ)}
                className={`rounded-2xl p-5 border transition-all cursor-pointer group flex flex-col justify-between relative overflow-hidden ${
                  isHovered
                    ? 'ring-2 ring-indigo-500 shadow-lg scale-[1.02]'
                    : ''
                } ${
                  isDanger
                    ? 'bg-gradient-to-br from-red-50/40 via-white to-white border-red-200/90 hover:border-red-300'
                    : isWarning
                    ? 'bg-gradient-to-br from-amber-50/40 via-white to-white border-amber-200/90 hover:border-amber-300'
                    : 'bg-white border-gray-200/80 hover:border-gray-300'
                }`}
              >
                <div>
                  {/* Card Top Row */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-2xs border ${
                        isDanger
                          ? 'bg-red-50 border-red-200'
                          : isWarning
                          ? 'bg-amber-50 border-amber-200'
                          : 'bg-indigo-50 border-indigo-100'
                      }`}>
                        {organ.icon}
                      </div>
                      <div>
                        <h4 className="text-sm font-black text-gray-900 group-hover:text-indigo-600 transition-colors">
                          {organ.name}
                        </h4>
                        <span className="text-[10px] text-gray-400 font-semibold block truncate max-w-[130px]">
                          {organ.subName}
                        </span>
                      </div>
                    </div>

                    <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border shrink-0 ${
                      isDanger
                        ? 'bg-red-50 text-red-700 border-red-200'
                        : isWarning
                        ? 'bg-amber-50 text-amber-800 border-amber-200'
                        : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    }`}>
                      {organ.statusLabel}
                    </span>
                  </div>

                  {/* Short Description */}
                  <p className="text-xs text-gray-600 leading-relaxed line-clamp-2 mt-1">
                    {organ.shortDesc}
                  </p>
                </div>

                {/* Progress Load Bar */}
                <div className="mt-4 pt-3 border-t border-gray-100/80">
                  <div className="flex items-center justify-between text-[10px] font-bold mb-1.5 text-gray-500">
                    <span>Indikator Beban Kafein</span>
                    <span className={isDanger ? 'text-red-600 font-black' : isWarning ? 'text-amber-700 font-black' : 'text-gray-700 font-black'}>
                      {organ.loadPercentage}%
                    </span>
                  </div>
                  <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${
                        isDanger
                          ? 'bg-red-500'
                          : isWarning
                          ? 'bg-amber-500'
                          : 'bg-emerald-500'
                      }`}
                      style={{ width: `${Math.max(organ.loadPercentage, 5)}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between mt-2.5 text-[11px] text-gray-400 group-hover:text-indigo-600 font-semibold transition-colors">
                    <span>Lihat mekanisme & tips</span>
                    <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

      </div>

      {/* Smooth Slide-Over Drawer for Organ Details */}
      {selectedOrgan && (
        <div 
          className="fixed inset-0 z-50 overflow-hidden"
          aria-labelledby="slide-over-title" 
          role="dialog" 
          aria-modal="true"
        >
          {/* Backdrop Blur Overlay with Smooth Fade Transition */}
          <div 
            className={`fixed inset-0 bg-black/35 backdrop-blur-xs transition-opacity duration-300 ease-in-out cursor-pointer ${
              isDrawerOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
            }`}
            onClick={closeDrawer}
          />

          <div className="fixed inset-y-0 right-0 max-w-full flex pl-0 sm:pl-10">
            <div 
              className={`w-screen max-w-full sm:max-w-2xl lg:max-w-3xl bg-white shadow-2xl sm:border-l border-gray-200/80 flex flex-col h-full transform transition-transform duration-300 ease-out ${
                isDrawerOpen ? 'translate-x-0' : 'translate-x-full'
              }`}
              onClick={(e) => e.stopPropagation()}
            >
              
              {/* Drawer Top Header (Sticky) */}
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-white/95 backdrop-blur-xs sticky top-0 z-10">
                <div className="flex items-center gap-2.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  <div>
                    <h3 className="text-base font-black text-gray-950 tracking-tight" id="slide-over-title">
                      Inspektur Fisiologis Organ 2D & 3D
                    </h3>
                    <p className="text-[11px] text-gray-400 font-medium">
                      Eksplorasi anatomi dan analisis respon jaringan tubuh terhadap kafein
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={closeDrawer}
                  className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-900 font-bold text-xs flex items-center justify-center transition cursor-pointer"
                  title="Tutup Panel (ESC)"
                >
                  ✕
                </button>
              </div>

              {/* Quick Organ Switcher Pills */}
              <div className="px-6 py-2.5 bg-gray-50/80 border-b border-gray-100 flex items-center gap-2 overflow-x-auto text-xs shrink-0">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider shrink-0 mr-1">
                  Pilih Organ:
                </span>
                {organList.map((org) => {
                  const isSelected = org.id === selectedOrgan.id;
                  return (
                    <button
                      key={org.id}
                      type="button"
                      onClick={() => setSelectedOrgan(org)}
                      className={`px-3.5 py-1.5 rounded-xl font-bold text-[11px] transition cursor-pointer flex items-center gap-1.5 shrink-0 ${
                        isSelected
                          ? 'bg-gray-950 text-white shadow-xs'
                          : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200/80'
                      }`}
                    >
                      <span className="w-2 h-2 rounded-full" style={{
                        background: org.status === 'danger' ? '#ef4444' : org.status === 'warning' ? '#f59e0b' : '#10b981'
                      }} />
                      <span>{org.name.split('&')[0].trim()}</span>
                    </button>
                  );
                })}
              </div>

              {/* Scrollable Drawer Content (2-Column Grid: Left 2D/3D Showcase | Right Clinical Cards) */}
              <div className="flex-1 overflow-y-auto p-6 sm:p-7">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                  
                  {/* ─── LEFT COLUMN: 2D/3D VISUALIZER & TARGET ORGAN CONTROLS (lg:col-span-6) ─── */}
                  <div className="lg:col-span-6 space-y-4">
                    
                    {/* Spacious 2D / 3D Canvas Stage */}
                    <div className="w-full h-64 sm:h-70 rounded-3xl bg-gray-50/80 border border-gray-200/90 shadow-2xs relative overflow-hidden flex items-center justify-center p-2.5 group">
                      {selectedOrgan.id === 'heart' && viewMode === '3d' ? (
                        <Heart3DCanvas 
                          bpm={selectedOrgan.status === 'danger' ? 96 : 74}
                          className="w-full h-full"
                        />
                      ) : selectedOrgan.id === 'stomach' && viewMode === '3d' ? (
                        <Stomach3DCanvas 
                          acidStimulationLevel={selectedOrgan.status}
                          className="w-full h-full"
                        />
                      ) : selectedOrgan.id === 'brain' && viewMode === '3d' ? (
                        <Brain3DCanvas 
                          className="w-full h-full"
                        />
                      ) : selectedOrgan.id === 'kidney' && viewMode === '3d' ? (
                        <Kidney3DCanvas 
                          className="w-full h-full"
                        />
                      ) : selectedOrgan.id === 'liver' && viewMode === '3d' ? (
                        <Liver3DCanvas 
                          className="w-full h-full"
                        />
                      ) : selectedOrgan.id === 'intestine' && viewMode === '3d' ? (
                        <Intestine3DCanvas 
                          className="w-full h-full"
                        />
                        ) : selectedOrgan.id === 'muscle' && viewMode === '3d' ? (
                          <Muscle3DCanvas 
                            className="w-full h-full"
                          />
                        ) : selectedOrgan.id === 'bladder' && viewMode === '3d' ? (
                          <Bladder3DCanvas 
                            className="w-full h-full"
                          />
                        ) : selectedOrgan.id === 'lungs' && viewMode === '3d' ? (
                          <Lungs3DCanvas 
                            className="w-full h-full"
                          />
                        ) : selectedOrgan.id === 'eye' && viewMode === '3d' ? (
                          <Eye3DCanvas 
                            className="w-full h-full"
                          />
                        ) : selectedOrgan.id === 'adrenal' && viewMode === '3d' ? (
                          <Adrenal3DCanvas 
                            className="w-full h-full"
                          />
                        ) : (
                          <img
                            src={selectedOrgan.imageSrc}
                            alt={selectedOrgan.name}
                            className="w-full h-full max-h-56 object-contain transition-transform duration-500 group-hover:scale-105"
                          />
                        )}

                      {/* Top-Left Stage Badge */}
                      <div className="absolute top-3.5 left-3.5 z-10 pointer-events-none">
                        {['heart', 'stomach', 'brain', 'kidney', 'liver', 'intestine', 'muscle', 'bladder', 'lungs', 'eye', 'adrenal'].includes(selectedOrgan.id) && viewMode === '3d' ? (
                          <span className={`text-[10px] font-extrabold backdrop-blur-xs border px-3 py-1 rounded-full shadow-2xs flex items-center gap-1.5 ${
                            selectedOrgan.id === 'heart' 
                              ? 'text-rose-700 bg-rose-50/95 border-rose-200/90' 
                              : selectedOrgan.id === 'brain'
                              ? 'text-indigo-700 bg-indigo-50/95 border-indigo-200/90'
                              : selectedOrgan.id === 'kidney' || selectedOrgan.id === 'bladder'
                              ? 'text-blue-700 bg-blue-50/95 border-blue-200/90'
                              : selectedOrgan.id === 'liver'
                              ? 'text-emerald-700 bg-emerald-50/95 border-emerald-200/90'
                              : selectedOrgan.id === 'intestine'
                              ? 'text-teal-700 bg-teal-50/95 border-teal-200/90'
                              : selectedOrgan.id === 'muscle'
                              ? 'text-orange-700 bg-orange-50/95 border-orange-200/90'
                              : selectedOrgan.id === 'lungs'
                              ? 'text-sky-700 bg-sky-50/95 border-sky-200/90'
                              : selectedOrgan.id === 'eye'
                              ? 'text-indigo-700 bg-indigo-50/95 border-indigo-200/90'
                              : selectedOrgan.id === 'adrenal'
                              ? 'text-yellow-700 bg-yellow-50/95 border-yellow-200/90'
                              : 'text-amber-700 bg-amber-50/95 border-amber-200/90'
                          }`}>
                            <span className={`w-2 h-2 rounded-full animate-ping ${
                              selectedOrgan.id === 'heart' ? 'bg-rose-500' : selectedOrgan.id === 'brain' ? 'bg-indigo-500' : (selectedOrgan.id === 'kidney' || selectedOrgan.id === 'bladder') ? 'bg-blue-500' : selectedOrgan.id === 'liver' ? 'bg-emerald-500' : selectedOrgan.id === 'intestine' ? 'bg-teal-500' : selectedOrgan.id === 'muscle' ? 'bg-orange-500' : selectedOrgan.id === 'lungs' ? 'bg-sky-500' : selectedOrgan.id === 'eye' ? 'bg-indigo-500' : selectedOrgan.id === 'adrenal' ? 'bg-yellow-500' : 'bg-amber-500'
                            }`} />
                            <span>Model 3D Aktif</span>
                          </span>
                        ) : (
                          <span className="text-[10px] font-extrabold text-gray-700 bg-white/95 backdrop-blur-xs border border-gray-200/90 px-3 py-1 rounded-full shadow-2xs">
                            Ilustrasi Medis 2D
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Organ Title & Mode Toggle Bar Under the Image */}
                    <div className="bg-gray-50/70 rounded-2xl p-4 border border-gray-200/80 space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-0.5">
                            Target Organ Terpilih
                          </span>
                          <h4 className="text-base font-black text-gray-950 leading-tight">
                            {selectedOrgan.name}
                          </h4>
                          <p className="text-xs text-gray-500 font-medium mt-0.5">
                            {selectedOrgan.subName}
                          </p>
                        </div>

                        <span className={`text-[11px] font-extrabold px-3 py-1 rounded-full border shadow-2xs self-start sm:self-center ${
                          selectedOrgan.status === 'danger'
                            ? 'bg-rose-50 text-rose-700 border-rose-200'
                            : selectedOrgan.status === 'warning'
                            ? 'bg-amber-50 text-amber-800 border-amber-200'
                            : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        }`}>
                          {selectedOrgan.statusLabel} ({selectedOrgan.loadPercentage}%)
                        </span>
                      </div>

                      {/* 2D / 3D Mode Toggle */}
                      {['heart', 'stomach', 'brain', 'kidney', 'liver', 'intestine', 'muscle', 'bladder', 'lungs', 'eye', 'adrenal'].includes(selectedOrgan.id) && (
                        <div className="pt-2 border-t border-gray-200/60 flex items-center justify-between">
                          <span className="text-[11px] font-bold text-gray-500">Tampilan Visual:</span>
                          <div className="flex items-center p-1 bg-gray-200/80 rounded-xl text-xs font-extrabold shadow-2xs">
                            <button
                              type="button"
                              onClick={() => setViewMode('2d')}
                              className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                                viewMode === '2d'
                                  ? 'bg-white text-gray-900 shadow-2xs'
                                  : 'text-gray-600 hover:text-gray-900'
                              }`}
                            >
                              2D Gambar
                            </button>
                            <button
                              type="button"
                              onClick={() => setViewMode('3d')}
                              className={`px-3 py-1 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                                viewMode === '3d'
                                  ? selectedOrgan.id === 'heart'
                                    ? 'bg-rose-600 text-white shadow-2xs'
                                    : selectedOrgan.id === 'brain'
                                    ? 'bg-indigo-600 text-white shadow-2xs'
                                    : selectedOrgan.id === 'kidney'
                                    ? 'bg-blue-600 text-white shadow-2xs'
                                    : selectedOrgan.id === 'liver'
                                    ? 'bg-emerald-600 text-white shadow-2xs'
                                    : selectedOrgan.id === 'intestine'
                                    ? 'bg-teal-600 text-white shadow-2xs'
                                    : selectedOrgan.id === 'muscle'
                                    ? 'bg-orange-600 text-white shadow-2xs'
                                    : 'bg-amber-600 text-white shadow-2xs'
                                  : 'text-gray-600 hover:text-gray-900'
                              }`}
                            >
                              <Box className="w-3.5 h-3.5" />
                              <span>3D Interaktif</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                  </div>

                  {/* ─── RIGHT COLUMN: 3 STRUCTURED MEDICAL ACTION CARDS (lg:col-span-6) ─── */}
                  <div className="lg:col-span-6 space-y-3.5">
                    
                    <div className="flex items-center gap-2 pb-1">
                      <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                      <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                        Hasil Evaluasi Farmakologi
                      </h4>
                    </div>

                    {/* Point 1: Direct Effect */}
                    <div className="bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100/80 space-y-2 shadow-2xs">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
                          <Zap className="w-4 h-4" />
                        </div>
                        <strong className="text-indigo-950 font-bold text-xs uppercase tracking-wider">
                          Mekanisme Kerja Langsung
                        </strong>
                      </div>
                      <p className="text-gray-700 text-xs leading-relaxed pl-9">
                        {selectedOrgan.directEffect}
                      </p>
                    </div>

                    {/* Point 2: Long-term Risk */}
                    <div className="bg-rose-50/40 p-4 rounded-2xl border border-rose-100/80 space-y-2 shadow-2xs">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
                          <AlertTriangle className="w-4 h-4" />
                        </div>
                        <strong className="text-rose-950 font-bold text-xs uppercase tracking-wider">
                          Potensi Risiko Jangka Panjang
                        </strong>
                      </div>
                      <p className="text-gray-700 text-xs leading-relaxed pl-9">
                        {selectedOrgan.longTermRisk}
                      </p>
                    </div>

                    {/* Point 3: Clinical Recovery Action */}
                    <div className="bg-emerald-50/60 p-4 rounded-2xl border border-emerald-200/80 space-y-2 shadow-2xs">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                          <CheckCircle2 className="w-4 h-4" />
                        </div>
                        <strong className="text-emerald-950 font-bold text-xs uppercase tracking-wider">
                          Solusi Pemulihan Praktis
                        </strong>
                      </div>
                      <p className="text-gray-800 font-medium text-xs leading-relaxed pl-9">
                        {selectedOrgan.recoveryAction}
                      </p>
                    </div>

                  </div>

                </div>
              </div>

              {/* Drawer Bottom Footer (Sticky) */}
              <div className="p-4 px-7 bg-white border-t border-gray-100 sticky bottom-0 z-10 flex items-center justify-between gap-3">
                <span className="text-[11px] text-gray-400">
                  Tekan <kbd className="font-mono bg-gray-100 px-1.5 py-0.5 rounded border border-gray-200 text-gray-600">ESC</kbd> atau klik di luar untuk menutup
                </span>
                <button
                  type="button"
                  onClick={closeDrawer}
                  className="bg-gray-950 text-white px-6 py-2.5 rounded-full font-bold text-xs hover:bg-black transition shadow-xs cursor-pointer"
                >
                  Tutup Panel
                </button>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
}
