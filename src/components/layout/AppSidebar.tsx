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
} from '@/components/ui/sidebar';

const menuItemStyle: React.CSSProperties = {
  fontFamily: 'Montserrat, sans-serif',
};
const menuItemClass =
  "flex items-center gap-2 !text-[14px] !font-semibold !text-[#3a424e] !px-3 !py-[9px] h-auto hover:text-foreground [font-family:Montserrat,sans-serif!important]";
const menuItemActiveClass = "bg-primary/10 !text-primary";

const mainItems = [
  { title: 'Vagas', url: '/vagas', icon: Briefcase, end: true },
  { title: 'Talentos', url: '/banco-de-talentos', icon: Users, end: false },
  { title: 'Formulários', url: '/formularios', icon: FileText, end: false },
  { title: 'Configurações', url: '/configuracoes', icon: Settings, end: false },
];

export function AppSidebar() {
  const { userEmail } = useAuth();
  const isAdmin = userEmail === 'mauricio@marqponto.com.br' || userEmail === 'marco@marqponto.com.br';

  return (
    <Sidebar collapsible="offcanvas" className="border-r border-border">
      <SidebarHeader className="border-b border-border">
        <div className="flex items-center px-2 py-2">
          <img src={logoAzul} alt="CompareCV" className="h-7" />
        </div>
        <div className="px-2 pb-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar"
              className="pl-8 h-8 text-sm bg-muted/40 border-border font-body"
            />
          </div>
        </div>
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
                    className={menuItemClass}
                  >
                    <ExternalLink className="h-4 w-4 shrink-0" />
                    <span className="font-body">Plataforma MarQHR</span>
                    <Badge variant="info" className="ml-auto text-[10px] py-0 px-1.5">
                      Completo!
                    </Badge>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <Separator className="mx-2 w-auto" />

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
                      className={menuItemClass}
                      activeClassName={menuItemActiveClass}
                    >
                      <item.icon className="h-4 w-4 shrink-0" />
                      <span className="font-body">{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}

              {isAdmin && (
                <SidebarMenuItem>
                  <SidebarMenuButton asChild tooltip="Atividades">
                    <NavLink
                      to="/atividades"
                      className={menuItemClass}
                      activeClassName={menuItemActiveClass}
                    >
                      <Activity className="h-4 w-4 shrink-0" />
                      <span className="font-body">Atividades</span>
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
                    className={menuItemClass}
                  >
                    <HelpCircle className="h-4 w-4 shrink-0" />
                    <span className="font-body">Central de ajuda</span>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-border p-2">
        <UserProfileCard collapsed={false} />
      </SidebarFooter>
    </Sidebar>
  );
}
