import * as React from 'react';

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'default' | 'outline' | 'surface';
};

export function Button({
  className = '',
  variant = 'default',
  ...props
}: ButtonProps) {
  const variantClassName =
    variant === 'outline'
      ? 'border border-primary-600 bg-transparent text-primary-600 hover:bg-primary-600/5'
      : variant === 'surface'
        ? 'bg-ink-50 text-primary-600 hover:bg-primary-50 hover:shadow-md'
        : 'bg-primary-600 text-white hover:bg-primary-700 hover:shadow-md';

  return (
    <button
      className={`ease-md inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-medium transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-2 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 ${variantClassName} ${className}`}
      {...props}
    />
  );
}
