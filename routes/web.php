<?php

use Illuminate\Support\Facades\Storage;

/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
|
| Route de secours pour servir les fichiers du disque public sous
| php artisan serve sur Windows (les jonctions ne sont pas suivies
| automatiquement par le serveur built-in de PHP).
|
*/

Route::get('/storage/{path}', function (string $path) {
    if (!Storage::disk('public')->exists($path)) {
        abort(404);
    }

    $fullPath = Storage::disk('public')->path($path);
    $mimeType = Storage::disk('public')->mimeType($path) ?: 'application/octet-stream';

    return response()->file($fullPath, [
        'Content-Type' => $mimeType,
    ]);
})->where('path', '.*');
