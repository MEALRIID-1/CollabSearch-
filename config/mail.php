<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Pilote de messagerie par défaut
    |--------------------------------------------------------------------------
    |
    | CollabSearch utilise SMTP pour l'envoi d'e-mails de notification
    | et de communication entre les membres de l'équipe de recherche.
    |
    */

    'default' => env('MAIL_MAILER', 'smtp'),

    /*
    |--------------------------------------------------------------------------
    | Configurations de messagerie
    |--------------------------------------------------------------------------
    */

    'mailers' => [

        'smtp' => [
            'transport' => 'smtp',
            'url' => env('MAIL_URL'),
            'host' => env('MAIL_HOST', 'smtp.mailgun.org'),
            'port' => env('MAIL_PORT', 587),
            'encryption' => env('MAIL_ENCRYPTION', 'tls'),
            'username' => env('MAIL_USERNAME'),
            'password' => env('MAIL_PASSWORD'),
            'timeout' => null,
            'local_domain' => env('MAIL_EHLO_DOMAIN', parse_url(env('APP_URL', 'http://localhost'), PHP_URL_HOST)),
        ],

        'ses' => [
            'transport' => 'ses',
        ],

        'postmark' => [
            'transport' => 'postmark',
            'message_stream_id' => env('POSTMARK_MESSAGE_STREAM_ID'),
            'client' => [
                'timeout' => 5,
            ],
        ],

        'sendmail' => [
            'transport' => 'sendmail',
            'path' => env('MAIL_SENDMAIL_PATH', '/usr/sbin/sendmail -bs -t'),
        ],

        'log' => [
            'transport' => 'log',
            'channel' => env('MAIL_LOG_CHANNEL'),
        ],

        'array' => [
            'transport' => 'array',
        ],

        'failover' => [
            'transport' => 'failover',
            'mailers' => [
                'smtp',
                'log',
            ],
        ],

        'roundrobin' => [
            'transport' => 'roundrobin',
            'mailers' => [
                'ses',
                'postmark',
            ],
        ],

    ],

    /*
    |--------------------------------------------------------------------------
    | Adresse d'expédition globale
    |--------------------------------------------------------------------------
    |
    | Adresse e-mail utilisée par défaut pour tous les e-mails
    | envoyés par l'application CollabSearch.
    |
    */

    'from' => [
        'address' => env('MAIL_FROM_ADDRESS', 'hello@collabsearch.com'),
        'name' => env('MAIL_FROM_NAME', 'CollabSearch'),
    ],

];
