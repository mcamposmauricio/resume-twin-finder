import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { JobApplication } from '@/types/jobs';
import { PipelineStage } from '@/types/pipeline';
import { ApplicationCard } from './ApplicationCard';
import { cn } from '@/lib/utils';

interface DraggableApplicationCardProps {
  application: JobApplication;
  stage: PipelineStage;
  stages: PipelineStage[];
  onViewDetails: () => void;
  onViewResume: () => void;
  onMoveToStage: (stageSlug: string) => void;
  onDelete?: () => void;
}

export function DraggableApplicationCard({
  application,
  stage,
  stages,
  onViewDetails,
  onViewResume,
  onMoveToStage,
  onDelete,
}: DraggableApplicationCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: application.id,
    data: {
      application,
      currentStageSlug: stage.slug,
    },
  });

  const style = transform
    ? {
        transform: CSS.Translate.toString(transform),
        zIndex: isDragging ? 50 : undefined,
      }
    : undefined;

  const stageIndex = stages.findIndex((s) => s.slug === stage.slug);
  const hasPrev = stageIndex > 0;
  const hasNext = stageIndex < stages.length - 1;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'group/card relative',
        isDragging && 'opacity-50'
      )}
      {...attributes}
      {...listeners}
    >
      <ApplicationCard
        application={application}
        onViewDetails={onViewDetails}
        onViewResume={onViewResume}
        stageColor={stage.color}
      />

      {/* Move buttons */}
      <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 opacity-0 group-hover/card:opacity-100 transition-opacity flex gap-1 bg-background border rounded-full shadow-sm p-0.5">
        {hasPrev && (
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={(e) => {
              e.stopPropagation();
              onMoveToStage(stages[stageIndex - 1].slug);
            }}
          >
            <ArrowLeft className="h-3 w-3" />
          </Button>
        )}
        {hasNext && (
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={(e) => {
              e.stopPropagation();
              onMoveToStage(stages[stageIndex + 1].slug);
            }}
          >
            <ArrowRight className="h-3 w-3" />
          </Button>
        )}
      </div>
    </div>
  );
}
