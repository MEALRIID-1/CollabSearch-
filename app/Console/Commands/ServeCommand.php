<?php

namespace App\Console\Commands;

use Illuminate\Foundation\Console\ServeCommand as BaseServeCommand;

/**
 * Surcharge de la commande serve pour augmenter les limites PHP d'upload.
 * N'affecte que ce projet, pas le php.ini systeme.
 */
class ServeCommand extends BaseServeCommand
{
    protected function serverCommand(): array
    {
        $base = parent::serverCommand();

        // Inserer les options -d apres le binaire PHP (index 0)
        array_splice($base, 1, 0, [
            '-d', 'upload_max_filesize=50M',
            '-d', 'post_max_size=50M',
        ]);

        return $base;
    }
}
