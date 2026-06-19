<?php

namespace App\Services;

use App\Models\Meeting;
use App\Models\User;

/**
 * Service Jitsi Meet - CollabSearch
 *
 * Génération de salles, JWT et URLs pour la visioconférence intégrée.
 */
class JitsiService
{
    /**
     * Générer un identifiant unique de salle Jitsi
     */
    public function generateRoomId(Meeting $meeting): string
    {
        $projectId = $meeting->project_id ?? 'general';

        return sprintf('collabsearch-%s-%s', $projectId, $meeting->id);
    }

    /**
     * Générer un JWT signé pour l'accès sécurisé à une salle
     */
    public function generateJWT(User $user, string $roomId): ?string
    {
        $secret = config('jitsi.app_secret');

        if (empty($secret)) {
            return null;
        }

        $serverUrl = config('jitsi.server_url');
        $host = parse_url($serverUrl, PHP_URL_HOST) ?? 'meet.jit.si';
        $now = time();
        $expiration = $now + config('jitsi.jwt_expiration', 3600);

        $payload = [
            'aud' => 'jitsi',
            'iss' => config('jitsi.app_id'),
            'sub' => $host,
            'room' => $roomId,
            'exp' => $expiration,
            'nbf' => $now - 10,
            'context' => [
                'user' => [
                    'id' => (string) $user->id,
                    'name' => $user->full_name,
                    'email' => $user->email,
                    'moderator' => true,
                ],
            ],
        ];

        $header = ['alg' => 'HS256', 'typ' => 'JWT'];
        $segments = [
            $this->base64UrlEncode(json_encode($header)),
            $this->base64UrlEncode(json_encode($payload)),
        ];

        $signature = hash_hmac('sha256', implode('.', $segments), $secret, true);
        $segments[] = $this->base64UrlEncode($signature);

        return implode('.', $segments);
    }

    /**
     * Obtenir l'URL complète de la salle Jitsi
     */
    public function getRoomUrl(string $roomId): string
    {
        return config('jitsi.server_url') . '/' . $roomId;
    }

    /**
     * Extraire le domaine Jitsi depuis l'URL serveur
     */
    public function getDomain(): string
    {
        return parse_url(config('jitsi.server_url'), PHP_URL_HOST) ?? 'meet.jit.si';
    }

    /**
     * Encoder en base64 URL-safe
     */
    private function base64UrlEncode(string $data): string
    {
        return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
    }
}
