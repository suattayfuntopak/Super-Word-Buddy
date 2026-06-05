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
