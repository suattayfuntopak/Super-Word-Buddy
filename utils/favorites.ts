
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
