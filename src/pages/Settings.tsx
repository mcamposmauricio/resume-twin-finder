import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Copy, Check, ExternalLink, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useUserRole } from '@/hooks/useUserRole';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { PipelineStagesEditor } from '@/components/settings/PipelineStagesEditor';

interface ProfileSettings {
  company_name: string;
  company_logo_url: string;
  brand_color: string;
  careers_page_slug: string;
  careers_page_enabled: boolean;
}

export default function Settings() {
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string>();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [settings, setSettings] = useState<ProfileSettings>({
    company_name: '',
    company_logo_url: '',
    brand_color: '#3B82F6',
    careers_page_slug: '',
    careers_page_enabled: false,
  });

  const { isFullAccess, loading: roleLoading } = useUserRole(userId);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate('/auth');
      } else {
        setUserId(session.user.id);
      }
    });
  }, [navigate]);

  useEffect(() => {
    if (!roleLoading && userId && !isFullAccess) {
      toast.error('Você não tem acesso a esta funcionalidade.');
      navigate('/');
    }
  }, [roleLoading, isFullAccess, userId, navigate]);

  useEffect(() => {
    if (!userId) return;

    const fetchSettings = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('company_name, company_logo_url, brand_color, careers_page_slug, careers_page_enabled')
          .eq('user_id', userId)
          .single();

        if (error) throw error;

        setSettings({
          company_name: data.company_name || '',
          company_logo_url: data.company_logo_url || '',
          brand_color: data.brand_color || '#3B82F6',
          careers_page_slug: data.careers_page_slug || '',
          careers_page_enabled: data.careers_page_enabled || false,
        });
      } catch (error) {
        console.error('Error fetching settings:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, [userId]);

  const handleSave = async () => {
    if (!userId) return;

    setSaving(true);
    try {
      // If enabling careers page without a slug, generate one
      let slug = settings.careers_page_slug;
      if (settings.careers_page_enabled && !slug && settings.company_name) {
        const { data: generatedSlug } = await supabase.rpc('generate_careers_slug', {
          company: settings.company_name,
        });
        slug = generatedSlug || '';
      }

      const { error } = await supabase
        .from('profiles')
        .update({
          company_name: settings.company_name || null,
          company_logo_url: settings.company_logo_url || null,
          brand_color: settings.brand_color || '#3B82F6',
          careers_page_slug: slug || null,
          careers_page_enabled: settings.careers_page_enabled,
        })
        .eq('user_id', userId);

      if (error) throw error;

      setSettings((prev) => ({ ...prev, careers_page_slug: slug }));
      toast.success('Configurações salvas com sucesso!');
    } catch (error: any) {
      console.error('Error saving settings:', error);
      toast.error('Erro ao salvar configurações');
    } finally {
      setSaving(false);
    }
  };

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

  if (loading || roleLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isFullAccess) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">Configurações</h1>
            <p className="text-muted-foreground">
              Personalize sua marca e página de carreiras
            </p>
          </div>
        </div>

        <Tabs defaultValue={new URLSearchParams(window.location.search).get('tab') || 'brand'} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="brand">Marca</TabsTrigger>
            <TabsTrigger value="careers">Página de Carreiras</TabsTrigger>
            <TabsTrigger value="pipeline">Pipeline</TabsTrigger>
          </TabsList>

          <TabsContent value="brand">
            <Card>
              <CardHeader>
                <CardTitle>Identidade Visual</CardTitle>
                <CardDescription>
                  Configure a identidade visual da sua empresa para as páginas públicas
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="companyName">Nome da empresa</Label>
                  <Input
                    id="companyName"
                    value={settings.company_name}
                    onChange={(e) =>
                      setSettings((prev) => ({ ...prev, company_name: e.target.value }))
                    }
                    placeholder="Ex: MarQ Ponto"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="companyLogoUrl">URL do logo</Label>
                  <Input
                    id="companyLogoUrl"
                    value={settings.company_logo_url}
                    onChange={(e) =>
                      setSettings((prev) => ({ ...prev, company_logo_url: e.target.value }))
                    }
                    placeholder="https://exemplo.com/logo.png"
                  />
                  <p className="text-xs text-muted-foreground">
                    Cole a URL de uma imagem do logo da empresa (recomendado: PNG ou SVG transparente)
                  </p>
                  {settings.company_logo_url && (
                    <div className="mt-2 p-4 bg-muted rounded-lg">
                      <p className="text-xs text-muted-foreground mb-2">Preview:</p>
                      <img
                        src={settings.company_logo_url}
                        alt="Logo preview"
                        className="h-12 object-contain"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="brandColor">Cor principal</Label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      id="brandColor"
                      value={settings.brand_color}
                      onChange={(e) =>
                        setSettings((prev) => ({ ...prev, brand_color: e.target.value }))
                      }
                      className="w-12 h-10 rounded border cursor-pointer"
                    />
                    <Input
                      value={settings.brand_color}
                      onChange={(e) =>
                        setSettings((prev) => ({ ...prev, brand_color: e.target.value }))
                      }
                      placeholder="#3B82F6"
                      className="flex-1"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="careers">
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
                      setSettings((prev) => ({ ...prev, careers_page_enabled: checked }))
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
                            setSettings((prev) => ({
                              ...prev,
                              careers_page_slug: e.target.value
                                .toLowerCase()
                                .replace(/[^a-z0-9-]/g, '-'),
                            }))
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
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={handleCopyLink}
                          >
                            {copied ? (
                              <Check className="h-4 w-4" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
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
          </TabsContent>

          <TabsContent value="pipeline">
            <PipelineStagesEditor userId={userId} />
          </TabsContent>
        </Tabs>

        <div className="flex justify-end mt-6">
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Salvar Alterações
          </Button>
        </div>
      </div>
    </div>
  );
}
