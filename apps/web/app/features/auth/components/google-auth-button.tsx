'use client';

import Script from 'next/script';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { useGoogleAuthMutation } from '@/features/auth/mutations/use-google-auth.mutation';

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (options: { client_id: string; callback: (response: { credential: string }) => void }) => void;
          renderButton: (element: HTMLElement, options: { theme: string; size: string; text: string; shape: string }) => void;
        };
      };
    };
  }
}

export function GoogleAuthButton({ disabled = false }: { disabled?: boolean }) {
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID?.trim();
  const container = useRef<HTMLDivElement>(null);
  const inFlight = useRef(false);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const { mutateAsync, isPending } = useGoogleAuthMutation();
  const router = useRouter();

  useEffect(() => {
    const google = window.google;
    const element = container.current;
    if (!ready || !clientId || !google || !element) return;

    let active = true;
    google.accounts.id.initialize({
      client_id: clientId,
      callback: async ({ credential }) => {
        if (!active || disabled || inFlight.current) return;
        inFlight.current = true;
        try {
          await mutateAsync(credential);
          toast.success('Signed in with Google successfully!');
          router.push('/');
        } catch (error: unknown) {
          const message = (error as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message;
          toast.error(message ?? 'Unable to sign in with Google. Please try again.');
        } finally {
          inFlight.current = false;
        }
      },
    });
    google.accounts.id.renderButton(element, {
      theme: 'outline', size: 'large', text: 'continue_with', shape: 'pill',
    });
    return () => { active = false; element.replaceChildren(); };
  }, [ready, clientId, disabled, mutateAsync, router]);

  if (!clientId) return null;

  return (
    <div className="mt-5">
      <Script src="https://accounts.google.com/gsi/client" onReady={() => setReady(true)} onError={() => setFailed(true)} />
      <div className="mb-4 flex items-center gap-3 text-xs text-ink-500">
        <span className="h-px flex-1 bg-ink-200" />or<span className="h-px flex-1 bg-ink-200" />
      </div>
      {failed ? <p role="alert" className="text-center text-sm text-red-600">Google sign-in could not load. Please reload the page to try again.</p> : (
        <>
          {!ready && <p role="status" className="text-center text-sm text-ink-600">Loading Google sign-in...</p>}
          <div inert={disabled || isPending} aria-busy={isPending} className={`flex justify-center ${disabled || isPending ? 'opacity-50' : ''}`} ref={container} />
          {isPending && <p role="status" className="mt-2 text-center text-sm text-ink-600">Signing in...</p>}
        </>
      )}
    </div>
  );
}
