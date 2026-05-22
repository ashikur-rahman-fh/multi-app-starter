import { cva, type VariantProps } from 'class-variance-authority';
import { AlertCircle, AlertTriangle, CheckCircle2, Info } from 'lucide-react';
import * as React from 'react';

import { Alert as ShadcnAlert, AlertDescription, AlertTitle } from '../../primitives/shadcn/alert';
import { cn } from '../../utils/cn';

const alertVariants = cva('', {
  variants: {
    variant: {
      info: 'border-info/25 bg-info/[0.04] text-foreground [&>svg]:text-info/80',
      success: 'border-success/25 bg-success/[0.04] text-foreground [&>svg]:text-success/80',
      warning: 'border-warning/25 bg-warning/[0.04] text-foreground [&>svg]:text-warning/80',
      error:
        'border-destructive/25 bg-destructive/[0.04] text-foreground [&>svg]:text-destructive/80',
    },
  },
  defaultVariants: {
    variant: 'info',
  },
});

const iconMap = {
  info: Info,
  success: CheckCircle2,
  warning: AlertTriangle,
  error: AlertCircle,
} as const;

export type AlertVariant = 'info' | 'success' | 'warning' | 'error';

export type AlertProps = React.HTMLAttributes<HTMLDivElement> &
  VariantProps<typeof alertVariants> & {
    variant?: AlertVariant;
    title?: string;
    description?: string;
  };

export function Alert({
  className,
  variant = 'info',
  title,
  description,
  children,
  ...props
}: AlertProps) {
  const Icon = iconMap[variant];
  const shadcnVariant = variant === 'error' ? 'destructive' : 'default';

  return (
    <ShadcnAlert
      variant={shadcnVariant}
      className={cn(alertVariants({ variant }), className)}
      {...props}
    >
      <Icon className="h-4 w-4" aria-hidden />
      {title ? <AlertTitle>{title}</AlertTitle> : null}
      {description ? <AlertDescription>{description}</AlertDescription> : null}
      {children}
    </ShadcnAlert>
  );
}

export function InfoAlert(props: Omit<AlertProps, 'variant'>) {
  return <Alert variant="info" {...props} />;
}

export function SuccessAlert(props: Omit<AlertProps, 'variant'>) {
  return <Alert variant="success" {...props} />;
}

export function WarningAlert(props: Omit<AlertProps, 'variant'>) {
  return <Alert variant="warning" {...props} />;
}

export function ErrorAlert(props: Omit<AlertProps, 'variant'>) {
  return <Alert variant="error" {...props} />;
}
