-- Super Word Buddy — Supabase Database Setup
-- Safe to re-run: uses IF NOT EXISTS + DROP POLICY IF EXISTS
-- Run this entire file in the Supabase SQL Editor.

-- ============================================================
-- 1. USER ACTIVITIES (for Statistics / streak / daily goal)
-- ============================================================
CREATE TABLE IF NOT EXISTS user_activities (
  id            UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id       UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  activity_type TEXT        NOT NULL,  -- 'flashcards' | 'quiz' | 'writing'
  score         INTEGER     NOT NULL DEFAULT 0,
  total_items   INTEGER     NOT NULL DEFAULT 1,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE user_activities ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own activities" ON user_activities;
CREATE POLICY "Users manage own activities"
  ON user_activities FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- 2. USER FAVORITES (cloud sync for ❤️ favorites)
-- ============================================================
CREATE TABLE IF NOT EXISTS user_favorites (
  id         UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  word_id    TEXT        NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, word_id)
);

ALTER TABLE user_favorites ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own favorites" ON user_favorites;
CREATE POLICY "Users manage own favorites"
  ON user_favorites FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- 3. USER WORD TAGS (cloud sync for 🏷️ tags)
-- ============================================================
CREATE TABLE IF NOT EXISTS user_word_tags (
  id         UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  word_id    TEXT        NOT NULL,
  tags       TEXT[]      NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, word_id)
);

ALTER TABLE user_word_tags ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own word tags" ON user_word_tags;
CREATE POLICY "Users manage own word tags"
  ON user_word_tags FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- 4. VOCABULARY (main word pool — already exists)
--    Listed here for reference only; do NOT re-run this block
--    if vocabulary table already exists.
-- ============================================================
-- CREATE TABLE IF NOT EXISTS vocabulary (
--   id                   BIGSERIAL PRIMARY KEY,
--   english              TEXT NOT NULL,
--   turkish              TEXT,
--   word_type_en         TEXT,
--   word_type_tr         TEXT,
--   example_sentence_en  TEXT,
--   example_sentence_tr  TEXT,
--   user_id              UUID REFERENCES auth.users(id) ON DELETE SET NULL,
--   created_at           TIMESTAMPTZ DEFAULT NOW()
-- );

-- ============================================================
-- 5. USER WORD STATS (per-word correct/wrong counts — cross-device analytics)
-- ============================================================
CREATE TABLE IF NOT EXISTS user_word_stats (
  user_id    UUID    NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  word_id    TEXT    NOT NULL,
  correct    INTEGER NOT NULL DEFAULT 0,
  wrong      INTEGER NOT NULL DEFAULT 0,
  last_seen  TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, word_id)
);

ALTER TABLE user_word_stats ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own word stats" ON user_word_stats;
CREATE POLICY "Users manage own word stats"
  ON user_word_stats FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Atomic upsert function — increments correct/wrong counts
CREATE OR REPLACE FUNCTION upsert_word_stat(
  p_user_id UUID,
  p_word_id TEXT,
  p_correct INTEGER DEFAULT 0,
  p_wrong   INTEGER DEFAULT 0
) RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  INSERT INTO user_word_stats (user_id, word_id, correct, wrong, last_seen)
  VALUES (p_user_id, p_word_id, p_correct, p_wrong, NOW())
  ON CONFLICT (user_id, word_id) DO UPDATE SET
    correct   = user_word_stats.correct + EXCLUDED.correct,
    wrong     = user_word_stats.wrong   + EXCLUDED.wrong,
    last_seen = NOW();
$$;

-- ============================================================
-- 6. AVATARS STORAGE BUCKET (for profile photo upload)
-- ============================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('avatars', 'avatars', true, 5242880, ARRAY['image/jpeg','image/png','image/webp','image/gif'])
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Users upload own avatar" ON storage.objects;
CREATE POLICY "Users upload own avatar" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'avatars' AND name LIKE auth.uid()::text || '/%');

DROP POLICY IF EXISTS "Public read avatars" ON storage.objects;
CREATE POLICY "Public read avatars" ON storage.objects
  FOR SELECT TO public
  USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "Users update own avatar" ON storage.objects;
CREATE POLICY "Users update own avatar" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'avatars' AND name LIKE auth.uid()::text || '/%');

DROP POLICY IF EXISTS "Users delete own avatar" ON storage.objects;
CREATE POLICY "Users delete own avatar" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'avatars' AND name LIKE auth.uid()::text || '/%');

-- ============================================================
-- Refresh PostgREST schema cache (run after any table/policy change)
-- ============================================================
NOTIFY pgrst, 'reload schema';
