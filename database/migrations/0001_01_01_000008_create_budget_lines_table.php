<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Exécuter la migration - Création de la table lignes budgétaires
     */
    public function up(): void
    {
        Schema::create('budget_lines', function (Blueprint $table) {
            $table->id();
            $table->foreignId('project_id')->constrained()->onDelete('cascade');
            $table->string('category')->comment('personnel, materiel, mission, publication, autre');
            $table->string('description');
            $table->decimal('amount_planned', 15, 2)->default(0)->comment('Montant prévu');
            $table->decimal('amount_spent', 15, 2)->default(0)->comment('Montant dépensé');
            $table->date('date')->nullable();
            $table->text('justification')->nullable()->comment('Justification de la dépense');
            $table->string('reference_document')->nullable()->comment('Document de référence');
            $table->timestamps();

            // Index pour les recherches fréquentes
            $table->index('project_id');
            $table->index('category');
            $table->index('date');
        });
    }

    /**
     * Annuler la migration
     */
    public function down(): void
    {
        Schema::dropIfExists('budget_lines');
    }
};
