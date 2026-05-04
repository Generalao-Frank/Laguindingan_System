<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\TeacherAssignment;
use App\Models\Teacher;
use App\Models\Subject;
use App\Models\Section;
use App\Models\SchoolYear;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;

class TeacherAssignmentController extends Controller
{
    public function index()
    {
        $assignments = TeacherAssignment::with(['teacher.user', 'subject', 'section.gradeLevel', 'schoolYear'])
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function($assignment) {
                return [
                    'id' => $assignment->id,
                    'teacher_id' => $assignment->teacher_id,
                    'teacher_name' => $assignment->teacher && $assignment->teacher->user ? 
                        $assignment->teacher->user->first_name . ' ' . $assignment->teacher->user->last_name : 'N/A',
                    'subject_id' => $assignment->subject_id,
                    'subject_name' => $assignment->subject ? $assignment->subject->subject_name : 'N/A',
                    'section_id' => $assignment->section_id,
                    'section_name' => $assignment->section ? $assignment->section->section_name : 'N/A',
                    'grade_level' => $assignment->section && $assignment->section->gradeLevel ? 
                        $assignment->section->gradeLevel->grade_level : null,
                    'grade_display' => $assignment->section && $assignment->section->gradeLevel ? 
                        ($assignment->section->gradeLevel->grade_level == 0 ? 'Kinder' : 'Grade ' . $assignment->section->gradeLevel->grade_level) : 'N/A',
                    'school_year_id' => $assignment->school_year_id,
                    'school_year' => $assignment->schoolYear ? 
                        $assignment->schoolYear->year_start . '-' . $assignment->schoolYear->year_end : 'N/A',
                ];
            });

        return response()->json([
            'success' => true,
            'assignments' => $assignments
        ]);
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'teacher_id' => 'required|exists:teachers,id',
            'subject_id' => 'required|exists:subjects,id',
            'section_id' => 'required|exists:sections,id',
            'school_year_id' => 'required|exists:school_years,id',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        // Check for duplicate assignment
        $existing = TeacherAssignment::where('teacher_id', $request->teacher_id)
            ->where('subject_id', $request->subject_id)
            ->where('section_id', $request->section_id)
            ->where('school_year_id', $request->school_year_id)
            ->first();

        if ($existing) {
            return response()->json([
                'success' => false,
                'message' => 'This teacher is already assigned to this subject and section for the selected school year'
            ], 422);
        }

        try {
            $assignment = TeacherAssignment::create([
                'teacher_id' => $request->teacher_id,
                'subject_id' => $request->subject_id,
                'section_id' => $request->section_id,
                'school_year_id' => $request->school_year_id,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Teacher assigned successfully',
                'assignment' => $assignment
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to create assignment: ' . $e->getMessage()
            ], 500);
        }
    }

    public function update(Request $request, $id)
    {
        $assignment = TeacherAssignment::find($id);
        
        if (!$assignment) {
            return response()->json([
                'success' => false,
                'message' => 'Assignment not found'
            ], 404);
        }

        $validator = Validator::make($request->all(), [
            'teacher_id' => 'required|exists:teachers,id',
            'subject_id' => 'required|exists:subjects,id',
            'section_id' => 'required|exists:sections,id',
            'school_year_id' => 'required|exists:school_years,id',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        // Check for duplicate assignment (excluding current)
        $existing = TeacherAssignment::where('teacher_id', $request->teacher_id)
            ->where('subject_id', $request->subject_id)
            ->where('section_id', $request->section_id)
            ->where('school_year_id', $request->school_year_id)
            ->where('id', '!=', $id)
            ->first();

        if ($existing) {
            return response()->json([
                'success' => false,
                'message' => 'This teacher is already assigned to this subject and section for the selected school year'
            ], 422);
        }

        try {
            $assignment->update([
                'teacher_id' => $request->teacher_id,
                'subject_id' => $request->subject_id,
                'section_id' => $request->section_id,
                'school_year_id' => $request->school_year_id,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Assignment updated successfully',
                'assignment' => $assignment
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update assignment: ' . $e->getMessage()
            ], 500);
        }
    }

    public function destroy($id)
    {
        $assignment = TeacherAssignment::find($id);
        
        if (!$assignment) {
            return response()->json([
                'success' => false,
                'message' => 'Assignment not found'
            ], 404);
        }

        try {
            $assignment->delete();

            return response()->json([
                'success' => true,
                'message' => 'Assignment removed successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete assignment: ' . $e->getMessage()
            ], 500);
        }
    }
}