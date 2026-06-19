<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Drop foreign key, alter column to nullable, then re-add foreign key
        Schema::table('messages', function (Blueprint $table) {
            $table->dropForeign(['recipient_id']);
        });

        DB::statement('ALTER TABLE `messages` MODIFY `recipient_id` BIGINT UNSIGNED NULL');

        Schema::table('messages', function (Blueprint $table) {
            $table->foreign('recipient_id')->references('id')->on('users')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('messages', function (Blueprint $table) {
            $table->dropForeign(['recipient_id']);
        });

        DB::statement('ALTER TABLE `messages` MODIFY `recipient_id` BIGINT UNSIGNED NOT NULL');

        Schema::table('messages', function (Blueprint $table) {
            $table->foreign('recipient_id')->references('id')->on('users')->onDelete('cascade');
        });
    }
};
