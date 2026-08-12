'use client';

import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { getAccessToken } from '@/lib/api-client';
import { QUERY_KEYS } from '@/lib/query-keys';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000/api/v1';
const RECONNECT_DELAY_MS = 5_000;

// Native EventSource can't send an Authorization header, and the SSE endpoint
// (see docs/API.md Chapter 10) only accepts Bearer auth, so this reads the
// stream manually via fetch + ReadableStream instead of EventSource.
export function useNotificationStream(enabled: boolean) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!enabled) return;

    let stopped = false;
    const controller = new AbortController();

    async function readStream() {
      const token = getAccessToken();
      if (!token) return;

      const response = await fetch(`${API_BASE_URL}/notifications/stream`, {
        headers: { Authorization: `Bearer ${token}` },
        signal: controller.signal,
      });

      if (!response.ok || !response.body) return;

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (!stopped) {
        const { value, done } = await reader.read();
        if (done) return;

        buffer += decoder.decode(value, { stream: true });
        const events = buffer.split('\n\n');
        buffer = events.pop() ?? '';

        for (const rawEvent of events) {
          const dataLine = rawEvent.split('\n').find((line) => line.startsWith('data:'));
          if (!dataLine) continue;

          try {
            const payload = JSON.parse(dataLine.slice(5).trim()) as { event?: string };
            if (payload.event === 'notification') {
              queryClient.invalidateQueries({ queryKey: QUERY_KEYS.UNREAD_COUNT });
              queryClient.invalidateQueries({ queryKey: QUERY_KEYS.NOTIFICATIONS });
            }
          } catch {
            // malformed chunk — skip it, the connection itself is still fine
          }
        }
      }
    }

    async function connectWithRetry() {
      while (!stopped) {
        try {
          await readStream();
        } catch {
          // network error or aborted connection — fall through to retry
        }

        if (stopped) return;
        await new Promise((resolve) => setTimeout(resolve, RECONNECT_DELAY_MS));
      }
    }

    connectWithRetry();

    return () => {
      stopped = true;
      controller.abort();
    };
  }, [enabled, queryClient]);
}
