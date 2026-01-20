import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface CloseJobDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  jobTitle: string;
}

export function CloseJobDialog({
  open,
  onOpenChange,
  onConfirm,
  jobTitle,
}: CloseJobDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Encerrar Recebimento de Candidaturas</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-3">
              <p>
                Tem certeza que deseja encerrar as candidaturas para a vaga{' '}
                <strong>"{jobTitle}"</strong>?
              </p>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>O link público será desativado</li>
                <li>Candidatos não poderão mais aplicar</li>
                <li>
                  Você poderá enviar os currículos recebidos para análise
                </li>
              </ul>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>
            Encerrar Candidaturas
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
