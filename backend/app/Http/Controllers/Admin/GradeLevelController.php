<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\GradeLevel;
use App\Models\Section;
use App\Models\Enrollment;
use App\Models\Subject;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;

class GradeLevelController extends Controller
{
    // Get all grade levels
    public function index()
    {
        $gradeLevels = GradeLevel::orderBy('grade_level', 'asc')->get();
        
        // Get counts for sections, students, and subjects
        $gradeLevels = $gradeLevels->map(function($grade) {
            // Get sections under this grade level
            $sections = Section::where('grade_level_id', $grade->id)->get();
            
            // Get subjects under this grade level
            $subjects = Subject::where('grade_level_id', $grade->id)->get();
            
            // Count students under this grade level
            $studentsCount = 0;
            foreach ($sections as $section) {
                $studentsCount += Enrollment::where('section_id', $section->id)
                    ->where('status', 'Active')
                    ->count();
            }
            
            return [
                'id' => $grade->id,
                'grade_level' => $grade->grade_level,
                'grade_display' => $grade->grade_level == 0 ? 'Kinder' : 'Grade ' . $grade->grade_level,
                'sections_count' => $sections->count(),
                'subjects_count' => $subjects->count(),
                'students_count' => $studentsCount,
                'created_at' => $grade->created_at,
            ];
        });
        
        return response()->json([
            'success' => true,
            'grade_levels' => $gradeLevels
        ]);
    }

    // Get single grade level with its sections
    public function show($id)
    {
        $gradeLevel = GradeLevel::find($id);
        
        if (!$gradeLevel) {
            return response()->json([
                'success' => false,
                'message' => 'Grade level not found'
            ], 404);
        }
        
        $sections = Section::where('grade_level_id', $gradeLevel->id)
            ->with('room')
            ->get()
            ->map(function($section) {
                $studentCount = Enrollment::where('section_id', $section->id)
                    ->where('status', 'Active')
                    ->count();
                    
                return [
                    'id' => $section->id,
                    'section_name' => $section->section_name,
                    'room_name' => $section->room ? $section->room->room_name : null,
                    'adviser_name' => $section->adviser && $section->adviser->user ? 
                        $section->adviser->user->first_name . ' ' . $section->adviser->user->last_name : null,
                    'students_count' => $studentCount,
                ];
            });
        
        return response()->json([
            'success' => true,
            'grade_level' => [
                'id' => $gradeLevel->id,
                'grade_level' => $gradeLevel->grade_level,
                'grade_display' => $gradeLevel->grade_level == 0 ? 'Kinder' : 'Grade ' . $gradeLevel->grade_level,
            ],
            'sections' => $sections
        ]);
    }

    // Create new grade level
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'grade_level' => 'required|integer|min:0|max:6|unique:grade_levels,grade_level',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $gradeLevel = GradeLevel::create([
                'grade_level' => $request->grade_level,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Grade level created successfully',
                'grade_level' => [
                    'id' => $gradeLevel->id,
                    'grade_level' => $gradeLevel->grade_level,
                    'grade_display' => $gradeLevel->grade_level == 0 ? 'Kinder' : 'Grade ' . $gradeLevel->grade_level,
                ]
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to create grade level: ' . $e->getMessage()
            ], 500);
        }
    }

    // Update grade level
    public function update(Request $request, $id)
    {
        $gradeLevel = GradeLevel::find($id);
        
        if (!$gradeLevel) {
            return response()->json([
                'success' => false,
                'message' => 'Grade level not found'
            ], 404);
        }

        $validator = Validator::make($request->all(), [
            'grade_level' => 'required|integer|min:0|max:6|unique:grade_levels,grade_level,' . $id,
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $gradeLevel->update([
                'grade_level' => $request->grade_level,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Grade level updated successfully',
                'grade_level' => [
                    'id' => $gradeLevel->id,
                    'grade_level' => $gradeLevel->grade_level,
                    'grade_display' => $gradeLevel->grade_level == 0 ? 'Kinder' : 'Grade ' . $gradeLevel->grade_level,
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update grade level: ' . $e->getMessage()
            ], 500);
        }
    }

    // Delete grade level
    public function destroy($id)
    {
        $gradeLevel = GradeLevel::find($id);
        
        if (!$gradeLevel) {
            return response()->json([
                'success' => false,
                'message' => 'Grade level not found'
            ], 404);
        }

        DB::beginTransaction();

        try {
            // Check if there are sections under this grade level
            $sections = Section::where('grade_level_id', $gradeLevel->id)->get();
            
            if ($sections->count() > 0) {
                return response()->json([
                    'success' => false,
                    'message' => 'Cannot delete grade level with existing sections. Please delete sections first.'
                ], 400);
            }
            
            // Check if there are subjects under this grade level
            $subjects = Subject::where('grade_level_id', $gradeLevel->id)->get();
            
            if ($subjects->count() > 0) {
                return response()->json([
                    'success' => false,
                    'message' => 'Cannot delete grade level with existing subjects. Please delete subjects first.'
                ], 400);
            }
            
            $gradeLevel->delete();

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Grade level deleted successfully'
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete grade level: ' . $e->getMessage()
            ], 500);
        }
    }
}