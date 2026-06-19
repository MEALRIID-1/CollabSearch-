<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreChatReactionRequest;
use App\Models\ChatChannel;
use App\Models\ChatMessage;
use App\Services\ChatService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ChatReactionController extends Controller
{
    public function __construct(private readonly ChatService $chatService) {}

    public function store(StoreChatReactionRequest $request, ChatChannel $chatChannel, ChatMessage $chatMessage): JsonResponse
    {
        if ($chatMessage->channel_id !== $chatChannel->id) {
            abort(404, 'Message introuvable dans ce canal.');
        }

        $reaction = $this->chatService->toggleReaction(
            $request->user(),
            $chatMessage,
            $request->validated()['emoji']
        );

        return response()->json([
            'message' => $reaction->wasRecentlyCreated ? 'Réaction ajoutée.' : 'Réaction supprimée.',
            'reaction' => [
                'id' => $reaction->id,
                'message_id' => $reaction->message_id,
                'emoji' => $reaction->emoji,
                'user_id' => $reaction->user_id,
            ],
        ], $reaction->wasRecentlyCreated ? 201 : 200);
    }

    public function destroy(Request $request, ChatChannel $chatChannel, ChatMessage $chatMessage): JsonResponse
    {
        if ($chatMessage->channel_id !== $chatChannel->id) {
            abort(404, 'Message introuvable dans ce canal.');
        }

        $this->chatService->removeReaction(
            $request->user(),
            $chatMessage,
            $request->get('emoji')
        );

        return response()->json([
            'message' => 'Réaction retirée.',
        ]);
    }
}
