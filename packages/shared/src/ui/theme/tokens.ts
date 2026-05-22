/** Design token names — align with CSS variables in styles/theme.css */

export const semanticColorTokens = [
  'background',
  'foreground',
  'card',
  'card-foreground',
  'muted',
  'muted-foreground',
  'border',
  'input',
  'ring',
  'primary',
  'primary-foreground',
  'secondary',
  'secondary-foreground',
  'destructive',
  'destructive-foreground',
  'warning',
  'warning-foreground',
  'success',
  'success-foreground',
  'info',
  'info-foreground',
] as const;

export type SemanticColorToken = (typeof semanticColorTokens)[number];

/** Radius scale — use Tailwind `rounded-{xs|sm|md|lg|xl}` mapped to theme.css */
export const radiusTokens = ['xs', 'sm', 'md', 'lg', 'xl'] as const;

export type RadiusToken = (typeof radiusTokens)[number];

export const radiusCssVars = {
  xs: '--radius-xs',
  sm: '--radius-sm',
  md: '--radius-md',
  lg: '--radius-lg',
  xl: '--radius-xl',
  default: '--radius',
} as const;

/** Component → recommended radius utility */
export const componentRadiusGuide = {
  button: 'rounded-md',
  input: 'rounded-md',
  select: 'rounded-md',
  alert: 'rounded-lg',
  card: 'rounded-lg',
  badge: 'rounded-md',
  toast: 'rounded-lg',
  dialog: 'rounded-lg',
  navbar: 'none (full-width) or rounded-lg in contained layouts',
} as const;

export const typographyTokens = {
  sans: '--font-sans',
  mono: '--font-mono',
} as const;

export const shadowTokens = {
  soft: '--shadow-soft',
  card: '--shadow-card',
} as const;
