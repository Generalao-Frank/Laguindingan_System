<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Enrollment extends Model
{
    use HasFactory;

    protected $fillable = [
        'student_id',
        'section_id',
        'school_year_id',
        'date_enrolled',
        'status',
    ];

    public function student()
    {
        return $this->belongsTo(StudentsInfo::class, 'student_id');
    }

    public function section()
    {
        return $this->belongsTo(Section::class);
    }

    public function schoolYear()
    {
        return $this->belongsTo(SchoolYear::class);
    }
    public function teacher()
{
    return $this->belongsTo(Teacher::class);
}
}