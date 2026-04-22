import { ChevronDown, Building2 } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/contexts/AuthContext';

export function CompanySelector() {
  const { userEmail } = useAuth();
  const companyName = userEmail ? userEmail.split('@')[1]?.split('.')[0] || 'Empresa' : 'Empresa';
  const displayName = companyName.charAt(0).toUpperCase() + companyName.slice(1);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-2 px-2 py-1 rounded-full border border-border bg-card hover:bg-muted/50 transition-colors max-w-[220px]">
          <Avatar className="h-6 w-6 shrink-0">
            <AvatarFallback className="bg-primary/10 text-primary text-[10px] font-heading font-semibold">
              {displayName.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <span className="text-sm font-body truncate text-foreground">{displayName}</span>
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem disabled>
          <Building2 className="h-4 w-4 mr-2" /> {displayName}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
