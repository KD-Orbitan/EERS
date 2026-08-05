'use client';

import { StarRating } from '@/features/review/components/star-rating';

interface CriteriaRatingInputProps {
  criterionName: string;
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
}

export function CriteriaRatingInput({ criterionName, value, onChange, disabled }: CriteriaRatingInputProps) {
  return (
    <div className="flex items-center justify-between gap-4 py-2">
      <span className="text-sm font-medium text-ink-700">{criterionName}</span>
      <StarRating value={value} onChange={disabled ? undefined : onChange} readOnly={disabled} size="sm" />
    </div>
  );
}
