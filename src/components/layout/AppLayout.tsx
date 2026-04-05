import { useEffect, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from './AppSidebar';
import { toast } from 'sonner';
import logoMarq from '@/assets/logo-marq-blue.png';

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const navigate = useNavigate();
  const { session, userEmail, loading } = useAuth();

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
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />

        <div className="flex-1 flex flex-col min-w-0">
          {/* Header */}
          <header className="bg-card border-b border-border sticky top-0 z-50">
            <div className="px-3 sm:px-4 md:px-6 py-3 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <SidebarTrigger className="shrink-0" />
                <button
                  onClick={() => navigate('/vagas')}
                  className="flex items-center gap-2 hover:opacity-80 transition-opacity"
                >
                  <span className="text-lg sm:text-xl font-bold bg-gradient-to-r from-[#1e3a8a] to-[#2563eb] bg-clip-text text-transparent">
                    CompareCV
                  </span>
                  <div className="hidden sm:flex items-center gap-1.5">
                    <span className="text-xs text-muted-foreground font-medium">powered by</span>
                    <a href="https://marqhr.com/" target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>
                      <img src={logoMarq} alt="MarQ HR" className="h-5 hover:scale-105 transition-transform cursor-pointer" />
                    </a>
                  </div>
                </button>
              </div>

              <div className="flex items-center gap-2 sm:gap-3">
                <span className="text-sm text-muted-foreground hidden lg:block truncate max-w-[200px]">
                  {userEmail}
                </span>
                <button
                  onClick={handleLogout}
                  className="p-1.5 sm:p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
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
          <footer className="py-4 text-center text-sm text-muted-foreground border-t border-border bg-card">
            <div className="flex items-center justify-center gap-2">
              <span>CompareCV powered by</span>
              <a href="https://marqhr.com/" target="_blank" rel="noopener noreferrer">
                <img src={logoMarq} alt="MarQ HR" className="h-5 hover:scale-105 transition-transform cursor-pointer" />
              </a>
              <span>© {new Date().getFullYear()}</span>
            </div>
          </footer>
        </div>
      </div>
    </SidebarProvider>
  );
}
