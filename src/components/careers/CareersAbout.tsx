import { useState } from 'react';
import { Building2, Heart, Target, Eye, Star, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SectionConfig {
  key: string;
  title: string;
  content: string | null;
  show: boolean;
  icon: React.ElementType;
}

interface CareersAboutProps {
  about: string | null;
  culture: string | null;
  mission?: string | null;
  vision?: string | null;
  values?: string | null;
  showAbout: boolean;
  showCulture: boolean;
  showMission?: boolean;
  showVision?: boolean;
  showValues?: boolean;
  brandColor: string;
}

export function CareersAbout({
  about,
  culture,
  mission,
  vision,
  values,
  showAbout,
  showCulture,
  showMission = true,
  showVision = true,
  showValues = true,
  brandColor,
}: CareersAboutProps) {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});

  const toggleSection = (key: string) => {
    setExpandedSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const sections: SectionConfig[] = [
    { key: 'about', title: 'Sobre Nós', content: about, show: showAbout, icon: Building2 },
    { key: 'culture', title: 'Nossa Cultura', content: culture, show: showCulture, icon: Heart },
    { key: 'mission', title: 'Missão', content: mission, show: showMission, icon: Target },
    { key: 'vision', title: 'Visão', content: vision, show: showVision, icon: Eye },
    { key: 'values', title: 'Valores', content: values, show: showValues, icon: Star },
  ].filter((s) => s.show && s.content);

  if (sections.length === 0) return null;

  return (
    <section className="py-6 md:py-8">
      <div className="container mx-auto px-4 max-w-5xl">
        <div className="grid md:grid-cols-2 gap-4">
          {sections.map((section) => {
            const Icon = section.icon;
            const isExpanded = expandedSections[section.key];

            return (
              <div key={section.key} className="p-4 bg-card rounded-lg border">
                <div className="flex items-center gap-2 mb-2">
                  <div
                    className="p-1.5 rounded"
                    style={{ backgroundColor: `${brandColor}15` }}
                  >
                    <Icon className="h-4 w-4" style={{ color: brandColor }} />
                  </div>
                  <h3 className="text-base font-semibold">{section.title}</h3>
                </div>
                <p
                  className={`text-sm text-muted-foreground whitespace-pre-wrap ${
                    !isExpanded ? 'line-clamp-4' : ''
                  }`}
                >
                  {section.content}
                </p>
                {section.content && section.content.length > 200 && (
                  <Button
                    variant="link"
                    size="sm"
                    className="p-0 h-auto mt-1 text-xs"
                    style={{ color: brandColor }}
                    onClick={() => toggleSection(section.key)}
                  >
                    {isExpanded ? (
                      <>
                        Ver menos <ChevronUp className="h-3 w-3 ml-1" />
                      </>
                    ) : (
                      <>
                        Ver mais <ChevronDown className="h-3 w-3 ml-1" />
                      </>
                    )}
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
