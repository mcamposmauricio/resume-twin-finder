import { Loader2, Brain, FileSearch, BarChart3 } from "lucide-react";
import { useState, useEffect } from "react";

const loadingSteps = [
  { icon: FileSearch, text: "Lendo currículos..." },
  { icon: Brain, text: "Analisando competências..." },
  { icon: BarChart3, text: "Gerando relatório..." },
];

export function LoadingScreen() {
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStep((prev) => (prev + 1) % loadingSteps.length);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  const CurrentIcon = loadingSteps[currentStep].icon;

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8">
      <div className="relative mb-8">
        <div className="absolute inset-0 bg-blue-200 rounded-full animate-ping opacity-50" />
        <div className="relative p-6 bg-blue-100 rounded-full">
          <Loader2 className="w-16 h-16 text-blue-700 animate-spin" />
        </div>
      </div>

      <h2 className="text-2xl font-bold text-slate-800 mb-4">
        Analisando Candidatos
      </h2>

      <div className="flex items-center gap-3 text-lg text-slate-600">
        <CurrentIcon className="w-6 h-6 text-blue-600" />
        <span>{loadingSteps[currentStep].text}</span>
      </div>

      <div className="flex gap-2 mt-8">
        {loadingSteps.map((_, index) => (
          <div
            key={index}
            className={`w-3 h-3 rounded-full transition-colors ${
              index === currentStep ? "bg-blue-600" : "bg-slate-300"
            }`}
          />
        ))}
      </div>

      <p className="text-slate-500 mt-8 max-w-md">
        Nossa IA está analisando cada currículo em profundidade. Isso pode levar
        alguns segundos...
      </p>
    </div>
  );
}
