import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { createDbServerClient, createDbAdminClient } from '@/lib/db/server';
import { StemDetailClient } from '@/components/StemDetailClient';
import { Stem, StemComment, StemMix } from '@/types';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const dbAdmin = await createDbAdminClient();
  const dbServer = await createDbServerClient();
  const db = dbAdmin || dbServer;

  if (!db) return { title: 'The Mixing Vault' };

  const { data: stem } = await db
    .from('stems')
    .select('title, artist, description')
    .eq('id', id)
    .single();

  if (!stem) return { title: 'The Mixing Vault' };

  const title = `${stem.title} — ${stem.artist} | The Mixing Vault`;
  const description = stem.description
    ? stem.description.slice(0, 160)
    : `Download the multitrack session for "${stem.title}" by ${stem.artist} from The Mixing Vault — Tyler Kerpsack All Access.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'music.song',
      siteName: 'The Mixing Vault',
    },
    twitter: {
      card: 'summary',
      title,
      description,
    },
  };
}

export default async function StemDetailPage({ params }: PageProps) {
  const { id } = await params;
  const dbServer = await createDbServerClient();
  const dbAdmin = await createDbAdminClient();
  const db = dbAdmin || dbServer;

  if (!db) {
    return notFound();
  }

  // 1. Fetch Stem details
  const { data: stemData, error: stemErr } = await db
    .from('stems')
    .select('*')
    .eq('id', id)
    .single();

  if (stemErr || !stemData) {
    return notFound();
  }

  const stem = stemData as Stem;

  // 2. Fetch User Profile if logged in
  let currentUser = null;
  if (dbServer) {
    const { data: { user } } = await dbServer.auth.getUser();
    if (user) {
      const { data: profileData } = await db
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      if (profileData) currentUser = profileData;
    }
  }

  // 4. Fetch Comments
  let comments: StemComment[] = [];
  const { data: commentData } = await db
    .from('stem_comments')
    .select('*')
    .eq('stem_id', id)
    .order('created_at', { ascending: false });

  if (commentData) comments = commentData as StemComment[];

  // 5. Fetch Community Mixes
  let mixes: StemMix[] = [];
  const { data: mixData } = await db
    .from('stem_mixes')
    .select('*')
    .eq('stem_id', id)
    .order('created_at', { ascending: false });

  if (mixData) {
    mixes = mixData as StemMix[];
    // Check if user has liked each mix
    if (currentUser) {
      const { data: userLikes } = await db
        .from('mix_likes')
        .select('mix_id')
        .eq('user_id', currentUser.id);

      if (userLikes) {
        const likedMixIds = new Set((userLikes as any[]).map((l: any) => l.mix_id));
        mixes = mixes.map(m => ({
          ...m,
          user_has_liked: likedMixIds.has(m.id)
        }));
      }
    }
  }

  // 6. Fetch Quality Ratings
  let avgRating = 0;
  let userRating = 0;
  let ratingCount = 0;

  const { data: ratingsData } = await db
    .from('stem_ratings')
    .select('rating, user_id')
    .eq('stem_id', id);

  if (ratingsData && (ratingsData as any[]).length > 0) {
    const list = ratingsData as any[];
    ratingCount = list.length;
    const sum = list.reduce((acc: number, curr: any) => acc + (curr.rating || 0), 0);
    avgRating = parseFloat((sum / ratingCount).toFixed(1));

    if (currentUser) {
      const userRatingEntry = list.find((r: any) => r.user_id === currentUser?.id);
      if (userRatingEntry) userRating = userRatingEntry.rating;
    }
  }

  return (
    <StemDetailClient
      stem={stem}
      profile={currentUser}
      initialComments={comments}
      initialMixes={mixes}
      initialAvgRating={avgRating}
      initialUserRating={userRating}
      initialRatingCount={ratingCount}
    />
  );
}
