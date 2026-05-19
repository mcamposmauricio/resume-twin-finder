import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, Loader2, ShieldAlert, CheckCircle2, XCircle, Copy, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

const ALLOWED_EMAIL = "mauricio@marqponto.com.br";
const FN_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/system-csv-export`;

interface LogEntry {
  time: string;
  message: string;
  level: "info" | "success" | "error";
}

export function SystemCsvExportTab() {
  const { userEmail } = useAuth();
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [schema, setSchema] = useState<string>("");
  const [loadingSchema, setLoadingSchema] = useState(false);
  const logBoxRef = useRef<HTMLDivElement>(null);

  const isAllowed = userEmail === ALLOWED_EMAIL;

  const loadSchema = async () => {
    setLoadingSchema(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error("Sessão não encontrada");
      const res = await fetch(FN_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action: "schema" }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);
      setSchema(json.schema || "");
    } catch (e) {
      toast.error(`Falha ao carregar schema: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setLoadingSchema(false);
    }
  };

  useEffect(() => {
    if (isAllowed) loadSchema();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAllowed]);

  if (!isAllowed) {
    return (
      <Card>
        <CardContent className="py-12 flex flex-col items-center gap-3 text-center">
          <ShieldAlert className="h-10 w-10 text-destructive" />
          <p className="font-semibold">Acesso restrito</p>
          <p className="text-sm text-muted-foreground">
            Esta funcionalidade está disponível apenas para o administrador autorizado.
          </p>
        </CardContent>
      </Card>
    );
  }

  const appendLog = (entry: LogEntry) => {
    setLogs((prev) => {
      const next = [...prev, entry];
      requestAnimationFrame(() => {
        logBoxRef.current?.scrollTo({ top: logBoxRef.current.scrollHeight });
      });
      return next;
    });
  };

  const startExport = async () => {
    setRunning(true);
    setProgress(0);
    setLogs([]);
    setDownloadUrl(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error("Sessão não encontrada");

      const res = await fetch(FN_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action: "export" }),
      });
      if (!res.ok || !res.body) {
        const text = await res.text();
        throw new Error(text || `HTTP ${res.status}`);
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";
        for (const line of lines) {
          if (!line.startsWith("data:")) continue;
          const payload = line.slice(5).trim();
          if (!payload) continue;
          try {
            const ev = JSON.parse(payload);
            const time = new Date().toLocaleTimeString();
            if (ev.type === "progress") {
              setProgress(ev.percent ?? 0);
              appendLog({ time, message: ev.message, level: "info" });
            } else if (ev.type === "log") {
              appendLog({ time, message: ev.message, level: ev.level || "info" });
            } else if (ev.type === "done") {
              setProgress(100);
              setDownloadUrl(ev.url);
              appendLog({ time, message: `Exportação concluída: ${ev.filename}`, level: "success" });
              const a = document.createElement("a");
              a.href = ev.url;
              a.download = ev.filename;
              document.body.appendChild(a);
              a.click();
              a.remove();
              toast.success("Exportação concluída! Download iniciado.");
            } else if (ev.type === "error") {
              appendLog({ time, message: ev.message, level: "error" });
              toast.error(ev.message);
            }
          } catch {
            // ignore
          }
        }
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      appendLog({ time: new Date().toLocaleTimeString(), message: msg, level: "error" });
      toast.error(`Falha na exportação: ${msg}`);
    } finally {
      setRunning(false);
    }
  };

  const copySchema = async () => {
    try {
      await navigator.clipboard.writeText(schema);
      toast.success("SQL copiado para a área de transferência");
    } catch {
      toast.error("Não foi possível copiar");
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Exportação CSV do Sistema</CardTitle>
          <CardDescription>
            Gera um ZIP com todos os dados em formato CSV: tabelas do banco, usuários do Auth,
            arquivos do Storage e lista de edge functions. Inclui também o <code>schema.sql</code>{" "}
            completo para recriar as tabelas em outro Supabase.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3 flex-wrap">
            <Button onClick={startExport} disabled={running} size="lg">
              {running ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
              {running ? "Exportando..." : "Gerar Exportação CSV"}
            </Button>
            {downloadUrl && !running && (
              <Button variant="outline" asChild>
                <a href={downloadUrl} download>
                  <Download className="h-4 w-4 mr-2" /> Baixar novamente
                </a>
              </Button>
            )}
          </div>

          {(running || progress > 0) && (
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Progresso</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} />
            </div>
          )}

          {logs.length > 0 && (
            <div
              ref={logBoxRef}
              className="max-h-80 overflow-y-auto rounded-md border bg-muted/30 p-3 font-mono text-xs space-y-1"
            >
              {logs.map((l, i) => (
                <div key={i} className="flex gap-2">
                  <span className="text-muted-foreground shrink-0">{l.time}</span>
                  {l.level === "success" && <CheckCircle2 className="h-3.5 w-3.5 text-green-600 shrink-0 mt-0.5" />}
                  {l.level === "error" && <XCircle className="h-3.5 w-3.5 text-destructive shrink-0 mt-0.5" />}
                  <span
                    className={
                      l.level === "error"
                        ? "text-destructive"
                        : l.level === "success"
                        ? "text-green-700"
                        : "text-foreground"
                    }
                  >
                    {l.message}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div>
              <CardTitle>SQL das tabelas do sistema</CardTitle>
              <CardDescription>
                Schema completo (tabelas, enums, índices, functions, triggers, policies RLS) pronto
                para copiar e aplicar em outro projeto Supabase.
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={loadSchema} disabled={loadingSchema}>
                {loadingSchema ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-2" />
                )}
                Recarregar
              </Button>
              <Button size="sm" onClick={copySchema} disabled={!schema}>
                <Copy className="h-4 w-4 mr-2" /> Copiar SQL
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Textarea
            value={loadingSchema ? "Carregando schema..." : schema}
            readOnly
            className="font-mono text-xs h-[500px] resize-none"
            placeholder="SQL do schema aparecerá aqui."
          />
        </CardContent>
      </Card>
    </div>
  );
}
