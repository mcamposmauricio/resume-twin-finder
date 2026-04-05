import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Save, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { PipelineStagesEditor } from '@/components/settings/PipelineStagesEditor';
import { logActivity } from '@/hooks/useActivityLog';
import { CompanyInfoTab } from '@/components/settings/CompanyInfoTab';
import { CareersPageTab } from '@/components/settings/CareersPageTab';
import { AppLayout } from '@/components/layout/AppLayout';

interface ProfileSettings {
  company_name: string;
  company_logo_url: string;
  brand_color: string;
  careers_page_slug: string;
  careers_page_enabled: boolean;
  company_tagline: string;
  company_about: string;
  company_culture: string;
  company_benefits: string[];
  company_website: string;
  company_linkedin: string;
  company_instagram: string;
  careers_hero_image_url: string;
  careers_cta_text: string;
  careers_show_about: boolean;
  careers_show_benefits: boolean;
  careers_show_culture: boolean;
  careers_show_social: boolean;
  careers_show_hero_text: boolean;
  company_mission: string;
  company_vision: string;
  company_values: string;
  careers_show_mission: boolean;
  careers_show_vision: boolean;
  careers_show_values: boolean;
}

const defaultSettings: ProfileSettings = {
  company_name: '',
  company_logo_url: '',
  brand_color: '#3B82F6',
  careers_page_slug: '',
  careers_page_enabled: false,
  company_tagline: '',
  company_about: '',
  company_culture: '',
  company_benefits: [],
  company_website: '',
  company_linkedin: '',
  company_instagram: '',
  careers_hero_image_url: '',
  careers_cta_text: 'Venha fazer parte!',
  careers_show_about: true,
  careers_show_benefits: true,
  careers_show_culture: true,
  careers_show_social: true,
  careers_show_hero_text: true,
  company_mission: '',
  company_vision: '',
  company_values: '',
  careers_show_mission: true,
  careers_show_vision: true,
  careers_show_values: true,
};

export default function Settings() {
  const { userId } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<ProfileSettings>(defaultSettings);

  useEffect(() => {
    if (!userId) return;

    const fetchSettings = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select(`
            company_name, company_logo_url, brand_color, 
            careers_page_slug, careers_page_enabled,
            company_tagline, company_about, company_culture, company_benefits,
            company_website, company_linkedin, company_instagram,
            careers_hero_image_url, careers_cta_text,
            careers_show_about, careers_show_benefits, careers_show_culture, careers_show_social,
            careers_show_hero_text, company_mission, company_vision, company_values,
            careers_show_mission, careers_show_vision, careers_show_values
          `)
          .eq('user_id', userId)
          .single();

        if (error) throw error;

        setSettings({
          company_name: data.company_name || '',
          company_logo_url: data.company_logo_url || '',
          brand_color: data.brand_color || '#3B82F6',
          careers_page_slug: data.careers_page_slug || '',
          careers_page_enabled: data.careers_page_enabled || false,
          company_tagline: data.company_tagline || '',
          company_about: data.company_about || '',
          company_culture: data.company_culture || '',
          company_benefits: (data.company_benefits as string[]) || [],
          company_website: data.company_website || '',
          company_linkedin: data.company_linkedin || '',
          company_instagram: data.company_instagram || '',
          careers_hero_image_url: data.careers_hero_image_url || '',
          careers_cta_text: data.careers_cta_text || 'Venha fazer parte!',
          careers_show_about: data.careers_show_about ?? true,
          careers_show_benefits: data.careers_show_benefits ?? true,
          careers_show_culture: data.careers_show_culture ?? true,
          careers_show_social: data.careers_show_social ?? true,
          careers_show_hero_text: data.careers_show_hero_text ?? true,
          company_mission: data.company_mission || '',
          company_vision: data.company_vision || '',
          company_values: data.company_values || '',
          careers_show_mission: data.careers_show_mission ?? true,
          careers_show_vision: data.careers_show_vision ?? true,
          careers_show_values: data.careers_show_values ?? true,
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
          company_tagline: settings.company_tagline || null,
          company_about: settings.company_about || null,
          company_culture: settings.company_culture || null,
          company_benefits: settings.company_benefits,
          company_website: settings.company_website || null,
          company_linkedin: settings.company_linkedin || null,
          company_instagram: settings.company_instagram || null,
          careers_hero_image_url: settings.careers_hero_image_url || null,
          careers_cta_text: settings.careers_cta_text || 'Venha fazer parte!',
          careers_show_about: settings.careers_show_about,
          careers_show_benefits: settings.careers_show_benefits,
          careers_show_culture: settings.careers_show_culture,
          careers_show_social: settings.careers_show_social,
          careers_show_hero_text: settings.careers_show_hero_text,
          company_mission: settings.company_mission || null,
          company_vision: settings.company_vision || null,
          company_values: settings.company_values || null,
          careers_show_mission: settings.careers_show_mission,
          careers_show_vision: settings.careers_show_vision,
          careers_show_values: settings.careers_show_values,
        })
        .eq('user_id', userId);

      if (error) throw error;

      setSettings((prev) => ({ ...prev, careers_page_slug: slug }));
      toast.success('Configurações salvas com sucesso!');
    } catch (error: any) {
      console.error('Error saving settings:', error);
      logActivity({
        userId: userId || 'unknown',
        userEmail: 'unknown',
        actionType: 'settings_save_error',
        isError: true,
        metadata: { error_message: error.message },
      });
      toast.error('Erro ao salvar configurações');
    } finally {
      setSaving(false);
    }
  };

  const updateSettings = (updates: Partial<ProfileSettings>) => {
    setSettings((prev) => ({ ...prev, ...updates }));
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex-1 flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <div className="mb-8">
          <h1 className="text-2xl font-bold">Configurações</h1>
          <p className="text-muted-foreground">
            Personalize sua marca e página de carreiras
          </p>
        </div>

        <Tabs defaultValue={new URLSearchParams(window.location.search).get('tab') || 'brand'} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="brand">Marca</TabsTrigger>
            <TabsTrigger value="company">Empresa</TabsTrigger>
            <TabsTrigger value="careers">Carreiras</TabsTrigger>
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
                    onChange={(e) => updateSettings({ company_name: e.target.value })}
                    placeholder="Ex: MarQ Ponto"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="companyLogoUrl">URL do logo</Label>
                  <Input
                    id="companyLogoUrl"
                    value={settings.company_logo_url}
                    onChange={(e) => updateSettings({ company_logo_url: e.target.value })}
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
                      onChange={(e) => updateSettings({ brand_color: e.target.value })}
                      className="w-12 h-10 rounded border cursor-pointer"
                    />
                    <Input
                      value={settings.brand_color}
                      onChange={(e) => updateSettings({ brand_color: e.target.value })}
                      placeholder="#3B82F6"
                      className="flex-1"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="company">
            <CompanyInfoTab
              settings={{
                company_tagline: settings.company_tagline,
                company_about: settings.company_about,
                company_culture: settings.company_culture,
                company_benefits: settings.company_benefits,
                company_website: settings.company_website,
                company_linkedin: settings.company_linkedin,
                company_instagram: settings.company_instagram,
                company_mission: settings.company_mission,
                company_vision: settings.company_vision,
                company_values: settings.company_values,
              }}
              onSettingsChange={updateSettings}
            />
          </TabsContent>

          <TabsContent value="careers">
            <CareersPageTab
              settings={{
                careers_page_enabled: settings.careers_page_enabled,
                careers_page_slug: settings.careers_page_slug,
                careers_hero_image_url: settings.careers_hero_image_url,
                careers_cta_text: settings.careers_cta_text,
                careers_show_about: settings.careers_show_about,
                careers_show_benefits: settings.careers_show_benefits,
                careers_show_culture: settings.careers_show_culture,
                careers_show_social: settings.careers_show_social,
                careers_show_hero_text: settings.careers_show_hero_text,
                careers_show_mission: settings.careers_show_mission,
                careers_show_vision: settings.careers_show_vision,
                careers_show_values: settings.careers_show_values,
              }}
              onSettingsChange={updateSettings}
            />
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
    </AppLayout>
  );
}
