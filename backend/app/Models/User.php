<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;  // <-- Dapat may HasApiTokens dito

    protected $fillable = [
        'first_name',
        'middle_name',
        'last_name',
        'gender',
        'suffix',
        'birthdate',
        'address',
        'contact_number',
        'profile_picture',
        'username',
        'email',
        'password',
        'role',
        'fcm_token',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected $casts = [
        'birthdate' => 'date',
        'email_verified_at' => 'datetime',
    ];

    // Relationships
    public function teacher()
    {
        return $this->hasOne(Teacher::class);
    }

    public function studentInfo()
    {
        return $this->hasOne(StudentsInfo::class);
    }

    // Helper methods
    public function isAdmin()
    {
        return $this->role === 'Admin';
    }

    public function isTeacher()
    {
        return $this->role === 'Teacher';
    }

    public function isStudent()
    {
        return $this->role === 'Student';
    }
}