'use client';

import { useId, useLayoutEffect, useRef, useState } from 'react';
import { descriptionHtml, descriptionExcerpt } from '@/lib/business-description';

export function BusinessDescription({ value }: { value: string | null }) {
  const [expanded, setExpanded] = useState(false);
  const [overflowing, setOverflowing] = useState(false);
  const content = useRef<HTMLDivElement>(null);
  const id = useId();
  const html = descriptionHtml(value ?? '');
  useLayoutEffect(() => {
    const element = content.current;
    if (!element) return;
    const measure = () => setOverflowing(element.scrollHeight > 288);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, [html]);
  if (!value || !descriptionExcerpt(value).replace(/&nbsp;/g, '').trim()) return null;
  return <section className="rounded-2xl bg-ink-50 p-6 shadow-xs ring-1 ring-ink-200" aria-labelledby={`${id}-title`}>
    <h2 id={`${id}-title`} className="mb-4 text-xl font-semibold text-ink-900">About this business</h2>
    <div id={id} onFocusCapture={() => { if (overflowing) setExpanded(true); }} className={!expanded && overflowing ? 'max-h-72 overflow-hidden' : undefined}>
      <div ref={content} className="business-rich-text text-sm text-ink-700" dangerouslySetInnerHTML={{ __html: html }} />
    </div>
    {overflowing ? <button type="button" aria-expanded={expanded} aria-controls={id} onClick={() => setExpanded(!expanded)} className="mt-4 font-medium text-primary-600 hover:underline">{expanded ? 'Show less' : 'Read more'}</button> : null}
  </section>;
}
