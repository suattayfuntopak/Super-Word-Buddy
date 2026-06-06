
import React, { useState, useEffect } from 'react';
import { QuizQuestion, QuizOption } from '../types';
import { speak } from '../utils/speak';

interface QuizProps {
  questions: QuizQuestion[];
  lang?: 'tr' | 'en';
  onClose: (score: number, total: number, wrongWordStrings: string[]) => void;
  onPracticeWrong?: (score: number, total: number, wrongWordStrings: string[]) => void;
}

const T = {
  tr: {
    preparing: 'Sorular Hazırlanıyor...',
    preparingDesc: 'Kelimeler akıllı algoritmaya göre seçiliyor',
    question: 'SORU',
    score: 'SKOR',
    kbHint: 'A–E tuşları ile seç · Enter / Space ile ilerle',
    listenUK: 'Listen (UK)',
    listenUS: 'Listen (US)',
    meaning: 'Anlamı',
    close: 'Kapat ✕',
    next: (isLast: boolean) => isLast ? 'Sonucu Gör ✨' : 'Sıradaki Soru 🚀',
    back: 'Havuz Seçimine Dön',
    reviewTitle: 'Gözden Geçirilecekler',
    successRate: 'Başarı Oranın',
    msgPerfect: 'Mükemmelsin! Şampiyon! 🏆',
    msgGreat: 'Harika gidiyorsun! 🎉',
    msgPoor: 'Biraz daha çalışalım mı? 🧸',
    poolDesc: 'Havuzdaki kelimeleri iyice kavramışsın!',
    autoSpeak: 'Sesli',
    practiceWrong: '🔁 Yanlışları Flashcard\'la Çalış',
  },
  en: {
    preparing: 'Preparing Questions...',
    preparingDesc: 'Words are being selected by the smart algorithm',
    question: 'QUESTION',
    score: 'SCORE',
    kbHint: 'Select with A–E · Enter / Space to advance',
    listenUK: 'Listen (UK)',
    listenUS: 'Listen (US)',
    meaning: 'Meaning',
    close: 'Close ✕',
    next: (isLast: boolean) => isLast ? 'See Results ✨' : 'Next Question 🚀',
    back: 'Back to Menu',
    reviewTitle: 'Review These',
    successRate: 'Your Score',
    msgPerfect: "You're perfect! Champion! 🏆",
    msgGreat: "You're doing great! 🎉",
    msgPoor: 'Need more practice? 🧸',
    poolDesc: "You know the words in the pool well!",
    autoSpeak: 'Audio',
    practiceWrong: '🔁 Flashcard Wrong Words',
  },
};

const Quiz: React.FC<QuizProps> = ({ questions, lang = 'tr', onClose, onPracticeWrong }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [activeMeaningIdx, setActiveMeaningIdx] = useState<number | null>(null);
  const [wrongWords, setWrongWords] = useState<string[]>([]);
  const [autoSpeak, setAutoSpeak] = useState(() => localStorage.getItem('swb_quiz_autoSpeak') === 'true');

  const t = T[lang];

  const readableQuestion = (q: string) => q.replace(/_+/g, 'bla bla');

  const isCorrectAnswer = (optionText: string, correct: string) =>
    optionText.trim().toLowerCase() === correct.trim().toLowerCase();

  const handleAnswer = (option: QuizOption) => {
    if (isAnswered) return;
    setSelectedOption(option.text);
    setIsAnswered(true);
    if (isCorrectAnswer(option.text, questions[currentIndex].correctAnswer)) {
      setScore(s => s + 1);
    } else {
      setWrongWords(prev => [...prev, questions[currentIndex].word]);
    }
  };

  const nextQuestion = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(i => i + 1);
      setSelectedOption(null);
      setIsAnswered(false);
      setActiveMeaningIdx(null);
    } else {
      setShowResult(true);
    }
  };

  const speakQuestion = (accent: 'en-GB' | 'en-US') => {
    speak(readableQuestion(questions[currentIndex].question), accent);
  };

  // Auto-speak new question (US English)
  useEffect(() => {
    if (autoSpeak && !showResult && questions.length > 0) {
      const timer = setTimeout(() => {
        speak(readableQuestion(questions[currentIndex].question), 'en-US');
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [currentIndex, autoSpeak, showResult]);

  useEffect(() => {
    if (showResult || questions.length === 0) return;
    const handleKey = (e: KeyboardEvent) => {
      if (isAnswered) {
        if (e.key === 'Enter' || e.code === 'Space') { e.preventDefault(); nextQuestion(); }
        return;
      }
      const keyMap: Record<string, number> = { a: 0, b: 1, c: 2, d: 3, e: 4 };
      const idx = keyMap[e.key.toLowerCase()];
      if (idx !== undefined && questions[currentIndex].options[idx]) {
        handleAnswer(questions[currentIndex].options[idx]);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [currentIndex, isAnswered, showResult]);

  if (questions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-8 animate-in fade-in duration-700">
        <div className="relative">
          <div className="w-24 h-24 sm:w-32 sm:h-32 border-8 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center text-3xl sm:text-4xl">🧠</div>
        </div>
        <div className="text-center space-y-2">
          <h2 className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tight">{t.preparing}</h2>
          <p className="text-slate-400 font-bold uppercase tracking-widest text-xs sm:text-sm italic">{t.preparingDesc}</p>
        </div>
      </div>
    );
  }

  if (showResult) {
    const percentage = Math.round((score / questions.length) * 100);
    let message = t.msgGreat;
    let icon = "🌟";
    if (percentage === 100) { message = t.msgPerfect; icon = "🦁"; }
    else if (percentage < 50) { message = t.msgPoor; icon = "📚"; }

    const wrongWordDetails = wrongWords.map(wordStr => {
      const q = questions.find(q => q.word === wordStr);
      if (!q) return null;
      const correctOpt = q.options.find(o => o.text.trim().toLowerCase() === q.correctAnswer.trim().toLowerCase());
      return { word: q.word, meaning: correctOpt?.meaning || q.correctAnswer, wordTypeTr: correctOpt?.wordTypeTr || '' };
    }).filter((item): item is { word: string; meaning: string; wordTypeTr: string } => item !== null);

    return (
      <div className="bg-white p-5 sm:p-8 rounded-3xl shadow-2xl text-center max-w-lg mx-auto border-4 border-indigo-50 animate-in zoom-in-95 duration-500">
        <div className="text-4xl sm:text-6xl mb-4">{icon}</div>
        <h2 className="text-xl sm:text-3xl font-black text-slate-800 mb-3 tracking-tight">{message}</h2>
        <p className="text-slate-400 text-sm sm:text-base font-medium mb-5">{t.poolDesc}</p>
        <div className="bg-indigo-50 p-4 sm:p-8 rounded-2xl mb-5">
          <span className="text-4xl sm:text-6xl font-black text-indigo-500">%{percentage}</span>
          <p className="text-indigo-400 font-bold mt-1 uppercase tracking-widest text-xs">{t.successRate}</p>
        </div>

        {wrongWordDetails.length > 0 && (
          <div className="mb-5 text-left">
            <p className="text-[10px] sm:text-xs font-black text-slate-300 uppercase tracking-widest mb-2">
              {t.reviewTitle} ({wrongWordDetails.length})
            </p>
            <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
              {wrongWordDetails.map((item, i) => (
                <div key={i} className="flex items-center justify-between bg-red-50 px-3 py-2 rounded-xl border border-red-100">
                  <div className="flex-1 min-w-0 mr-2">
                    <span className="font-black text-slate-800 text-sm">{item.word}</span>
                    {item.wordTypeTr && <span className="ml-1 text-[10px] text-slate-400 italic">({item.wordTypeTr})</span>}
                    <span className="ml-2 text-xs text-indigo-600 font-bold truncate">{item.meaning}</span>
                  </div>
                  <div className="flex space-x-1 shrink-0">
                    <button onClick={() => speak(item.word, 'en-GB')} className="w-6 h-6 rounded-md overflow-hidden border border-slate-200" title="Listen UK">
                      <img src="https://flagcdn.com/w40/gb.png" className="w-full h-full object-cover" alt="UK" />
                    </button>
                    <button onClick={() => speak(item.word, 'en-US')} className="w-6 h-6 rounded-md overflow-hidden border border-slate-200" title="Listen US">
                      <img src="https://flagcdn.com/w40/us.png" className="w-full h-full object-cover" alt="US" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {wrongWordDetails.length > 0 && onPracticeWrong && (
          <button
            onClick={() => onPracticeWrong(score, questions.length, wrongWords)}
            className="w-full py-3 mb-2 bg-orange-400 text-white rounded-2xl font-black text-sm hover:bg-orange-500 transition-all shadow-lg shadow-orange-100"
          >
            {t.practiceWrong}
          </button>
        )}
        <button onClick={() => onClose(score, questions.length, wrongWords)} className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-base hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100">
          {t.back}
        </button>
      </div>
    );
  }

  const current = questions[currentIndex];
  const labels = ['A', 'B', 'C', 'D', 'E'];

  return (
    <div className={`w-full max-w-3xl mx-auto space-y-3 sm:space-y-5 animate-in fade-in slide-in-from-bottom-8 relative ${isAnswered ? 'pb-24' : ''}`} onClick={() => setActiveMeaningIdx(null)}>
      {/* Header: question counter + auto-speak + score */}
      <div className="flex justify-between items-center px-2 sm:px-4">
        <span className="text-xs sm:text-base font-black text-slate-300 uppercase tracking-widest">{t.question} {currentIndex + 1} / {questions.length}</span>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setAutoSpeak(v => { const next = !v; localStorage.setItem('swb_quiz_autoSpeak', String(next)); return next; })}
            className={`flex items-center space-x-1 px-2 py-1 sm:px-3 sm:py-1.5 rounded-full text-[10px] sm:text-xs font-black transition-all border ${autoSpeak ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white border-slate-200 text-slate-400 hover:border-indigo-300'}`}
            title={t.autoSpeak}
          >
            <span>🔊</span>
            <span className="hidden sm:inline">{t.autoSpeak}</span>
          </button>
          <div className="flex items-center space-x-1.5 bg-yellow-50 px-2 sm:px-4 py-1 sm:py-1.5 rounded-full">
            <span className="text-sm sm:text-base">💎</span>
            <span className="text-xs sm:text-sm text-yellow-600 font-black">{t.score}: {score * 10}</span>
          </div>
        </div>
      </div>

      {/* Question card */}
      <div className="bg-white p-4 sm:p-8 rounded-3xl shadow-2xl border-4 border-white" onClick={(e) => e.stopPropagation()}>
        <div className="text-center mb-4 sm:mb-6">
          <h3 className="text-base sm:text-xl md:text-2xl font-black text-slate-800 mb-3 sm:mb-4 leading-tight break-words">
            {current.question}
          </h3>

          <div className="flex justify-center space-x-2 sm:space-x-4">
            <button
              onClick={() => speakQuestion('en-GB')}
              className="flex items-center space-x-1.5 bg-blue-50 hover:bg-blue-100 px-2 sm:px-4 py-1.5 rounded-lg sm:rounded-xl transition-all border border-blue-100"
            >
              <img src="https://flagcdn.com/w40/gb.png" className="w-4 sm:w-5 h-auto rounded-sm" alt="UK" />
              <span className="text-[9px] sm:text-xs font-black text-blue-600 uppercase tracking-tighter">{t.listenUK}</span>
            </button>
            <button
              onClick={() => speakQuestion('en-US')}
              className="flex items-center space-x-1.5 bg-red-50 hover:bg-red-100 px-2 sm:px-4 py-1.5 rounded-lg sm:rounded-xl transition-all border border-red-100"
            >
              <img src="https://flagcdn.com/w40/us.png" className="w-4 sm:w-5 h-auto rounded-sm" alt="US" />
              <span className="text-[9px] sm:text-xs font-black text-red-600 uppercase tracking-tighter">{t.listenUS}</span>
            </button>
          </div>

          <p className="mt-2 text-[9px] sm:text-xs text-slate-300 font-bold uppercase tracking-widest">{t.kbHint}</p>
        </div>

        <div className="grid gap-2 sm:gap-3">
          {current.options.map((option, idx) => {
            const isCorrect = isCorrectAnswer(option.text, current.correctAnswer);
            const isSelected = option.text === selectedOption;

            let bgColor = 'bg-slate-50 border-slate-100 hover:border-indigo-400 hover:bg-indigo-50/30';
            if (isAnswered) {
              if (isCorrect) bgColor = 'bg-green-100 border-green-500 text-green-700 ring-4 ring-green-50 z-10';
              else if (isSelected) bgColor = 'bg-red-100 border-red-500 text-red-700';
              else bgColor = 'bg-slate-50 border-slate-100 opacity-40';
            }

            return (
              <div key={idx} className="relative group">
                <button
                  disabled={isAnswered}
                  onClick={() => handleAnswer(option)}
                  className={`w-full text-left p-3 sm:p-4 border-2 rounded-2xl text-sm sm:text-base font-bold transition-all flex items-center space-x-3 ${!isAnswered ? 'hover:scale-[1.01] active:scale-95 shadow-sm' : ''} ${bgColor}`}
                >
                  <span className={`w-7 h-7 sm:w-8 sm:h-8 shrink-0 rounded-lg flex items-center justify-center text-xs sm:text-sm font-black transition-colors ${isAnswered && isCorrect ? 'bg-green-500 text-white' : isAnswered && isSelected && !isCorrect ? 'bg-red-500 text-white' : 'bg-white text-slate-400 border border-slate-100'}`}>
                    {labels[idx]}
                  </span>
                  <div className="flex-1 pr-10 sm:pr-20 break-words leading-tight">
                    <span className="text-sm sm:text-base">{option.text}</span>
                  </div>
                  {isAnswered && isCorrect && <span className="text-lg animate-bounce">✓</span>}
                  {isAnswered && isSelected && !isCorrect && <span className="text-lg">✕</span>}
                </button>

                <div className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 flex items-center space-x-1.5">
                  {!isAnswered && (
                    <div className="relative">
                      <button
                        onClick={(e) => { e.stopPropagation(); setActiveMeaningIdx(activeMeaningIdx === idx ? null : idx); }}
                        className="px-1.5 py-1 sm:px-2 sm:py-1.5 bg-indigo-50 text-indigo-400 border border-indigo-100 rounded-lg text-[8px] sm:text-[10px] font-black uppercase tracking-tighter hover:bg-indigo-100 transition-all"
                      >
                        {t.meaning}
                      </button>

                      {activeMeaningIdx === idx && (
                        <div className="absolute right-0 bottom-full mb-3 z-[110] animate-in zoom-in-90 duration-300 origin-bottom-right">
                          <div className="bg-white p-3 sm:p-5 rounded-2xl shadow-2xl border-4 border-indigo-50 w-44 sm:w-52 text-center relative shadow-indigo-200/50">
                            <p className="text-sm sm:text-lg font-black text-slate-800 leading-tight mb-1">{option.meaning}</p>
                            {option.wordTypeTr && <span className="text-[8px] sm:text-[10px] font-black text-slate-300 italic">({option.wordTypeTr})</span>}
                            <button
                              onClick={(e) => { e.stopPropagation(); setActiveMeaningIdx(null); }}
                              className="mt-2 w-full py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-400 text-[8px] sm:text-[10px] font-black uppercase rounded-lg transition-colors border border-slate-100"
                            >
                              {t.close}
                            </button>
                            <div className="absolute -bottom-3 right-5 sm:right-6 w-4 h-4 sm:w-5 sm:h-5 bg-white border-b-4 border-r-4 border-indigo-50 rotate-45"></div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex flex-col space-y-0.5">
                    <button onClick={(e) => { e.stopPropagation(); speak(option.text, 'en-GB'); }} className="w-5 h-5 sm:w-7 sm:h-7 rounded-md overflow-hidden border border-slate-200 shadow-sm hover:scale-110 transition-transform" title="Listen UK">
                      <img src="https://flagcdn.com/w40/gb.png" className="w-full h-full object-cover" alt="UK" />
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); speak(option.text, 'en-US'); }} className="w-5 h-5 sm:w-7 sm:h-7 rounded-md overflow-hidden border border-slate-200 shadow-sm hover:scale-110 transition-transform" title="Listen US">
                      <img src="https://flagcdn.com/w40/us.png" className="w-full h-full object-cover" alt="US" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {isAnswered && (
        <div className="fixed bottom-0 inset-x-0 z-50 p-3 sm:p-4 bg-white/90 backdrop-blur-sm border-t border-slate-100">
          <div className="max-w-3xl mx-auto">
            <button
              onClick={nextQuestion}
              className="w-full py-3 sm:py-5 bg-orange-400 text-white rounded-2xl font-black text-lg sm:text-xl hover:bg-orange-500 transition-all transform hover:scale-[1.02] shadow-2xl shadow-orange-100 animate-in slide-in-from-bottom-4"
            >
              {t.next(currentIndex === questions.length - 1)}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Quiz;
