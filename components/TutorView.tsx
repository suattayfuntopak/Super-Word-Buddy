
import React from 'react';

interface TutorViewProps {
  onBack: () => void;
}

const TutorView: React.FC<TutorViewProps> = ({ onBack }) => {
  return (
    <div className="flex flex-col items-center w-full max-w-4xl mx-auto space-y-8 sm:space-y-12 animate-in fade-in slide-in-from-bottom-6 duration-500 pb-20 px-4">
      <div className="w-full flex flex-col sm:flex-row justify-between items-center bg-white p-6 rounded-[2rem] sm:rounded-[2.5rem] shadow-sm border border-slate-100 gap-4">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 sm:w-14 sm:h-14 bg-indigo-100 rounded-xl sm:rounded-2xl flex items-center justify-center text-2xl sm:text-3xl">🤖</div>
          <div className="flex flex-col">
            <h2 className="text-xl sm:text-3xl font-black text-slate-800 tracking-tight leading-none">Auto Word Trainer</h2>
            <span className="text-[10px] sm:text-xs font-black text-indigo-500 uppercase tracking-widest mt-1">Sana Özel Otomatik Eğitmen</span>
          </div>
        </div>
        <button
          onClick={onBack}
          className="text-slate-400 font-bold hover:text-slate-600 uppercase tracking-widest text-xs sm:text-sm"
        >
          ← Geri Dön
        </button>
      </div>

      <div className="bg-white p-8 sm:p-12 rounded-[2.5rem] sm:rounded-[4rem] shadow-2xl border-4 border-white text-center space-y-6 sm:space-y-8 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-400 via-indigo-500 to-purple-600"></div>

        <div className="space-y-4 sm:space-y-6">
          <h3 className="text-2xl sm:text-3xl font-black text-slate-800">Sürekli Gelişim İçin Tasarlandı! 🚀</h3>
          <p className="text-base sm:text-xl text-slate-600 font-medium leading-relaxed italic max-w-2xl mx-auto">
            'Her 15 dakikada bir sana bir İngilizce kelime sorar, sen tahmin etmeye çalışırsın, 1 dakika sonra sana Türkçe anlamını, İngilizce ve Türkçe örnek cümleleriyle verir. Dilediğin zaman <span className="text-indigo-600 font-black">/pause</span> yapar, dilediğin zaman <span className="text-indigo-600 font-black">/resume</span> yaparak çalışmaya devam eder ve dilediğin zaman <span className="text-indigo-600 font-black">/stats</span> yazarak ne aşamada olduğunu gözlemlersin!'
          </p>
        </div>

        <div className="pt-4 sm:pt-6">
          <a
            href="https://t.me/English_Reminder_For_All_bot"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center space-x-4 bg-[#0088cc] hover:bg-[#0077b5] text-white px-6 sm:px-10 py-4 sm:py-5 rounded-2xl sm:rounded-[2.5rem] font-black text-base sm:text-xl transition-all shadow-xl hover:scale-105 active:scale-95 group"
          >
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-white/20 rounded-full flex items-center justify-center group-hover:rotate-12 transition-transform">
              <svg viewBox="0 0 24 24" className="w-5 h-5 sm:w-6 sm:h-6 fill-current" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69.01-.03.01-.14-.07-.2-.08-.06-.19-.04-.27-.02-.12.02-1.96 1.25-5.54 3.69-.52.36-.99.53-1.41.52-.46-.01-1.35-.26-2.01-.48-.81-.27-1.45-.42-1.39-.89.03-.24.37-.49 1.02-.74 4-1.74 6.67-2.88 8.01-3.43 3.81-1.58 4.6-1.85 5.12-1.86.11 0 .37.03.54.17.14.12.18.28.19.4z" />
              </svg>
            </div>
            <span>Tıkla ve Tanış!</span>
          </a>
        </div>

        <div className="pt-4 sm:pt-6 flex flex-wrap justify-center gap-2 sm:gap-4">
          <span className="px-3 py-1 bg-slate-50 rounded-full text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest">Telegram Bot</span>
          <span className="px-3 py-1 bg-slate-50 rounded-full text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest">7/24 Aktif</span>
          <span className="px-3 py-1 bg-slate-50 rounded-full text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest">Hızlı Öğrenme</span>
        </div>
      </div>

      <div className="text-center">
        <p className="text-slate-400 text-[10px] sm:text-xs font-bold italic">
          Not: Bot yardımıyla akademik kelimeleri mobil cihazından zahmetsizce öğrenebilirsin. 🚀
        </p>
      </div>
    </div>
  );
};

export default TutorView;
