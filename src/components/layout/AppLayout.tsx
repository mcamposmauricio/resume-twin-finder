import { useEffect, ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { LogOut, Briefcase, Users, FileText, Settings, Activity } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { NavLink } from '@/components/NavLink';
import { toast } from 'sonner';
import logoAzul from '@/assets/Logo_Azul.svg';

const navItems = [
  { title: 'Vagas', url: '/vagas', icon: Briefcase },
  { title: 'Talentos', url: '/banco-de-talentos', icon: Users },
  { title: 'Formulários', url: '/formularios', icon: FileText },
  { title: 'Configurações', url: '/configuracoes', icon: Settings },
];

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const navigate = useNavigate();
  const { session, userEmail, loading } = useAuth();

  const isAdmin = userEmail === 'mauricio@marqponto.com.br' || userEmail === 'marco@marqponto.com.br';

  useEffect(() => {
    if (!loading && !session) {
      navigate('/auth');
    }
  }, [loading, session, navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success('Logout realizado com sucesso!');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!session) return null;

  return (
    <div className="min-h-screen flex flex-col w-full bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-50 shadow-xs">
        <div className="px-3 sm:px-4 md:px-6 py-2 flex items-center justify-between gap-2">
          {/* Left: Logo + Nav */}
          <div className="flex items-center gap-1 sm:gap-4 min-w-0">
            <button
              onClick={() => navigate('/vagas')}
              className="flex items-center gap-2 hover:opacity-80 transition-opacity shrink-0"
            >
              <img src={logoAzul} alt="CompareCV" className="h-7 sm:h-8" />
            </button>

            <nav className="flex items-center gap-0.5 sm:gap-1 ml-2 sm:ml-4">
              {navItems.map((item) => (
                <NavLink
                  key={item.url}
                  to={item.url}
                  end={item.url === '/vagas'}
                  className="flex items-center gap-1.5 px-2 sm:px-3 py-1.5 rounded-ds text-sm text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-colors font-body"
                  activeClassName="bg-primary/10 text-primary font-medium"
                >
                  <item.icon className="h-4 w-4 shrink-0" />
                  <span className="hidden md:inline">{item.title}</span>
                </NavLink>
              ))}

              {isAdmin && (
                <NavLink
                  to="/atividades"
                  className="flex items-center gap-1.5 px-2 sm:px-3 py-1.5 rounded-ds text-sm text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-colors font-body"
                  activeClassName="bg-primary/10 text-primary font-medium"
                >
                  <Activity className="h-4 w-4 shrink-0" />
                  <span className="hidden md:inline">Atividades</span>
                </NavLink>
              )}
            </nav>
          </div>

          {/* Right: User + Logout */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <span className="text-sm text-muted-foreground hidden lg:block truncate max-w-[200px] font-body">
              {userEmail}
            </span>
            <button
              onClick={handleLogout}
              className="p-1.5 sm:p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-ds transition-colors"
              title="Sair"
            >
              <LogOut className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1">
        {children}
      </main>

      {/* Footer */}
      <footer className="py-4 text-center text-sm text-muted-foreground border-t border-border bg-card font-body">
        <div className="flex items-center justify-center gap-2">
          <span>CompareCV powered by</span>
          <a href="https://marqhr.com/" target="_blank" rel="noopener noreferrer">
            <img src={logoAzul} alt="MarQ HR" className="h-5 hover:scale-105 transition-transform cursor-pointer" />
          </a>
          <span>© {new Date().getFullYear()}</span>
        </div>
      </footer>
    </div>
  );
}
