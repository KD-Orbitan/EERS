'use client';

import { useState } from 'react';
import { Star } from 'lucide-react';

interface StarRatingProps {
  value: number;
  onChange?: (value: number) => void;
  readOnly?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const sizeClass: Record<NonNullable<StarRatingProps['size']>, string> = {
  sm: 'h-4 w-4',
  md: 'h-5 w-5',
  lg: 'h-7 w-7',
};

export function StarRating({ value, onChange, readOnly = false, size = 'md' }: StarRatingProps) {
  const [hoverValue, setHoverValue] = useState<number | null>(null);
  const displayValue = hoverValue ?? value;

  return (
    <div className="inline-flex items-center gap-0.5" onMouseLeave={() => setHoverValue(null)}>
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={readOnly}
          onMouseEnter={() => !readOnly && setHoverValue(star)}
          onClick={() => !readOnly && onChange?.(star)}
          className={readOnly ? 'cursor-default' : 'cursor-pointer'}
          aria-label={`${star} star${star > 1 ? 's' : ''}`}
        >
          <Star
            className={`${sizeClass[size]} ${
              star <= displayValue ? 'fill-amber-400 text-amber-400' : 'fill-transparent text-ink-300'
            }`}
          />
        </button>
      ))}
      {!readOnly ? <span className="ml-1 text-sm font-medium text-ink-700">{value}/5</span> : null}
    </div>
  );
}
