
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
    const ids = new Set<string>((data || []).map((r: any) => r.word_id as string));
    localStorage.setItem(storageKey(userId), JSON.stringify([...ids]));
    return ids;
  } catch {
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
