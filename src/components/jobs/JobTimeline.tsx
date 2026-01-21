import { FileEdit, Globe, PauseCircle, XCircle, BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

export type TimelineStatus = 'draft' | 'active' | 'paused' | 'closed' | 'analyzed';

interface TimelineStep {
  id: TimelineStatus;
  label: string;
  icon: React.ReactNode;
  count: number;
}

interface JobTimelineProps {
  counts: Record<TimelineStatus, number>;
  activeStatus: TimelineStatus;
  onStatusChange: (status: TimelineStatus) => void;
}

export function JobTimeline({ counts, activeStatus, onStatusChange }: JobTimelineProps) {
  const steps: TimelineStep[] = [
    { id: 'draft', label: 'Rascunhos', icon: <FileEdit className="h-5 w-5" />, count: counts.draft },
    { id: 'active', label: 'Publicadas', icon: <Globe className="h-5 w-5" />, count: counts.active },
    { id: 'paused', label: 'Pausadas', icon: <PauseCircle className="h-5 w-5" />, count: counts.paused },
    { id: 'closed', label: 'Encerradas', icon: <XCircle className="h-5 w-5" />, count: counts.closed },
    { id: 'analyzed', label: 'Analisadas', icon: <BarChart3 className="h-5 w-5" />, count: counts.analyzed },
  ];

  return (
    <div className="w-full overflow-x-auto pb-2">
      <div className="flex items-center justify-between min-w-[600px]">
        {steps.map((step, index) => (
          <div key={step.id} className="flex items-center flex-1">
            {/* Step button */}
            <button
              onClick={() => onStatusChange(step.id)}
              className={cn(
                "flex flex-col items-center gap-1.5 px-3 py-3 rounded-xl transition-all min-w-[100px]",
                "hover:bg-muted/50 focus:outline-none focus:ring-2 focus:ring-primary/20",
                activeStatus === step.id
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "text-muted-foreground"
              )}
            >
              <div className={cn(
                "p-2 rounded-full transition-colors",
                activeStatus === step.id
                  ? "bg-primary-foreground/20"
                  : "bg-muted"
              )}>
                {step.icon}
              </div>
              <span className="text-sm font-medium whitespace-nowrap">{step.label}</span>
              <Badge 
                variant={activeStatus === step.id ? "secondary" : "outline"}
                className={cn(
                  "text-xs",
                  activeStatus === step.id && "bg-primary-foreground/20 text-primary-foreground border-transparent"
                )}
              >
                {step.count}
              </Badge>
            </button>

            {/* Connector line */}
            {index < steps.length - 1 && (
              <div className="flex-1 mx-1">
                <div className={cn(
                  "h-0.5 w-full transition-colors",
                  index < steps.findIndex(s => s.id === activeStatus)
                    ? "bg-primary"
                    : "bg-muted"
                )} />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
