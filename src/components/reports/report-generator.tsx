'use client';

import { useState } from 'react';
import { FileText, Download, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import apiClient from '@/lib/api/client';
import { API_ROUTES } from '@/lib/utils/constants';
import { toast } from 'sonner';

type ReportType = 'project' | 'team' | 'budget';
type ReportFormat = 'pdf' | 'excel';

export function ReportGenerator() {
  const [reportType, setReportType] = useState<ReportType>('project');
  const [format, setFormat] = useState<ReportFormat>('pdf');
  const [projectId, setProjectId] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      let url = '';
      const params: Record<string, string> = { format };

      if (dateFrom) params.date_from = dateFrom;
      if (dateTo) params.date_to = dateTo;

      switch (reportType) {
        case 'project':
          if (!projectId) {
            toast.error('Veuillez sélectionner un projet');
            setIsGenerating(false);
            return;
          }
          url = API_ROUTES.REPORT_PROJECT(Number(projectId));
          break;
        case 'team':
          url = API_ROUTES.REPORT_TEAM;
          break;
        case 'budget':
          if (!projectId) {
            toast.error('Veuillez sélectionner un projet');
            setIsGenerating(false);
            return;
          }
          url = API_ROUTES.REPORT_BUDGET(Number(projectId));
          break;
      }

      const response = await apiClient.get(url, {
        params,
        responseType: 'blob',
      });

      const blob = new Blob([response.data]);
      const downloadUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      const extension = format === 'pdf' ? 'pdf' : 'xlsx';
      a.download = `rapport_${reportType}_${new Date().toISOString().split('T')[0]}.${extension}`;
      a.click();
      URL.revokeObjectURL(downloadUrl);

      toast.success('Rapport généré avec succès');
    } catch {
      toast.error('Erreur lors de la génération du rapport');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Générer un rapport
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Report type */}
        <div className="space-y-2">
          <Label>Type de rapport</Label>
          <Select value={reportType} onValueChange={(v) => setReportType(v as ReportType)}>
            <SelectTrigger>
              <SelectValue placeholder="Sélectionner le type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="project">Rapport de projet</SelectItem>
              <SelectItem value="team">Rapport d&apos;équipe</SelectItem>
              <SelectItem value="budget">Rapport budgétaire</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Project ID (for project and budget reports) */}
        {(reportType === 'project' || reportType === 'budget') && (
          <div className="space-y-2">
            <Label htmlFor="project_id">Projet</Label>
            <Input
              id="project_id"
              type="number"
              placeholder="ID du projet"
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
            />
          </div>
        )}

        {/* Date range */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="date_from">Date de début</Label>
            <Input
              id="date_from"
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="date_to">Date de fin</Label>
            <Input
              id="date_to"
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
            />
          </div>
        </div>

        {/* Format */}
        <div className="space-y-2">
          <Label>Format</Label>
          <Select value={format} onValueChange={(v) => setFormat(v as ReportFormat)}>
            <SelectTrigger>
              <SelectValue placeholder="Sélectionner le format" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pdf">PDF</SelectItem>
              <SelectItem value="excel">Excel</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Generate button */}
        <Button
          className="w-full bg-[#2563EB] hover:bg-[#2563EB]/90"
          onClick={handleGenerate}
          disabled={isGenerating}
        >
          {isGenerating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Génération en cours...
            </>
          ) : (
            <>
              <Download className="mr-2 h-4 w-4" />
              Générer le rapport
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
