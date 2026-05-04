<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Grade;
use App\Models\Enrollment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;

class GradeController extends Controller
{
    public function index(Request $request)
    {
        $query = Grade::with(['enrollment.student.user', 'subject', 'quarter']);
        
        if ($request->has('section_id')) {
            $enrollments = Enrollment::where('section_id', $request->section_id)->pluck('id');
            $query->whereIn('enrollment_id', $enrollments);
        }
        
        if ($request->has('subject_id')) {
            $query->where('subject_id', $request->subject_id);
        }
        
        if ($request->has('quarter_id')) {
            $query->where('quarter_id', $request->quarter_id);
        }
        
        $grades = $query->get()->map(function($grade) {
            return [
                'id' => $grade->id,
                'student_id' => $grade->enrollment->student_id,
                'student_name' => $grade->student_name,
                'written_works' => $grade->written_works,
                'performance_tasks' => $grade->performance_tasks,
                'quarterly_assessment' => $grade->quarterly_assessment,
                'final_grade' => $grade->final_grade,
            ];
        });
        
        return response()->json([
            'success' => true,
            'grades' => $grades
        ]);
    }
    
    public function batchStore(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'grades' => 'required|array',
            'grades.*.enrollment_id' => 'required|exists:enrollments,id',
            'grades.*.subject_id' => 'required|exists:subjects,id',
            'grades.*.quarter_id' => 'required|exists:quarters,id',
            'grades.*.written_works' => 'nullable|numeric|min:0|max:100',
            'grades.*.performance_tasks' => 'nullable|numeric|min:0|max:100',
            'grades.*.quarterly_assessment' => 'nullable|numeric|min:0|max:100',
        ]);
        
        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }
        
        DB::beginTransaction();
        
        try {
            foreach ($request->grades as $gradeData) {
                Grade::updateOrCreate(
                    [
                        'enrollment_id' => $gradeData['enrollment_id'],
                        'subject_id' => $gradeData['subject_id'],
                        'quarter_id' => $gradeData['quarter_id'],
                    ],
                    [
                        'written_works' => $gradeData['written_works'] ?? 0,
                        'performance_tasks' => $gradeData['performance_tasks'] ?? 0,
                        'quarterly_assessment' => $gradeData['quarterly_assessment'] ?? 0,
                    ]
                );
            }
            
            DB::commit();
            
            return response()->json([
                'success' => true,
                'message' => 'Grades saved successfully'
            ]);
            
        } catch (\Exception $e) {
            DB::rollBack();
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to save grades: ' . $e->getMessage()
            ], 500);
        }
    }
}