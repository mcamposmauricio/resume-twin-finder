interface CareersHeroProps {
  companyName: string | null;
  tagline: string | null;
  heroImageUrl: string | null;
  brandColor: string;
  showHeroText?: boolean;
}

export function CareersHero({
  companyName,
  tagline,
  heroImageUrl,
  brandColor,
  showHeroText = true,
}: CareersHeroProps) {
  const hasHeroImage = !!heroImageUrl;

  return (
    <section className="overflow-hidden">
      {hasHeroImage && (
        <div className="w-full">
          <img
            src={heroImageUrl}
            alt={companyName || 'Banner'}
            className="w-full h-48 md:h-72 object-cover"
          />
        </div>
      )}

      {showHeroText && (
        <div
          className="py-8 md:py-12"
          style={{
            background: !hasHeroImage
              ? `linear-gradient(135deg, ${brandColor}15 0%, ${brandColor}05 100%)`
              : undefined,
          }}
        >
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-2xl md:text-4xl font-bold mb-2">
              Junte-se ao time {companyName || ''}!
            </h1>

            {tagline && (
              <p className="text-base md:text-lg max-w-2xl mx-auto text-muted-foreground">
                {tagline}
              </p>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
