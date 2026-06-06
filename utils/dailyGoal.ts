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

const showNotificationViaSW = async (title: string, options: object): Promise<void> => {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;
  try {
    if ('serviceWorker' in navigator) {
      const reg = await navigator.serviceWorker.ready;
      await reg.showNotification(title, options as NotificationOptions);
      return;
    }
  } catch { /* fall through to basic Notification */ }
  new Notification(title, options as NotificationOptions);
};

export const sendGoalNotification = async (goal: number, lang: Lang): Promise<void> => {
  await showNotificationViaSW('Super Word Buddy 🎉', {
    body: lang === 'tr'
      ? `Tebrikler! Günlük ${goal} aktivite hedefine ulaştın! 🏆`
      : `Congratulations! You hit your daily goal of ${goal} activities! 🏆`,
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    tag: 'daily-goal',
    vibrate: [200, 100, 200],
    actions: [
      { action: 'stats', title: lang === 'tr' ? '📊 İstatistikler' : '📊 Statistics' },
    ],
  });
};

export const sendStreakNotification = async (streak: number, lang: Lang): Promise<void> => {
  await showNotificationViaSW('Super Word Buddy 🔥', {
    body: lang === 'tr'
      ? `${streak} günlük seri! Harika gidiyorsun! 💪`
      : `${streak}-day streak! You're on fire! 💪`,
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    tag: 'streak-milestone',
    vibrate: [100, 50, 100, 50, 200],
    actions: [
      { action: 'stats', title: lang === 'tr' ? '🔥 Serimi Gör' : '🔥 See Streak' },
    ],
  });
};
