<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Exécuter la migration - Création de la table réunions
     */
    public function up(): void
    {
        Schema::create('meetings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('project_id')->nullable()->constrained()->onDelete('set null');
            $table->string('title');
            $table->text('description')->nullable();
            $table->string('status')->default('scheduled')->comment('scheduled, in_progress, completed, cancelled');
            $table->timestamp('scheduled_at')->nullable()->comment('Date et heure prévues');
            $table->timestamp('ended_at')->nullable()->comment('Date et heure de fin');
            $table->string('location')->nullable()->comment('Lieu de la réunion');
            $table->string('meeting_url')->nullable()->comment('Lien visioconférence');
            $table->text('agenda')->nullable()->comment('Ordre du jour');
            $table->text('minutes')->nullable()->comment('Compte-rendu');
            $table->foreignId('organizer_id')->constrained('users')->onDelete('cascade')->comment('Organisateur');
            $table->timestamps();
            $table->softDeletes();

            // Index pour les recherches fréquentes
            $table->index('project_id');
            $table->index('organizer_id');
            $table->index('status');
            $table->index('scheduled_at');
        });
    }

    /**
     * Annuler la migration
     */
    public function down(): void
    {
        Schema::dropIfExists('meetings');
    }
};
