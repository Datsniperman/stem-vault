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
  uploader_handle: string;
  description?: string | null;
  cover_url?: string | null;
  tags?: string[] | null;
  is_verified: boolean;
  status: StemStatus;
  download_count?: number;
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
  user_has_liked?: boolean;
  created_at: string;
}

