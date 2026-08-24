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
 * The whole site uses a single sans-serif family ("Inter"/Geist, already
 * wired in `globals.css` as `--font-sans`) via Tailwind's `font-sans`
 * utility — the serif display font Figma's fallback rendered for large
 * headings ("Liberation Serif", a missing-font placeholder, not an actual
 * design choice) is intentionally not used anywhere.
 */

export const typography = {
  heading: {
    h1: { fontSize: '48px', lineHeight: '52.8px', fontWeight: 700, letterSpacing: '-0.02em', fontFamily: 'sans' }, // node 1:71, "Business Directory"
    h2: { fontSize: '24px', lineHeight: '31.2px', fontWeight: 700, fontFamily: 'sans' }, // node 1:967, "Performance Benchmarks"
    h3: { fontSize: '20px', lineHeight: '28px', fontWeight: 700, fontFamily: 'sans' }, // node 1:97, card title "Nexus Logistics"
    h4: { fontSize: '16px', lineHeight: '24px', fontWeight: 600, fontFamily: 'sans' }, // node 1:2494, "Moderator #4401"
  },
  body: {
    base: { fontSize: '16px', lineHeight: '24px', fontWeight: 400, fontFamily: 'sans' },
    small: { fontSize: '14px', lineHeight: '21px', fontWeight: 400, fontFamily: 'sans' }, // node 1:108, "(1,240 reviews)"
    xs: { fontSize: '12px', lineHeight: '12px', fontWeight: 400, fontFamily: 'sans', letterSpacing: '0.05em', textTransform: 'uppercase' }, // node 1:76, "SORT BY"
  },
  button: {
    base: { fontSize: '16px', lineHeight: '24px', fontWeight: 700, fontFamily: 'sans' }, // node 1:56, "Export Report"
    small: { fontSize: '14px', lineHeight: '21px', fontWeight: 700, fontFamily: 'sans' }, // node 1:78, "Top Rated"
  },
  label: { fontSize: '14px', lineHeight: '21px', fontWeight: 500, fontFamily: 'sans' }, // no explicit form label in Figma; matches existing form label convention
  caption: { fontSize: '12px', lineHeight: '12px', fontWeight: 400, fontFamily: 'sans', letterSpacing: '0.05em', textTransform: 'uppercase' }, // node 1:93, "VERIFIED"
} as const;
