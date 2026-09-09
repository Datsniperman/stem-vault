import { notFound } from 'next/navigation';
import { createSupabaseServerClient, createSupabaseAdminClient } from '@/lib/supabase/server';
import { StemDetailClient } from '@/components/StemDetailClient';
import { Stem, StemComment, StemMix } from '@/types';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function StemDetailPage({ params }: PageProps) {
  const { id } = await params;
  const supabaseServer = await createSupabaseServerClient();
  const supabaseAdmin = await createSupabaseAdminClient();
  const supabase = supabaseAdmin || supabaseServer;

  if (!supabase) {
    return notFound();
  }

  // 1. Fetch Stem details
  const { data: stemData, error: stemErr } = await supabase
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
  if (supabaseServer) {
    const { data: { user } } = await supabaseServer.auth.getUser();
    if (user) {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      if (profileData) currentUser = profileData;
    }
  }

  // 3. Fetch iTunes Artwork if needed
  let artworkUrl: string | null = stem.cover_url || null;
  if (!artworkUrl) {
    try {
      const query = encodeURIComponent(`${stem.artist} ${stem.title}`);
      const res = await fetch(`https://itunes.apple.com/search?term=${query}&entity=song&limit=1`, { next: { revalidate: 86400 } });
      if (res.ok) {
        const json = await res.json();
        if (json.results && json.results.length > 0) {
          artworkUrl = json.results[0].artworkUrl100.replace('100x100bb', '600x600bb');
        }
      }
    } catch {
      // Fallback null
    }
  }

  // 4. Fetch Comments
  let comments: StemComment[] = [];
  const { data: commentData } = await supabase
    .from('stem_comments')
    .select('*')
    .eq('stem_id', id)
    .order('created_at', { ascending: false });

  if (commentData) comments = commentData as StemComment[];

  // 5. Fetch Community Mixes
  let mixes: StemMix[] = [];
  const { data: mixData } = await supabase
    .from('stem_mixes')
    .select('*')
    .eq('stem_id', id)
    .order('created_at', { ascending: false });

  if (mixData) {
    mixes = mixData as StemMix[];
    // Check if user has liked each mix
    if (currentUser) {
      const { data: userLikes } = await supabase
        .from('mix_likes')
        .select('mix_id')
        .eq('user_id', currentUser.id);

      if (userLikes) {
        const likedMixIds = new Set(userLikes.map(l => l.mix_id));
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

  const { data: ratingsData } = await supabase
    .from('stem_ratings')
    .select('rating, user_id')
    .eq('stem_id', id);

  if (ratingsData && ratingsData.length > 0) {
    ratingCount = ratingsData.length;
    const sum = ratingsData.reduce((acc, curr) => acc + curr.rating, 0);
    avgRating = parseFloat((sum / ratingCount).toFixed(1));

    if (currentUser) {
      const userRatingEntry = ratingsData.find(r => r.user_id === currentUser?.id);
      if (userRatingEntry) userRating = userRatingEntry.rating;
    }
  }

  return (
    <StemDetailClient
      stem={stem}
      artworkUrl={artworkUrl}
      profile={currentUser}
      initialComments={comments}
      initialMixes={mixes}
      initialAvgRating={avgRating}
      initialUserRating={userRating}
      initialRatingCount={ratingCount}
    />
  );
}
