<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\User;
use Illuminate\Support\Facades\Mail;
use App\Mail\WeeklyReportMail;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class SendWeeklyReports extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'app:send-weekly-reports';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Send weekly email reports to users who have it enabled';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Mulai mengirim Laporan Mingguan...');

        // Cari pengguna yang mengaktifkan opsi laporan mingguan
        $users = User::where('weekly_report_enabled', true)->get();
        $sevenDaysAgo = Carbon::now()->subDays(7);

        foreach ($users as $user) {
            // Ambil assessment milik user ini 7 hari terakhir
            $assessments = DB::table('assessments')
                ->where('user_id', $user->id)
                ->where('created_at', '>=', $sevenDaysAgo)
                ->get();

            // Jika tidak ada data seminggu terakhir, lewati saja
            if ($assessments->isEmpty()) {
                continue;
            }

            // Hitung statistik
            $totalCoffee = $assessments->sum('coffee_cups_per_day');
            
            // Rata-rata kafein
            $avgCaffeine = $assessments->avg('estimated_caffeine_mg');
            
            // Rata-rata tidur
            $avgSleep = $assessments->avg('sleep_duration');

            // Hitung kualitas tidur terbanyak (modus)
            $sleepQualities = $assessments->pluck('sleep_quality')->countBy();
            $majorityQuality = $sleepQualities->sortDesc()->keys()->first() ?? 'Tidak diketahui';

            $stats = [
                'total_coffee' => round($totalCoffee),
                'avg_caffeine' => round($avgCaffeine),
                'avg_sleep' => round($avgSleep, 1),
                'majority_quality' => $majorityQuality
            ];

            // Kirim Email
            try {
                Mail::to($user->email)->send(new WeeklyReportMail($user, $stats));
                $this->info("Berhasil mengirim laporan ke: {$user->email}");
            } catch (\Exception $e) {
                $this->error("Gagal mengirim ke {$user->email}: " . $e->getMessage());
            }
        }

        $this->info('Selesai!');
    }
}
