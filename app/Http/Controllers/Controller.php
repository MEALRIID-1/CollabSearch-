<?php

namespace App\Http\Controllers;

use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Foundation\Bus\DispatchesJobs;
use Illuminate\Foundation\Validation\ValidatesRequests;

/**
 * Contrôleur de base - CollabSearch
 * 
 * Contrôleur parent pour tous les contrôleurs de l'application.
 * Fournit les fonctionnalités communes et l'autorisation.
 */
abstract class Controller
{
    use AuthorizesRequests, DispatchesJobs, ValidatesRequests;
}
