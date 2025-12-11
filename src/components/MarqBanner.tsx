import { useState, useEffect } from "react";
import { X, Sparkles, ArrowRight } from "lucide-react";
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
      className="relative overflow-hidden bg-gradient-to-r from-[#1e3a8a] via-[#2563eb] to-[#3b82f6] text-white px-4 py-3 cursor-pointer group transition-all hover:shadow-lg"
    >
      {/* Animated background effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
      
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-4 relative">
        <div className="flex-1 flex items-center justify-center gap-3">
          <Sparkles className="w-5 h-5 animate-pulse hidden sm:block" />
          <p className="text-sm sm:text-base font-medium text-center">
            <span className="font-bold">🚀 Turbine seu RH!</span>{" "}
            <span className="hidden md:inline">
              Ponto digital, holerites, avaliações e PDI em um só lugar.
            </span>
            <span className="md:hidden">
              Sistema completo de RH!
            </span>
            <span className="inline-flex items-center gap-1 ml-2 bg-white/20 px-3 py-1 rounded-full font-semibold group-hover:bg-white/30 transition-colors">
              Conhecer a MarQ
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </span>
          </p>
        </div>
        <button
          onClick={handleDismiss}
          className="p-1.5 hover:bg-white/20 rounded-full transition-colors flex-shrink-0"
          title="Fechar"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
