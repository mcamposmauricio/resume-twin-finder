import { FileEdit, Globe, PauseCircle, XCircle, BarChart3, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';

export type TimelineStatus = 'draft' | 'active' | 'paused' | 'closed' | 'analyzed';

interface TimelineStep {
  id: TimelineStatus;
  label: string;
  icon: React.ReactNode;
  count: number;
  color: string;
  bgColor: string;
  glowColor: string;
}

interface JobTimelineProps {
  counts: Record<TimelineStatus, number>;
  activeStatus: TimelineStatus;
  onStatusChange: (status: TimelineStatus) => void;
}

const MotionDiv = motion.div;

export function JobTimeline({ counts, activeStatus, onStatusChange }: JobTimelineProps) {
  const steps: TimelineStep[] = [
    { 
      id: 'draft', 
      label: 'Rascunhos', 
      icon: <FileEdit className="h-5 w-5" />, 
      count: counts.draft,
      color: 'text-slate-600 dark:text-slate-400',
      bgColor: 'bg-slate-100 dark:bg-slate-800',
      glowColor: 'shadow-slate-200/50 dark:shadow-slate-700/50'
    },
    { 
      id: 'active', 
      label: 'Publicadas', 
      icon: <Globe className="h-5 w-5" />, 
      count: counts.active,
      color: 'text-emerald-600 dark:text-emerald-400',
      bgColor: 'bg-emerald-100 dark:bg-emerald-900/40',
      glowColor: 'shadow-emerald-200/50 dark:shadow-emerald-700/50'
    },
    { 
      id: 'paused', 
      label: 'Pausadas', 
      icon: <PauseCircle className="h-5 w-5" />, 
      count: counts.paused,
      color: 'text-amber-600 dark:text-amber-400',
      bgColor: 'bg-amber-100 dark:bg-amber-900/40',
      glowColor: 'shadow-amber-200/50 dark:shadow-amber-700/50'
    },
    { 
      id: 'closed', 
      label: 'Encerradas', 
      icon: <XCircle className="h-5 w-5" />, 
      count: counts.closed,
      color: 'text-rose-600 dark:text-rose-400',
      bgColor: 'bg-rose-100 dark:bg-rose-900/40',
      glowColor: 'shadow-rose-200/50 dark:shadow-rose-700/50'
    },
    { 
      id: 'analyzed', 
      label: 'Analisadas', 
      icon: <BarChart3 className="h-5 w-5" />, 
      count: counts.analyzed,
      color: 'text-violet-600 dark:text-violet-400',
      bgColor: 'bg-violet-100 dark:bg-violet-900/40',
      glowColor: 'shadow-violet-200/50 dark:shadow-violet-700/50'
    },
  ];

  const activeIndex = steps.findIndex(s => s.id === activeStatus);

  return (
    <div className="w-full overflow-x-auto pb-2">
      <div className="flex items-center justify-between min-w-[700px] gap-2">
        {steps.map((step, index) => {
          const isActive = activeStatus === step.id;
          const isPast = index < activeIndex;
          
          return (
            <div key={step.id} className="flex items-center flex-1">
              {/* Step button */}
              <MotionDiv
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex-1"
              >
                <button
                  onClick={() => onStatusChange(step.id)}
                  className={cn(
                    "w-full flex flex-col items-center gap-2 px-4 py-4 rounded-2xl transition-all duration-300",
                    "focus:outline-none focus:ring-2 focus:ring-primary/30 focus:ring-offset-2",
                    "border-2",
                    isActive
                      ? cn(
                          "border-primary bg-primary/5 shadow-lg",
                          step.glowColor
                        )
                      : "border-transparent hover:border-muted-foreground/20 hover:bg-muted/50"
                  )}
                >
                  {/* Icon container with glow effect */}
                  <div className={cn(
                    "relative p-3 rounded-xl transition-all duration-300",
                    isActive
                      ? cn(step.bgColor, "shadow-md", step.glowColor)
                      : isPast
                        ? "bg-primary/10"
                        : "bg-muted"
                  )}>
                    <div className={cn(
                      "transition-colors duration-300",
                      isActive ? step.color : isPast ? "text-primary" : "text-muted-foreground"
                    )}>
                      {step.icon}
                    </div>
                    
                    {/* Active indicator dot */}
                    {isActive && (
                      <MotionDiv
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full border-2 border-background"
                      />
                    )}
                  </div>
                  
                  {/* Label */}
                  <span className={cn(
                    "text-sm font-medium whitespace-nowrap transition-colors duration-300",
                    isActive ? "text-foreground" : "text-muted-foreground"
                  )}>
                    {step.label}
                  </span>
                  
                  {/* Count badge with animation */}
                  <MotionDiv
                    key={step.count}
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  >
                    <Badge 
                      variant={isActive ? "default" : "secondary"}
                      className={cn(
                        "text-xs font-semibold min-w-[28px] justify-center transition-all duration-300",
                        isActive 
                          ? "bg-primary text-primary-foreground shadow-sm" 
                          : "bg-muted text-muted-foreground"
                      )}
                    >
                      {step.count}
                    </Badge>
                  </MotionDiv>
                </button>
              </MotionDiv>

              {/* Connector arrow */}
              {index < steps.length - 1 && (
                <div className="flex items-center px-1">
                  <div className={cn(
                    "flex items-center justify-center w-6 h-6 rounded-full transition-all duration-300",
                    index < activeIndex
                      ? "bg-primary/20 text-primary"
                      : "bg-muted text-muted-foreground/50"
                  )}>
                    <ChevronRight className="h-4 w-4" />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
      
      {/* Progress bar underneath */}
      <div className="mt-4 h-1.5 bg-muted rounded-full overflow-hidden">
        <MotionDiv
          className="h-full bg-gradient-to-r from-primary via-primary to-primary/70 rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${((activeIndex + 1) / steps.length) * 100}%` }}
          transition={{ type: "spring", stiffness: 100, damping: 20 }}
        />
      </div>
    </div>
  );
}
