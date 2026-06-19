'use client';

import { FileText, ExternalLink, Pencil } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PUBLICATION_TYPES } from '@/lib/utils/constants';
import { truncateText } from '@/lib/utils/format';
import { cn } from '@/lib/utils/cn';
import type { Publication } from '@/types/models';

interface PublicationCardProps {
  publication: Publication;
  onClick?: () => void;
  onEdit?: (publication: Publication) => void;
}

export function PublicationCard({ publication, onClick, onEdit }: PublicationCardProps) {
  const typeInfo = PUBLICATION_TYPES[publication.type];

  return (
    <Card
      className={cn(
        'cursor-pointer hover:shadow-md transition-all duration-200',
        onClick && 'hover:-translate-y-0.5'
      )}
      onClick={onClick}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-sm leading-snug flex-1">
            {truncateText(publication.title, 80)}
          </CardTitle>
          <div className="flex items-center gap-1 shrink-0">
            <button
              className="p-1 rounded hover:bg-blue-50 text-gray-300 hover:text-blue-500 transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                onEdit?.(publication);
              }}
              title="Modifier"
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
            <Badge className={cn('text-[10px]', typeInfo.bgColor)}>
              {typeInfo.label}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Authors */}
        <p className="text-xs text-muted-foreground">{publication.authors}</p>

        {/* Journal/Conference & Year */}
        <div className="flex items-center gap-3 text-xs">
          {publication.journal && (
            <span className="flex items-center gap-1 text-muted-foreground">
              <FileText className="h-3 w-3" />
              {truncateText(publication.journal, 30)}
            </span>
          )}
          {publication.conference && (
            <span className="flex items-center gap-1 text-muted-foreground">
              <FileText className="h-3 w-3" />
              {truncateText(publication.conference, 30)}
            </span>
          )}
          <span className="text-muted-foreground">{publication.year}</span>
        </div>

        {/* DOI */}
        {publication.doi && (
          <a
            href={`https://doi.org/${publication.doi}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-[#2563EB] hover:underline"
            onClick={(e) => e.stopPropagation()}
          >
            <ExternalLink className="h-3 w-3" />
            {publication.doi}
          </a>
        )}

        {/* Keywords */}
        {publication.keywords && publication.keywords.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {publication.keywords.slice(0, 4).map((keyword, idx) => (
              <Badge key={idx} variant="secondary" className="text-[10px] px-1.5 py-0">
                {keyword}
              </Badge>
            ))}
            {publication.keywords.length > 4 && (
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                +{publication.keywords.length - 4}
              </Badge>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
