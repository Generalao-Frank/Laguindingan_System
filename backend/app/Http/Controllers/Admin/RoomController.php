<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Room;
use App\Models\Section;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;

class RoomController extends Controller
{
    // Get all rooms
    public function index()
    {
        $rooms = Room::orderBy('room_name', 'asc')
            ->get()
            ->map(function($room) {
                $sectionsCount = Section::where('room_id', $room->id)->count();
                $status = $sectionsCount > 0 ? 'Occupied' : 'Available';
                
                return [
                    'id' => $room->id,
                    'room_name' => $room->room_name,
                    'capacity' => $room->capacity,
                    'sections_count' => $sectionsCount,
                    'status' => $status,
                    'created_at' => $room->created_at,
                ];
            });

        return response()->json([
            'success' => true,
            'rooms' => $rooms
        ]);
    }

    // Get single room with its sections
    public function show($id)
    {
        $room = Room::find($id);
        
        if (!$room) {
            return response()->json([
                'success' => false,
                'message' => 'Room not found'
            ], 404);
        }
        
        $sections = Section::where('room_id', $room->id)
            ->with(['gradeLevel', 'schoolYear', 'adviser.user'])
            ->get()
            ->map(function($section) {
                $studentCount = \App\Models\Enrollment::where('section_id', $section->id)
                    ->where('status', 'Active')
                    ->count();
                    
                return [
                    'id' => $section->id,
                    'section_name' => $section->section_name,
                    'grade_display' => $section->gradeLevel ? 
                        ($section->gradeLevel->grade_level == 0 ? 'Kinder' : 'Grade ' . $section->gradeLevel->grade_level) : 'N/A',
                    'adviser_name' => $section->adviser && $section->adviser->user ? 
                        $section->adviser->user->first_name . ' ' . $section->adviser->user->last_name : null,
                    'students_count' => $studentCount,
                    'school_year' => $section->schoolYear ? 
                        $section->schoolYear->year_start . '-' . $section->schoolYear->year_end : null,
                ];
            });
        
        return response()->json([
            'success' => true,
            'room' => [
                'id' => $room->id,
                'room_name' => $room->room_name,
                'capacity' => $room->capacity,
                'capacity_display' => $room->capacity ? $room->capacity . ' students' : 'No limit',
                'sections_count' => $sections->count(),
                'status' => $sections->count() > 0 ? 'Occupied' : 'Available',
            ],
            'sections' => $sections
        ]);
    }

    // Create new room
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'room_name' => 'required|string|max:255|unique:rooms,room_name',
            'capacity' => 'nullable|integer|min:0',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $room = Room::create([
                'room_name' => strtoupper($request->room_name),
                'capacity' => $request->capacity,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Room created successfully',
                'room' => [
                    'id' => $room->id,
                    'room_name' => $room->room_name,
                    'capacity' => $room->capacity,
                ]
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to create room: ' . $e->getMessage()
            ], 500);
        }
    }

    // Update room
    public function update(Request $request, $id)
    {
        $room = Room::find($id);
        
        if (!$room) {
            return response()->json([
                'success' => false,
                'message' => 'Room not found'
            ], 404);
        }

        $validator = Validator::make($request->all(), [
            'room_name' => 'required|string|max:255|unique:rooms,room_name,' . $id,
            'capacity' => 'nullable|integer|min:0',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $room->update([
                'room_name' => strtoupper($request->room_name),
                'capacity' => $request->capacity,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Room updated successfully',
                'room' => [
                    'id' => $room->id,
                    'room_name' => $room->room_name,
                    'capacity' => $room->capacity,
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update room: ' . $e->getMessage()
            ], 500);
        }
    }

    // Delete room
    public function destroy($id)
    {
        $room = Room::find($id);
        
        if (!$room) {
            return response()->json([
                'success' => false,
                'message' => 'Room not found'
            ], 404);
        }

        DB::beginTransaction();

        try {
            // Check if there are sections assigned to this room
            $sectionsCount = Section::where('room_id', $room->id)->count();
            
            if ($sectionsCount > 0) {
                return response()->json([
                    'success' => false,
                    'message' => 'Cannot delete room with ' . $sectionsCount . ' assigned section(s)'
                ], 400);
            }
            
            $room->delete();

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Room deleted successfully'
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete room: ' . $e->getMessage()
            ], 500);
        }
    }
}