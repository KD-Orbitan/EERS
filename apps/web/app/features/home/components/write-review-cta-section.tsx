import Link from 'next/link';
import { ArrowRight, PenLine } from 'lucide-react';

// Closing CTA, adapted from Trustpilot's "Help millions make the right
// choice" homepage block. The "millions" figure is dropped — no real
// user-count metric backs it, same "generic marketing copy is fine, a
// specific false quantity about real data is not" principle as HomeHero.
// Links to the business directory (search-first) rather than a standalone
// review form, since reviews are always business-scoped in this app.
//
// Material You (site-wide, see docs/promptFE6.md): "important sections"
// (Final CTA) start at shadow-lg, with tertiary + primary blur shapes for
// atmospheric depth.
export function WriteReviewCtaSection() {
  return (
    <div className="px-4 py-16">
      <div className="relative mx-auto max-w-7xl overflow-hidden rounded-4xl bg-primary-600 px-8 py-16 text-center shadow-lg sm:px-16">
        {/* Static color-block accents (see HomeHero for the moving version) —
            corner-anchored and hidden below sm so they never sit under the
            centered heading/copy on narrow screens. */}
        <div className="pointer-events-none absolute right-10 top-8 hidden h-14 w-14 rotate-12 rounded-2xl bg-info-100/40 sm:block" aria-hidden="true" />
        <div className="pointer-events-none absolute left-10 bottom-10 hidden h-12 w-12 rotate-45 rounded-lg bg-primary-100/25 sm:block" aria-hidden="true" />
        <div className="pointer-events-none absolute -bottom-8 -right-8 hidden h-28 w-28 rounded-full bg-primary-400/30 blur-sm sm:block" aria-hidden="true" />

        <div className="relative">
          <PenLine className="mx-auto h-10 w-10 text-white/80" />
          <h2 className="mt-4 text-3xl font-medium tracking-tight text-white sm:text-4xl">
            Help Others Make the Right Choice
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-base leading-relaxed text-white/80">
            Every honest review adds to a dataset others rely on. Find a business you&apos;ve worked with and share
            your experience.
          </p>
          <Link
            href="/businesses"
            className="ease-md mt-8 inline-flex h-12 items-center gap-2 rounded-full bg-white px-6 text-sm font-medium text-primary-700 transition-all duration-300 hover:shadow-md active:scale-95"
          >
            Find a Business to Review
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
