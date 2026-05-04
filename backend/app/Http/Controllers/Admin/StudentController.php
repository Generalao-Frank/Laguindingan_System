<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\StudentsInfo;
use App\Models\Enrollment;
use App\Models\StudentStatusHistory;
use App\Models\Section;
use App\Models\SchoolYear;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

class StudentController extends Controller
{
    /**
     * Get all students with complete info
     */
    public function index()
    {
        $students = User::where('role', 'Student')
            ->with('studentInfo')
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function($user) {
                $currentEnrollment = null;
                if ($user->studentInfo) {
                    $currentEnrollment = Enrollment::where('student_id', $user->studentInfo->id)
                        ->with('section.gradeLevel')  // load gradeLevel relation
                        ->where('status', 'Active')
                        ->first();
                }

                // Get grade level numeric value via relation
                $gradeLevelValue = null;
                if ($currentEnrollment && $currentEnrollment->section && $currentEnrollment->section->gradeLevel) {
                    $gradeLevelValue = $currentEnrollment->section->gradeLevel->grade_level;
                }

                return [
                    'id' => $user->id,
                    'lrn' => $user->studentInfo ? $user->studentInfo->lrn : null,
                    'first_name' => $user->first_name,
                    'middle_name' => $user->middle_name,
                    'last_name' => $user->last_name,
                    'full_name' => $user->last_name . ', ' . $user->first_name . ' ' . $user->middle_name,
                    'gender' => $user->gender,
                    'birthdate' => $user->birthdate,
                    'address' => $user->address,
                    'contact_number' => $user->contact_number,
                    'guardian_name' => $user->studentInfo ? $user->studentInfo->guardian_name : null,
                    'guardian_contact_number' => $user->studentInfo ? $user->studentInfo->guardian_contact_number : null,
                    'psa_number' => $user->studentInfo ? $user->studentInfo->PSA_Number : null,
                    'father_name' => $user->studentInfo ? $user->studentInfo->father_name : null,
                    'mother_name' => $user->studentInfo ? $user->studentInfo->mother_name : null,
                    'grade_level' => $gradeLevelValue,
                    'grade_level_display' => $this->getGradeDisplay($gradeLevelValue),
                    'section' => $currentEnrollment && $currentEnrollment->section ? $currentEnrollment->section->section_name : null,
                    'section_id' => $currentEnrollment ? $currentEnrollment->section_id : null,
                    'status' => $currentEnrollment ? $currentEnrollment->status : 'Not Enrolled',
                    'enrollment_id' => $currentEnrollment ? $currentEnrollment->id : null,
                    'created_at' => $user->created_at,
                ];
            });

        return response()->json([
            'success' => true,
            'students' => $students
        ]);
    }

    /**
     * Get student statistics including grade level breakdown (Kinder to Grade 6)
     */
    public function stats()
    {
        $totalStudents = User::where('role', 'Student')->count();
        $maleCount = User::where('role', 'Student')->where('gender', 'Male')->count();
        $femaleCount = User::where('role', 'Student')->where('gender', 'Female')->count();

        $thisMonth = User::where('role', 'Student')
            ->whereMonth('created_at', now()->month)
            ->whereYear('created_at', now()->year)
            ->count();

        $gradeLevelBreakdown = [];
        for ($i = 0; $i <= 6; $i++) {
            $gradeLevelBreakdown[$i] = 0;
        }

        $enrollments = Enrollment::with('section.gradeLevel')
            ->where('status', 'Active')
            ->get();

        foreach ($enrollments as $enrollment) {
            if ($enrollment->section && $enrollment->section->gradeLevel) {
                $gradeLevel = $enrollment->section->gradeLevel->grade_level;
                if (isset($gradeLevelBreakdown[$gradeLevel])) {
                    $gradeLevelBreakdown[$gradeLevel]++;
                }
            }
        }

        return response()->json([
            'success' => true,
            'stats' => [
                'totalStudents' => $totalStudents,
                'thisMonth' => $thisMonth,
                'maleCount' => $maleCount,
                'femaleCount' => $femaleCount,
                'gradeLevelBreakdown' => $gradeLevelBreakdown,
                'totalSections' => Section::count(),
            ]
        ]);
    }

    /**
     * Get single student with full details
     */
    public function show($id)
    {
        $user = User::where('role', 'Student')->with('studentInfo')->find($id);

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Student not found'
            ], 404);
        }

        $currentEnrollment = null;
        $enrollmentHistory = [];

        if ($user->studentInfo) {
            $currentEnrollment = Enrollment::where('student_id', $user->studentInfo->id)
                ->with(['section.gradeLevel', 'schoolYear'])
                ->where('status', 'Active')
                ->first();

            $enrollmentHistory = Enrollment::where('student_id', $user->studentInfo->id)
                ->with(['section.gradeLevel', 'schoolYear'])
                ->orderBy('created_at', 'desc')
                ->get()
                ->map(function($enrollment) {
                    $gradeLevelValue = $enrollment->section && $enrollment->section->gradeLevel
                        ? $enrollment->section->gradeLevel->grade_level
                        : null;
                    return [
                        'id' => $enrollment->id,
                        'school_year' => $enrollment->schoolYear ? $enrollment->schoolYear->year_start . '-' . $enrollment->schoolYear->year_end : 'N/A',
                        'grade_level' => $gradeLevelValue,
                        'grade_display' => $this->getGradeDisplay($gradeLevelValue),
                        'section' => $enrollment->section ? $enrollment->section->section_name : null,
                        'status' => $enrollment->status,
                        'date_enrolled' => $enrollment->date_enrolled,
                    ];
                });
        }

        $currentGradeLevel = null;
        if ($currentEnrollment && $currentEnrollment->section && $currentEnrollment->section->gradeLevel) {
            $currentGradeLevel = $currentEnrollment->section->gradeLevel->grade_level;
        }

        return response()->json([
            'success' => true,
            'student' => [
                'id' => $user->id,
                'lrn' => $user->studentInfo ? $user->studentInfo->lrn : null,
                'first_name' => $user->first_name,
                'middle_name' => $user->middle_name,
                'last_name' => $user->last_name,
                'gender' => $user->gender,
                'birthdate' => $user->birthdate,
                'address' => $user->address,
                'contact_number' => $user->contact_number,
                'guardian_name' => $user->studentInfo ? $user->studentInfo->guardian_name : null,
                'guardian_contact_number' => $user->studentInfo ? $user->studentInfo->guardian_contact_number : null,
                'psa_number' => $user->studentInfo ? $user->studentInfo->PSA_Number : null,
                'father_name' => $user->studentInfo ? $user->studentInfo->father_name : null,
                'mother_name' => $user->studentInfo ? $user->studentInfo->mother_name : null,
                'current_enrollment' => $currentEnrollment ? [
                    'id' => $currentEnrollment->id,
                    'grade_level' => $currentGradeLevel,
                    'grade_display' => $this->getGradeDisplay($currentGradeLevel),
                    'section' => $currentEnrollment->section ? $currentEnrollment->section->section_name : null,
                    'section_id' => $currentEnrollment->section_id,
                    'school_year' => $currentEnrollment->schoolYear ? $currentEnrollment->schoolYear->year_start . '-' . $currentEnrollment->schoolYear->year_end : 'N/A',
                    'status' => $currentEnrollment->status,
                ] : null,
                'enrollment_history' => $enrollmentHistory,
            ]
        ]);
    }

    /**
     * Get student by LRN
     */
    public function findByLrn($lrn)
    {
        $studentInfo = StudentsInfo::where('lrn', $lrn)->first();

        if (!$studentInfo) {
            return response()->json([
                'success' => false,
                'message' => 'Student not found'
            ], 404);
        }

        $user = User::where('id', $studentInfo->user_id)->first();

        $currentEnrollment = Enrollment::where('student_id', $studentInfo->id)
            ->with('section.gradeLevel')
            ->where('status', 'Active')
            ->first();

        $gradeLevelValue = null;
        if ($currentEnrollment && $currentEnrollment->section && $currentEnrollment->section->gradeLevel) {
            $gradeLevelValue = $currentEnrollment->section->gradeLevel->grade_level;
        }

        return response()->json([
            'success' => true,
            'student' => [
                'id' => $user->id,
                'lrn' => $studentInfo->lrn,
                'first_name' => $user->first_name,
                'middle_name' => $user->middle_name,
                'last_name' => $user->last_name,
                'gender' => $user->gender,
                'birthdate' => $user->birthdate,
                'address' => $user->address,
                'contact_number' => $user->contact_number,
                'guardian_name' => $studentInfo->guardian_name,
                'guardian_contact_number' => $studentInfo->guardian_contact_number,
                'psa_number' => $studentInfo->PSA_Number,
                'father_name' => $studentInfo->father_name,
                'mother_name' => $studentInfo->mother_name,
                'grade_level' => $gradeLevelValue,
                'grade_display' => $this->getGradeDisplay($gradeLevelValue),
                'section' => $currentEnrollment && $currentEnrollment->section ? $currentEnrollment->section->section_name : null,
            ]
        ]);
    }

    /**
     * Create new student (enroll)
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'lrn' => 'required|string|size:12|unique:students_info,lrn',
            'first_name' => 'required|string|max:255',
            'middle_name' => 'nullable|string|max:255',
            'last_name' => 'required|string|max:255',
            'gender' => 'required|in:Male,Female',
            'birthdate' => 'required|date',
            'address' => 'nullable|string',
            'contact_number' => 'nullable|string|max:15',
            'guardian_name' => 'required|string|max:255',
            'guardian_contact_number' => 'required|string|max:15',
            'grade_level' => 'required|integer|min:0|max:6',
            'section_id' => 'required|exists:sections,id',
            'psa_number' => 'nullable|string|unique:students_info,PSA_Number',
            'father_name' => 'nullable|string|max:255',
            'mother_name' => 'nullable|string|max:255',
            'email' => 'nullable|email|unique:users,email',
            'password' => 'required|string|min:6',
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
            $username = $request->lrn;
            $contactNumber = $request->contact_number ?? '';

            $user = User::create([
                'first_name' => strtoupper($request->first_name),
                'middle_name' => strtoupper($request->middle_name ?? ''),
                'last_name' => strtoupper($request->last_name),
                'gender' => $request->gender,
                'birthdate' => $request->birthdate,
                'address' => strtoupper($request->address ?? ''),
                'contact_number' => $contactNumber,
                'username' => $username,
                'email' => $request->email ?? null,
                'password' => Hash::make($request->password),
                'role' => 'Student',
            ]);

            $studentInfo = StudentsInfo::create([
                'user_id' => $user->id,
                'lrn' => $request->lrn,
                'PSA_Number' => $request->psa_number,
                'father_name' => strtoupper($request->father_name ?? ''),
                'mother_name' => strtoupper($request->mother_name ?? ''),
                'guardian_name' => strtoupper($request->guardian_name),
                'guardian_contact_number' => $request->guardian_contact_number,
            ]);

            $schoolYear = SchoolYear::where('is_active', true)->first();
            if (!$schoolYear) {
                $schoolYear = SchoolYear::first();
            }

            $section = Section::with('gradeLevel')->find($request->section_id);
            $sectionGradeLevel = $section && $section->gradeLevel ? $section->gradeLevel->grade_level : null;

            Enrollment::create([
                'student_id' => $studentInfo->id,
                'section_id' => $request->section_id,
                'school_year_id' => $schoolYear ? $schoolYear->id : null,
                'date_enrolled' => now(),
                'status' => 'Active',
            ]);

            StudentStatusHistory::create([
                'student_id' => $studentInfo->id,
                'school_year_id' => $schoolYear ? $schoolYear->id : null,
                'status' => 'Enrolled',
                'effective_date' => now(),
                'remarks' => 'New enrollment for SY ' . ($schoolYear ? $schoolYear->year_start . '-' . $schoolYear->year_end : 'N/A') . ' - ' . $this->getGradeDisplay($sectionGradeLevel) . ' - ' . ($section ? $section->section_name : ''),
                'changed_by' => $this->getCurrentUserId(),
            ]);

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Student enrolled successfully',
                'student' => [
                    'id' => $user->id,
                    'lrn' => $request->lrn,
                    'first_name' => $user->first_name,
                    'last_name' => $user->last_name,
                    'username' => $username,
                    'password' => $request->password,
                ]
            ], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Student enrollment failed: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to enroll student: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update student
     */
    public function update(Request $request, $id)
    {
        $user = User::where('role', 'Student')->with('studentInfo')->find($id);

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Student not found'
            ], 404);
        }

        $validator = Validator::make($request->all(), [
            'lrn' => 'nullable|string|max:12|unique:students_info,lrn,' . ($user->studentInfo ? $user->studentInfo->id : 'NULL'),
            'first_name' => 'required|string|max:255',
            'middle_name' => 'nullable|string|max:255',
            'last_name' => 'required|string|max:255',
            'gender' => 'required|in:Male,Female',
            'birthdate' => 'required|date',
            'address' => 'nullable|string',
            'contact_number' => 'nullable|string|max:15',
            'guardian_name' => 'required|string|max:255',
            'guardian_contact_number' => 'required|string|max:15',
            'psa_number' => 'nullable|string|unique:students_info,PSA_Number,' . ($user->studentInfo ? $user->studentInfo->id : 'NULL'),
            'father_name' => 'nullable|string|max:255',
            'mother_name' => 'nullable|string|max:255',
            'email' => 'nullable|email|unique:users,email,' . $user->id,
            'password' => 'nullable|string|min:6',
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
            $user->update([
                'first_name' => strtoupper($request->first_name),
                'middle_name' => strtoupper($request->middle_name ?? ''),
                'last_name' => strtoupper($request->last_name),
                'gender' => $request->gender,
                'birthdate' => $request->birthdate,
                'address' => strtoupper($request->address ?? ''),
                'contact_number' => $request->contact_number ?? '',
                'email' => $request->email ?? $user->email,
            ]);

            if ($request->filled('password')) {
                $user->update(['password' => Hash::make($request->password)]);
            }

            if ($user->studentInfo) {
                $user->studentInfo->update([
                    'lrn' => $request->lrn,
                    'PSA_Number' => $request->psa_number,
                    'father_name' => strtoupper($request->father_name ?? ''),
                    'mother_name' => strtoupper($request->mother_name ?? ''),
                    'guardian_name' => strtoupper($request->guardian_name),
                    'guardian_contact_number' => $request->guardian_contact_number,
                ]);
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Student updated successfully',
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Student update failed: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to update student: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Delete student
     */
    public function destroy($id)
    {
        $user = User::where('role', 'Student')->find($id);

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Student not found'
            ], 404);
        }

        DB::beginTransaction();

        try {
            if ($user->studentInfo) {
                Enrollment::where('student_id', $user->studentInfo->id)->delete();
                StudentStatusHistory::where('student_id', $user->studentInfo->id)->delete();
                $user->studentInfo->delete();
            }
            $user->delete();

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Student deleted successfully'
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Student deletion failed: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete student: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Transfer student to another section
     */
    public function transfer(Request $request, $id)
    {
        $user = User::where('role', 'Student')->with('studentInfo')->find($id);

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Student not found'
            ], 404);
        }

        $validator = Validator::make($request->all(), [
            'new_section_id' => 'required|exists:sections,id',
            'reason' => 'nullable|string',
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
            $studentInfo = $user->studentInfo;
            $currentEnrollment = Enrollment::where('student_id', $studentInfo->id)
                ->where('status', 'Active')
                ->first();

            if (!$currentEnrollment) {
                return response()->json([
                    'success' => false,
                    'message' => 'No active enrollment found for this student'
                ], 404);
            }

            $schoolYear = SchoolYear::where('is_active', true)->first();
            if (!$schoolYear) {
                $schoolYear = SchoolYear::first();
            }

            $currentEnrollment->update(['status' => 'Completed']);

            StudentStatusHistory::create([
                'student_id' => $studentInfo->id,
                'school_year_id' => $schoolYear ? $schoolYear->id : null,
                'status' => 'Promoted',
                'effective_date' => now(),
                'remarks' => 'Transferred to new section: ' . $request->reason,
                'changed_by' => $this->getCurrentUserId(),
            ]);

            Enrollment::create([
                'student_id' => $studentInfo->id,
                'section_id' => $request->new_section_id,
                'school_year_id' => $schoolYear ? $schoolYear->id : null,
                'date_enrolled' => now(),
                'status' => 'Active',
            ]);

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Student transferred to new section successfully'
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Student transfer failed: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to transfer student: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Drop student
     */
    public function drop(Request $request, $id)
    {
        $user = User::where('role', 'Student')->with('studentInfo')->find($id);

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Student not found'
            ], 404);
        }

        $validator = Validator::make($request->all(), [
            'reason' => 'required|string',
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
            $studentInfo = $user->studentInfo;
            $currentEnrollment = Enrollment::where('student_id', $studentInfo->id)
                ->where('status', 'Active')
                ->first();

            if (!$currentEnrollment) {
                return response()->json([
                    'success' => false,
                    'message' => 'No active enrollment found for this student'
                ], 404);
            }

            $currentEnrollment->update(['status' => 'Dropped']);

            $schoolYear = SchoolYear::where('is_active', true)->first();
            if (!$schoolYear) {
                $schoolYear = SchoolYear::first();
            }

            StudentStatusHistory::create([
                'student_id' => $studentInfo->id,
                'school_year_id' => $schoolYear ? $schoolYear->id : null,
                'status' => 'Dropped',
                'effective_date' => now(),
                'remarks' => $request->reason,
                'changed_by' => $this->getCurrentUserId(),
            ]);

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Student has been dropped successfully'
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Student drop failed: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to drop student: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get student status history
     */
    public function getStatusHistory($id)
    {
        $user = User::where('role', 'Student')->with('studentInfo')->find($id);

        if (!$user || !$user->studentInfo) {
            return response()->json([
                'success' => false,
                'message' => 'Student not found'
            ], 404);
        }

        $history = StudentStatusHistory::where('student_id', $user->studentInfo->id)
            ->with('schoolYear')
            ->orderBy('effective_date', 'desc')
            ->get()
            ->map(function($item) {
                $section = null;
                $gradeLevel = null;
                $enrollment = Enrollment::where('student_id', $item->student_id)
                    ->where('school_year_id', $item->school_year_id)
                    ->first();
                if ($enrollment && $enrollment->section && $enrollment->section->gradeLevel) {
                    $section = $enrollment->section->section_name;
                    $gradeLevel = $enrollment->section->gradeLevel->grade_level;
                }

                $changedByName = null;
                if ($item->changed_by) {
                    $changedBy = User::find($item->changed_by);
                    $changedByName = $changedBy ? $changedBy->first_name . ' ' . $changedBy->last_name : null;
                }

                return [
                    'id' => $item->id,
                    'status' => $item->status,
                    'school_year_start' => $item->schoolYear ? $item->schoolYear->year_start : null,
                    'school_year_end' => $item->schoolYear ? $item->schoolYear->year_end : null,
                    'school_year' => $item->schoolYear ? $item->schoolYear->year_start . '-' . $item->schoolYear->year_end : 'N/A',
                    'grade_level' => $gradeLevel,
                    'section' => $section,
                    'effective_date' => $item->effective_date,
                    'remarks' => $item->remarks,
                    'changed_by' => $item->changed_by,
                    'changed_by_name' => $changedByName,
                ];
            });

        return response()->json([
            'success' => true,
            'history' => $history
        ]);
    }

    /**
     * Helper: Get grade display name
     */
    private function getGradeDisplay($gradeLevel)
    {
        if ($gradeLevel === null) return 'N/A';
        if ($gradeLevel === 0) return 'Kinder';
        return 'Grade ' . $gradeLevel;
    }

    /**
     * Helper: Get current user ID
     */
    private function getCurrentUserId()
    {
        try {
            if (Auth::guard('sanctum')->check()) {
                return Auth::guard('sanctum')->id();
            }
            return null;
        } catch (\Exception $e) {
            return null;
        }
    }
}