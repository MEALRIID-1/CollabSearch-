<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

/**
 * Requête d'envoi de message - CollabSearch
 */
class StoreMessageRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'recipient_id' => ['nullable', 'exists:users,id', 'required_without:conversation_id'],
            'conversation_id' => ['nullable', 'integer', 'exists:conversations,id'],
            'project_id' => ['nullable', 'exists:projects,id'],
            'subject' => ['nullable', 'string', 'max:255'],
            'content' => ['required_without:attachment_ids', 'string', 'max:10000'],
            'parent_id' => ['nullable', 'exists:messages,id'],
            'attachment_ids' => ['nullable', 'array'],
            'attachment_ids.*' => ['integer', 'exists:attachments,id'],
        ];
    }

    public function messages(): array
    {
        return [
            'recipient_id.required' => 'Le destinataire est obligatoire.',
            'recipient_id.exists' => 'Le destinataire sélectionné n\'existe pas.',
            'content.required_without' => 'Le message doit contenir du texte ou au moins une pièce jointe.',
            'content.max' => 'Le message ne doit pas dépasser 10000 caractères.',
            'parent_id.exists' => 'Le message parent n\'existe pas.',
            'project_id.exists' => 'Le projet sélectionné n\'existe pas.',
            'attachment_ids.array' => 'Les pièces jointes doivent être un tableau.',
            'attachment_ids.*.integer' => 'Chaque ID de pièce jointe doit être un nombre entier.',
            'attachment_ids.*.exists' => 'Une ou plusieurs pièces jointes n\'existent pas.',
        ];
    }
}
