<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Attendance;
use App\Models\Enrollment;
use App\Models\Section;
use App\Models\SchoolYear;
use App\Models\Quarter;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;

class AttendanceController extends Controller
{
    // Get attendance records for a specific section and date
    public function index(Request $request)
    {
        $request->validate([
            'section_id' => 'required|exists:sections,id',
            'date' => 'required|date',
        ]);

        $section = Section::find($request->section_id);
        
        // Get all active enrollments in the section
        $enrollments = Enrollment::where('section_id', $request->section_id)
            ->where('status', 'Active')
            ->with(['student.user', 'student'])
            ->get();
        
        // Get attendance records for the date
        $attendanceRecords = Attendance::where('date', $request->date)
            ->whereIn('enrollment_id', $enrollments->pluck('id'))
            ->get()
            ->keyBy('enrollment_id');
        
        $result = [];
        foreach ($enrollments as $enrollment) {
            $user = $enrollment->student->user;
            $attendance = $attendanceRecords->get($enrollment->id);
            
            $result[] = [
                'id' => $attendance ? $attendance->id : null,
                'student_id' => $enrollment->student_id,
                'student_name' => $user->last_name . ', ' . $user->first_name . ' ' . $user->middle_name,
                'lrn' => $enrollment->student->lrn,
                'enrollment_id' => $enrollment->id,
                'time_in' => $attendance ? $attendance->time_in : null,
                'time_out' => $attendance ? $attendance->time_out : null,
                'status' => $attendance ? $attendance->status : 'Absent',
                'remarks' => $attendance ? $attendance->remarks : null,
            ];
        }
        
        return response()->json([
            'success' => true,
            'attendance' => $result,
            'section' => [
                'id' => $section->id,
                'name' => $section->section_name,
                'grade_display' => $section->gradeLevel ? 
                    ($section->gradeLevel->grade_level == 0 ? 'Kinder' : 'Grade ' . $section->gradeLevel->grade_level) : 'N/A',
            ],
            'date' => $request->date,
        ]);
    }

    // Get attendance report
    public function report(Request $request)
    {
        $request->validate([
            'section_id' => 'required|exists:sections,id',
            'report_type' => 'required|in:daily,weekly,monthly,quarterly,custom',
            'start_date' => 'required_if:report_type,custom|date',
            'end_date' => 'required_if:report_type,custom|date',
            'quarter_id' => 'required_if:report_type,quarterly|exists:quarters,id',
        ]);

        $section = Section::find($request->section_id);
        
        // Determine date range based on report type
        list($startDate, $endDate) = $this->getDateRange($request);
        
        // Get all active enrollments in the section
        $enrollments = Enrollment::where('section_id', $request->section_id)
            ->where('status', 'Active')
            ->with(['student.user', 'student'])
            ->get();
        
        // If no enrollments, return empty report
        if ($enrollments->isEmpty()) {
            return response()->json([
                'success' => true,
                'report' => [
                    'summary' => [
                        'totalDays' => 0,
                        'totalStudents' => 0,
                        'totalAttendance' => 0,
                        'averageDailyAttendance' => 0,
                        'overallAttendanceRate' => 0,
                        'topPerformingDay' => null,
                        'lowPerformingDay' => null,
                    ],
                    'dailyStats' => [],
                    'weeklyStats' => [],
                    'monthlyStats' => [],
                    'studentRankings' => [],
                    'statusBreakdown' => ['present' => 0, 'late' => 0, 'absent' => 0],
                    'trends' => ['weekly' => [], 'monthly' => []],
                ],
                'filters' => [
                    'section' => $section->section_name,
                    'start_date' => $startDate,
                    'end_date' => $endDate,
                    'report_type' => $request->report_type,
                ]
            ]);
        }
        
        // Get attendance records for the date range
        $attendanceRecords = Attendance::whereBetween('date', [$startDate, $endDate])
            ->whereIn('enrollment_id', $enrollments->pluck('id'))
            ->get();
        
        // Calculate summary statistics
        $summary = $this->calculateSummary($attendanceRecords, $enrollments, $startDate, $endDate);
        
        // Generate daily/weekly/monthly stats
        $stats = $this->generateStats($attendanceRecords, $enrollments, $startDate, $endDate, $request->report_type);
        
        // Calculate student rankings
        $studentRankings = $this->calculateStudentRankings($attendanceRecords, $enrollments);
        
        // Calculate status breakdown
        $statusBreakdown = $this->calculateStatusBreakdown($attendanceRecords);
        
        // Calculate trends
        $trends = $this->calculateTrends($attendanceRecords, $enrollments, $startDate, $endDate);
        
        return response()->json([
            'success' => true,
            'report' => [
                'summary' => $summary,
                'dailyStats' => $stats['daily'],
                'weeklyStats' => $stats['weekly'],
                'monthlyStats' => $stats['monthly'],
                'studentRankings' => $studentRankings,
                'statusBreakdown' => $statusBreakdown,
                'trends' => $trends,
            ],
            'filters' => [
                'section' => $section->section_name,
                'start_date' => $startDate,
                'end_date' => $endDate,
                'report_type' => $request->report_type,
            ]
        ]);
    }

    private function getDateRange($request)
    {
        $today = Carbon::today();
        
        switch ($request->report_type) {
            case 'daily':
                return [$today->copy()->subDays(30)->toDateString(), $today->toDateString()];
            case 'weekly':
                return [$today->copy()->subWeeks(4)->startOfWeek()->toDateString(), $today->toDateString()];
            case 'monthly':
                return [$today->copy()->subMonths(5)->startOfMonth()->toDateString(), $today->toDateString()];
            case 'quarterly':
                $quarter = Quarter::find($request->quarter_id);
                // Fallback kung walang quarter
                if (!$quarter) {
                    return [$today->copy()->subDays(30)->toDateString(), $today->toDateString()];
                }
                return [$quarter->start_date, $quarter->end_date];
            case 'custom':
                return [$request->start_date, $request->end_date];
            default:
                return [$today->copy()->subDays(30)->toDateString(), $today->toDateString()];
        }
    }

    private function calculateSummary($attendanceRecords, $enrollments, $startDate, $endDate)
    {
        $totalDays = max(1, Carbon::parse($startDate)->diffInDays(Carbon::parse($endDate)) + 1);
        $totalStudents = $enrollments->count();
        $totalAttendance = $attendanceRecords->count();
        
        $averageDailyAttendance = $totalDays > 0 ? round($totalAttendance / $totalDays, 1) : 0;
        $overallAttendanceRate = ($totalStudents * $totalDays) > 0 
            ? round(($totalAttendance / ($totalStudents * $totalDays)) * 100, 1) 
            : 0;
        
        // Find top and low performing days
        $dailyAttendance = $attendanceRecords->groupBy('date')
            ->map(function($records, $date) use ($totalStudents) {
                $count = $records->count();
                return [
                    'date' => $date,
                    'count' => $count,
                    'rate' => $totalStudents > 0 ? round(($count / $totalStudents) * 100, 1) : 0
                ];
            });
        
        $topDay = $dailyAttendance->sortByDesc('rate')->first();
        $lowDay = $dailyAttendance->sortBy('rate')->first();
        
        return [
            'totalDays' => $totalDays,
            'totalStudents' => $totalStudents,
            'totalAttendance' => $totalAttendance,
            'averageDailyAttendance' => $averageDailyAttendance,
            'overallAttendanceRate' => $overallAttendanceRate,
            'topPerformingDay' => $topDay ? $topDay['date'] : null,
            'lowPerformingDay' => $lowDay ? $lowDay['date'] : null,
        ];
    }

    private function generateStats($attendanceRecords, $enrollments, $startDate, $endDate, $reportType)
    {
        $totalStudents = $enrollments->count();
        
        if ($reportType === 'daily') {
            // Daily stats
            $dailyStats = $attendanceRecords->groupBy('date')
                ->map(function($records, $date) use ($totalStudents) {
                    $present = $records->where('status', 'Present')->count();
                    $late = $records->where('status', 'Late')->count();
                    $absent = $totalStudents - $records->count();
                    
                    return [
                        'date' => $date,
                        'present' => $present,
                        'late' => $late,
                        'absent' => max(0, $absent),
                        'rate' => $totalStudents > 0 ? round(($records->count() / $totalStudents) * 100, 1) : 0
                    ];
                })->values()->toArray();
            
            // If no records, still return empty array
            return ['daily' => $dailyStats, 'weekly' => [], 'monthly' => []];
        } 
        
        if ($reportType === 'weekly') {
            $weeklyStats = [];
            $start = Carbon::parse($startDate);
            $end = Carbon::parse($endDate);
            
            for ($date = $start->copy(); $date <= $end; $date->addWeek()) {
                $weekStart = $date->copy()->startOfWeek();
                $weekEnd = $date->copy()->endOfWeek();
                $weekRecords = $attendanceRecords->filter(function($record) use ($weekStart, $weekEnd) {
                    $recordDate = Carbon::parse($record->date);
                    return $recordDate >= $weekStart && $recordDate <= $weekEnd;
                });
                
                $present = $weekRecords->where('status', 'Present')->count();
                $late = $weekRecords->where('status', 'Late')->count();
                $totalPossible = $totalStudents * 5;
                $rate = $totalPossible > 0 ? round(($weekRecords->count() / $totalPossible) * 100, 1) : 0;
                
                $weeklyStats[] = [
                    'week' => 'Week ' . $date->weekOfYear,
                    'present' => $present,
                    'late' => $late,
                    'absent' => max(0, ($totalStudents * 5) - $weekRecords->count()),
                    'rate' => $rate,
                ];
            }
            return ['daily' => [], 'weekly' => $weeklyStats, 'monthly' => []];
        }
        
        // Monthly stats
        $monthlyStats = [];
        $start = Carbon::parse($startDate);
        $end = Carbon::parse($endDate);
        
        for ($date = $start->copy(); $date <= $end; $date->addMonth()) {
            $monthStart = $date->copy()->startOfMonth();
            $monthEnd = $date->copy()->endOfMonth();
            $monthRecords = $attendanceRecords->filter(function($record) use ($monthStart, $monthEnd) {
                $recordDate = Carbon::parse($record->date);
                return $recordDate >= $monthStart && $recordDate <= $monthEnd;
            });
            
            $daysInMonth = $monthStart->daysInMonth;
            $present = $monthRecords->where('status', 'Present')->count();
            $late = $monthRecords->where('status', 'Late')->count();
            $totalPossible = $totalStudents * $daysInMonth;
            $rate = $totalPossible > 0 ? round(($monthRecords->count() / $totalPossible) * 100, 1) : 0;
            
            $monthlyStats[] = [
                'month' => $monthStart->format('M'),
                'present' => $present,
                'late' => $late,
                'absent' => max(0, $totalPossible - $monthRecords->count()),
                'rate' => $rate,
            ];
        }
        return ['daily' => [], 'weekly' => [], 'monthly' => $monthlyStats];
    }

    private function calculateStudentRankings($attendanceRecords, $enrollments)
    {
        $studentAttendance = [];
        $totalDays = $attendanceRecords->unique('date')->count();
        if ($totalDays === 0) return [];
        
        foreach ($enrollments as $enrollment) {
            $user = $enrollment->student->user;
            $studentRecords = $attendanceRecords->where('enrollment_id', $enrollment->id);
            $present = $studentRecords->where('status', 'Present')->count();
            $late = $studentRecords->where('status', 'Late')->count();
            $absent = $totalDays - $studentRecords->count();
            $rate = $totalDays > 0 ? round(($studentRecords->count() / $totalDays) * 100, 1) : 0;
            
            $studentAttendance[] = [
                'name' => $user->last_name . ', ' . $user->first_name,
                'present' => $present,
                'late' => $late,
                'absent' => max(0, $absent),
                'rate' => $rate
            ];
        }
        
        // Sort by rate descending
        usort($studentAttendance, function($a, $b) {
            return $b['rate'] <=> $a['rate'];
        });
        
        return array_slice($studentAttendance, 0, 10);
    }

    private function calculateStatusBreakdown($attendanceRecords)
    {
        return [
            'present' => $attendanceRecords->where('status', 'Present')->count(),
            'late' => $attendanceRecords->where('status', 'Late')->count(),
            'absent' => $attendanceRecords->where('status', 'Absent')->count(),
        ];
    }

    private function calculateTrends($attendanceRecords, $enrollments, $startDate, $endDate)
    {
        $totalStudents = $enrollments->count();
        if ($totalStudents === 0) return ['weekly' => [], 'monthly' => []];
        
        $start = Carbon::parse($startDate);
        $end = Carbon::parse($endDate);
        
        // Weekly trends
        $weeklyTrends = [];
        for ($date = $start->copy(); $date <= $end; $date->addWeek()) {
            $weekStart = $date->copy()->startOfWeek();
            $weekEnd = $date->copy()->endOfWeek();
            $weekRecords = $attendanceRecords->filter(function($record) use ($weekStart, $weekEnd) {
                $recordDate = Carbon::parse($record->date);
                return $recordDate >= $weekStart && $recordDate <= $weekEnd;
            });
            $totalPossible = $totalStudents * 5;
            $rate = $totalPossible > 0 ? round(($weekRecords->count() / $totalPossible) * 100, 1) : 0;
            $weeklyTrends[] = [
                'week' => 'Week ' . $date->weekOfYear,
                'rate' => $rate,
            ];
        }
        
        // Monthly trends
        $monthlyTrends = [];
        $monthStart = Carbon::parse($startDate)->startOfMonth();
        for ($date = $monthStart; $date <= $end; $date->addMonth()) {
            $monthStartDate = $date->copy()->startOfMonth();
            $monthEndDate = $date->copy()->endOfMonth();
            $monthRecords = $attendanceRecords->filter(function($record) use ($monthStartDate, $monthEndDate) {
                $recordDate = Carbon::parse($record->date);
                return $recordDate >= $monthStartDate && $recordDate <= $monthEndDate;
            });
            $daysInMonth = $monthStartDate->daysInMonth;
            $totalPossible = $totalStudents * $daysInMonth;
            $rate = $totalPossible > 0 ? round(($monthRecords->count() / $totalPossible) * 100, 1) : 0;
            $monthlyTrends[] = [
                'month' => $monthStartDate->format('M'),
                'rate' => $rate,
            ];
        }
        
        return [
            'weekly' => $weeklyTrends,
            'monthly' => $monthlyTrends,
        ];
    }

    // Get attendance summary for a section and quarter
    public function summary(Request $request)
    {
        $request->validate([
            'section_id' => 'required|exists:sections,id',
            'quarter_id' => 'required|exists:quarters,id',
        ]);
        
        $section = Section::find($request->section_id);
        $quarter = Quarter::find($request->quarter_id);
        
        $enrollments = Enrollment::where('section_id', $request->section_id)
            ->where('status', 'Active')
            ->get();
        
        $attendanceRecords = Attendance::whereBetween('date', [$quarter->start_date, $quarter->end_date])
            ->whereIn('enrollment_id', $enrollments->pluck('id'))
            ->get();
        
        // Daily summary
        $dailySummary = $attendanceRecords->groupBy('date')
            ->map(function($records, $date) use ($enrollments) {
                return [
                    'date' => $date,
                    'present' => $records->where('status', 'Present')->count(),
                    'late' => $records->where('status', 'Late')->count(),
                    'absent' => $enrollments->count() - $records->count(),
                ];
            })->values();
        
        return response()->json([
            'success' => true,
            'summary' => [
                'daily' => $dailySummary,
                'weekly' => [],
                'monthly' => [],
            ]
        ]);
    }
}