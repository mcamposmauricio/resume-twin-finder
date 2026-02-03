import { Building2, Heart } from 'lucide-react';

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
    <section className="py-6 md:py-8">
      <div className="container mx-auto px-4 max-w-5xl">
        <div className="grid md:grid-cols-2 gap-4">
          {showAbout && about && (
            <div className="p-4 bg-card rounded-lg border">
              <div className="flex items-center gap-2 mb-2">
                <div
                  className="p-1.5 rounded"
                  style={{ backgroundColor: `${brandColor}15` }}
                >
                  <Building2 className="h-4 w-4" style={{ color: brandColor }} />
                </div>
                <h3 className="text-base font-semibold">Sobre Nós</h3>
              </div>
              <p className="text-sm text-muted-foreground line-clamp-4">
                {about}
              </p>
            </div>
          )}

          {showCulture && culture && (
            <div className="p-4 bg-card rounded-lg border">
              <div className="flex items-center gap-2 mb-2">
                <div
                  className="p-1.5 rounded"
                  style={{ backgroundColor: `${brandColor}15` }}
                >
                  <Heart className="h-4 w-4" style={{ color: brandColor }} />
                </div>
                <h3 className="text-base font-semibold">Nossa Cultura</h3>
              </div>
              <p className="text-sm text-muted-foreground line-clamp-4">
                {culture}
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
