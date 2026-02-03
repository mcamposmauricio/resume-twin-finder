import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { BenefitsEditor } from './BenefitsEditor';
import { Globe, Linkedin, Instagram } from 'lucide-react';

interface CompanyInfoTabProps {
  settings: {
    company_tagline: string;
    company_about: string;
    company_culture: string;
    company_benefits: string[];
    company_website: string;
    company_linkedin: string;
    company_instagram: string;
  };
  onSettingsChange: (updates: Partial<CompanyInfoTabProps['settings']>) => void;
}

export function CompanyInfoTab({ settings, onSettingsChange }: CompanyInfoTabProps) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Informações da Empresa</CardTitle>
          <CardDescription>
            Conte mais sobre sua empresa para atrair os melhores talentos
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="tagline">Tagline / Slogan</Label>
            <Input
              id="tagline"
              value={settings.company_tagline}
              onChange={(e) => onSettingsChange({ company_tagline: e.target.value })}
              placeholder="Ex: Transformando a gestão de pessoas desde 2018"
            />
            <p className="text-xs text-muted-foreground">
              Uma frase de impacto que define sua empresa
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="about">Sobre Nós</Label>
            <Textarea
              id="about"
              value={settings.company_about}
              onChange={(e) => onSettingsChange({ company_about: e.target.value })}
              placeholder="Conte a história da sua empresa, missão e visão..."
              rows={5}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="culture">Nossa Cultura</Label>
            <Textarea
              id="culture"
              value={settings.company_culture}
              onChange={(e) => onSettingsChange({ company_culture: e.target.value })}
              placeholder="Descreva os valores e a cultura da sua empresa..."
              rows={4}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Benefícios</CardTitle>
          <CardDescription>
            Liste os benefícios oferecidos pela sua empresa
          </CardDescription>
        </CardHeader>
        <CardContent>
          <BenefitsEditor
            benefits={settings.company_benefits}
            onChange={(benefits) => onSettingsChange({ company_benefits: benefits })}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Redes Sociais</CardTitle>
          <CardDescription>
            Links para os perfis da empresa nas redes sociais
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="website" className="flex items-center gap-2">
              <Globe className="h-4 w-4" />
              Website
            </Label>
            <Input
              id="website"
              type="url"
              value={settings.company_website}
              onChange={(e) => onSettingsChange({ company_website: e.target.value })}
              placeholder="https://suaempresa.com.br"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="linkedin" className="flex items-center gap-2">
              <Linkedin className="h-4 w-4" />
              LinkedIn
            </Label>
            <Input
              id="linkedin"
              type="url"
              value={settings.company_linkedin}
              onChange={(e) => onSettingsChange({ company_linkedin: e.target.value })}
              placeholder="https://linkedin.com/company/suaempresa"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="instagram" className="flex items-center gap-2">
              <Instagram className="h-4 w-4" />
              Instagram
            </Label>
            <Input
              id="instagram"
              type="url"
              value={settings.company_instagram}
              onChange={(e) => onSettingsChange({ company_instagram: e.target.value })}
              placeholder="https://instagram.com/suaempresa"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
