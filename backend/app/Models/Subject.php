<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Subject extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'subject_name',
        'grade_level_id',

    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'grade_level_id' => 'integer',
    ];

    /**
     * Get the grade level that owns the subject.
     * 
     * Relationship: Subject belongs to a Grade Level
     * Foreign key: subjects.grade_level_id -> grade_levels.id
     */
    public function gradeLevel()
    {
        return $this->belongsTo(GradeLevel::class, 'grade_level_id');
    }

    /**
     * Get the teacher assignments for this subject.
     * 
     * Relationship: Subject has many Teacher Assignments
     */
    public function teacherAssignments()
    {
        return $this->hasMany(TeacherAssignment::class, 'subject_id');
    }

    /**
     * Get the grades for this subject.
     * 
     * Relationship: Subject has many Grades
     */
    public function grades()
    {
        return $this->hasMany(Grade::class, 'subject_id');
    }

    /**
     * Get the activities for this subject.
     * 
     * Relationship: Subject has many Activities
     */
    public function activities()
    {
        return $this->hasMany(Activity::class, 'subject_id');
    }

    /**
     * Get the subject name with grade level.
     * 
     * @return string
     */
    public function getFullNameAttribute()
    {
        $gradeName = $this->gradeLevel 
            ? ($this->gradeLevel->grade_level == 0 ? 'Kinder' : 'Grade ' . $this->gradeLevel->grade_level)
            : 'Unknown Grade';
        
        return $gradeName . ' - ' . $this->subject_name;
    }

    /**
     * Scope a query to only include subjects of a specific grade level.
     * 
     * @param \Illuminate\Database\Eloquent\Builder $query
     * @param int $gradeLevelId
     * @return \Illuminate\Database\Eloquent\Builder
     */
    public function scopeForGradeLevel($query, $gradeLevelId)
    {
        return $query->where('grade_level_id', $gradeLevelId);
    }

    /**
     * Scope a query to search subjects by name.
     * 
     * @param \Illuminate\Database\Eloquent\Builder $query
     * @param string $search
     * @return \Illuminate\Database\Eloquent\Builder
     */
    public function scopeSearch($query, $search)
    {
        return $query->where('subject_name', 'like', "%{$search}%");
    }

    /**
     * Get the teacher count for this subject.
     * 
     * @return int
     */
    public function getTeacherCountAttribute()
    {
        return $this->teacherAssignments()
            ->distinct('teacher_id')
            ->count('teacher_id');
    }

    /**
     * Get the section count for this subject.
     * 
     * @return int
     */
    public function getSectionCountAttribute()
    {
        return $this->teacherAssignments()
            ->distinct('section_id')
            ->count('section_id');
    }

    /**
     * Check if subject has teacher assigned to a specific section.
     * 
     * @param int $sectionId
     * @return bool
     */
    public function hasTeacherForSection($sectionId)
    {
        return $this->teacherAssignments()
            ->where('section_id', $sectionId)
            ->exists();
    }

    /**
     * Get the assigned teacher for a specific section.
     * 
     * @param int $sectionId
     * @return \App\Models\Teacher|null
     */
    public function getTeacherForSection($sectionId)
    {
        $assignment = $this->teacherAssignments()
            ->with('teacher.user')
            ->where('section_id', $sectionId)
            ->first();
        
        return $assignment ? $assignment->teacher : null;
    }
}