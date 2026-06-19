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
        Schema::create('admin_user_memberships', function (Blueprint $table) {
            $table->id();
            $table->foreignId('admin_id')
                ->constrained('users')
                ->onDelete('cascade');
            $table->foreignId('user_id')
                ->constrained('users')
                ->onDelete('cascade');
            $table->enum('origin', ['created', 'invited'])
                ->default('created');
            $table->boolean('is_active')->default(true);
            $table->timestamp('added_at')->useCurrent();

            $table->unique(['admin_id', 'user_id']);
            $table->index('admin_id');
            $table->index('user_id');
        });
    }

    /**
     * Annuler la migration.
     */
    public function down(): void
    {
        Schema::dropIfExists('admin_user_memberships');
    }
};
