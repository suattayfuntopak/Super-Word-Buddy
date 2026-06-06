
import { supabase } from '../services/supabaseClient';

const storageKey = (userId: string) => `swb_favorites_${userId}`;

const getSet = (userId: string): Set<string> => {
  try {
    const raw = localStorage.getItem(storageKey(userId));
    return raw ? new Set<string>(JSON.parse(raw)) : new Set<string>();
  } catch {
    return new Set<string>();
  }
};

export const isFavorite = (userId: string, wordId: string): boolean =>
  getSet(userId).has(wordId);

export const toggleFavorite = (userId: string, wordId: string): boolean => {
  const favorites = getSet(userId);
  if (favorites.has(wordId)) favorites.delete(wordId);
  else favorites.add(wordId);
  localStorage.setItem(storageKey(userId), JSON.stringify([...favorites]));
  return favorites.has(wordId);
};

export const getFavoriteIds = (userId: string): Set<string> => getSet(userId);

// Supabase-backed: load from DB, cache to localStorage
export const loadFavoritesFromDB = async (userId: string): Promise<Set<string>> => {
  try {
    const { data, error } = await supabase
      .from('user_favorites')
      .select('word_id')
      .eq('user_id', userId);
    if (error) throw error;

    const dbIds = new Set<string>((data || []).map((r: any) => r.word_id as string));
    const localIds = getFavoriteIds(userId);

    // DB has data → use as source of truth, sync to local
    if (dbIds.size > 0) {
      localStorage.setItem(storageKey(userId), JSON.stringify([...dbIds]));
      return dbIds;
    }

    // DB empty but local has favorites → push local to DB (handles schema-cache-stale scenario)
    if (localIds.size > 0) {
      const inserts = [...localIds].map(wordId => ({ user_id: userId, word_id: wordId }));
      supabase
        .from('user_favorites')
        .upsert(inserts, { onConflict: 'user_id,word_id', ignoreDuplicates: true })
        .then(({ error: syncErr }) => { if (syncErr) console.error('Favorite DB sync failed:', syncErr); });
      return localIds;
    }

    // Both empty
    return new Set<string>();
  } catch {
    // Table missing or network error — fall back to localStorage
    return getFavoriteIds(userId);
  }
};

// Toggle in localStorage immediately (optimistic), then sync to Supabase
export const toggleFavoriteDB = async (userId: string, wordId: string): Promise<boolean> => {
  const newState = toggleFavorite(userId, wordId); // sync localStorage first
  try {
    if (newState) {
      await supabase.from('user_favorites').insert({ user_id: userId, word_id: wordId });
    } else {
      await supabase.from('user_favorites').delete().eq('user_id', userId).eq('word_id', wordId);
    }
  } catch (e) {
    console.error('Favorites Supabase sync failed:', e);
  }
  return newState;
};
