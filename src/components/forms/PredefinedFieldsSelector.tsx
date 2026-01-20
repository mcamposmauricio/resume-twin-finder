import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { FormField, PREDEFINED_FIELDS } from '@/types/jobs';

interface PredefinedFieldsSelectorProps {
  selectedFields: FormField[];
  onToggle: (field: Omit<FormField, 'id' | 'order'>, enabled: boolean) => void;
}

export function PredefinedFieldsSelector({
  selectedFields,
  onToggle,
}: PredefinedFieldsSelectorProps) {
  const isSelected = (label: string) =>
    selectedFields.some(f => f.label === label);

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium text-foreground">Campos Pré-definidos</h3>
      <div className="grid grid-cols-2 gap-3">
        {PREDEFINED_FIELDS.map((field) => (
          <div key={field.label} className="flex items-center space-x-2">
            <Checkbox
              id={`predefined-${field.label}`}
              checked={isSelected(field.label)}
              onCheckedChange={(checked) => onToggle(field, !!checked)}
            />
            <Label
              htmlFor={`predefined-${field.label}`}
              className="text-sm font-normal cursor-pointer"
            >
              {field.label}
              {field.required && <span className="text-destructive ml-1">*</span>}
            </Label>
          </div>
        ))}
      </div>
    </div>
  );
}
