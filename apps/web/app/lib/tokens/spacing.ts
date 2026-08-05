/**
 * Spacing extracted from Figma file 0wO1xj82IEVPuSwyLZQqQ2.
 *
 * The observed paddings/gaps (4, 8, 12, 16, 24-28px) already land on
 * Tailwind's default 4px-based spacing scale, so no custom spacing tokens
 * were added to the theme — components use Tailwind's `gap-*`/`p-*`
 * utilities directly.
 *
 * Both provided frames are fixed-width desktop artboards (1280px) — the
 * Figma file contains no mobile/tablet artboards to extract breakpoints
 * from. `breakpoints` below are Tailwind's standard defaults, not
 * Figma-sourced; `grid.desktop` (3 columns) is the one figure actually
 * observed (node 1:83, "Bento Grid of Business Cards", 944px container /
 * 3 × ~299px cards) — `grid.tablet`/`grid.mobile` are our own responsive
 * extrapolation, already implemented in `business-list.tsx`.
 */

export const spacing = {
  scale: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px', // Figma card padding was 25-28px, closest standard step is 24px (Tailwind `p-6`)
    xl: '32px',
  },
  breakpoints: {
    mobile: '375px',
    tablet: '768px',
    desktop: '1280px',
  },
  grid: {
    mobile: 1,
    tablet: 2,
    desktop: 3, // node 1:83
  },
} as const;
