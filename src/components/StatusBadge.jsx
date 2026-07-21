import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const statusConfig = {
  draft: { label: 'Draft', classes: 'bg-muted text-muted-foreground' },
  sent: { label: 'Sent', classes: 'bg-blue-100 text-blue-700' },
  accepted: { label: 'Accepted', classes: 'bg-green-100 text-green-700' },
  converted: { label: 'Converted', classes: 'bg-purple-100 text-purple-700' },
  cancelled: { label: 'Cancelled', classes: 'bg-red-100 text-red-700' },
  paid: { label: 'Paid', classes: 'bg-emerald-100 text-emerald-700' },
};

export default function StatusBadge({ status }) {
  const config = statusConfig[status] || statusConfig.draft;
  return (
    <Badge variant="secondary" className={cn('font-medium text-xs', config.classes)}>
      {config.label}
    </Badge>
  );
}