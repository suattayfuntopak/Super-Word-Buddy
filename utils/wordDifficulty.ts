
const storageKey = (userId: string) => `swb_difficulty_${userId}`;

const getMap = (userId: string): Record<string, number> => {
  try {
    const raw = localStorage.getItem(storageKey(userId));
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};

export const getWordDifficulty = (userId: string, wordId: string): number => {
  if (!userId) return 3;
  return getMap(userId)[wordId] ?? 3;
};

export const updateWordDifficulty = (userId: string, wordId: string, wasCorrect: boolean): void => {
  if (!userId) return;
  const map = getMap(userId);
  const current = map[wordId] ?? 3;
  map[wordId] = wasCorrect ? Math.max(1, current - 1) : Math.min(5, current + 2);
  localStorage.setItem(storageKey(userId), JSON.stringify(map));
};
