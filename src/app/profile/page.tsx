// src/app/profile/page.tsx
import { redirect } from 'next/navigation';

/**
 * Redirect from /profile to /dashboard/settings
 */
export default function ProfilePage() {
  redirect('/dashboard/settings');
}