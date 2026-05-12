import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Mail, Lock, ArrowRight, Upload, Brain, CheckCircle, User, Building2, Users, Phone, Eye, EyeOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { centralHubClient, TOOL_SOURCE, employeeRangeToNumber } from "@/lib/centralHubClient";
import { toast } from "sonner";
import logoAzul from "@/assets/logo-marqtalent.png";
import logoBranca from "@/assets/logo-marqtalent-white.png";
import logoMarqHrWhite from "@/assets/logo-marqhr-white.svg";
import { useUTMTracking } from "@/hooks/useUTMTracking";
import { pushGTMEvent } from "@/hooks/useGTMEvent";
import { logActivity } from "@/hooks/useActivityLog";

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

  // Initialize UTM tracking
  const { getUTMParams } = useUTMTracking();

  useEffect(() => {
    // [AI-FLOW] All users redirect to /vagas — no role check needed
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        navigate('/vagas', { replace: true });
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate('/vagas', { replace: true });
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
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        
        // Log login activity
        if (data?.user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('company_name')
            .eq('user_id', data.user.id)
            .maybeSingle();
          
          logActivity({
            userId: data.user.id,
            userEmail: data.user.email || email,
            companyName: profile?.company_name || undefined,
            actionType: 'user_login',
          });
        }
        
        toast.success("Login realizado com sucesso!");
      } else {
        // SIGNUP: Create user LOCALLY first (immediate login)
        const { data: authData, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: {
              name: name.trim(),
              company_name: companyName.trim(),
              employee_count: employeeCount,
              phone: phone.trim() || '',
              referred_by_code: inviteCode.trim().toUpperCase() || null,
            },
          },
        });

        if (signUpError) {
          throw signUpError;
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

        // [NEW] Send lead to RD Station (fire-and-forget)
        if (authData?.user) {
          const utmParams = getUTMParams();
          supabase.functions.invoke('send-lead-to-rdstation', {
            body: {
              conversion_identifier: 'comparecv_signup',
              email: email,
              name: name.trim(),
              personal_phone: phone.trim(),
              company_name: companyName.trim(),
              ...utmParams,
            },
          }).catch(err => console.log('RD Station sync:', err?.message));

          // Push GTM form_submit_success event (with duplicate prevention)
          pushGTMEvent('form_submit_success', { 
            formId: 'signup-form', 
            formName: 'Cadastro CompareCV' 
          });
        }

        // SYNC with Central Hub in background (fire-and-forget)
        if (authData?.user) {
          centralHubClient.auth.signUp({
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
          }).then(({ data: hubData }) => {
            // Dispatch webhook after Central Hub signup
            if (hubData?.user && hubData?.session) {
              fetch('https://pijbrphradettztsguqd.supabase.co/functions/v1/dispatch-webhook', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${hubData.session.access_token}`,
                },
                body: JSON.stringify({
                  user_id: hubData.user.id,
                  event_type: 'user.created',
                  password: password,
                }),
              }).catch(err => console.log('Webhook dispatch:', err?.message));
            }
          }).catch(err => {
            // Don't block - user is already registered locally
            console.log('Central Hub sync:', err?.message);
          });
        }

        toast.success("Conta criada com sucesso!");
      }
    } catch (error: any) {
      console.error("Auth error:", error);
      
      // Log error activity
      logActivity({
        userId: 'unknown',
        userEmail: email,
        actionType: isLogin ? 'login_error' : 'signup_error',
        isError: true,
        metadata: {
          error_message: error.message || 'Unknown error',
          context: isLogin ? 'supabase_login' : 'supabase_signup',
        },
      });
      
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
    <div className="min-h-screen grid lg:grid-cols-2 bg-background">
      {/* Left side - Brand panel */}
      <div className="hidden lg:flex flex-col justify-between p-12 xl:p-16 bg-gradient-to-br from-primary to-primary-dark text-primary-foreground relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 pointer-events-none" style={{
          backgroundImage: 'radial-gradient(circle at 20% 20%, hsl(var(--primary-foreground)) 0%, transparent 40%), radial-gradient(circle at 80% 80%, hsl(var(--primary-foreground)) 0%, transparent 40%)'
        }} />
        <div className="relative z-10" />

        <div className="relative z-10 max-w-xl">
          <h1 className="text-4xl xl:text-5xl font-bold leading-tight mb-6 font-heading">
            Recrute melhor — do anúncio da vaga à contratação.
          </h1>
          <p className="text-lg xl:text-xl text-primary-foreground/85 mb-10 leading-relaxed">
            Portal de vagas, pipeline de recrutamento e banco de talentos em um só lugar. Feito para times de RH e gestores que contratam com agilidade.
          </p>

          <ul className="space-y-4">
            {[
              "Publique vagas com página de carreiras própria",
              "Receba candidaturas com formulários personalizados",
              "Organize seu pipeline em Kanban visual",
              "Centralize todo o seu banco de talentos",
            ].map((item) => (
              <li key={item} className="flex items-center gap-3">
                <span className="flex items-center justify-center w-7 h-7 rounded-full bg-success shrink-0">
                  <CheckCircle className="w-4 h-4 text-success-foreground" />
                </span>
                <span className="text-base text-primary-foreground/95">{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="relative z-10 text-sm text-primary-foreground/70">
          © {new Date().getFullYear()} MarQTalent powered by MarQ HR
        </div>
      </div>

      {/* Right side - Form */}
      <div className="flex items-center justify-center p-6 lg:p-12 bg-background">
        <div className="w-full max-w-md">
          <div className="bg-card p-8 lg:p-10 rounded-[20px] shadow-ds-md border border-border animate-fade-in">
            <div className="mb-6 flex justify-center">
              <img src={logoAzul} alt="MarQTalent" className="h-10" />
            </div>
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-foreground mb-2 font-heading">
                {isLogin ? "Entrar na sua conta" : "Criar sua conta"}
              </h2>
              <p className="text-muted-foreground">
                {isLogin ? "Acesse seu portal de vagas" : "Comece a usar o CompareCV gratuitamente"}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Email</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => handleEmailChange(e.target.value)}
                    placeholder={isLogin ? "seu@email.com" : "seu@empresa.com.br"}
                    required
                    className={`w-full pl-12 pr-4 py-3.5 bg-muted border rounded-[10px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all ${
                      emailError ? "border-destructive bg-destructive/5" : "border-border"
                    }`}
                  />
                </div>
                {emailError && <p className="text-sm text-red-500 mt-1.5">{emailError}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Senha</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    minLength={6}
                    className="w-full pl-12 pr-12 py-3.5 bg-muted border border-border rounded-[10px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password - Only for signup */}
              {!isLogin && (
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Confirmar Senha</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => handleConfirmPasswordChange(e.target.value)}
                      placeholder="••••••••"
                      required
                      minLength={6}
                      className={`w-full pl-12 pr-12 py-3.5 bg-muted border rounded-[10px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all ${
                        passwordError ? "border-destructive bg-destructive/5" : "border-border"
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
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
                  <label className="block text-sm font-medium text-foreground mb-2">Seu nome</label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Nome completo"
                        required
                        minLength={2}
                        className="w-full pl-12 pr-4 py-3.5 bg-muted border border-border rounded-[10px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                      />
                    </div>
                  </div>

                  <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Nome da empresa</label>
                    <div className="relative">
                      <Building2 className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <input
                        type="text"
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        placeholder="Sua empresa"
                        required
                        minLength={2}
                        className="w-full pl-12 pr-4 py-3.5 bg-muted border border-border rounded-[10px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                      />
                    </div>
                  </div>

                  <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Quantidade de funcionários</label>
                    <div className="relative">
                      <Users className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <select
                        value={employeeCount}
                        onChange={(e) => setEmployeeCount(e.target.value)}
                        required
                        className="w-full pl-12 pr-4 py-3.5 bg-muted border border-border rounded-[10px] text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all appearance-none cursor-pointer"
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
                  <label className="block text-sm font-medium text-foreground mb-2">Telefone <span className="text-muted-foreground font-normal">(opcional)</span></label>
                    <div className="relative">
                      <Phone className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="(11) 99999-9999"
                        className="w-full pl-12 pr-4 py-3.5 bg-muted border border-border rounded-[10px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
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
                      className="text-sm text-primary hover:text-primary-dark font-medium transition-colors"
                    >
                      Tenho um código de convite
                    </button>
                  ) : (
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Código de Convite (opcional)
                      </label>
                      <input
                        type="text"
                        value={inviteCode}
                        onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                        placeholder="Ex: ABC123"
                        maxLength={6}
                        className="w-full px-4 py-3.5 bg-muted border border-border rounded-[10px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all uppercase tracking-wider text-center font-mono"
                      />
                    </div>
                  )}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || (!isLogin && !!passwordError)}
                className="w-full py-4 text-base bg-card hover:bg-muted text-foreground font-semibold rounded-ds-btn transition-all flex items-center justify-center gap-2 border border-border shadow-ds-sm disabled:opacity-50 disabled:cursor-not-allowed font-heading"
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

            {isLogin && (
              <>
                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-border" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card px-2 text-muted-foreground">ou</span>
                  </div>
                </div>
                <a
                  href="https://sso.marqhr.com/?urlFrom=https%3A%2F%2Fapp.marqtalent.com.br%2F"
                  className="w-full py-4 text-base bg-primary hover:bg-primary-dark text-primary-foreground font-semibold rounded-ds-btn transition-all flex items-center justify-center gap-2 shadow-btn-primary font-heading"
                  aria-label="Logar com a MarQ HR"
                >
                  <span className="text-sm font-medium opacity-80">Logar com a</span>
                  <img src={logoMarqHrWhite} alt="MarQ HR" className="h-5" />
                </a>
              </>
            )}

            <div className="mt-6 text-center">
              <button
                onClick={handleModeSwitch}
                className="text-primary hover:text-primary-dark font-medium transition-colors"
              >
                {isLogin ? "Não tem conta? Criar agora" : "Já tem conta? Faça login"}
              </button>
            </div>
          </div>

          <div className="lg:hidden text-center text-muted-foreground text-sm mt-6">
            © {new Date().getFullYear()} MarQTalent powered by MarQ HR
          </div>
        </div>
      </div>
    </div>
  );
}

