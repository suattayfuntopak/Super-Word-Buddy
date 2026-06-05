export type Theme = 'light' | 'dark' | 'system';

export const getStoredTheme = (): Theme =>
  (localStorage.getItem('swb_theme') as Theme) ?? 'system';

export const storeTheme = (theme: Theme): void =>
  localStorage.setItem('swb_theme', theme);

export const resolveTheme = (theme: Theme): 'light' | 'dark' => {
  if (theme !== 'system') return theme;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

export const applyTheme = (theme: Theme): void => {
  document.documentElement.classList.toggle('dark', resolveTheme(theme) === 'dark');
};
