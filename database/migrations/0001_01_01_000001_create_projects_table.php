<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Exécuter la migration - Création de la table projets
     */
    public function up(): void
    {
        Schema::create('projects', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->text('description')->nullable();
            $table->string('status')->default('draft')->comment('draft, submitted, approved, rejected, active, archived');
            $table->foreignId('lead_id')->constrained('users')->onDelete('cascade')->comment('Chef de projet');
            $table->date('start_date')->nullable();
            $table->date('end_date')->nullable();
            $table->decimal('budget_allocated', 15, 2)->default(0);
            $table->decimal('budget_used', 15, 2)->default(0);
            $table->string('reference')->unique()->nullable()->comment('Référence unique du projet');
            $table->json('keywords')->nullable()->comment('Mots-clés de recherche');
            $table->string('laboratory')->nullable()->comment('Laboratoire de recherche');
            $table->string('funding_source')->nullable()->comment('Source de financement');
            $table->timestamps();
            $table->softDeletes();

            // Index pour les recherches fréquentes
            $table->index('status');
            $table->index('lead_id');
            $table->index('start_date');
            $table->index('end_date');
            $table->index('laboratory');
        });
    }

    /**
     * Annuler la migration
     */
    public function down(): void
    {
        Schema::dropIfExists('projects');
    }
};
