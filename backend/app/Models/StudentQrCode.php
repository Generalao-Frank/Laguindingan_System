<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class StudentQrCode extends Model
{
    use HasFactory;

    protected $table = 'student_qr_codes';

    protected $fillable = [
        'student_id',
        'qr_data',
    ];

    public function student()
    {
        return $this->belongsTo(StudentsInfo::class, 'student_id');
    }
}