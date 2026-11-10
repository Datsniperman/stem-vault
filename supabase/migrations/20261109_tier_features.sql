-- Migration: 20261109_tier_features.sql
-- Tiered Membership features: Pro Multitracks & Sunday Mix Reviews

ALTER TABLE public.multis ADD COLUMN IF NOT EXISTS is_pro BOOLEAN DEFAULT false;
ALTER TABLE public.mixes ADD COLUMN IF NOT EXISTS is_sunday_review BOOLEAN DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_multis_is_pro ON public.multis(is_pro);
CREATE INDEX IF NOT EXISTS idx_mixes_is_sunday_review ON public.mixes(is_sunday_review);
