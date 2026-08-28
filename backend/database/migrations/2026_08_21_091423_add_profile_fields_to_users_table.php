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
        Schema::table('users', function (Blueprint $table) {
            $table->string('phone')->nullable()->after('email');
            $table->string('avatar')->nullable()->after('password');
            $table->boolean('notifications_enabled')->default(true)->after('avatar');
            $table->boolean('weekly_report_enabled')->default(true)->after('notifications_enabled');
            $table->string('membership_type')->default('Basic Plan')->after('weekly_report_enabled');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn([
                'phone',
                'avatar',
                'notifications_enabled',
                'weekly_report_enabled',
                'membership_type'
            ]);
        });
    }
};
