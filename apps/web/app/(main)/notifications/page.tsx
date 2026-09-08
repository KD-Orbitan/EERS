import { NotificationsPanel } from '@/features/notification/components/notifications-panel';

export default function NotificationsPage() {
  return (
    <main className="min-h-screen bg-ink-50 px-4 py-8">
      <div className="mx-auto max-w-3xl">
        <NotificationsPanel />
      </div>
    </main>
  );
}
