<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Quarter extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'school_year_id',
        'name',
        'start_date',
        'end_date',
        'is_active',
        'is_locked',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'start_date' => 'date',
        'end_date' => 'date',
        'is_active' => 'boolean',
        'is_locked' => 'boolean',
    ];

    /**
     * Get the school year that owns the quarter.
     * 
     * Relationship: Quarter belongs to a School Year
     * Foreign key: quarters.school_year_id -> school_years.id
     */
    public function schoolYear()
    {
        return $this->belongsTo(SchoolYear::class, 'school_year_id');
    }

    /**
     * Get the grades for this quarter.
     * 
     * Relationship: Quarter has many Grades
     */
    public function grades()
    {
        return $this->hasMany(Grade::class, 'quarter_id');
    }

    /**
     * Scope a query to only include active quarters.
     * 
     * @param \Illuminate\Database\Eloquent\Builder $query
     * @return \Illuminate\Database\Eloquent\Builder
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Scope a query to only include locked quarters.
     * 
     * @param \Illuminate\Database\Eloquent\Builder $query
     * @return \Illuminate\Database\Eloquent\Builder
     */
    public function scopeLocked($query)
    {
        return $query->where('is_locked', true);
    }

    /**
     * Scope a query to only include unlocked quarters.
     * 
     * @param \Illuminate\Database\Eloquent\Builder $query
     * @return \Illuminate\Database\Eloquent\Builder
     */
    public function scopeUnlocked($query)
    {
        return $query->where('is_locked', false);
    }

    /**
     * Scope a query to get quarters by school year.
     * 
     * @param \Illuminate\Database\Eloquent\Builder $query
     * @param int $schoolYearId
     * @return \Illuminate\Database\Eloquent\Builder
     */
    public function scopeForSchoolYear($query, $schoolYearId)
    {
        return $query->where('school_year_id', $schoolYearId);
    }

    /**
     * Check if the quarter is currently active based on dates.
     * 
     * @return bool
     */
    public function getIsCurrentlyActiveAttribute()
    {
        $today = now()->startOfDay();
        return $today >= $this->start_date && $today <= $this->end_date;
    }

    /**
     * Get the quarter number (1st, 2nd, 3rd, 4th).
     * 
     * @return string
     */
    public function getQuarterNumberAttribute()
    {
        $numbers = [
            '1st Quarter' => 1,
            '2nd Quarter' => 2,
            '3rd Quarter' => 3,
            '4th Quarter' => 4,
        ];
        
        return $numbers[$this->name] ?? 0;
    }

    /**
     * Get the duration display (e.g., "Jun 3 - Aug 16, 2024").
     * 
     * @return string
     */
    public function getDurationDisplayAttribute()
    {
        if (!$this->start_date || !$this->end_date) {
            return 'N/A';
        }
        
        $start = $this->start_date->format('M d');
        $end = $this->end_date->format('M d, Y');
        
        return "{$start} - {$end}";
    }

    /**
     * Get the status badge color.
     * 
     * @return string
     */
    public function getStatusColorAttribute()
    {
        if ($this->is_locked) {
            return 'gray';
        }
        
        if ($this->is_active) {
            return 'green';
        }
        
        if ($this->is_currently_active) {
            return 'blue';
        }
        
        return 'yellow';
    }

    /**
     * Get the status label.
     * 
     * @return string
     */
    public function getStatusLabelAttribute()
    {
        if ($this->is_locked) {
            return 'Locked';
        }
        
        if ($this->is_active) {
            return 'Active';
        }
        
        if ($this->is_currently_active) {
            return 'Ongoing';
        }
        
        return 'Inactive';
    }

    /**
     * Check if grades can be edited for this quarter.
     * 
     * @return bool
     */
    public function canEditGrades()
    {
        return !$this->is_locked && ($this->is_active || $this->is_currently_active);
    }

    /**
     * Get the total number of students with grades for this quarter.
     * 
     * @return int
     */
    public function getStudentsWithGradesCountAttribute()
    {
        return $this->grades()
            ->distinct('enrollment_id')
            ->count('enrollment_id');
    }

    /**
     * Get the average grade for this quarter across all subjects.
     * 
     * @return float|null
     */
    public function getAverageGradeAttribute()
    {
        $grades = $this->grades()
            ->whereNotNull('final_grade')
            ->get();
            
        if ($grades->isEmpty()) {
            return null;
        }
        
        $average = $grades->avg('final_grade');
        return round($average, 2);
    }

    /**
     * Get the passing rate for this quarter.
     * 
     * @return float|null
     */
    public function getPassingRateAttribute()
    {
        $grades = $this->grades()
            ->whereNotNull('final_grade')
            ->get();
            
        if ($grades->isEmpty()) {
            return null;
        }
        
        $passingCount = $grades->filter(function($grade) {
            return $grade->final_grade >= 75;
        })->count();
        
        return round(($passingCount / $grades->count()) * 100, 2);
    }

    /**
     * Lock the quarter to prevent further grade edits.
     * 
     * @return bool
     */
    public function lock()
    {
        return $this->update(['is_locked' => true]);
    }

    /**
     * Unlock the quarter to allow grade edits.
     * 
     * @return bool
     */
    public function unlock()
    {
        return $this->update(['is_locked' => false]);
    }

    /**
     * Activate the quarter.
     * 
     * @return bool
     */
    public function activate()
    {
        // Deactivate all other quarters in the same school year
        if ($this->schoolYear) {
            Quarter::where('school_year_id', $this->school_year_id)
                ->where('id', '!=', $this->id)
                ->update(['is_active' => false]);
        }
        
        return $this->update(['is_active' => true]);
    }

    /**
     * Deactivate the quarter.
     * 
     * @return bool
     */
    public function deactivate()
    {
        return $this->update(['is_active' => false]);
    }
}