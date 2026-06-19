<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Exécuter la migration - Création de la table messages
     */
    public function up(): void
    {
        Schema::create('messages', function (Blueprint $table) {
            $table->id();
            $table->foreignId('sender_id')->constrained('users')->onDelete('cascade')->comment('Expéditeur');
            $table->foreignId('recipient_id')->constrained('users')->onDelete('cascade')->comment('Destinataire');
            $table->foreignId('project_id')->nullable()->constrained()->onDelete('set null');
            $table->string('subject')->nullable();
            $table->text('content');
            $table->boolean('is_read')->default(false);
            $table->timestamp('read_at')->nullable();
            $table->foreignId('parent_id')->nullable()->constrained('messages')->onDelete('set null')->comment('Message parent pour les fils de discussion');
            $table->timestamps();
            $table->softDeletes();

            // Index pour les recherches fréquentes
            $table->index('sender_id');
            $table->index('recipient_id');
            $table->index('project_id');
            $table->index('is_read');
            $table->index('parent_id');
            $table->index('created_at');
        });
    }

    /**
     * Annuler la migration
     */
    public function down(): void
    {
        Schema::dropIfExists('messages');
    }
};
