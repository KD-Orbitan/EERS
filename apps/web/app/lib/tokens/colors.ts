/**
 * Colors extracted from Figma file 0wO1xj82IEVPuSwyLZQqQ2
 * ("Business Directory" node 1:2, "Business Profile" node 1:864).
 *
 * These are also wired into `app/globals.css` (`@theme inline`) as
 * `--color-primary-*` / `--color-ink-*` / `--color-info-*` CSS variables,
 * which is how Tailwind v4 generates the matching `bg-primary-600`,
 * `text-ink-900`, etc. utility classes used across the business feature.
 * This file exists for non-Tailwind consumers and as a single documented
 * source of the raw values.
 *
 * The two Figma frames never define a status/success/warning/error color
 * (they only show a single cyan "VERIFIED" trust badge). `status` below is
 * NOT extracted from Figma — it reuses Tailwind's standard emerald/amber/red
 * palette, already in use by `components/ui/badge.tsx` for business status
 * (pending/approved/rejected/hidden), and is documented as such rather than
 * inventing hex values that were never in the file.
 */

export const colors = {
  /** Brand indigo/violet — CTAs, links, active states, progress fills. */
  primary: {
    50: '#eff4ff', // search input background — node 1:346
    100: '#e5eeff', // progress bar track — node 1:989
    200: '#dce9ff', // category/rank tag background — node 1:98
    500: '#4f46e5', // active tab pill / brand panel bg — nodes 1:77, 1:2488
    600: '#3525cd', // primary button / links / progress fill — nodes 1:52, 1:123, 1:990
    700: '#2d1fb0', // derived hover shade (not in Figma; darkened 600)
  },
  /** "Verified" trust badge — a distinct cyan, not part of the primary scale. */
  info: {
    100: '#c9e6ff', // node 1:1523 badge background
    700: '#004c6e', // node 1:93 badge text
  },
  /** Neutral / text ink — cool-toned grays used for headings and body copy. */
  ink: {
    900: '#0b1c30', // headings — node 1:71
    700: '#464555', // body text — node 1:73
    500: '#777587', // muted uppercase labels — node 1:76
    400: '#6b7280', // placeholder text — node 1:351
    border: 'rgba(199,196,216,0.3)', // card/tag borders — node 1:111
  },
  /** Not sourced from Figma — standard Tailwind palette for business status badges. */
  status: {
    pending: { bg: '#fef3c7', text: '#b45309' }, // amber-100 / amber-700
    approved: { bg: '#d1fae5', text: '#047857' }, // emerald-100 / emerald-700
    rejected: { bg: '#fee2e2', text: '#b91c1c' }, // red-100 / red-700
    hidden: { bg: '#f1f5f9', text: '#334155' }, // slate-100 / slate-700
  },
} as const;
