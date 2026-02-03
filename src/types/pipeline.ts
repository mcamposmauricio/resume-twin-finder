export interface PipelineStage {
  id: string;
  user_id: string;
  name: string;
  slug: string;
  color: string;
  icon: string;
  order: number;
  is_default: boolean;
  created_at: string;
}

export const DEFAULT_STAGES: Omit<PipelineStage, 'id' | 'user_id' | 'created_at'>[] = [
  { name: 'Análise de currículo', slug: 'new', color: '#8B5CF6', icon: 'file-text', order: 0, is_default: true },
  { name: 'Análise comportamental', slug: 'behavioral', color: '#8B5CF6', icon: 'user', order: 1, is_default: false },
  { name: 'Entrevista Técnica', slug: 'technical_interview', color: '#8B5CF6', icon: 'briefcase', order: 2, is_default: false },
  { name: 'Carta Proposta', slug: 'proposal', color: '#8B5CF6', icon: 'send', order: 3, is_default: false },
];

export const STAGE_ICONS = [
  'inbox',
  'file-text',
  'user',
  'briefcase',
  'thumbs-down',
  'star',
  'check',
  'x',
  'calendar',
  'phone',
  'mail',
  'clock',
  'heart',
  'flag',
  'filter',
  'send',
] as const;

export type StageIcon = typeof STAGE_ICONS[number];
