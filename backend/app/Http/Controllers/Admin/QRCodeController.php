<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\StudentQrCode;
use App\Models\StudentsInfo;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use SimpleSoftwareIO\QrCode\Facades\QrCode;

class QRCodeController extends Controller
{
    public function stats()
    {
        $totalStudents = User::where('role', 'Student')->count();
        $hasQRCode = StudentQrCode::count();
        $noQRCode = $totalStudents - $hasQRCode;
        $generatedToday = StudentQrCode::whereDate('created_at', today())->count();
        
        return response()->json([
            'success' => true,
            'stats' => [
                'totalStudents' => $totalStudents,
                'hasQRCode' => $hasQRCode,
                'noQRCode' => $noQRCode,
                'generatedToday' => $generatedToday,
            ]
        ]);
    }
    
    public function generate(Request $request)
    {
        $request->validate([
            'student_id' => 'required|exists:students_info,id',
            'qr_data' => 'required|string',
        ]);
        
        DB::beginTransaction();
        
        try {
            $qrCode = StudentQrCode::updateOrCreate(
                ['student_id' => $request->student_id],
                ['qr_data' => $request->qr_data]
            );
            
            DB::commit();
            
            return response()->json([
                'success' => true,
                'message' => 'QR Code generated successfully',
                'qr_code' => $qrCode
            ]);
            
        } catch (\Exception $e) {
            DB::rollBack();
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to generate QR code: ' . $e->getMessage()
            ], 500);
        }
    }
    
    public function bulkGenerate(Request $request)
    {
        $students = StudentsInfo::doesntHave('qrCode')->get();
        
        DB::beginTransaction();
        
        try {
            foreach ($students as $student) {
                $user = $student->user;
                $qrData = json_encode([
                    'student_id' => $student->id,
                    'lrn' => $student->lrn,
                    'name' => $user->first_name . ' ' . $user->last_name,
                    'grade_level' => $student->enrollments()->latest()->first()?->section?->grade_level,
                ]);
                
                StudentQrCode::updateOrCreate(
                    ['student_id' => $student->id],
                    ['qr_data' => $qrData]
                );
            }
            
            DB::commit();
            
            return response()->json([
                'success' => true,
                'message' => 'Bulk QR codes generated successfully',
                'count' => $students->count()
            ]);
            
        } catch (\Exception $e) {
            DB::rollBack();
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to generate QR codes: ' . $e->getMessage()
            ], 500);
        }
    }
    
    public function getStudentQR($id)
    {
        $student = StudentsInfo::with('qrCode')->find($id);
        
        if (!$student) {
            return response()->json([
                'success' => false,
                'message' => 'Student not found'
            ], 404);
        }
        
        return response()->json([
            'success' => true,
            'qr_code' => $student->qrCode
        ]);
    }
}