<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Submission extends Model
{
    protected $fillable = [
        'activity_id', 'enrollment_id', 'image_path',
        'points_earned', 'feedback'
    ];

    public function activity()
    {
        return $this->belongsTo(Activity::class);
    }

    public function enrollment()
    {
        return $this->belongsTo(Enrollment::class);
    }
}