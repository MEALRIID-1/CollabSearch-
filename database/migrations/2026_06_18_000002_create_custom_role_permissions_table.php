<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('custom_role_permissions', function (Blueprint $table) {
            $table->foreignId('role_id')->constrained('custom_roles')->onDelete('cascade');
            $table->string('permission_key', 100);
            $table->primary(['role_id', 'permission_key'], 'role_permission_pk');
            $table->index('permission_key');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('custom_role_permissions');
    }
};
