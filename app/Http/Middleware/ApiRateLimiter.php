<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\RateLimiter;
use Symfony\Component\HttpFoundation\Response;

/**
 * Middleware de limitation de débit API - CollabSearch
 * 
 * Limite le nombre de requêtes API par utilisateur pour
 * prévenir les abus et assurer la stabilité du service.
 */
class ApiRateLimiter
{
    /**
     * Nombre maximal de requêtes par minute
     */
    private const MAX_ATTEMPTS = 60;

    /**
     * Fenêtre de temps en minutes
     */
    private const DECAY_MINUTES = 1;

    /**
     * Traiter la requête entrante
     */
    public function handle(Request $request, Closure $next): Response
    {
        $key = $this->resolveRequestSignature($request);

        try {
            if (RateLimiter::tooManyAttempts($key, self::MAX_ATTEMPTS)) {
                return response()->json([
                    'message' => 'Trop de requêtes. Veuillez réessayer plus tard.',
                    'retry_after' => RateLimiter::availableIn($key),
                ], 429);
            }

            RateLimiter::hit($key, self::DECAY_MINUTES * 60);
        } catch (\Throwable $exception) {
            Log::warning('ApiRateLimiter cache unavailable, request will proceed without rate limiting', [
                'error' => $exception->getMessage(),
                'key' => $key,
                'user_ip' => $request->ip(),
                'user_id' => optional($request->user())->id,
            ]);

            return $next($request);
        }

        $response = $next($request);

        // Ajouter les en-têtes de limitation si possible
        try {
            $response->headers->set('X-RateLimit-Limit', self::MAX_ATTEMPTS);
            $response->headers->set('X-RateLimit-Remaining', RateLimiter::remaining($key, self::MAX_ATTEMPTS));
        } catch (\Throwable $exception) {
            Log::warning('ApiRateLimiter failed to add rate limit headers', [
                'error' => $exception->getMessage(),
                'key' => $key,
                'user_ip' => $request->ip(),
                'user_id' => optional($request->user())->id,
            ]);
        }

        return $response;
    }

    /**
     * Résoudre la signature de la requête pour la limitation
     */
    private function resolveRequestSignature(Request $request): string
    {
        if ($user = $request->user()) {
            return sha1($user->id . '|' . $request->ip());
        }

        return sha1($request->ip());
    }
}
