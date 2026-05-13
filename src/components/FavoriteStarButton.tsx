import { useState, MouseEvent } from 'react';
import { Star } from 'lucide-react';
import confetti from 'canvas-confetti';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface Props {
  isFavorite: boolean;
  onToggle: (next: boolean) => Promise<boolean | void> | boolean | void;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

function fireFireworks(originEl: HTMLElement | null) {
  const duration = 1200;
  const end = Date.now() + duration;

  let origin = { x: 0.5, y: 0.5 };
  if (originEl) {
    const rect = originEl.getBoundingClientRect();
    origin = {
      x: (rect.left + rect.width / 2) / window.innerWidth,
      y: (rect.top + rect.height / 2) / window.innerHeight,
    };
  }

  const colors = ['#FFD700', '#FFA500', '#1B59F8', '#FF6B6B', '#FFFFFF'];

  // Initial burst
  confetti({
    particleCount: 80,
    spread: 70,
    startVelocity: 35,
    origin,
    colors,
    zIndex: 9999,
  });

  // Continuous fireworks
  const interval = window.setInterval(() => {
    const timeLeft = end - Date.now();
    if (timeLeft <= 0) {
      clearInterval(interval);
      return;
    }
    const particleCount = 30 * (timeLeft / duration);
    confetti({
      particleCount,
      startVelocity: 30,
      spread: 360,
      ticks: 60,
      origin: {
        x: origin.x + (Math.random() - 0.5) * 0.2,
        y: origin.y + (Math.random() - 0.5) * 0.1,
      },
      colors,
      shapes: ['circle', 'square'],
      zIndex: 9999,
    });
  }, 200);
}

export function FavoriteStarButton({ isFavorite, onToggle, size = 'md', className }: Props) {
  const [busy, setBusy] = useState(false);
  const [pop, setPop] = useState(false);

  const sizes = {
    sm: { btn: 'h-7 w-7', icon: 'h-3.5 w-3.5' },
    md: { btn: 'h-8 w-8', icon: 'h-4 w-4' },
    lg: { btn: 'h-10 w-10', icon: 'h-5 w-5' },
  }[size];

  const handleClick = async (e: MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    e.preventDefault();
    if (busy) return;
    const next = !isFavorite;
    setBusy(true);
    if (next) {
      fireFireworks(e.currentTarget);
      setPop(true);
      setTimeout(() => setPop(false), 600);
    }
    try {
      await onToggle(next);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      aria-label={isFavorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
      title={isFavorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
      onClick={handleClick}
      disabled={busy}
      className={cn(sizes.btn, 'rounded-full hover:bg-amber-100/60', className)}
    >
      <Star
        className={cn(
          sizes.icon,
          'transition-all duration-300',
          isFavorite
            ? 'fill-amber-400 text-amber-500 drop-shadow-[0_0_4px_rgba(251,191,36,0.6)]'
            : 'text-muted-foreground hover:text-amber-500',
          pop && 'scale-150'
        )}
      />
    </Button>
  );
}
