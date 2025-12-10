import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FileText, Mail, Lock, ArrowRight, Upload, Brain, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        navigate("/");
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate("/");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        toast.success("Login realizado com sucesso!");
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
          },
        });
        if (error) throw error;
        toast.success("Conta criada com sucesso!");
      }
    } catch (error: any) {
      console.error("Auth error:", error);
      if (error.message.includes("User already registered")) {
        toast.error("Este email já está cadastrado. Faça login.");
      } else if (error.message.includes("Invalid login credentials")) {
        toast.error("Email ou senha incorretos.");
      } else {
        toast.error(error.message || "Erro ao processar solicitação.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left side - Branding & Info */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#1a1a1a] p-12 flex-col justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white/10 rounded-xl">
            <FileText className="w-6 h-6 text-white" />
          </div>
          <span className="text-xl font-bold text-white">CompareCV</span>
        </div>
        
        <div className="space-y-8">
          <div>
            <h1 className="text-4xl lg:text-5xl font-bold text-white leading-tight mb-4">
              Currículos analisados em segundos.
            </h1>
            <p className="text-lg text-white/60">
              Os melhores candidatos para sua vaga com precisão e rapidez.
            </p>
          </div>

          {/* How it works - 3 steps */}
          <div className="space-y-4 pt-4">
            <div className="flex items-start gap-4 p-4 bg-white/5 rounded-xl">
              <div className="p-2 bg-white/10 rounded-lg shrink-0">
                <Upload className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-white mb-1">1. Enviar Dados</h3>
                <p className="text-sm text-white/60">
                  Upload dos currículos (PDF) e descrição detalhada da vaga.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 bg-white/5 rounded-xl">
              <div className="p-2 bg-white/10 rounded-lg shrink-0">
                <Brain className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-white mb-1">2. Análise com IA</h3>
                <p className="text-sm text-white/60">
                  Avaliação automática de Hard Skills e Soft Skills.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 bg-white/5 rounded-xl">
              <div className="p-2 bg-white/10 rounded-lg shrink-0">
                <CheckCircle className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-white mb-1">3. Ranking e Decisão</h3>
                <p className="text-sm text-white/60">
                  Matriz visual, tabela comparativa e recomendação do candidato ideal.
                </p>
              </div>
            </div>
          </div>
        </div>
        
        <p className="text-white/40 text-sm">
          © {new Date().getFullYear()} CompareCV. Todos os direitos reservados.
        </p>
      </div>

      {/* Right side - Form */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md animate-fade-in">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-8">
            <div className="inline-flex items-center gap-2">
              <div className="p-2 bg-[#1a1a1a] rounded-xl">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold text-foreground">CompareCV</span>
            </div>
          </div>

          <div className="text-center mb-8">
            <h2 className="text-2xl lg:text-3xl font-bold text-foreground mb-2">
              {isLogin ? "Entrar na sua conta" : "Criar sua conta"}
            </h2>
            <p className="text-muted-foreground">
              {isLogin 
                ? "Comece a analisar seus currículos hoje" 
                : "Comece a usar o CompareCV gratuitamente"}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  required
                  className="input-clean pl-12"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Senha
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={6}
                  className="input-clean pl-12"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 text-base bg-[#1a1a1a] hover:bg-[#2a2a2a] text-white font-medium rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Carregando...
                </span>
              ) : (
                <>
                  {isLogin ? "Entrar" : "Criar Conta"}
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 text-center">
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-foreground hover:text-foreground/80 font-medium transition-colors"
            >
              {isLogin
                ? "Não tem conta? Criar agora"
                : "Já tem conta? Faça login"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
