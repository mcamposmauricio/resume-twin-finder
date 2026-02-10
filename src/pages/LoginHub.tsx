import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Mail, Lock, AlertCircle } from "lucide-react";
import logoWhite from "@/assets/logo-marq-white.png";
import { logActivity } from "@/hooks/useActivityLog";

const LoginHub = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const [isAutoLogin, setIsAutoLogin] = useState(false);
  const [autoLoginError, setAutoLoginError] = useState<string | null>(null);
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check for existing session
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        navigate("/", { replace: true });
      }
    };
    checkSession();
  }, [navigate]);

  // Auto-login via access_token from HR Hub
  useEffect(() => {
    const hubToken = searchParams.get("access_token");
    
    if (!hubToken) return;

    const autoLogin = async () => {
      setIsAutoLogin(true);
      setAutoLoginError(null);

      try {
        const { data, error: fnError } = await supabase.functions.invoke("exchange-hub-token", {
          body: { hub_token: hubToken },
        });

        if (fnError || !data?.access_token) {
          throw new Error(fnError?.message || data?.error || "Falha na autenticação automática");
        }

        const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
          access_token: data.access_token,
          refresh_token: data.refresh_token,
        });

        if (sessionError) {
          throw sessionError;
        }

        // Log login activity
        if (sessionData?.user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('company_name')
            .eq('user_id', sessionData.user.id)
            .maybeSingle();
          
          logActivity({
            userId: sessionData.user.id,
            userEmail: sessionData.user.email || '',
            companyName: profile?.company_name || undefined,
            actionType: 'user_login',
            metadata: { source: 'hr_hub_auto' },
          });
        }

        // Clear the token from URL and navigate
        navigate("/", { replace: true });
      } catch (err: any) {
        console.error("Auto-login error:", err);
        logActivity({
          userId: 'unknown',
          userEmail: 'unknown',
          actionType: 'login_error',
          isError: true,
          metadata: { error_message: err.message, context: 'hr_hub_auto_login' },
        });
        setAutoLoginError(err.message || "Falha na autenticação automática. Use o login manual.");
        setIsAutoLogin(false);
      }
    };

    autoLogin();
  }, [searchParams, navigate]);

  // Manual login handler
  const handleManualLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke("hub-login", {
        body: { email, password },
      });

      if (fnError || !data?.access_token) {
        throw new Error(fnError?.message || data?.error || "Credenciais inválidas");
      }

      const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
        access_token: data.access_token,
        refresh_token: data.refresh_token,
      });

      if (sessionError) {
        throw sessionError;
      }

      // Log login activity
      if (sessionData?.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('company_name')
          .eq('user_id', sessionData.user.id)
          .maybeSingle();
        
        logActivity({
          userId: sessionData.user.id,
          userEmail: sessionData.user.email || email,
          companyName: profile?.company_name || undefined,
          actionType: 'user_login',
          metadata: { source: 'hr_hub_manual' },
        });
      }

      navigate("/", { replace: true });
    } catch (err: any) {
      console.error("Manual login error:", err);
      logActivity({
        userId: 'unknown',
        userEmail: email,
        actionType: 'login_error',
        isError: true,
        metadata: { error_message: err.message, context: 'hr_hub_manual_login' },
      });
      setError(err.message || "Falha no login. Verifique suas credenciais.");
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-login loading state
  if (isAutoLogin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
          <p className="text-lg text-muted-foreground">Autenticando via HR Hub...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted flex flex-col">
      {/* Header */}
      <header className="w-full bg-primary py-4 px-6">
        <div className="max-w-7xl mx-auto flex items-center">
          <img src={logoWhite} alt="Marq" className="h-8" />
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="bg-card rounded-xl shadow-lg border p-8">
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold text-foreground">Login HR Hub</h1>
              <p className="text-muted-foreground mt-2">
                Acesse com suas credenciais do HR Hub
              </p>
            </div>

            {/* Auto-login error message */}
            {autoLoginError && (
              <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                <p className="text-sm text-destructive">{autoLoginError}</p>
              </div>
            )}

            {/* Error message */}
            {error && (
              <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            <form onSubmit={handleManualLogin} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full" 
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Entrando...
                  </>
                ) : (
                  "Entrar"
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                Não tem uma conta?{" "}
                <a 
                  href="/auth" 
                  className="text-primary hover:underline font-medium"
                >
                  Cadastre-se
                </a>
              </p>
            </div>
          </div>

          <p className="text-center text-xs text-muted-foreground mt-6">
            © {new Date().getFullYear()} Marq. Todos os direitos reservados.
          </p>
        </div>
      </main>
    </div>
  );
};

export default LoginHub;
