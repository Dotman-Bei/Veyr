import { CheckCircle2, XCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { Category } from '@/lib/genlayer';

const CATEGORY_LABEL: Record<Category, string> = {
  approved: 'approved',
  toxic: 'toxic',
  'off-topic': 'off-topic',
  spam: 'spam',
  other: 'policy',
};

export function VerdictBadge({ approved }: { approved: boolean }) {
  return approved ? (
    <Badge variant="success">
      <CheckCircle2 aria-hidden /> Approved
    </Badge>
  ) : (
    <Badge variant="destructive">
      <XCircle aria-hidden /> Rejected
    </Badge>
  );
}

export function CategoryBadge({ category }: { category: Category }) {
  if (category === 'approved') return null;
  return <Badge variant="muted">{CATEGORY_LABEL[category]}</Badge>;
}
