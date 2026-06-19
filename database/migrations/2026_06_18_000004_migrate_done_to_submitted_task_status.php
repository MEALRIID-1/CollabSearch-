<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Met à jour les tâches existantes avec status='done' vers 'submitted'.
 * Nécessaire suite au renommage de TaskStatus::DONE en TaskStatus::SUBMITTED.
 */
return new class extends Migration
{
    public function up(): void
    {
        DB::statement("UPDATE tasks SET status = 'submitted' WHERE status = 'done'");
    }

    public function down(): void
    {
        DB::statement("UPDATE tasks SET status = 'done' WHERE status = 'submitted'");
    }
};
