<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use App\Models\CoffeeReference;
use App\Models\Assessment;
use App\Models\ChallengeLog;

class ApiController extends Controller
{
    private function mlServiceUrl()
    {
        return env('ML_SERVICE_URL', 'http://127.0.0.1:8001');
    }

    public function health()
    {
        return response()->json(['status' => 'ok', 'message' => 'Laravel Backend is running']);
    }

    public function getCoffeeReference()
    {
        $ref = CoffeeReference::where('coffee_name', 'Brewed Coffee')->first();
        if (!$ref) {
            return response()->json(['error' => 'Reference not found'], 404);
        }
        return response()->json($ref);
    }

    public function storeAssessment(Request $request)
    {
        // Basic validation
        $validated = $request->validate([
            'coffee_cups_per_day' => 'required|integer|min:0|max:20',
            'coffee_size' => 'nullable|string',
            'last_coffee_time' => 'nullable|string',
            'meal_status' => 'nullable|string',
            'last_meal_time' => 'nullable|string',
            'exercise_timing' => 'nullable|string',
            'exercise_duration_minutes' => 'nullable|integer|min:0|max:360',
            'smoking_intensity' => 'nullable|string',
            'assessment_date' => 'nullable|date',
            'water_intake_ml' => 'nullable|integer|min:0|max:10000',
            'sleep_duration' => 'nullable|integer|min:0|max:24',
            'sleep_quality' => 'nullable|string',
            'sleep_difficulty_frequency' => 'nullable|string',
            'free_text_experience' => 'nullable|string|max:1000',
            'age' => 'nullable|integer',
            'gender' => 'nullable|string',
            'is_sleep_skipped' => 'nullable|boolean',
            'is_week_skipped' => 'nullable|boolean'
        ]);

        // 1. Calculate Estimated Caffeine
        $ref = CoffeeReference::where('coffee_name', 'Brewed Coffee')->first();
        $caffeinePerCup = $ref ? $ref->caffeine_mg_per_serving : 94.8;
        $estimatedCaffeine = $validated['coffee_cups_per_day'] * $caffeinePerCup;

        // 2. Default NLP Features
        $nlpFeatures = [
            'drowsiness' => 0,
            'focus_problem' => 0,
            'headache' => 0,
            'fatigue' => 0
        ];

        // Process NLP if free text provided
        if (!empty($validated['free_text_experience'])) {
            try {
                $nlpRes = Http::post($this->mlServiceUrl() . '/nlp/extract', [
                    'free_text_experience' => $validated['free_text_experience']
                ]);
                if ($nlpRes->successful()) {
                    $nlpFeatures = $nlpRes->json();
                }
            } catch (\Exception $e) {
                // Ignore NLP failure for MVP
            }
        }

        // 3. Prepare data for Prediction
        $age = $validated['age'] ?? 25; // Default age if not provided
        $focus_level = $nlpFeatures['focus_problem'] == 1 ? 0.3 : 0.8; // Lower focus level if problem detected
        
        // Map Sleep Quality string to numeric (0-1) for model
        $sq_map = ['Sangat buruk' => 0.1, 'Buruk' => 0.3, 'Cukup' => 0.5, 'Baik' => 0.8, 'Sangat baik' => 1.0];
        $sq_val = !empty($validated['sleep_quality']) && isset($sq_map[$validated['sleep_quality']]) 
            ? $sq_map[$validated['sleep_quality']] 
            : 0.5;

        $time_morning = 0; $time_afternoon = 0; $time_evening = 0;
        if (!empty($validated['last_coffee_time'])) {
            $hour = (int) substr($validated['last_coffee_time'], 0, 2);
            if ($hour >= 5 && $hour < 12) $time_morning = 1;
            else if ($hour >= 12 && $hour < 17) $time_afternoon = 1;
            else $time_evening = 1; // 17-04
        } else {
            $time_morning = 1; // Default
        }

        $gender_f = ($validated['gender'] ?? '') === 'Female' ? 1 : 0;
        $gender_m = ($validated['gender'] ?? '') === 'Male' ? 1 : ($gender_f ? 0 : 1);

        $predictionPayload = [
            'caffeine_mg' => $estimatedCaffeine / 1000.0,
            'age' => $age / 100.0,
            'focus_level' => $focus_level,
            'sleep_quality' => $sq_val,
            'beverage_coffee' => 1,
            'beverage_energy_drink' => 0,
            'beverage_tea' => 0,
            'time_of_day_afternoon' => $time_afternoon,
            'time_of_day_evening' => $time_evening,
            'time_of_day_morning' => $time_morning,
            'gender_female' => $gender_f,
            'gender_male' => $gender_m
        ];

        // 4. Call ML Service
        $mlPrediction = null;
        $mlProbability = null;
        try {
            $predRes = Http::post($this->mlServiceUrl() . '/predict', $predictionPayload);
            if ($predRes->successful()) {
                $mlData = $predRes->json();
                $mlPrediction = $mlData['sleep_impacted'] ?? null;
                $mlProbability = $mlData['probability'] ?? null;
            }
        } catch (\Exception $e) {
            return response()->json(['error' => 'Prediction service is temporarily unavailable. Please try again.'], 503);
        }

        // 5. Save to Database
        $createdAt = !empty($validated['assessment_date'])
            ? \Carbon\Carbon::parse($validated['assessment_date'] . ' ' . ($validated['last_coffee_time'] ?? '12:00:00'))
            : now();

        $waterMl = $validated['water_intake_ml'] ?? 1500;
        $mealStatus = $validated['meal_status'] ?? 'sudah_makan';
        $lastMealTime = $validated['last_meal_time'] ?? '12:30';
        $exerciseTiming = $validated['exercise_timing'] ?? 'tidak_olahraga';
        $exerciseDuration = $validated['exercise_duration_minutes'] ?? 0;
        $smokingIntensity = $validated['smoking_intensity'] ?? 'none';

        $assessment = new Assessment([
            'user_id' => $request->user()?->id ?? null,
            'coffee_cups_per_day' => $validated['coffee_cups_per_day'],
            'coffee_size' => $validated['coffee_size'] ?? 'Medium',
            'last_coffee_time' => $validated['last_coffee_time'],
            'meal_status' => $mealStatus,
            'last_meal_time' => $mealStatus === 'sudah_makan' ? $lastMealTime : null,
            'exercise_timing' => $exerciseTiming,
            'exercise_duration_minutes' => $exerciseTiming !== 'tidak_olahraga' ? $exerciseDuration : 0,
            'smoking_intensity' => $smokingIntensity,
            'estimated_caffeine_mg' => $estimatedCaffeine,
            'water_intake_ml' => $waterMl,
            'sleep_duration' => $validated['sleep_duration'] ?? null,
            'sleep_quality' => $validated['sleep_quality'] ?? null,
            'sleep_difficulty_frequency' => $validated['sleep_difficulty_frequency'] ?? null,
            'is_sleep_skipped' => $validated['is_sleep_skipped'] ?? false,
            'is_week_skipped' => $validated['is_week_skipped'] ?? false,
            'free_text_experience' => $validated['free_text_experience'] ?? null,
            'drowsiness' => $nlpFeatures['drowsiness'],
            'focus_problem' => $nlpFeatures['focus_problem'],
            'headache' => $nlpFeatures['headache'],
            'fatigue' => $nlpFeatures['fatigue'],
            'ml_prediction' => $mlPrediction,
            'ml_probability' => $mlProbability
        ]);
        $assessment->created_at = $createdAt;
        $assessment->save();

        // 6. Gemini AI Analysis
        $aiAnalysis = "Analisis AI tidak tersedia saat ini karena gangguan koneksi.";
        $geminiKey = env('GEMINI_API_KEY');
        if ($geminiKey) {
            $impactText = $mlPrediction == 1 ? 'TINGGI' : 'RENDAH';
            $sleepQualityText = $validated['sleep_quality'] ?? 'Cukup';
            $sleepDiffText = $validated['sleep_difficulty_frequency'] ?? 'Tidak ada keluhan';
            $mealText = $mealStatus === 'sudah_makan' 
                ? "Sudah makan (Jam makan terakhir: {$lastMealTime})" 
                : "Belum makan (Minum kopi dalam kondisi Perut Kosong)";
            
            $exerciseText = $exerciseTiming === 'sebelum_kopi'
                ? "Olahraga SEBELUM kopi (Pre-Workout) selama {$exerciseDuration} menit"
                : ($exerciseTiming === 'sesudah_kopi'
                    ? "Olahraga SESUDAH kopi (Post-Workout) selama {$exerciseDuration} menit"
                    : "Tidak berolahraga hari ini (Metabolisme pasif)");
            
            $smokingText = $smokingIntensity === 'none'
                ? "Tidak merokok (Metabolisme CYP1A2 normal)"
                : "Merokok: {$smokingIntensity} batang/hari (Induksi enzim hati CYP1A2 mempercepat pemecahan kafein hingga 2x lipat, beban vaskular & asam lambung meningkat)";
            
            $prompt = "Sebagai pakar metabolisme klinis, farmakologi enzim CYP1A2, gastroenterologi, dan ritme sirkadian, berikan ulasan komprehensif, edukatif, solutif, dan mudah dipahami untuk seseorang dengan profil konsumsi:\n" .
                "- Kopi: {$validated['coffee_cups_per_day']} cangkir ({$validated['coffee_size']}), jam terakhir: {$validated['last_coffee_time']} (Estimasi " . round($estimatedCaffeine) . " mg kafein)\n" .
                "- Kondisi Perut & Makanan: {$mealText}\n" .
                "- Aktivitas Fisik & Olahraga: {$exerciseText}\n" .
                "- Kebiasaan Rokok / Nikotin: {$smokingText}\n" .
                "- Asupan Air Putih (Hidrasi): {$waterMl} ml/hari\n" .
                "- Durasi & Kualitas Tidur: " . ($validated['sleep_duration'] ?? 7) . " jam ({$sleepQualityText}), Riwayat sulit tidur: {$sleepDiffText}\n" .
                "- Potensi Gangguan Tidur (ML): {$impactText}\n\n" .
                "Berikan ulasanmu dalam 4 bagian menggunakan format Markdown yang rapi (huruf tebal dan bullet points terstruktur):\n" .
                "1. **Analisis Pola Kafein, Makanan, Olahraga & Metabolisme Rokok** (Jelaskan pengaruh kondisi perut ({$mealText}), olahraga ({$exerciseText}), dan nikotin ({$smokingText}) terhadap laju induksi enzim CYP1A2 di hati, iritasi asam lambung HCl, dan hidrasi {$waterMl} ml)\n" .
                "2. **Dampak Sirkadian & Risiko Organ** (Dampak sisa kafein pada sistem saraf pusat/reseptor adenosin, hati, lambung, jantung, dan ritme tidur malam ini)\n" .
                "3. **Statistik Edukasi Risiko Penyakit** (Sebutkan 3 penyakit nyata terkait iritasi lambung/dehidrasi/stimulan/vaskular, misal Dispepsia-GERD/Hipertensi/Insomnia Kronis, beserta estimasi persentase (%) risiko jika kebiasaan ini diteruskan bertahun-tahun. Beri disclaimer ini statistik edukatif umum.)\n" .
                "4. **Solusi, Penanganan Cepat & Rekomendasi Pemulihan**\n" .
                "   - **Saran Preventif & Kebiasaan Terbaik:** Strategi waktu minum, jeda hormon kortisol pagi, dan batasan cut-off jam kopi.\n" .
                "   - **Protokol Penanganan Darurat (Jika Sudah Terlanjur):** Berikan panduan pertolongan pertama jika pengguna terlanjur minum kopi terlalu banyak / di jam malam / saat perut kosong (misal: hidrasi air hangat elektrolit untuk percepat klirens ginjal, camilan penawar asam lambung/kalium seperti pisang/oatmeal, latihan pernapasan lambat 4-7-8 untuk meredakan denyut jantung/anxiety, dan mandi air hangat sebelum tidur).\n" .
                "   - **Langkah Reset Esok Hari:** Cara mengembalikan ritme sirkadian dan metabolisme tubuh.\n\n" .
                "Gunakan gaya bahasa profesional, hangat, suportif, dan mudah dipahami.";
            
            try {
                $geminiRes = Http::timeout(60)->withOptions(['verify' => false])->withHeaders([
                    'Content-Type' => 'application/json',
                ])->post("https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key={$geminiKey}", [
                    'contents' => [
                        ['parts' => [['text' => $prompt]]]
                    ]
                ]);

                if ($geminiRes->successful()) {
                    $aiAnalysis = $geminiRes->json('candidates.0.content.parts.0.text') ?? $aiAnalysis;
                } else {
                    \Log::error('Gemini API Error: ' . $geminiRes->body());
                }
            } catch (\Exception $e) {
                \Log::error('Gemini API Exception: ' . $e->getMessage());
                // Silently fallback
            }
        }

        // Save generated AI analysis directly to database record
        $assessment->update(['ai_analysis' => $aiAnalysis]);

        return response()->json([
            'message' => 'Assessment saved successfully',
            'assessment' => $assessment->fresh(),
            'ai_analysis' => $aiAnalysis
        ], 201);
    }

    public function getAssessment($id)
    {
        $assessment = Assessment::find($id);
        if (!$assessment) {
            return response()->json(['error' => 'Assessment not found'], 404);
        }
        return response()->json($assessment);
    }

    public function getLatestAssessment()
    {
        $latest = Assessment::latest()->first();
        if (!$latest) {
            return response()->json(['assessment' => null, 'message' => 'No assessment found'], 404);
        }

        // If ai_analysis is missing, generate on the fly
        if (empty($latest->ai_analysis)) {
            $geminiKey = env('GEMINI_API_KEY');
            if ($geminiKey) {
                $impactText = $latest->ml_prediction == 1 ? 'TINGGI' : 'RENDAH';
                $prompt = "Sebagai pakar gaya hidup sehat, berikan ulasan komprehensif untuk seseorang yang minum {$latest->coffee_cups_per_day} gelas kopi (estimasi " . round($latest->estimated_caffeine_mg) . " mg kafein/hari) dengan potensi gangguan tidur {$impactText}.\n\nBerikan ulasanmu dalam 4 bagian menggunakan format Markdown:\n1. **Analisis Pola Saat Ini**\n2. **Potensi Risiko Jangka Panjang**\n3. **Statistik Risiko Penyakit (Edukasi)**\n4. **Saran Pemulihan Praktis**";
                try {
                    $geminiRes = Http::timeout(30)->withHeaders(['Content-Type' => 'application/json'])
                        ->post("https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key={$geminiKey}", [
                            'contents' => [['parts' => [['text' => $prompt]]]]
                        ]);
                    if ($geminiRes->successful()) {
                        $text = $geminiRes->json('candidates.0.content.parts.0.text');
                        if ($text) {
                            $latest->update(['ai_analysis' => $text]);
                        }
                    }
                } catch (\Exception $e) {}
            }
        }

        return response()->json(['assessment' => $latest->fresh()]);
    }

    public function getAllAssessments()
    {
        $assessments = Assessment::latest()->get();
        return response()->json(['assessments' => $assessments]);
    }

    public function logChallenge(Request $request)
    {
        $validated = $request->validate([
            'user_id' => 'nullable|integer',
            'day_number' => 'required|integer|min:1|max:7',
            'coffee_cups' => 'required|integer',
            'last_coffee_time' => 'required|string',
            'sleep_duration' => 'required|integer',
            'sleep_quality' => 'required|string'
        ]);

        $log = ChallengeLog::updateOrCreate(
            ['user_id' => $validated['user_id'] ?? null, 'day_number' => $validated['day_number']],
            [
                'coffee_cups' => $validated['coffee_cups'],
                'last_coffee_time' => $validated['last_coffee_time'],
                'sleep_duration' => $validated['sleep_duration'],
                'sleep_quality' => $validated['sleep_quality']
            ]
        );

        return response()->json(['message' => 'Challenge logged', 'log' => $log]);
    }

    public function getChallengeProgress($userId = null)
    {
        $logs = ChallengeLog::where('user_id', $userId)->orderBy('day_number')->get();
        return response()->json(['progress' => $logs]);
    }
}
