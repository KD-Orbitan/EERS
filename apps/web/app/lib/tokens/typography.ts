/**
 * Typography extracted from Figma file 0wO1xj82IEVPuSwyLZQqQ2.
 *
 * The file defines no shared Figma text styles (`get_variable_defs` returned
 * empty for both frames) and reuses the layer name "Heading 2" at three
 * different pixel sizes (20px card titles, 24px section titles, plus a 39px
 * container). The scale below is our own canonical H1–H4 mapping, grounded
 * in the concrete sizes actually observed, not a literal copy of Figma's
 * inconsistent layer names.
 *
 * Two type families are used in the source file: a serif ("Liberation
 * Serif", Figma's fallback for a missing display font) for large headings,
 * and a sans ("Inter") for dashboard/UI chrome and small headings. We map
 * these to Tailwind's built-in `font-serif` utility and the project's
 * existing `font-sans` (Geist, already wired in `globals.css`) — no new
 * font is loaded.
 */

export const typography = {
  heading: {
    h1: { fontSize: '48px', lineHeight: '52.8px', fontWeight: 700, letterSpacing: '-0.02em', fontFamily: 'serif' }, // node 1:71, "Business Directory"
    h2: { fontSize: '24px', lineHeight: '31.2px', fontWeight: 700, fontFamily: 'serif' }, // node 1:967, "Performance Benchmarks"
    h3: { fontSize: '20px', lineHeight: '28px', fontWeight: 700, fontFamily: 'serif' }, // node 1:97, card title "Nexus Logistics"
    h4: { fontSize: '16px', lineHeight: '24px', fontWeight: 600, fontFamily: 'sans' }, // node 1:2494, "Moderator #4401" (Inter, not serif)
  },
  body: {
    base: { fontSize: '16px', lineHeight: '24px', fontWeight: 400, fontFamily: 'sans' },
    small: { fontSize: '14px', lineHeight: '21px', fontWeight: 400, fontFamily: 'sans' }, // node 1:108, "(1,240 reviews)"
    xs: { fontSize: '12px', lineHeight: '12px', fontWeight: 400, fontFamily: 'sans', letterSpacing: '0.05em', textTransform: 'uppercase' }, // node 1:76, "SORT BY"
  },
  button: {
    base: { fontSize: '16px', lineHeight: '24px', fontWeight: 700, fontFamily: 'serif' }, // node 1:56, "Export Report"
    small: { fontSize: '14px', lineHeight: '21px', fontWeight: 700, fontFamily: 'serif' }, // node 1:78, "Top Rated"
  },
  label: { fontSize: '14px', lineHeight: '21px', fontWeight: 500, fontFamily: 'sans' }, // no explicit form label in Figma; matches existing form label convention
  caption: { fontSize: '12px', lineHeight: '12px', fontWeight: 400, fontFamily: 'sans', letterSpacing: '0.05em', textTransform: 'uppercase' }, // node 1:93, "VERIFIED"
} as const;
