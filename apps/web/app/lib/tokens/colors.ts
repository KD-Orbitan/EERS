/**
 * Brand palette — Material You (Material Design 3), site-wide (see
 * docs/promptFE6.md). Purple/violet seed #6750A4, following MD3's tonal
 * surface system rather than a flat brand ramp.
 *
 * These are wired into `app/globals.css` (`@theme inline`) as
 * `--color-primary-*` / `--color-ink-*` / `--color-info-*` CSS variables,
 * which is how Tailwind v4 generates the matching `bg-primary-600`,
 * `text-ink-900`, etc. utility classes used across the app. This file exists
 * for non-Tailwind consumers and as a single documented source of the raw
 * values.
 *
 * Unlike the previous flat 5-tone ramp, this palette follows real MD3
 * roles: primary.600 is the MD3 "Primary" seed; primary.100/50 are the
 * "Secondary Container"/"Surface Container" tonal surfaces; primary.500 is
 * "Tertiary" (used for variety on accent panels, matching MD3's own use of
 * tertiary for FABs/accents); primary.700/900 is Primary darkened ~15% for
 * hover/pressed, since MD3's real "state layer" (opacity overlay) can't be
 * expressed as a static hex the way `hover:bg-primary-700` classes need.
 *
 * `status` (pending/approved/rejected/hidden badges) and error/destructive
 * text are intentionally left OUT of this palette and keep using Tailwind's
 * stock amber/emerald/red/slate — those colors carry state meaning
 * (success/warning/danger) that shouldn't be reassigned to the brand ramp.
 */

export const colors = {
  /** MD3 Primary (purple seed) + Tertiary (mauve) — CTAs, links, active states, progress fills. */
  primary: {
    50: '#f3edf7', // MD3 Surface Container — lightest tonal surface
    100: '#e8def8', // MD3 Secondary Container — light lavender, chips/tags
    200: '#e8def8', // MD3 Secondary Container — category/rank tag background
    400: '#9179c4', // lighter tint of Primary — hover accents/borders (e.g. upload dropzone)
    500: '#7d5260', // MD3 Tertiary (mauve) — accent panel background / FABs
    600: '#6750a4', // MD3 Primary — primary button / links / progress fill (main brand color)
    700: '#56438c', // derived — Primary darkened ~15%, hover/pressed state
    900: '#56438c', // derived — same as 700, used for dark image overlays
  },
  /** "Verified" trust badge — kept visually distinct from the primary badge. */
  info: {
    100: '#7d5260', // MD3 Tertiary badge background
    700: '#fffbfe', // MD3 Surface (near-white) badge text
  },
  /** Neutral / text ink — MD3 On-Surface / On-Surface-Variant / Outline roles. */
  ink: {
    900: '#1c1b1f', // MD3 On Surface — headings
    700: '#1c1b1f', // MD3 On Surface — body text
    600: '#49454f', // MD3 On Surface Variant — secondary text/icons
    500: '#49454f', // MD3 On Surface Variant — muted uppercase labels
    400: '#49454f', // MD3 On Surface Variant — placeholder text
    300: '#79747e', // MD3 Outline — default border
    200: '#cac4d0', // MD3 Outline Variant — light border
    100: '#f3edf7', // MD3 Surface Container — light surface / hover row background
    50: '#fffbfe', // MD3 Surface — lightest surface (never pure white)
    border: 'rgba(103,80,164,0.15)', // Primary at 15% opacity — subtle card/tag borders
  },
  /** Not part of the brand ramp — standard Tailwind palette for status badges. */
  status: {
    pending: { bg: '#fef3c7', text: '#b45309' }, // amber-100 / amber-700
    approved: { bg: '#d1fae5', text: '#047857' }, // emerald-100 / emerald-700
    rejected: { bg: '#fee2e2', text: '#b91c1c' }, // red-100 / red-700
    hidden: { bg: '#f1f5f9', text: '#334155' }, // slate-100 / slate-700
  },
} as const;
