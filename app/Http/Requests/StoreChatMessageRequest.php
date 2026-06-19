<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreChatMessageRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'body' => ['required_without:file', 'string', 'max:10000'],
            'type' => ['required', 'in:text,file,system'],
            'parent_id' => ['nullable', 'exists:chat_messages,id'],
        ];
    }

    public function messages(): array
    {
        return [
            'body.required_without' => 'Le message doit contenir du texte ou un fichier.',
            'body.max' => 'Le message ne doit pas dépasser 10000 caractères.',
            'type.in' => 'Le type de message est invalide.',
            'parent_id.exists' => 'Le message parent n\'existe pas.',
        ];
    }
}
