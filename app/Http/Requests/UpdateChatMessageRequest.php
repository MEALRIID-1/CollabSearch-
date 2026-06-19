<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateChatMessageRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'body' => ['required', 'string', 'max:10000'],
        ];
    }

    public function messages(): array
    {
        return [
            'body.required' => 'Le corps du message est requis.',
            'body.max' => 'Le message ne doit pas dépasser 10000 caractères.',
        ];
    }
}
