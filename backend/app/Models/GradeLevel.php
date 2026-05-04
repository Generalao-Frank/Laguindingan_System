<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class GradeLevel extends Model
{
    use HasFactory;

    protected $fillable = [
        'grade_level',
    ];

   public function sections()
{
    return $this->hasMany(Section::class, 'grade_level_id');
}

   public function subjects()
{
    return $this->hasMany(Subject::class, 'grade_level_id');
}
}