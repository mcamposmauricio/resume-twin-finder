import { useMemo } from 'react';
import { Inbox, ThumbsDown, Star, ArrowRight, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { JobApplication, TriageStatus, TRIAGE_STATUS_LABELS } from '@/types/jobs';
import { ApplicationCard } from './ApplicationCard';
import { cn } from '@/lib/utils';

interface ApplicationKanbanProps {
  applications: JobApplication[];
  onViewDetails: (application: JobApplication) => void;
  onViewResume: (application: JobApplication) => void;
  onUpdateTriageStatus: (id: string, status: TriageStatus) => Promise<boolean>;
}

const COLUMNS: { status: TriageStatus; icon: React.ElementType; color: string }[] = [
  { status: 'new', icon: Inbox, color: 'text-muted-foreground' },
  { status: 'low_fit', icon: ThumbsDown, color: 'text-orange-600' },
  { status: 'deserves_analysis', icon: Star, color: 'text-primary' },
];

export function ApplicationKanban({
  applications,
  onViewDetails,
  onViewResume,
  onUpdateTriageStatus,
}: ApplicationKanbanProps) {
  const groupedApplications = useMemo(() => {
    const groups: Record<TriageStatus, JobApplication[]> = {
      new: [],
      low_fit: [],
      deserves_analysis: [],
    };

    applications.forEach((app) => {
      const status = app.triage_status || 'new';
      if (groups[status]) {
        groups[status].push(app);
      } else {
        groups.new.push(app);
      }
    });

    return groups;
  }, [applications]);

  const handleMoveLeft = async (app: JobApplication, currentIndex: number) => {
    if (currentIndex <= 0) return;
    const newStatus = COLUMNS[currentIndex - 1].status;
    await onUpdateTriageStatus(app.id, newStatus);
  };

  const handleMoveRight = async (app: JobApplication, currentIndex: number) => {
    if (currentIndex >= COLUMNS.length - 1) return;
    const newStatus = COLUMNS[currentIndex + 1].status;
    await onUpdateTriageStatus(app.id, newStatus);
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
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {COLUMNS.map((column, columnIndex) => {
        const Icon = column.icon;
        const apps = groupedApplications[column.status];

        return (
          <div
            key={column.status}
            className="flex flex-col bg-muted/30 rounded-lg border"
          >
            {/* Column Header */}
            <div className="flex items-center justify-between p-3 border-b bg-muted/50 rounded-t-lg">
              <div className="flex items-center gap-2">
                <Icon className={cn('h-4 w-4', column.color)} />
                <span className="font-medium text-sm">
                  {TRIAGE_STATUS_LABELS[column.status]}
                </span>
              </div>
              <Badge variant="secondary" className="text-xs">
                {apps.length}
              </Badge>
            </div>

            {/* Column Content */}
            <ScrollArea className="flex-1 max-h-[500px]">
              <div className="p-2 space-y-2">
                {apps.map((app) => (
                  <div key={app.id} className="group/card relative">
                    <ApplicationCard
                      application={app}
                      onViewDetails={() => onViewDetails(app)}
                      onViewResume={() => onViewResume(app)}
                      showTriageIndicator={column.status === 'deserves_analysis'}
                    />
                    
                    {/* Move buttons */}
                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 opacity-0 group-hover/card:opacity-100 transition-opacity flex gap-1 bg-background border rounded-full shadow-sm p-0.5">
                      {columnIndex > 0 && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMoveLeft(app, columnIndex);
                          }}
                        >
                          <ArrowLeft className="h-3 w-3" />
                        </Button>
                      )}
                      {columnIndex < COLUMNS.length - 1 && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMoveRight(app, columnIndex);
                          }}
                        >
                          <ArrowRight className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}

                {apps.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground text-sm">
                    Nenhum candidato
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        );
      })}
    </div>
  );
}
