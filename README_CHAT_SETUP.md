# Chat realtime setup

## Dépendances frontend

1. Depuis `frontend` :

```bash
npm install
```

2. Assure-toi d'avoir ajouté les variables d'environnement suivantes dans `.env.local` :

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_PUSHER_APP_KEY=your-pusher-key
NEXT_PUBLIC_PUSHER_APP_CLUSTER=mt1
NEXT_PUBLIC_PUSHER_HOST=127.0.0.1
NEXT_PUBLIC_PUSHER_PORT=6001
NEXT_PUBLIC_PUSHER_SCHEME=http
```

## Backend

1. Vérifie que `BROADCAST_DRIVER=pusher` ou `reverb` est configuré dans `.env`.
2. Lance le serveur Laravel :

```bash
php artisan serve --port=8000
```

3. Si tu utilises `pusher` local, démarre aussi `laravel-echo-server` ou ton équivalent.

## Tester

1. Lancer frontend :

```bash
npm run dev
```

2. Ouvrir deux onglets dans le chat et envoyer des messages/réactions.

## Notes

- Le composant `ConversationPanel` s'abonne au canal `chat.{channelId}`.
- Les événements broadcastés sont `MessageSent`, `ReactionAdded`, `MessageEdited`, `MessageDeleted`.
- Si `getEcho()` retourne `null`, le chat continue en polling via React Query, sans websocket.
