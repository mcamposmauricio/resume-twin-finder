import { useState } from 'react';
import { Copy, Check, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { toast } from 'sonner';

interface CareersPageTabProps {
  settings: {
    careers_page_enabled: boolean;
    careers_page_slug: string;
    careers_hero_image_url: string;
    careers_cta_text: string;
    careers_show_about: boolean;
    careers_show_benefits: boolean;
    careers_show_culture: boolean;
    careers_show_social: boolean;
  };
  onSettingsChange: (updates: Partial<CareersPageTabProps['settings']>) => void;
}

export function CareersPageTab({ settings, onSettingsChange }: CareersPageTabProps) {
  const [copied, setCopied] = useState(false);

  const getCareersUrl = () => {
    const baseUrl = window.location.origin;
    return `${baseUrl}/carreiras/${settings.careers_page_slug}`;
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(getCareersUrl());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success('Link copiado!');
    } catch {
      toast.error('Erro ao copiar link');
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Página Pública de Carreiras</CardTitle>
          <CardDescription>
            Configure uma página pública listando todas as suas vagas abertas
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="careersEnabled">Habilitar página de carreiras</Label>
              <p className="text-sm text-muted-foreground">
                Quando habilitada, candidatos podem ver todas as suas vagas abertas
              </p>
            </div>
            <Switch
              id="careersEnabled"
              checked={settings.careers_page_enabled}
              onCheckedChange={(checked) =>
                onSettingsChange({ careers_page_enabled: checked })
              }
            />
          </div>

          {settings.careers_page_enabled && (
            <>
              <div className="space-y-2">
                <Label htmlFor="careersSlug">URL da página</Label>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">/carreiras/</span>
                  <Input
                    id="careersSlug"
                    value={settings.careers_page_slug}
                    onChange={(e) =>
                      onSettingsChange({
                        careers_page_slug: e.target.value
                          .toLowerCase()
                          .replace(/[^a-z0-9-]/g, '-'),
                      })
                    }
                    placeholder="minha-empresa"
                    className="flex-1"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Deixe em branco para gerar automaticamente a partir do nome da empresa
                </p>
              </div>

              {settings.careers_page_slug && (
                <div className="space-y-2">
                  <Label>Link completo</Label>
                  <div className="flex items-center gap-2">
                    <Input value={getCareersUrl()} readOnly className="flex-1" />
                    <Button variant="outline" size="icon" onClick={handleCopyLink}>
                      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => window.open(getCareersUrl(), '_blank')}
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {settings.careers_page_enabled && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Personalização Visual</CardTitle>
              <CardDescription>
                Customize a aparência da sua página de carreiras
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="heroImage">Imagem de capa (Hero)</Label>
                <Input
                  id="heroImage"
                  type="url"
                  value={settings.careers_hero_image_url}
                  onChange={(e) =>
                    onSettingsChange({ careers_hero_image_url: e.target.value })
                  }
                  placeholder="https://exemplo.com/imagem-capa.jpg"
                />
                <p className="text-xs text-muted-foreground">
                  Recomendado: imagem widescreen (1920x600 ou similar)
                </p>
                {settings.careers_hero_image_url && (
                  <div className="mt-2 rounded-lg overflow-hidden border">
                    <img
                      src={settings.careers_hero_image_url}
                      alt="Preview da imagem de capa"
                      className="w-full h-32 object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="ctaText">Texto do botão principal</Label>
                <Input
                  id="ctaText"
                  value={settings.careers_cta_text}
                  onChange={(e) => onSettingsChange({ careers_cta_text: e.target.value })}
                  placeholder="Venha fazer parte!"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Seções Visíveis</CardTitle>
              <CardDescription>
                Escolha quais seções exibir na página de carreiras
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="showAbout">Seção "Sobre Nós"</Label>
                  <p className="text-sm text-muted-foreground">
                    Exibe o texto sobre a empresa
                  </p>
                </div>
                <Switch
                  id="showAbout"
                  checked={settings.careers_show_about}
                  onCheckedChange={(checked) =>
                    onSettingsChange({ careers_show_about: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="showCulture">Seção "Cultura"</Label>
                  <p className="text-sm text-muted-foreground">
                    Exibe os valores e cultura da empresa
                  </p>
                </div>
                <Switch
                  id="showCulture"
                  checked={settings.careers_show_culture}
                  onCheckedChange={(checked) =>
                    onSettingsChange({ careers_show_culture: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="showBenefits">Seção "Benefícios"</Label>
                  <p className="text-sm text-muted-foreground">
                    Exibe a lista de benefícios oferecidos
                  </p>
                </div>
                <Switch
                  id="showBenefits"
                  checked={settings.careers_show_benefits}
                  onCheckedChange={(checked) =>
                    onSettingsChange({ careers_show_benefits: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="showSocial">Redes Sociais</Label>
                  <p className="text-sm text-muted-foreground">
                    Exibe links para as redes sociais da empresa
                  </p>
                </div>
                <Switch
                  id="showSocial"
                  checked={settings.careers_show_social}
                  onCheckedChange={(checked) =>
                    onSettingsChange({ careers_show_social: checked })
                  }
                />
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
