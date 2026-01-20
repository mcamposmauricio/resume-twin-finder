import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { FormField } from '@/types/jobs';

interface DynamicFormRendererProps {
  fields: FormField[];
  values: Record<string, any>;
  onChange: (fieldId: string, value: any) => void;
  errors?: Record<string, string>;
  disabled?: boolean;
}

export function DynamicFormRenderer({
  fields,
  values,
  onChange,
  errors = {},
  disabled = false,
}: DynamicFormRendererProps) {
  const sortedFields = [...fields].sort((a, b) => a.order - b.order);

  const renderField = (field: FormField) => {
    const value = values[field.id] ?? '';
    const error = errors[field.id];

    const commonProps = {
      id: field.id,
      disabled,
      className: error ? 'border-destructive' : '',
    };

    switch (field.type) {
      case 'textarea':
        return (
          <Textarea
            {...commonProps}
            value={value}
            onChange={(e) => onChange(field.id, e.target.value)}
            placeholder={field.placeholder}
            rows={4}
          />
        );

      case 'select':
        return (
          <Select
            value={value}
            onValueChange={(v) => onChange(field.id, v)}
            disabled={disabled}
          >
            <SelectTrigger {...commonProps}>
              <SelectValue placeholder={field.placeholder || 'Selecione...'} />
            </SelectTrigger>
            <SelectContent>
              {field.options?.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case 'multiselect':
        return (
          <div className="space-y-2">
            {field.options?.map((option) => (
              <div key={option} className="flex items-center space-x-2">
                <Checkbox
                  id={`${field.id}-${option}`}
                  checked={(value as string[] || []).includes(option)}
                  disabled={disabled}
                  onCheckedChange={(checked) => {
                    const current = (value as string[]) || [];
                    if (checked) {
                      onChange(field.id, [...current, option]);
                    } else {
                      onChange(field.id, current.filter((v) => v !== option));
                    }
                  }}
                />
                <Label
                  htmlFor={`${field.id}-${option}`}
                  className="font-normal cursor-pointer"
                >
                  {option}
                </Label>
              </div>
            ))}
          </div>
        );

      case 'number':
        return (
          <Input
            {...commonProps}
            type="number"
            value={value}
            onChange={(e) => onChange(field.id, e.target.value)}
            placeholder={field.placeholder}
          />
        );

      case 'currency':
        return (
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              R$
            </span>
            <Input
              {...commonProps}
              type="number"
              value={value}
              onChange={(e) => onChange(field.id, e.target.value)}
              placeholder={field.placeholder || '0,00'}
              className={`pl-10 ${error ? 'border-destructive' : ''}`}
            />
          </div>
        );

      case 'date':
        return (
          <Input
            {...commonProps}
            type="date"
            value={value}
            onChange={(e) => onChange(field.id, e.target.value)}
          />
        );

      case 'email':
        return (
          <Input
            {...commonProps}
            type="email"
            value={value}
            onChange={(e) => onChange(field.id, e.target.value)}
            placeholder={field.placeholder || 'email@exemplo.com'}
          />
        );

      case 'phone':
        return (
          <Input
            {...commonProps}
            type="tel"
            value={value}
            onChange={(e) => onChange(field.id, e.target.value)}
            placeholder={field.placeholder || '(00) 00000-0000'}
          />
        );

      default:
        return (
          <Input
            {...commonProps}
            type="text"
            value={value}
            onChange={(e) => onChange(field.id, e.target.value)}
            placeholder={field.placeholder}
          />
        );
    }
  };

  return (
    <div className="space-y-4">
      {sortedFields.map((field) => (
        <div key={field.id} className="space-y-2">
          <Label htmlFor={field.id}>
            {field.label}
            {field.required && <span className="text-destructive ml-1">*</span>}
          </Label>
          {renderField(field)}
          {errors[field.id] && (
            <p className="text-sm text-destructive">{errors[field.id]}</p>
          )}
        </div>
      ))}
    </div>
  );
}
