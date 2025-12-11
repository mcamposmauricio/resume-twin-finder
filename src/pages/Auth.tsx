import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Mail, Lock, ArrowRight, Upload, Brain, CheckCircle, User, Building2, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import logoMarq from "@/assets/logo-marq-blue.png";

// List of blocked personal email domains
const BLOCKED_EMAIL_DOMAINS = [
  // pessoais comuns
  "gmail.com",
  "gmail.com.br",
  "hotmail.com",
  "hotmail.com.br",
  "outlook.com",
  "outlook.com.br",
  "yahoo.com",
  "yahoo.com.br",
  "live.com",
  "msn.com",
  "icloud.com",
  "me.com",
  "mac.com",
  "aol.com",
  "proton.me",
  "protonmail.com",
  "zoho.com",
  "mail.com",
  "gmx.com",
  "gmx.net",

  // provedores BR
  "bol.com.br",
  "uol.com.br",
  "terra.com.br",
  "ig.com.br",
  "r7.com",
  "zipmail.com.br",
  "globo.com",
  "superig.com.br",
  "oi.com.br",
  "brturbo.com.br",
  "pop.com.br",

  // descartáveis / temporários
  "mailinator.com",
  "yopmail.com",
  "10minutemail.com",
  "temp-mail.org",
  "guerrillamail.com",
  "sharklasers.com",
  "getnada.com",
  "trashmail.com",
  "dispostable.com",
  "maildrop.cc",
  "fakeinbox.com",
  "throwawaymail.com",

  // usados em testes (EN e PT)
  "example.com",
  "example.com.br",
  "test.com",
  "test.com.br",
  "testing.com",
  "testing.com.br",
  "email.com",
  "email.com.br",
  "teste.com",
  "teste.com.br",
  "exemplo.com",
  "exemplo.com.br",
  "dominiofake.com",
  "dominiofake.com.br",
  "emailfake.com",
  "emailfake.com.br",
  "testando.com",
  "testando.com.br",
  "seusite.com",
  "seusite.com.br",
];

const isPersonalEmail = (email: string): boolean => {
  const domain = email.toLowerCase().split("@")[1];
  return BLOCKED_EMAIL_DOMAINS.includes(domain);
};

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [employeeCount, setEmployeeCount] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [showInviteField, setShowInviteField] = useState(false);
  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
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

  // Validate email on change (only for signup)
  const handleEmailChange = (value: string) => {
    setEmail(value);
    if (!isLogin && value && value.includes("@")) {
      if (isPersonalEmail(value)) {
        setEmailError("Por favor, use um e-mail corporativo para continuar.");
      } else {
        setEmailError("");
      }
    } else {
      setEmailError("");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Block personal emails on signup
    if (!isLogin && isPersonalEmail(email)) {
      toast.error("Por favor, use um e-mail corporativo para continuar.");
      return;
    }

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
        const { data: signUpData, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
            data: {
              referred_by_code: inviteCode.trim().toUpperCase() || null,
              name: name.trim() || null,
              company_name: companyName.trim() || null,
              employee_count: employeeCount || null,
            },
          },
        });
        if (error) throw error;

        // If invite code was provided, update the profile with it
        if (inviteCode.trim() && signUpData?.user) {
          const { error: updateError } = await supabase
            .from("profiles")
            .update({ referred_by_code: inviteCode.trim().toUpperCase() })
            .eq("user_id", signUpData.user.id);

          if (updateError) {
            console.error("Error updating referred_by_code:", updateError);
          }
        }

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
        <div className="flex items-center gap-2">
          <span className="text-xl font-bold bg-gradient-to-r from-[#1e3a8a] to-[#2563eb] bg-clip-text text-transparent">
            CompareCV
          </span>
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-slate-500 font-medium">powered by</span>
            <img src={logoMarq} alt="MarQ HR" className="h-5" />
          </div>
        </div>
      </header>

      <div className="min-h-screen flex flex-col lg:flex-row items-center justify-center px-6 lg:px-12 py-24 gap-12 lg:gap-24">
        {/* Left side - Content */}
        <div className="flex-1 max-w-xl animate-fade-in">
          <h1 className="text-4xl lg:text-5xl xl:text-6xl font-bold text-slate-900 leading-tight mb-6">
            <span className="text-blue-600">Triagem de currículos em segundos</span>
            <br />
            com inteligência artificial
          </h1>

          <p className="text-lg text-slate-600 mb-10 leading-relaxed">
            Compare múltiplos candidatos de forma rápida e objetiva. Nossa IA identifica o melhor match para sua vaga em
            segundos.
          </p>

          {/* How it works - 3 steps */}
          <div className="space-y-4">
            <div className="flex items-start gap-4 p-4 bg-white rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
              <div className="p-3 bg-blue-100 rounded-xl shrink-0">
                <Upload className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 mb-1">1. Enviar Dados</h3>
                <p className="text-sm text-slate-500">Upload dos currículos (PDF) e descrição detalhada da vaga.</p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 bg-white rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
              <div className="p-3 bg-blue-100 rounded-xl shrink-0">
                <Brain className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 mb-1">2. Análise com IA</h3>
                <p className="text-sm text-slate-500">Avaliação automática de Hard Skills e Soft Skills.</p>
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
                {isLogin ? "Comece a analisar seus currículos hoje" : "Comece a usar o CompareCV gratuitamente"}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Email</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => handleEmailChange(e.target.value)}
                    placeholder={isLogin ? "seu@email.com" : "seu@empresa.com.br"}
                    required
                    className={`w-full pl-12 pr-4 py-3.5 bg-slate-50 border rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                      emailError ? "border-red-400 bg-red-50/50" : "border-slate-200"
                    }`}
                  />
                </div>
                {emailError && <p className="text-sm text-red-500 mt-1.5">{emailError}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Senha</label>
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

              {/* Additional signup fields */}
              {!isLogin && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Seu nome</label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Nome completo"
                        required
                        className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Nome da empresa</label>
                    <div className="relative">
                      <Building2 className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <input
                        type="text"
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        placeholder="Sua empresa"
                        required
                        className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Quantidade de funcionários</label>
                    <div className="relative">
                      <Users className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <select
                        value={employeeCount}
                        onChange={(e) => setEmployeeCount(e.target.value)}
                        required
                        className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all appearance-none cursor-pointer"
                      >
                        <option value="">Selecione</option>
                        <option value="1-10">1-10 funcionários</option>
                        <option value="11-50">11-50 funcionários</option>
                        <option value="51-200">51-200 funcionários</option>
                        <option value="201-500">201-500 funcionários</option>
                        <option value="501+">Mais de 500 funcionários</option>
                      </select>
                    </div>
                  </div>
                </>
              )}

              {/* Invite Code Field - Only show on signup */}
              {!isLogin && (
                <div className="space-y-2">
                  {!showInviteField ? (
                    <button
                      type="button"
                      onClick={() => setShowInviteField(true)}
                      className="text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors"
                    >
                      Tenho um código de convite
                    </button>
                  ) : (
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Código de Convite (opcional)
                      </label>
                      <input
                        type="text"
                        value={inviteCode}
                        onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                        placeholder="Ex: ABC123"
                        maxLength={6}
                        className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all uppercase tracking-wider text-center font-mono"
                      />
                    </div>
                  )}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 text-base bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20 hover:shadow-xl hover:shadow-blue-600/30"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="none"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
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
                {isLogin ? "Não tem conta? Criar agora" : "Já tem conta? Faça login"}
              </button>
            </div>
          </div>

          <div className="text-center text-slate-400 text-sm mt-6 flex items-center justify-center gap-2">
            <span>© {new Date().getFullYear()} CompareCV powered by</span>
            <img src={logoMarq} alt="MarQ HR" className="h-4" />
          </div>
        </div>
      </div>
    </div>
  );
}
