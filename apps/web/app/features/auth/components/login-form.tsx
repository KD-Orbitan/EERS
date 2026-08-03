'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { loginSchema, type LoginInput } from '@/features/auth/schemas/auth.schema';
import { useLoginMutation } from '@/features/auth/mutations/use-login.mutation';
import { QUERY_KEYS } from '@/lib/query-keys';

export function LoginForm() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const loginMutation = useLoginMutation();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginInput) => {
    try {
      await loginMutation.mutateAsync(data);
      await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.AUTH_ME });
      toast.success('Logged in successfully!');
      router.push('/');
    } catch (error: unknown) {
      const message = (error as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message;
      toast.error(message ?? 'Unable to log in. Please try again.');
    }
  };

  return (
    <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl ring-1 ring-slate-200">
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-semibold text-slate-900">Login</h1>
        <p className="mt-2 text-sm text-slate-600">Sign in to continue to EERS</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            type="email"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none ring-0 transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            {...register('email')}
          />
          {errors.email?.message ? (
            <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
          ) : null}
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="password">
            Password
          </label>
          <input
            id="password"
            type="password"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            {...register('password')}
          />
          {errors.password?.message ? (
            <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
          ) : null}
        </div>

        <button
          type="submit"
          disabled={isSubmitting || loginMutation.isPending}
          className="w-full rounded-lg bg-blue-600 px-4 py-2.5 font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isSubmitting || loginMutation.isPending ? 'Signing in...' : 'Login'}
        </button>
      </form>

      <p className="mt-5 text-center text-sm text-slate-600">
        Don&apos;t have an account?{' '}
        <Link href="/register" className="font-semibold text-blue-600 hover:text-blue-700">
          Create one
        </Link>
      </p>
    </div>
  );
}
