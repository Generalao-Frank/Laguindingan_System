<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Grade extends Model
{
    use HasFactory;

    /**
     * The table associated with the model.
     *
     * @var string
     */
    protected $table = 'grades';

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'enrollment_id',
        'subject_id',
        'quarter_id',
        'written_works',
        'performance_tasks',
        'quarterly_assessment',
        'final_grade',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'written_works' => 'decimal:2',
        'performance_tasks' => 'decimal:2',
        'quarterly_assessment' => 'decimal:2',
        'final_grade' => 'integer',
    ];

    /**
     * Get the enrollment that owns the grade.
     * 
     * Relationship: Grade belongs to an Enrollment
     * Foreign key: grades.enrollment_id -> enrollments.id
     */
    public function enrollment()
    {
        return $this->belongsTo(Enrollment::class, 'enrollment_id');
    }

    /**
     * Get the subject that owns the grade.
     * 
     * Relationship: Grade belongs to a Subject
     * Foreign key: grades.subject_id -> subjects.id
     */
    public function subject()
    {
        return $this->belongsTo(Subject::class, 'subject_id');
    }

    /**
     * Get the quarter that owns the grade.
     * 
     * Relationship: Grade belongs to a Quarter
     * Foreign key: grades.quarter_id -> quarters.id
     */
    public function quarter()
    {
        return $this->belongsTo(Quarter::class, 'quarter_id');
    }

    /**
     * Get the student through enrollment.
     * 
     * @return \App\Models\User|null
     */
    public function getStudentAttribute()
    {
        return $this->enrollment ? $this->enrollment->student->user : null;
    }

    /**
     * Get the student name.
     * 
     * @return string
     */
    public function getStudentNameAttribute()
    {
        if (!$this->enrollment || !$this->enrollment->student || !$this->enrollment->student->user) {
            return 'N/A';
        }
        
        $user = $this->enrollment->student->user;
        return $user->last_name . ', ' . $user->first_name . ' ' . $user->middle_name;
    }

    /**
     * Get the grade level and section.
     * 
     * @return string
     */
    public function getGradeSectionAttribute()
    {
        if (!$this->enrollment || !$this->enrollment->section) {
            return 'N/A';
        }
        
        $section = $this->enrollment->section;
        $gradeDisplay = $section->gradeLevel 
            ? ($section->gradeLevel->grade_level == 0 ? 'Kinder' : 'Grade ' . $section->gradeLevel->grade_level)
            : 'N/A';
        
        return $gradeDisplay . ' - ' . $section->section_name;
    }

    /**
     * Calculate the final grade based on DepEd grading system.
     * 
     * DepEd Grading System:
     * - Written Works: 20-40% (depends on subject)
     * - Performance Tasks: 40-60% (depends on subject)
     * - Quarterly Assessment: 20%
     * 
     * For elementary (Grades 1-6):
     * - Written Works: 30%
     * - Performance Tasks: 50%
     * - Quarterly Assessment: 20%
     * 
     * @return float
     */
    public function calculateFinalGrade()
    {
        // Default weights for elementary (Grades 1-6)
        $wwWeight = 0.30;  // 30%
        $ptWeight = 0.50;  // 50%
        $qaWeight = 0.20;  // 20%
        
        $finalGrade = ($this->written_works * $wwWeight) +
                      ($this->performance_tasks * $ptWeight) +
                      ($this->quarterly_assessment * $qaWeight);
        
        return round($finalGrade, 0);
    }

    /**
     * Automatically calculate and set final grade before saving.
     */
    protected static function booted()
    {
        static::saving(function ($grade) {
            if ($grade->written_works && $grade->performance_tasks && $grade->quarterly_assessment) {
                $grade->final_grade = $grade->calculateFinalGrade();
            }
        });
    }

    /**
     * Get the passing status.
     * 
     * @return bool
     */
    public function getIsPassingAttribute()
    {
        return $this->final_grade >= 75;
    }

    /**
     * Get the passing status label.
     * 
     * @return string
     */
    public function getPassingStatusAttribute()
    {
        return $this->is_passing ? 'Passed' : 'Failed';
    }

    /**
     * Get the passing status color.
     * 
     * @return string
     */
    public function getPassingColorAttribute()
    {
        if ($this->final_grade >= 90) return 'green';
        if ($this->final_grade >= 85) return 'emerald';
        if ($this->final_grade >= 80) return 'blue';
        if ($this->final_grade >= 75) return 'indigo';
        return 'red';
    }

    /**
     * Get the grade remark.
     * 
     * @return string
     */
    public function getRemarkAttribute()
    {
        if ($this->final_grade >= 90) return 'Outstanding';
        if ($this->final_grade >= 85) return 'Very Satisfactory';
        if ($this->final_grade >= 80) return 'Satisfactory';
        if ($this->final_grade >= 75) return 'Fairly Satisfactory';
        return 'Did Not Meet Expectations';
    }

    /**
     * Scope a query to only include grades for a specific subject.
     * 
     * @param \Illuminate\Database\Eloquent\Builder $query
     * @param int $subjectId
     * @return \Illuminate\Database\Eloquent\Builder
     */
    public function scopeForSubject($query, $subjectId)
    {
        return $query->where('subject_id', $subjectId);
    }

    /**
     * Scope a query to only include grades for a specific quarter.
     * 
     * @param \Illuminate\Database\Eloquent\Builder $query
     * @param int $quarterId
     * @return \Illuminate\Database\Eloquent\Builder
     */
    public function scopeForQuarter($query, $quarterId)
    {
        return $query->where('quarter_id', $quarterId);
    }

    /**
     * Scope a query to only include grades for a specific enrollment.
     * 
     * @param \Illuminate\Database\Eloquent\Builder $query
     * @param int $enrollmentId
     * @return \Illuminate\Database\Eloquent\Builder
     */
    public function scopeForEnrollment($query, $enrollmentId)
    {
        return $query->where('enrollment_id', $enrollmentId);
    }

    /**
     * Scope a query to only include passing grades.
     * 
     * @param \Illuminate\Database\Eloquent\Builder $query
     * @return \Illuminate\Database\Eloquent\Builder
     */
    public function scopePassing($query)
    {
        return $query->where('final_grade', '>=', 75);
    }

    /**
     * Scope a query to only include failing grades.
     * 
     * @param \Illuminate\Database\Eloquent\Builder $query
     * @return \Illuminate\Database\Eloquent\Builder
     */
    public function scopeFailing($query)
    {
        return $query->where('final_grade', '<', 75);
    }

    /**
     * Get the average grade for a subject across all students in a quarter.
     * 
     * @param int $subjectId
     * @param int $quarterId
     * @return float|null
     */
    public static function getSubjectAverage($subjectId, $quarterId)
    {
        $grades = self::where('subject_id', $subjectId)
            ->where('quarter_id', $quarterId)
            ->whereNotNull('final_grade')
            ->get();
            
        if ($grades->isEmpty()) {
            return null;
        }
        
        return round($grades->avg('final_grade'), 2);
    }

    /**
     * Get the passing rate for a subject in a quarter.
     * 
     * @param int $subjectId
     * @param int $quarterId
     * @return float|null
     */
    public static function getSubjectPassingRate($subjectId, $quarterId)
    {
        $grades = self::where('subject_id', $subjectId)
            ->where('quarter_id', $quarterId)
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
     * Get the student's average grade for a specific quarter.
     * 
     * @param int $enrollmentId
     * @param int $quarterId
     * @return float|null
     */
    public static function getStudentQuarterAverage($enrollmentId, $quarterId)
    {
        $grades = self::where('enrollment_id', $enrollmentId)
            ->where('quarter_id', $quarterId)
            ->whereNotNull('final_grade')
            ->get();
            
        if ($grades->isEmpty()) {
            return null;
        }
        
        return round($grades->avg('final_grade'), 2);
    }

    /**
     * Get the student's general average for a school year.
     * 
     * @param int $enrollmentId
     * @return float|null
     */
    public static function getStudentGeneralAverage($enrollmentId)
    {
        $quarterAverages = [];
        
        for ($i = 1; $i <= 4; $i++) {
            $average = self::getStudentQuarterAverage($enrollmentId, $i);
            if ($average !== null) {
                $quarterAverages[] = $average;
            }
        }
        
        if (empty($quarterAverages)) {
            return null;
        }
        
        return round(array_sum($quarterAverages) / count($quarterAverages), 2);
    }

    /**
     * Check if the quarter is locked (grades cannot be edited).
     * 
     * @return bool
     */
    public function getIsQuarterLockedAttribute()
    {
        return $this->quarter ? $this->quarter->is_locked : false;
    }

    /**
     * Check if grades can be edited.
     * 
     * @return bool
     */
    public function getCanEditAttribute()
    {
        return !$this->is_quarter_locked;
    }

    /**
     * Get the grade percentage based on DepEd transmutation table.
     * 
     * @return int
     */
    public function getTransmutedGradeAttribute()
    {
        // DepEd transmutation table for elementary
        $transmutation = [
            98 => 100, 97 => 99, 96 => 98, 95 => 97, 94 => 96,
            93 => 95, 92 => 94, 91 => 93, 90 => 92, 89 => 91,
            88 => 90, 87 => 89, 86 => 88, 85 => 87, 84 => 86,
            83 => 85, 82 => 84, 81 => 83, 80 => 82, 79 => 81,
            78 => 80, 77 => 79, 76 => 78, 75 => 77, 74 => 75,
        ];
        
        return $transmutation[$this->final_grade] ?? $this->final_grade;
    }
}