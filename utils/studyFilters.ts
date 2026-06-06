import { supabase } from '../services/supabaseClient';
import { StudyFilterConfig, SavedStudyFilter } from '../types';

const storageKey = (userId: string) => `swb_saved_filters_${userId}`;
const activeFilterKey = (userId: string) => `swb_active_filter_${userId}`;

export const getStoredSavedFilters = (userId: string): SavedStudyFilter[] => {
  try {
    const raw = localStorage.getItem(storageKey(userId));
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

export const getStoredActiveFilter = (userId: string): StudyFilterConfig | null => {
  try {
    const raw = localStorage.getItem(activeFilterKey(userId));
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const storeActiveFilter = (userId: string, filter: StudyFilterConfig | null): void => {
  if (!userId) return;
  if (filter === null) {
    localStorage.removeItem(activeFilterKey(userId));
  } else {
    localStorage.setItem(activeFilterKey(userId), JSON.stringify(filter));
  }
};

export const saveFilterLocal = (userId: string, name: string, config: StudyFilterConfig): SavedStudyFilter[] => {
  const current = getStoredSavedFilters(userId);
  const filtered = current.filter(f => f.name.toLowerCase() !== name.toLowerCase());
  const updated = [...filtered, { name, config }];
  localStorage.setItem(storageKey(userId), JSON.stringify(updated));
  return updated;
};

export const deleteFilterLocal = (userId: string, name: string): SavedStudyFilter[] => {
  const current = getStoredSavedFilters(userId);
  const updated = current.filter(f => f.name.toLowerCase() !== name.toLowerCase());
  localStorage.setItem(storageKey(userId), JSON.stringify(updated));
  return updated;
};

export const loadSavedFiltersFromDB = async (userId: string): Promise<SavedStudyFilter[]> => {
  try {
    const { data, error } = await supabase
      .from('user_study_filters')
      .select('id, name, word_types, tags, favorites_only, search_term')
      .eq('user_id', userId);
    if (error) throw error;

    const dbFilters: SavedStudyFilter[] = (data || []).map((r: any) => ({
      id: r.id,
      name: r.name,
      config: {
        wordTypes: r.word_types || [],
        tags: r.tags || [],
        favoritesOnly: r.favorites_only || false,
        searchTerm: r.search_term || ''
      }
    }));

    const localFilters = getStoredSavedFilters(userId);
    const mergedMap = new Map<string, SavedStudyFilter>();
    localFilters.forEach(f => mergedMap.set(f.name.toLowerCase(), f));
    dbFilters.forEach(f => mergedMap.set(f.name.toLowerCase(), f));

    const merged = Array.from(mergedMap.values());
    localStorage.setItem(storageKey(userId), JSON.stringify(merged));

    // Async push local-only filters to DB for recovery
    const dbFilterNames = new Set(dbFilters.map(f => f.name.toLowerCase()));
    const localOnly = localFilters.filter(f => !dbFilterNames.has(f.name.toLowerCase()));
    if (localOnly.length > 0) {
      Promise.all(localOnly.map(f =>
        supabase.from('user_study_filters').upsert({
          user_id: userId,
          name: f.name,
          word_types: f.config.wordTypes,
          tags: f.config.tags,
          favorites_only: f.config.favoritesOnly,
          search_term: f.config.searchTerm
        }, { onConflict: 'user_id,name' })
      )).catch(e => console.error('Error syncing local-only filters to DB:', e));
    }

    return merged;
  } catch (err) {
    console.error('Error loading filters from DB:', err);
    return getStoredSavedFilters(userId);
  }
};

export const saveFilterDB = async (userId: string, name: string, config: StudyFilterConfig): Promise<SavedStudyFilter[]> => {
  saveFilterLocal(userId, name, config);
  try {
    await supabase.from('user_study_filters').upsert({
      user_id: userId,
      name,
      word_types: config.wordTypes,
      tags: config.tags,
      favorites_only: config.favoritesOnly,
      search_term: config.searchTerm
    }, { onConflict: 'user_id,name' });
  } catch (e) {
    console.error('Error syncing filter to DB:', e);
  }
  return loadSavedFiltersFromDB(userId);
};

export const deleteFilterDB = async (userId: string, name: string): Promise<SavedStudyFilter[]> => {
  deleteFilterLocal(userId, name);
  try {
    await supabase.from('user_study_filters').delete().eq('user_id', userId).eq('name', name);
  } catch (e) {
    console.error('Error deleting filter from DB:', e);
  }
  return loadSavedFiltersFromDB(userId);
};
