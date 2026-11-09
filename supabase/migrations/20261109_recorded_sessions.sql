-- Migration: 20261109_recorded_sessions.sql
-- Recorded Sessions video library table for paying members (Plus & Premium)

CREATE TABLE IF NOT EXISTS public.recorded_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  thumbnail_url TEXT,
  video_asset_id TEXT NOT NULL,
  video_url TEXT,
  storage_provider TEXT DEFAULT 'hls' CHECK (storage_provider IN ('hls', 'cloudflare_stream', 'mux', 'r2')),
  required_tier TEXT NOT NULL DEFAULT 'PLUS' CHECK (required_tier IN ('PLUS', 'PREMIUM')),
  duration_seconds INTEGER,
  presenter TEXT,
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  published BOOLEAN DEFAULT true,
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_recorded_sessions_tier ON public.recorded_sessions(required_tier);
CREATE INDEX IF NOT EXISTS idx_recorded_sessions_created_at ON public.recorded_sessions(created_at DESC);

-- Enable RLS
ALTER TABLE public.recorded_sessions ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'recorded_sessions' AND policyname = 'Allow authenticated read of published recorded_sessions'
  ) THEN
    CREATE POLICY "Allow authenticated read of published recorded_sessions"
      ON public.recorded_sessions
      FOR SELECT
      USING (published = true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'recorded_sessions' AND policyname = 'Allow admin full access to recorded_sessions'
  ) THEN
    CREATE POLICY "Allow admin full access to recorded_sessions"
      ON public.recorded_sessions
      FOR ALL
      USING (
        EXISTS (
          SELECT 1 FROM public.profiles
          WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
        )
      );
  END IF;
END $$;
