import { redirect } from 'next/navigation';
import { createDbServerClient } from '@/lib/db/server';
import { getUserStems } from '@/app/actions/stems';
import { ProfileClient } from '@/components/ProfileClient';
import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'My Submissions | The Mixing Vault',
};

export default async function ProfilePage() {
  const db = await createDbServerClient();
  if (!db) redirect('/');

  const { data: { user } } = await db.auth.getUser();
  if (!user) redirect('/');

  const { data: profileData } = await db
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  const stems = await getUserStems(user.id);

  return (
    <ProfileClient
      profile={profileData}
      stems={stems}
    />
  );
}
