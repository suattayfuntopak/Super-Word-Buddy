
import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';
import { VocabularyItem } from '../types';
import type { Lang } from '../utils/i18n';
import { getDifficultiesMap } from '../utils/wordDifficulty';

interface StatisticsProps {
  userId: string;
  vocabItems: VocabularyItem[];
  onBack: () => void;
  dailyGoal?: number;
  lang?: Lang;
}

interface ActivityLog {
  activity_type: string;
  score: number;
  total_items: number;
  created_at: string;
}

const ST = {
  tr: {
    title: 'İstatistikler 📊',
    subtitle: 'Senin Başarı Panelin',
    back: '← Geri Dön',
    globalPool: 'Global Havuz Durumu',
    totalWords: 'Toplam Kelime',
    myContrib: 'Senin Katkın',
    streak: 'Günlük Seri',
    streakStart: 'Bugün başla!',
    streakOne: 'Harika başlangıç',
    streakMany: (n: number) => `${n} gün üst üste`,
    todayActivity: 'Bugünkü Aktivite',
    todayNone: 'Henüz çalışmadın',
    todayGreat: 'Süper gün! 🚀',
    todayContinue: 'Devam et!',
    totalActivity: 'Toplam Aktivite',
    allTime: 'Tüm zamanlar',
    overallSuccess: 'Genel Başarı',
    quizWriting: 'Quiz + Yazma',
    dailyGoalTitle: 'Günlük Hedef',
    dailyGoalSub: 'Bugünkü ilerleme',
    goalReached: '🏆 Hedefe ulaştın!',
    activitiesLeft: (n: number) => `${n} aktivite kaldı`,
    flashcards: 'Flashcard Görüntüleme',
    flashcardsUnit: 'kart',
    quizRate: 'Test Başarı Oranı',
    writingRate: 'Yazma Doğruluğu',
    trendTitle: '7 Günlük Aktivite',
    today: 'Bugün',
    noActivity: 'Aktivite yok',
    hardWords: 'En Zor Kelimeler',
    hardWordsSub: 'Spaced repetition puanı en yüksek',
    hardWordsNone: 'Henüz zorluk verisi yok — quiz ve yazma alıştırmaları yapınca burada görünür.',
    difficulty: 'Zorluk',
    tableError: 'Aktivite verileri yüklenemedi.',
    tableErrorSql: 'Supabase SQL Editörü\'nde aşağıdaki SQL\'i çalıştırın:',
    tableMissing: 'user_activities tablosu bulunamadı.',
  },
  en: {
    title: 'Statistics 📊',
    subtitle: 'Your Achievement Panel',
    back: '← Go Back',
    globalPool: 'Global Pool Status',
    totalWords: 'Total Words',
    myContrib: 'Your Contribution',
    streak: 'Daily Streak',
    streakStart: 'Start today!',
    streakOne: 'Great start',
    streakMany: (n: number) => `${n} days in a row`,
    todayActivity: "Today's Activity",
    todayNone: "Haven't studied yet",
    todayGreat: 'Super day! 🚀',
    todayContinue: 'Keep going!',
    totalActivity: 'Total Activity',
    allTime: 'All time',
    overallSuccess: 'Overall Score',
    quizWriting: 'Quiz + Writing',
    dailyGoalTitle: 'Daily Goal',
    dailyGoalSub: "Today's progress",
    goalReached: '🏆 Goal reached!',
    activitiesLeft: (n: number) => `${n} activities to go`,
    flashcards: 'Flashcard Views',
    flashcardsUnit: 'cards',
    quizRate: 'Quiz Success Rate',
    writingRate: 'Writing Accuracy',
    trendTitle: '7-Day Activity',
    today: 'Today',
    noActivity: 'No activity',
    hardWords: 'Hardest Words',
    hardWordsSub: 'Highest spaced repetition score',
    hardWordsNone: 'No difficulty data yet — complete quizzes and writing exercises to see results.',
    difficulty: 'Difficulty',
    tableError: 'Could not load activity data.',
    tableErrorSql: 'Run the following SQL in the Supabase SQL Editor:',
    tableMissing: 'user_activities table not found.',
  },
};

const SETUP_SQL = `-- Run this in Supabase SQL Editor
CREATE TABLE IF NOT EXISTS user_activities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL,
  score INTEGER NOT NULL DEFAULT 0,
  total_items INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE user_activities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own activities" ON user_activities
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS user_favorites (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  word_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, word_id)
);
ALTER TABLE user_favorites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own favorites" ON user_favorites
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS user_word_tags (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  word_id TEXT NOT NULL,
  tags TEXT[] NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, word_id)
);
ALTER TABLE user_word_tags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own tags" ON user_word_tags
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);`;

const Statistics: React.FC<StatisticsProps> = ({ userId, vocabItems, onBack, dailyGoal = 3, lang = 'tr' }) => {
  const [loading, setLoading] = useState(true);
  const [wordStats, setWordStats] = useState({ total: 0, addedByMe: 0 });
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [fetchError, setFetchError] = useState<{ type: 'table_missing' | 'unknown'; message: string } | null>(null);
  const [showSql, setShowSql] = useState(false);
  const [sqlCopied, setSqlCopied] = useState(false);

  const t = ST[lang];

  useEffect(() => {
    if (userId) fetchData();
  }, [userId, vocabItems]);

  const fetchData = async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const { count: totalCount } = await supabase.from('vocabulary').select('*', { count: 'exact', head: true });

      let addedCount = 0;
      let from = 0, to = 999, finished = false;
      while (!finished) {
        const { data } = await supabase.from('vocabulary').select('id').eq('user_id', userId).range(from, to);
        if (data && data.length > 0) {
          addedCount += data.length;
          if (data.length < 1000) finished = true;
          else { from += 1000; to += 1000; }
        } else finished = true;
      }

      setWordStats({ total: totalCount || vocabItems.length, addedByMe: addedCount });

      const { data: logData, error: logError } = await supabase
        .from('user_activities')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (logError) {
        const isMissing = logError.code === '42P01' || logError.message?.includes('does not exist');
        setFetchError({
          type: isMissing ? 'table_missing' : 'unknown',
          message: logError.message
        });
        return;
      }
      if (logData) setActivityLogs(logData);
    } catch (err: any) {
      setFetchError({ type: 'unknown', message: err?.message || String(err) });
      console.error('İstatistikler getirilirken hata:', err);
    } finally {
      setLoading(false);
    }
  };

  const calculatePerformance = (type: string) => {
    const logs = activityLogs.filter(l => l.activity_type === type);
    if (logs.length === 0) return 0;
    const totalScore = logs.reduce((acc, curr) => acc + (curr.score / curr.total_items), 0);
    return Math.round((totalScore / logs.length) * 100);
  };

  const getDetails = (type: string) => {
    const logs = activityLogs.filter(l => l.activity_type === type);
    const totalCorrect = logs.reduce((acc, curr) => acc + curr.score, 0);
    const totalItems = logs.reduce((acc, curr) => acc + curr.total_items, 0);
    return { totalCorrect, totalWrong: totalItems - totalCorrect };
  };

  const calculateStreak = (): number => {
    if (activityLogs.length === 0) return 0;
    const activeDays = new Set<string>();
    activityLogs.forEach(log => activeDays.add(new Date(log.created_at).toISOString().split('T')[0]));
    let streak = 0;
    const checkDate = new Date();
    checkDate.setHours(0, 0, 0, 0);
    while (true) {
      const dateStr = checkDate.toISOString().split('T')[0];
      if (activeDays.has(dateStr)) { streak++; checkDate.setDate(checkDate.getDate() - 1); }
      else break;
    }
    return streak;
  };

  const todayActivityCount = (): number => {
    const today = new Date().toISOString().split('T')[0];
    return activityLogs.filter(log => log.created_at.startsWith(today)).length;
  };

  const getLast7Days = () => {
    const days: { label: string; count: number; isToday: boolean }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const count = activityLogs.filter(l => l.created_at.startsWith(dateStr)).length;
      const label = i === 0
        ? t.today
        : d.toLocaleDateString(lang === 'tr' ? 'tr-TR' : 'en-US', { weekday: 'short' });
      days.push({ label, count, isToday: i === 0 });
    }
    return days;
  };

  // Most wrong words from wordDifficulty localStorage
  const getHardWords = () => {
    const diffMap = getDifficultiesMap(userId);
    return Object.entries(diffMap)
      .filter(([, score]) => score >= 4)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([wordId, score]) => {
        const item = vocabItems.find(v => v.id === wordId);
        return item ? { item, score } : null;
      })
      .filter(Boolean) as { item: VocabularyItem; score: number }[];
  };

  const copySQL = () => {
    navigator.clipboard.writeText(SETUP_SQL).then(() => {
      setSqlCopied(true);
      setTimeout(() => setSqlCopied(false), 2000);
    });
  };

  const totalActivities = activityLogs.length;
  const streak = calculateStreak();
  const todayCount = todayActivityCount();
  const quizDetails = getDetails('quiz');
  const writingDetails = getDetails('writing');
  const flashcardCount = activityLogs.filter(l => l.activity_type === 'flashcards').reduce((acc, curr) => acc + curr.total_items, 0);
  const last7Days = getLast7Days();
  const maxDayCount = Math.max(1, ...last7Days.map(d => d.count));
  const hardWords = getHardWords();

  const radius = 45;
  const circumference = 2 * Math.PI * radius;

  return (
    <div className="max-w-5xl mx-auto w-full space-y-8 sm:space-y-12 animate-in fade-in zoom-in-95 duration-500 pb-24 px-4">
      <div className="flex justify-between items-center">
        <div className="space-y-1">
          <h2 className="text-3xl sm:text-5xl font-black text-slate-800 tracking-tight">{t.title}</h2>
          <p className="text-slate-400 font-bold text-xs sm:text-lg uppercase tracking-[0.2em] sm:tracking-[0.3em]">{t.subtitle}</p>
        </div>
        <button onClick={onBack} className="text-slate-400 font-bold hover:text-slate-600 uppercase tracking-widest text-xs sm:text-sm">
          {t.back}
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-12 h-12 sm:w-16 sm:h-16 border-4 sm:border-8 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-8">

          {/* Table missing / error banner */}
          {fetchError && (
            <div className="col-span-1 md:col-span-3 bg-amber-50 border-2 border-amber-200 p-5 sm:p-6 rounded-[2rem] space-y-3">
              <div className="flex items-center space-x-3">
                <span className="text-2xl">⚠️</span>
                <div>
                  <p className="font-black text-amber-800 text-sm sm:text-base">
                    {fetchError.type === 'table_missing' ? t.tableMissing : t.tableError}
                  </p>
                  <p className="text-amber-600 text-xs font-medium">{fetchError.message}</p>
                </div>
              </div>
              <p className="text-amber-700 text-xs sm:text-sm font-bold">{t.tableErrorSql}</p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowSql(v => !v)}
                  className="px-4 py-2 bg-amber-600 text-white rounded-xl font-black text-xs hover:bg-amber-700 transition-colors"
                >
                  {showSql ? '— SQL' : '+ SQL'}
                </button>
                <button
                  onClick={copySQL}
                  className="px-4 py-2 bg-white border border-amber-300 text-amber-700 rounded-xl font-black text-xs hover:bg-amber-50 transition-colors"
                >
                  {sqlCopied ? '✓ Kopyalandı!' : '📋 Kopyala'}
                </button>
              </div>
              {showSql && (
                <pre className="bg-slate-900 text-green-400 p-4 rounded-xl text-[10px] sm:text-xs overflow-x-auto leading-relaxed font-mono">
                  {SETUP_SQL}
                </pre>
              )}
            </div>
          )}

          {/* Global pool */}
          <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 p-6 sm:p-10 rounded-[2rem] sm:rounded-[3rem] shadow-2xl text-white flex flex-col items-center text-center col-span-1 md:col-span-3">
            <h3 className="font-black text-[10px] sm:text-xs uppercase tracking-widest mb-4 sm:mb-6 opacity-60">{t.globalPool}</h3>
            <div className="flex items-center space-x-8 sm:space-x-24">
              <div className="text-center">
                <span className="text-4xl sm:text-7xl font-black block">{wordStats.total.toLocaleString('tr-TR')}</span>
                <span className="text-[10px] sm:text-xs font-bold uppercase opacity-60">{t.totalWords}</span>
              </div>
              <div className="h-10 sm:h-16 w-px bg-white/20"></div>
              <div className="text-center">
                <span className="text-4xl sm:text-7xl font-black block text-orange-400">{wordStats.addedByMe.toLocaleString('tr-TR')}</span>
                <span className="text-[10px] sm:text-xs font-bold uppercase opacity-60">{t.myContrib}</span>
              </div>
            </div>
          </div>

          {/* Streak + Daily */}
          <div className="col-span-1 md:col-span-3 grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-orange-400 to-red-500 p-5 sm:p-8 rounded-[2rem] shadow-lg text-white text-center">
              <div className="text-3xl sm:text-4xl mb-2">🔥</div>
              <span className="text-3xl sm:text-5xl font-black block">{streak}</span>
              <span className="text-[10px] sm:text-xs font-bold uppercase opacity-80 mt-1 block">{t.streak}</span>
              <span className="text-[9px] opacity-60 font-bold">
                {streak === 0 ? t.streakStart : streak === 1 ? t.streakOne : t.streakMany(streak)}
              </span>
            </div>
            <div className="bg-gradient-to-br from-emerald-400 to-teal-500 p-5 sm:p-8 rounded-[2rem] shadow-lg text-white text-center">
              <div className="text-3xl sm:text-4xl mb-2">📅</div>
              <span className="text-3xl sm:text-5xl font-black block">{todayCount}</span>
              <span className="text-[10px] sm:text-xs font-bold uppercase opacity-80 mt-1 block">{t.todayActivity}</span>
              <span className="text-[9px] opacity-60 font-bold">
                {todayCount === 0 ? t.todayNone : todayCount >= 3 ? t.todayGreat : t.todayContinue}
              </span>
            </div>
            <div className="bg-gradient-to-br from-violet-400 to-purple-600 p-5 sm:p-8 rounded-[2rem] shadow-lg text-white text-center">
              <div className="text-3xl sm:text-4xl mb-2">⚡</div>
              <span className="text-3xl sm:text-5xl font-black block">{totalActivities}</span>
              <span className="text-[10px] sm:text-xs font-bold uppercase opacity-80 mt-1 block">{t.totalActivity}</span>
              <span className="text-[9px] opacity-60 font-bold">{t.allTime}</span>
            </div>
            <div className="bg-gradient-to-br from-blue-400 to-cyan-500 p-5 sm:p-8 rounded-[2rem] shadow-lg text-white text-center">
              <div className="text-3xl sm:text-4xl mb-2">🎯</div>
              <span className="text-3xl sm:text-5xl font-black block">
                {Math.round(((quizDetails.totalCorrect + writingDetails.totalCorrect) /
                  Math.max(1, quizDetails.totalCorrect + quizDetails.totalWrong + writingDetails.totalCorrect + writingDetails.totalWrong)) * 100)}%
              </span>
              <span className="text-[10px] sm:text-xs font-bold uppercase opacity-80 mt-1 block">{t.overallSuccess}</span>
              <span className="text-[9px] opacity-60 font-bold">{t.quizWriting}</span>
            </div>
          </div>

          {/* Daily goal progress */}
          <div className="col-span-1 md:col-span-3 bg-white p-5 sm:p-8 rounded-[2rem] shadow-lg border border-slate-100">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center text-xl shrink-0">🎯</div>
                <div>
                  <h4 className="font-black text-slate-800 text-sm sm:text-base">{t.dailyGoalTitle}</h4>
                  <p className="text-[10px] sm:text-xs text-slate-400 font-bold">{t.dailyGoalSub}</p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-2xl font-black text-slate-800">{todayCount}</span>
                <span className="text-slate-400 font-bold text-sm"> / {dailyGoal}</span>
              </div>
            </div>
            <div className="h-4 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-amber-400 to-orange-500 rounded-full transition-all duration-700"
                style={{ width: `${Math.min(100, (todayCount / dailyGoal) * 100)}%` }}
              />
            </div>
            <p className="text-[10px] sm:text-xs text-slate-400 font-bold mt-2 text-right">
              {todayCount >= dailyGoal ? t.goalReached : t.activitiesLeft(Math.max(0, dailyGoal - todayCount))}
            </p>
          </div>

          {/* 7-day activity trend */}
          <div className="col-span-1 md:col-span-3 bg-white p-5 sm:p-8 rounded-[2rem] shadow-lg border border-slate-100">
            <h4 className="font-black text-slate-800 text-sm sm:text-base mb-4 sm:mb-6 flex items-center space-x-2">
              <span>📈</span>
              <span>{t.trendTitle}</span>
            </h4>
            <div className="flex items-end justify-between gap-2 h-28 sm:h-36">
              {last7Days.map((day, i) => (
                <div key={i} className="flex-1 flex flex-col items-center justify-end gap-1">
                  <span className="text-[10px] sm:text-xs font-black text-slate-500">{day.count > 0 ? day.count : ''}</span>
                  <div
                    className={`w-full rounded-t-lg transition-all duration-700 ${day.isToday ? 'bg-gradient-to-t from-indigo-600 to-indigo-400' : 'bg-gradient-to-t from-slate-300 to-slate-200'}`}
                    style={{ height: day.count === 0 ? '4px' : `${Math.round((day.count / maxDayCount) * 100)}%` }}
                  />
                  <span className={`text-[9px] sm:text-[10px] font-black ${day.isToday ? 'text-indigo-600' : 'text-slate-400'}`}>{day.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Hardest words (spaced repetition) */}
          <div className="col-span-1 md:col-span-3 bg-white p-5 sm:p-8 rounded-[2rem] shadow-lg border border-slate-100">
            <h4 className="font-black text-slate-800 text-sm sm:text-base mb-1 flex items-center space-x-2">
              <span>🔥</span>
              <span>{t.hardWords}</span>
            </h4>
            <p className="text-[10px] sm:text-xs text-slate-400 font-bold mb-4">{t.hardWordsSub}</p>
            {hardWords.length === 0 ? (
              <p className="text-slate-400 text-xs sm:text-sm font-medium text-center py-4">{t.hardWordsNone}</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                {hardWords.map(({ item, score }) => (
                  <div key={item.id} className="flex items-center justify-between bg-slate-50 rounded-xl px-4 py-2.5 border border-slate-100">
                    <div className="min-w-0">
                      <span className="font-black text-slate-800 text-sm truncate block">{item.word}</span>
                      <span className="text-indigo-500 font-bold text-xs truncate block">{item.meaning}</span>
                    </div>
                    <div className="flex shrink-0 ml-2">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <span key={i} className={`text-base ${i < score ? 'text-orange-400' : 'text-slate-200'}`}>🔥</span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Flashcard count */}
          <div className="bg-white p-6 sm:p-10 rounded-[2rem] sm:rounded-[3rem] shadow-lg border border-slate-100 flex flex-col items-center text-center h-[260px] sm:h-[380px]">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-purple-50 rounded-xl sm:rounded-2xl flex items-center justify-center text-2xl sm:text-3xl shrink-0">📚</div>
            <h4 className="font-black text-slate-800 mt-2 sm:mt-4 shrink-0 text-sm sm:text-base">{t.flashcards}</h4>
            <div className="flex-1 flex items-center justify-center w-full">
              <div className="text-5xl sm:text-7xl font-black text-purple-600">{flashcardCount.toLocaleString('tr-TR')}</div>
            </div>
            <span className="text-[10px] sm:text-xs font-bold text-purple-300 uppercase">{t.flashcardsUnit}</span>
          </div>

          {/* Quiz rate */}
          <div className="bg-white p-6 sm:p-10 rounded-[2rem] sm:rounded-[3rem] shadow-lg border border-slate-100 flex flex-col items-center text-center h-[260px] sm:h-[380px]">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-green-50 rounded-xl sm:rounded-2xl flex items-center justify-center text-2xl sm:text-3xl shrink-0">🎓</div>
            <h4 className="font-black text-slate-800 mt-2 sm:mt-4 shrink-0 text-sm sm:text-base">{t.quizRate}</h4>
            <div className="flex-1 flex items-center justify-center w-full">
              <div className="relative w-24 h-24 sm:w-32 sm:h-32 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
                  <circle cx="60" cy="60" r={radius} stroke="currentColor" strokeWidth="10" fill="transparent" className="text-slate-100" />
                  <circle cx="60" cy="60" r={radius} stroke="currentColor" strokeWidth="10" fill="transparent" strokeDasharray={circumference} strokeDashoffset={circumference - (circumference * calculatePerformance('quiz')) / 100} strokeLinecap="round" className="text-green-500 transition-all duration-1000 ease-out" />
                </svg>
                <span className="absolute text-xl sm:text-2xl font-black text-green-600">%{calculatePerformance('quiz')}</span>
              </div>
            </div>
            <div className="shrink-0 w-full pt-4 sm:pt-6 border-t border-slate-50 mt-auto">
              <span className="text-[10px] sm:text-xs font-black text-green-700">{quizDetails.totalCorrect.toLocaleString('tr-TR')} ✓</span>
            </div>
          </div>

          {/* Writing rate */}
          <div className="bg-white p-6 sm:p-10 rounded-[2rem] sm:rounded-[3rem] shadow-lg border border-slate-100 flex flex-col items-center text-center h-[260px] sm:h-[380px]">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-blue-50 rounded-xl sm:rounded-2xl flex items-center justify-center text-2xl sm:text-3xl shrink-0">✍️</div>
            <h4 className="font-black text-slate-800 mt-2 sm:mt-4 shrink-0 text-sm sm:text-base">{t.writingRate}</h4>
            <div className="flex-1 flex items-center justify-center w-full">
              <div className="relative w-24 h-24 sm:w-32 sm:h-32 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
                  <circle cx="60" cy="60" r={radius} stroke="currentColor" strokeWidth="10" fill="transparent" className="text-slate-100" />
                  <circle cx="60" cy="60" r={radius} stroke="currentColor" strokeWidth="10" fill="transparent" strokeDasharray={circumference} strokeDashoffset={circumference - (circumference * calculatePerformance('writing')) / 100} strokeLinecap="round" className="text-blue-500 transition-all duration-1000 ease-out" />
                </svg>
                <span className="absolute text-xl sm:text-2xl font-black text-blue-600">%{calculatePerformance('writing')}</span>
              </div>
            </div>
            <div className="shrink-0 w-full pt-4 sm:pt-6 border-t border-slate-50 mt-auto">
              <span className="text-[10px] sm:text-xs font-black text-blue-700">{writingDetails.totalCorrect.toLocaleString('tr-TR')} ✓</span>
            </div>
          </div>

        </div>
      )}
    </div>
  );
};

export default Statistics;
