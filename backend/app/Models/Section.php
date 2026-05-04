<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Section extends Model
{
    use HasFactory;

    protected $fillable = [
        'grade_level_id',
        'section_name',
        'room_id',
        'school_year_id',
        'adviser_id',
    ];

    // Relationship with GradeLevel
    public function gradeLevel()
    {
        return $this->belongsTo(GradeLevel::class, 'grade_level_id');
    }

    // Relationship with Room (based on migration: rooms.id -> sections.room_id)
    public function room()
    {
        return $this->belongsTo(Room::class, 'room_id');
    }

    // Relationship with SchoolYear
    public function schoolYear()
    {
        return $this->belongsTo(SchoolYear::class);
    }

    // Relationship with Teacher (adviser)
    public function adviser()
    {
        return $this->belongsTo(Teacher::class, 'adviser_id');
    }

    // Relationship with Enrollments
    public function enrollments()
    {
        return $this->hasMany(Enrollment::class);
    }

    // Relationship with TeacherAssignments
    public function teacherAssignments()
    {
        return $this->hasMany(TeacherAssignment::class);
    }

    // Get active students count
    public function getActiveStudentsCountAttribute()
    {
        return $this->enrollments()
            ->where('status', 'Active')
            ->count();
    }

    // Get room name with fallback
    public function getRoomNameAttribute()
    {
        return $this->room ? $this->room->room_name : 'No Room Assigned';
    }
}