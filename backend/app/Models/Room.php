<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Room extends Model
{
    use HasFactory;

    protected $fillable = [
        'room_name',
        'capacity',
    ];

    protected $casts = [
        'capacity' => 'integer',
    ];

    // Relationship: A room can have many sections
    public function sections()
    {
        return $this->hasMany(Section::class, 'room_id');
    }

    // Get the number of sections using this room
    public function getSectionsCountAttribute()
    {
        return $this->sections()->count();
    }

    // Get room status (Available or Occupied)
    public function getStatusAttribute()
    {
        return $this->sections_count > 0 ? 'Occupied' : 'Available';
    }

    // Get capacity display
    public function getCapacityDisplayAttribute()
    {
        return $this->capacity ? $this->capacity . ' students' : 'No limit';
    }
}