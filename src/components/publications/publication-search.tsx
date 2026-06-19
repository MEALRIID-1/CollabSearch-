'use client';

import { useState } from 'react';
import { Search, Filter, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PublicationCard } from './publication-card';
import { useSearchPublications } from '@/lib/hooks/use-publications';
import { PUBLICATION_TYPES } from '@/lib/utils/constants';
import { LoadingSpinner } from '@/components/shared/loading-spinner';
import { EmptyState } from '@/components/shared/empty-state';
import type { PublicationType } from '@/types/models';

export function PublicationSearch() {
  const [query, setQuery] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [yearFilter, setYearFilter] = useState<string>('');
  const [showFilters, setShowFilters] = useState(false);

  const { data: results, isLoading } = useSearchPublications(searchQuery, {
    type: typeFilter || undefined,
    year: yearFilter ? Number(yearFilter) : undefined,
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchQuery(query);
  };

  const clearFilters = () => {
    setTypeFilter('');
    setYearFilter('');
  };

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 20 }, (_, i) => currentYear - i);

  return (
    <div className="space-y-4">
      {/* Search bar */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Rechercher une publication..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button type="submit" className="bg-[#2563EB] hover:bg-[#2563EB]/90">
          Rechercher
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => setShowFilters(!showFilters)}
        >
          <Filter className="h-4 w-4" />
        </Button>
      </form>

      {/* Filters */}
      {showFilters && (
        <div className="flex flex-wrap items-center gap-3 p-3 rounded-lg bg-muted/50">
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[160px] h-9">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(PUBLICATION_TYPES).map(([key, { label }]) => (
                <SelectItem key={key} value={key}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={yearFilter} onValueChange={setYearFilter}>
            <SelectTrigger className="w-[120px] h-9">
              <SelectValue placeholder="Année" />
            </SelectTrigger>
            <SelectContent>
              {years.map((year) => (
                <SelectItem key={year} value={String(year)}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {(typeFilter || yearFilter) && (
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              <X className="h-3 w-3 mr-1" />
              Effacer les filtres
            </Button>
          )}
        </div>
      )}

      {/* Results */}
      {isLoading && <LoadingSpinner text="Recherche en cours..." />}

      {!isLoading && searchQuery && results && results.length === 0 && (
        <EmptyState
          title="Aucun résultat"
          description={`Aucune publication trouvée pour "${searchQuery}".`}
        />
      )}

      {!isLoading && results && results.length > 0 && (
        <div>
          <p className="text-sm text-muted-foreground mb-3">
            {results.length} publication{results.length !== 1 ? 's' : ''} trouvée{results.length !== 1 ? 's' : ''}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {results.map((publication) => (
              <PublicationCard key={publication.id} publication={publication} />
            ))}
          </div>
        </div>
      )}

      {!searchQuery && (
        <EmptyState
          title="Rechercher des publications"
          description="Entrez un terme de recherche pour trouver des publications."
        />
      )}
    </div>
  );
}
