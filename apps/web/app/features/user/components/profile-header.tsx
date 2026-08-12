'use client';

import Link from 'next/link';
import { Bookmark, Building2, Flag, KeyRound, LogOut, Mail, MessageSquareText, Pencil } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AvatarUpload } from '@/features/user/components/avatar-upload';
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
  reviewCount: number;
  businessCount: number;
  savedCount: number;
  onSignOut: () => void;
}

// Yelp-style profile sidebar: big centered avatar, name, a Friends/Reviews/
// Photos-shaped stat strip, then a stacked action list — using only the
// stats this app actually tracks (reviews written, businesses owned,
// bookmarks saved). Figma's level badge, verified checkmark, and location
// field still have no backing data in the API, so they stay dropped.
export function ProfileHeader({ profile, role, reviewCount, businessCount, savedCount, onSignOut }: ProfileHeaderProps) {
  return (
    <div className="rounded-3xl bg-white p-6 shadow-xs ring-1 ring-slate-200 lg:sticky lg:top-20">
      <div className="flex flex-col items-center text-center">
        <AvatarUpload avatarUrl={profile.avatarUrl} size="lg" />
        <h1 className="mt-4 font-serif text-2xl font-bold text-ink-900">{profile.name}</h1>
        <Badge variant={roleVariant[role]} className="mt-2">
          {roleLabel[role]}
        </Badge>
        <p className="mt-3 text-xs text-ink-500">
          Member since {new Date(profile.createdAt).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
        </p>
      </div>

      <div className="mt-6 grid grid-cols-3 divide-x divide-slate-100 border-y border-slate-100 py-4">
        <div className="text-center">
          <p className="font-serif text-xl font-bold text-ink-900">{reviewCount}</p>
          <p className="text-xs text-ink-500">Reviews</p>
        </div>
        <Link href="/businesses/my" className="text-center transition hover:text-primary-600">
          <p className="font-serif text-xl font-bold text-ink-900">{businessCount}</p>
          <p className="text-xs text-ink-500">Businesses</p>
        </Link>
        <Link href="/bookmarks" className="text-center transition hover:text-primary-600">
          <p className="font-serif text-xl font-bold text-ink-900">{savedCount}</p>
          <p className="text-xs text-ink-500">Saved</p>
        </Link>
      </div>

      <p className="mt-4 flex items-center justify-center gap-1.5 text-sm text-ink-700">
        <Mail className="h-3.5 w-3.5 shrink-0" />
        <span className="truncate">{profile.email}</span>
      </p>

      <div className="mt-6 flex flex-col gap-2">
        <Link href="/profile/edit" className="w-full">
          <Button variant="outline" className="w-full gap-1.5">
            <Pencil className="h-4 w-4" />
            Edit Profile
          </Button>
        </Link>
        <Link href="/profile/change-password" className="w-full">
          <Button variant="outline" className="w-full gap-1.5">
            <KeyRound className="h-4 w-4" />
            Change Password
          </Button>
        </Link>
        <Link href="/reviews/my" className="w-full">
          <Button variant="outline" className="w-full gap-1.5">
            <MessageSquareText className="h-4 w-4" />
            My Reviews
          </Button>
        </Link>
        <Link href="/businesses/my" className="w-full">
          <Button variant="outline" className="w-full gap-1.5">
            <Building2 className="h-4 w-4" />
            My Businesses
          </Button>
        </Link>
        <Link href="/bookmarks" className="w-full">
          <Button variant="outline" className="w-full gap-1.5">
            <Bookmark className="h-4 w-4" />
            My Bookmarks
          </Button>
        </Link>
        <Link href="/reports/my" className="w-full">
          <Button variant="outline" className="w-full gap-1.5">
            <Flag className="h-4 w-4" />
            My Reports
          </Button>
        </Link>
        <Button variant="outline" onClick={onSignOut} className="w-full gap-1.5 text-red-600 hover:bg-red-50">
          <LogOut className="h-4 w-4" />
          Sign Out
        </Button>
      </div>
    </div>
  );
}
