import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Users, LogOut, Settings, FileText, Activity, ArrowLeft } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useTalentPool, TalentProfile } from '@/hooks/useTalentPool';
import { useUserRole } from '@/hooks/useUserRole';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TalentCard } from '@/components/talent/TalentCard';
import { TalentDetailPanel } from '@/components/talent/TalentDetailPanel';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import logoMarq from '@/assets/logo-marq-blue.png';

export default function TalentPool() {
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string>();
  const [userEmail, setUserEmail] = useState('');
  const [selectedTalent, setSelectedTalent] = useState<TalentProfile | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const { isFullAccess, loading: roleLoading } = useUserRole(userId);
  const {
    talents,
    totalTalents,
    loading,
    searchQuery,
    setSearchQuery,
    jobFilter,
    setJobFilter,
    jobOptions,
  } = useTalentPool(userId);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate('/auth');
      } else {
        setUserId(session.user.id);
        setUserEmail(session.user.email || '');
      }
    });
  }, [navigate]);

  useEffect(() => {
    if (!roleLoading && userId && !isFullAccess) {
      toast.error('Você não tem acesso a esta funcionalidade.');
      navigate('/');
    }
  }, [roleLoading, isFullAccess, userId, navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success('Logout realizado com sucesso!');
  };

  if (loading || roleLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!isFullAccess) return null;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-3 sm:px-4 md:px-8 py-3 sm:py-4 flex items-center justify-between gap-2">
          <button
            onClick={() => navigate('/vagas')}
            className="flex items-center gap-2 sm:gap-3 hover:opacity-80 transition-opacity min-w-0 group"
          >
            <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2">
              <span className="text-lg sm:text-xl font-bold bg-gradient-to-r from-[#1e3a8a] to-[#2563eb] bg-clip-text text-transparent">
                CompareCV
              </span>
              <div className="hidden sm:flex items-center gap-1.5">
                <span className="text-xs text-muted-foreground font-medium">powered by</span>
                <a href="https://marqhr.com/" target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>
                  <img src={logoMarq} alt="MarQ HR" className="h-5 hover:scale-105 transition-transform cursor-pointer" />
                </a>
              </div>
            </div>
          </button>

          <div className="flex items-center gap-2 sm:gap-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" className="h-9 w-9">
                  <Settings className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuItem onClick={() => navigate('/vagas')} className="cursor-pointer py-2.5">
                  <ArrowLeft className="w-4 h-4 mr-2.5 text-muted-foreground" />
                  <span>Voltar às Vagas</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/formularios')} className="cursor-pointer py-2.5">
                  <FileText className="w-4 h-4 mr-2.5 text-muted-foreground" />
                  <span>Modelos de Formulário</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/configuracoes')} className="cursor-pointer py-2.5">
                  <Settings className="w-4 h-4 mr-2.5 text-muted-foreground" />
                  <span>Configurações</span>
                </DropdownMenuItem>
                {userEmail === 'mauricio@marqponto.com.br' && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => navigate('/atividades')} className="cursor-pointer py-2.5">
                      <Activity className="w-4 h-4 mr-2.5 text-muted-foreground" />
                      <span>Log de Atividades</span>
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            <span className="text-sm text-muted-foreground hidden lg:block truncate max-w-[150px]">
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

      <div className="container mx-auto px-4 py-8 max-w-5xl flex-1">
        {/* Page Title */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Users className="w-6 h-6 text-primary" />
              Banco de Talentos
            </h1>
            <p className="text-muted-foreground">
              {totalTalents} {totalTalents === 1 ? 'candidato único' : 'candidatos únicos'} no seu banco
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome ou email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={jobFilter} onValueChange={setJobFilter}>
            <SelectTrigger className="w-full sm:w-[250px]">
              <SelectValue placeholder="Filtrar por vaga" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as vagas</SelectItem>
              {jobOptions.map((job) => (
                <SelectItem key={job.id} value={job.id}>
                  {job.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Talent List */}
        {talents.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Users className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="font-semibold mb-2">
                {searchQuery || jobFilter !== 'all'
                  ? 'Nenhum candidato encontrado'
                  : 'Nenhum candidato no banco'}
              </h3>
              <p className="text-muted-foreground text-center text-sm">
                {searchQuery || jobFilter !== 'all'
                  ? 'Tente ajustar os filtros de busca.'
                  : 'Os candidatos aparecerão aqui quando se candidatarem às suas vagas.'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3">
            {talents.map((talent) => (
              <TalentCard
                key={talent.email}
                talent={talent}
                onClick={() => {
                  setSelectedTalent(talent);
                  setDetailOpen(true);
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Detail Panel */}
      <TalentDetailPanel
        talent={selectedTalent}
        open={detailOpen}
        onOpenChange={setDetailOpen}
      />

      {/* Footer */}
      <footer className="py-6 text-center text-sm text-muted-foreground border-t border-border bg-card">
        <div className="flex items-center justify-center gap-2">
          <span>CompareCV powered by</span>
          <a href="https://marqhr.com/" target="_blank" rel="noopener noreferrer">
            <img src={logoMarq} alt="MarQ HR" className="h-5 hover:scale-105 transition-transform cursor-pointer" />
          </a>
          <span>© {new Date().getFullYear()}</span>
        </div>
      </footer>
    </div>
  );
}
