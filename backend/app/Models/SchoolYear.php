<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SchoolYear extends Model
{
    use HasFactory;

    protected $fillable = [
        'year_start',
        'year_end',
        'is_active',
    ];

   public function quarters()
{
    return $this->hasMany(Quarter::class, 'school_year_id');
}

public function getActiveQuarterAttribute()
{
    return $this->quarters()->where('is_active', true)->first();
}

public function getCurrentQuarterAttribute()
{
    $today = now()->startOfDay();
    return $this->quarters()
        ->where('start_date', '<=', $today)
        ->where('end_date', '>=', $today)
        ->first();
}

    public function sections()
    {
        return $this->hasMany(Section::class);
    }

    public function enrollments()
    {
        return $this->hasMany(Enrollment::class);
    }
}