import { useState, useEffect } from "react";
import { Gift, Mail, Copy, Check, Send, Users, Phone, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ReferralDialogProps {
  userId: string;
}

export function ReferralDialog({ userId }: ReferralDialogProps) {
  const [referralCode, setReferralCode] = useState<string>("");
  const [email, setEmail] = useState("");
  const [emails, setEmails] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [invitesSent, setInvitesSent] = useState(0);
  const [isRequestingContact, setIsRequestingContact] = useState(false);
  const [contactRequested, setContactRequested] = useState(false);

  useEffect(() => {
    fetchReferralCode();
    fetchInvitesCount();
  }, [userId]);

  const fetchReferralCode = async () => {
    const { data, error } = await supabase
      .from("profiles")
      .select("referral_code")
      .eq("user_id", userId)
      .maybeSingle();

    if (!error && data?.referral_code) {
      setReferralCode(data.referral_code);
    }
  };

  const fetchInvitesCount = async () => {
    const { count } = await supabase
      .from("invites")
      .select("*", { count: "exact", head: true })
      .eq("inviter_user_id", userId);

    setInvitesSent(count || 0);
  };

  const whatsappMessage = `Estou usando uma ferramenta para analisar curriculos em massa com IA muito eficiente e consegui um convite para você! 
Acesse https://comparecv.marqhr.com/ e coloca meu código ${referralCode} para ter acesso gratuito.`;

  const handleCopyMessage = () => {
    navigator.clipboard.writeText(whatsappMessage);
    setCopied(true);
    toast.success("Mensagem copiada!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAddEmail = () => {
    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail) return;
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      toast.error("Email inválido");
      return;
    }

    if (emails.includes(trimmedEmail)) {
      toast.error("Email já adicionado");
      return;
    }

    setEmails([...emails, trimmedEmail]);
    setEmail("");
  };

  const handleRemoveEmail = (emailToRemove: string) => {
    setEmails(emails.filter((e) => e !== emailToRemove));
  };

  const handleSendInvites = async () => {
    if (emails.length === 0) {
      toast.error("Adicione pelo menos um email");
      return;
    }

    setLoading(true);
    try {
      const invites = emails.map((email) => ({
        inviter_user_id: userId,
        email,
        status: "pending",
      }));

      const { error } = await supabase.from("invites").insert(invites);

      if (error) throw error;

      toast.success(`${emails.length} convite(s) enviado(s) com sucesso!`);
      setEmails([]);
      fetchInvitesCount();
    } catch (error: any) {
      console.error("Error sending invites:", error);
      toast.error("Erro ao enviar convites");
    } finally {
      setLoading(false);
    }
  };

  const handleRequestContact = async () => {
    if (contactRequested) return;
    
    setIsRequestingContact(true);
    try {
      const { error } = await supabase.functions.invoke('send-lead-to-marq', {
        body: { userId, leadSource: 'modal_indicacao' }
      });
      
      if (error) throw error;
      
      toast.success("Solicitação enviada! Entraremos em contato em breve.");
      setContactRequested(true);
    } catch (err) {
      console.error("Error requesting contact:", err);
      toast.error("Erro ao enviar solicitação. Tente novamente.");
    } finally {
      setIsRequestingContact(false);
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="gap-2 border-amber-500/50 text-amber-600 hover:bg-amber-50 hover:text-amber-700 hover:border-amber-500"
        >
          <Gift className="w-4 h-4" />
          <span className="hidden sm:inline">Quer ganhar mais?</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Gift className="w-5 h-5 text-amber-500" />
            Indique e Ganhe!
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Referral Code */}
          <div className="bg-gradient-to-r from-blue-50 to-blue-100/50 p-4 rounded-xl border border-blue-200">
            <p className="text-sm text-slate-600 mb-2">Seu código de indicação:</p>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-blue-600 tracking-wider">
                {referralCode || "..."}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-2">
              Cada pessoa que usar seu código te dá +10 currículos grátis!
            </p>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-2 text-sm text-slate-600 bg-slate-50 p-3 rounded-lg">
            <Users className="w-4 h-4" />
            <span>Convites enviados: <strong>{invitesSent}</strong></span>
          </div>

          {/* WhatsApp Message */}
          <div className="space-y-2">
            <p className="text-sm font-medium text-slate-700">Compartilhar via WhatsApp:</p>
            <div className="bg-slate-50 p-3 rounded-lg text-sm text-slate-600 border">
              {whatsappMessage}
            </div>
            <Button
              onClick={handleCopyMessage}
              variant="outline"
              className="w-full gap-2"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-green-500" />
                  Copiado!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  Copiar mensagem
                </>
              )}
            </Button>
          </div>

          {/* Email Invites */}
          <div className="space-y-3">
            <p className="text-sm font-medium text-slate-700">Enviar convite por email:</p>
            <div className="flex gap-2">
              <Input
                type="email"
                placeholder="email@exemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddEmail()}
              />
              <Button onClick={handleAddEmail} variant="secondary" size="icon">
                <Mail className="w-4 h-4" />
              </Button>
            </div>

            {emails.length > 0 && (
              <div className="space-y-2">
                <div className="flex flex-wrap gap-2">
                  {emails.map((e) => (
                    <span
                      key={e}
                      className="inline-flex items-center gap-1 bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-sm"
                    >
                      {e}
                      <button
                        onClick={() => handleRemoveEmail(e)}
                        className="hover:text-blue-900"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
                <Button
                  onClick={handleSendInvites}
                  disabled={loading}
                  className="w-full gap-2"
                >
                  <Send className="w-4 h-4" />
                  {loading ? "Enviando..." : `Salvar ${emails.length} convite(s)`}
                </Button>
              </div>
            )}
          </div>

          {/* Contact Team Section */}
          <div className="pt-4 border-t border-slate-200">
            <p className="text-sm font-medium text-slate-700 mb-3">
              Quer aumentar seu saldo de outra forma?
            </p>
            <Button
              onClick={handleRequestContact}
              disabled={isRequestingContact || contactRequested}
              variant="outline"
              className="w-full gap-2"
            >
              {isRequestingContact ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Enviando...
                </>
              ) : contactRequested ? (
                <>
                  <Check className="w-4 h-4 text-green-500" />
                  Solicitação enviada
                </>
              ) : (
                <>
                  <Phone className="w-4 h-4" />
                  Receber contato do time
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
