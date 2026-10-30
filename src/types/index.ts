export type UserRole = 'user' | 'verified' | 'admin';
export type StemStatus = 'pending' | 'published' | 'flagged';
export type HostPlatform = 'Google Drive' | 'Dropbox' | 'OneDrive' | 'Box' | 'Other';
export type StemFormat =
  | 'WAV (48kHz/24-bit)'
  | 'WAV (44.1kHz/16-bit)'
  | 'FLAC'
  | 'Multitrack Zip';

export interface Profile {
  id: string;
  email: string | null;
  display_name: string | null;
  server_display_name?: string | null;
  discord_id?: string | null;
  role: UserRole;
  avatar_url: string | null;
  created_at: string;
}

export interface Stem {
  id: string;
  user_id: string | null;
  title: string;
  artist: string;
  bpm: number | null;
  key: string | null;
  track_count: number | null;
  format: string;
  host_platform: string;
  download_url: string;
  daw_template_url?: string | null;
  uploader_handle: string;
  description?: string | null;
  cover_url?: string | null;
  tags?: string[] | null;
  is_verified: boolean;
  status: StemStatus;
  download_count?: number;
  discord_message_id?: string | null;
  discord_thread_id?: string | null;
  created_at: string;
  avg_rating?: number;
  rating_count?: number;
  comment_count?: number;
}

export interface FormState {
  success: boolean;
  message: string;
  errors?: Record<string, string>;
  stem?: Stem;
}

export type FilterType =
  | 'All'
  | 'WAV (48kHz/24-bit)'
  | 'Multitrack Zip'
  | 'Verified Only';

export type SortType = 'newest' | 'most_tracks' | 'most_downloaded';

export interface StemRating {
  id: string;
  stem_id: string;
  user_id: string;
  rating: number;
  created_at: string;
}

export interface StemComment {
  id: string;
  stem_id: string;
  user_id: string;
  user_handle: string;
  content: string;
  created_at: string;
}

export interface StemMix {
  id: string;
  stem_id: string;
  user_id: string;
  user_handle: string;
  title: string;
  mix_url: string;
  description: string | null;
  likes_count: number;
  song_name?: string | null;
  musical_key?: string | null;
  bpm?: number | null;
  discord_post_id?: string | null;
  user_has_liked?: boolean;
  created_at: string;
}

// ==========================================
// MIXING VAULT v1 - MULTIS, MIXES, PLUGIN CHAINS
// ==========================================

export interface Multi {
  id: string;
  owner_id: string;
  title: string;
  description?: string | null;
  created_at: string;
  updated_at: string;
  owner?: Profile | null;
  uploader_name?: string;
  track_count?: number;
  total_size_bytes?: number;
  tracks?: MultiTrack[];
  mixes?: Mix[];
}

export interface MultiTrack {
  id: string;
  multi_id: string;
  stored_filename: string;
  original_filename: string;
  format: string;
  size_bytes: number;
  r2_key: string;
  public_url: string;
  duration_seconds?: number | null;
  created_at: string;
  uploader_name?: string;
}

export interface Mix {
  id: string;
  owner_id: string;
  multi_id?: string | null;
  title: string;
  format: string;
  size_bytes: number;
  r2_key: string;
  public_url: string;
  duration_seconds?: number | null;
  created_at: string;
  uploader_name?: string;
  multi_title?: string | null;
}

export interface PluginChainItem {
  id?: string;
  chain_id?: string;
  position: number;
  plugin_name: string;
  vendor?: string | null;
  category?: string | null;
  notes?: string | null;
}

export interface PluginChain {
  id: string;
  owner_id: string;
  name: string;
  daw: string;
  description?: string | null;
  created_at: string;
  updated_at: string;
  owner_name?: string;
  items?: PluginChainItem[];
  plugin_count?: number;
}

export interface StorageQuotaInfo {
  is_admin?: boolean;
  is_unlimited?: boolean;
  user_bytes_used: number;
  user_bytes_limit: number;
  user_percent: number;
  global_bytes_used: number;
  global_bytes_limit: number;
  global_warning: boolean;
  global_percent: number;
  is_r2_active: boolean;
  missing_r2_keys: string[];
}
