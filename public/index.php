<?php

use Illuminate\Http\Request;

define('LARAVEL_START', microtime(true));

/*
|--------------------------------------------------------------------------
| Vérification de la maintenance
|--------------------------------------------------------------------------
|
| Si l'application est en mode maintenance, une page spéciale est
| affichée pour informer les utilisateurs que le site est
| temporairement indisponible.
|
*/

if (file_exists($maintenance = __DIR__.'/../storage/framework/maintenance.php')) {
    require $maintenance;
}

/*
|--------------------------------------------------------------------------
| Enregistrement de l'autoloader
|--------------------------------------------------------------------------
|
| L'autoloader Composer charge automatiquement toutes les classes
| nécessaires au fonctionnement de l'application CollabSearch.
|
*/

require __DIR__.'/../vendor/autoload.php';

/*
|--------------------------------------------------------------------------
| Exécution de l'application
|--------------------------------------------------------------------------
|
| Démarre l'application Laravel et traite la requête entrante
| pour la renvoyer au navigateur du client.
|
*/

(function () {
    $app = require_once __DIR__.'/../bootstrap/app.php';

    $kernel = $app->make(Illuminate\Contracts\Http\Kernel::class);

    $response = $kernel->handle(
        $request = Request::capture()
    );

    $response->send();

    $kernel->terminate($request, $response);
})();
