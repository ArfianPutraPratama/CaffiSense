<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('assessments', function (Blueprint $table) {
            $table->integer('sleep_duration')->nullable()->change();
            $table->string('sleep_quality')->nullable()->change();
            $table->boolean('is_sleep_skipped')->default(false)->after('sleep_quality');
            $table->boolean('is_week_skipped')->default(false)->after('is_sleep_skipped');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('assessments', function (Blueprint $table) {
            $table->integer('sleep_duration')->nullable(false)->change();
            $table->string('sleep_quality')->nullable(false)->change();
            $table->dropColumn(['is_sleep_skipped', 'is_week_skipped']);
        });
    }
};
