import { GripVertical, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FormField, FieldType } from '@/types/jobs';

interface FormFieldEditorProps {
  field: FormField;
  onEdit: () => void;
  onDelete: () => void;
  dragHandleProps?: React.HTMLAttributes<HTMLDivElement>;
}

const TYPE_LABELS: Record<FieldType, string> = {
  text: 'Texto',
  email: 'Email',
  phone: 'Telefone',
  number: 'Número',
  currency: 'Moeda',
  select: 'Seleção',
  multiselect: 'Múltipla escolha',
  textarea: 'Área de texto',
  date: 'Data',
};

export function FormFieldEditor({
  field,
  onEdit,
  onDelete,
  dragHandleProps,
}: FormFieldEditorProps) {
  return (
    <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg border">
      <div
        {...dragHandleProps}
        className="cursor-grab text-muted-foreground hover:text-foreground"
      >
        <GripVertical className="h-5 w-5" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium truncate">{field.label}</span>
          {field.required && (
            <Badge variant="destructive" className="text-xs">
              Obrigatório
            </Badge>
          )}
          {field.predefined && (
            <Badge variant="secondary" className="text-xs">
              Pré-definido
            </Badge>
          )}
        </div>
        <p className="text-sm text-muted-foreground">
          Tipo: {TYPE_LABELS[field.type]}
          {field.options && field.options.length > 0 && (
            <> | Opções: {field.options.join(', ')}</>
          )}
        </p>
      </div>

      <div className="flex items-center gap-1">
        <Button variant="ghost" size="icon" onClick={onEdit}>
          <Pencil className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={onDelete}>
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
