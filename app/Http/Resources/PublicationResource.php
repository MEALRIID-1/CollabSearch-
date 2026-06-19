<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Ressource Publication - CollabSearch
 */
class PublicationResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'title' => $this->title,
            'type' => $this->type?->value,
            'type_label' => $this->type?->label(),
            'authors' => $this->authors,
            'authors_list' => $this->authors_list,
            'abstract' => $this->abstract,
            'doi' => $this->doi,
            'journal' => $this->journal,
            'conference_name' => $this->conference_name,
            'year' => $this->year,
            'volume' => $this->volume,
            'pages' => $this->pages,
            'publisher' => $this->publisher,
            'url' => $this->url,
            'keywords' => $this->keywords,
            'is_published' => $this->is_published,
            'pdf_path' => $this->pdf_path,
            'pdf_url' => $this->pdf_path ? url('storage/' . $this->pdf_path) : null,
            'apa_citation' => $this->apa_citation,
            'bibtex_citation' => $this->bibtex_citation,
            'project' => new ProjectResource($this->whenLoaded('project')),
            'creator' => new UserResource($this->whenLoaded('creator')),
            'co_authors' => UserResource::collection($this->whenLoaded('coAuthors')),
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
