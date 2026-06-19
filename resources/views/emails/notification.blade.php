<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>{{ $subject }}</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background-color: #f8f9fa; border-radius: 8px; padding: 24px; margin-bottom: 20px;">
        <h2 style="color: #2d3748; margin-top: 0;">CollabSearch</h2>
        <p style="color: #718096; margin-bottom: 0;">Gestion d'équipes de recherche scientifique</p>
    </div>

    <div style="padding: 16px 0;">
        <p>Bonjour {{ $user->first_name }},</p>

        <div style="background-color: #ffffff; border-left: 4px solid #4299e1; padding: 12px 16px; margin: 16px 0;">
            {!! nl2br(e($content)) !!}
        </div>

        @if($actionUrl)
        <div style="text-align: center; margin: 24px 0;">
            <a href="{{ $actionUrl }}" style="background-color: #4299e1; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                {{ $actionText ?? 'Voir les détails' }}
            </a>
        </div>
        @endif
    </div>

    <div style="border-top: 1px solid #e2e8f0; padding-top: 16px; margin-top: 24px; color: #a0aec0; font-size: 12px;">
        <p>Ce message a été envoyé automatiquement par CollabSearch. Merci de ne pas y répondre directement.</p>
    </div>
</body>
</html>
