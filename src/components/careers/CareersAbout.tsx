import { Building2, Heart } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface CareersAboutProps {
  about: string | null;
  culture: string | null;
  showAbout: boolean;
  showCulture: boolean;
  brandColor: string;
}

export function CareersAbout({
  about,
  culture,
  showAbout,
  showCulture,
  brandColor,
}: CareersAboutProps) {
  if ((!showAbout || !about) && (!showCulture || !culture)) {
    return null;
  }

  return (
    <section className="py-12 md:py-16">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="grid md:grid-cols-2 gap-8">
          {showAbout && about && (
            <Card className="border-none shadow-md">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className="p-2 rounded-lg"
                    style={{ backgroundColor: `${brandColor}15` }}
                  >
                    <Building2 className="h-5 w-5" style={{ color: brandColor }} />
                  </div>
                  <h2 className="text-xl font-semibold">Sobre Nós</h2>
                </div>
                <p className="text-muted-foreground whitespace-pre-wrap leading-relaxed">
                  {about}
                </p>
              </CardContent>
            </Card>
          )}

          {showCulture && culture && (
            <Card className="border-none shadow-md">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className="p-2 rounded-lg"
                    style={{ backgroundColor: `${brandColor}15` }}
                  >
                    <Heart className="h-5 w-5" style={{ color: brandColor }} />
                  </div>
                  <h2 className="text-xl font-semibold">Nossa Cultura</h2>
                </div>
                <p className="text-muted-foreground whitespace-pre-wrap leading-relaxed">
                  {culture}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </section>
  );
}
