<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Configuration Jitsi Meet - CollabSearch
    |--------------------------------------------------------------------------
    */

    'app_id' => env('JITSI_APP_ID', 'collabsearch'),

    'app_secret' => env('JITSI_APP_SECRET'),

    'server_url' => rtrim(env('JITSI_SERVER_URL', 'https://meet.jit.si'), '/'),

    'webhook_secret' => env('JITSI_WEBHOOK_SECRET'),

    'jwt_expiration' => (int) env('JITSI_JWT_EXPIRATION', 3600),

];
