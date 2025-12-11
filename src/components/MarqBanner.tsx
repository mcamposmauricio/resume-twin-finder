import { useState, useEffect } from "react";
import { X, ExternalLink } from "lucide-react";

const BANNER_DISMISSED_KEY = "marq_banner_dismissed";

interface MarqBannerProps {
  show: boolean;
}

export function MarqBanner({ show }: MarqBannerProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (show) {
      const dismissed = localStorage.getItem(BANNER_DISMISSED_KEY);
      if (!dismissed) {
        setVisible(true);
      }
    }
  }, [show]);

  const handleClick = () => {
    localStorage.setItem(BANNER_DISMISSED_KEY, "true");
    setVisible(false);
    window.open("https://marqhr.com/", "_blank");
  };

  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    localStorage.setItem(BANNER_DISMISSED_KEY, "true");
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div 
      onClick={handleClick}
      className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground px-4 py-3 cursor-pointer hover:from-primary/90 hover:to-primary/70 transition-all"
    >
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
        <div className="flex-1 text-center">
          <p className="text-sm sm:text-base font-medium">
            <span className="font-bold">Você já conhece a MarQ?</span>{" "}
            <span className="hidden sm:inline">Sistema de RH completo: Controle de ponto, envio de holerites, Avaliação de desempenho, PDI e muito mais!</span>
            <span className="sm:hidden">Sistema de RH completo!</span>
            <span className="inline-flex items-center gap-1 ml-2 underline underline-offset-2">
              Clique aqui e conheça!
              <ExternalLink className="w-3.5 h-3.5" />
            </span>
          </p>
        </div>
        <button
          onClick={handleDismiss}
          className="p-1 hover:bg-primary-foreground/20 rounded transition-colors flex-shrink-0"
          title="Fechar"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
