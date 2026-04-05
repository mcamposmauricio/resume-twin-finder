import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { BenefitsEditor } from './BenefitsEditor';
import { Globe, Linkedin, Instagram, Phone, Youtube, Music2, Star, ChevronDown } from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';

interface CompanyInfoTabProps {
  settings: {
    company_tagline: string;
    company_about: string;
    company_culture: string;
    company_benefits: string[];
    company_website: string;
    company_linkedin: string;
    company_instagram: string;
    company_mission: string;
    company_vision: string;
    company_values: string;
    company_whatsapp: string;
    company_youtube: string;
    company_tiktok: string;
    company_glassdoor: string;
  };
  onSettingsChange: (updates: Partial<CompanyInfoTabProps['settings']>) => void;
}

function FilledBadge({ filled }: { filled: boolean }) {
  return filled ? (
    <Badge variant="secondary" className="text-xs px-1.5 py-0 ml-2 bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
      Preenchido
    </Badge>
  ) : null;
}

export function CompanyInfoTab({ settings, onSettingsChange }: CompanyInfoTabProps) {
  const hasAbout = !!(settings.company_tagline || settings.company_about || settings.company_culture);
  const hasMVV = !!(settings.company_mission || settings.company_vision || settings.company_values);
  const hasSocial = !!(settings.company_website || settings.company_linkedin || settings.company_instagram || settings.company_whatsapp || settings.company_youtube || settings.company_tiktok || settings.company_glassdoor);

  // Open sections that already have content by default
  const defaultOpen = [
    ...(hasAbout ? ['about'] : []),
    ...(hasMVV ? ['mvv'] : []),
    ...(hasSocial ? ['social'] : []),
  ];
  // If nothing is filled, open the first section
  const initialOpen = defaultOpen.length > 0 ? defaultOpen : ['about'];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Informações da Empresa</CardTitle>
          <CardDescription>
            Conte mais sobre sua empresa para atrair os melhores talentos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Accordion type="multiple" defaultValue={initialOpen} className="w-full">
            <AccordionItem value="about">
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center">
                  Sobre a Empresa
                  <FilledBadge filled={hasAbout} />
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-4 pt-2">
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
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="mvv">
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center">
                  Missão, Visão e Valores
                  <FilledBadge filled={hasMVV} />
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-4 pt-2">
                  <div className="space-y-2">
                    <Label htmlFor="mission">Missão</Label>
                    <Textarea
                      id="mission"
                      value={settings.company_mission}
                      onChange={(e) => onSettingsChange({ company_mission: e.target.value })}
                      placeholder="Qual a missão da sua empresa..."
                      rows={3}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="vision">Visão</Label>
                    <Textarea
                      id="vision"
                      value={settings.company_vision}
                      onChange={(e) => onSettingsChange({ company_vision: e.target.value })}
                      placeholder="Qual a visão de futuro da sua empresa..."
                      rows={3}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="values">Valores</Label>
                    <Textarea
                      id="values"
                      value={settings.company_values}
                      onChange={(e) => onSettingsChange({ company_values: e.target.value })}
                      placeholder="Quais os valores que guiam sua empresa..."
                      rows={3}
                    />
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="social">
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center">
                  Redes Sociais
                  <FilledBadge filled={hasSocial} />
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-4 pt-2">
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

                  <div className="space-y-2">
                    <Label htmlFor="whatsapp" className="flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      WhatsApp
                    </Label>
                    <Input
                      id="whatsapp"
                      type="tel"
                      value={settings.company_whatsapp}
                      onChange={(e) => onSettingsChange({ company_whatsapp: e.target.value })}
                      placeholder="(11) 99999-9999"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="youtube" className="flex items-center gap-2">
                      <Youtube className="h-4 w-4" />
                      YouTube
                    </Label>
                    <Input
                      id="youtube"
                      type="url"
                      value={settings.company_youtube}
                      onChange={(e) => onSettingsChange({ company_youtube: e.target.value })}
                      placeholder="https://youtube.com/@suaempresa"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="tiktok" className="flex items-center gap-2">
                      <Music2 className="h-4 w-4" />
                      TikTok
                    </Label>
                    <Input
                      id="tiktok"
                      type="url"
                      value={settings.company_tiktok}
                      onChange={(e) => onSettingsChange({ company_tiktok: e.target.value })}
                      placeholder="https://tiktok.com/@suaempresa"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="glassdoor" className="flex items-center gap-2">
                      <Star className="h-4 w-4" />
                      Glassdoor
                    </Label>
                    <Input
                      id="glassdoor"
                      type="url"
                      value={settings.company_glassdoor}
                      onChange={(e) => onSettingsChange({ company_glassdoor: e.target.value })}
                      placeholder="https://glassdoor.com.br/suaempresa"
                    />
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
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
    </div>
  );
}
