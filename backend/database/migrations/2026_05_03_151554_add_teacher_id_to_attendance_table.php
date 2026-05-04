<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
  public function up()
{
    Schema::table('attendance', function (Blueprint $table) {
        $table->foreignId('teacher_id')->constrained('teachers')->cascadeOnDelete();
        $table->unique(['enrollment_id', 'teacher_id', 'date'], 'attendance_unique_record');
    });
}

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('attendance', function (Blueprint $table) {
            //
        });
    }
};
