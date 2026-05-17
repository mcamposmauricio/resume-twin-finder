import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, Loader2, ShieldAlert, CheckCircle2, XCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

const ALLOWED_EMAIL = "mauricio@marqponto.com.br";

interface LogEntry {
  time: string;
  message: string;
  level: "info" | "success" | "error";
}

export function SystemExportTab() {
  const { userEmail } = useAuth();
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const logBoxRef = useRef<HTMLDivElement>(null);

  if (userEmail !== ALLOWED_EMAIL) {
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

      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/system-full-export`;
      const res = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          "Content-Type": "application/json",
        },
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
            if (ev.type === "progress") {
              setProgress(ev.percent ?? 0);
              appendLog({ time: new Date().toLocaleTimeString(), message: ev.message, level: "info" });
            } else if (ev.type === "log") {
              appendLog({ time: new Date().toLocaleTimeString(), message: ev.message, level: ev.level || "info" });
            } else if (ev.type === "done") {
              setProgress(100);
              setDownloadUrl(ev.url);
              appendLog({ time: new Date().toLocaleTimeString(), message: `Exportação concluída: ${ev.filename}`, level: "success" });
              // Auto-download
              const a = document.createElement("a");
              a.href = ev.url;
              a.download = ev.filename;
              document.body.appendChild(a);
              a.click();
              a.remove();
              toast.success("Exportação concluída! Download iniciado.");
            } else if (ev.type === "error") {
              appendLog({ time: new Date().toLocaleTimeString(), message: ev.message, level: "error" });
              toast.error(ev.message);
            }
          } catch (e) {
            console.error("Failed to parse SSE event:", payload);
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

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Exportação Completa do Sistema</CardTitle>
          <CardDescription>
            Gera um snapshot completo: schema, dados, policies RLS, functions, triggers, storage e
            instruções para reconstruir o ambiente do zero ou restaurar em um novo Supabase.
            Apenas o administrador autorizado pode executar esta ação.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <Button onClick={startExport} disabled={running} size="lg">
              {running ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
              {running ? "Exportando..." : "Gerar Exportação Completa"}
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
          <CardTitle className="text-base">O que está incluído no pacote</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <ul className="list-disc list-inside space-y-1">
            <li><strong>database/schema.sql</strong> — tabelas, enums, índices, views, functions, triggers, policies RLS</li>
            <li><strong>database/seed.sql</strong> + <strong>tables/*.json</strong> — todos os dados de todas as tabelas</li>
            <li><strong>storage/</strong> — manifest + arquivos de todos os buckets</li>
            <li><strong>edge-functions/</strong> — lista das funções deployadas (código-fonte vive no repositório)</li>
            <li><strong>config/</strong> — buckets, nomes dos secrets, configurações</li>
            <li><strong>PROMPT_RECONSTRUCAO_COMPLETA.md</strong> — prompt para IA recriar o sistema do zero</li>
            <li><strong>PROMPT_RESTAURAR_NO_SUPABASE.md</strong> — prompt para restaurar backend em novo Supabase</li>
          </ul>
          <p className="pt-2 text-xs">
            Por segurança: <strong>valores</strong> de secrets nunca são exportados, apenas seus nomes.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
