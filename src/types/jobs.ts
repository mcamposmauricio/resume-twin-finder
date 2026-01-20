export type FieldType = 
  | 'text' 
  | 'email' 
  | 'phone' 
  | 'number' 
  | 'currency' 
  | 'select' 
  | 'multiselect' 
  | 'textarea' 
  | 'date';

export interface FormField {
  id: string;
  label: string;
  type: FieldType;
  required: boolean;
  placeholder?: string;
  options?: string[];
  order: number;
  predefined?: boolean;
}

export interface FormTemplate {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  fields: FormField[];
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export type WorkType = 'remote' | 'hybrid' | 'onsite';
export type JobStatus = 'draft' | 'active' | 'paused' | 'closed';
export type ApplicationStatus = 'pending' | 'reviewed' | 'shortlisted' | 'rejected' | 'analyzed';

export interface JobPosting {
  id: string;
  user_id: string;
  title: string;
  description: string;
  requirements?: string;
  location?: string;
  salary_range?: string;
  work_type?: WorkType;
  form_template_id?: string;
  form_template?: FormTemplate;
  status: JobStatus;
  public_slug: string;
  expires_at?: string;
  closed_at?: string;
  created_at: string;
  updated_at: string;
  applications_count?: number;
}

export interface JobApplication {
  id: string;
  job_posting_id: string;
  form_data: Record<string, any>;
  resume_url?: string;
  resume_filename?: string;
  applicant_email?: string;
  applicant_name?: string;
  status: ApplicationStatus;
  analysis_id?: string;
  created_at: string;
  job_posting?: JobPosting;
}

export const PREDEFINED_FIELDS: Omit<FormField, 'id' | 'order'>[] = [
  { label: 'Nome completo', type: 'text', required: true, predefined: true },
  { label: 'Email', type: 'email', required: true, predefined: true },
  { label: 'Telefone', type: 'phone', required: false, predefined: true },
  { label: 'LinkedIn', type: 'text', required: false, placeholder: 'linkedin.com/in/...', predefined: true },
  { label: 'Pretensão salarial', type: 'currency', required: false, predefined: true },
  { label: 'Disponibilidade para início', type: 'select', required: false, options: ['Imediata', '15 dias', '30 dias', '60+ dias'], predefined: true },
  { label: 'Anos de experiência', type: 'number', required: false, predefined: true },
  { label: 'Cidade/Estado', type: 'text', required: false, predefined: true },
  { label: 'Por que quer trabalhar conosco?', type: 'textarea', required: false, predefined: true },
];

export const WORK_TYPE_LABELS: Record<WorkType, string> = {
  remote: 'Remoto',
  hybrid: 'Híbrido',
  onsite: 'Presencial',
};

export const STATUS_LABELS: Record<JobStatus, string> = {
  draft: 'Rascunho',
  active: 'Ativa',
  paused: 'Pausada',
  closed: 'Encerrada',
};

export const APPLICATION_STATUS_LABELS: Record<ApplicationStatus, string> = {
  pending: 'Pendente',
  reviewed: 'Revisado',
  shortlisted: 'Selecionado',
  rejected: 'Rejeitado',
  analyzed: 'Analisado',
};
