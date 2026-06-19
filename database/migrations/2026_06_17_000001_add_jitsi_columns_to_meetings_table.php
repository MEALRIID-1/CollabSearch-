<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Ajouter les colonnes Jitsi à la table réunions
     */
    public function up(): void
    {
        Schema::table('meetings', function (Blueprint $table) {
            $table->string('jitsi_room_id', 200)->nullable()->after('meeting_url');
            $table->text('jitsi_jwt_token')->nullable()->after('jitsi_room_id');
            $table->string('recording_url', 500)->nullable()->after('jitsi_jwt_token');
            $table->text('recording_transcript')->nullable()->after('recording_url');
            $table->text('meeting_summary')->nullable()->after('recording_transcript');
            $table->timestamp('started_at')->nullable()->after('meeting_summary')->comment('Début effectif de la visioconférence');
            $table->integer('actual_duration_minutes')->nullable()->after('started_at');
        });
    }

    /**
     * Annuler la migration
     */
    public function down(): void
    {
        Schema::table('meetings', function (Blueprint $table) {
            $table->dropColumn([
                'jitsi_room_id',
                'jitsi_jwt_token',
                'recording_url',
                'recording_transcript',
                'meeting_summary',
                'started_at',
                'actual_duration_minutes',
            ]);
        });
    }
};
