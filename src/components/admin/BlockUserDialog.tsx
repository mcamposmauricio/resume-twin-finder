import { useState } from "react";
import { Ban, CheckCircle, Loader2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface BlockUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userName: string;
  userEmail: string;
  isBlocked: boolean;
  onConfirm: () => Promise<void>;
}

export function BlockUserDialog({
  open,
  onOpenChange,
  userName,
  userEmail,
  isBlocked,
  onConfirm,
}: BlockUserDialogProps) {
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await onConfirm();
      onOpenChange(false);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = (open: boolean) => {
    if (!loading) {
      onOpenChange(open);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isBlocked ? (
              <>
                <CheckCircle className="h-5 w-5 text-green-600" />
                Desbloquear Usuário
              </>
            ) : (
              <>
                <Ban className="h-5 w-5 text-destructive" />
                Bloquear Usuário
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            {isBlocked
              ? "Ao desbloquear, este usuário poderá realizar novas análises de currículos novamente."
              : "Ao bloquear, este usuário não poderá mais realizar análises de currículos."}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <div className="rounded-lg bg-muted p-4">
            <p className="font-medium">{userName || "Sem nome"}</p>
            <p className="text-sm text-muted-foreground">{userEmail}</p>
          </div>

          {!isBlocked && (
            <div className="mt-4 flex items-start gap-3 rounded-lg border border-yellow-200 bg-yellow-50 p-3 dark:border-yellow-900/50 dark:bg-yellow-900/20">
              <AlertTriangle className="h-5 w-5 shrink-0 text-yellow-600 dark:text-yellow-500" />
              <div className="text-sm text-yellow-800 dark:text-yellow-200">
                <p className="font-medium">Atenção</p>
                <p className="mt-1">
                  O usuário ainda terá acesso ao sistema, apenas não poderá
                  iniciar novas análises de currículos.
                </p>
              </div>
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
            variant={isBlocked ? "default" : "destructive"}
            onClick={handleConfirm}
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : isBlocked ? (
              <CheckCircle className="mr-2 h-4 w-4" />
            ) : (
              <Ban className="mr-2 h-4 w-4" />
            )}
            {loading
              ? "Processando..."
              : isBlocked
              ? "Desbloquear"
              : "Bloquear"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
