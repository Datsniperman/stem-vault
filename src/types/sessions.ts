export type SessionStorageProvider = 'hls' | 'cloudflare_stream' | 'mux' | 'r2';
export type RequiredTier = 'PLUS' | 'PREMIUM';

export interface RecordedSession {
  id: string;
  title: string;
  description: string | null;
  thumbnail_url: string | null;
  video_asset_id: string;
  video_url: string | null;
  storage_provider: SessionStorageProvider;
  required_tier: RequiredTier;
  duration_seconds: number | null;
  presenter: string | null;
  tags: string[];
  published: boolean;
  view_count: number;
  created_at: string;
  updated_at: string;
}

export interface RecordedSessionListItem extends Omit<RecordedSession, 'video_asset_id' | 'video_url'> {
  isLocked: boolean;
  video_asset_id?: string;
  video_url?: string;
}
