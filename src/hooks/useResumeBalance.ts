import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

interface ResumeBalance {
  totalResumes: number;
  usedResumes: number;
  availableResumes: number;
  maxPerAnalysis: number;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

const MAX_RESUMES_PER_ANALYSIS = 30;

export function useResumeBalance(userId: string | undefined): ResumeBalance {
  const [totalResumes, setTotalResumes] = useState(0);
  const [usedResumes, setUsedResumes] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBalance = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Fetch user's total resumes from profile
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("total_resumes")
        .eq("user_id", userId)
        .maybeSingle();

      if (profileError) throw profileError;

      const total = profile?.total_resumes ?? 0;
      setTotalResumes(total);

      // Count used resumes from analyses
      const { data: analyses, error: analysesError } = await supabase
        .from("analyses")
        .select("candidates")
        .eq("user_id", userId);

      if (analysesError) throw analysesError;

      // Sum up all candidates from all analyses
      const used = analyses?.reduce((acc, analysis) => {
        const candidates = analysis.candidates as { name: string }[];
        return acc + (Array.isArray(candidates) ? candidates.length : 0);
      }, 0) ?? 0;

      setUsedResumes(used);
    } catch (err: any) {
      console.error("Error fetching resume balance:", err);
      setError(err.message || "Erro ao carregar saldo de currículos");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchBalance();
  }, [fetchBalance]);

  const availableResumes = Math.max(0, totalResumes - usedResumes);
  const maxPerAnalysis = Math.min(availableResumes, MAX_RESUMES_PER_ANALYSIS);

  return {
    totalResumes,
    usedResumes,
    availableResumes,
    maxPerAnalysis,
    loading,
    error,
    refetch: fetchBalance,
  };
}
