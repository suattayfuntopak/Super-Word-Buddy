import type { Lang } from './i18n';

export const getDailyGoal = (): number => {
  try {
    return parseInt(localStorage.getItem('swb_daily_goal') ?? '3', 10);
  } catch {
    return 3;
  }
};

export const setDailyGoal = (n: number): void => {
  try { localStorage.setItem('swb_daily_goal', String(Math.max(1, Math.min(20, n)))); } catch { /* ignore */ }
};

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

// ── Scheduled reminder ──────────────────────────────────────────────────────
// Storage keys
const REMINDER_HOUR_KEY  = 'swb_reminder_hour';   // '0'–'23' or '' (disabled)
const REMINDER_MIN_KEY   = 'swb_reminder_min';    // '0'–'59'

export const getReminderTime = (): { hour: number; minute: number } | null => {
  try {
    const h = localStorage.getItem(REMINDER_HOUR_KEY);
    const m = localStorage.getItem(REMINDER_MIN_KEY);
    if (h === null || h === '') return null;
    return { hour: parseInt(h, 10), minute: parseInt(m ?? '0', 10) };
  } catch {
    return null;
  }
};

export const setReminderTime = (hour: number | null, minute: number): void => {
  if (hour === null) {
    localStorage.removeItem(REMINDER_HOUR_KEY);
    localStorage.removeItem(REMINDER_MIN_KEY);
  } else {
    localStorage.setItem(REMINDER_HOUR_KEY, String(hour));
    localStorage.setItem(REMINDER_MIN_KEY, String(minute));
  }
};

/** Called by App.tsx once per minute (via setInterval or visibility change). */
export const checkAndSendReminderIfDue = async (lang: Lang): Promise<void> => {
  const rt = getReminderTime();
  if (!rt) return;
  const now = new Date();
  if (now.getHours() !== rt.hour || now.getMinutes() !== rt.minute) return;

  // Throttle: fire at most once per hour using a flag in sessionStorage
  const throttleKey = `swb_reminder_sent_${now.toDateString()}_${rt.hour}`;
  if (sessionStorage.getItem(throttleKey)) return;
  sessionStorage.setItem(throttleKey, '1');

  await showNotificationViaSW('Super Word Buddy ⏰', {
    body: lang === 'tr'
      ? 'Çalışma zamanı! Bugünkü kelimelerini çalış. 📚'
      : "Study time! Let's work on today's words. 📚",
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    tag: 'daily-reminder',
    vibrate: [200, 100, 200],
    actions: [
      { action: 'open', title: lang === 'tr' ? '📚 Başla' : '📚 Start' },
    ],
  });
};
