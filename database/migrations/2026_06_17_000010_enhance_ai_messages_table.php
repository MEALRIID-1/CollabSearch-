<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('ai_messages', function (Blueprint $table) {
            $table->float('confidence_score')->nullable()->after('reasoning'); // 0.0 à 1.0
            $table->json('sources')->nullable()->after('confidence_score');   // Sources web [{title, url}]
            $table->json('metadata')->nullable()->after('sources');           // Métadonnées libres
            $table->integer('tokens_used')->nullable()->after('metadata');    // Tokens LLM consommés
            $table->boolean('is_clarification')->default(false)->after('tokens_used'); // L'IA demande une précision
            $table->text('clarification_question')->nullable()->after('is_clarification');
        });
    }

    public function down(): void
    {
        Schema::table('ai_messages', function (Blueprint $table) {
            $table->dropColumn([
                'confidence_score',
                'sources',
                'metadata',
                'tokens_used',
                'is_clarification',
                'clarification_question',
            ]);
        });
    }
};
