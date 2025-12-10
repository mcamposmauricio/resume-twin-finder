import { FileSearch, Brain, BarChart3 } from "lucide-react";
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
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8 animate-fade-in">
      {/* Animated loader */}
      <div className="relative mb-10">
        <div className="w-24 h-24 rounded-full border-4 border-muted" />
        <div className="absolute inset-0 w-24 h-24 rounded-full border-4 border-primary border-t-transparent animate-spin" />
        <div className="absolute inset-0 flex items-center justify-center">
          <CurrentIcon className="w-10 h-10 text-primary" />
        </div>
      </div>

      <h2 className="text-2xl font-bold text-foreground mb-3">
        Analisando Candidatos
      </h2>

      <p className="text-lg text-muted-foreground mb-8">
        {loadingSteps[currentStep].text}
      </p>

      {/* Progress dots */}
      <div className="flex gap-2">
        {loadingSteps.map((_, index) => (
          <div
            key={index}
            className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
              index === currentStep ? "bg-primary w-6" : "bg-muted"
            }`}
          />
        ))}
      </div>

      <p className="text-muted-foreground mt-10 max-w-md text-sm">
        Nossa IA está analisando cada currículo em profundidade.
        Isso pode levar alguns segundos...
      </p>
    </div>
  );
}
