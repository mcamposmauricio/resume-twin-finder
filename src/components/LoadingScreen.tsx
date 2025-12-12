import { FileSearch, Brain, BarChart3 } from "lucide-react";
import { useState, useEffect } from "react";

const loadingSteps = [
  { icon: FileSearch, text: "Lendo currículos..." },
  { icon: Brain, text: "Analisando competências..." },
  { icon: BarChart3, text: "Gerando relatório..." },
];

interface LoadingScreenProps {
  progress?: number;
  currentStep?: string;
}

export function LoadingScreen({ progress = 0, currentStep }: LoadingScreenProps) {
  const [animatedStep, setAnimatedStep] = useState(0);

  useEffect(() => {
    // Only use animated steps if no real progress is provided
    if (progress === 0) {
      const interval = setInterval(() => {
        setAnimatedStep((prev) => (prev + 1) % loadingSteps.length);
      }, 2500);
      return () => clearInterval(interval);
    }
  }, [progress]);

  // Determine which icon to show based on progress
  const getIconForProgress = () => {
    if (progress < 30) return FileSearch;
    if (progress < 85) return Brain;
    return BarChart3;
  };

  const CurrentIcon = progress > 0 ? getIconForProgress() : loadingSteps[animatedStep].icon;
  const displayText = currentStep || loadingSteps[animatedStep].text;

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

      {/* Real Progress Bar */}
      <div className="w-full max-w-md mb-4">
        <div className="bg-muted rounded-full h-4 overflow-hidden shadow-inner">
          <div
            className="h-full bg-gradient-to-r from-primary to-primary/80 transition-all duration-500 ease-out rounded-full"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Percentage */}
      <p className="text-3xl font-bold text-primary mb-2">
        {progress}%
      </p>

      {/* Current step text */}
      <p className="text-lg text-muted-foreground mb-8">
        {displayText}
      </p>

      {/* Progress dots for visual feedback */}
      <div className="flex gap-2">
        {[0, 1, 2].map((index) => {
          const stepProgress = progress > 0 ? progress : (animatedStep / 3) * 100;
          const isActive = progress > 0 
            ? (index === 0 && progress < 30) || 
              (index === 1 && progress >= 30 && progress < 85) || 
              (index === 2 && progress >= 85)
            : index === animatedStep;
          
          return (
            <div
              key={index}
              className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                isActive ? "bg-primary w-6" : "bg-muted"
              }`}
            />
          );
        })}
      </div>

      <p className="text-muted-foreground mt-10 max-w-md text-sm">
        Nossa IA está analisando cada currículo em profundidade.
        {progress > 0 && progress < 100 && " Aguarde..."}
      </p>
    </div>
  );
}
