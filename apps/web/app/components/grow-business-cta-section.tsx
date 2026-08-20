import Link from 'next/link';
import { ArrowRight, TrendingUp } from 'lucide-react';

// Shared "Looking to grow your business?" banner — Trustpilot's homepage/
// directory pattern of a lighter, secondary CTA pointing business owners at
// their own landing page, distinct from the primary-600 consumer CTA
// (WriteReviewCtaSection). Copy only names real features (claim your
// profile, reply to reviews, track your rank) that /for-business itself
// covers — same "no fabricated claim" principle as that page.
export function GrowBusinessCtaSection() {
  return (
    <div className="px-4 py-10">
      <div className="mx-auto flex max-w-7xl flex-col items-center gap-6 rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-xs sm:flex-row sm:justify-between sm:text-left">
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary-600/10 text-primary-600">
            <TrendingUp className="h-6 w-6" />
          </span>
          <div>
            <h2 className="font-serif text-xl font-bold text-ink-900">Looking to Grow Your Business?</h2>
            <p className="mt-1 max-w-md text-sm text-ink-700">
              Claim your profile, reply to reviews, and track your ranking &mdash; free to list.
            </p>
          </div>
        </div>
        <Link
          href="/for-business"
          className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-primary-600 px-6 py-3 font-serif text-sm font-bold text-white shadow-md transition hover:-translate-y-0.5 hover:bg-primary-700 hover:shadow-lg"
        >
          Explore Business Tools
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
