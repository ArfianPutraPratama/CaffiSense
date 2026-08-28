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
            $table->string('exercise_timing')->nullable()->default('tidak_olahraga')->after('last_meal_time');
            $table->integer('exercise_duration_minutes')->nullable()->default(0)->after('exercise_timing');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('assessments', function (Blueprint $table) {
            $table->dropColumn(['exercise_timing', 'exercise_duration_minutes']);
        });
    }
};
