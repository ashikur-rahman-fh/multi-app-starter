import { Inbox } from 'lucide-react';
import * as React from 'react';

import { cn } from '../../utils/cn';

export type EmptyStateProps = {
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
};

export function EmptyState({ title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-4 rounded-lg border border-dashed border-border bg-card p-10 text-center shadow-card',
        className,
      )}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-md bg-muted">
        <Inbox className="h-6 w-6 text-muted-foreground" aria-hidden />
      </div>
      <div className="max-w-sm space-y-1">
        <h2 className="text-lg font-semibold tracking-tight text-foreground">{title}</h2>
        {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
      </div>
      {action}
    </div>
  );
}
