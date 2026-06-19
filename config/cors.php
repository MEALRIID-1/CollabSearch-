<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Configuration CORS (Partage de ressources entre origines)
    |--------------------------------------------------------------------------
    |
    | Ces paramètres contrôlent le partage de ressources entre origines
    | pour l'API CollabSearch, permettant au frontend React de
    | communiquer avec le backend Laravel.
    |
    */

    'paths' => ['api/*', 'sanctum/csrf-cookie'],

    'allowed_methods' => ['*'],

    'allowed_origins' => [env('FRONTEND_URL', 'http://localhost:3000')],

    'allowed_origins_patterns' => [],

    'allowed_headers' => ['*'],

    'exposed_headers' => [],

    'max_age' => 0,

    'supports_credentials' => true,

];
