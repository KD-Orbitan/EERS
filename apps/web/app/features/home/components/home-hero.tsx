'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldCheck, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Mirrors Figma "Hero Section" (node 1:488): certification pill, headline,
// subcopy, glassmorphism search bar. The hero copy/ISO badge is generic site
// marketing text (not a claim about specific data), so it's kept as-is —
// unlike per-business figures elsewhere, this isn't fabricating a fact about
// any real entity.
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
      <div className="pointer-events-none absolute -left-32 -top-24 h-96 w-96 rounded-full bg-primary-600/5 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -right-32 h-80 w-[32rem] rounded-full bg-info-100/40 blur-3xl" />

      <div className="relative mx-auto flex max-w-2xl flex-col items-center gap-6 text-center">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-info-100 px-4 py-1 text-xs font-medium tracking-wide text-info-700">
          <ShieldCheck className="h-3.5 w-3.5" />
          ISO 27001 CERTIFIED ENTERPRISE DATA
        </span>

        <h1 className="font-sans text-4xl font-bold tracking-tight text-ink-900 sm:text-5xl">
          Find the Best in Enterprise
        </h1>

        <p className="max-w-xl text-lg text-ink-700">
          Global rankings for B2B intelligence, precision performance analysis, and industry-leading performance
          benchmarks.
        </p>

        <form
          onSubmit={onSubmit}
          className="flex w-full flex-col gap-2 rounded-2xl border border-white bg-white/60 p-2.5 shadow-lg backdrop-blur-md sm:flex-row"
        >
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by business, sector, or ISO rating..."
              className="w-full rounded-xl bg-transparent py-2.5 pl-9 pr-3 text-sm text-ink-900 outline-none placeholder:text-ink-700/60"
            />
          </div>
          <Button type="submit" className="shrink-0 shadow-md">
            Explore
          </Button>
        </form>
      </div>
    </div>
  );
}
