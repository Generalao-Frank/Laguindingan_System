<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Quarter;
use App\Models\SchoolYear;
use App\Models\Grade;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;

class QuarterController extends Controller
{
    public function index()
    {
        $quarters = Quarter::with('schoolYear')
            ->orderBy('school_year_id', 'desc')
            ->orderBy('id', 'asc')
            ->get()
            ->map(function($quarter) {
                $gradesCount = Grade::where('quarter_id', $quarter->id)->count();
                $studentsCount = Grade::where('quarter_id', $quarter->id)
                    ->distinct('enrollment_id')
                    ->count('enrollment_id');
                
                return [
                    'id' => $quarter->id,
                    'name' => $quarter->name,
                    'start_date' => $quarter->start_date,
                    'end_date' => $quarter->end_date,
                    'is_active' => $quarter->is_active,
                    'is_locked' => $quarter->is_locked,
                    'school_year_id' => $quarter->school_year_id,
                    'school_year' => $quarter->schoolYear ? 
                        $quarter->schoolYear->year_start . '-' . $quarter->schoolYear->year_end : 'N/A',
                    'grades_count' => $gradesCount,
                    'students_count' => $studentsCount,
                ];
            });

        return response()->json([
            'success' => true,
            'quarters' => $quarters
        ]);
    }

    public function getQuartersBySchoolYear($schoolYearId)
    {
        $schoolYear = SchoolYear::find($schoolYearId);
        
        if (!$schoolYear) {
            return response()->json([
                'success' => false,
                'message' => 'School year not found'
            ], 404);
        }

        $quarters = Quarter::where('school_year_id', $schoolYearId)
            ->orderBy('id', 'asc')
            ->get()
            ->map(function($quarter) use ($schoolYear) {
                $gradesCount = Grade::where('quarter_id', $quarter->id)->count();
                $studentsCount = Grade::where('quarter_id', $quarter->id)
                    ->distinct('enrollment_id')
                    ->count('enrollment_id');
                
                return [
                    'id' => $quarter->id,
                    'name' => $quarter->name,
                    'start_date' => $quarter->start_date,
                    'end_date' => $quarter->end_date,
                    'is_active' => $quarter->is_active,
                    'is_locked' => $quarter->is_locked,
                    'school_year_id' => $quarter->school_year_id,
                    'school_year' => $schoolYear->year_start . '-' . $schoolYear->year_end,
                    'grades_count' => $gradesCount,
                    'students_count' => $studentsCount,
                ];
            });

        return response()->json([
            'success' => true,
            'quarters' => $quarters,
            'school_year' => [
                'id' => $schoolYear->id,
                'year_start' => $schoolYear->year_start,
                'year_end' => $schoolYear->year_end,
            ]
        ]);
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|in:1st Quarter,2nd Quarter,3rd Quarter,4th Quarter',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after:start_date',
            'is_active' => 'boolean',
            'is_locked' => 'boolean',
            'school_year_id' => 'required|exists:school_years,id',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        // Check for duplicate quarter name within same school year
        $existing = Quarter::where('name', $request->name)
            ->where('school_year_id', $request->school_year_id)
            ->first();

        if ($existing) {
            return response()->json([
                'success' => false,
                'message' => 'Quarter already exists in this school year'
            ], 422);
        }

        DB::beginTransaction();

        try {
            // If this quarter is set as active, deactivate others in the same school year
            if ($request->is_active) {
                Quarter::where('school_year_id', $request->school_year_id)
                    ->update(['is_active' => false]);
            }

            $quarter = Quarter::create([
                'name' => $request->name,
                'start_date' => $request->start_date,
                'end_date' => $request->end_date,
                'is_active' => $request->is_active ?? false,
                'is_locked' => $request->is_locked ?? false,
                'school_year_id' => $request->school_year_id,
            ]);

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Quarter created successfully',
                'quarter' => $quarter
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to create quarter: ' . $e->getMessage()
            ], 500);
        }
    }

    public function update(Request $request, $id)
    {
        $quarter = Quarter::find($id);
        
        if (!$quarter) {
            return response()->json([
                'success' => false,
                'message' => 'Quarter not found'
            ], 404);
        }

        $validator = Validator::make($request->all(), [
            'name' => 'required|string|in:1st Quarter,2nd Quarter,3rd Quarter,4th Quarter',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after:start_date',
            'is_active' => 'boolean',
            'is_locked' => 'boolean',
            'school_year_id' => 'required|exists:school_years,id',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        // Check for duplicate quarter name within same school year (excluding current)
        $existing = Quarter::where('name', $request->name)
            ->where('school_year_id', $request->school_year_id)
            ->where('id', '!=', $id)
            ->first();

        if ($existing) {
            return response()->json([
                'success' => false,
                'message' => 'Quarter already exists in this school year'
            ], 422);
        }

        DB::beginTransaction();

        try {
            // If setting this as active, deactivate others in the same school year
            if ($request->is_active && !$quarter->is_active) {
                Quarter::where('school_year_id', $request->school_year_id)
                    ->where('id', '!=', $id)
                    ->update(['is_active' => false]);
            }

            $quarter->update([
                'name' => $request->name,
                'start_date' => $request->start_date,
                'end_date' => $request->end_date,
                'is_active' => $request->is_active ?? false,
                'is_locked' => $request->is_locked ?? false,
                'school_year_id' => $request->school_year_id,
            ]);

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Quarter updated successfully',
                'quarter' => $quarter
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to update quarter: ' . $e->getMessage()
            ], 500);
        }
    }

    public function destroy($id)
    {
        $quarter = Quarter::find($id);
        
        if (!$quarter) {
            return response()->json([
                'success' => false,
                'message' => 'Quarter not found'
            ], 404);
        }

        // Check if there are grades
        $gradesCount = Grade::where('quarter_id', $quarter->id)->count();
        
        if ($gradesCount > 0) {
            return response()->json([
                'success' => false,
                'message' => 'Cannot delete quarter with existing grade records'
            ], 400);
        }

        try {
            $quarter->delete();

            return response()->json([
                'success' => true,
                'message' => 'Quarter deleted successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete quarter: ' . $e->getMessage()
            ], 500);
        }
    }
}