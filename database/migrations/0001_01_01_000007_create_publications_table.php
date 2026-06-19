<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Exécuter la migration - Création de la table publications
     */
    public function up(): void
    {
        Schema::create('publications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('project_id')->nullable()->constrained()->onDelete('set null');
            $table->foreignId('created_by')->constrained('users')->onDelete('cascade');
            $table->string('title');
            $table->string('type')->comment('article, conference, these, rapport, livre');
            $table->json('authors')->nullable()->comment('Liste des auteurs');
            $table->text('abstract')->nullable();
            $table->string('doi', 255)->nullable()->comment('Identifiant DOI');
            $table->string('journal')->nullable()->comment('Nom du journal');
            $table->string('conference_name')->nullable()->comment('Nom de la conférence');
            $table->integer('year')->nullable();
            $table->string('volume')->nullable();
            $table->string('pages')->nullable();
            $table->string('publisher')->nullable();
            $table->string('pdf_path')->nullable()->comment('Chemin vers le fichier PDF');
            $table->string('url')->nullable()->comment('Lien vers la publication');
            $table->json('keywords')->nullable()->comment('Mots-clés de la publication');
            $table->boolean('is_published')->default(false)->comment('Statut de publication');
            $table->timestamps();
            $table->softDeletes();

            // Index pour les recherches fréquentes
            $table->index('project_id');
            $table->index('created_by');
            $table->index('type');
            $table->index('year');
            $table->index('doi');
            $table->index('is_published');
        });
    }

    /**
     * Annuler la migration
     */
    public function down(): void
    {
        Schema::dropIfExists('publications');
    }
};
