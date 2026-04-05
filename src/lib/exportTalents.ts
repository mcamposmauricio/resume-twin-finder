import { TalentPoolRow } from '@/hooks/useTalentPool';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const SCORE_LABELS: Record<string, string> = {
  hot: 'Quente',
  warm: 'Morno',
  cold: 'Frio',
};

function getScoreLabel(score: number): string {
  if (score > 70) return SCORE_LABELS.hot;
  if (score >= 40) return SCORE_LABELS.warm;
  return SCORE_LABELS.cold;
}

const TRIAGE_LABELS: Record<string, string> = {
  new: 'Nova',
  low_fit: 'Baixa aderência',
  deserves_analysis: 'Merece análise',
};

export function exportTalentsCSV(talents: TalentPoolRow[], filename = 'banco-de-talentos.csv') {
  const headers = ['Nome', 'Email', 'Telefone', 'Total Aplicações', 'Última Vaga', 'Data Última Aplicação', 'Triagem', 'Score', 'Classificação', 'Possui CV'];

  const rows = talents.map(t => [
    t.name || '',
    t.email || '',
    t.phone || '',
    t.total_applications.toString(),
    t.latest_job_title || '',
    format(new Date(t.latest_date), 'dd/MM/yyyy', { locale: ptBR }),
    TRIAGE_LABELS[t.latest_triage] || t.latest_triage,
    t.score.toString(),
    getScoreLabel(t.score),
    t.has_resume ? 'Sim' : 'Não',
  ]);

  const csvContent = [headers, ...rows]
    .map(row => row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(','))
    .join('\n');

  const BOM = '\uFEFF';
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
