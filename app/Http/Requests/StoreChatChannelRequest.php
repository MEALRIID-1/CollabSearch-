<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreChatChannelRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'project_id' => ['nullable', 'exists:projects,id'],
            'name' => ['required', 'string', 'max:100'],
            'description' => ['nullable', 'string'],
            'type' => ['required', 'in:project_general,topic,direct'],
            'member_ids' => ['nullable', 'array'],
            'member_ids.*' => ['integer', 'exists:users,id'],
        ];
    }

    public function messages(): array
    {
        return [
            'name.required' => 'Le nom du canal est requis.',
            'name.max' => 'Le nom du canal ne peut pas dépasser 100 caractères.',
            'type.in' => 'Le type de canal est invalide.',
            'project_id.exists' => 'Le projet sélectionné n\'existe pas.',
            'member_ids.array' => 'Les membres doivent être fournis sous forme de tableau.',
            'member_ids.*.exists' => 'Un membre sélectionné n\'existe pas.',
        ];
    }
}
