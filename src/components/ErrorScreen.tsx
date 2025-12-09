import { AlertTriangle, RefreshCw } from "lucide-react";

interface ErrorScreenProps {
  message: string;
  onRetry: () => void;
}

export function ErrorScreen({ message, onRetry }: ErrorScreenProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8">
      <div className="mb-8 p-6 bg-red-100 rounded-full">
        <AlertTriangle className="w-16 h-16 text-red-600" />
      </div>

      <h2 className="text-2xl font-bold text-slate-800 mb-4">
        Ops! Algo deu errado
      </h2>

      <p className="text-lg text-slate-600 max-w-md mb-8">{message}</p>

      <button
        onClick={onRetry}
        className="flex items-center gap-2 px-6 py-3 bg-blue-700 text-white rounded-lg font-semibold hover:bg-blue-800 transition-colors"
      >
        <RefreshCw className="w-5 h-5" />
        Tentar Novamente
      </button>
    </div>
  );
}
