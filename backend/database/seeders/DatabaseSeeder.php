<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use App\Models\User;
use App\Models\Teacher;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // ==================== CREATE ADMIN ====================
        User::create([
            'first_name' => 'Frank',
            'middle_name' => 'James',
            'last_name' => 'Generalao',
            'gender' => 'Male',
            'suffix' => null,
            'birthdate' => '1985-05-15',
            'address' => 'Laguindingan, Misamis Oriental',
            'contact_number' => '09171234567',
            'profile_picture' => null,  // <-- Add this
            'username' => 'admin',
            'password' => Hash::make('admin123'),
            'role' => 'Admin',
            'fcm_token' => null,
        ]);

        // ==================== CREATE TEACHER ====================
        $teacherUser = User::create([
            'first_name' => 'Maria',
            'middle_name' => 'C',
            'last_name' => 'Santos',
            'gender' => 'Female',
            'suffix' => null,
            'birthdate' => '1990-08-22',
            'address' => 'Laguindingan, Misamis Oriental',
            'contact_number' => '09179876543',
            'profile_picture' => null,  // <-- Add this
            'username' => 'TCH-2024-001',
            'password' => Hash::make('password123'),
            'role' => 'Teacher',
            'fcm_token' => null,
        ]);

        Teacher::create([
            'user_id' => $teacherUser->id,
            'employee_id' => 'TCH-2024-001',
        ]);

        $this->command->info('========================================');
        $this->command->info('✅ DATABASE SEEDING COMPLETED!');
        $this->command->info('========================================');
        $this->command->info('');
        $this->command->info('📝 ACCOUNTS CREATED:');
        $this->command->info('');
        $this->command->info('👑 ADMIN:');
        $this->command->info('   Username: admin');
        $this->command->info('   Password: admin123');
        $this->command->info('   Name: Frank James Rodriguez');
        $this->command->info('');
        $this->command->info('👩‍🏫 TEACHER:');
        $this->command->info('   Username: TCH-2024-001');
        $this->command->info('   Password: password123');
        $this->command->info('   Name: Maria C. Santos');
        $this->command->info('========================================');
    }
}