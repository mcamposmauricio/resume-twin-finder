import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Plus, Save } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useFormTemplates } from '@/hooks/useFormTemplates';
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

export default function FormTemplateEditor() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { toast } = useToast();
  const [userId, setUserId] = useState<string>();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [fields, setFields] = useState<FormField[]>([]);
  const [saving, setSaving] = useState(false);
  const [editingField, setEditingField] = useState<FormField | null>(null);
  const [showFieldDialog, setShowFieldDialog] = useState(false);
  const [previewValues, setPreviewValues] = useState<Record<string, any>>({});

  const { templates, createTemplate, updateTemplate, getDefaultFields } = useFormTemplates(userId);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate('/auth');
      } else {
        setUserId(session.user.id);
      }
    });
  }, [navigate]);

  useEffect(() => {
    if (id && templates.length > 0) {
      const template = templates.find((t) => t.id === id);
      if (template) {
        setName(template.name);
        setDescription(template.description || '');
        setFields(template.fields);
      }
    } else if (!id) {
      // New template: add default fields
      setFields(getDefaultFields());
    }
  }, [id, templates, getDefaultFields]);

  const handleTogglePredefined = (
    field: Omit<FormField, 'id' | 'order'>,
    enabled: boolean
  ) => {
    if (enabled) {
      const newField: FormField = {
        ...field,
        predefined: true,
        id: crypto.randomUUID(),
        order: fields.length,
      };
      setFields([...fields, newField]);
    } else {
      setFields(fields.filter((f) => f.label !== field.label));
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
      // Reorder fields
      const orderedFields = fields.map((f, i) => ({ ...f, order: i }));

      if (id) {
        await updateTemplate(id, { name, description, fields: orderedFields });
      } else {
        await createTemplate(name, description, orderedFields);
      }
      navigate('/formularios');
    } finally {
      setSaving(false);
    }
  };

  const customFields = fields.filter((f) => !f.predefined);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
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
                    <h3 className="text-sm font-medium">Campos Personalizados</h3>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditingField(null);
                        setShowFieldDialog(true);
                      }}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Adicionar Campo
                    </Button>
                  </div>

                  {customFields.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      Nenhum campo personalizado adicionado.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {customFields.map((field) => (
                        <FormFieldEditor
                          key={field.id}
                          field={field}
                          onEdit={() => {
                            setEditingField(field);
                            setShowFieldDialog(true);
                          }}
                          onDelete={() => handleDeleteField(field.id)}
                        />
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
