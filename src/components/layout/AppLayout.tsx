import { useEffect, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from './AppSidebar';
import { CompanySelector } from './CompanySelector';
import logoAzul from '@/assets/Logo_Azul.svg';

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const navigate = useNavigate();
  const { session, loading } = useAuth();

  useEffect(() => {
    if (!loading && !session) {
      navigate('/auth');
    }
  }, [loading, session, navigate]);

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
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />

        <div className="flex-1 flex flex-col min-w-0">
          {/* Top header */}
          <header className="h-12 bg-card border-b border-border sticky top-0 z-40 flex items-center justify-between px-3 sm:px-4 shadow-xs">
            <div className="flex items-center gap-2">
              <SidebarTrigger className="text-muted-foreground hover:text-foreground" />
            </div>
            <div className="flex items-center gap-2">
              <CompanySelector />
            </div>
          </header>

          {/* Content */}
          <main className="flex-1">{children}</main>

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
      </div>
    </SidebarProvider>
  );
}
