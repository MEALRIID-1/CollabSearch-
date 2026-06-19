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
        Schema::create('chat_channels', function (Blueprint $table) {
            $table->id();
            $table->char('uuid', 36)->unique();
            $table->foreignId('project_id')->nullable()->constrained('projects')->onDelete('set null');
            $table->string('name', 100);
            $table->text('description')->nullable();
            $table->enum('type', ['project_general', 'topic', 'direct'])->default('project_general');
            $table->foreignId('created_by')->constrained('users')->onDelete('restrict');
            $table->boolean('is_archived')->default(false);
            $table->timestamps();

            $table->index('project_id');
            $table->index('type');
            $table->index('created_by');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('chat_channels');
    }
};
