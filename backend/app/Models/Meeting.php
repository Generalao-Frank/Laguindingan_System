<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Meeting extends Model
{
    use HasFactory;

    protected $fillable = [
        'created_by',
        'title',
        'description',
        'location',
        'meeting_datetime',
        'audience',
        'status',
    ];

    protected $casts = [
        'meeting_datetime' => 'datetime',
        'audience' => 'string', // Enum values: Teachers, Students, All
        'status' => 'string',   // Enum values: Scheduled, Completed, Cancelled
    ];

    /**
     * Get the user who created the meeting.
     */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}