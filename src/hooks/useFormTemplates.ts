import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { FormTemplate, FormField, PREDEFINED_FIELDS } from '@/types/jobs';
import { useToast } from '@/hooks/use-toast';

export function useFormTemplates(userId?: string) {
  const [templates, setTemplates] = useState<FormTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchTemplates = useCallback(async () => {
    if (!userId) {
      setTemplates([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('form_templates')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Parse fields from JSONB
      const parsed = (data || []).map(t => ({
        ...t,
        fields: (t.fields as unknown as FormField[]) || [],
      }));
      
      setTemplates(parsed);
    } catch (error: any) {
      console.error('Error fetching form templates:', error);
      toast({
        title: 'Erro ao carregar formulários',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [userId, toast]);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const createTemplate = async (
    name: string,
    description: string,
    fields: FormField[],
    isDefault = false
  ): Promise<FormTemplate | null> => {
    if (!userId) return null;

    try {
      const { data, error } = await supabase
        .from('form_templates')
        .insert([{
          user_id: userId,
          name,
          description,
          fields: fields as unknown as Record<string, unknown>[],
          is_default: isDefault,
        }])
        .select()
        .single();

      if (error) throw error;

      const newTemplate = {
        ...data,
        fields: (data.fields as unknown as FormField[]) || [],
      };
      
      setTemplates(prev => [newTemplate, ...prev]);
      toast({ title: 'Modelo criado com sucesso!' });
      return newTemplate;
    } catch (error: any) {
      console.error('Error creating form template:', error);
      toast({
        title: 'Erro ao criar modelo',
        description: error.message,
        variant: 'destructive',
      });
      return null;
    }
  };

  const updateTemplate = async (
    id: string,
    updates: Partial<Pick<FormTemplate, 'name' | 'description' | 'fields' | 'is_default'>>
  ): Promise<boolean> => {
    try {
      const updateData: Record<string, unknown> = {};
      if (updates.name !== undefined) updateData.name = updates.name;
      if (updates.description !== undefined) updateData.description = updates.description;
      if (updates.fields !== undefined) updateData.fields = updates.fields as unknown as Record<string, unknown>[];
      if (updates.is_default !== undefined) updateData.is_default = updates.is_default;

      const { error } = await supabase
        .from('form_templates')
        .update(updateData)
        .eq('id', id);

      if (error) throw error;

      setTemplates(prev =>
        prev.map(t =>
          t.id === id ? { ...t, ...updates } : t
        )
      );
      toast({ title: 'Modelo atualizado com sucesso!' });
      return true;
    } catch (error: any) {
      console.error('Error updating form template:', error);
      toast({
        title: 'Erro ao atualizar modelo',
        description: error.message,
        variant: 'destructive',
      });
      return false;
    }
  };

  const deleteTemplate = async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('form_templates')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setTemplates(prev => prev.filter(t => t.id !== id));
      toast({ title: 'Modelo excluído com sucesso!' });
      return true;
    } catch (error: any) {
      console.error('Error deleting form template:', error);
      toast({
        title: 'Erro ao excluir modelo',
        description: error.message,
        variant: 'destructive',
      });
      return false;
    }
  };

  const duplicateTemplate = async (template: FormTemplate): Promise<FormTemplate | null> => {
    return createTemplate(
      `${template.name} (cópia)`,
      template.description || '',
      template.fields,
      false
    );
  };

  const getDefaultFields = (): FormField[] => {
    return PREDEFINED_FIELDS.slice(0, 3).map((field, index) => ({
      ...field,
      id: crypto.randomUUID(),
      order: index,
    }));
  };

  return {
    templates,
    loading,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    duplicateTemplate,
    getDefaultFields,
    refetch: fetchTemplates,
  };
}
