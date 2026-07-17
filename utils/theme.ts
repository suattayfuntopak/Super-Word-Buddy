export type Theme = 'light' | 'dark' | 'system';

export const getStoredTheme = (): Theme => {
  try {
    return (localStorage.getItem('swb_theme') as Theme) ?? 'system';
  } catch {
    return 'system';
  }
};

export const storeTheme = (theme: Theme): void => {
  try { localStorage.setItem('swb_theme', theme); } catch { /* ignore */ }
};

export const resolveTheme = (theme: Theme): 'light' | 'dark' => {
  if (theme !== 'system') return theme;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

export const applyTheme = (theme: Theme): void => {
  document.documentElement.classList.toggle('dark', resolveTheme(theme) === 'dark');
};
