<?php

use App\Models\ChatChannelMember;
use Illuminate\Support\Facades\Broadcast;

Broadcast::channel('chat.{channelId}', function ($user, $channelId) {
    return ChatChannelMember::where('channel_id', $channelId)
        ->where('user_id', $user->id)
        ->exists();
});

Broadcast::channel('presence-global', function ($user) {
    return [
        'id' => $user->uuid ?? $user->id,
        'name' => $user->full_name,
        'avatar' => $user->avatar,
    ];
});
