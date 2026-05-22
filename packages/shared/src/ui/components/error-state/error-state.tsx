import { AlertCircle } from 'lucide-react';

import { cn } from '../../utils/cn';

export type ErrorStateProps = {
  message: string;
  className?: string;
};

export function ErrorState({ message, className }: ErrorStateProps) {
  return (
    <div
      role="alert"
      className={cn(
        'flex items-start gap-3 rounded-lg border border-destructive/20 bg-destructive/[0.04] p-4 text-sm',
        className,
      )}
    >
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" aria-hidden />
      <p className="text-foreground">{message}</p>
    </div>
  );
}
