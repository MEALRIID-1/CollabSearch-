<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Connexion de file d'attente par défaut
    |--------------------------------------------------------------------------
    |
    | CollabSearch utilise Redis pour la gestion des files d'attente,
    | permettant le traitement asynchrone des notifications et rapports.
    |
    */

    'default' => env('QUEUE_CONNECTION', 'redis'),

    /*
    |--------------------------------------------------------------------------
    | Connexions de files d'attente
    |--------------------------------------------------------------------------
    */

    'connections' => [

        'sync' => [
            'driver' => 'sync',
        ],

        'database' => [
            'driver' => 'database',
            'table' => 'jobs',
            'queue' => 'default',
            'retry_after' => 90,
            'after_commit' => true,
        ],

        'redis' => [
            'driver' => 'redis',
            'connection' => 'default',
            'queue' => env('REDIS_QUEUE', 'default'),
            'retry_after' => 90,
            'block_for' => null,
            'after_commit' => true,
        ],

    ],

    /*
    |--------------------------------------------------------------------------
    | Taux de panne des tâches
    |--------------------------------------------------------------------------
    */

    'failed' => [
        'driver' => env('QUEUE_FAILED_DRIVER', 'database-uuids'),
        'database' => env('DB_CONNECTION', 'mysql'),
        'table' => 'failed_jobs',
    ],

];
