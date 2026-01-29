import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ArrowLeft, Filter, Calendar as CalendarIcon, Search, X, ChevronLeft, ChevronRight, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { UserManagementTab } from "@/components/admin/UserManagementTab";
import type { DateRange } from "react-day-picker";
import type { Json } from "@/integrations/supabase/types";

interface ActivityLog {
  id: string;
  user_id: string;
  user_email: string;
  company_name: string | null;
  action_type: string;
  action_label: string;
  entity_type: string | null;
  entity_id: string | null;
  metadata: Json;
  created_at: string;
}

const ACTION_TYPES = [
  { value: 'user_signup', label: 'Cadastro de usuário' },
  { value: 'user_login', label: 'Login' },
  { value: 'analysis_started', label: 'Análise iniciada' },
  { value: 'analysis_completed', label: 'Análise concluída' },
  { value: 'analysis_draft_saved', label: 'Rascunho salvo' },
  { value: 'job_created', label: 'Vaga criada' },
  { value: 'job_published', label: 'Vaga publicada' },
  { value: 'job_paused', label: 'Vaga pausada' },
  { value: 'job_resumed', label: 'Vaga reativada' },
  { value: 'job_closed', label: 'Vaga encerrada' },
  { value: 'job_edited', label: 'Vaga editada' },
  { value: 'application_received', label: 'Candidatura recebida' },
  { value: 'application_analyzed', label: 'Candidaturas analisadas' },
  { value: 'application_triage_updated', label: 'Triagem atualizada' },
  { value: 'form_template_created', label: 'Formulário criado' },
  { value: 'form_template_updated', label: 'Formulário atualizado' },
  { value: 'form_template_deleted', label: 'Formulário excluído' },
  { value: 'referral_bonus', label: 'Bônus de indicação' },
  { value: 'admin_add_resumes', label: 'Currículos adicionados' },
  { value: 'user_blocked', label: 'Usuário bloqueado' },
  { value: 'user_unblocked', label: 'Usuário desbloqueado' },
];

const ITEMS_PER_PAGE = 50;

export default function ActivityLog() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);

  // Filters
  const [emailFilter, setEmailFilter] = useState("");
  const [companyFilter, setCompanyFilter] = useState("");
  const [selectedActions, setSelectedActions] = useState<string[]>([]);
  const [dateMode, setDateMode] = useState<'single' | 'range'>('range');
  const [singleDate, setSingleDate] = useState<Date | undefined>();
  const [dateRange, setDateRange] = useState<DateRange | undefined>();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) {
        navigate('/');
        return;
      }

      if (session.user.email !== 'mauricio@marqponto.com.br') {
        navigate('/');
        return;
      }

      setUser(session.user);
      setLoading(false);
    };

    checkAuth();
  }, [navigate]);

  useEffect(() => {
    if (user) {
      fetchLogs();
    }
  }, [user, page, emailFilter, companyFilter, selectedActions, singleDate, dateRange, dateMode]);

  const fetchLogs = async () => {
    try {
      let query = supabase
        .from('activity_logs')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false });

      // Apply filters
      if (emailFilter.trim()) {
        query = query.ilike('user_email', `%${emailFilter.trim()}%`);
      }

      if (companyFilter.trim()) {
        query = query.ilike('company_name', `%${companyFilter.trim()}%`);
      }

      if (selectedActions.length > 0) {
        query = query.in('action_type', selectedActions);
      }

      // Date filters
      if (dateMode === 'single' && singleDate) {
        const dateStr = format(singleDate, 'yyyy-MM-dd');
        query = query.gte('created_at', `${dateStr}T00:00:00`)
                     .lt('created_at', `${dateStr}T23:59:59`);
      } else if (dateMode === 'range' && dateRange?.from) {
        const fromStr = format(dateRange.from, 'yyyy-MM-dd');
        query = query.gte('created_at', `${fromStr}T00:00:00`);
        
        if (dateRange.to) {
          const toStr = format(dateRange.to, 'yyyy-MM-dd');
          query = query.lte('created_at', `${toStr}T23:59:59`);
        }
      }

      // Pagination
      const from = (page - 1) * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;

      if (error) throw error;

      setLogs(data || []);
      setTotalCount(count || 0);
    } catch (error) {
      console.error('Error fetching logs:', error);
    }
  };

  const toggleAction = (actionType: string) => {
    setSelectedActions(prev =>
      prev.includes(actionType)
        ? prev.filter(a => a !== actionType)
        : [...prev, actionType]
    );
    setPage(1);
  };

  const clearFilters = () => {
    setEmailFilter("");
    setCompanyFilter("");
    setSelectedActions([]);
    setSingleDate(undefined);
    setDateRange(undefined);
    setPage(1);
  };

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);
  const hasActiveFilters = emailFilter || companyFilter || selectedActions.length > 0 || singleDate || dateRange?.from;

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 py-6 sm:py-10 md:px-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/')}
            className="shrink-0"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
              Painel Administrativo
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Gerenciamento de usuários e log de atividades
            </p>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="users" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="users">Usuários</TabsTrigger>
            <TabsTrigger value="activities">Atividades</TabsTrigger>
          </TabsList>

          <TabsContent value="users">
            <UserManagementTab />
          </TabsContent>

          <TabsContent value="activities">
            <div className="space-y-6">
              <div className="text-sm text-muted-foreground">
                {totalCount} {totalCount === 1 ? 'registro' : 'registros'} encontrados
              </div>

              {/* Filters */}
              <div className="card-clean p-4 sm:p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Filter className="w-4 h-4 text-muted-foreground" />
                  <span className="font-medium text-sm">Filtros</span>
                  {hasActiveFilters && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearFilters}
                      className="ml-auto text-xs h-7"
                    >
                      <X className="w-3 h-3 mr-1" />
                      Limpar filtros
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Email Filter */}
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Email</Label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        placeholder="Filtrar por email..."
                        value={emailFilter}
                        onChange={(e) => { setEmailFilter(e.target.value); setPage(1); }}
                        className="pl-9"
                      />
                    </div>
                  </div>

                  {/* Company Filter */}
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Empresa</Label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        placeholder="Filtrar por empresa..."
                        value={companyFilter}
                        onChange={(e) => { setCompanyFilter(e.target.value); setPage(1); }}
                        className="pl-9"
                      />
                    </div>
                  </div>

                  {/* Date Filter */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Label className="text-xs text-muted-foreground">Data</Label>
                      <div className="flex gap-1">
                        <Button
                          variant={dateMode === 'single' ? 'secondary' : 'ghost'}
                          size="sm"
                          onClick={() => { setDateMode('single'); setDateRange(undefined); setPage(1); }}
                          className="h-5 text-xs px-2"
                        >
                          Dia
                        </Button>
                        <Button
                          variant={dateMode === 'range' ? 'secondary' : 'ghost'}
                          size="sm"
                          onClick={() => { setDateMode('range'); setSingleDate(undefined); setPage(1); }}
                          className="h-5 text-xs px-2"
                        >
                          Período
                        </Button>
                      </div>
                    </div>
                    
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !(singleDate || dateRange?.from) && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {dateMode === 'single' && singleDate ? (
                            format(singleDate, "dd/MM/yyyy", { locale: ptBR })
                          ) : dateMode === 'range' && dateRange?.from ? (
                            dateRange.to ? (
                              `${format(dateRange.from, "dd/MM/yy")} - ${format(dateRange.to, "dd/MM/yy")}`
                            ) : (
                              format(dateRange.from, "dd/MM/yyyy", { locale: ptBR })
                            )
                          ) : (
                            <span>Selecionar data</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        {dateMode === 'single' ? (
                          <Calendar
                            mode="single"
                            selected={singleDate}
                            onSelect={(date) => { setSingleDate(date); setPage(1); }}
                            initialFocus
                            className="pointer-events-auto"
                          />
                        ) : (
                          <Calendar
                            mode="range"
                            selected={dateRange}
                            onSelect={(range) => { setDateRange(range); setPage(1); }}
                            numberOfMonths={2}
                            initialFocus
                            className="pointer-events-auto"
                          />
                        )}
                      </PopoverContent>
                    </Popover>
                  </div>

                  {/* Action Types Filter */}
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Tipo de ação</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-left font-normal"
                        >
                          {selectedActions.length > 0 ? (
                            <span className="truncate">
                              {selectedActions.length} selecionado{selectedActions.length > 1 ? 's' : ''}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">Todas as ações</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-64 max-h-80 overflow-y-auto" align="start">
                        <div className="space-y-2">
                          {ACTION_TYPES.map((action) => (
                            <div key={action.value} className="flex items-center space-x-2">
                              <Checkbox
                                id={action.value}
                                checked={selectedActions.includes(action.value)}
                                onCheckedChange={() => toggleAction(action.value)}
                              />
                              <label
                                htmlFor={action.value}
                                className="text-sm cursor-pointer flex-1"
                              >
                                {action.label}
                              </label>
                            </div>
                          ))}
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              </div>

              {/* Table */}
              <div className="card-clean overflow-hidden">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[140px]">Data/Hora</TableHead>
                        <TableHead>Usuário</TableHead>
                        <TableHead>Empresa</TableHead>
                        <TableHead>Ação</TableHead>
                        <TableHead className="hidden md:table-cell">Detalhes</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {logs.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                            Nenhum registro encontrado
                          </TableCell>
                        </TableRow>
                      ) : (
                        logs.map((log) => (
                          <TableRow key={log.id}>
                            <TableCell className="text-sm whitespace-nowrap">
                              {format(new Date(log.created_at), "dd/MM/yy HH:mm", { locale: ptBR })}
                            </TableCell>
                            <TableCell className="text-sm">
                              <span className="truncate block max-w-[200px]" title={log.user_email}>
                                {log.user_email}
                              </span>
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {log.company_name || '-'}
                            </TableCell>
                            <TableCell>
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
                                {log.action_label}
                              </span>
                            </TableCell>
                            <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                              <div className="flex items-center gap-2">
                                {log.entity_type && (
                                  <span className="truncate block max-w-[150px]">
                                    {log.entity_type}: {log.entity_id?.substring(0, 8)}...
                                  </span>
                                )}
                                {(log.action_type === 'analysis_completed' || log.action_type === 'application_analyzed') && log.entity_id && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 px-2"
                                    onClick={() => navigate(`/?viewAnalysis=${log.entity_id}`)}
                                    title="Ver análise"
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between px-4 py-3 border-t">
                    <span className="text-sm text-muted-foreground">
                      Página {page} de {totalPages}
                    </span>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1}
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                      >
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
