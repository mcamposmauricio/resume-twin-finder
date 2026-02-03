interface CareersFooterProps {
  brandColor: string;
}

export function CareersFooter({ brandColor }: CareersFooterProps) {
  return (
    <footer className="py-8 border-t">
      <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
        Powered by{' '}
        <a
          href="https://marqponto.com.br"
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium hover:underline"
          style={{ color: brandColor }}
        >
          CompareCV powered by MarQ
        </a>
      </div>
    </footer>
  );
}
