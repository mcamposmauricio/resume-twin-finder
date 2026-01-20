import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { FormField, PREDEFINED_FIELDS } from '@/types/jobs';
import { User, Mail, Phone, FileText, DollarSign, Link, MapPin, Clock, Hash, MessageSquare } from 'lucide-react';

interface PredefinedFieldsSelectorProps {
  selectedFields: FormField[];
  onToggle: (field: Omit<FormField, 'id' | 'order'>, enabled: boolean) => void;
}

const FIELD_ICONS: Record<string, React.ReactNode> = {
  'Nome completo': <User className="h-4 w-4" />,
  'Email': <Mail className="h-4 w-4" />,
  'Telefone': <Phone className="h-4 w-4" />,
  'LinkedIn': <Link className="h-4 w-4" />,
  'Pretensão salarial': <DollarSign className="h-4 w-4" />,
  'Disponibilidade para início': <Clock className="h-4 w-4" />,
  'Anos de experiência': <Hash className="h-4 w-4" />,
  'Cidade/Estado': <MapPin className="h-4 w-4" />,
  'Por que quer trabalhar conosco?': <MessageSquare className="h-4 w-4" />,
};

export function PredefinedFieldsSelector({
  selectedFields,
  onToggle,
}: PredefinedFieldsSelectorProps) {
  const isSelected = (label: string) =>
    selectedFields.some(f => f.label === label);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-foreground">Campos Disponíveis</h3>
        <Badge variant="outline" className="text-xs">
          {selectedFields.filter(f => f.predefined).length} de {PREDEFINED_FIELDS.length} ativos
        </Badge>
      </div>
      <div className="space-y-2">
        {PREDEFINED_FIELDS.map((field) => {
          const selected = isSelected(field.label);
          return (
            <div
              key={field.label}
              className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
                selected 
                  ? 'bg-primary/5 border-primary/30' 
                  : 'bg-muted/30 border-transparent hover:border-muted'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-md ${selected ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                  {FIELD_ICONS[field.label] || <FileText className="h-4 w-4" />}
                </div>
                <div>
                  <Label
                    htmlFor={`switch-${field.label}`}
                    className="text-sm font-medium cursor-pointer flex items-center gap-2"
                  >
                    {field.label}
                    {field.required && (
                      <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
                        Obrigatório
                      </Badge>
                    )}
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    {field.type === 'email' && 'Campo de email com validação'}
                    {field.type === 'phone' && 'Número de telefone'}
                    {field.type === 'text' && 'Campo de texto simples'}
                    {field.type === 'textarea' && 'Área de texto expandida'}
                    {field.type === 'currency' && 'Valor em moeda'}
                    {field.type === 'select' && 'Lista de opções'}
                    {field.type === 'number' && 'Campo numérico'}
                  </p>
                </div>
              </div>
              <Switch
                id={`switch-${field.label}`}
                checked={selected}
                onCheckedChange={(checked) => onToggle(field, checked)}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
