import type { PropsWithChildren } from 'react';

export default function AuthLayout({ children }: PropsWithChildren) {
  return (
    <div className="min-h-screen bg-linear-to-br from-primary-50 to-primary-100 flex items-center justify-center p-4">
      {children}
    </div>
  );
}
