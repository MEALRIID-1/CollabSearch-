<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreChatMessageRequest;
use App\Http\Requests\UpdateChatMessageRequest;
use App\Http\Resources\ChatMessageResource;
use App\Models\ChatChannel;
use App\Models\ChatMessage;
use App\Services\ChatService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ChatMessageController extends Controller
{
    public function __construct(private readonly ChatService $chatService) {}

    public function index(Request $request, ChatChannel $chatChannel): JsonResponse
    {
        $messages = $this->chatService->getMessages(
            $request->user(),
            $chatChannel,
            $request->get('per_page', 30),
            $request->get('cursor')
        );

        return response()->json([
            'messages' => ChatMessageResource::collection($messages),
        ]);
    }

    public function store(StoreChatMessageRequest $request, ChatChannel $chatChannel): JsonResponse
    {
        $message = $this->chatService->sendMessage(
            $request->user(),
            $chatChannel,
            $request->validated()
        );

        return response()->json([
            'message' => 'Message envoyé avec succès.',
            'data' => new ChatMessageResource($message),
        ], 201);
    }

    public function update(UpdateChatMessageRequest $request, ChatChannel $chatChannel, ChatMessage $chatMessage): JsonResponse
    {
        if ($chatMessage->channel_id !== $chatChannel->id) {
            abort(404, 'Message introuvable dans ce canal.');
        }

        $message = $this->chatService->editMessage(
            $request->user(),
            $chatMessage,
            $request->validated()['body']
        );

        return response()->json([
            'message' => 'Message modifié avec succès.',
            'data' => new ChatMessageResource($message),
        ]);
    }

    public function destroy(Request $request, ChatChannel $chatChannel, ChatMessage $chatMessage): JsonResponse
    {
        if ($chatMessage->channel_id !== $chatChannel->id) {
            abort(404, 'Message introuvable dans ce canal.');
        }

        $message = $this->chatService->deleteMessage($request->user(), $chatMessage);

        return response()->json([
            'message' => 'Message supprimé avec succès.',
            'data' => new ChatMessageResource($message),
        ]);
    }
}
