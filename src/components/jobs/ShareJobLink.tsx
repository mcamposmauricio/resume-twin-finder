import { useState } from 'react';
import { Copy, Check, ExternalLink, Share2, MessageCircle, Linkedin, Twitter, Send, Mail, Link } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface ShareJobLinkProps {
  slug: string;
  jobTitle: string;
  companyName?: string;
  variant?: 'full' | 'compact';
}

export function ShareJobLink({ slug, jobTitle, companyName, variant = 'compact' }: ShareJobLinkProps) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  
  const fullUrl = `${window.location.origin}/apply/${slug}`;
  
  const shareMessage = companyName 
    ? `Estamos contratando! 🚀\nVaga: ${jobTitle}\n${companyName}\nCandidate-se:`
    : `Estamos contratando! 🚀\nVaga: ${jobTitle}\nCandidate-se:`;

  const copyLink = async () => {
    await navigator.clipboard.writeText(fullUrl);
    setCopied(true);
    toast({
      title: 'Link copiado!',
      description: 'O link foi copiado para a área de transferência.',
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const openInNewTab = () => {
    window.open(fullUrl, '_blank');
  };

  const shareOnWhatsApp = () => {
    const text = encodeURIComponent(`${shareMessage} ${fullUrl}`);
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const shareOnLinkedIn = () => {
    const url = encodeURIComponent(fullUrl);
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${url}`, '_blank');
  };

  const shareOnTwitter = () => {
    const text = encodeURIComponent(shareMessage);
    const url = encodeURIComponent(fullUrl);
    window.open(`https://twitter.com/intent/tweet?url=${url}&text=${text}`, '_blank');
  };

  const shareOnTelegram = () => {
    const text = encodeURIComponent(shareMessage);
    const url = encodeURIComponent(fullUrl);
    window.open(`https://t.me/share/url?url=${url}&text=${text}`, '_blank');
  };

  const shareByEmail = () => {
    const subject = encodeURIComponent(`Vaga: ${jobTitle}${companyName ? ` - ${companyName}` : ''}`);
    const body = encodeURIComponent(`${shareMessage}\n${fullUrl}`);
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  if (variant === 'compact') {
    return (
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Link className="h-4 w-4 flex-shrink-0" />
          <a 
            href={fullUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-sm text-primary hover:underline truncate"
          >
            {fullUrl}
          </a>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={copyLink}>
            {copied ? <Check className="h-4 w-4 mr-1" /> : <Copy className="h-4 w-4 mr-1" />}
            {copied ? 'Copiado' : 'Copiar'}
          </Button>
          <Button variant="outline" size="sm" onClick={openInNewTab}>
            <ExternalLink className="h-4 w-4 mr-1" />
            Abrir
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Share2 className="h-4 w-4 mr-1" />
                Compartilhar
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={shareOnWhatsApp}>
                <MessageCircle className="h-4 w-4 mr-2" />
                WhatsApp
              </DropdownMenuItem>
              <DropdownMenuItem onClick={shareOnLinkedIn}>
                <Linkedin className="h-4 w-4 mr-2" />
                LinkedIn
              </DropdownMenuItem>
              <DropdownMenuItem onClick={shareOnTwitter}>
                <Twitter className="h-4 w-4 mr-2" />
                Twitter / X
              </DropdownMenuItem>
              <DropdownMenuItem onClick={shareOnTelegram}>
                <Send className="h-4 w-4 mr-2" />
                Telegram
              </DropdownMenuItem>
              <DropdownMenuItem onClick={shareByEmail}>
                <Mail className="h-4 w-4 mr-2" />
                Email
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm font-medium mb-2">Link público da vaga</p>
        <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
          <Link className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
          <a 
            href={fullUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-sm text-primary hover:underline break-all flex-1"
          >
            {fullUrl}
          </a>
        </div>
      </div>
      
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" onClick={copyLink}>
          {copied ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
          {copied ? 'Copiado!' : 'Copiar Link'}
        </Button>
        <Button variant="outline" size="sm" onClick={openInNewTab}>
          <ExternalLink className="h-4 w-4 mr-2" />
          Abrir em Nova Aba
        </Button>
      </div>

      <div>
        <p className="text-sm font-medium mb-2">Compartilhar em:</p>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={shareOnWhatsApp} className="gap-2">
            <MessageCircle className="h-4 w-4" />
            WhatsApp
          </Button>
          <Button variant="outline" size="sm" onClick={shareOnLinkedIn} className="gap-2">
            <Linkedin className="h-4 w-4" />
            LinkedIn
          </Button>
          <Button variant="outline" size="sm" onClick={shareOnTwitter} className="gap-2">
            <Twitter className="h-4 w-4" />
            Twitter
          </Button>
          <Button variant="outline" size="sm" onClick={shareOnTelegram} className="gap-2">
            <Send className="h-4 w-4" />
            Telegram
          </Button>
          <Button variant="outline" size="sm" onClick={shareByEmail} className="gap-2">
            <Mail className="h-4 w-4" />
            Email
          </Button>
        </div>
      </div>
    </div>
  );
}
