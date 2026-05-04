<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Attendance extends Model
{
    use HasFactory;

     protected $table = 'attendance';

    protected $fillable = [
        'enrollment_id',
        'teacher_id',
        'date',
        'time_in',
        'time_out',
        'status',
        'remarks',
    ];

    protected $casts = [
        'date' => 'date',
        'time_in' => 'datetime',
        'time_out' => 'datetime',
    ];

    public function enrollment()
    {
        return $this->belongsTo(Enrollment::class);
    }

    public function getStudentNameAttribute()
    {
        if (!$this->enrollment || !$this->enrollment->student || !$this->enrollment->student->user) {
            return 'N/A';
        }
        
        $user = $this->enrollment->student->user;
        return $user->last_name . ', ' . $user->first_name;
    }
}