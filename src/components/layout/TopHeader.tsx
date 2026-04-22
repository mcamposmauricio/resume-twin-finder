import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSidebar } from '@/components/ui/sidebar';
import { CompanySelector } from './CompanySelector';

export function TopHeader() {
  const { toggleSidebar } = useSidebar();

  return (
    <header className="h-12 bg-card border-b border-border sticky top-0 z-40 flex items-center justify-between px-3 sm:px-4 shadow-xs">
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleSidebar}
          className="gap-2 font-body text-muted-foreground hover:text-foreground"
        >
          <Menu className="h-4 w-4" />
          <span className="text-sm">Menu</span>
        </Button>
      </div>
      <div className="flex items-center gap-2">
        <CompanySelector />
      </div>
    </header>
  );
}
