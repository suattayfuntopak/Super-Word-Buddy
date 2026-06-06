// Weekly study schedule: per-day activity goals
// day index: 0=Sunday, 1=Monday, ..., 6=Saturday
// value: number of activities; undefined = use global default; 0 = rest day

export type WeeklySchedule = Partial<Record<number, number>>;

const STORAGE_KEY = (userId: string) => `swb_weekly_${userId}`;

export const getWeeklySchedule = (userId: string): WeeklySchedule => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY(userId));
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};

export const setWeeklySchedule = (userId: string, schedule: WeeklySchedule): void => {
  localStorage.setItem(STORAGE_KEY(userId), JSON.stringify(schedule));
};

// Returns today's goal from the weekly schedule, or defaultGoal if not set
export const getTodayGoal = (userId: string, defaultGoal: number): number => {
  const schedule = getWeeklySchedule(userId);
  const today = new Date().getDay();
  return schedule[today] !== undefined ? schedule[today]! : defaultGoal;
};

export const isRestDay = (userId: string): boolean =>
  getTodayGoal(userId, 1) === 0;
