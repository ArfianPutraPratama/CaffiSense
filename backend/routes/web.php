<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return view('welcome');
});

// Fallback to safely serve public storage files (avatars, etc.)
Route::get('/storage/{path}', function ($path) {
    if (!\Illuminate\Support\Facades\Storage::disk('public')->exists($path)) {
        abort(404);
    }
    return \Illuminate\Support\Facades\Storage::disk('public')->response($path);
})->where('path', '.*');
