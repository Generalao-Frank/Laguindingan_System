<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Meeting;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;

class MeetingController extends Controller
{
    /**
     * Display a listing of meetings with optional filters.
     */
    public function index(Request $request)
    {
        $query = Meeting::with('creator')->orderBy('meeting_datetime', 'desc');

        if ($request->has('audience') && $request->audience) {
            $query->where('audience', $request->audience);
        }
        if ($request->has('status') && $request->status) {
            $query->where('status', $request->status);
        }
        if ($request->has('search') && $request->search) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%");
            });
        }

        $meetings = $query->get()->map(function ($meeting) {
            return [
                'id' => $meeting->id,
                'title' => $meeting->title,
                'description' => $meeting->description,
                'location' => $meeting->location,
                'meeting_datetime' => $meeting->meeting_datetime,
                'audience' => $meeting->audience,
                'status' => $meeting->status,
                'creator_name' => $meeting->creator ? $meeting->creator->first_name . ' ' . $meeting->creator->last_name : 'System',
                'created_at' => $meeting->created_at,
                'updated_at' => $meeting->updated_at,
            ];
        });

        return response()->json([
            'success' => true,
            'meetings' => $meetings,
        ]);
    }

    /**
     * Store a newly created meeting.
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'location' => 'nullable|string|max:255',
            'meeting_datetime' => 'required|date',
            'audience' => 'required|in:Teachers,Students,All',
            'status' => 'sometimes|in:Scheduled,Completed,Cancelled',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        $meeting = Meeting::create([
            'created_by' => Auth::id(),
            'title' => $request->title,
            'description' => $request->description,
            'location' => $request->location,
            'meeting_datetime' => $request->meeting_datetime,
            'audience' => $request->audience,
            'status' => $request->status ?? 'Scheduled',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Meeting created successfully',
            'meeting' => $meeting,
        ], 201);
    }

    /**
     * Update the specified meeting.
     */
    public function update(Request $request, $id)
    {
        $meeting = Meeting::find($id);
        if (!$meeting) {
            return response()->json(['success' => false, 'message' => 'Meeting not found'], 404);
        }

        $validator = Validator::make($request->all(), [
            'title' => 'sometimes|required|string|max:255',
            'description' => 'nullable|string',
            'location' => 'nullable|string|max:255',
            'meeting_datetime' => 'sometimes|required|date',
            'audience' => 'sometimes|required|in:Teachers,Students,All',
            'status' => 'sometimes|required|in:Scheduled,Completed,Cancelled',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        $meeting->update($request->only([
            'title', 'description', 'location', 'meeting_datetime', 'audience', 'status'
        ]));

        return response()->json([
            'success' => true,
            'message' => 'Meeting updated successfully',
            'meeting' => $meeting,
        ]);
    }

    /**
     * Remove the specified meeting.
     */
    public function destroy($id)
    {
        $meeting = Meeting::find($id);
        if (!$meeting) {
            return response()->json(['success' => false, 'message' => 'Meeting not found'], 404);
        }

        $meeting->delete();

        return response()->json([
            'success' => true,
            'message' => 'Meeting deleted successfully',
        ]);
    }
}