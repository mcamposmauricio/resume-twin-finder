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
  { name: 'Nova candidatura', slug: 'new', color: '#6B7280', icon: 'inbox', order: 0, is_default: true },
  { name: 'Baixa aderência', slug: 'low_fit', color: '#EA580C', icon: 'thumbs-down', order: 1, is_default: false },
  { name: 'Merece análise', slug: 'deserves_analysis', color: '#3B82F6', icon: 'star', order: 2, is_default: false },
];

export const STAGE_ICONS = [
  'inbox',
  'thumbs-down',
  'star',
  'check',
  'x',
  'calendar',
  'phone',
  'mail',
  'user',
  'briefcase',
  'clock',
  'heart',
  'flag',
  'filter',
  'send',
] as const;

export type StageIcon = typeof STAGE_ICONS[number];
