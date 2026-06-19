<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('ai_conversations', function (Blueprint $table) {
            // Résumé glissant mis à jour après chaque échange
            $table->text('context_summary')->nullable()->after('summary');
            // Métadonnées de la conversation (sujets, projets évoqués, décisions)
            $table->json('context_metadata')->nullable()->after('context_summary');
            // Export activé/désactivé
            $table->timestamp('exported_at')->nullable()->after('context_metadata');
        });
    }

    public function down(): void
    {
        Schema::table('ai_conversations', function (Blueprint $table) {
            $table->dropColumn(['context_summary', 'context_metadata', 'exported_at']);
        });
    }
};
