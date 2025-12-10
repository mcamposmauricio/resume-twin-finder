import { UserCheck } from "lucide-react";

interface WelcomeScreenProps {
  onStart: () => void;
}

export function WelcomeScreen({ onStart }: WelcomeScreenProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] text-center p-8">
      <div className="mb-8 p-6 bg-blue-100 rounded-full">
        <UserCheck className="w-16 h-16 text-blue-700" />
      </div>
      <h1 className="text-4xl font-bold text-slate-800 mb-4">
        Bem-vindo ao CompareCV <span className="text-blue-600 text-lg font-normal">powered by MarQ</span>
      </h1>
      <p className="text-lg text-slate-600 max-w-2xl mb-8">
        A ferramenta de RH mais inteligente do mercado. Faça upload de múltiplos
        currículos, forneça a descrição da vaga e deixe nossa IA analisar cada
        candidato com precisão, identificando o melhor perfil para sua equipe.
      </p>
      <button
        onClick={onStart}
        className="px-8 py-4 bg-blue-700 text-white rounded-lg text-lg font-semibold hover:bg-blue-800 transition-colors shadow-lg hover:shadow-xl"
      >
        Começar Análise
      </button>
    </div>
  );
}
