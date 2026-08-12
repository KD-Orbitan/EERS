'use client';

import Link from 'next/link';
import { ArrowRight, Clock, Eye, Scale, ShieldCheck } from 'lucide-react';
import { useRankingMetadataQuery } from '@/features/ranking/queries/use-ranking-metadata.query';

const PRINCIPLES = [
  {
    icon: ShieldCheck,
    title: 'Moderated, Not Open',
    description: 'Every review is checked before it counts. Pending and rejected reviews never affect a score.',
  },
  {
    icon: Scale,
    title: 'Fair to Small Businesses',
    description:
      'A Bayesian adjustment keeps a handful of reviews from swinging a score too far in either direction, so newer businesses aren’t unfairly boosted or penalized.',
  },
  {
    icon: Clock,
    title: 'Never Computed on the Fly',
    description: 'Rankings are recalculated on a fixed hourly cycle from precomputed snapshots — never guessed live.',
  },
  {
    icon: Eye,
    title: 'Nothing Erased',
    description: 'Records are soft-deleted, not destroyed, so every decision stays auditable.',
  },
];

// New "About Us" page, linked from the new SiteFooter. Content is either
// generic mission copy (same category as HomeHero's ISO badge — marketing
// text, not a claim about specific data) or a direct restatement of this
// app's real, already-implemented rules (hourly recalculation, Bayesian
// adjustment, review moderation, soft-delete) — same principle
// RankingMethodology already applies. No fabricated founding story, team
// bios, or press mentions.
export default function AboutPage() {
  const { data: metadata } = useRankingMetadataQuery();

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="relative overflow-hidden px-4 pb-20 pt-20 text-center">
        <div className="pointer-events-none absolute -left-32 -top-24 h-96 w-96 rounded-full bg-primary-600/5 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -right-32 h-80 w-[32rem] rounded-full bg-info-100/40 blur-3xl" />

        <div className="relative mx-auto max-w-2xl">
          <h1 className="font-serif text-4xl font-bold text-ink-900 sm:text-5xl">About EERS</h1>
          <p className="mt-4 text-lg text-ink-700">
            EERS &mdash; the Enterprise Evaluation &amp; Ranking System &mdash; helps people find businesses worth
            trusting, and gives businesses a ranking they can point to and explain, not a black box.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4 pb-20">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {PRINCIPLES.map((principle) => (
            <div key={principle.title} className="rounded-2xl bg-white p-6 shadow-xs ring-1 ring-slate-200">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-600/10 text-primary-600">
                <principle.icon className="h-5 w-5" />
              </span>
              <h2 className="mt-4 font-serif text-lg font-bold text-ink-900">{principle.title}</h2>
              <p className="mt-1.5 text-sm text-ink-700">{principle.description}</p>
            </div>
          ))}
        </div>

        <div className="mt-6 rounded-3xl bg-ink-900 p-8 text-white sm:p-10">
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
            <div>
              <h2 className="font-serif text-2xl font-bold">By the Numbers</h2>
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

        <div className="mt-10 flex flex-wrap items-center justify-center gap-4 text-center">
          <Link
            href="/businesses"
            className="inline-flex items-center gap-2 rounded-xl bg-primary-600 px-6 py-3 font-serif text-sm font-bold text-white shadow-md transition hover:bg-primary-700"
          >
            Explore the Directory
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/rankings"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-6 py-3 font-serif text-sm font-bold text-ink-900 shadow-xs transition hover:bg-slate-50"
          >
            View the Leaderboard
          </Link>
        </div>
      </div>
    </main>
  );
}
