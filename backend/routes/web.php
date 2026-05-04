<?php

use App\Http\Controllers\Auth\LoginController;
use App\Http\Controllers\Admin\DashboardController as AdminDashboard;
use App\Http\Controllers\Teacher\DashboardController as TeacherDashboard;
use App\Http\Controllers\Student\DashboardController as StudentDashboard;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Auth;  // <-- ADD THIS

// Guest routes (not logged in)
Route::middleware('guest')->group(function () {
    Route::get('/login', [LoginController::class, 'showLoginForm'])->name('login');
    Route::post('/login', [LoginController::class, 'login']);
});

// Authenticated routes
Route::middleware('auth')->group(function () {
    Route::post('/logout', [LoginController::class, 'logout'])->name('logout');
    
    // ADMIN ONLY - Teachers and Students cannot access
    Route::middleware(['role:Admin'])->prefix('admin')->name('admin.')->group(function () {
        Route::get('/dashboard', [AdminDashboard::class, 'index'])->name('dashboard');
    });
    
    // TEACHER ONLY - Admins and Students cannot access
    Route::middleware(['role:Teacher'])->prefix('teacher')->name('teacher.')->group(function () {
        Route::get('/dashboard', [TeacherDashboard::class, 'index'])->name('dashboard');
    });
    
    // STUDENT ONLY - Admins and Teachers cannot access
    Route::middleware(['role:Student'])->prefix('student')->name('student.')->group(function () {
        Route::get('/dashboard', [StudentDashboard::class, 'index'])->name('dashboard');
    });
});

// Default redirect - FIXED VERSION
Route::get('/', function () {
    // Use Auth facade instead of auth() helper
    if (Auth::check()) {  // <-- FIXED
        $user = Auth::user();  // <-- FIXED
        if ($user->role === 'Admin') {
            return redirect('/admin/dashboard');
        }
        if ($user->role === 'Teacher') {
            return redirect('/teacher/dashboard');
        }
        if ($user->role === 'Student') {
            return redirect('/student/dashboard');
        }
    }
    return redirect('/login');
});