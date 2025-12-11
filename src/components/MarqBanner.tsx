import { useState, useEffect } from "react";
import { X, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface MarqBannerProps {
  userId: string | undefined;
}

export function MarqBanner({ userId }: MarqBannerProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!userId) return;

    const fetchBannerStatus = async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("show_marq_banner")
        .eq("user_id", userId)
        .single();

      if (!error && data?.show_marq_banner) {
        setVisible(true);
      }
    };

    fetchBannerStatus();
  }, [userId]);

  const handleClick = async () => {
    if (userId) {
      await supabase
        .from("profiles")
        .update({ show_marq_banner: false })
        .eq("user_id", userId);
    }
    setVisible(false);
    window.open("https://marqhr.com/", "_blank");
  };

  const handleDismiss = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (userId) {
      await supabase
        .from("profiles")
        .update({ show_marq_banner: false })
        .eq("user_id", userId);
    }
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
