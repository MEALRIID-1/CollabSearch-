<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('attachments', function (Blueprint $table) {
            $table->boolean('is_encrypted')->default(false)->after('path')->comment('Indique si le fichier est chiffré');
            $table->string('signature')->nullable()->after('is_encrypted')->comment('Signature HMAC du contenu du fichier');
            $table->text('iv')->nullable()->after('signature')->comment('Vecteur d\'initialisation utilisé pour le chiffrement');
        });
    }

    public function down(): void
    {
        Schema::table('attachments', function (Blueprint $table) {
            $table->dropColumn(['is_encrypted', 'signature', 'iv']);
        });
    }
};
