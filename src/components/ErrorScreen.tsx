import { AlertTriangle, RefreshCw } from "lucide-react";

interface ErrorScreenProps {
  message: string;
  onRetry: () => void;
}

export function ErrorScreen({ message, onRetry }: ErrorScreenProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8 animate-fade-in">
      <div className="w-20 h-20 bg-red-100 rounded-2xl flex items-center justify-center mb-6">
        <AlertTriangle className="w-10 h-10 text-red-500" />
      </div>

      <h2 className="text-2xl font-bold text-foreground mb-3">
        Ops! Algo deu errado
      </h2>

      <p className="text-muted-foreground max-w-md mb-8">{message}</p>

      <button onClick={onRetry} className="btn-primary">
        <RefreshCw className="w-5 h-5" />
        Tentar Novamente
      </button>
    </div>
  );
}
