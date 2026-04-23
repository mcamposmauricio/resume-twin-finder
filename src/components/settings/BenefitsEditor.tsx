import { useState } from 'react';
import { Plus, X, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';

interface BenefitsEditorProps {
  benefits: string[];
  onChange: (benefits: string[]) => void;
}

const SUGGESTED_BENEFITS = [
  'Home office / Trabalho remoto',
  'Vale refeição',
  'Vale alimentação',
  'Vale transporte',
  'Plano de saúde',
  'Plano odontológico',
  'Gympass / Academia',
  'Day off aniversário',
  'PLR / Bônus',
  'Cursos e capacitação',
  'Horário flexível',
  'Auxílio home office',
];

export function BenefitsEditor({ benefits, onChange }: BenefitsEditorProps) {
  const safeBenefits = Array.isArray(benefits) ? benefits : [];
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newBenefit, setNewBenefit] = useState('');
  const [pendingSelections, setPendingSelections] = useState<string[]>([]);

  const handleAdd = () => {
    if (newBenefit.trim() && !benefits.includes(newBenefit.trim())) {
      onChange([...benefits, newBenefit.trim()]);
      setNewBenefit('');
    }
  };

  const handleRemove = (benefit: string) => {
    onChange(benefits.filter((b) => b !== benefit));
  };

  const handleToggleSuggestion = (suggestion: string) => {
    setPendingSelections((prev) =>
      prev.includes(suggestion)
        ? prev.filter((s) => s !== suggestion)
        : [...prev, suggestion]
    );
  };

  const handleConfirmSelections = () => {
    if (pendingSelections.length > 0) {
      const newBenefits = pendingSelections.filter((s) => !benefits.includes(s));
      onChange([...benefits, ...newBenefits]);
    }
    setPendingSelections([]);
    setIsDialogOpen(false);
  };

  const handleOpenDialog = () => {
    setPendingSelections([]);
    setNewBenefit('');
    setIsDialogOpen(true);
  };

  const unusedSuggestions = SUGGESTED_BENEFITS.filter(
    (s) => !benefits.includes(s)
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium">Benefícios</h4>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleOpenDialog}
        >
          <Plus className="h-4 w-4 mr-1" />
          Adicionar
        </Button>
      </div>

      {benefits.length === 0 ? (
        <p className="text-sm text-muted-foreground py-4 text-center border rounded-lg border-dashed">
          Nenhum benefício adicionado ainda
        </p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {benefits.map((benefit) => (
            <Badge
              key={benefit}
              variant="secondary"
              className="py-1.5 px-3 text-sm"
            >
              <Check className="h-3 w-3 mr-1.5" />
              {benefit}
              <button
                type="button"
                onClick={() => handleRemove(benefit)}
                className="ml-2 hover:text-destructive"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar Benefícios</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Digite um benefício personalizado
              </label>
              <div className="flex gap-2">
                <Input
                  value={newBenefit}
                  onChange={(e) => setNewBenefit(e.target.value)}
                  placeholder="Ex: Auxílio creche"
                  onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                />
                <Button onClick={handleAdd} disabled={!newBenefit.trim()}>
                  Adicionar
                </Button>
              </div>
            </div>

            {unusedSuggestions.length > 0 && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">
                  Ou selecione sugestões (pode escolher várias)
                </label>
                <div className="flex flex-wrap gap-2">
                  {unusedSuggestions.map((suggestion) => {
                    const isSelected = pendingSelections.includes(suggestion);
                    return (
                      <Badge
                        key={suggestion}
                        variant={isSelected ? 'default' : 'outline'}
                        className="cursor-pointer hover:bg-accent py-1.5 px-3 transition-colors"
                        onClick={() => handleToggleSuggestion(suggestion)}
                      >
                        {isSelected ? (
                          <Check className="h-3 w-3 mr-1" />
                        ) : (
                          <Plus className="h-3 w-3 mr-1" />
                        )}
                        {suggestion}
                      </Badge>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Fechar
            </Button>
            {pendingSelections.length > 0 && (
              <Button onClick={handleConfirmSelections}>
                Adicionar {pendingSelections.length} selecionado{pendingSelections.length > 1 ? 's' : ''}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
