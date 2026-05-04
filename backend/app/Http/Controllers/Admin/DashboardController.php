<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\SchoolYear;
use App\Models\Quarter;
use App\Models\Subject;
use App\Models\Section;
use App\Models\Enrollment;
use App\Models\Attendance;
use App\Models\ActivityLog;
use App\Models\StudentsInfo;
use App\Models\Grade; // Idinagdag para sa subject performance
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    /**
     * Get all dashboard statistics in one endpoint.
     */
    public function index()
    {
        try {
            // --- Basic counts ---
            $totalStudents = User::where('role', 'Student')->count();
            $totalTeachers = User::where('role', 'Teacher')->count();
            $totalSections = Section::count();

            // --- Gender breakdown (Male / Female) ---
            $maleCount = User::where('role', 'Student')->where('gender', 'Male')->count();
            $femaleCount = User::where('role', 'Student')->where('gender', 'Female')->count();
            $genderData = [
                ['name' => 'Male', 'value' => $maleCount, 'fill' => '#3B82F6'],
                ['name' => 'Female', 'value' => $femaleCount, 'fill' => '#EC4899']
            ];

            // --- Active enrollments (kasalukuyang school year) ---
            $activeSchoolYear = SchoolYear::where('is_active', true)->first();
            $enrollmentsQuery = Enrollment::where('status', 'Active');
            if ($activeSchoolYear) {
                $enrollmentsQuery->where('school_year_id', $activeSchoolYear->id);
            }
            $activeEnrollments = $enrollmentsQuery->count();
            $enrollmentRate = $totalStudents > 0 ? round(($activeEnrollments / $totalStudents) * 100, 1) : 0;

            // --- Attendance rate (kasalukuyang quarter) ---
            $attendanceRate = 0;
            $activeQuarter = null;
            if ($activeSchoolYear) {
                $activeQuarter = Quarter::where('school_year_id', $activeSchoolYear->id)
                    ->where('is_active', true)
                    ->first();
            }
            $attendanceQuery = Attendance::query();
            if ($activeQuarter) {
                $attendanceQuery->whereBetween('date', [$activeQuarter->start_date, $activeQuarter->end_date]);
            }
            $totalAttendanceRecords = $attendanceQuery->count();
            $presentRecords = (clone $attendanceQuery)->where('status', 'Present')->count();
            if ($totalAttendanceRecords > 0) {
                $attendanceRate = round(($presentRecords / $totalAttendanceRecords) * 100, 1);
            }

            // --- Graduation rate (Completed enrollments / Total enrollments) ---
            $totalEnrollments = Enrollment::count();
            $completedEnrollments = Enrollment::where('status', 'Completed')->count();
            $graduationRate = $totalEnrollments > 0 ? round(($completedEnrollments / $totalEnrollments) * 100, 1) : 0;

            // --- Grade level breakdown (Kinder hanggang Grade 6) ---
            $gradeLevelBreakdown = [];
            for ($i = 0; $i <= 6; $i++) {
                $gradeLevelBreakdown[$i] = 0;
            }
            $enrollmentsWithSection = Enrollment::with('section.gradeLevel')
                ->where('status', 'Active')
                ->get();
            foreach ($enrollmentsWithSection as $enrollment) {
                if ($enrollment->section && $enrollment->section->gradeLevel) {
                    $grade = $enrollment->section->gradeLevel->grade_level;
                    if (isset($gradeLevelBreakdown[$grade])) {
                        $gradeLevelBreakdown[$grade]++;
                    }
                }
            }
            $gradeLevelLabels = [
                0 => 'Kinder',
                1 => 'Grade 1',
                2 => 'Grade 2',
                3 => 'Grade 3',
                4 => 'Grade 4',
                5 => 'Grade 5',
                6 => 'Grade 6',
            ];
            $gradeLevelData = [];
            foreach ($gradeLevelBreakdown as $grade => $count) {
                $gradeLevelData[] = [
                    'grade' => $gradeLevelLabels[$grade] ?? "Grade $grade",
                    'students' => $count,
                ];
            }

            // --- Recent Activities (huling 5 aktibidad) ---
            $recentActivities = ActivityLog::with('user')
                ->orderBy('created_at', 'desc')
                ->limit(5)
                ->get()
                ->map(function($log) {
                    return [
                        'id' => $log->id,
                        'action' => $log->description ?? $log->action_type . ' on ' . $log->table_name,
                        'user' => $log->user ? $log->user->first_name . ' ' . $log->user->last_name : 'System',
                        'time' => $log->created_at->diffForHumans(),
                        'color' => $this->getActivityColor($log->action_type),
                        'icon' => $log->action_type,
                    ];
                });

            // --- Recent Enrollments (huling 4 na aktibong enrollment) ---
            $recentEnrollments = Enrollment::with(['student.user', 'section.gradeLevel'])
                ->where('status', 'Active')
                ->orderBy('created_at', 'desc')
                ->limit(4)
                ->get()
                ->map(function($enrollment) {
                    $user = $enrollment->student->user;
                    $gradeDisplay = $enrollment->section && $enrollment->section->gradeLevel
                        ? ($enrollment->section->gradeLevel->grade_level == 0 ? 'Kinder' : 'Grade ' . $enrollment->section->gradeLevel->grade_level)
                        : 'N/A';
                    return [
                        'id' => $enrollment->id,
                        'name' => $user->last_name . ', ' . $user->first_name,
                        'lrn' => $enrollment->student->lrn,
                        'grade' => $gradeDisplay,
                        'section' => $enrollment->section ? $enrollment->section->section_name : 'N/A',
                        'date' => $enrollment->created_at->format('Y-m-d'),
                    ];
                });

            // --- Enrollment Trend (buwanang bilang para sa kasalukuyang taon) ---
            $enrollmentTrend = [];
            $currentYear = now()->year;
            for ($month = 1; $month <= 12; $month++) {
                $count = Enrollment::whereYear('created_at', $currentYear)
                    ->whereMonth('created_at', $month)
                    ->count();
                $enrollmentTrend[] = [
                    'month' => date('M', mktime(0, 0, 0, $month, 1)),
                    'enrolled' => $count,
                ];
            }

            // --- Subject Performance (average final grade per subject) ---
            $subjectPerformance = [];
            // Pagsamahin ang mga grades ayon sa subject
            $gradeSubjects = Grade::with('subject')
                ->whereNotNull('final_grade')
                ->get()
                ->groupBy('subject_id');
            foreach ($gradeSubjects as $subjectId => $grades) {
                $subject = $grades->first()->subject;
                $average = round($grades->avg('final_grade'), 1);
                $subjectPerformance[] = [
                    'subject' => $subject->subject_name,
                    'avg' => $average,
                ];
            }
            // Pag-uri-uriin pababa at kunin ang top 5
            usort($subjectPerformance, fn($a, $b) => $b['avg'] <=> $a['avg']);
            $subjectPerformance = array_slice($subjectPerformance, 0, 5);

            // --- Attendance by Quarter (para sa apat na quarter ng aktibong school year) ---
            $attendanceByQuarter = [];
            if ($activeSchoolYear) {
                $quarters = Quarter::where('school_year_id', $activeSchoolYear->id)->get();
                foreach ($quarters as $quarter) {
                    $records = Attendance::whereBetween('date', [$quarter->start_date, $quarter->end_date])->get();
                    $total = $records->count();
                    $present = $records->where('status', 'Present')->count();
                    $late = $records->where('status', 'Late')->count();
                    $absent = $records->where('status', 'Absent')->count();
                    $attendanceByQuarter[] = [
                        'quarter' => $quarter->name,
                        'present' => $present,
                        'late' => $late,
                        'absent' => $absent,
                        'rate' => $total > 0 ? round(($present / $total) * 100, 1) : 0,
                    ];
                }
            } else {
                $attendanceByQuarter = [
                    ['quarter' => '1st Qtr', 'present' => 0, 'late' => 0, 'absent' => 0, 'rate' => 0],
                    ['quarter' => '2nd Qtr', 'present' => 0, 'late' => 0, 'absent' => 0, 'rate' => 0],
                    ['quarter' => '3rd Qtr', 'present' => 0, 'late' => 0, 'absent' => 0, 'rate' => 0],
                    ['quarter' => '4th Qtr', 'present' => 0, 'late' => 0, 'absent' => 0, 'rate' => 0],
                ];
            }

            return response()->json([
                'success' => true,
                'stats' => [
                    'totalStudents' => $totalStudents,
                    'totalTeachers' => $totalTeachers,
                    'totalSections' => $totalSections,
                    'activeEnrollments' => $activeEnrollments,
                    'enrollmentRate' => $enrollmentRate,
                    'attendanceRate' => $attendanceRate,
                    'graduationRate' => $graduationRate,
                ],
                'genderData' => $genderData,               // idinagdag
                'gradeLevelData' => $gradeLevelData,
                'enrollmentTrend' => $enrollmentTrend,
                'attendanceByQuarter' => $attendanceByQuarter,
                'subjectPerformance' => $subjectPerformance, // aktibo na
                'recentActivities' => $recentActivities,
                'recentEnrollments' => $recentEnrollments,
                'activeSchoolYear' => $activeSchoolYear ? $activeSchoolYear->year_start . '-' . $activeSchoolYear->year_end : null,
                'activeQuarter' => $activeQuarter ? $activeQuarter->name : null,
            ]);

        } catch (\Exception $e) {
            ActivityLog::error('Dashboard error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to load dashboard data: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Helper: Kulay para sa activity log
     */
    private function getActivityColor($actionType)
    {
        $colors = [
            'CREATE' => 'emerald',
            'UPDATE' => 'blue',
            'DELETE' => 'red',
            'LOGIN' => 'indigo',
            'LOGOUT' => 'gray',
            'UPLOAD' => 'purple',
            'TRANSFER' => 'orange',
            'ENROLL' => 'green',
            'DROP' => 'rose',
            'GRADE_UPDATE' => 'yellow',
        ];
        return $colors[$actionType] ?? 'gray';
    }
}