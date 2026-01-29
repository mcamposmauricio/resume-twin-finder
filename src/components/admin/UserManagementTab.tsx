import { useState, useEffect } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Search, Plus, Ban, CheckCircle, AlertTriangle, ChevronLeft, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AddTokensDialog } from "./AddTokensDialog";
import { BlockUserDialog } from "./BlockUserDialog";
import { toast } from "sonner";
import { logActivity, ActionType } from "@/hooks/useActivityLog";

interface UserWithStats {
  user_id: string;
  email: string | null;
  name: string | null;
  company_name: string | null;
  phone: string | null;
  cargo: string | null;
  total_resumes: number;
  is_blocked: boolean;
  created_at: string;
  role: string | null;
  total_analyses: number;
  total_tokens_used: number;
  resumes_analyzed: number;
}

const ITEMS_PER_PAGE = 25;

export function UserManagementTab() {
  const [users, setUsers] = useState<UserWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);

  // Filters
  const [emailFilter, setEmailFilter] = useState("");
  const [companyFilter, setCompanyFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "only_registered" | "blocked">("all");

  // Dialogs
  const [selectedUser, setSelectedUser] = useState<UserWithStats | null>(null);
  const [showAddTokensDialog, setShowAddTokensDialog] = useState(false);
  const [showBlockDialog, setShowBlockDialog] = useState(false);

  // Admin user for logging
  const [adminUser, setAdminUser] = useState<{ id: string; email: string } | null>(null);

  useEffect(() => {
    const getAdmin = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setAdminUser({ id: session.user.id, email: session.user.email || "" });
      }
    };
    getAdmin();
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [page, emailFilter, companyFilter, statusFilter]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc("admin_get_users_with_stats");

      if (error) throw error;

      let filteredData = data || [];

      // Apply filters
      if (emailFilter.trim()) {
        filteredData = filteredData.filter((u: UserWithStats) =>
          u.email?.toLowerCase().includes(emailFilter.toLowerCase())
        );
      }

      if (companyFilter.trim()) {
        filteredData = filteredData.filter((u: UserWithStats) =>
          u.company_name?.toLowerCase().includes(companyFilter.toLowerCase())
        );
      }

      if (statusFilter === "active") {
        filteredData = filteredData.filter((u: UserWithStats) => u.total_analyses > 0 && !u.is_blocked);
      } else if (statusFilter === "only_registered") {
        filteredData = filteredData.filter((u: UserWithStats) => u.total_analyses === 0 && !u.is_blocked);
      } else if (statusFilter === "blocked") {
        filteredData = filteredData.filter((u: UserWithStats) => u.is_blocked);
      }

      setTotalCount(filteredData.length);

      // Paginate
      const from = (page - 1) * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE;
      setUsers(filteredData.slice(from, to));
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error("Erro ao carregar usuários");
    } finally {
      setLoading(false);
    }
  };

  const handleAddTokens = async (amount: number) => {
    if (!selectedUser) return;

    try {
      const { error } = await supabase.rpc("admin_update_user_profile", {
        _target_user_id: selectedUser.user_id,
        _resumes_to_add: amount,
        _set_blocked: null,
      });

      if (error) throw error;

      // Log activity
      if (adminUser) {
        await logActivity({
          userId: adminUser.id,
          userEmail: adminUser.email,
          actionType: "admin_add_resumes" as ActionType,
          entityType: "user",
          entityId: selectedUser.user_id,
          metadata: {
            target_email: selectedUser.email,
            amount,
            new_total: selectedUser.total_resumes + amount,
          },
        });
      }

      toast.success(`${amount} currículos adicionados com sucesso!`);
      fetchUsers();
    } catch (error) {
      console.error("Error adding tokens:", error);
      toast.error("Erro ao adicionar currículos");
      throw error;
    }
  };

  const handleToggleBlock = async () => {
    if (!selectedUser) return;

    const newBlockedStatus = !selectedUser.is_blocked;

    try {
      const { error } = await supabase.rpc("admin_update_user_profile", {
        _target_user_id: selectedUser.user_id,
        _resumes_to_add: null,
        _set_blocked: newBlockedStatus,
      });

      if (error) throw error;

      // Log activity
      if (adminUser) {
        await logActivity({
          userId: adminUser.id,
          userEmail: adminUser.email,
          actionType: (newBlockedStatus ? "user_blocked" : "user_unblocked") as ActionType,
          entityType: "user",
          entityId: selectedUser.user_id,
          metadata: {
            target_email: selectedUser.email,
          },
        });
      }

      toast.success(
        newBlockedStatus ? "Usuário bloqueado!" : "Usuário desbloqueado!"
      );
      fetchUsers();
    } catch (error) {
      console.error("Error toggling block:", error);
      toast.error("Erro ao alterar status do usuário");
      throw error;
    }
  };

  const getStatusBadge = (user: UserWithStats) => {
    if (user.is_blocked) {
      return (
        <Badge variant="destructive" className="gap-1">
          <Ban className="h-3 w-3" />
          Bloqueado
        </Badge>
      );
    }
    if (user.total_analyses === 0) {
      return (
        <Badge variant="secondary" className="text-muted-foreground">
          Apenas cadastro
        </Badge>
      );
    }
    return (
      <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
        Ativo
      </Badge>
    );
  };

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="card-clean p-4 sm:p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Email</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Filtrar por email..."
                value={emailFilter}
                onChange={(e) => {
                  setEmailFilter(e.target.value);
                  setPage(1);
                }}
                className="pl-9"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Empresa</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Filtrar por empresa..."
                value={companyFilter}
                onChange={(e) => {
                  setCompanyFilter(e.target.value);
                  setPage(1);
                }}
                className="pl-9"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Status</Label>
            <Select
              value={statusFilter}
              onValueChange={(value: "all" | "active" | "only_registered" | "blocked") => {
                setStatusFilter(value);
                setPage(1);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="active">Ativos</SelectItem>
                <SelectItem value="only_registered">Apenas cadastro</SelectItem>
                <SelectItem value="blocked">Bloqueados</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="text-sm text-muted-foreground">
        {totalCount} {totalCount === 1 ? "usuário encontrado" : "usuários encontrados"}
      </div>

      {/* Table */}
      <div className="card-clean overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Usuário</TableHead>
                <TableHead className="hidden md:table-cell">Empresa</TableHead>
                <TableHead className="hidden lg:table-cell">Telefone</TableHead>
                <TableHead className="text-center">CVs</TableHead>
                <TableHead className="text-center hidden sm:table-cell">Tokens</TableHead>
                <TableHead className="text-center">Saldo</TableHead>
                <TableHead className="hidden sm:table-cell">Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-12">
                    <div className="animate-pulse text-muted-foreground">
                      Carregando...
                    </div>
                  </TableCell>
                </TableRow>
              ) : users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                    Nenhum usuário encontrado
                  </TableCell>
                </TableRow>
              ) : (
                users.map((user) => (
                  <TableRow key={user.user_id}>
                    <TableCell>
                      <div>
                        <p className="font-medium truncate max-w-[200px]">
                          {user.name || "Sem nome"}
                        </p>
                        <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                          {user.email}
                        </p>
                        <p className="text-xs text-muted-foreground md:hidden">
                          {user.company_name || "-"}
                        </p>
                        <div className="sm:hidden mt-1">{getStatusBadge(user)}</div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <span className="text-sm text-muted-foreground">
                        {user.company_name || "-"}
                      </span>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <span className="text-sm text-muted-foreground">
                        {user.phone || "-"}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="font-medium">{user.resumes_analyzed}</span>
                    </TableCell>
                    <TableCell className="text-center hidden sm:table-cell">
                      <span className="text-muted-foreground">
                        {user.total_tokens_used.toLocaleString()}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      {(() => {
                        const balance = Math.round(user.total_resumes - user.resumes_analyzed);
                        return (
                          <div className="flex items-center justify-center gap-1">
                            <span
                              className={`font-medium ${
                                balance <= 2
                                  ? "text-destructive"
                                  : balance <= 5
                                  ? "text-yellow-600"
                                  : ""
                              }`}
                            >
                              {balance}
                            </span>
                            {balance <= 2 && (
                              <AlertTriangle className="h-3 w-3 text-destructive" />
                            )}
                          </div>
                        );
                      })()}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      {getStatusBadge(user)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedUser(user);
                            setShowAddTokensDialog(true);
                          }}
                          title="Adicionar currículos"
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedUser(user);
                            setShowBlockDialog(true);
                          }}
                          title={user.is_blocked ? "Desbloquear" : "Bloquear"}
                          className={user.is_blocked ? "text-green-600" : "text-destructive"}
                        >
                          {user.is_blocked ? (
                            <CheckCircle className="h-4 w-4" />
                          ) : (
                            <Ban className="h-4 w-4" />
                          )}
                        </Button>
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
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Dialogs */}
      {selectedUser && (
        <>
          <AddTokensDialog
            open={showAddTokensDialog}
            onOpenChange={setShowAddTokensDialog}
            userName={selectedUser.name || ""}
            userEmail={selectedUser.email || ""}
            currentBalance={selectedUser.total_resumes}
            resumesAnalyzed={selectedUser.resumes_analyzed}
            onConfirm={handleAddTokens}
          />
          <BlockUserDialog
            open={showBlockDialog}
            onOpenChange={setShowBlockDialog}
            userName={selectedUser.name || ""}
            userEmail={selectedUser.email || ""}
            isBlocked={selectedUser.is_blocked}
            onConfirm={handleToggleBlock}
          />
        </>
      )}
    </div>
  );
}
