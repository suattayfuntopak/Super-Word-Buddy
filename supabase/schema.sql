-- Super Word Buddy — Supabase Database Setup
-- Run this entire file in the Supabase SQL Editor once to set up all required tables.

-- ============================================================
-- 1. USER ACTIVITIES (for Statistics / streak / daily goal)
-- ============================================================
CREATE TABLE IF NOT EXISTS user_activities (
  id          UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  activity_type TEXT      NOT NULL,           -- 'flashcards' | 'quiz' | 'writing'
  score       INTEGER     NOT NULL DEFAULT 0,
  total_items INTEGER     NOT NULL DEFAULT 1,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE user_activities ENABLE ROW LEVEL SECURITY;

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
