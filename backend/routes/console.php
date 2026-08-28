<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote')->hourly();

// Jadwalkan pengiriman laporan mingguan setiap hari Minggu jam 08:00 pagi
Schedule::command('app:send-weekly-reports')->weeklyOn(0, '08:00');
