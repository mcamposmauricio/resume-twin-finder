import {
  Inbox,
  ThumbsDown,
  Star,
  Check,
  X,
  Calendar,
  Phone,
  Mail,
  User,
  Briefcase,
  Clock,
  Heart,
  Flag,
  Filter,
  Send,
  Circle,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const ICON_MAP: Record<string, React.ElementType> = {
  inbox: Inbox,
  'thumbs-down': ThumbsDown,
  star: Star,
  check: Check,
  x: X,
  calendar: Calendar,
  phone: Phone,
  mail: Mail,
  user: User,
  briefcase: Briefcase,
  clock: Clock,
  heart: Heart,
  flag: Flag,
  filter: Filter,
  send: Send,
  circle: Circle,
};

interface StageIconProps {
  icon: string;
  className?: string;
  style?: React.CSSProperties;
}

export function StageIcon({ icon, className, style }: StageIconProps) {
  const IconComponent = ICON_MAP[icon] || Circle;
  return <IconComponent className={cn('h-4 w-4', className)} style={style} />;
}
