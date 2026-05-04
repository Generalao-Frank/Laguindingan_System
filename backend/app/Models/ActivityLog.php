<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ActivityLog extends Model
{
    use HasFactory;

    /**
     * The table associated with the model.
     *
     * @var string
     */
    protected $table = 'activity_logs';

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'user_id',
        'student_id',
        'action_type',
        'table_name',
        'record_id',
        'old_values',
        'new_values',
        'description',
        'ip_address',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'old_values' => 'array',
        'new_values' => 'array',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Get the user who performed the action.
     */
    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    /**
     * Get the student related to this activity (if any).
     */
    public function student()
    {
        return $this->belongsTo(StudentsInfo::class, 'student_id');
    }

    /**
     * Scope a query to only include logs of a specific action type.
     */
    public function scopeOfType($query, $actionType)
    {
        return $query->where('action_type', $actionType);
    }

    /**
     * Scope a query to only include logs for a specific table.
     */
    public function scopeForTable($query, $tableName)
    {
        return $query->where('table_name', $tableName);
    }

    /**
     * Scope a query to only include logs for a specific record.
     */
    public function scopeForRecord($query, $recordId)
    {
        return $query->where('record_id', $recordId);
    }

    /**
     * Scope a query to only include logs for a specific student.
     */
    public function scopeForStudent($query, $studentId)
    {
        return $query->where('student_id', $studentId);
    }

    /**
     * Get a human-readable action label.
     */
    public function getActionLabelAttribute()
    {
        $labels = [
            'CREATE' => 'Created',
            'UPDATE' => 'Updated',
            'DELETE' => 'Deleted',
            'LOGIN' => 'Logged in',
            'LOGOUT' => 'Logged out',
            'UPLOAD' => 'Uploaded',
            'TRANSFER' => 'Transferred',
            'ENROLL' => 'Enrolled',
            'DROP' => 'Dropped',
            'GRADE_UPDATE' => 'Grade updated',
        ];
        return $labels[$this->action_type] ?? $this->action_type;
    }

    /**
     * Get a summary description of the changes.
     */
    public function getSummaryAttribute()
    {
        if ($this->old_values && $this->new_values) {
            $old = $this->old_values;
            $new = $this->new_values;
            $changes = [];
            foreach ($new as $key => $value) {
                if (isset($old[$key]) && $old[$key] != $value) {
                    $changes[] = "$key: {$old[$key]} → {$value}";
                }
            }
            if (!empty($changes)) {
                return implode(', ', $changes);
            }
        }
        return $this->description;
    }
}