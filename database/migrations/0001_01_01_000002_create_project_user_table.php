<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Exécuter la migration - Création de la table pivot projet-utilisateur
     */
    public function up(): void
    {
        Schema::create('project_user', function (Blueprint $table) {
            $table->id();
            $table->foreignId('project_id')->constrained()->onDelete('cascade');
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('role')->default('member')->comment('Rôle dans le projet : lead, member, observer');
            $table->timestamp('joined_at')->nullable()->comment('Date d\'adhésion au projet');
            $table->timestamps();

            // Contrainte d'unicité pour éviter les doublons
            $table->unique(['project_id', 'user_id']);

            // Index
            $table->index('role');
        });
    }

    /**
     * Annuler la migration
     */
    public function down(): void
    {
        Schema::dropIfExists('project_user');
    }
};
