'use client';

import { Eye, EyeOff } from 'lucide-react';
import { useState, type ChangeEvent } from 'react';

import { Button } from '../button/button';
import { Input } from '../input/input';
import { cn } from '../../utils/cn';

export type PasswordInputProps = {
  id: string;
  label: string;
  value: string;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  showPasswordLabel: string;
  hidePasswordLabel: string;
  name?: string;
  autoComplete?: string;
  disabled?: boolean;
  required?: boolean;
  className?: string;
};

export function PasswordInput({
  id,
  label,
  value,
  onChange,
  showPasswordLabel,
  hidePasswordLabel,
  name,
  autoComplete,
  disabled = false,
  required = false,
  className,
}: PasswordInputProps) {
  const [visible, setVisible] = useState(false);

  return (
    <div className={cn('space-y-2', className)}>
      <label htmlFor={id} className="text-sm font-medium text-foreground">
        {label}
      </label>
      <div className="relative">
        <Input
          id={id}
          name={name}
          type={visible ? 'text' : 'password'}
          autoComplete={autoComplete}
          value={value}
          onChange={onChange}
          disabled={disabled}
          required={required}
          className="pr-10"
        />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="absolute right-1 top-1/2 h-8 w-8 -translate-y-1/2 p-0"
          onClick={() => setVisible((current) => !current)}
          aria-label={visible ? hidePasswordLabel : showPasswordLabel}
          title={visible ? hidePasswordLabel : showPasswordLabel}
          aria-pressed={visible}
          disabled={disabled}
        >
          {visible ? (
            <EyeOff className="h-4 w-4" aria-hidden />
          ) : (
            <Eye className="h-4 w-4" aria-hidden />
          )}
        </Button>
      </div>
    </div>
  );
}
