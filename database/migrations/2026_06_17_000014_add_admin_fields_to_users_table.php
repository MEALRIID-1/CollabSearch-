<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Exécuter la migration.
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->foreignId('created_by_admin_id')
                ->nullable()
                ->after('deleted_at')
                ->constrained('users')
                ->nullOnDelete();
            $table->boolean('must_change_password')->default(false)->after('created_by_admin_id');
        });
    }

    /**
     * Annuler la migration.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('must_change_password');
            $table->dropForeign(['created_by_admin_id']);
            $table->dropColumn('created_by_admin_id');
        });
    }
};
