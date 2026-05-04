<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\SchoolYear;
use App\Models\Quarter;
use App\Models\Enrollment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;

class SchoolYearController extends Controller
{
    public function index()
    {
        $schoolYears = SchoolYear::orderBy('year_start', 'desc')
            ->get()
            ->map(function($sy) {
                $quartersCount = Quarter::where('school_year_id', $sy->id)->count();
                $enrollmentsCount = Enrollment::where('school_year_id', $sy->id)->count();
                
                return [
                    'id' => $sy->id,
                    'year_start' => $sy->year_start,
                    'year_end' => $sy->year_end,
                    'is_active' => $sy->is_active,
                    'quarters_count' => $quartersCount,
                    'enrollments_count' => $enrollmentsCount,
                    'created_at' => $sy->created_at,
                ];
            });

        return response()->json([
            'success' => true,
            'school_years' => $schoolYears
        ]);
    }

    public function getActive()
    {
        $activeSchoolYear = SchoolYear::where('is_active', true)->first();
        
        return response()->json([
            'success' => true,
            'school_year' => $activeSchoolYear
        ]);
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'year_start' => 'required|integer|min:2000|max:2100',
            'year_end' => 'required|integer|min:2000|max:2100',
            'is_active' => 'boolean',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        // Validate that year_end is year_start + 1
        if ($request->year_end != $request->year_start + 1) {
            return response()->json([
                'success' => false,
                'message' => 'School year must be consecutive (e.g., 2024-2025)',
                'errors' => ['year_end' => ['School year must be consecutive']]
            ], 422);
        }

        // Check for duplicate
        $existing = SchoolYear::where('year_start', $request->year_start)
            ->where('year_end', $request->year_end)
            ->first();

        if ($existing) {
            return response()->json([
                'success' => false,
                'message' => 'School year already exists',
                'errors' => ['year_start' => ['School year already exists']]
            ], 422);
        }

        DB::beginTransaction();

        try {
            // If this school year is set as active, deactivate others
            if ($request->is_active) {
                SchoolYear::where('is_active', true)->update(['is_active' => false]);
            }

            $schoolYear = SchoolYear::create([
                'year_start' => $request->year_start,
                'year_end' => $request->year_end,
                'is_active' => $request->is_active ?? false,
            ]);

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'School year created successfully',
                'school_year' => $schoolYear
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to create school year: ' . $e->getMessage()
            ], 500);
        }
    }

    public function update(Request $request, $id)
    {
        $schoolYear = SchoolYear::find($id);
        
        if (!$schoolYear) {
            return response()->json([
                'success' => false,
                'message' => 'School year not found'
            ], 404);
        }

        $validator = Validator::make($request->all(), [
            'year_start' => 'required|integer|min:2000|max:2100',
            'year_end' => 'required|integer|min:2000|max:2100',
            'is_active' => 'boolean',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        // Validate that year_end is year_start + 1
        if ($request->year_end != $request->year_start + 1) {
            return response()->json([
                'success' => false,
                'message' => 'School year must be consecutive (e.g., 2024-2025)',
                'errors' => ['year_end' => ['School year must be consecutive']]
            ], 422);
        }

        // Check for duplicate
        $existing = SchoolYear::where('year_start', $request->year_start)
            ->where('year_end', $request->year_end)
            ->where('id', '!=', $id)
            ->first();

        if ($existing) {
            return response()->json([
                'success' => false,
                'message' => 'School year already exists',
                'errors' => ['year_start' => ['School year already exists']]
            ], 422);
        }

        DB::beginTransaction();

        try {
            // If setting this as active, deactivate others
            if ($request->is_active && !$schoolYear->is_active) {
                SchoolYear::where('is_active', true)->update(['is_active' => false]);
            }

            $schoolYear->update([
                'year_start' => $request->year_start,
                'year_end' => $request->year_end,
                'is_active' => $request->is_active ?? false,
            ]);

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'School year updated successfully',
                'school_year' => $schoolYear
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to update school year: ' . $e->getMessage()
            ], 500);
        }
    }

    public function destroy($id)
    {
        $schoolYear = SchoolYear::find($id);
        
        if (!$schoolYear) {
            return response()->json([
                'success' => false,
                'message' => 'School year not found'
            ], 404);
        }

        if ($schoolYear->is_active) {
            return response()->json([
                'success' => false,
                'message' => 'Cannot delete the active school year. Please set another school year as active first.'
            ], 400);
        }

        DB::beginTransaction();

        try {
            // Check if there are enrollments
            $enrollmentsCount = Enrollment::where('school_year_id', $schoolYear->id)->count();
            
            if ($enrollmentsCount > 0) {
                return response()->json([
                    'success' => false,
                    'message' => 'Cannot delete school year with existing enrollments'
                ], 400);
            }
            
            // Delete related quarters first
            Quarter::where('school_year_id', $schoolYear->id)->delete();
            
            $schoolYear->delete();

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'School year deleted successfully'
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete school year: ' . $e->getMessage()
            ], 500);
        }
    }
}