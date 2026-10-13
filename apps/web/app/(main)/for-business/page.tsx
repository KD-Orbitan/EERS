'use client';

import Link from 'next/link';
import { ArrowRight, Building2, LineChart, MessageSquareText, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useRankingMetadataQuery } from '@/features/ranking/queries/use-ranking-metadata.query';

const FEATURES = [
  {
    icon: Building2,
    title: 'Own Your Profile',
    description: 'Manage your business details, photos, and locations from your profile and editing pages.',
  },
  {
    icon: MessageSquareText,
    title: 'Respond to Reviews',
    description: 'Respond to reviews on the business profile you manage.',
  },
  {
    icon: LineChart,
    title: 'Track Your Ranking',
    description: 'View your rating, review count, and latest EERS rank.',
  },
  {
    icon: ShieldCheck,
    title: 'Review-Based Scoring',
    description:
      'Rankings use eligible approved reviews, weighted criteria, and a Bayesian adjustment for review volume.',
  },
];

const STEPS = [
  { title: 'List your business', description: 'Submit your business details and photos.' },
  { title: 'Get reviewed', description: 'Listings are reviewed before publication.' },
  { title: 'Manage your profile', description: 'Add photos, locations, and reply to customer reviews.' },
  { title: 'Track your rank', description: 'Check your overall rank after each completed ranking update.' },
];

export default function ForBusinessPage() {
  const { isAuthenticated } = useAuth();
  const { data: metadata } = useRankingMetadataQuery();

  return (
    <main className="min-h-screen bg-ink-50">
      <div className="relative overflow-hidden px-4 pb-20 pt-20 text-center">
        {/* Hidden below lg: sized/offset so they clear the centered max-w-2xl
            text column with margin to spare from lg up, instead of waiting
            for xl just to be safe. */}
        <div className="animate-float-c pointer-events-none absolute -left-16 -top-20 hidden h-56 w-56 rounded-full bg-primary-100/60 blur-2xl lg:block" aria-hidden="true" />
        <div className="animate-float-a pointer-events-none absolute -right-16 top-10 hidden h-36 w-36 rounded-[2.5rem] bg-primary-600/55 lg:block" aria-hidden="true" />
        <div className="animate-float-b pointer-events-none absolute right-8 top-24 hidden h-28 w-28 rounded-full bg-info-100/55 lg:block" aria-hidden="true" />

        <div className="relative mx-auto max-w-2xl">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-info-100 px-4 py-1 text-xs font-medium tracking-wide text-info-700">
            <ShieldCheck className="h-3.5 w-3.5" />
            FOR BUSINESS OWNERS
          </span>

          <h1 className="mt-4 font-sans text-4xl font-bold tracking-tight text-ink-900 sm:text-5xl">
            Your Business on EERS
          </h1>
          <p className="mt-4 text-lg text-ink-700">
            Manage your listing, respond to reviews, and track your EERS rank.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/businesses/create"
              className="inline-flex items-center gap-2 rounded-xl bg-primary-600 px-6 py-3 font-sans text-sm font-bold text-white shadow-md transition hover:-translate-y-0.5 hover:bg-primary-700 hover:shadow-lg"
            >
              List Your Business
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href={isAuthenticated ? '/businesses/my' : '/login'}
              className="inline-flex items-center gap-2 rounded-xl border border-ink-300 bg-ink-50 px-6 py-3 font-sans text-sm font-bold text-ink-900 shadow-xs transition hover:bg-ink-100"
            >
              {isAuthenticated ? 'Manage Your Businesses' : 'Sign In to Manage'}
            </Link>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4 pb-20">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {FEATURES.map((feature) => (
            <div key={feature.title} className="rounded-2xl bg-ink-50 p-6 shadow-xs ring-1 ring-ink-200">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-600/10 text-primary-600">
                <feature.icon className="h-5 w-5" />
              </span>
              <h2 className="mt-4 font-sans text-lg font-bold text-ink-900">{feature.title}</h2>
              <p className="mt-1.5 text-sm text-ink-700">{feature.description}</p>
            </div>
          ))}
        </div>

        <div className="mt-6 rounded-3xl bg-ink-50 p-8 shadow-xs ring-1 ring-ink-200 sm:p-10">
          <h2 className="text-center font-sans text-2xl font-bold text-ink-900">How It Works</h2>
          <div className="mt-8 grid grid-cols-1 gap-8 sm:grid-cols-4">
            {STEPS.map((step, index) => (
              <div key={step.title} className="text-center">
                <span className="mx-auto flex h-9 w-9 items-center justify-center rounded-full bg-primary-600 font-sans text-sm font-bold text-white">
                  {index + 1}
                </span>
                <h3 className="mt-3 font-sans text-sm font-bold text-ink-900">{step.title}</h3>
                <p className="mt-1 text-xs text-ink-700">{step.description}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 rounded-3xl bg-ink-900 p-8 text-white sm:p-10">
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
            <div>
              <h2 className="font-sans text-2xl font-bold">Join the Ranked Businesses</h2>
              <p className="mt-2 text-sm text-white/70">
                Latest ranking figures, including sample data.
              </p>
            </div>
            <div className="flex flex-col justify-center gap-4 sm:flex-row sm:gap-8">
              <div>
                <p className="font-sans text-3xl font-bold">{metadata?.totalRankedBusinesses ?? '—'}</p>
                <p className="text-sm text-white/60">Businesses ranked</p>
              </div>
              <div>
                <p className="font-sans text-lg font-bold">
                  {metadata ? new Date(metadata.lastCalculatedAt).toLocaleString() : '—'}
                </p>
                <p className="text-sm text-white/60">Last recalculated</p>
              </div>
            </div>
          </div>
        </div>

        <div className="relative mt-10 overflow-hidden rounded-3xl bg-primary-600 px-8 py-12 text-center shadow-lg sm:px-16">
          {/* Static color-block accents (see HomeHero for the moving version) —
              corner-anchored and hidden below sm so they never sit under the
              centered heading/copy on narrow screens. */}
          <div className="pointer-events-none absolute right-10 top-8 hidden h-14 w-14 rotate-12 rounded-2xl bg-info-100/40 sm:block" aria-hidden="true" />
          <div className="pointer-events-none absolute left-10 bottom-10 hidden h-12 w-12 rotate-45 rounded-lg bg-primary-100/25 sm:block" aria-hidden="true" />
          <div className="pointer-events-none absolute -bottom-8 -right-8 hidden h-28 w-28 rounded-full bg-primary-400/30 blur-sm sm:block" aria-hidden="true" />

          <div className="relative">
            <h2 className="font-sans text-2xl font-bold text-white sm:text-3xl">Ready to Get Started?</h2>
            <p className="mx-auto mt-3 max-w-xl text-sm text-primary-100">
              Submit your business details and photos. Listings are reviewed before publication.
            </p>
            <Link
              href="/businesses/create"
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-ink-50 px-6 py-3 font-sans text-sm font-bold text-primary-700 shadow-md transition hover:-translate-y-0.5 hover:shadow-lg"
            >
              List Your Business
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
