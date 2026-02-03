import { Check } from 'lucide-react';

interface CareersBenefitsProps {
  benefits: string[];
  showBenefits: boolean;
  brandColor: string;
}

export function CareersBenefits({
  benefits,
  showBenefits,
  brandColor,
}: CareersBenefitsProps) {
  if (!showBenefits || benefits.length === 0) {
    return null;
  }

  return (
    <section className="py-4 md:py-6" style={{ backgroundColor: `${brandColor}05` }}>
      <div className="container mx-auto px-4 max-w-5xl">
        <div className="flex flex-wrap justify-center gap-2">
          {benefits.map((benefit, index) => (
            <div
              key={index}
              className="flex items-center gap-2 px-3 py-1.5 bg-background rounded-full border text-sm"
            >
              <Check className="h-3.5 w-3.5" style={{ color: brandColor }} />
              <span>{benefit}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
