<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreChatChannelMemberRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'member_id' => ['required', 'integer', 'exists:users,id'],
        ];
    }

    public function messages(): array
    {
        return [
            'member_id.required' => 'L\'identifiant du membre est requis.',
            'member_id.integer' => 'L\'identifiant du membre doit être un entier.',
            'member_id.exists' => 'Le membre sélectionné n\'existe pas.',
        ];
    }
}
