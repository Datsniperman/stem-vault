import { notFound } from 'next/navigation';
import { getProfileByHandle, getPublicUserStemsByHandle } from '@/app/actions/stems';
import { UserProfileClient } from '@/components/UserProfileClient';
import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';

interface UserPageProps {
  params: Promise<{ handle: string }>;
}

export async function generateMetadata({ params }: UserPageProps): Promise<Metadata> {
  const { handle } = await params;
  const decodedHandle = decodeURIComponent(handle).trim().replace(/^@/, '');

  return {
    title: `@${decodedHandle} | User Profile - Stem Vault`,
    description: `Browse all worship multitrack sessions and stem uploads contributed by @${decodedHandle} on Stem Vault.`,
  };
}

export default async function UserProfilePage({ params }: UserPageProps) {
  const { handle } = await params;
  const decodedHandle = decodeURIComponent(handle).trim().replace(/^@/, '');

  const [profile, stems] = await Promise.all([
    getProfileByHandle(decodedHandle),
    getPublicUserStemsByHandle(decodedHandle),
  ]);

  if (!profile && stems.length === 0) {
    return notFound();
  }

  return (
    <UserProfileClient
      handle={decodedHandle}
      profile={profile}
      stems={stems}
    />
  );
}
