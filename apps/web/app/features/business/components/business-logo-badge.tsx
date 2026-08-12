import { Building2 } from 'lucide-react';

interface BusinessLogoBadgeProps {
  logoUrl?: string | null;
  name: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeClass: Record<NonNullable<BusinessLogoBadgeProps['size']>, string> = {
  sm: 'h-10 w-10 rounded-lg',
  md: 'h-14 w-14 rounded-xl',
  lg: 'h-16 w-16 rounded-2xl',
};

const iconSizeClass: Record<NonNullable<BusinessLogoBadgeProps['size']>, string> = {
  sm: 'h-5 w-5',
  md: 'h-6 w-6',
  lg: 'h-8 w-8',
};

// Shared square brand-mark rendering: real logo (imageType='BUSINESS_LOGO')
// when set, generic building icon otherwise. Reused anywhere a business's
// identity needs to show up in a card (directory grid, spotlight, top-ranked
// widgets, review cards) so the fallback and sizing stay consistent.
export function BusinessLogoBadge({ logoUrl, name, size = 'md', className = '' }: BusinessLogoBadgeProps) {
  return (
    <span
      className={`flex shrink-0 items-center justify-center overflow-hidden bg-primary-100 text-primary-600 ${sizeClass[size]} ${className}`}
    >
      {logoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element -- external Cloudinary URL, next/image remote patterns not configured
        <img src={logoUrl} alt={name} className="h-full w-full object-cover" />
      ) : (
        <Building2 className={iconSizeClass[size]} />
      )}
    </span>
  );
}
