<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Section;
use App\Models\GradeLevel;
use App\Models\Enrollment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;

class SectionController extends Controller
{
    public function index()
    {
        $sections = Section::with(['gradeLevel', 'room', 'schoolYear', 'adviser.user'])
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function($section) {
                $studentCount = Enrollment::where('section_id', $section->id)
                    ->where('status', 'Active')
                    ->count();
                    
                return [
                    'id' => $section->id,
                    'section_name' => $section->section_name,
                    'grade_level_id' => $section->grade_level_id,
                    'grade_level' => $section->gradeLevel ? $section->gradeLevel->grade_level : null,
                    'grade_display' => $section->gradeLevel ? ($section->gradeLevel->grade_level == 0 ? 'Kinder' : 'Grade ' . $section->gradeLevel->grade_level) : 'N/A',
                    'room_id' => $section->room_id,
                    'room_name' => $section->room ? $section->room->room_name : null,
                    'adviser_id' => $section->adviser_id,
                    'adviser_name' => $section->adviser && $section->adviser->user ? 
                        $section->adviser->user->first_name . ' ' . $section->adviser->user->last_name : null,
                    'school_year_id' => $section->school_year_id,
                    'school_year' => $section->schoolYear ? 
                        $section->schoolYear->year_start . '-' . $section->schoolYear->year_end : null,
                    'students_count' => $studentCount,
                ];
            });

        return response()->json([
            'success' => true,
            'sections' => $sections
        ]);
    }

    public function getSectionsByGradeLevel($gradeLevelId)
    {
        $gradeLevel = GradeLevel::find($gradeLevelId);
        
        if (!$gradeLevel) {
            return response()->json([
                'success' => false,
                'message' => 'Grade level not found'
            ], 404);
        }

        $sections = Section::where('grade_level_id', $gradeLevelId)
            ->with(['room', 'schoolYear', 'adviser.user'])
            ->get()
            ->map(function($section) {
                $studentCount = Enrollment::where('section_id', $section->id)
                    ->where('status', 'Active')
                    ->count();
                    
                return [
                    'id' => $section->id,
                    'section_name' => $section->section_name,
                    'grade_level_id' => $section->grade_level_id,
                    'room_id' => $section->room_id,
                    'room_name' => $section->room ? $section->room->room_name : null,
                    'adviser_id' => $section->adviser_id,
                    'adviser_name' => $section->adviser && $section->adviser->user ? 
                        $section->adviser->user->first_name . ' ' . $section->adviser->user->last_name : null,
                    'school_year' => $section->schoolYear ? 
                        $section->schoolYear->year_start . '-' . $section->schoolYear->year_end : null,
                    'students_count' => $studentCount,
                ];
            });

        return response()->json([
            'success' => true,
            'sections' => $sections,
            'grade_level' => [
                'id' => $gradeLevel->id,
                'grade_level' => $gradeLevel->grade_level,
                'grade_display' => $gradeLevel->grade_level == 0 ? 'Kinder' : 'Grade ' . $gradeLevel->grade_level,
            ]
        ]);
    }

    public function getStudents($id)
{
    $section = Section::find($id);
    
    if (!$section) {
        return response()->json([
            'success' => false,
            'message' => 'Section not found'
        ], 404);
    }
    
    $enrollments = Enrollment::where('section_id', $id)
        ->with('student.user')
        ->where('status', 'Active')
        ->get();
    
    $students = $enrollments->map(function($enrollment) {
        $user = $enrollment->student->user;
        return [
            'id' => $enrollment->student_id,
            'enrollment_id' => $enrollment->id,
            'lrn' => $enrollment->student->lrn,
            'first_name' => $user->first_name,
            'last_name' => $user->last_name,
            'full_name' => $user->last_name . ', ' . $user->first_name . ' ' . $user->middle_name,
        ];
    });
    
    return response()->json([
        'success' => true,
        'students' => $students
    ]);
}

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'section_name' => 'required|string|max:255',
            'grade_level_id' => 'required|exists:grade_levels,id',
            'room_id' => 'nullable|exists:rooms,id',
            'adviser_id' => 'nullable|exists:teachers,id',
            'school_year_id' => 'required|exists:school_years,id',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        // Check for duplicate section name within same grade level
        $existing = Section::where('section_name', $request->section_name)
            ->where('grade_level_id', $request->grade_level_id)
            ->first();

        if ($existing) {
            return response()->json([
                'success' => false,
                'message' => 'Section name already exists in this grade level'
            ], 422);
        }

        try {
            $section = Section::create([
                'section_name' => strtoupper($request->section_name),
                'grade_level_id' => $request->grade_level_id,
                'room_id' => $request->room_id,
                'adviser_id' => $request->adviser_id,
                'school_year_id' => $request->school_year_id,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Section created successfully',
                'section' => $section
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to create section: ' . $e->getMessage()
            ], 500);
        }
    }

    public function update(Request $request, $id)
    {
        $section = Section::find($id);
        
        if (!$section) {
            return response()->json([
                'success' => false,
                'message' => 'Section not found'
            ], 404);
        }

        $validator = Validator::make($request->all(), [
            'section_name' => 'required|string|max:255',
            'grade_level_id' => 'required|exists:grade_levels,id',
            'room_id' => 'nullable|exists:rooms,id',
            'adviser_id' => 'nullable|exists:teachers,id',
            'school_year_id' => 'required|exists:school_years,id',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        // Check for duplicate section name within same grade level (excluding current)
        $existing = Section::where('section_name', $request->section_name)
            ->where('grade_level_id', $request->grade_level_id)
            ->where('id', '!=', $id)
            ->first();

        if ($existing) {
            return response()->json([
                'success' => false,
                'message' => 'Section name already exists in this grade level'
            ], 422);
        }

        try {
            $section->update([
                'section_name' => strtoupper($request->section_name),
                'grade_level_id' => $request->grade_level_id,
                'room_id' => $request->room_id,
                'adviser_id' => $request->adviser_id,
                'school_year_id' => $request->school_year_id,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Section updated successfully',
                'section' => $section
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update section: ' . $e->getMessage()
            ], 500);
        }
    }

    public function destroy($id)
    {
        $section = Section::find($id);
        
        if (!$section) {
            return response()->json([
                'success' => false,
                'message' => 'Section not found'
            ], 404);
        }

        DB::beginTransaction();

        try {
            // Check if there are active enrollments
            $activeEnrollments = Enrollment::where('section_id', $section->id)
                ->where('status', 'Active')
                ->count();
                
            if ($activeEnrollments > 0) {
                return response()->json([
                    'success' => false,
                    'message' => 'Cannot delete section with active student enrollments'
                ], 400);
            }
            
            $section->delete();

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Section deleted successfully'
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete section: ' . $e->getMessage()
            ], 500);
        }
    }
}