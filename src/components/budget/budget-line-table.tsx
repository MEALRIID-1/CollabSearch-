'use client';

import { useState } from 'react';
import { Trash2, ArrowUpDown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { BUDGET_CATEGORIES } from '@/lib/utils/constants';
import { formatCurrency, formatDate } from '@/lib/utils/format';
import { cn } from '@/lib/utils/cn';
import { useBudgetLines, useDeleteBudgetLine } from '@/lib/hooks/use-budget';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { LoadingSpinner } from '@/components/shared/loading-spinner';
import { EmptyState } from '@/components/shared/empty-state';
import type { BudgetLine, BudgetCategory } from '@/types/models';

interface BudgetLineTableProps {
  projectId: number;
}

type SortKey = 'category' | 'description' | 'amount_planned' | 'amount_spent';
type SortDir = 'asc' | 'desc';

export function BudgetLineTable({ projectId }: BudgetLineTableProps) {
  const { data: budgetData, isLoading } = useBudgetLines(projectId);
  const deleteLine = useDeleteBudgetLine();
  const [deleteTarget, setDeleteTarget] = useState<BudgetLine | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>('category');
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteLine.mutateAsync(deleteTarget.id);
      setDeleteTarget(null);
    } catch {
      // Error handled by mutation
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <LoadingSpinner text="Chargement des lignes budgétaires..." />
        </CardContent>
      </Card>
    );
  }

  const lines = budgetData?.data ?? [];

  if (lines.length === 0) {
    return (
      <EmptyState
        title="Aucune ligne budgétaire"
        description="Aucune ligne budgétaire n'a été ajoutée à ce projet."
      />
    );
  }

  const sortedLines = [...lines].sort((a, b) => {
    const dir = sortDir === 'asc' ? 1 : -1;
    if (sortKey === 'category') {
      return a.category.localeCompare(b.category) * dir;
    }
    if (sortKey === 'description') {
      return a.description.localeCompare(b.description) * dir;
    }
    return ((a[sortKey] as number) - (b[sortKey] as number)) * dir;
  });

  const SortButton = ({ column, label }: { column: SortKey; label: string }) => (
    <button
      className="flex items-center gap-1 hover:text-foreground transition-colors"
      onClick={() => handleSort(column)}
    >
      {label}
      <ArrowUpDown className="h-3 w-3" />
    </button>
  );

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Lignes budgétaires</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    <SortButton column="category" label="Catégorie" />
                  </TableHead>
                  <TableHead>
                    <SortButton column="description" label="Description" />
                  </TableHead>
                  <TableHead className="text-right">
                    <SortButton column="amount_planned" label="Alloué" />
                  </TableHead>
                  <TableHead className="text-right">
                    <SortButton column="amount_spent" label="Dépensé" />
                  </TableHead>
                  <TableHead className="text-right">Restant</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedLines.map((line) => {
                  const categoryInfo = BUDGET_CATEGORIES[line.category as BudgetCategory];
                  const remaining = line.amount_planned - line.amount_spent;

                  return (
                    <TableRow key={line.id}>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className={cn('text-xs', categoryInfo?.bgColor)}
                        >
                          {categoryInfo?.label ?? line.category}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate">
                        {line.description}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(line.amount_planned)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(line.amount_spent)}
                      </TableCell>
                      <TableCell
                        className={cn(
                          'text-right font-medium',
                          remaining < 0 && 'text-red-600'
                        )}
                      >
                        {formatCurrency(remaining)}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={() => setDeleteTarget(line)}
                          aria-label="Supprimer"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Delete confirmation */}
      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Supprimer la ligne budgétaire"
        description={`Êtes-vous sûr de vouloir supprimer la ligne "${deleteTarget?.description}" ? Cette action est irréversible.`}
        onConfirm={handleDelete}
        variant="destructive"
        confirmLabel="Supprimer"
      />
    </>
  );
}
