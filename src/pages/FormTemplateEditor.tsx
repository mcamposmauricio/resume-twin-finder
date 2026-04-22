import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Plus, Save, ChevronUp, ChevronDown } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useFormTemplates } from '@/hooks/useFormTemplates';
import { useUserRole } from '@/hooks/useUserRole';
import { FormField, PREDEFINED_FIELDS } from '@/types/jobs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { PredefinedFieldsSelector } from '@/components/forms/PredefinedFieldsSelector';
import { FormFieldEditor } from '@/components/forms/FormFieldEditor';
import { FieldConfigDialog } from '@/components/forms/FieldConfigDialog';
import { DynamicFormRenderer } from '@/components/forms/DynamicFormRenderer';
import { useToast } from '@/hooks/use-toast';
import { toast as sonnerToast } from 'sonner';
import { logActivity } from '@/hooks/useActivityLog';

export default function FormTemplateEditor() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const [userId, setUserId] = useState<string>();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [fields, setFields] = useState<FormField[]>([]);
  const [saving, setSaving] = useState(false);
  const [editingField, setEditingField] = useState<FormField | null>(null);
  const [showFieldDialog, setShowFieldDialog] = useState(false);
  const [previewValues, setPreviewValues] = useState<Record<string, any>>({});
  const initialized = useRef(false);

  const { templates, createTemplate, updateTemplate, getDefaultFields } = useFormTemplates(userId);
  const { isFullAccess, loading: roleLoading } = useUserRole(userId);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate('/auth');
      } else {
        setUserId(session.user.id);
      }
    });
  }, [navigate]);

  // Redirect non-full-access users
  useEffect(() => {
    if (!roleLoading && userId && !isFullAccess) {
      sonnerToast.error('Você não tem acesso a esta funcionalidade.');
      navigate('/');
    }
  }, [roleLoading, isFullAccess, userId, navigate]);

  useEffect(() => {
    if (!userId) return;

    if (id && templates.length > 0) {
      const template = templates.find((t) => t.id === id);
      if (template) {
        setName(template.name);
        setDescription(template.description || '');
        setFields(template.fields);
        initialized.current = true;
      }
    } else if (!id && !initialized.current) {
      setFields(getDefaultFields());
      initialized.current = true;
    }
  }, [id, templates, userId, getDefaultFields]);

  const handleTogglePredefined = (
    field: Omit<FormField, 'id' | 'order'>,
    enabled: boolean
  ) => {
    if (enabled) {
      const newField: FormField = {
        id: crypto.randomUUID(),
        label: field.label,
        type: field.type,
        required: field.required,
        placeholder: field.placeholder,
        options: field.options,
        order: fields.length,
        predefined: true,
      };
      setFields((prev) => [...prev, newField]);
    } else {
      setFields((prev) => prev.filter((f) => f.label !== field.label));
    }
  };

  const handleAddCustomField = (fieldData: Omit<FormField, 'id' | 'order'>) => {
    if (editingField) {
      setFields(
        fields.map((f) =>
          f.id === editingField.id ? { ...f, ...fieldData } : f
        )
      );
      setEditingField(null);
    } else {
      const newField: FormField = {
        ...fieldData,
        id: crypto.randomUUID(),
        order: fields.length,
      };
      setFields([...fields, newField]);
    }
  };

  const handleDeleteField = (fieldId: string) => {
    setFields(fields.filter((f) => f.id !== fieldId));
  };

  const handleMoveField = (fieldId: string, direction: 'up' | 'down') => {
    const sortedFields = [...fields].sort((a, b) => a.order - b.order);
    const index = sortedFields.findIndex((f) => f.id === fieldId);
    if (index < 0) return;

    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= sortedFields.length) return;

    const newFields = [...sortedFields];
    [newFields[index], newFields[newIndex]] = [newFields[newIndex], newFields[index]];

    setFields(newFields.map((f, i) => ({ ...f, order: i })));
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast({
        title: 'Nome obrigatório',
        description: 'Por favor, insira um nome para o modelo.',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);
    try {
      const orderedFields = fields.map((f, i) => ({ ...f, order: i }));

      if (id) {
        await updateTemplate(id, { name, description, fields: orderedFields });
      } else {
        await createTemplate(name, description, orderedFields);
      }
      const returnTo = searchParams.get('returnTo');
      if (returnTo === 'nova-vaga') {
        navigate('/vagas/nova');
      } else {
        navigate('/formularios');
      }
    } catch (error: any) {
      console.error('Error saving form template:', error);
      logActivity({
        userId: userId || 'unknown',
        userEmail: 'unknown',
        actionType: 'form_template_error',
        isError: true,
        metadata: { error_message: error.message, template_id: id },
      });
      toast({
        title: 'Erro ao salvar formulário',
        description: error.message || 'Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const sortedFields = [...fields].sort((a, b) => a.order - b.order);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-[100rem]">
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="icon" onClick={() => navigate('/formularios')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">
              {id ? 'Editar Modelo' : 'Novo Modelo de Formulário'}
            </h1>
          </div>
          <Button onClick={handleSave} disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Salvando...' : 'Salvar'}
          </Button>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Editor */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Informações do Modelo</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome do modelo *</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ex: Formulário para Desenvolvedores"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Descreva o propósito deste formulário..."
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Campos do Formulário</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <PredefinedFieldsSelector
                  selectedFields={fields}
                  onToggle={handleTogglePredefined}
                />

                <Separator />

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium">Adicionar Campo Personalizado</h3>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditingField(null);
                        setShowFieldDialog(true);
                      }}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Novo Campo
                    </Button>
                  </div>
                </div>

                <Separator />

                {/* Unified field list with reordering */}
                <div className="space-y-4">
                  <h3 className="text-sm font-medium">Ordem dos Campos</h3>
                  {sortedFields.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      Nenhum campo adicionado. Ative campos acima ou adicione um personalizado.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {sortedFields.map((field, index) => (
                        <div
                          key={field.id}
                          className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg border"
                        >
                          <div className="flex flex-col gap-0.5">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              disabled={index === 0}
                              onClick={() => handleMoveField(field.id, 'up')}
                            >
                              <ChevronUp className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              disabled={index === sortedFields.length - 1}
                              onClick={() => handleMoveField(field.id, 'down')}
                            >
                              <ChevronDown className="h-4 w-4" />
                            </Button>
                          </div>
                          <FormFieldEditor
                            field={field}
                            onEdit={() => {
                              if (!field.predefined) {
                                setEditingField(field);
                                setShowFieldDialog(true);
                              }
                            }}
                            onDelete={() => handleDeleteField(field.id)}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Preview */}
          <div className="lg:sticky lg:top-8 h-fit">
            <Card>
              <CardHeader>
                <CardTitle>Pré-visualização</CardTitle>
              </CardHeader>
              <CardContent>
                {fields.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    Adicione campos para ver a pré-visualização.
                  </p>
                ) : (
                  <DynamicFormRenderer
                    fields={fields}
                    values={previewValues}
                    onChange={(fieldId, value) =>
                      setPreviewValues({ ...previewValues, [fieldId]: value })
                    }
                  />
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        <FieldConfigDialog
          open={showFieldDialog}
          onOpenChange={setShowFieldDialog}
          field={editingField}
          onSave={handleAddCustomField}
        />
      </div>
    </div>
  );
}
