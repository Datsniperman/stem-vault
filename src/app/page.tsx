import { createDbServerClient, createDbAdminClient } from '@/lib/db/server';
import { StemFeed } from '@/components/StemFeed';
import { Stem } from '@/types';

export const dynamic = 'force-dynamic';

export default async function Home() {
  let stems: Stem[] = [];

  try {
    const dbServer = await createDbServerClient();
    const dbAdmin = await createDbAdminClient();
    const db = dbAdmin || dbServer;

    if (db) {
      const { data, error } = await db
        .from('stems')
        .select('*')
        .eq('status', 'published')
        .order('created_at', { ascending: false });

      if (data && !error) {
        stems = data as Stem[];

        const stemIds = stems.map(s => s.id);
        if (stemIds.length > 0) {
          const { data: ratings } = await db
            .from('stem_ratings')
            .select('stem_id, rating')
            .in('stem_id', stemIds);

          const { data: comments } = await db
            .from('stem_comments')
            .select('stem_id')
            .in('stem_id', stemIds);

          const ratingMap: Record<string, { sum: number; count: number }> = {};
          (ratings as any[])?.forEach((r: any) => {
            if (!ratingMap[r.stem_id]) ratingMap[r.stem_id] = { sum: 0, count: 0 };
            ratingMap[r.stem_id].sum += r.rating;
            ratingMap[r.stem_id].count += 1;
          });

          const commentMap: Record<string, number> = {};
          (comments as any[])?.forEach((c: any) => {
            commentMap[c.stem_id] = (commentMap[c.stem_id] || 0) + 1;
          });

          stems = stems.map(s => {
            const r = ratingMap[s.id];
            const avg = r ? parseFloat((r.sum / r.count).toFixed(1)) : 0;
            return {
              ...s,
              avg_rating: avg,
              rating_count: r ? r.count : 0,
              comment_count: commentMap[s.id] || 0,
            };
          });
        }
      } else if (error) {
        console.error('[page] Database fetch error:', error.message);
      }
    }
  } catch (err) {
    console.error('[page] Database fetch failed:', err);
  }

  return <StemFeed initialStems={stems} />;
}
