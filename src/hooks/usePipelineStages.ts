import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { PipelineStage, DEFAULT_STAGES } from '@/types/pipeline';
import { toast } from 'sonner';

export function usePipelineStages(userId?: string) {
  const [stages, setStages] = useState<PipelineStage[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchStages = useCallback(async () => {
    if (!userId) return;

    try {
      const { data, error } = await supabase
        .from('pipeline_stages')
        .select('*')
        .eq('user_id', userId)
        .order('order', { ascending: true });

      if (error) throw error;

      // Cast data to our expected type
      const typedData = (data || []) as unknown as PipelineStage[];
      setStages(typedData);
    } catch (error) {
      console.error('Error fetching pipeline stages:', error);
      // Fallback to default stages structure
      setStages([]);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchStages();
  }, [fetchStages]);

  const createStage = async (stage: Omit<PipelineStage, 'id' | 'user_id' | 'created_at'>) => {
    if (!userId) return null;

    try {
      const { data, error } = await supabase
        .from('pipeline_stages')
        .insert({
          user_id: userId,
          name: stage.name,
          slug: stage.slug,
          color: stage.color,
          icon: stage.icon,
          order: stage.order,
          is_default: stage.is_default,
        })
        .select()
        .single();

      if (error) throw error;

      const typedData = data as unknown as PipelineStage;
      setStages((prev) => [...prev, typedData].sort((a, b) => a.order - b.order));
      toast.success('Etapa criada com sucesso!');
      return typedData;
    } catch (error: any) {
      console.error('Error creating stage:', error);
      toast.error('Erro ao criar etapa');
      return null;
    }
  };

  const updateStage = async (id: string, updates: Partial<PipelineStage>) => {
    try {
      const { error } = await supabase
        .from('pipeline_stages')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      setStages((prev) =>
        prev
          .map((s) => (s.id === id ? { ...s, ...updates } : s))
          .sort((a, b) => a.order - b.order)
      );
      toast.success('Etapa atualizada!');
      return true;
    } catch (error) {
      console.error('Error updating stage:', error);
      toast.error('Erro ao atualizar etapa');
      return false;
    }
  };

  const deleteStage = async (id: string) => {
    try {
      // Don't allow deleting if it's the only stage
      if (stages.length <= 1) {
        toast.error('Você precisa ter pelo menos uma etapa');
        return false;
      }

      const { error } = await supabase
        .from('pipeline_stages')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setStages((prev) => prev.filter((s) => s.id !== id));
      toast.success('Etapa removida!');
      return true;
    } catch (error) {
      console.error('Error deleting stage:', error);
      toast.error('Erro ao remover etapa');
      return false;
    }
  };

  const reorderStages = async (reorderedStages: PipelineStage[]) => {
    // Optimistic update
    setStages(reorderedStages);

    try {
      // Update all orders in parallel
      const updates = reorderedStages.map((stage, index) =>
        supabase
          .from('pipeline_stages')
          .update({ order: index })
          .eq('id', stage.id)
      );

      await Promise.all(updates);
      return true;
    } catch (error) {
      console.error('Error reordering stages:', error);
      toast.error('Erro ao reordenar etapas');
      fetchStages(); // Revert to server state
      return false;
    }
  };

  const getStageBySlug = useCallback(
    (slug: string) => stages.find((s) => s.slug === slug),
    [stages]
  );

  const getDefaultStage = useCallback(
    () => stages.find((s) => s.is_default) || stages[0],
    [stages]
  );

  return {
    stages,
    loading,
    createStage,
    updateStage,
    deleteStage,
    reorderStages,
    getStageBySlug,
    getDefaultStage,
    refetch: fetchStages,
  };
}
