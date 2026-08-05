'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/use-auth';
import { useLogoutMutation } from '@/features/auth/mutations/use-logout.mutation';
import { TopBusinessesWidget } from '@/widgets/top-businesses-widget';

const cards = [
  { title: 'Businesses', href: '/businesses' },
  { title: 'Rankings', href: '/rankings' },
  { title: 'Profile', href: '/profile' },
];

export default function Home() {
  const router = useRouter();
  const { user, isLoading, isAuthenticated } = useAuth();
  const logoutMutation = useLogoutMutation();

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-700">
        <div className="text-lg font-medium">Loading...</div>
      </main>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-linear-to-br from-blue-50 via-indigo-50 to-sky-100 px-4">
        <div className="w-full max-w-2xl rounded-3xl bg-white/90 p-10 text-center shadow-xl ring-1 ring-slate-200 backdrop-blur">
          <span className="inline-flex rounded-full bg-blue-100 px-3 py-1 text-sm font-semibold text-blue-700">
            EERS
          </span>
          <h1 className="mt-5 text-4xl font-bold text-slate-900">Welcome to EERS</h1>
          <p className="mt-3 text-base text-slate-600">
            Access your dashboard, rankings, and business insights in one place.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/login"
              className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              Login
            </Link>
            <Link
              href="/register"
              className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-50"
            >
              Register
            </Link>
          </div>

          <div className="mt-8 text-left">
            <TopBusinessesWidget />
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6 flex flex-col gap-3 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Welcome back, {user.name}!</h1>
            <p className="mt-1 text-sm text-slate-600">Role: {user.role}</p>
          </div>
          <button
            type="button"
            onClick={async () => {
              try {
                await logoutMutation.mutateAsync();
                toast.success('Logged out successfully.');
                router.push('/login');
              } catch {
                toast.error('Unable to log out right now.');
              }
            }}
            disabled={logoutMutation.isPending}
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {logoutMutation.isPending ? 'Logging out...' : 'Logout'}
          </button>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {cards.map((card) => (
            <Link
              key={card.title}
              href={card.href}
              className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200 transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="text-lg font-semibold text-slate-900">{card.title}</div>
              <p className="mt-2 text-sm text-slate-600">Explore {card.title.toLowerCase()} dashboard</p>
            </Link>
          ))}
        </div>

        <div className="mt-6">
          <TopBusinessesWidget />
        </div>
      </div>
    </main>
  );
}
