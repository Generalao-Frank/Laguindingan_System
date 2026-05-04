<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;

class ProfileController extends Controller
{
    // Get user profile with profile picture
    public function getProfile(Request $request)
    {
        $user = $request->user();
        
        return response()->json([
            'success' => true,
            'user' => [
                'id' => $user->id,
                'first_name' => $user->first_name,
                'last_name' => $user->last_name,
                'middle_name' => $user->middle_name,
                'username' => $user->username,
                'role' => $user->role,
                'profile_picture' => $user->profile_picture,
                'profile_picture_url' => $user->profile_picture ? asset('storage/' . $user->profile_picture) : null,
            ]
        ]);
    }

    // Upload profile picture
    public function uploadProfile(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'profile_picture' => 'required|image|mimes:jpeg,png,jpg,gif|max:2048',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $user = $request->user();
        
        // Delete old profile picture if exists
        if ($user->profile_picture && Storage::disk('public')->exists($user->profile_picture)) {
            Storage::disk('public')->delete($user->profile_picture);
        }
        
        // Store new profile picture
        $file = $request->file('profile_picture');
        $filename = time() . '_' . $user->id . '.' . $file->getClientOriginalExtension();
        $path = $file->storeAs('profile_pictures', $filename, 'public');
        
        // Update user record
        $user->profile_picture = $path;
        $user->save();
        
        return response()->json([
            'success' => true,
            'message' => 'Profile picture uploaded successfully',
            'profile_picture_url' => asset('storage/' . $path),
            'profile_picture_path' => $path
        ], 200);
    }

    // Remove profile picture
    public function removeProfile(Request $request)
    {
        $user = $request->user();
        
        if ($user->profile_picture && Storage::disk('public')->exists($user->profile_picture)) {
            Storage::disk('public')->delete($user->profile_picture);
        }
        
        $user->profile_picture = null;
        $user->save();
        
        return response()->json([
            'success' => true,
            'message' => 'Profile picture removed successfully'
        ]);
    }
}