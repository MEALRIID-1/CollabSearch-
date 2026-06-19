<?php

namespace App\Models;

use App\Enums\PublicationType;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

/**
 * Modèle Publication - CollabSearch
 * 
 * Représente une publication scientifique associée à un projet.
 * Types : article, conférence, thèse, rapport, livre
 */
class Publication extends Model
{
    use HasFactory;

    /**
     * Attributs massivement assignables
     */
    protected $fillable = [
        'project_id',
        'created_by',
        'title',
        'type',
        'authors',
        'abstract',
        'doi',
        'journal',
        'conference_name',
        'year',
        'volume',
        'pages',
        'publisher',
        'pdf_path',
        'url',
        'keywords',
        'is_published',
    ];

    /**
     * Casts de type d'attribut
     */
    protected function casts(): array
    {
        return [
            'type' => PublicationType::class,
            'authors' => 'array',
            'keywords' => 'array',
            'year' => 'integer',
            'is_published' => 'boolean',
        ];
    }

    /*
    |--------------------------------------------------------------------------
    | Relations
    |--------------------------------------------------------------------------
    */

    /**
     * Projet parent de la publication
     */
    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    /**
     * Créateur de la publication
     */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Co-auteurs de la publication
     */
    public function coAuthors(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'publication_user')
            ->withTimestamps();
    }

    /**
     * Analyses IA de la publication
     */
    public function analyses(): \Illuminate\Database\Eloquent\Relations\MorphMany
    {
        return $this->morphMany(AiAnalysis::class, 'analysable');
    }

    /*
    |--------------------------------------------------------------------------
    | Accesseurs
    |--------------------------------------------------------------------------
    */

    /**
     * Liste formatée des auteurs
     */
    public function getAuthorsListAttribute(): string
    {
        if (is_array($this->authors)) {
            return implode(', ', $this->authors);
        }

        return $this->authors ?? '';
    }

    /**
     * Citation au format APA
     */
    public function getApaCitationAttribute(): string
    {
        $authors = $this->authors_list;
        $year = $this->year ?? 's.d.';
        $title = $this->title;

        $citation = "{$authors} ({$year}). {$title}.";

        if ($this->journal) {
            $citation .= " {$this->journal}";
            if ($this->volume) {
                $citation .= ", {$this->volume}";
            }
            if ($this->pages) {
                $citation .= ", {$this->pages}";
            }
            $citation .= '.';
        }

        if ($this->doi) {
            $citation .= " https://doi.org/{$this->doi}";
        }

        return $citation;
    }

    /**
     * Citation au format BibTeX
     */
    public function getBibtexCitationAttribute(): string
    {
        $key = strtolower(str_replace(' ', '_', $this->title));
        $type = match ($this->type) {
            PublicationType::ARTICLE => 'article',
            PublicationType::CONFERENCE => 'inproceedings',
            PublicationType::THESE => 'phdthesis',
            PublicationType::LIVRE => 'book',
            default => 'misc',
        };

        $bibtex = "@{$type}{{$key},\n";
        $bibtex .= "  title = {{{$this->title}}},\n";
        $bibtex .= "  author = {{{$this->authors_list}}},\n";
        $bibtex .= "  year = {{{$this->year}}},\n";

        if ($this->journal) {
            $bibtex .= "  journal = {{{$this->journal}}},\n";
        }
        if ($this->volume) {
            $bibtex .= "  volume = {{{$this->volume}}},\n";
        }
        if ($this->pages) {
            $bibtex .= "  pages = {{{$this->pages}}},\n";
        }
        if ($this->doi) {
            $bibtex .= "  doi = {{{$this->doi}}},\n";
        }
        if ($this->publisher) {
            $bibtex .= "  publisher = {{{$this->publisher}}},\n";
        }

        $bibtex .= '}';

        return $bibtex;
    }
}
