<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Exécuter la migration - Création de la table pivot réunion-utilisateur
     */
    public function up(): void
    {
        Schema::create('meeting_user', function (Blueprint $table) {
            $table->id();
            $table->foreignId('meeting_id')->constrained()->onDelete('cascade');
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('status')->default('pending')->comment('pending, accepted, declined, tentative');
            $table->timestamp('response_at')->nullable()->comment('Date de réponse à l\'invitation');
            $table->timestamps();

            // Contrainte d'unicité pour éviter les doublons
            $table->unique(['meeting_id', 'user_id']);

            // Index
            $table->index('status');
        });
    }

    /**
     * Annuler la migration
     */
    public function down(): void
    {
        Schema::dropIfExists('meeting_user');
    }
};
