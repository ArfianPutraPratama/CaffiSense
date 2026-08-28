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
        Schema::create('assessments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->integer('coffee_cups_per_day');
            $table->string('coffee_size')->nullable();
            $table->time('last_coffee_time')->nullable();
            $table->float('estimated_caffeine_mg');
            $table->integer('sleep_duration');
            $table->string('sleep_quality');
            $table->string('sleep_difficulty_frequency')->nullable();
            $table->text('free_text_experience')->nullable();
            $table->integer('drowsiness')->default(0);
            $table->integer('focus_problem')->default(0);
            $table->integer('headache')->default(0);
            $table->integer('fatigue')->default(0);
            $table->integer('ml_prediction')->nullable();
            $table->float('ml_probability')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('assessments');
    }
};
