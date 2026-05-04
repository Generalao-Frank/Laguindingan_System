<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Subject;
use App\Models\GradeLevel;
use App\Models\TeacherAssignment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;

class SubjectController extends Controller
{
    public function index()
    {
        $subjects = Subject::with('gradeLevel')
            ->orderBy('grade_level_id', 'asc')
            ->orderBy('subject_name', 'asc')
            ->get()
            ->map(function($subject) {
                $teacherCount = TeacherAssignment::where('subject_id', $subject->id)
                    ->distinct('teacher_id')
                    ->count('teacher_id');
                    
                $sectionCount = TeacherAssignment::where('subject_id', $subject->id)
                    ->distinct('section_id')
                    ->count('section_id');
                
                return [
                    'id' => $subject->id,
                    'subject_name' => $subject->subject_name,
                    'grade_level_id' => $subject->grade_level_id,
                    'grade_level' => $subject->gradeLevel ? $subject->gradeLevel->grade_level : null,
                    'grade_display' => $subject->gradeLevel ? 
                        ($subject->gradeLevel->grade_level == 0 ? 'Kinder' : 'Grade ' . $subject->gradeLevel->grade_level) : 'N/A',
                    'teacher_count' => $teacherCount,
                    'section_count' => $sectionCount,
                    'created_at' => $subject->created_at,
                ];
            });

        return response()->json([
            'success' => true,
            'subjects' => $subjects
        ]);
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'subject_name' => 'required|string|max:255',
            'grade_level_id' => 'required|exists:grade_levels,id',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        // Check for duplicate subject within same grade level
        $existing = Subject::where('subject_name', $request->subject_name)
            ->where('grade_level_id', $request->grade_level_id)
            ->first();

        if ($existing) {
            $gradeLevel = GradeLevel::find($request->grade_level_id);
            $gradeDisplay = $gradeLevel ? ($gradeLevel->grade_level == 0 ? 'Kinder' : 'Grade ' . $gradeLevel->grade_level) : 'this grade level';
            
            return response()->json([
                'success' => false,
                'message' => "Subject '{$request->subject_name}' already exists in {$gradeDisplay}!",
                'errors' => [
                    'subject_name' => ["Subject '{$request->subject_name}' already exists in {$gradeDisplay}"]
                ]
            ], 422);
        }

        try {
            $subject = Subject::create([
                'subject_name' => strtoupper($request->subject_name),
                'grade_level_id' => $request->grade_level_id,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Subject created successfully',
                'subject' => $subject
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to create subject: ' . $e->getMessage()
            ], 500);
        }
    }

    public function update(Request $request, $id)
    {
        $subject = Subject::find($id);
        
        if (!$subject) {
            return response()->json([
                'success' => false,
                'message' => 'Subject not found'
            ], 404);
        }

        $validator = Validator::make($request->all(), [
            'subject_name' => 'required|string|max:255',
            'grade_level_id' => 'required|exists:grade_levels,id',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        // Check for duplicate subject within same grade level (excluding current)
        $existing = Subject::where('subject_name', $request->subject_name)
            ->where('grade_level_id', $request->grade_level_id)
            ->where('id', '!=', $id)
            ->first();

        if ($existing) {
            $gradeLevel = GradeLevel::find($request->grade_level_id);
            $gradeDisplay = $gradeLevel ? ($gradeLevel->grade_level == 0 ? 'Kinder' : 'Grade ' . $gradeLevel->grade_level) : 'this grade level';
            
            return response()->json([
                'success' => false,
                'message' => "Subject '{$request->subject_name}' already exists in {$gradeDisplay}!",
                'errors' => [
                    'subject_name' => ["Subject '{$request->subject_name}' already exists in {$gradeDisplay}"]
                ]
            ], 422);
        }

        try {
            $subject->update([
                'subject_name' => strtoupper($request->subject_name),
                'grade_level_id' => $request->grade_level_id,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Subject updated successfully',
                'subject' => $subject
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update subject: ' . $e->getMessage()
            ], 500);
        }
    }

    public function destroy($id)
    {
        $subject = Subject::find($id);
        
        if (!$subject) {
            return response()->json([
                'success' => false,
                'message' => 'Subject not found'
            ], 404);
        }

        DB::beginTransaction();

        try {
            // Check if there are teacher assignments
            $assignments = TeacherAssignment::where('subject_id', $subject->id)->count();
            
            if ($assignments > 0) {
                return response()->json([
                    'success' => false,
                    'message' => 'Cannot delete subject with existing teacher assignments'
                ], 400);
            }
            
            $subject->delete();

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Subject deleted successfully'
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete subject: ' . $e->getMessage()
            ], 500);
        }
    }
}