'use client';

import { Menu } from 'lucide-react';
import * as React from 'react';

import { Button } from '../button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '../../primitives/shadcn/sheet';
import { cn } from '../../utils/cn';

export type NavbarItem = {
  label: string;
  href: string;
  active?: boolean;
};

export type NavbarProps = {
  appName: string;
  logo?: React.ReactNode;
  items: NavbarItem[];
  actions?: React.ReactNode;
  className?: string;
};

function NavLinks({
  items,
  className,
  onNavigate,
}: {
  items: NavbarItem[];
  className?: string;
  onNavigate?: () => void;
}) {
  return (
    <ul className={cn('flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-1', className)}>
      {items.map((item) => (
        <li key={item.href}>
          <a
            href={item.href}
            aria-current={item.active ? 'page' : undefined}
            onClick={onNavigate}
            className={cn(
              'cursor-pointer rounded-md px-3 py-2 text-sm font-medium transition-colors duration-150',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background',
              item.active
                ? 'bg-muted text-foreground'
                : 'text-muted-foreground hover:bg-muted/80 hover:text-foreground',
            )}
          >
            {item.label}
          </a>
        </li>
      ))}
    </ul>
  );
}

export function Navbar({ appName, logo, items, actions, className }: NavbarProps) {
  const [open, setOpen] = React.useState(false);

  return (
    <header className={cn('sticky top-0 z-40 border-b border-border bg-card', className)}>
      <nav
        aria-label={`${appName} navigation`}
        className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6"
      >
        <div className="flex min-w-0 items-center gap-3">
          {logo ?? (
            <span className="truncate text-base font-medium tracking-tight text-foreground">
              {appName}
            </span>
          )}
        </div>

        <div className="hidden sm:block">
          <NavLinks items={items} />
        </div>

        <div className="flex items-center gap-2">
          {actions}
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild className="sm:hidden">
              <Button variant="outline" size="sm" aria-label="Open navigation menu">
                <Menu className="h-4 w-4" aria-hidden />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[min(100%,20rem)]">
              <SheetHeader>
                <SheetTitle>{appName}</SheetTitle>
              </SheetHeader>
              <NavLinks items={items} className="mt-6" onNavigate={() => setOpen(false)} />
            </SheetContent>
          </Sheet>
        </div>
      </nav>
    </header>
  );
}
