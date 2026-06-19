<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Exécuter la migration - Ajouter support des pièces jointes aux messages
     */
    public function up(): void
    {
        Schema::table('attachments', function (Blueprint $table) {
            $table->foreignId('message_id')->nullable()->after('task_id')->constrained('messages')->onDelete('cascade')->comment('Message associé');
            $table->string('media_type')->nullable()->after('mime_type')->comment('Type de média: image, file, voice, video');
            
            // Rendre task_id nullable pour supporter les attachments de messages
            $table->foreignId('task_id')->nullable()->change();
        });
    }

    /**
     * Annuler la migration
     */
    public function down(): void
    {
        Schema::table('attachments', function (Blueprint $table) {
            $table->dropForeignIdFor('message_id');
            $table->dropColumn('message_id');
            $table->dropColumn('media_type');
            $table->foreignId('task_id')->nullable(false)->change();
        });
    }
};
