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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30">
      {/* Header */}
      <header className="absolute top-0 left-0 right-0 z-10 px-6 lg:px-12 py-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-600 rounded-xl">
            <FileText className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold text-slate-900">CompareCV</span>
        </div>
      </header>

      <div className="min-h-screen flex flex-col lg:flex-row items-center justify-center px-6 lg:px-12 py-24 gap-12 lg:gap-24">
        {/* Left side - Content */}
        <div className="flex-1 max-w-xl animate-fade-in">
          <h1 className="text-4xl lg:text-5xl xl:text-6xl font-bold text-slate-900 leading-tight mb-6">
            <span className="text-blue-600">Análise de currículos</span> com inteligência artificial
          </h1>
          
          <p className="text-lg text-slate-600 mb-10 leading-relaxed">
            Compare múltiplos candidatos de forma rápida e objetiva. 
            Nossa IA identifica o melhor match para sua vaga em segundos.
          </p>

          {/* How it works - 3 steps */}
          <div className="space-y-4">
            <div className="flex items-start gap-4 p-4 bg-white rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
              <div className="p-3 bg-blue-100 rounded-xl shrink-0">
                <Upload className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 mb-1">1. Enviar Dados</h3>
                <p className="text-sm text-slate-500">
                  Upload dos currículos (PDF) e descrição detalhada da vaga.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 bg-white rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
              <div className="p-3 bg-blue-100 rounded-xl shrink-0">
                <Brain className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 mb-1">2. Análise com IA</h3>
                <p className="text-sm text-slate-500">
                  Avaliação automática de Hard Skills e Soft Skills.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 bg-white rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
              <div className="p-3 bg-blue-100 rounded-xl shrink-0">
                <CheckCircle className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 mb-1">3. Ranking e Decisão</h3>
                <p className="text-sm text-slate-500">
                  Matriz visual, tabela comparativa e recomendação do candidato ideal.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right side - Form */}
        <div className="w-full max-w-md">
          <div className="bg-white p-8 lg:p-10 rounded-3xl shadow-xl border border-slate-100 animate-fade-in">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-slate-900 mb-2">
                {isLogin ? "Entrar na sua conta" : "Criar sua conta"}
              </h2>
              <p className="text-slate-500">
                {isLogin 
                  ? "Comece a analisar seus currículos hoje" 
                  : "Comece a usar o CompareCV gratuitamente"}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="seu@email.com"
                    required
                    className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Senha
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    minLength={6}
                    className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 text-base bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20 hover:shadow-xl hover:shadow-blue-600/30"
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

            <div className="mt-6 text-center">
              <button
                onClick={() => setIsLogin(!isLogin)}
                className="text-blue-600 hover:text-blue-700 font-medium transition-colors"
              >
                {isLogin
                  ? "Não tem conta? Criar agora"
                  : "Já tem conta? Faça login"}
              </button>
            </div>
          </div>

          <p className="text-center text-slate-400 text-sm mt-6">
            © {new Date().getFullYear()} CompareCV. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </div>
  );
}
