'use client';

import { useState } from 'react';

export function useListFilter<T>(items: T[] | undefined, textFor: (item: T) => string, limit = 10) {
  const [search, setSearch] = useState('');
  const [requestedPage, setPage] = useState(1);
  const query = search.trim().toLocaleLowerCase();
  const filtered = (items ?? []).filter((item) => textFor(item).toLocaleLowerCase().includes(query));
  const page = Math.min(requestedPage, Math.max(1, Math.ceil(filtered.length / limit)));
  return {
    search, page, limit, total: filtered.length, setPage,
    items: filtered.slice((page - 1) * limit, page * limit),
    setSearch: (value: string) => { setSearch(value); setPage(1); },
  };
}
