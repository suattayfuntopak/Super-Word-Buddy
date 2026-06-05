import type { Lang } from './i18n';

export const getDailyGoal = (): number =>
  parseInt(localStorage.getItem('swb_daily_goal') ?? '3', 10);

export const setDailyGoal = (n: number): void =>
  localStorage.setItem('swb_daily_goal', String(Math.max(1, Math.min(20, n))));

export const requestNotificationPermission = async (): Promise<boolean> => {
  if (!('Notification' in window)) return false;
  if (Notification.permission === 'granted') return true;
  const result = await Notification.requestPermission();
  return result === 'granted';
};

export const sendGoalNotification = (goal: number, lang: Lang): void => {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;
  new Notification('Super Word Buddy 🎉', {
    body: lang === 'tr'
      ? `Tebrikler! Günlük ${goal} aktivite hedefine ulaştın! 🏆`
      : `Congratulations! You've reached your daily goal of ${goal} activities! 🏆`,
    icon: '/icons/icon-192.png',
  });
};
