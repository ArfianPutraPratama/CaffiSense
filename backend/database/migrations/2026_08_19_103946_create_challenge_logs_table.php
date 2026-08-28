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
        Schema::create('challenge_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->integer('day_number');
            $table->integer('coffee_cups')->nullable();
            $table->time('last_coffee_time')->nullable();
            $table->integer('sleep_duration')->nullable();
            $table->string('sleep_quality')->nullable();
            $table->timestamps();
            
            $table->unique(['user_id', 'day_number']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('challenge_logs');
    }
};
