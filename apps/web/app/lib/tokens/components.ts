/**
 * Component styles extracted from Figma file 0wO1xj82IEVPuSwyLZQqQ2.
 *
 * Each entry lists the raw values plus the Tailwind utility classes that
 * encode them in this codebase (the project styles exclusively with
 * Tailwind classes — no inline styles/CSS-in-JS — so these classes ARE the
 * applied tokens, via the `primary-*`/`ink-*`/`info-*` vars in
 * `app/globals.css`). Radius/shadow figures already line up almost exactly
 * with Tailwind v4's default scale (16px = `rounded-2xl`, 8px = `rounded-lg`,
 * 9999px = `rounded-full`), so no custom radius/shadow tokens were needed.
 */

export const components = {
  button: {
    primary: {
      background: '#3525cd', // node 1:52
      text: '#ffffff',
      radius: '12px', // rounded-xl
      shadow: '0px 4px 6px -1px rgba(0,0,0,0.1), 0px 2px 4px -2px rgba(0,0,0,0.1)', // node 1:53 — equals Tailwind `shadow-md`
      padding: '16px 24px',
      className: 'bg-primary-600 text-white rounded-xl shadow-md hover:bg-primary-700',
    },
    outline: {
      background: '#ffffff',
      border: 'rgba(199,196,216,0.3)', // node 1:111
      radius: '8px', // rounded-lg
      className: 'border border-slate-200 bg-white text-slate-900 hover:bg-slate-50 rounded-lg',
    },
  },
  input: {
    background: '#eff4ff', // node 1:346
    border: 'rgba(199,196,216,0.2)',
    radius: '12px', // rounded-xl
    placeholderColor: '#6b7280', // node 1:351
    className: 'bg-primary-50 border border-slate-200 rounded-xl focus:border-primary-500 focus:ring-2 focus:ring-primary-100',
  },
  card: {
    background: 'rgba(255,255,255,0.7)', // node 1:84 (glassmorphism); solid white used for opaque cards, e.g. node 1:965
    border: 'rgba(255,255,255,0.3)',
    radius: '16px', // rounded-2xl — node 1:84
    shadowSubtle: '0px 1px 1px rgba(0,0,0,0.05)', // node 1:533 — close to Tailwind `shadow-xs`
    padding: '25px 25px 25px 28px',
    className: 'bg-white rounded-2xl shadow-xs ring-1 ring-slate-200',
  },
  badge: {
    brand: {
      background: '#dce9ff', // node 1:98
      text: '#3525cd', // node 1:99
      radius: '8px', // rounded-lg
      className: 'bg-primary-200 text-primary-600 rounded-lg',
    },
    info: {
      background: '#c9e6ff', // node 1:1523
      text: '#004c6e', // node 1:93
      radius: '9999px', // rounded-full
      className: 'bg-info-100 text-info-700 rounded-full',
    },
  },
} as const;
