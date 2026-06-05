
import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';
import { VocabularyItem } from '../types';
import type { Lang } from '../utils/i18n';

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

const Statistics: React.FC<StatisticsProps> = ({ userId, vocabItems, onBack, dailyGoal = 3, lang = 'tr' }) => {
  const [loading, setLoading] = useState(true);
  const [wordStats, setWordStats] = useState({ total: 0, addedByMe: 0 });
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);

  useEffect(() => {
    if (userId) fetchData();
  }, [userId, vocabItems]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { count: totalCount } = await supabase
        .from('vocabulary')
        .select('*', { count: 'exact', head: true });

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

      if (logError) throw logError;
      if (logData) setActivityLogs(logData);
    } catch (err) {
      console.error('İstatistikler getirilirken hata oluştu:', err);
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
    activityLogs.forEach(log => {
      activeDays.add(new Date(log.created_at).toISOString().split('T')[0]);
    });
    let streak = 0;
    const checkDate = new Date();
    checkDate.setHours(0, 0, 0, 0);
    while (true) {
      const dateStr = checkDate.toISOString().split('T')[0];
      if (activeDays.has(dateStr)) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else break;
    }
    return streak;
  };

  const todayActivityCount = (): number => {
    const today = new Date().toISOString().split('T')[0];
    return activityLogs.filter(log => log.created_at.startsWith(today)).length;
  };

  const totalActivities = activityLogs.length;
  const streak = calculateStreak();
  const todayCount = todayActivityCount();

  const quizDetails = getDetails('quiz');
  const writingDetails = getDetails('writing');
  const flashcardCount = activityLogs
    .filter(l => l.activity_type === 'flashcards')
    .reduce((acc, curr) => acc + curr.total_items, 0);

  const radius = 45;
  const circumference = 2 * Math.PI * radius;

  return (
    <div className="max-w-5xl mx-auto w-full space-y-8 sm:space-y-12 animate-in fade-in zoom-in-95 duration-500 pb-24 px-4">
      <div className="flex justify-between items-center">
        <div className="space-y-1">
          <h2 className="text-3xl sm:text-5xl font-black text-slate-800 tracking-tight">İstatistikler 📊</h2>
          <p className="text-slate-400 font-bold text-xs sm:text-lg uppercase tracking-[0.2em] sm:tracking-[0.3em]">Senin Başarı Panelin</p>
        </div>
        <button onClick={onBack} className="text-slate-400 font-bold hover:text-slate-600 uppercase tracking-widest text-xs sm:text-sm">
          ← Geri Dön
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-12 h-12 sm:w-16 sm:h-16 border-4 sm:border-8 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-8">

          {/* Global pool */}
          <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 p-6 sm:p-10 rounded-[2rem] sm:rounded-[3rem] shadow-2xl text-white flex flex-col items-center text-center col-span-1 md:col-span-3">
            <h3 className="font-black text-[10px] sm:text-xs uppercase tracking-widest mb-4 sm:mb-6 opacity-60">Global Havuz Durumu</h3>
            <div className="flex items-center space-x-8 sm:space-x-24">
              <div className="text-center">
                <span className="text-4xl sm:text-7xl font-black block">{wordStats.total.toLocaleString('tr-TR')}</span>
                <span className="text-[10px] sm:text-xs font-bold uppercase opacity-60">Toplam Kelime</span>
              </div>
              <div className="h-10 sm:h-16 w-px bg-white/20"></div>
              <div className="text-center">
                <span className="text-4xl sm:text-7xl font-black block text-orange-400">{wordStats.addedByMe.toLocaleString('tr-TR')}</span>
                <span className="text-[10px] sm:text-xs font-bold uppercase opacity-60">Senin Katkın</span>
              </div>
            </div>
          </div>

          {/* Streak + Daily */}
          <div className="col-span-1 md:col-span-3 grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-orange-400 to-red-500 p-5 sm:p-8 rounded-[2rem] shadow-lg text-white text-center">
              <div className="text-3xl sm:text-4xl mb-2">🔥</div>
              <span className="text-3xl sm:text-5xl font-black block">{streak}</span>
              <span className="text-[10px] sm:text-xs font-bold uppercase opacity-80 mt-1 block">Günlük Seri</span>
              <span className="text-[9px] opacity-60 font-bold">
                {streak === 0 ? 'Bugün başla!' : streak === 1 ? 'Harika başlangıç' : `${streak} gün üst üste`}
              </span>
            </div>
            <div className="bg-gradient-to-br from-emerald-400 to-teal-500 p-5 sm:p-8 rounded-[2rem] shadow-lg text-white text-center">
              <div className="text-3xl sm:text-4xl mb-2">📅</div>
              <span className="text-3xl sm:text-5xl font-black block">{todayCount}</span>
              <span className="text-[10px] sm:text-xs font-bold uppercase opacity-80 mt-1 block">Bugünkü Aktivite</span>
              <span className="text-[9px] opacity-60 font-bold">
                {todayCount === 0 ? 'Henüz çalışmadın' : todayCount >= 3 ? 'Süper gün! 🚀' : 'Devam et!'}
              </span>
            </div>
            <div className="bg-gradient-to-br from-violet-400 to-purple-600 p-5 sm:p-8 rounded-[2rem] shadow-lg text-white text-center">
              <div className="text-3xl sm:text-4xl mb-2">⚡</div>
              <span className="text-3xl sm:text-5xl font-black block">{totalActivities}</span>
              <span className="text-[10px] sm:text-xs font-bold uppercase opacity-80 mt-1 block">Toplam Aktivite</span>
              <span className="text-[9px] opacity-60 font-bold">Tüm zamanlar</span>
            </div>
            <div className="bg-gradient-to-br from-blue-400 to-cyan-500 p-5 sm:p-8 rounded-[2rem] shadow-lg text-white text-center">
              <div className="text-3xl sm:text-4xl mb-2">🎯</div>
              <span className="text-3xl sm:text-5xl font-black block">
                {Math.round(((quizDetails.totalCorrect + writingDetails.totalCorrect) /
                  Math.max(1, quizDetails.totalCorrect + quizDetails.totalWrong + writingDetails.totalCorrect + writingDetails.totalWrong)) * 100)}%
              </span>
              <span className="text-[10px] sm:text-xs font-bold uppercase opacity-80 mt-1 block">Genel Başarı</span>
              <span className="text-[9px] opacity-60 font-bold">Quiz + Yazma</span>
            </div>
          </div>

          {/* Daily goal progress */}
          <div className="col-span-1 md:col-span-3 bg-white p-5 sm:p-8 rounded-[2rem] shadow-lg border border-slate-100">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center text-xl">🎯</div>
                <div>
                  <h4 className="font-black text-slate-800 text-sm sm:text-base">{lang === 'tr' ? 'Günlük Hedef' : 'Daily Goal'}</h4>
                  <p className="text-[10px] sm:text-xs text-slate-400 font-bold">{lang === 'tr' ? 'Bugünkü ilerleme' : "Today's progress"}</p>
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
              {todayCount >= dailyGoal
                ? (lang === 'tr' ? '🏆 Hedefe ulaştın!' : '🏆 Goal reached!')
                : lang === 'tr'
                  ? `${dailyGoal - todayCount} aktivite kaldı`
                  : `${dailyGoal - todayCount} activities to go`}
            </p>
          </div>

          {/* Flashcard count */}
          <div className="bg-white p-6 sm:p-10 rounded-[2rem] sm:rounded-[3rem] shadow-lg border border-slate-100 flex flex-col items-center text-center h-[260px] sm:h-[380px]">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-purple-50 rounded-xl sm:rounded-2xl flex items-center justify-center text-2xl sm:text-3xl shrink-0">📚</div>
            <h4 className="font-black text-slate-800 mt-2 sm:mt-4 shrink-0 text-sm sm:text-base">Flashcard Görüntüleme</h4>
            <div className="flex-1 flex items-center justify-center w-full">
              <div className="text-5xl sm:text-7xl font-black text-purple-600">{flashcardCount.toLocaleString('tr-TR')}</div>
            </div>
            <span className="text-[10px] sm:text-xs font-bold text-purple-300 uppercase">kart</span>
          </div>

          {/* Quiz rate */}
          <div className="bg-white p-6 sm:p-10 rounded-[2rem] sm:rounded-[3rem] shadow-lg border border-slate-100 flex flex-col items-center text-center h-[260px] sm:h-[380px]">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-green-50 rounded-xl sm:rounded-2xl flex items-center justify-center text-2xl sm:text-3xl shrink-0">🎓</div>
            <h4 className="font-black text-slate-800 mt-2 sm:mt-4 shrink-0 text-sm sm:text-base">Test Başarı Oranı</h4>
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
            <h4 className="font-black text-slate-800 mt-2 sm:mt-4 shrink-0 text-sm sm:text-base">Yazma Doğruluğu</h4>
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
