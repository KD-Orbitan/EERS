'use client';

import Link from 'next/link';
import { CalendarDays, KeyRound, LogOut, Mail, Pencil, UserCircle2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { UserProfile } from '@/features/user/types/user.type';

type Role = 'USER' | 'BUSINESS_OWNER' | 'ADMIN';

const roleLabel: Record<Role, string> = {
  USER: 'Reviewer',
  BUSINESS_OWNER: 'Business Owner',
  ADMIN: 'Administrator',
};

const roleVariant: Record<Role, 'neutral' | 'brand' | 'info'> = {
  USER: 'neutral',
  BUSINESS_OWNER: 'brand',
  ADMIN: 'info',
};

interface ProfileHeaderProps {
  profile: UserProfile;
  role: Role;
  onSignOut: () => void;
}

// Header card adapted from Figma "User Profile" (avatar + name + actions row).
// The mockup includes a level badge, verified checkmark, and location field
// with no backing data in the API, so those are dropped rather than faked.
export function ProfileHeader({ profile, role, onSignOut }: ProfileHeaderProps) {
  return (
    <div className="rounded-3xl bg-white p-6 shadow-xs ring-1 ring-slate-200 sm:p-8">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-primary-100">
            <UserCircle2 className="h-11 w-11 text-primary-600" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-serif text-2xl font-bold text-ink-900">{profile.name}</h1>
              <Badge variant={roleVariant[role]}>{roleLabel[role]}</Badge>
            </div>
            <p className="mt-1 flex items-center gap-1.5 text-sm text-ink-700">
              <Mail className="h-3.5 w-3.5" />
              {profile.email}
            </p>
            <p className="mt-1 flex items-center gap-1.5 text-xs text-ink-500">
              <CalendarDays className="h-3.5 w-3.5" />
              Joined {new Date(profile.createdAt).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link href="/profile/edit">
            <Button variant="outline" className="gap-1.5">
              <Pencil className="h-4 w-4" />
              Edit Profile
            </Button>
          </Link>
          <Link href="/profile/change-password">
            <Button variant="outline" className="gap-1.5">
              <KeyRound className="h-4 w-4" />
              Change Password
            </Button>
          </Link>
          <Button variant="outline" onClick={onSignOut} className="gap-1.5 text-red-600 hover:bg-red-50">
            <LogOut className="h-4 w-4" />
            Sign Out
          </Button>
        </div>
      </div>
    </div>
  );
}
