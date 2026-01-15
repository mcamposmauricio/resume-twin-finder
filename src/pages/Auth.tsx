import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Mail, Lock, ArrowRight, Upload, Brain, CheckCircle, User, Building2, Users, Phone, Eye, EyeOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { centralHubClient, TOOL_SOURCE, employeeRangeToNumber } from "@/lib/centralHubClient";
import { toast } from "sonner";
import logoMarq from "@/assets/logo-marq-blue.png";

// Declaração de tipo para Google Tag Manager dataLayer
declare global {
  interface Window {
    dataLayer: Record<string, unknown>[];
  }
}

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

// Error message helper for Central Hub signup
const getSignupErrorMessage = (error: any): string => {
  const message = error?.message?.toLowerCase() || '';
  
  if (message.includes('already registered') || message.includes('already exists')) {
    return 'Este email já está cadastrado. Tente fazer login.';
  }
  if (message.includes('invalid email')) {
    return 'Email inválido.';
  }
  if (message.includes('password')) {
    return 'A senha deve ter no mínimo 6 caracteres.';
  }
  
  return 'Erro ao criar conta. Tente novamente.';
};

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [name, setName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [employeeCount, setEmployeeCount] = useState("");
  const [phone, setPhone] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [showInviteField, setShowInviteField] = useState(false);
  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
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

  // Validate password confirmation
  const handleConfirmPasswordChange = (value: string) => {
    setConfirmPassword(value);
    if (value && password && value !== password) {
      setPasswordError("As senhas não coincidem.");
    } else {
      setPasswordError("");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Block personal emails on signup
    if (!isLogin && isPersonalEmail(email)) {
      toast.error("Por favor, use um e-mail corporativo para continuar.");
      return;
    }

    // Validate password confirmation for signup
    if (!isLogin && password !== confirmPassword) {
      toast.error("As senhas não coincidem.");
      return;
    }

    // Validate required fields for signup
    if (!isLogin) {
      if (!name.trim() || name.trim().length < 2) {
        toast.error("Nome deve ter no mínimo 2 caracteres.");
        return;
      }
      if (!companyName.trim() || companyName.trim().length < 2) {
        toast.error("Nome da empresa deve ter no mínimo 2 caracteres.");
        return;
      }
      if (!employeeCount) {
        toast.error("Selecione a quantidade de funcionários.");
        return;
      }
    }

    setLoading(true);

    try {
      if (isLogin) {
        // Login still uses local Supabase
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        toast.success("Login realizado com sucesso!");
      } else {
        // SIGNUP: Create user in Central Hub
        const { data: authData, error: signUpError } = await centralHubClient.auth.signUp({
          email,
          password,
          options: {
            data: {
              name: name.trim(),
              company_name: companyName.trim(),
              number_of_employees: employeeRangeToNumber[employeeCount] || 0,
              phone: phone.trim() || '',
              source: TOOL_SOURCE,
              referred_by_code: inviteCode.trim().toUpperCase() || null,
            },
          },
        });

        if (signUpError) {
          throw signUpError;
        }

        // Dispatch webhook to sync with tools
        if (authData.user && authData.session) {
          try {
            await fetch('https://pijbrphradettztsguqd.supabase.co/functions/v1/dispatch-webhook', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authData.session.access_token}`,
              },
              body: JSON.stringify({
                user_id: authData.user.id,
                event_type: 'user.created',
                password: password, // For hash at destination
              }),
            });
          } catch (webhookError) {
            // Don't block the flow if webhook fails
            console.error('Webhook dispatch failed:', webhookError);
          }
        }

        // Trigger event for Google Tag Manager
        if (typeof window !== 'undefined') {
          window.dataLayer = window.dataLayer || [];
          window.dataLayer.push({ 'event': 'cadastroCompareCV' });
        }

        // Send lead data to MarQ webhook (if user was created)
        if (authData?.user) {
          try {
            await supabase.functions.invoke('send-lead-to-marq', {
              body: {
                userId: authData.user.id,
                leadSource: 'comparecv_signup',
                name: name.trim(),
                email: email,
                companyName: companyName.trim(),
                employeeCount: employeeCount,
                phone: phone.trim(),
              },
            });
          } catch (leadErr) {
            console.error('Failed to send lead:', leadErr);
          }
        }

        toast.success("Conta criada com sucesso! Você agora tem acesso a todas as ferramentas do Hub.");
        
        // Redirect to LoginHub for login
        navigate("/LoginHub");
      }
    } catch (error: any) {
      console.error("Auth error:", error);
      if (isLogin) {
        if (error.message.includes("Invalid login credentials")) {
          toast.error("Email ou senha incorretos.");
        } else {
          toast.error(error.message || "Erro ao fazer login.");
        }
      } else {
        toast.error(getSignupErrorMessage(error));
      }
    } finally {
      setLoading(false);
    }
  };

  // Reset form when switching modes
  const handleModeSwitch = () => {
    setIsLogin(!isLogin);
    setConfirmPassword("");
    setPasswordError("");
    setEmailError("");
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
            <a href="https://marqhr.com/" target="_blank" rel="noopener noreferrer">
              <img src={logoMarq} alt="MarQ HR" className="h-5 hover:scale-105 transition-transform cursor-pointer" />
            </a>
          </div>
        </div>
      </header>

      <div className="min-h-screen flex flex-col px-6 lg:px-12 py-24">
        {/* Top Hero Section - Centered */}
        <div className="text-center mb-12 animate-fade-in pt-8">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold text-blue-600 leading-tight mb-2">
            Triagem de currículos em segundos
          </h1>
          <p className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900">
            com inteligência artificial
          </p>
        </div>

        {/* Content row - Steps + Form */}
        <div className="flex-1 flex flex-col lg:flex-row items-center justify-center gap-12 lg:gap-24">
          {/* Left side - Content */}
          <div className="flex-1 max-w-xl animate-fade-in">
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
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    minLength={6}
                    className="w-full pl-12 pr-12 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password - Only for signup */}
              {!isLogin && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Confirmar Senha</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => handleConfirmPasswordChange(e.target.value)}
                      placeholder="••••••••"
                      required
                      minLength={6}
                      className={`w-full pl-12 pr-12 py-3.5 bg-slate-50 border rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                        passwordError ? "border-red-400 bg-red-50/50" : "border-slate-200"
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  {passwordError && <p className="text-sm text-red-500 mt-1.5">{passwordError}</p>}
                </div>
              )}

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
                        minLength={2}
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
                        minLength={2}
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
                        <option value="500+">Mais de 500 funcionários</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Telefone <span className="text-slate-400 font-normal">(opcional)</span></label>
                    <div className="relative">
                      <Phone className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="(11) 99999-9999"
                        className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      />
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
                disabled={loading || (!isLogin && !!passwordError)}
                className="w-full py-4 text-base bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20 hover:shadow-xl hover:shadow-blue-600/30 disabled:opacity-50 disabled:cursor-not-allowed"
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
                onClick={handleModeSwitch}
                className="text-blue-600 hover:text-blue-700 font-medium transition-colors"
              >
                {isLogin ? "Não tem conta? Criar agora" : "Já tem conta? Faça login"}
              </button>
            </div>
          </div>

          <div className="text-center text-slate-400 text-sm mt-6 flex items-center justify-center gap-2">
            <span>© {new Date().getFullYear()} CompareCV powered by</span>
            <a href="https://marqhr.com/" target="_blank" rel="noopener noreferrer">
              <img src={logoMarq} alt="MarQ HR" className="h-4 hover:scale-105 transition-transform cursor-pointer" />
            </a>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
}
