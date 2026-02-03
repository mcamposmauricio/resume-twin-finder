import { MapPin, Briefcase, DollarSign } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { JobPosting, WORK_TYPE_LABELS } from '@/types/jobs';

interface CareersJobCardProps {
  job: JobPosting;
  brandColor: string;
  onApply: () => void;
}

export function CareersJobCard({ job, brandColor, onApply }: CareersJobCardProps) {
  return (
    <Card className="h-full hover:shadow-lg transition-shadow group">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-lg group-hover:text-primary transition-colors line-clamp-2">
            {job.title}
          </CardTitle>
          {job.work_type && (
            <Badge
              variant="secondary"
              className="flex-shrink-0"
              style={{ backgroundColor: `${brandColor}15`, color: brandColor }}
            >
              {WORK_TYPE_LABELS[job.work_type]}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
          {job.location && (
            <div className="flex items-center gap-1.5">
              <MapPin className="h-4 w-4" />
              <span>{job.location}</span>
            </div>
          )}
          {job.salary_range && (
            <div className="flex items-center gap-1.5">
              <DollarSign className="h-4 w-4" />
              <span>{job.salary_range}</span>
            </div>
          )}
        </div>

        <p className="text-sm text-muted-foreground line-clamp-3">
          {job.description}
        </p>

        <Button
          className="w-full mt-auto"
          onClick={onApply}
          style={{ backgroundColor: brandColor }}
        >
          <Briefcase className="h-4 w-4 mr-2" />
          Candidatar-se
        </Button>
      </CardContent>
    </Card>
  );
}
