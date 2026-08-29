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
import { PasswordInput } from '@/components/ui/password-input';

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
    <div className="w-full max-w-md rounded-3xl bg-ink-50 p-8 shadow-xl">
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-medium text-ink-900">Login</h1>
        <p className="mt-2 text-sm text-ink-600">Sign in to continue to EERS</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-ink-700" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            type="email"
            className="w-full rounded-t-xl rounded-b-none border-0 border-b-2 border-ink-300 bg-ink-100 px-3 py-2 outline-none transition-colors duration-200 focus:border-primary-600"
            {...register('email')}
          />
          {errors.email?.message ? (
            <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
          ) : null}
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-ink-700" htmlFor="password">
            Password
          </label>
          <PasswordInput id="password" {...register('password')} />
          {errors.password?.message ? (
            <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
          ) : null}
        </div>

        <button
          type="submit"
          disabled={isSubmitting || loginMutation.isPending}
          className="ease-md w-full rounded-full bg-primary-600 px-4 py-2.5 font-medium text-white transition-all duration-300 hover:bg-primary-700 hover:shadow-md active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSubmitting || loginMutation.isPending ? 'Signing in...' : 'Login'}
        </button>
      </form>

      <p className="mt-5 text-center text-sm text-ink-600">
        Don&apos;t have an account?{' '}
        <Link href="/register" className="font-semibold text-primary-600 hover:text-primary-700">
          Create one
        </Link>
      </p>
    </div>
  );
}
