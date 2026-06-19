<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Spatie\Permission\Exceptions\UnauthorizedException;
use Symfony\Component\HttpFoundation\Response;

/**
 * Middleware de vérification de rôle - CollabSearch
 * 
 * Vérifie que l'utilisateur authentifié possède le rôle requis
 * en utilisant le package Spatie Laravel Permission.
 */
class CheckRole
{
    /**
     * Traiter la requête entrante
     * 
     * @param Request $request
     * @param Closure $next
     * @param string ...$roles Rôles autorisés
     */
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        if (!$request->user()) {
            return response()->json([
                'message' => 'Non authentifié.',
            ], 401);
        }

        if (empty($roles)) {
            return $next($request);
        }

        if (!$request->user()->hasAnyRole($roles)) {
            return response()->json([
                'message' => 'Accès non autorisé. Rôle insuffisant.',
                'required_roles' => $roles,
            ], 403);
        }

        return $next($request);
    }
}
