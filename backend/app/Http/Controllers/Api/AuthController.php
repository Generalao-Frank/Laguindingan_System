<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;

class AuthController extends Controller
{
    public function login(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'username' => 'required|string',
            'password' => 'required|string',
            'device_type' => 'nullable|in:web,mobile',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $user = User::where('username', $request->username)->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid username or password.'
            ], 401);
        }

        $deviceType = $request->device_type ?? 'web';

        // For WEB access: ONLY Admin can login
        if ($deviceType === 'web' && $user->role !== 'Admin') {
            return response()->json([
                'success' => false,
                'message' => 'Only Admin can access the web portal.'
            ], 403);
        }
        
        // For MOBILE access: ONLY Teacher and Student can login
        if ($deviceType === 'mobile' && $user->role === 'Admin') {
            return response()->json([
                'success' => false,
                'message' => 'Admin must use the web portal.'
            ], 403);
        }

        // CREATE TOKEN - ITO ANG KULANG
        $token = $user->createToken($deviceType . '_token')->plainTextToken;

        return response()->json([
            'success' => true,
            'message' => 'Login successful',
            'token' => $token,
            'user' => [
                'id' => $user->id,
                'username' => $user->username,
                'first_name' => $user->first_name,
                'last_name' => $user->last_name,
                'middle_name' => $user->middle_name,
                'role' => $user->role,
                'profile_picture' => $user->profile_picture,
                'profile_picture_url' => $user->profile_picture ? asset('storage/' . $user->profile_picture) : null,
            ]
        ], 200);
    }

    public function logout(Request $request)
    {
        if ($request->user()) {
            $request->user()->currentAccessToken()->delete();
        }
        
        return response()->json([
            'success' => true,
            'message' => 'Logged out successfully'
        ]);
    }

    public function me(Request $request)
    {
        $user = $request->user();
        
        return response()->json([
            'success' => true,
            'user' => [
                'id' => $user->id,
                'username' => $user->username,
                'first_name' => $user->first_name,
                'last_name' => $user->last_name,
                'middle_name' => $user->middle_name,
                'role' => $user->role,
                'profile_picture' => $user->profile_picture,
                'profile_picture_url' => $user->profile_picture ? asset('storage/' . $user->profile_picture) : null,
            ]
        ]);
    }
}