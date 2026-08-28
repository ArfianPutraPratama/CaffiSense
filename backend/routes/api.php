<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\ApiController;
use App\Http\Controllers\AuthController;

// Public Auth Routes
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

// Protected Auth Routes
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);
    
    // Profile routes
    Route::put('/profile', [AuthController::class, 'updateProfile']);
    Route::post('/profile/avatar', [AuthController::class, 'uploadAvatar']);
    
    Route::get('/user', function (Request $request) {
        return $request->user();
    });
    
    // Assessment routes that require user ID
    Route::post('/assessment', [ApiController::class, 'storeAssessment']);
    Route::get('/assessments/latest', [ApiController::class, 'getLatestAssessment']);
    Route::get('/assessments', [ApiController::class, 'getAllAssessments']);
});

Route::get('/health', [ApiController::class, 'health']);
Route::get('/coffee-reference', [ApiController::class, 'getCoffeeReference']);
Route::get('/assessment/{id}', [ApiController::class, 'getAssessment']);
Route::post('/challenge/log', [ApiController::class, 'logChallenge']);
Route::get('/challenge/progress/{userId}', [ApiController::class, 'getChallengeProgress']);
