import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { X, Plus } from 'lucide-react';
import { FormField, FieldType } from '@/types/jobs';

interface FieldConfigDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  field?: FormField | null;
  onSave: (field: Omit<FormField, 'id' | 'order'>) => void;
}

const FIELD_TYPES: { value: FieldType; label: string }[] = [
  { value: 'text', label: 'Texto' },
  { value: 'number', label: 'Número' },
  { value: 'currency', label: 'Moeda (R$)' },
  { value: 'email', label: 'Email' },
  { value: 'phone', label: 'Telefone' },
  { value: 'date', label: 'Data' },
  { value: 'select', label: 'Seleção única' },
  { value: 'multiselect', label: 'Múltipla escolha' },
  { value: 'textarea', label: 'Área de texto' },
];

export function FieldConfigDialog({
  open,
  onOpenChange,
  field,
  onSave,
}: FieldConfigDialogProps) {
  const [label, setLabel] = useState('');
  const [type, setType] = useState<FieldType>('text');
  const [placeholder, setPlaceholder] = useState('');
  const [required, setRequired] = useState(false);
  const [options, setOptions] = useState<string[]>(['']);

  useEffect(() => {
    if (field) {
      setLabel(field.label);
      setType(field.type);
      setPlaceholder(field.placeholder || '');
      setRequired(field.required);
      setOptions(field.options?.length ? field.options : ['']);
    } else {
      setLabel('');
      setType('text');
      setPlaceholder('');
      setRequired(false);
      setOptions(['']);
    }
  }, [field, open]);

  const handleSave = () => {
    if (!label.trim()) return;

    const fieldData: Omit<FormField, 'id' | 'order'> = {
      label: label.trim(),
      type,
      required,
      placeholder: placeholder.trim() || undefined,
      predefined: false,
    };

    if (type === 'select' || type === 'multiselect') {
      fieldData.options = options.filter(o => o.trim());
    }

    onSave(fieldData);
    onOpenChange(false);
  };

  const addOption = () => setOptions([...options, '']);
  const removeOption = (index: number) =>
    setOptions(options.filter((_, i) => i !== index));
  const updateOption = (index: number, value: string) =>
    setOptions(options.map((o, i) => (i === index ? value : o)));

  const needsOptions = type === 'select' || type === 'multiselect';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {field ? 'Editar Campo' : 'Adicionar Campo Personalizado'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="field-label">Nome do campo</Label>
            <Input
              id="field-label"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Ex: Experiência com React"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="field-type">Tipo de campo</Label>
            <Select value={type} onValueChange={(v) => setType(v as FieldType)}>
              <SelectTrigger id="field-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FIELD_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="field-placeholder">Placeholder (opcional)</Label>
            <Input
              id="field-placeholder"
              value={placeholder}
              onChange={(e) => setPlaceholder(e.target.value)}
              placeholder="Texto de exemplo no campo"
            />
          </div>

          {needsOptions && (
            <div className="space-y-2">
              <Label>Opções</Label>
              {options.map((option, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    value={option}
                    onChange={(e) => updateOption(index, e.target.value)}
                    placeholder={`Opção ${index + 1}`}
                  />
                  {options.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeOption(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addOption}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Adicionar opção
              </Button>
            </div>
          )}

          <div className="flex items-center space-x-2">
            <Checkbox
              id="field-required"
              checked={required}
              onCheckedChange={(checked) => setRequired(!!checked)}
            />
            <Label htmlFor="field-required" className="font-normal cursor-pointer">
              Campo obrigatório
            </Label>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={!label.trim()}>
            {field ? 'Salvar' : 'Adicionar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
