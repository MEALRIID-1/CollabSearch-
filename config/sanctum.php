<?php

use Laravel\Sanctum\Sanctum;

return [

    /*
    |--------------------------------------------------------------------------
    | Domaines avec état (Stateful)
    |--------------------------------------------------------------------------
    |
    | Requêtes depuis ces domaines recevront des cookies d'authentification
    | API stateful. Cela permet l'authentification par cookie pour
    | l'application frontend CollabSearch.
    |
    */

    'stateful' => explode(',', env('SANCTUM_STATEFUL_DOMAINS', sprintf(
        '%s%s',
        'localhost,localhost:3000,127.0.0.1,127.0.0.1:8000,::1',
        Sanctum::currentApplicationUrlWithPort()
    ))),

    /*
    |--------------------------------------------------------------------------
    | Garantie d'authentification
    |--------------------------------------------------------------------------
    */

    'guard' => [],

    /*
    |--------------------------------------------------------------------------
    | Expiration des jetons
    |--------------------------------------------------------------------------
    |
    | Durée en minutes avant l'expiration des jetons d'accès personnel.
    | Null signifie que les jetons n'expirent jamais.
    |
    */

    'expiration' => null,

    /*
    |--------------------------------------------------------------------------
    | Modèle de jeton
    |--------------------------------------------------------------------------
    */

    'token_model' => \Laravel\Sanctum\PersonalAccessToken::class,

];
