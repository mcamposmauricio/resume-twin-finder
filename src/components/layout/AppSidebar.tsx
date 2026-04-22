import { Briefcase, Users, FileText, Settings, Activity, HelpCircle, Search, ExternalLink } from 'lucide-react';
import { NavLink } from '@/components/NavLink';
import { useAuth } from '@/contexts/AuthContext';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { UserProfileCard } from './UserProfileCard';
import logoAzul from '@/assets/Logo_Azul.svg';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';

const mainItems = [
  { title: 'Vagas', url: '/vagas', icon: Briefcase, end: true },
  { title: 'Talentos', url: '/banco-de-talentos', icon: Users, end: false },
  { title: 'Formulários', url: '/formularios', icon: FileText, end: false },
  { title: 'Configurações', url: '/configuracoes', icon: Settings, end: false },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';
  const { userEmail } = useAuth();

  const isAdmin = userEmail === 'mauricio@marqponto.com.br' || userEmail === 'marco@marqponto.com.br';

  return (
    <Sidebar collapsible="icon" className="border-r border-border">
      <SidebarHeader className="border-b border-border">
        <div className={`flex items-center ${collapsed ? 'justify-center px-1 py-2' : 'px-2 py-2'}`}>
          {collapsed ? (
            <div className="h-8 w-8 rounded-md bg-primary/10 flex items-center justify-center">
              <span className="text-primary font-heading font-bold text-sm">C</span>
            </div>
          ) : (
            <img src={logoAzul} alt="CompareCV" className="h-7" />
          )}
        </div>
        {!collapsed && (
          <div className="px-2 pb-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar"
                className="pl-8 h-8 text-sm bg-muted/40 border-border font-body"
              />
            </div>
          </div>
        )}
      </SidebarHeader>

      <SidebarContent>
        {/* Plataforma MarQHR */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Plataforma MarQHR">
                  <a
                    href="https://marqhr.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
                  >
                    <ExternalLink className="h-4 w-4 shrink-0" />
                    {!collapsed && (
                      <>
                        <span className="font-body text-sm">Plataforma MarQHR</span>
                        <Badge variant="info" className="ml-auto text-[10px] py-0 px-1.5">
                          Completo!
                        </Badge>
                      </>
                    )}
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {!collapsed && <Separator className="mx-2 w-auto" />}

        {/* Menu principal */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild tooltip={item.title}>
                    <NavLink
                      to={item.url}
                      end={item.end}
                      className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
                      activeClassName="bg-primary/10 text-primary font-medium"
                    >
                      <item.icon className="h-4 w-4 shrink-0" />
                      {!collapsed && <span className="font-body text-sm">{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}

              {isAdmin && (
                <SidebarMenuItem>
                  <SidebarMenuButton asChild tooltip="Atividades">
                    <NavLink
                      to="/atividades"
                      className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
                      activeClassName="bg-primary/10 text-primary font-medium"
                    >
                      <Activity className="h-4 w-4 shrink-0" />
                      {!collapsed && <span className="font-body text-sm">Atividades</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Central de ajuda */}
        <SidebarGroup className="mt-auto">
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Central de ajuda">
                  <a
                    href="mailto:suporte@marqhr.com"
                    className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
                  >
                    <HelpCircle className="h-4 w-4 shrink-0" />
                    {!collapsed && <span className="font-body text-sm">Central de ajuda</span>}
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-border p-2">
        <UserProfileCard collapsed={collapsed} />
      </SidebarFooter>
    </Sidebar>
  );
}
