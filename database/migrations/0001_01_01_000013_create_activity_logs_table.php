<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Exécuter la migration - Création de la table journal d'activité
     */
    public function up(): void
    {
        Schema::create('activity_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained()->onDelete('set null')->comment('Utilisateur ayant effectué l\'action');
            $table->foreignId('project_id')->nullable()->constrained()->onDelete('set null');
            $table->string('action')->comment('Type d\'action : create, update, delete, etc.');
            $table->text('description')->nullable()->comment('Description de l\'action');
            $table->string('subject_type')->nullable()->comment('Type du sujet (classe du modèle)');
            $table->unsignedBigInteger('subject_id')->nullable()->comment('ID du sujet');
            $table->json('properties')->nullable()->comment('Propriétés supplémentaires');
            $table->string('ip_address', 45)->nullable();
            $table->string('user_agent')->nullable();
            $table->timestamps();

            // Index pour les recherches fréquentes
            $table->index('user_id');
            $table->index('project_id');
            $table->index('action');
            $table->index(['subject_type', 'subject_id']);
            $table->index('created_at');
        });
    }

    /**
     * Annuler la migration
     */
    public function down(): void
    {
        Schema::dropIfExists('activity_logs');
    }
};
