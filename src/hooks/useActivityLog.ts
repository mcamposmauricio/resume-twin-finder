import { supabase } from "@/integrations/supabase/client";

export type ActionType =
  | 'user_signup'
  | 'user_login'
  | 'analysis_started'
  | 'analysis_completed'
  | 'analysis_draft_saved'
  | 'job_created'
  | 'job_published'
  | 'job_paused'
  | 'job_resumed'
  | 'job_closed'
  | 'job_edited'
  | 'application_received'
  | 'application_analyzed'
  | 'application_triage_updated'
  | 'form_template_created'
  | 'form_template_updated'
  | 'form_template_deleted'
  | 'referral_bonus';

const ACTION_LABELS: Record<ActionType, string> = {
  user_signup: 'Novo usuário cadastrado',
  user_login: 'Login realizado',
  analysis_started: 'Análise iniciada',
  analysis_completed: 'Análise concluída',
  analysis_draft_saved: 'Rascunho de análise salvo',
  job_created: 'Vaga criada',
  job_published: 'Vaga publicada',
  job_paused: 'Vaga pausada',
  job_resumed: 'Vaga reativada',
  job_closed: 'Vaga encerrada',
  job_edited: 'Vaga editada',
  application_received: 'Candidatura recebida',
  application_analyzed: 'Candidaturas enviadas para análise',
  application_triage_updated: 'Status de triagem atualizado',
  form_template_created: 'Modelo de formulário criado',
  form_template_updated: 'Modelo de formulário atualizado',
  form_template_deleted: 'Modelo de formulário excluído',
  referral_bonus: 'Bônus de indicação aplicado',
};

interface LogActivityParams {
  userId: string;
  userEmail: string;
  companyName?: string;
  actionType: ActionType;
  entityType?: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
}

export async function logActivity(params: LogActivityParams): Promise<void> {
  try {
    const insertData: {
      user_id: string;
      user_email: string;
      company_name: string | null;
      action_type: string;
      action_label: string;
      entity_type: string | null;
      entity_id: string | null;
      metadata: Record<string, unknown>;
    } = {
      user_id: params.userId,
      user_email: params.userEmail,
      company_name: params.companyName || null,
      action_type: params.actionType,
      action_label: ACTION_LABELS[params.actionType],
      entity_type: params.entityType || null,
      entity_id: params.entityId || null,
      metadata: params.metadata || {},
    };

    const { error } = await supabase.from('activity_logs').insert(insertData as any);

    if (error) {
      console.error('Error logging activity:', error);
    }
  } catch (err) {
    console.error('Error logging activity:', err);
  }
}

export function useActivityLog() {
  return { logActivity };
}
