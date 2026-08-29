/**
 * Component style reference for the app's Tailwind classes (no inline
 * styles/CSS-in-JS — these classes ARE the applied tokens, via the
 * `primary-*`/`ink-*`/`info-*` vars in `app/globals.css`, sourced from
 * `app/lib/tokens/colors.ts`). Material You (docs/promptFE6.md): the
 * `rounded-*` scale itself is remapped in `app/globals.css` (`@theme`
 * `--radius-*` overrides) to MD3's radius steps (12/16/24/32px), so every
 * existing `rounded-lg`/`rounded-xl`/`rounded-2xl`/`rounded-3xl` usage
 * app-wide picks up the new values automatically — the px figures below
 * reflect that remap, not Tailwind's stock scale.
 */

export const components = {
  button: {
    primary: {
      background: '#6750a4',
      text: '#ffffff',
      radius: '9999px', // rounded-full — MD3 buttons are always pill-shaped
      shadow: 'none at rest, shadow-md on hover', // MD3 elevation, not a static drop shadow
      padding: '16px 24px',
      className: 'bg-primary-600 text-white rounded-full shadow-none hover:bg-primary-700 hover:shadow-md active:scale-95',
    },
    outline: {
      background: 'transparent',
      border: 'rgba(103,80,164,1)', // MD3 Outline, full opacity on outlined buttons
      radius: '9999px', // rounded-full
      className: 'border border-primary-600 bg-transparent text-primary-600 hover:bg-primary-600/5 rounded-full active:scale-95',
    },
  },
  input: {
    background: '#e7e0ec', // MD3 Surface Container Low
    border: '#79747e', // MD3 Outline, bottom border only (filled text field style)
    radius: '12px 12px 0px 0px', // MD3 filled text field — rounded top, square bottom
    placeholderColor: '#49454f',
    className: 'bg-ink-100 border-b-2 border-ink-300 rounded-t-xl rounded-b-none focus:border-primary-600',
  },
  card: {
    background: '#f3edf7', // MD3 Surface Container — never pure white
    border: 'none', // MD3 prefers tonal surfaces over borders
    radius: '24px', // rounded-2xl (remapped) — MD3 "Large"
    shadowSubtle: 'shadow-sm at rest, shadow-md on hover',
    padding: '25px 25px 25px 28px',
    className: 'bg-primary-50 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300',
  },
  badge: {
    brand: {
      background: '#e8def8',
      text: '#6750a4',
      radius: '9999px', // rounded-full
      className: 'bg-primary-200 text-primary-600 rounded-full',
    },
    info: {
      background: '#7d5260',
      text: '#fffbfe',
      radius: '9999px', // rounded-full
      className: 'bg-info-100 text-info-700 rounded-full',
    },
  },
} as const;
