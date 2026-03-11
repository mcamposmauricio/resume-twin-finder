import { useMemo } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
} from '@dnd-kit/core';
import { useState } from 'react';
import { Inbox } from 'lucide-react';
import { JobApplication } from '@/types/jobs';
import { PipelineStage, DEFAULT_STAGES } from '@/types/pipeline';
import { KanbanColumn } from './KanbanColumn';
import { DraggableApplicationCard } from './DraggableApplicationCard';
import { ApplicationCard } from './ApplicationCard';

interface ApplicationKanbanProps {
  applications: JobApplication[];
  stages: PipelineStage[];
  onViewDetails: (application: JobApplication) => void;
  onViewResume: (application: JobApplication) => void;
  onUpdateTriageStatus: (id: string, status: string) => Promise<boolean>;
  onDeleteApplication?: (id: string) => Promise<boolean>;
}

export function ApplicationKanban({
  applications,
  stages,
  onViewDetails,
  onViewResume,
  onUpdateTriageStatus,
  onDeleteApplication,
}: ApplicationKanbanProps) {
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor)
  );

  // Use provided stages or fallback to default structure
  const displayStages = useMemo(() => {
    if (stages.length > 0) return stages;
    // Fallback to default stages structure for display
    return DEFAULT_STAGES.map((s, i) => ({
      ...s,
      id: `default-${i}`,
      user_id: '',
      created_at: '',
    })) as PipelineStage[];
  }, [stages]);

  const groupedApplications = useMemo(() => {
    const groups: Record<string, JobApplication[]> = {};

    displayStages.forEach((stage) => {
      groups[stage.slug] = [];
    });

    applications.forEach((app) => {
      const status = app.triage_status || 'new';
      if (groups[status]) {
        groups[status].push(app);
      } else {
        // If status doesn't match any stage, put in first stage
        const firstStage = displayStages[0];
        if (firstStage) {
          groups[firstStage.slug]?.push(app);
        }
      }
    });

    return groups;
  }, [applications, displayStages]);

  const activeApplication = activeId
    ? applications.find((a) => a.id === activeId)
    : null;

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const applicationId = active.id as string;
    const newStageSlug = over.id as string;

    // Get current stage from application data
    const app = applications.find((a) => a.id === applicationId);
    if (!app) return;

    const currentStageSlug = app.triage_status || 'new';

    // Only update if dropped on a different stage
    if (currentStageSlug !== newStageSlug) {
      await onUpdateTriageStatus(applicationId, newStageSlug);
    }
  };

  const handleMoveToStage = async (applicationId: string, stageSlug: string) => {
    await onUpdateTriageStatus(applicationId, stageSlug);
  };

  if (applications.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Inbox className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>Nenhuma candidatura recebida ainda.</p>
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div
        className="grid gap-4 overflow-x-auto pb-2"
        style={{
          gridTemplateColumns: `repeat(${displayStages.length}, minmax(220px, 1fr))`,
        }}
      >
        {displayStages.map((stage) => {
          const apps = groupedApplications[stage.slug] || [];

          return (
            <KanbanColumn key={stage.id} stage={stage} count={apps.length}>
              {apps.map((app) => (
                <DraggableApplicationCard
                  key={app.id}
                  application={app}
                  stage={stage}
                  stages={displayStages}
                  onViewDetails={() => onViewDetails(app)}
                  onViewResume={() => onViewResume(app)}
                  onMoveToStage={(slug) => handleMoveToStage(app.id, slug)}
                />
              ))}

              {apps.length === 0 && (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  Nenhum candidato
                </div>
              )}
            </KanbanColumn>
          );
        })}
      </div>

      <DragOverlay>
        {activeApplication && (
          <div className="opacity-80 rotate-3">
            <ApplicationCard
              application={activeApplication}
              onViewDetails={() => {}}
              onViewResume={() => {}}
            />
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}
