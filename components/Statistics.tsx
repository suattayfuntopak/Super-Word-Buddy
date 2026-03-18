
import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';
import { VocabularyItem } from '../types';

interface StatisticsProps {
  userId: string;
  vocabItems: VocabularyItem[];
}

interface ActivityLog {
  activity_type: string;
  score: number;
  total_items: number;
  created_at: string;
}

const Statistics: React.FC<StatisticsProps> = ({ userId, vocabItems }) => {
  const [loading, setLoading] = useState(true);
  const [wordStats, setWordStats] = useState({
    total: 0,
    addedByMe: 0
  });
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);

  useEffect(() => {
    if (userId) {
      fetchData();
    }
  }, [userId, vocabItems]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Kesin toplam sayı sorgusu
      const { count: totalCount } = await supabase
        .from('vocabulary')
        .select('*', { count: 'exact', head: true });
      
      // 2. Kullanıcının ekledikleri için limitleri aşan döngülü çekim
      let addedCount = 0;
      let from = 0;
      let to = 999;
      let finished = false;
      while (!finished) {
        const { data } = await supabase
          .from('vocabulary')
          .select('id')
          .eq('user_id', userId)
          .range(from, to);
        if (data && data.length > 0) {
          addedCount += data.length;
          if (data.length < 1000) finished = true;
          else { from += 1000; to += 1000; }
        } else finished = true;
      }
        
      setWordStats({
        total: totalCount || vocabItems.length,
        addedByMe: addedCount
      });

      // 3. Kullanıcı aktiviteleri
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
    const totalWrong = totalItems - totalCorrect;
    return { totalCorrect, totalWrong };
  };

  const quizDetails = getDetails('quiz');
  const writingDetails = getDetails('writing');
  const flashcardCount = activityLogs.filter(l => l.activity_type === 'flashcards').reduce((acc, curr) => acc + curr.total_items, 0);

  const radius = 45;
  const circumference = 2 * Math.PI * radius;

  return (
    <div className="max-w-5xl mx-auto w-full space-y-8 sm:space-y-12 animate-in fade-in zoom-in-95 duration-500 pb-24 px-4">
      <div className="text-center space-y-2 sm:space-y-4">
        <h2 className="text-3xl sm:text-5xl font-black text-slate-800 tracking-tight">İstatistikler 📊</h2>
        <p className="text-slate-400 font-bold text-xs sm:text-lg uppercase tracking-[0.2em] sm:tracking-[0.3em]">Senin Başarı Panelin</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-12 h-12 sm:w-16 sm:h-16 border-4 sm:border-8 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-8">
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

          <div className="bg-white p-6 sm:p-10 rounded-[2rem] sm:rounded-[3rem] shadow-lg border border-slate-100 flex flex-col items-center text-center h-[300px] sm:h-[450px]">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-purple-50 rounded-xl sm:rounded-2xl flex items-center justify-center text-2xl sm:text-3xl shrink-0">📚</div>
            <h4 className="font-black text-slate-800 mt-2 sm:mt-4 shrink-0 text-sm sm:text-base">Flashcards</h4>
            <div className="flex-1 flex items-center justify-center w-full">
              <div className="text-5xl sm:text-7xl font-black text-purple-600">{flashcardCount.toLocaleString('tr-TR')}</div>
            </div>
          </div>

          <div className="bg-white p-6 sm:p-10 rounded-[2rem] sm:rounded-[3rem] shadow-lg border border-slate-100 flex flex-col items-center text-center h-[300px] sm:h-[450px]">
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

          <div className="bg-white p-6 sm:p-10 rounded-[2rem] sm:rounded-[3rem] shadow-lg border border-slate-100 flex flex-col items-center text-center h-[300px] sm:h-[450px]">
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
