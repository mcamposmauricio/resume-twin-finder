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
    <section
      className="py-12 md:py-16"
      style={{ backgroundColor: `${brandColor}08` }}
    >
      <div className="container mx-auto px-4 max-w-4xl">
        <h2 className="text-2xl font-bold text-center mb-8">
          Benefícios
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {benefits.map((benefit, index) => (
            <div
              key={index}
              className="flex items-center gap-3 p-4 bg-background rounded-lg shadow-sm"
            >
              <div
                className="flex-shrink-0 p-1.5 rounded-full"
                style={{ backgroundColor: `${brandColor}20` }}
              >
                <Check className="h-4 w-4" style={{ color: brandColor }} />
              </div>
              <span className="text-sm font-medium">{benefit}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
