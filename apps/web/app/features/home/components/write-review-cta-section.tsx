import Link from 'next/link';
import { ArrowRight, PenLine } from 'lucide-react';

// Closing CTA, adapted from Trustpilot's "Help millions make the right
// choice" homepage block. The "millions" figure is dropped — no real
// user-count metric backs it, same "generic marketing copy is fine, a
// specific false quantity about real data is not" principle as HomeHero.
// Links to the business directory (search-first) rather than a standalone
// review form, since reviews are always business-scoped in this app.
export function WriteReviewCtaSection() {
  return (
    <div className="px-4 py-16">
      <div className="mx-auto max-w-7xl overflow-hidden rounded-3xl bg-primary-600 px-8 py-16 text-center shadow-lg sm:px-16">
        <PenLine className="mx-auto h-10 w-10 text-primary-100" />
        <h2 className="mt-4 font-serif text-3xl font-bold text-white sm:text-4xl">Help Others Make the Right Choice</h2>
        <p className="mx-auto mt-3 max-w-xl text-base text-primary-100">
          Every honest review adds to a dataset others rely on. Find a business you&apos;ve worked with and share
          your experience.
        </p>
        <Link
          href="/businesses"
          className="mt-8 inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 font-serif text-sm font-bold text-primary-700 shadow-md transition hover:-translate-y-0.5 hover:shadow-lg"
        >
          Find a Business to Review
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
