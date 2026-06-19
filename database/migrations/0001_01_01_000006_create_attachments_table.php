<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Exécuter la migration - Création de la table pièces jointes
     */
    public function up(): void
    {
        Schema::create('attachments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('task_id')->constrained()->onDelete('cascade');
            $table->foreignId('user_id')->constrained()->onDelete('cascade')->comment('Utilisateur ayant téléversé le fichier');
            $table->string('filename')->comment('Nom du fichier stocké');
            $table->string('original_name')->comment('Nom original du fichier');
            $table->string('mime_type');
            $table->unsignedBigInteger('size')->comment('Taille en octets');
            $table->string('path')->comment('Chemin de stockage');
            $table->timestamps();

            // Index
            $table->index('task_id');
            $table->index('user_id');
            $table->index('mime_type');
        });
    }

    /**
     * Annuler la migration
     */
    public function down(): void
    {
        Schema::dropIfExists('attachments');
    }
};
