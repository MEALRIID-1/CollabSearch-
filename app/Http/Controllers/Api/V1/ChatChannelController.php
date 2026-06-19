<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreChatChannelRequest;
use App\Http\Requests\StoreChatChannelMemberRequest;
use App\Http\Requests\UpdateChatChannelRequest;
use App\Http\Resources\ChatChannelResource;
use App\Http\Resources\UserResource;
use App\Models\ChatChannel;
use App\Services\ChatService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ChatChannelController extends Controller
{
    public function __construct(private readonly ChatService $chatService) {}

    public function index(Request $request): JsonResponse
    {
        $channels = $this->chatService->listChannels(
            $request->user(),
            $request->get('project_id')
        );

        return response()->json([
            'channels' => ChatChannelResource::collection($channels),
        ]);
    }

    public function store(StoreChatChannelRequest $request): JsonResponse
    {
        $channel = $this->chatService->createChannel(
            $request->user(),
            $request->validated()
        );

        return response()->json([
            'message' => 'Canal créé avec succès.',
            'channel' => new ChatChannelResource($channel->load(['creator', 'members'])),
        ], 201);
    }

    public function show(Request $request, ChatChannel $chatChannel): JsonResponse
    {
        $channel = $this->chatService->getChannel($request->user(), $chatChannel);

        return response()->json([
            'channel' => new ChatChannelResource($channel),
        ]);
    }

    public function update(UpdateChatChannelRequest $request, ChatChannel $chatChannel): JsonResponse
    {
        $channel = $this->chatService->updateChannel(
            $request->user(),
            $chatChannel,
            $request->validated()
        );

        return response()->json([
            'message' => 'Canal mis à jour avec succès.',
            'channel' => new ChatChannelResource($channel->load(['creator', 'members'])),
        ]);
    }

    public function archive(Request $request, ChatChannel $chatChannel): JsonResponse
    {
        $channel = $this->chatService->archiveChannel($request->user(), $chatChannel);

        return response()->json([
            'message' => 'Canal archivé avec succès.',
            'channel' => new ChatChannelResource($channel),
        ]);
    }

    public function members(Request $request, ChatChannel $chatChannel): JsonResponse
    {
        $members = $this->chatService->getChannelMembers($request->user(), $chatChannel);

        return response()->json([
            'members' => UserResource::collection($members),
        ]);
    }

    public function addMember(StoreChatChannelMemberRequest $request, ChatChannel $chatChannel): JsonResponse
    {
        $member = $this->chatService->addMember(
            $request->user(),
            $chatChannel,
            $request->validated()['member_id']
        );

        return response()->json([
            'message' => 'Membre ajouté au canal.',
            'member' => new UserResource($member->user),
        ], 201);
    }

    public function removeMember(StoreChatChannelMemberRequest $request, ChatChannel $chatChannel): JsonResponse
    {
        $this->chatService->removeMember(
            $request->user(),
            $chatChannel,
            $request->validated()['member_id']
        );

        return response()->json([
            'message' => 'Membre retiré du canal.',
        ]);
    }
}
