<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class RoleMiddleware
{
    public function handle(Request $request, Closure $next, ...$roles)
    {
        // Get user from request
        $user = $request->user();
        
        // Check if user is authenticated
        if (!$user) {
            if ($request->expectsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized'
                ], 401);
            }
            return redirect('/login');
        }

        // Check if user's role is allowed
        if (!in_array($user->role, $roles)) {
            if ($request->expectsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Forbidden - You do not have access to this resource.'
                ], 403);
            }
            
            // Redirect to their own dashboard based on role
            if ($user->role === 'Admin') {
                return redirect('/admin/dashboard');
            }
            if ($user->role === 'Teacher') {
                return redirect('/teacher/dashboard');
            }
            if ($user->role === 'Student') {
                return redirect('/student/dashboard');
            }
            
            abort(403, 'Unauthorized access.');
        }

        return $next($request);
    }
}