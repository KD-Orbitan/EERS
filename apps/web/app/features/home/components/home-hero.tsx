'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldCheck, Search } from 'lucide-react';

// Mirrors Figma "Hero Section" (node 1:488): certification pill, headline,
// subcopy, glassmorphism search bar. The hero copy/ISO badge is generic site
// marketing text (not a claim about specific data), so it's kept as-is —
// unlike per-business figures elsewhere, this isn't fabricating a fact about
// any real entity.
//
// Material You (site-wide, see docs/promptFE6.md): the layered blur shapes
// are MD3's signature "organic atmospheric background" — primary and
// tertiary tones at low opacity, heavily blurred, positioned off-canvas.
export function HomeHero() {
  const router = useRouter();
  const [search, setSearch] = useState('');

  const onSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const params = search.trim() ? `?search=${encodeURIComponent(search.trim())}` : '';
    router.push(`/businesses${params}`);
  };

  return (
    <div className="relative overflow-hidden px-4 pb-24 pt-20 sm:pb-28 sm:pt-28">
      {/* Hidden below lg: sized/offset so they clear the centered max-w-2xl
          text column with margin to spare from lg up, instead of waiting
          for xl just to be safe. */}
      <div className="animate-float-c pointer-events-none absolute -right-16 -top-20 hidden h-56 w-56 rounded-full bg-primary-100/70 blur-2xl lg:block" aria-hidden="true" />
      <div className="animate-float-a pointer-events-none absolute -left-16 top-10 hidden h-36 w-36 rounded-[2.5rem] bg-primary-600/60 lg:block" aria-hidden="true" />
      <div className="animate-float-b pointer-events-none absolute left-8 top-24 hidden h-28 w-28 rounded-full bg-info-100/55 lg:block" aria-hidden="true" />

      <div className="relative mx-auto flex max-w-2xl flex-col items-center gap-6 text-center">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-100 px-4 py-1.5 text-xs font-medium tracking-wide text-primary-600">
          <ShieldCheck className="h-3.5 w-3.5" />
          ISO 27001 CERTIFIED ENTERPRISE DATA
        </span>

        <h1 className="text-4xl font-medium leading-[1.2] tracking-tight text-ink-900 sm:text-5xl md:text-6xl">
          Find the Best in Enterprise
        </h1>

        <p className="max-w-xl text-lg leading-relaxed text-ink-600">
          Global rankings for B2B intelligence, precision performance analysis, and industry-leading performance
          benchmarks.
        </p>

        <form
          onSubmit={onSubmit}
          className="ease-md flex w-full flex-col gap-2 rounded-full bg-primary-50 p-2 shadow-sm transition-shadow duration-300 focus-within:shadow-md sm:flex-row sm:items-center"
        >
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by business, sector, or ISO rating..."
              className="h-11 w-full rounded-full bg-transparent pl-11 pr-3 text-sm text-ink-900 outline-none placeholder:text-ink-400"
            />
          </div>
          <button
            type="submit"
            className="ease-md inline-flex h-11 shrink-0 items-center justify-center rounded-full bg-primary-600 px-6 text-sm font-medium text-white transition-all duration-300 hover:bg-primary-700 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-2 active:scale-95"
          >
            Explore
          </button>
        </form>
      </div>
    </div>
  );
}
