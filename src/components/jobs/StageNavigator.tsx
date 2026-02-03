import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PipelineStage } from '@/types/pipeline';
import { StageIcon } from './StageIcon';
import { cn } from '@/lib/utils';

interface StageNavigatorProps {
  stages: PipelineStage[];
  currentStageSlug: string;
  onMoveToStage: (stageSlug: string) => void;
  disabled?: boolean;
}

export function StageNavigator({
  stages,
  currentStageSlug,
  onMoveToStage,
  disabled = false,
}: StageNavigatorProps) {
  const currentIndex = stages.findIndex((s) => s.slug === currentStageSlug);
  const currentStage = stages[currentIndex];
  const prevStage = currentIndex > 0 ? stages[currentIndex - 1] : null;
  const nextStage = currentIndex < stages.length - 1 ? stages[currentIndex + 1] : null;

  return (
    <div className="space-y-4">
      {/* Visual stepper */}
      <div className="flex items-center justify-center gap-1 overflow-x-auto py-2">
        {stages.map((stage, index) => {
          const isActive = stage.slug === currentStageSlug;
          const isPast = index < currentIndex;

          return (
            <div key={stage.id} className="flex items-center">
              <button
                onClick={() => !disabled && onMoveToStage(stage.slug)}
                disabled={disabled}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all',
                  isActive
                    ? 'ring-2 ring-offset-2'
                    : 'opacity-60 hover:opacity-100',
                  disabled && 'cursor-not-allowed'
                )}
                style={{
                  backgroundColor: isActive ? stage.color : 'transparent',
                  color: isActive ? '#fff' : stage.color,
                  borderColor: stage.color,
                  border: isActive ? 'none' : `1px solid ${stage.color}`,
                  // @ts-ignore - ringColor is a valid CSS custom property
                  '--tw-ring-color': stage.color,
                } as React.CSSProperties}
              >
                <StageIcon icon={stage.icon} className="h-3 w-3" />
                <span className="hidden sm:inline whitespace-nowrap">{stage.name}</span>
              </button>

              {index < stages.length - 1 && (
                <div
                  className={cn(
                    'w-4 h-0.5 mx-1',
                    isPast ? 'bg-primary' : 'bg-border'
                  )}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Navigation buttons */}
      <div className="flex items-center justify-between gap-4">
        <Button
          variant="outline"
          onClick={() => prevStage && onMoveToStage(prevStage.slug)}
          disabled={disabled || !prevStage}
          className="flex-1"
        >
          <ChevronLeft className="h-4 w-4 mr-2" />
          {prevStage ? (
            <span className="flex items-center gap-2">
              <span className="hidden sm:inline">Voltar para</span>
              <span
                className="font-medium"
                style={{ color: prevStage.color }}
              >
                {prevStage.name}
              </span>
            </span>
          ) : (
            'Sem etapa anterior'
          )}
        </Button>

        <Button
          onClick={() => nextStage && onMoveToStage(nextStage.slug)}
          disabled={disabled || !nextStage}
          className="flex-1"
          style={{
            backgroundColor: nextStage?.color,
            borderColor: nextStage?.color,
          }}
        >
          {nextStage ? (
            <span className="flex items-center gap-2">
              <span className="hidden sm:inline">Avançar para</span>
              <span className="font-medium">{nextStage.name}</span>
            </span>
          ) : (
            'Última etapa'
          )}
          <ChevronRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}
