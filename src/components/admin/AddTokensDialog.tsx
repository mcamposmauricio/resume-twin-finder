import { useState } from "react";
import { Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface AddTokensDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userName: string;
  userEmail: string;
  currentBalance: number;
  onConfirm: (amount: number) => Promise<void>;
}

export function AddTokensDialog({
  open,
  onOpenChange,
  userName,
  userEmail,
  currentBalance,
  onConfirm,
}: AddTokensDialogProps) {
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    const numAmount = parseInt(amount, 10);
    if (isNaN(numAmount) || numAmount <= 0) return;

    setLoading(true);
    try {
      await onConfirm(numAmount);
      setAmount("");
      onOpenChange(false);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = (open: boolean) => {
    if (!loading) {
      setAmount("");
      onOpenChange(open);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Adicionar Currículos
          </DialogTitle>
          <DialogDescription>
            Adicione currículos ao saldo de{" "}
            <span className="font-medium text-foreground">
              {userName || userEmail}
            </span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="rounded-lg bg-muted p-3">
            <p className="text-sm text-muted-foreground">Saldo atual</p>
            <p className="text-2xl font-bold">{currentBalance} currículos</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Quantidade a adicionar</Label>
            <Input
              id="amount"
              type="number"
              min="1"
              placeholder="Ex: 10"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              disabled={loading}
            />
          </div>

          {amount && parseInt(amount, 10) > 0 && (
            <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
              <p className="text-sm text-muted-foreground">Novo saldo</p>
              <p className="text-xl font-bold text-primary">
                {currentBalance + parseInt(amount, 10)} currículos
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => handleClose(false)}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={loading || !amount || parseInt(amount, 10) <= 0}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Adicionando...
              </>
            ) : (
              <>
                <Plus className="mr-2 h-4 w-4" />
                Adicionar
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
