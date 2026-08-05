import * as React from 'react';

type BadgeProps = React.HTMLAttributes<HTMLSpanElement> & {
  variant?: 'neutral' | 'success' | 'warning' | 'danger' | 'brand' | 'info';
};

const variantClassNames: Record<NonNullable<BadgeProps['variant']>, string> = {
  neutral: 'bg-slate-100 text-slate-700',
  success: 'bg-emerald-100 text-emerald-700',
  warning: 'bg-amber-100 text-amber-700',
  danger: 'bg-red-100 text-red-700',
  brand: 'bg-primary-200 text-primary-600', // Figma node 1:98/1:99, category/rank tag
  info: 'bg-info-100 text-info-700', // Figma node 1:1523, "VERIFIED" trust badge
};

export function Badge({ className = '', variant = 'neutral', ...props }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${variantClassNames[variant]} ${className}`}
      {...props}
    />
  );
}
