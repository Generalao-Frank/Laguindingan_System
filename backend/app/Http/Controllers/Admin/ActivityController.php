<?php
// app/Http/Controllers/Teacher/ActivityController.php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;
use App\Models\Activity;
use App\Models\Submission;
use App\Models\Section;
use App\Models\Subject;
use App\Models\TeacherAssignment;
use App\Models\Enrollment;
use App\Models\StudentsInfo;
use App\Models\User;

class ActivityController extends Controller
{
    /**
     * Kunin ang mga sections na itinuturo ng kasalukuyang guro.
     */
    public function getSections(Request $request)
    {
        $teacherId = $request->user()->teacher->id;
        $sections = TeacherAssignment::where('teacher_id', $teacherId)
            ->with('section')
            ->get()
            ->pluck('section')
            ->unique('id')
            ->values();

        return response()->json([
            'success' => true,
            'sections' => $sections->map(fn($s) => [
                'id' => $s->id,
                'section_name' => $s->section_name,
            ]),
        ]);
    }

    /**
     * Kunin ang mga subject na itinuturo ng kasalukuyang guro.
     */
    public function getSubjects(Request $request)
    {
        $teacherId = $request->user()->teacher->id;
        $subjects = TeacherAssignment::where('teacher_id', $teacherId)
            ->with('subject')
            ->get()
            ->pluck('subject')
            ->unique('id')
            ->values();

        return response()->json([
            'success' => true,
            'subjects' => $subjects->map(fn($s) => [
                'id' => $s->id,
                'subject_name' => $s->subject_name,
            ]),
        ]);
    }

    /**
     * Listahan ng mga activities (na may filter sa section at subject).
     */
    public function index(Request $request)
    {
        $teacherId = $request->user()->teacher->id;

        $query = Activity::where('teacher_id', $teacherId)
            ->with(['section', 'subject']);

        if ($request->has('section_id') && $request->section_id) {
            $query->where('section_id', $request->section_id);
        }
        if ($request->has('subject_id') && $request->subject_id) {
            $query->where('subject_id', $request->subject_id);
        }

        $activities = $query->orderBy('created_at', 'desc')->get();

        $result = $activities->map(function ($activity) {
            return [
                'id' => $activity->id,
                'title' => $activity->title,
                'description' => $activity->description,
                'deadline' => $activity->deadline,
                'max_points' => $activity->max_points,
                'section_id' => $activity->section_id,
                'section_name' => $activity->section->section_name ?? null,
                'subject_id' => $activity->subject_id,
                'subject_name' => $activity->subject->subject_name ?? null,
                'created_at' => $activity->created_at,
            ];
        });

        return response()->json([
            'success' => true,
            'activities' => $result,
        ]);
    }

    /**
     * Gumawa ng bagong activity.
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'deadline' => 'nullable|date',
            'max_points' => 'required|integer|min:1',
            'section_id' => 'required|exists:sections,id',
            'subject_id' => 'required|exists:subjects,id',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        $teacherId = $request->user()->teacher->id;

        // Siguraduhing ang guro ay itinalaga sa section at subject na ito
        $assignment = TeacherAssignment::where('teacher_id', $teacherId)
            ->where('section_id', $request->section_id)
            ->where('subject_id', $request->subject_id)
            ->exists();

        if (!$assignment) {
            return response()->json([
                'success' => false,
                'message' => 'You are not assigned to this section and subject.',
            ], 403);
        }

        $activity = Activity::create([
            'teacher_id' => $teacherId,
            'section_id' => $request->section_id,
            'subject_id' => $request->subject_id,
            'title' => $request->title,
            'description' => $request->description,
            'deadline' => $request->deadline,
            'max_points' => $request->max_points,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Activity created successfully',
            'activity' => $activity,
        ], 201);
    }

    /**
     * I-update ang activity.
     */
    public function update(Request $request, $id)
    {
        $activity = Activity::find($id);
        if (!$activity) {
            return response()->json(['success' => false, 'message' => 'Activity not found'], 404);
        }

        $teacherId = $request->user()->teacher->id;
        if ($activity->teacher_id !== $teacherId) {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
        }

        $validator = Validator::make($request->all(), [
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'deadline' => 'nullable|date',
            'max_points' => 'required|integer|min:1',
            'section_id' => 'required|exists:sections,id',
            'subject_id' => 'required|exists:subjects,id',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        $activity->update([
            'title' => $request->title,
            'description' => $request->description,
            'deadline' => $request->deadline,
            'max_points' => $request->max_points,
            'section_id' => $request->section_id,
            'subject_id' => $request->subject_id,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Activity updated successfully',
            'activity' => $activity,
        ]);
    }

    /**
     * Burahin ang activity at ang lahat ng submissions nito.
     */
    public function destroy(Request $request, $id)
    {
        $activity = Activity::find($id);
        if (!$activity) {
            return response()->json(['success' => false, 'message' => 'Activity not found'], 404);
        }

        $teacherId = $request->user()->teacher->id;
        if ($activity->teacher_id !== $teacherId) {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
        }

        $activity->delete();

        return response()->json([
            'success' => true,
            'message' => 'Activity deleted successfully',
        ]);
    }

    /**
     * Kunin ang lahat ng submissions para sa isang activity.
     */
    public function submissions(Request $request, $activityId)
    {
        $activity = Activity::find($activityId);
        if (!$activity) {
            return response()->json(['success' => false, 'message' => 'Activity not found'], 404);
        }

        $teacherId = $request->user()->teacher->id;
        if ($activity->teacher_id !== $teacherId) {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
        }

        // Kunin ang lahat ng enrollments sa section na ito
        $enrollments = Enrollment::where('section_id', $activity->section_id)
            ->with(['student.user', 'student'])
            ->get();

        $submissions = Submission::where('activity_id', $activityId)
            ->get()
            ->keyBy('enrollment_id');

        $result = [];
        foreach ($enrollments as $enrollment) {
            $student = $enrollment->student;
            $user = $student->user;
            $submission = $submissions->get($enrollment->id);

            $result[] = [
                'id' => $submission ? $submission->id : null,
                'enrollment_id' => $enrollment->id,
                'student_name' => $user->last_name . ', ' . $user->first_name . ' ' . $user->middle_name,
                'lrn' => $student->lrn,
                'image_path' => $submission ? $submission->image_path : null,
                'points_earned' => $submission ? $submission->points_earned : null,
                'feedback' => $submission ? $submission->feedback : null,
                'submitted_at' => $submission ? $submission->created_at : null,
            ];
        }

        return response()->json([
            'success' => true,
            'submissions' => $result,
        ]);
    }

    /**
     * I-grade ang isang submission (mag-update ng points at feedback).
     */
    public function gradeSubmission(Request $request, $submissionId)
    {
        $submission = Submission::find($submissionId);
        if (!$submission) {
            return response()->json(['success' => false, 'message' => 'Submission not found'], 404);
        }

        $activity = $submission->activity;
        $teacherId = $request->user()->teacher->id;
        if ($activity->teacher_id !== $teacherId) {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
        }

        $validator = Validator::make($request->all(), [
            'points_earned' => 'required|integer|min:0|max:' . $activity->max_points,
            'feedback' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        $submission->update([
            'points_earned' => $request->points_earned,
            'feedback' => $request->feedback,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Grade saved successfully',
            'submission' => $submission,
        ]);
    }
}