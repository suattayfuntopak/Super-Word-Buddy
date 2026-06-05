import { supabase } from '../services/supabaseClient';

const storageKey = (userId: string) => `swb_tags_${userId}`;

const getMap = (userId: string): Record<string, string[]> => {
  try {
    const raw = localStorage.getItem(storageKey(userId));
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
};

export const getTagsMap = (userId: string): Record<string, string[]> =>
  userId ? getMap(userId) : {};

export const getWordTags = (userId: string, wordId: string): string[] =>
  userId ? (getMap(userId)[wordId] ?? []) : [];

export const setWordTags = (userId: string, wordId: string, tags: string[]): void => {
  if (!userId) return;
  const map = getMap(userId);
  if (tags.length === 0) delete map[wordId];
  else map[wordId] = tags;
  localStorage.setItem(storageKey(userId), JSON.stringify(map));
};

export const getAllUserTags = (userId: string): string[] =>
  [...new Set(Object.values(getMap(userId)).flat())].sort();

// Supabase-backed: load from DB, cache to localStorage
export const loadTagsFromDB = async (userId: string): Promise<Record<string, string[]>> => {
  try {
    const { data, error } = await supabase
      .from('user_word_tags')
      .select('word_id, tags')
      .eq('user_id', userId);
    if (error) throw error;
    const map: Record<string, string[]> = {};
    (data || []).forEach((r: any) => { if (r.tags?.length) map[r.word_id] = r.tags; });
    localStorage.setItem(storageKey(userId), JSON.stringify(map));
    return map;
  } catch {
    return getTagsMap(userId);
  }
};

// Update localStorage immediately (optimistic), then sync to Supabase
export const setWordTagsDB = async (userId: string, wordId: string, tags: string[]): Promise<void> => {
  setWordTags(userId, wordId, tags); // sync localStorage first
  try {
    if (tags.length === 0) {
      await supabase.from('user_word_tags').delete().eq('user_id', userId).eq('word_id', wordId);
    } else {
      await supabase.from('user_word_tags').upsert(
        { user_id: userId, word_id: wordId, tags, updated_at: new Date().toISOString() },
        { onConflict: 'user_id,word_id' }
      );
    }
  } catch (e) {
    console.error('Tags Supabase sync failed:', e);
  }
};
