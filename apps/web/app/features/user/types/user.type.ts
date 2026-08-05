export interface UserProfile {
  userId: number;
  name: string;
  email: string;
  avatarUrl: string | null;
  status: 'active' | 'inactive' | 'banned';
  createdAt: string;
}
