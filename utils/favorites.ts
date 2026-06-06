import { supabase } from '../services/supabaseClient';
import { queueOfflineOp } from './offlineSync';

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

    // Merge DB + local — neither source wins outright, union of both is source of truth
    const merged = new Set<string>([...dbIds, ...localIds]);

    if (merged.size > 0) {
      // Persist merged set to localStorage
      localStorage.setItem(storageKey(userId), JSON.stringify([...merged]));

      // Push any local-only items to DB (recovery sync for items added offline or before DB was set up)
      const extras = [...localIds].filter(id => !dbIds.has(id));
      if (extras.length > 0) {
        supabase
          .from('user_favorites')
          .upsert(
            extras.map(wordId => ({ user_id: userId, word_id: wordId })),
            { onConflict: 'user_id,word_id', ignoreDuplicates: true }
          )
          .then(({ error: syncErr }) => { if (syncErr) console.error('Favorite recovery sync failed:', syncErr); });
      }

      return merged;
    }

    return new Set<string>();
  } catch {
    // Table missing or network error — fall back to localStorage
    return getFavoriteIds(userId);
  }
};

// Toggle in localStorage immediately (optimistic), then sync to Supabase
export const toggleFavoriteDB = async (userId: string, wordId: string): Promise<boolean> => {
  const newState = toggleFavorite(userId, wordId); // sync localStorage first

  if (!navigator.onLine) {
    queueOfflineOp(userId, {
      type: 'favorite',
      action: newState ? 'add' : 'remove',
      wordId
    });
    return newState;
  }

  try {
    let result;
    if (newState) {
      result = await supabase.from('user_favorites').upsert({ user_id: userId, word_id: wordId }, { onConflict: 'user_id,word_id', ignoreDuplicates: true });
    } else {
      result = await supabase.from('user_favorites').delete().eq('user_id', userId).eq('word_id', wordId);
    }
    if (result.error) throw result.error;
  } catch (e) {
    console.error('Favorites Supabase sync failed, queuing offline:', e);
    queueOfflineOp(userId, {
      type: 'favorite',
      action: newState ? 'add' : 'remove',
      wordId
    });
  }
  return newState;
};
