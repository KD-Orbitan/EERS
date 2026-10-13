'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Star, Search } from 'lucide-react';

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
          <Star className="h-3.5 w-3.5" />
          Business Reviews & Rankings
        </span>

        <h1 className="text-balance text-4xl font-medium leading-[1.2] tracking-tight text-ink-900 sm:text-5xl md:text-6xl">
          Explore Businesses
        </h1>

        <p className="max-w-xl text-lg leading-relaxed text-ink-600">
          Explore businesses, read reviews, and compare rankings on EERS.
        </p>

        <form
          onSubmit={onSubmit}
          className="ease-md flex w-full flex-col gap-3 rounded-3xl bg-primary-50 p-3 shadow-sm transition-shadow duration-300 focus-within:shadow-md sm:flex-row sm:items-center sm:gap-2 sm:rounded-full sm:p-2"
        >
          <div className="relative w-full min-w-0 sm:flex-1">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search businesses..."
              className="h-11 w-full rounded-full bg-transparent pl-11 pr-3 text-sm text-ink-900 outline-none placeholder:text-ink-400"
            />
          </div>
          <button
            type="submit"
            className="ease-md inline-flex h-11 w-auto shrink-0 self-end items-center justify-center rounded-full bg-primary-600 px-6 text-sm font-medium text-white transition-all duration-300 hover:bg-primary-700 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-2 active:scale-95 sm:self-auto"
          >
            Explore
          </button>
        </form>
      </div>
    </div>
  );
}
