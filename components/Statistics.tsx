
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

interface DbWordStat {
  word_id: string;
  correct: number;
  wrong: number;
}

const ST = {
  tr: {
    title: 'İstatistikler 📊',
    subtitle: '',
    back: '← Geri Dön',
    globalPool: 'Global Kelime Havuzu',
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
    quizWriting: 'Sınav & Yazma',
    dailyGoalTitle: 'Günlük Hedef',
    dailyGoalSub: 'Bugünkü ilerleme',
    goalReached: '🏆 Hedefe ulaştın!',
    activitiesLeft: (n: number) => `${n} aktivite kaldı`,
    restDay: '💤 Bugün dinlenme günü',
    flashcards: 'Kelime Kartı Çalışması',
    flashcardsUnit: 'kart',
    quizRate: 'Sınav Başarı Oranı',
    writingRate: 'Yazma Doğruluğu',
    trendTitle: '7 Günlük Aktivite',
    today: 'Bugün',
    noActivity: 'Aktivite yok',
    hardWords: 'En Zor Kelimeler',
    hardWordsSub: 'Aralıklı tekrar — hata puanına göre sıralı',
    hardWordsNone: 'Henüz zorluk puanı yok — sınav ve yazma egzersizleri yaptıkça burada görünür.',
    difficulty: 'Zorluk',
    tableError: 'Aktivite verileri yüklenemedi.',
    tableErrorSql: 'Supabase SQL Editörü\'nde aşağıdaki SQL\'i çalıştırın:',
    tableMissing: 'user_activities tablosu bulunamadı.',
    schemaCacheTitle: 'Şema önbelleği yenilenmesi gerekiyor.',
    schemaCacheDesc: 'Tabloları oluşturduktan sonra PostgREST önbelleğini yenileyin. SQL Editörü\'nde şunu çalıştırın:',
    retryBtn: 'Tekrar Dene',
    accuracyLabel: 'Hata Skoru',
    wordAnalyticsTitle: 'DB Kelime Analizi',
    wordAnalyticsSub: 'Tüm cihazlarda birikmiş doğru/yanlış verileri',
    wrongCount: 'yanlış',
    correctCount: 'doğru',
    exportBtn: 'CSV İndir',
    leaderboardTitle: 'En Çok Katkıda Bulunanlar',
    leaderboardSub: 'Kelime havuzuna en fazla kelime ekleyen kullanıcılar',
    leaderboardYou: '(Sen)',
    leaderboardNone: 'Henüz katkı verisi yok.',
  },
  en: {
    title: 'Statistics 📊',
    subtitle: '',
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
    restDay: '💤 Rest day',
    flashcards: 'Flashcard Views',
    flashcardsUnit: 'cards',
    quizRate: 'Quiz Success Rate',
    writingRate: 'Writing Accuracy',
    trendTitle: '7-Day Activity',
    today: 'Today',
    noActivity: 'No activity',
    hardWords: 'Hardest Words',
    hardWordsSub: 'Spaced repetition — sorted by error count',
    hardWordsNone: 'No difficulty data yet — complete quizzes and writing exercises to see results.',
    difficulty: 'Difficulty',
    tableError: 'Could not load activity data.',
    tableErrorSql: 'Run the following SQL in the Supabase SQL Editor:',
    tableMissing: 'user_activities table not found.',
    schemaCacheTitle: 'Schema cache needs a refresh.',
    schemaCacheDesc: 'After creating the tables, reload the PostgREST schema cache. Run this in the SQL Editor:',
    retryBtn: 'Retry',
    accuracyLabel: 'Error Score',
    wordAnalyticsTitle: 'DB Word Analytics',
    wordAnalyticsSub: 'Cumulative correct/wrong data across all devices',
    wrongCount: 'wrong',
    correctCount: 'correct',
    exportBtn: 'Export CSV',
    leaderboardTitle: 'Top Contributors',
    leaderboardSub: 'Users who added the most words to the pool',
    leaderboardYou: '(You)',
    leaderboardNone: 'No contribution data yet.',
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
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS user_study_filters (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  word_types TEXT[] NOT NULL DEFAULT '{}',
  tags TEXT[] NOT NULL DEFAULT '{}',
  favorites_only BOOLEAN NOT NULL DEFAULT FALSE,
  search_term TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, name)
);
ALTER TABLE user_study_filters ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own study filters" ON user_study_filters
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  avatar_url TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public profiles readable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users manage own profile" ON public.profiles FOR ALL USING (auth.uid() = id);

CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email, avatar_url)
  VALUES (new.id, coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)), new.email, new.raw_user_meta_data->>'avatar_url')
  ON CONFLICT (id) DO UPDATE SET name = excluded.name, email = excluded.email, avatar_url = excluded.avatar_url, updated_at = NOW();
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE OR REPLACE FUNCTION public.handle_user_update() RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email, avatar_url)
  VALUES (new.id, coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)), new.email, new.raw_user_meta_data->>'avatar_url')
  ON CONFLICT (id) DO UPDATE SET name = excluded.name, email = excluded.email, avatar_url = excluded.avatar_url, updated_at = NOW();
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users;
CREATE TRIGGER on_auth_user_updated AFTER UPDATE ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_user_update();

INSERT INTO public.profiles (id, name, email, avatar_url)
SELECT id, coalesce(raw_user_meta_data->>'name', split_part(email, '@', 1)), email, raw_user_meta_data->>'avatar_url' FROM auth.users ON CONFLICT (id) DO NOTHING;`;

const Statistics: React.FC<StatisticsProps> = ({ userId, vocabItems, onBack, dailyGoal = 3, lang = 'tr' }) => {
  const [loading, setLoading] = useState(true);
  const [wordStats, setWordStats] = useState({ total: 0, addedByMe: 0 });
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [dbWordStats, setDbWordStats] = useState<DbWordStat[]>([]);
  const [fetchError, setFetchError] = useState<{ type: 'table_missing' | 'schema_cache' | 'unknown'; message: string } | null>(null);
  const [showSql, setShowSql] = useState(false);
  const [sqlCopied, setSqlCopied] = useState(false);
  const [leaderboard, setLeaderboard] = useState<{ user_id: string; word_count: number; name: string }[]>([]);

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
        const isSchemaCache =
          logError.code === 'PGRST200' ||
          logError.message?.includes('schema cache') ||
          logError.message?.toLowerCase().includes('could not find');
        const isMissing =
          logError.code === '42P01' ||
          logError.message?.includes('does not exist');
        setFetchError({
          type: isSchemaCache ? 'schema_cache' : isMissing ? 'table_missing' : 'unknown',
          message: logError.message
        });
        return;
      }
      if (logData) setActivityLogs(logData);

      // Load per-word DB stats (silently ignore if table not yet created)
      const { data: wsData } = await supabase
        .from('user_word_stats')
        .select('word_id, correct, wrong')
        .eq('user_id', userId)
        .order('wrong', { ascending: false })
        .limit(10);
      if (wsData) setDbWordStats(wsData);

      // Leaderboard: count words per user_id and fetch their display names from profiles
      try {
        const { data: lbData } = await supabase
          .from('vocabulary')
          .select('user_id')
          .not('user_id', 'is', null);
        if (lbData) {
          const counts: Record<string, number> = {};
          lbData.forEach((row: any) => {
            if (row.user_id) counts[row.user_id] = (counts[row.user_id] || 0) + 1;
          });
          const sortedUserIds = Object.keys(counts);

          let profilesMap: Record<string, string> = {};
          if (sortedUserIds.length > 0) {
            const { data: profData } = await supabase
              .from('profiles')
              .select('id, name')
              .in('id', sortedUserIds);
            if (profData) {
              profData.forEach((p: any) => {
                profilesMap[p.id] = p.name;
              });
            }
          }

          const sorted = Object.entries(counts)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 10)
            .map(([uid, cnt]) => {
              const displayName = profilesMap[uid] || `#${uid.slice(0, 6)}`;
              return {
                user_id: uid,
                word_count: cnt,
                name: uid === userId
                  ? `${displayName} (${lang === 'tr' ? 'Sen' : 'You'})`
                  : displayName
              };
            });
          setLeaderboard(sorted);
        }
      } catch (e) {
        console.error('Error loading leaderboard:', e);
      }
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

  const exportCSV = () => {
    const header = lang === 'tr'
      ? 'Kelime,Anlam,Kelime Turu EN,Kelime Turu TR,Ornek Cumle,Ornek Cumle TR\n'
      : 'Word,Meaning,Type EN,Type TR,Example Sentence,Example TR\n';
    const rows = vocabItems.map(v =>
      [v.word, v.meaning, v.wordTypeEn, v.wordTypeTr,
       v.exampleSentence.replace(/,/g, ';'),
       v.exampleSentenceTurkish.replace(/,/g, ';')]
        .map(s => `"${(s || '').replace(/"/g, '""')}"`).join(',')
    ).join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `super-word-buddy-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
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
          {t.subtitle && <p className="text-slate-400 font-bold text-xs sm:text-lg uppercase tracking-[0.2em] sm:tracking-[0.3em]">{t.subtitle}</p>}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={exportCSV}
            className="text-[10px] sm:text-xs font-black text-indigo-500 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-100 px-3 py-1.5 rounded-xl transition-all uppercase tracking-wide"
          >
            {t.exportBtn}
          </button>
          <button onClick={onBack} className="text-slate-400 font-bold hover:text-slate-600 uppercase tracking-widest text-xs sm:text-sm">
            {t.back}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-12 h-12 sm:w-16 sm:h-16 border-4 sm:border-8 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-8">

          {/* Error banner */}
          {fetchError && (
            <div className="col-span-1 md:col-span-3 bg-amber-50 border-2 border-amber-200 p-5 sm:p-6 rounded-[2rem] space-y-3">
              <div className="flex items-center space-x-3">
                <span className="text-2xl">{fetchError.type === 'schema_cache' ? '🔄' : '⚠️'}</span>
                <div>
                  <p className="font-black text-amber-800 text-sm sm:text-base">
                    {fetchError.type === 'schema_cache'
                      ? t.schemaCacheTitle
                      : fetchError.type === 'table_missing'
                      ? t.tableMissing
                      : t.tableError}
                  </p>
                  <p className="text-amber-600 text-[10px] font-medium mt-0.5 break-all">{fetchError.message}</p>
                </div>
              </div>

              {fetchError.type === 'schema_cache' ? (
                <>
                  <p className="text-amber-700 text-xs sm:text-sm font-bold">{t.schemaCacheDesc}</p>
                  <pre className="bg-slate-900 text-green-400 px-4 py-3 rounded-xl text-xs font-mono select-all">
                    {"NOTIFY pgrst, 'reload schema';"}
                  </pre>
                  <p className="text-amber-600 text-[10px] font-medium">
                    {lang === 'tr'
                      ? 'Bu komutu çalıştırdıktan sonra "Tekrar Dene"ye tıklayın. Birkaç saniye beklemeniz gerekebilir.'
                      : 'After running this command, click "Retry". You may need to wait a few seconds.'}
                  </p>
                </>
              ) : (
                <>
                  <p className="text-amber-700 text-xs sm:text-sm font-bold">{t.tableErrorSql}</p>
                  <div className="flex flex-wrap items-center gap-2">
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
                </>
              )}

              <button
                onClick={fetchData}
                className="w-full py-2 bg-green-600 text-white rounded-xl font-black text-xs hover:bg-green-700 transition-colors"
              >
                🔄 {t.retryBtn}
              </button>
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
                {dailyGoal === 0 ? (
                  <span className="text-lg">💤</span>
                ) : (
                  <>
                    <span className="text-2xl font-black text-slate-800">{todayCount}</span>
                    <span className="text-slate-400 font-bold text-sm"> / {dailyGoal}</span>
                  </>
                )}
              </div>
            </div>
            {dailyGoal === 0 ? (
              <p className="text-sm font-black text-slate-400 text-center py-2">{t.restDay}</p>
            ) : (
              <>
                <div className="h-4 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-amber-400 to-orange-500 rounded-full transition-all duration-700"
                    style={{ width: `${Math.min(100, (todayCount / dailyGoal) * 100)}%` }}
                  />
                </div>
                <p className="text-[10px] sm:text-xs text-slate-400 font-bold mt-2 text-right">
                  {todayCount >= dailyGoal ? t.goalReached : t.activitiesLeft(Math.max(0, dailyGoal - todayCount))}
                </p>
              </>
            )}
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
              <div className="space-y-2 sm:space-y-3">
                {hardWords.map(({ item, score }, rank) => {
                  const pct = Math.round((score / 5) * 100);
                  const barColor = score >= 4 ? 'from-red-500 to-orange-400' : score >= 3 ? 'from-orange-400 to-amber-300' : 'from-amber-300 to-yellow-300';
                  return (
                    <div key={item.id} className="flex items-center gap-3 bg-slate-50 rounded-xl px-3 sm:px-4 py-2.5 border border-slate-100">
                      <span className="text-[10px] font-black text-slate-400 w-5 shrink-0 text-right">#{rank + 1}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline justify-between mb-1">
                          <div className="min-w-0 mr-2">
                            <span className="font-black text-slate-800 text-sm truncate block">{item.word}</span>
                            <span className="text-indigo-500 font-bold text-[10px] sm:text-xs truncate block">{item.meaning}</span>
                          </div>
                          <span className="shrink-0 text-[10px] font-black text-orange-500 whitespace-nowrap">{pct}%</span>
                        </div>
                        <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full bg-gradient-to-r ${barColor} rounded-full transition-all duration-700`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                      <div className="shrink-0 text-[10px] font-black text-slate-400">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <span key={i} className={i < score ? 'text-orange-400' : 'text-slate-200'}>🔥</span>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* DB word analytics */}
          {dbWordStats.length > 0 && (
            <div className="col-span-1 md:col-span-3 bg-white p-5 sm:p-8 rounded-[2rem] shadow-lg border border-slate-100">
              <h4 className="font-black text-slate-800 text-sm sm:text-base mb-1 flex items-center space-x-2">
                <span>📊</span>
                <span>{t.wordAnalyticsTitle}</span>
              </h4>
              <p className="text-[10px] sm:text-xs text-slate-400 font-bold mb-4">{t.wordAnalyticsSub}</p>
              <div className="space-y-2 sm:space-y-3">
                {dbWordStats.map(({ word_id, correct, wrong }) => {
                  const item = vocabItems.find(v => v.id === word_id);
                  if (!item) return null;
                  const total = correct + wrong;
                  const wrongRate = total > 0 ? Math.round((wrong / total) * 100) : 0;
                  const barColor =
                    wrongRate >= 60 ? 'from-red-500 to-orange-400' :
                    wrongRate >= 40 ? 'from-orange-400 to-amber-300' :
                    'from-amber-300 to-yellow-300';
                  return (
                    <div key={word_id} className="flex items-center gap-3 bg-slate-50 rounded-xl px-3 sm:px-4 py-2.5 border border-slate-100">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline justify-between mb-1">
                          <div className="min-w-0 mr-2">
                            <span className="font-black text-slate-800 text-sm truncate block">{item.word}</span>
                            <span className="text-indigo-500 font-bold text-[10px] sm:text-xs truncate block">{item.meaning}</span>
                          </div>
                          <span className="shrink-0 text-[10px] font-black text-orange-500 whitespace-nowrap">{wrongRate}%</span>
                        </div>
                        <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full bg-gradient-to-r ${barColor} rounded-full transition-all duration-700`}
                            style={{ width: `${wrongRate}%` }}
                          />
                        </div>
                      </div>
                      <div className="shrink-0 text-right min-w-[36px]">
                        <span className="text-[10px] font-black text-red-400 block">{wrong} {t.wrongCount}</span>
                        <span className="text-[10px] font-black text-green-500 block">{correct} {t.correctCount}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

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

          {/* Leaderboard */}
          {leaderboard.length > 0 && (
            <div className="col-span-1 md:col-span-3 bg-white p-5 sm:p-8 rounded-[2rem] shadow-lg border border-slate-100">
              <h4 className="font-black text-slate-800 text-sm sm:text-base mb-1 flex items-center space-x-2">
                <span>🏆</span>
                <span>{t.leaderboardTitle}</span>
              </h4>
              <p className="text-[10px] sm:text-xs text-slate-400 font-bold mb-4">{t.leaderboardSub}</p>
              <div className="space-y-2">
                {leaderboard.map(({ user_id, word_count, name }, rank) => {
                  const isMe = user_id === userId;
                  const medal = rank === 0 ? '🥇' : rank === 1 ? '🥈' : rank === 2 ? '🥉' : null;
                  return (
                    <div key={user_id} className={`flex items-center gap-3 rounded-xl px-3 sm:px-4 py-2.5 border ${isMe ? 'bg-indigo-50 border-indigo-200' : 'bg-slate-50 border-slate-100'}`}>
                      <span className="text-base font-black w-7 text-center shrink-0">
                        {medal ?? `#${rank + 1}`}
                      </span>
                      <div className="flex-1 min-w-0">
                        <span className={`font-black text-sm truncate block ${isMe ? 'text-indigo-700' : 'text-slate-700'}`}>
                          {name}{isMe && <span className="ml-1 text-[10px] text-indigo-400 font-bold">{t.leaderboardYou}</span>}
                        </span>
                      </div>
                      <span className={`shrink-0 font-black text-sm ${isMe ? 'text-indigo-600' : 'text-slate-500'}`}>
                        {word_count.toLocaleString('tr-TR')} 📚
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        </div>
      )}
    </div>
  );
};

export default Statistics;
