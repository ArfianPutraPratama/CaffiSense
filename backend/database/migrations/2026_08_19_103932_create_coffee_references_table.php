<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('coffee_references', function (Blueprint $table) {
            $table->id();
            $table->string('coffee_name');
            $table->string('fdc_id');
            $table->string('serving_name');
            $table->integer('serving_weight_g');
            $table->integer('serving_volume_ml');
            $table->float('caffeine_mg_per_100g');
            $table->float('caffeine_mg_per_serving');
            $table->string('source');
            $table->string('source_url');
            $table->timestamps();
        });

        // Seed initial USDA data
        DB::table('coffee_references')->insert([
            'coffee_name' => 'Brewed Coffee',
            'fdc_id' => '171890',
            'serving_name' => '1 cup',
            'serving_weight_g' => 237,
            'serving_volume_ml' => 237,
            'caffeine_mg_per_100g' => 40,
            'caffeine_mg_per_serving' => 94.8,
            'source' => 'USDA FoodData Central',
            'source_url' => 'https://fdc.nal.usda.gov/food-details/171890/nutrients',
            'created_at' => now(),
            'updated_at' => now()
        ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('coffee_references');
    }
};
