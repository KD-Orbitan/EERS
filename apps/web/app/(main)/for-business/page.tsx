'use client';

import Link from 'next/link';
import { ArrowRight, Building2, LineChart, MessageSquareText, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useRankingMetadataQuery } from '@/features/ranking/queries/use-ranking-metadata.query';

const FEATURES = [
  {
    icon: Building2,
    title: 'Own Your Profile',
    description: 'Manage your logo, cover photo, gallery, and every location from one dashboard you control.',
  },
  {
    icon: MessageSquareText,
    title: 'Respond to Reviews',
    description: 'Reply publicly to any review on your listing, so customers see how you handle feedback.',
  },
  {
    icon: LineChart,
    title: 'Track Your Ranking',
    description: 'See your average rating, review count, and global rank update as new reviews come in.',
  },
  {
    icon: ShieldCheck,
    title: 'Fair, Moderated Scoring',
    description:
      'Every review is checked before it counts, and a Bayesian adjustment keeps a handful of reviews from swinging your score too far in either direction.',
  },
];

const STEPS = [
  { title: 'List your business', description: 'Submit your business details in a couple of minutes.' },
  { title: 'Get reviewed', description: 'Our moderation team checks the listing before it goes live.' },
  { title: 'Manage your profile', description: 'Add photos, locations, and reply to customer reviews.' },
  { title: 'Track your rank', description: 'Watch your rating and global rank update on an hourly cycle.' },
];

// "For Business Owners" marketing page, modeled after business.trustpilot.com's
// business-side landing page but scoped to features that actually exist here —
// same "no fabricated claim" principle as AboutPage and HomeHero: no pricing
// plans (no subscription concept in this app), no client logos or testimonials
// (no backing data/endpoint for either), no "Analytics" (already excluded from
// the main nav for the same reason). The "By the Numbers" block reuses the same
// real GET /rankings/metadata data as AboutPage instead of an invented figure.
export default function ForBusinessPage() {
  const { isAuthenticated } = useAuth();
  const { data: metadata } = useRankingMetadataQuery();

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="relative overflow-hidden px-4 pb-20 pt-20 text-center">
        <div className="pointer-events-none absolute -left-32 -top-24 h-96 w-96 rounded-full bg-primary-600/5 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -right-32 h-80 w-[32rem] rounded-full bg-info-100/40 blur-3xl" />

        <div className="relative mx-auto max-w-2xl">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-info-100 px-4 py-1 text-xs font-medium tracking-wide text-info-700">
            <ShieldCheck className="h-3.5 w-3.5" />
            FOR BUSINESS OWNERS
          </span>

          <h1 className="mt-4 font-serif text-4xl font-bold tracking-tight text-ink-900 sm:text-5xl">
            Grow Your Business&apos;s Reputation
          </h1>
          <p className="mt-4 text-lg text-ink-700">
            Claim your listing, respond to reviews, and track a ranking you can point to and explain &mdash; not a
            black box.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/businesses/create"
              className="inline-flex items-center gap-2 rounded-xl bg-primary-600 px-6 py-3 font-serif text-sm font-bold text-white shadow-md transition hover:-translate-y-0.5 hover:bg-primary-700 hover:shadow-lg"
            >
              List Your Business
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href={isAuthenticated ? '/businesses/my' : '/login'}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-6 py-3 font-serif text-sm font-bold text-ink-900 shadow-xs transition hover:bg-slate-50"
            >
              {isAuthenticated ? 'Manage Your Businesses' : 'Sign In to Manage'}
            </Link>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4 pb-20">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {FEATURES.map((feature) => (
            <div key={feature.title} className="rounded-2xl bg-white p-6 shadow-xs ring-1 ring-slate-200">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-600/10 text-primary-600">
                <feature.icon className="h-5 w-5" />
              </span>
              <h2 className="mt-4 font-serif text-lg font-bold text-ink-900">{feature.title}</h2>
              <p className="mt-1.5 text-sm text-ink-700">{feature.description}</p>
            </div>
          ))}
        </div>

        <div className="mt-6 rounded-3xl bg-white p-8 shadow-xs ring-1 ring-slate-200 sm:p-10">
          <h2 className="text-center font-serif text-2xl font-bold text-ink-900">How It Works</h2>
          <div className="mt-8 grid grid-cols-1 gap-8 sm:grid-cols-4">
            {STEPS.map((step, index) => (
              <div key={step.title} className="text-center">
                <span className="mx-auto flex h-9 w-9 items-center justify-center rounded-full bg-primary-600 font-serif text-sm font-bold text-white">
                  {index + 1}
                </span>
                <h3 className="mt-3 font-serif text-sm font-bold text-ink-900">{step.title}</h3>
                <p className="mt-1 text-xs text-ink-700">{step.description}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 rounded-3xl bg-ink-900 p-8 text-white sm:p-10">
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
            <div>
              <h2 className="font-serif text-2xl font-bold">Join the Ranked Businesses</h2>
              <p className="mt-2 text-sm text-white/70">
                Live figures from our own ranking snapshot &mdash; the same data that powers the leaderboard.
              </p>
            </div>
            <div className="flex flex-col justify-center gap-4 sm:flex-row sm:gap-8">
              <div>
                <p className="font-serif text-3xl font-bold">{metadata?.totalRankedBusinesses ?? '—'}</p>
                <p className="text-sm text-white/60">Businesses ranked</p>
              </div>
              <div>
                <p className="font-serif text-lg font-bold">
                  {metadata ? new Date(metadata.lastCalculatedAt).toLocaleString() : '—'}
                </p>
                <p className="text-sm text-white/60">Last recalculated</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-10 overflow-hidden rounded-3xl bg-primary-600 px-8 py-12 text-center shadow-lg sm:px-16">
          <h2 className="font-serif text-2xl font-bold text-white sm:text-3xl">Ready to Get Started?</h2>
          <p className="mx-auto mt-3 max-w-xl text-sm text-primary-100">
            Listing your business takes a couple of minutes. Our moderation team reviews every submission before it
            goes live.
          </p>
          <Link
            href="/businesses/create"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 font-serif text-sm font-bold text-primary-700 shadow-md transition hover:-translate-y-0.5 hover:shadow-lg"
          >
            List Your Business
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </main>
  );
}
