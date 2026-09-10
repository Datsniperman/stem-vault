import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getUserStems } from '@/app/actions/stems';
import { ProfileClient } from '@/components/ProfileClient';
import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'My Submissions | Stem Vault',
};

export default async function ProfilePage() {
  const supabase = await createSupabaseServerClient();
  if (!supabase) redirect('/');

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/');

  const { data: profileData } = await supabase
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
