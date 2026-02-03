import { Globe, Linkedin, Instagram } from 'lucide-react';
import { Button } from '@/components/ui/button';
import logoBlue from '@/assets/logo-marq-blue.png';

interface CareersHeaderProps {
  companyName: string | null;
  companyLogoUrl: string | null;
  brandColor: string;
  website: string | null;
  linkedin: string | null;
  instagram: string | null;
  showSocial: boolean;
}

export function CareersHeader({
  companyName,
  companyLogoUrl,
  brandColor,
  website,
  linkedin,
  instagram,
  showSocial,
}: CareersHeaderProps) {
  const hasSocialLinks = showSocial && (website || linkedin || instagram);

  return (
    <header className="border-b bg-card" style={{ borderBottomColor: brandColor }}>
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {companyLogoUrl ? (
            <img
              src={companyLogoUrl}
              alt={companyName || 'Logo'}
              className="h-10 md:h-12 object-contain"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          ) : companyName ? (
            <span className="text-xl md:text-2xl font-bold" style={{ color: brandColor }}>
              {companyName}
            </span>
          ) : (
            <img src={logoBlue} alt="Logo" className="h-8 md:h-10" />
          )}

          {hasSocialLinks && (
            <div className="flex items-center gap-2">
              {website && (
                <Button
                  variant="ghost"
                  size="icon"
                  asChild
                  className="h-9 w-9"
                >
                  <a href={website} target="_blank" rel="noopener noreferrer">
                    <Globe className="h-4 w-4" />
                  </a>
                </Button>
              )}
              {linkedin && (
                <Button
                  variant="ghost"
                  size="icon"
                  asChild
                  className="h-9 w-9"
                >
                  <a href={linkedin} target="_blank" rel="noopener noreferrer">
                    <Linkedin className="h-4 w-4" />
                  </a>
                </Button>
              )}
              {instagram && (
                <Button
                  variant="ghost"
                  size="icon"
                  asChild
                  className="h-9 w-9"
                >
                  <a href={instagram} target="_blank" rel="noopener noreferrer">
                    <Instagram className="h-4 w-4" />
                  </a>
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
