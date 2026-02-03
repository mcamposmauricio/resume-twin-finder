interface CareersHeroProps {
  companyName: string | null;
  tagline: string | null;
  heroImageUrl: string | null;
  brandColor: string;
}

export function CareersHero({
  companyName,
  tagline,
  heroImageUrl,
  brandColor,
}: CareersHeroProps) {
  const hasHeroImage = !!heroImageUrl;

  return (
    <section
      className="relative py-16 md:py-24 overflow-hidden"
      style={{
        background: hasHeroImage
          ? undefined
          : `linear-gradient(135deg, ${brandColor}15 0%, ${brandColor}05 100%)`,
      }}
    >
      {hasHeroImage && (
        <>
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${heroImageUrl})` }}
          />
          <div className="absolute inset-0 bg-black/50" />
        </>
      )}

      <div className="container mx-auto px-4 relative z-10 text-center">
        <h1
          className={`text-3xl md:text-5xl font-bold mb-4 ${
            hasHeroImage ? 'text-white' : ''
          }`}
        >
          Junte-se ao time {companyName || ''}!
        </h1>

        {tagline && (
          <p
            className={`text-lg md:text-xl max-w-2xl mx-auto ${
              hasHeroImage ? 'text-white/90' : 'text-muted-foreground'
            }`}
          >
            {tagline}
          </p>
        )}
      </div>
    </section>
  );
}
