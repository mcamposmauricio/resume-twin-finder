import { useState } from 'react';
import { Search, Users, Download, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useTalentPool, TalentPoolRow } from '@/hooks/useTalentPool';
import { exportTalentsCSV } from '@/lib/exportTalents';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { TalentCard } from '@/components/talent/TalentCard';
import { TalentDetailPanel } from '@/components/talent/TalentDetailPanel';
import { TalentFiltersPanel } from '@/components/talent/TalentFilters';
import { AppLayout } from '@/components/layout/AppLayout';
import { toast } from 'sonner';

export default function TalentPool() {
  const { userId } = useAuth();
  const [selectedTalent, setSelectedTalent] = useState<TalentPoolRow | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const {
    talents,
    totalCount,
    loading,
    filters,
    updateFilter,
    setFilters,
    page,
    setPage,
    totalPages,
    jobOptions,
  } = useTalentPool(userId);

  const handleClearFilters = () => {
    setFilters({
      search: '',
      jobIds: [],
      triageStatus: '',
      hasResume: null,
      minApplications: null,
      dateFrom: null,
    });
  };

  const handleExport = () => {
    if (talents.length === 0) {
      toast.error('Nenhum candidato para exportar.');
      return;
    }
    exportTalentsCSV(talents);
    toast.success('CSV exportado com sucesso!');
  };

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        {/* Page Title */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Users className="w-6 h-6 text-primary" />
              Banco de Talentos
            </h1>
            <p className="text-muted-foreground">
              {totalCount} {totalCount === 1 ? 'candidato único' : 'candidatos únicos'} no seu banco
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={handleExport} className="gap-1.5">
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Exportar CSV</span>
          </Button>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, email ou telefone..."
            value={filters.search}
            onChange={(e) => updateFilter('search', e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Filters */}
        <div className="mb-6">
          <TalentFiltersPanel
            filters={filters}
            updateFilter={updateFilter}
            jobOptions={jobOptions}
            onClear={handleClearFilters}
          />
        </div>

        {/* Talent List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : talents.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Users className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="font-semibold mb-2">
                {filters.search || filters.jobIds.length > 0 || filters.triageStatus || filters.hasResume !== null || filters.minApplications || filters.dateFrom
                  ? 'Nenhum candidato encontrado'
                  : 'Nenhum candidato no banco'}
              </h3>
              <p className="text-muted-foreground text-center text-sm">
                {filters.search || filters.jobIds.length > 0 || filters.triageStatus
                  ? 'Tente ajustar os filtros de busca.'
                  : 'Os candidatos aparecerão aqui quando se candidatarem às suas vagas.'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="grid gap-3">
              {talents.map((talent) => (
                <TalentCard
                  key={talent.email}
                  talent={talent}
                  onClick={() => {
                    setSelectedTalent(talent);
                    setDetailOpen(true);
                  }}
                />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-6">
                <p className="text-sm text-muted-foreground">
                  Página {page} de {totalPages} ({totalCount} candidatos)
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page <= 1}
                    onClick={() => setPage(page - 1)}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= totalPages}
                    onClick={() => setPage(page + 1)}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Detail Panel */}
      <TalentDetailPanel
        talent={selectedTalent}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        userId={userId}
      />
    </AppLayout>
  );
}
