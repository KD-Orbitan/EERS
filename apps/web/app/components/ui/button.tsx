import * as React from 'react';

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'default' | 'outline';
};

export function Button({
  className = '',
  variant = 'default',
  ...props
}: ButtonProps) {
  const variantClassName =
    variant === 'outline'
      ? 'border border-slate-200 bg-white text-slate-900 hover:bg-slate-50'
      : 'bg-slate-900 text-white hover:bg-slate-800';

  return (
    <button
      className={`inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${variantClassName} ${className}`}
      {...props}
    />
  );
}
