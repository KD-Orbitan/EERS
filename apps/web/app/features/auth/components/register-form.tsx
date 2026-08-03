'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { registerSchema, type RegisterInput } from '@/features/auth/schemas/auth.schema';
import { useRegisterMutation } from '@/features/auth/mutations/use-register.mutation';

export function RegisterForm() {
  const router = useRouter();
  const registerMutation = useRegisterMutation();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterInput) => {
    try {
      await registerMutation.mutateAsync(data);
      toast.success('Account created! Redirecting to login...');
      router.push('/login');
    } catch (error: unknown) {
      const message = (error as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message;
      toast.error(message ?? 'Unable to create account. Please try again.');
    }
  };

  return (
    <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl ring-1 ring-slate-200">
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-semibold text-slate-900">Register</h1>
        <p className="mt-2 text-sm text-slate-600">Create your new EERS account</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="name">
            Name
          </label>
          <input
            id="name"
            type="text"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            {...register('name')}
          />
          {errors.name?.message ? (
            <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
          ) : null}
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            type="email"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
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

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="confirmPassword">
            Confirm Password
          </label>
          <input
            id="confirmPassword"
            type="password"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            {...register('confirmPassword')}
          />
          {errors.confirmPassword?.message ? (
            <p className="mt-1 text-sm text-red-600">{errors.confirmPassword.message}</p>
          ) : null}
        </div>

        <button
          type="submit"
          disabled={isSubmitting || registerMutation.isPending}
          className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 font-medium text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isSubmitting || registerMutation.isPending ? 'Creating account...' : 'Register'}
        </button>
      </form>

      <p className="mt-5 text-center text-sm text-slate-600">
        Already have an account?{' '}
        <Link href="/login" className="font-semibold text-indigo-600 hover:text-indigo-700">
          Login here
        </Link>
      </p>
    </div>
  );
}
