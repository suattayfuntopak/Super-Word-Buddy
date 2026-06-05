
import React, { useState, useEffect } from 'react';
import { VocabularyItem } from '../types';
import { speak } from '../utils/speak';

interface FlashcardsProps {
  items: VocabularyItem[];
  onComplete: (totalReviewed: number) => void;
}

const Flashcards: React.FC<FlashcardsProps> = ({ items, onComplete }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  const current = items[currentIndex];

  const nextCard = () => {
    if (currentIndex < items.length - 1) {
      setCurrentIndex(i => i + 1);
      setIsFlipped(false);
    } else {
      onComplete(items.length);
    }
  };

  const prevCard = () => {
    if (currentIndex > 0) {
      setCurrentIndex(i => i - 1);
      setIsFlipped(false);
    }
  };

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') {
        nextCard();
      } else if (e.key === 'ArrowLeft') {
        prevCard();
      } else if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        setIsFlipped(f => !f);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [currentIndex]);

  return (
    <div className="flex flex-col items-center space-y-8 w-full max-w-lg mx-auto p-4 animate-in fade-in duration-500">
      <div className="w-full flex justify-between items-center px-4">
        <span className="text-sm font-bold text-orange-400 bg-orange-50 px-3 py-1 rounded-full">KART {currentIndex + 1} / {items.length}</span>
        <div className="h-3 w-32 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
          <div
            className="h-full bg-gradient-to-r from-blue-400 to-indigo-400 transition-all duration-500"
            style={{ width: `${((currentIndex + 1) / items.length) * 100}%` }}
          />
        </div>
      </div>

      <div
        className="relative w-full h-[430px] sm:h-[500px] cursor-pointer perspective-1000"
        onClick={() => setIsFlipped(!isFlipped)}
      >
        <div className={`relative w-full h-full transition-all duration-500 transform-style-3d ${isFlipped ? 'rotate-y-180' : ''}`}>
          {/* ÖN YÜZ (İngilizce) */}
          <div className="absolute inset-0 bg-white rounded-[2rem] sm:rounded-[3rem] shadow-xl flex flex-col items-center p-6 sm:p-8 border-4 border-blue-50 backface-hidden">
            <span className="text-[10px] sm:text-sm font-bold text-slate-300 uppercase tracking-widest mb-2 shrink-0">İNGİLİZCE</span>

            <div className="flex-1 flex flex-col items-center justify-center w-full text-center space-y-8 sm:space-y-12">
              <div className="space-y-3 sm:space-y-4">
                <h2 className="text-3xl sm:text-5xl font-black text-slate-800 tracking-tight leading-none break-all">{current.word}</h2>
                {current.wordTypeEn && (
                  <span className="inline-block text-[10px] sm:text-xs font-black text-slate-400 uppercase tracking-widest italic bg-slate-50 px-3 sm:px-4 py-1 sm:py-1.5 rounded-lg sm:rounded-xl border border-slate-100">
                    ({current.wordTypeEn})
                  </span>
                )}
              </div>

              <div className="flex space-x-4 sm:space-x-8">
                <button
                  onClick={(e) => { e.stopPropagation(); speak(current.word, 'en-GB'); }}
                  className="w-12 h-12 sm:w-16 sm:h-16 bg-blue-50 text-blue-500 rounded-xl sm:rounded-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all shadow-md border border-blue-100"
                  title="UK Telaffuz"
                >
                  <img src="https://flagcdn.com/w40/gb.png" className="w-6 sm:w-8 rounded-sm" alt="UK" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); speak(current.word, 'en-US'); }}
                  className="w-12 h-12 sm:w-16 sm:h-16 bg-red-50 text-red-500 rounded-xl sm:rounded-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all shadow-md border border-red-100"
                  title="US Telaffuz"
                >
                  <img src="https://flagcdn.com/w40/us.png" className="w-6 sm:w-8 rounded-sm" alt="US" />
                </button>
              </div>
            </div>

            <p className="text-slate-300 font-bold text-xs sm:text-sm shrink-0">Çevirmek için tıkla ✨ &nbsp;·&nbsp; <span className="font-black">Space / Enter</span></p>
          </div>

          {/* ARKA YÜZ (Türkçe) */}
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-[2rem] sm:rounded-[3rem] shadow-xl flex flex-col items-center p-4 sm:p-8 text-white backface-hidden rotate-y-180 overflow-y-auto">
            <span className="text-[10px] sm:text-sm font-bold text-white/50 uppercase tracking-widest mb-2 sm:mb-4 shrink-0">TÜRKÇE ANLAMI</span>

            <div className="flex-1 flex flex-col items-center justify-center w-full">
              <div className="flex flex-col items-center mb-3 sm:mb-6">
                <h3 className="text-2xl sm:text-4xl font-black text-center leading-tight break-words">{current.meaning}</h3>
                {current.wordTypeTr && (
                  <span className="mt-1 sm:mt-3 px-3 sm:px-4 py-1 sm:py-1.5 bg-white/20 rounded-lg sm:rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-widest backdrop-blur-sm border border-white/10">
                    ({current.wordTypeTr})
                  </span>
                )}
              </div>
              <div className="space-y-2 sm:space-y-4 w-full">
                <div className="bg-white/10 backdrop-blur-md p-3 sm:p-6 rounded-[1.5rem] sm:rounded-[2rem] w-full border border-white/20 shadow-lg">
                  <p className="text-center italic text-sm sm:text-xl font-medium leading-relaxed">"{current.exampleSentence}"</p>
                  <div className="mt-2 sm:mt-4 pt-2 sm:pt-4 border-t border-white/20">
                    <p className="text-center text-sm sm:text-xl font-black">{current.exampleSentenceTurkish}</p>
                  </div>
                </div>
              </div>
            </div>

            <p className="text-white/40 text-[10px] sm:text-xs pt-3 sm:pt-6 font-bold shrink-0">← → ile gezin · Space ile çevir 🧚</p>
          </div>
        </div>
      </div>

      <div className="flex space-x-3 sm:space-x-4 w-full px-2">
        <button onClick={prevCard} disabled={currentIndex === 0} className="flex-1 py-4 sm:py-5 bg-white border-2 border-slate-100 rounded-[1.5rem] sm:rounded-[2rem] font-black text-slate-500 disabled:opacity-30 transition-all shadow-sm text-sm sm:text-base">← Önceki</button>
        <button onClick={nextCard} className="flex-1 py-4 sm:py-5 bg-orange-400 text-white rounded-[1.5rem] sm:rounded-[2rem] font-black text-base sm:text-lg shadow-xl hover:bg-orange-500 transition-colors">
          {currentIndex === items.length - 1 ? 'Bitir ✨' : 'Sıradaki →'}
        </button>
      </div>
    </div>
  );
};

export default Flashcards;
