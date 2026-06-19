<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('custom_roles', function (Blueprint $table) {
            $table->id();
            $table->char('uuid', 36)->unique();
            $table->foreignId('admin_id')->constrained('users')->onDelete('cascade');
            $table->string('name', 100);
            $table->string('slug', 100);
            $table->string('color', 7)->default('#6366F1');
            $table->string('description', 500)->nullable();
            $table->boolean('is_system')->default(false);
            $table->integer('users_count')->default(0);
            $table->timestamps();

            $table->unique(['admin_id', 'slug']);
            $table->index('admin_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('custom_roles');
    }
};
