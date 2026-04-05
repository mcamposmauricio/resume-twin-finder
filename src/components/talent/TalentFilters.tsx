import { useState } from 'react';
import { ChevronDown, ChevronUp, Filter, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { TalentFilters as TalentFiltersType } from '@/hooks/useTalentPool';

const TRIAGE_OPTIONS = [
  { value: 'new', label: 'Nova' },
  { value: 'deserves_analysis', label: 'Merece análise' },
  { value: 'low_fit', label: 'Baixa aderência' },
];

const DATE_OPTIONS = [
  { value: '7', label: 'Últimos 7 dias' },
  { value: '30', label: 'Últimos 30 dias' },
  { value: '90', label: 'Últimos 90 dias' },
];

const MIN_APP_OPTIONS = [
  { value: '2', label: '2+ aplicações' },
  { value: '3', label: '3+ aplicações' },
  { value: '5', label: '5+ aplicações' },
];

interface Props {
  filters: TalentFiltersType;
  updateFilter: <K extends keyof TalentFiltersType>(key: K, value: TalentFiltersType[K]) => void;
  jobOptions: { id: string; title: string }[];
  onClear: () => void;
}

export function TalentFiltersPanel({ filters, updateFilter, jobOptions, onClear }: Props) {
  const [open, setOpen] = useState(false);

  const activeCount = [
    filters.triageStatus,
    filters.hasResume !== null,
    filters.minApplications,
    filters.dateFrom,
    filters.jobIds.length > 0,
  ].filter(Boolean).length;

  const handleJobToggle = (jobId: string) => {
    const current = filters.jobIds;
    if (current.includes(jobId)) {
      updateFilter('jobIds', current.filter(id => id !== jobId));
    } else {
      updateFilter('jobIds', [...current, jobId]);
    }
  };

  const handleDateChange = (days: string) => {
    if (days === 'all') {
      updateFilter('dateFrom', null);
      return;
    }
    const d = new Date();
    d.setDate(d.getDate() - parseInt(days));
    updateFilter('dateFrom', d.toISOString());
  };

  const currentDateValue = () => {
    if (!filters.dateFrom) return 'all';
    const diff = Math.round((Date.now() - new Date(filters.dateFrom).getTime()) / (1000 * 60 * 60 * 24));
    if (diff <= 8) return '7';
    if (diff <= 31) return '30';
    if (diff <= 91) return '90';
    return 'all';
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setOpen(!open)}
          className="gap-1.5"
        >
          <Filter className="w-4 h-4" />
          Filtros
          {activeCount > 0 && (
            <Badge variant="secondary" className="ml-1 bg-primary text-primary-foreground h-5 w-5 p-0 flex items-center justify-center text-[10px]">
              {activeCount}
            </Badge>
          )}
          {open ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </Button>

        {activeCount > 0 && (
          <Button variant="ghost" size="sm" onClick={onClear} className="text-muted-foreground gap-1">
            <X className="w-3.5 h-3.5" />
            Limpar filtros
          </Button>
        )}
      </div>

      {open && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 p-4 border border-border rounded-lg bg-card">
          {/* Triage Status */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Triagem</label>
            <Select
              value={filters.triageStatus || 'all'}
              onValueChange={(v) => updateFilter('triageStatus', v === 'all' ? '' : v)}
            >
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Todas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                {TRIAGE_OPTIONS.map(o => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Date From */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Período</label>
            <Select value={currentDateValue()} onValueChange={handleDateChange}>
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Qualquer data" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Qualquer data</SelectItem>
                {DATE_OPTIONS.map(o => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Min Applications */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Aplicações</label>
            <Select
              value={filters.minApplications?.toString() || 'all'}
              onValueChange={(v) => updateFilter('minApplications', v === 'all' ? null : parseInt(v))}
            >
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Qualquer qtd" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Qualquer qtd</SelectItem>
                {MIN_APP_OPTIONS.map(o => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Has Resume */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Currículo</label>
            <div className="flex items-center gap-4 h-9">
              <label className="flex items-center gap-1.5 text-sm cursor-pointer">
                <Checkbox
                  checked={filters.hasResume === true}
                  onCheckedChange={(checked) => updateFilter('hasResume', checked ? true : null)}
                />
                Com CV
              </label>
              <label className="flex items-center gap-1.5 text-sm cursor-pointer">
                <Checkbox
                  checked={filters.hasResume === false}
                  onCheckedChange={(checked) => updateFilter('hasResume', checked ? false : null)}
                />
                Sem CV
              </label>
            </div>
          </div>

          {/* Job multi-select */}
          {jobOptions.length > 0 && (
            <div className="col-span-full space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                Vagas ({filters.jobIds.length > 0 ? `${filters.jobIds.length} selecionadas` : 'todas'})
              </label>
              <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                {jobOptions.map(job => {
                  const selected = filters.jobIds.includes(job.id);
                  return (
                    <Badge
                      key={job.id}
                      variant={selected ? 'default' : 'outline'}
                      className="cursor-pointer text-xs"
                      onClick={() => handleJobToggle(job.id)}
                    >
                      {job.title}
                    </Badge>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
