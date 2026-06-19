<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Exécuter la migration - Création de la table tâches
     */
    public function up(): void
    {
        Schema::create('tasks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('project_id')->constrained()->onDelete('cascade');
            $table->foreignId('milestone_id')->nullable()->constrained()->onDelete('set null');
            $table->string('title');
            $table->text('description')->nullable();
            $table->string('status')->default('todo')->comment('todo, in_progress, done, validated');
            $table->string('priority')->default('medium')->comment('low, medium, high, urgent');
            $table->foreignId('assignee_id')->nullable()->constrained('users')->onDelete('set null')->comment('Chercheur assigné');
            $table->date('due_date')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->timestamp('validated_at')->nullable();
            $table->foreignId('validated_by')->nullable()->constrained('users')->onDelete('set null')->comment('Validateur');
            $table->timestamps();
            $table->softDeletes();

            // Index pour les recherches fréquentes
            $table->index('project_id');
            $table->index('milestone_id');
            $table->index('assignee_id');
            $table->index('status');
            $table->index('priority');
            $table->index('due_date');
        });
    }

    /**
     * Annuler la migration
     */
    public function down(): void
    {
        Schema::dropIfExists('tasks');
    }
};
