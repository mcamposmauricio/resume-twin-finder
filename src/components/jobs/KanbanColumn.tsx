import { useDroppable } from '@dnd-kit/core';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { PipelineStage } from '@/types/pipeline';
import { StageIcon } from './StageIcon';
import { cn } from '@/lib/utils';

interface KanbanColumnProps {
  stage: PipelineStage;
  count: number;
  children: React.ReactNode;
  isOver?: boolean;
}

export function KanbanColumn({ stage, count, children, isOver }: KanbanColumnProps) {
  const { setNodeRef, isOver: isDropOver } = useDroppable({
    id: stage.slug,
  });

  const highlighted = isOver || isDropOver;

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'flex flex-col bg-muted/30 rounded-lg border transition-all',
        highlighted && 'ring-2 ring-primary bg-primary/5'
      )}
    >
      {/* Column Header */}
      <div
        className="flex items-center justify-between p-3 border-b rounded-t-lg"
        style={{ backgroundColor: `${stage.color}15` }}
      >
        <div className="flex items-center gap-2">
          <StageIcon
            icon={stage.icon}
            className="h-4 w-4"
            style={{ color: stage.color }}
          />
          <span className="font-medium text-sm">{stage.name}</span>
        </div>
        <Badge
          variant="secondary"
          className="text-xs"
          style={{ backgroundColor: `${stage.color}20`, color: stage.color }}
        >
          {count}
        </Badge>
      </div>

      {/* Column Content */}
      <ScrollArea className="flex-1 max-h-[500px]">
        <div className="p-2 space-y-2 min-h-[100px]">
          {children}
        </div>
      </ScrollArea>
    </div>
  );
}
