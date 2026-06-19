<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('ai_analyses', function (Blueprint $table) {
            $table->id();
            $table->char('uuid', 36)->unique();
            $table->string('analysable_type', 100);
            $table->unsignedBigInteger('analysable_id');
            $table->foreignId('requested_by')->constrained('users')->onDelete('cascade');
            $table->string('type'); // Using string for flexibility with Enums
            $table->string('status')->default('pending'); // Using string for status flexibility
            $table->integer('input_tokens')->nullable();
            $table->integer('output_tokens')->nullable();
            $table->string('model_used', 100)->nullable();
            $table->json('result')->nullable();
            $table->text('error_message')->nullable();
            $table->integer('processing_time_ms')->nullable();
            $table->timestamps();

            // Indexes
            $table->index(['analysable_type', 'analysable_id']);
            $table->index('status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('ai_analyses');
    }
};
