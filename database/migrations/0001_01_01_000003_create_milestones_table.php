<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Exécuter la migration - Création de la table jalons
     */
    public function up(): void
    {
        Schema::create('milestones', function (Blueprint $table) {
            $table->id();
            $table->foreignId('project_id')->constrained()->onDelete('cascade');
            $table->string('title');
            $table->text('description')->nullable();
            $table->date('due_date')->nullable()->comment('Date limite du jalon');
            $table->timestamp('completed_at')->nullable()->comment('Date de complétion');
            $table->string('status')->default('pending')->comment('pending, completed, overdue');
            $table->timestamps();

            // Index
            $table->index('project_id');
            $table->index('due_date');
            $table->index('status');
        });
    }

    /**
     * Annuler la migration
     */
    public function down(): void
    {
        Schema::dropIfExists('milestones');
    }
};
