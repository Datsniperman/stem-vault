export type DawFormat = 'reaper' | 'ableton' | 'dawproject' | 'midi-stems';

export interface DawTrackInput {
  name: string;
  filename: string;
  url?: string;
  durationSeconds?: number;
  sampleRate?: number;
}

export interface DawProjectOptions {
  title: string;
  bpm?: number | null;
  timeSignatureNumerator?: number;
  timeSignatureDenominator?: number;
  tracks: DawTrackInput[];
}
