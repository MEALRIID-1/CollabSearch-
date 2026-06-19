<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Exécuter la migration - Ajouter le support des liens aux pièces jointes
     */
    public function up(): void
    {
        Schema::table('attachments', function (Blueprint $table) {
            $table->string('link_url')->nullable()->after('path')->comment('URL du lien partagé');
        });
    }

    /**
     * Annuler la migration
     */
    public function down(): void
    {
        Schema::table('attachments', function (Blueprint $table) {
            $table->dropColumn('link_url');
        });
    }
};
