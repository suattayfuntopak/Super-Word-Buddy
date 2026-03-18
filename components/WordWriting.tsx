
import React, { useState, useEffect } from 'react';
import { VocabularyItem } from '../types';

interface WordWritingProps {
  items: VocabularyItem[];
  onClose: (score: number, total: number) => void;
}

const WordWriting: React.FC<WordWritingProps> = ({ items, onClose }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userInput, setUserInput] = useState<string[]>([]);
  const [scrambled, setScrambled] = useState<string[]>([]);
  const [isCorrect, setIsCorrect] = useState(false);
  const [usedIndices, setUsedIndices] = useState<number[]>([]);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [successCount, setSuccessCount] = useState(0);

  const current = items[currentIndex];

  useEffect(() => {
    initWord();
  }, [currentIndex]);

  useEffect(() => {
    if (isCorrect) return;
    
    const interval = setInterval(() => {
      setTimerSeconds(s => s + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [currentIndex, isCorrect]);

  const initWord = () => {
    const word = items[currentIndex].word.toUpperCase();
    const letters = word.split('').filter(l => l !== ' ');
    const shuffled = [...letters].sort(() => Math.random() - 0.5);
    setScrambled(shuffled);
    setUserInput(new Array(letters.length).fill(''));
    setUsedIndices([]);
    setIsCorrect(false);
    setTimerSeconds(0);
  };

  const speak = (text: string, lang: 'en-GB' | 'en-US') => {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    const voices = window.speechSynthesis.getVoices();
    
    const preferredVoice = voices.find(v => {
      const matchesLang = v.lang.includes(lang);
      if (lang === 'en-GB') {
        return matchesLang && (v.name.includes('Male') || v.name.includes('George') || v.name.includes('Arthur'));
      } else {
        return matchesLang && (v.name.includes('Female') || v.name.includes('Samantha') || v.name.includes('Zira') || v.name.includes('Susan'));
      }
    }) || voices.find(v => v.lang.includes(lang));

    if (preferredVoice) utterance.voice = preferredVoice;
    utterance.lang = lang;
    utterance.rate = 0.85; 
    utterance.pitch = 1.0; 
    utterance.volume = 1.0; 
    window.speechSynthesis.speak(utterance);
  };

  const handleLetterClick = (letter: string, index: number) => {
    if (usedIndices.includes(index) || isCorrect) return;

    const firstEmptyIndex = userInput.indexOf('');
    if (firstEmptyIndex !== -1) {
      const newInput = [...userInput];
      newInput[firstEmptyIndex] = letter;
      setUserInput(newInput);
      setUsedIndices([...usedIndices, index]);

      if (firstEmptyIndex === userInput.length - 1) {
        const result = newInput.join('');
        const target = current.word.toUpperCase().replace(/\s/g, '');
        if (result === target) {
          setIsCorrect(true);
          setSuccessCount(s => s + 1);
        }
      }
    }
  };

  const clearLast = () => {
    if (isCorrect) return;
    const lastFilledIndex = userInput.map((v, i) => v !== '' ? i : -1).filter(v => v !== -1).pop();
    if (lastFilledIndex !== undefined) {
      const newInput = [...userInput];
      newInput[lastFilledIndex] = '';
      setUserInput(newInput);
      
      const newUsedIndices = [...usedIndices];
      newUsedIndices.pop();
      setUsedIndices(newUsedIndices);
    }
  };

  const revealAnswer = () => {
    const target = current.word.toUpperCase().replace(/\s/g, '').split('');
    setUserInput(target);
    setIsCorrect(true);
  };

  const nextWord = () => {
    if (currentIndex < items.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      onClose(successCount, items.length);
    }
  };

  const boxSizeClass = userInput.length > 15 ? 'w-5 h-7 sm:w-8 sm:h-10 text-[10px] sm:text-lg' :
                       userInput.length > 12 ? 'w-6 h-8 sm:w-10 sm:h-12 text-xs sm:text-lg' : 
                       userInput.length > 8 ? 'w-8 h-10 sm:w-14 sm:h-16 text-sm sm:text-xl' : 
                       'w-10 h-12 sm:w-16 sm:h-20 text-lg sm:text-4xl';

  return (
    <div className="w-full flex flex-col items-center space-y-6 sm:space-y-10 animate-in fade-in slide-in-from-bottom-8 px-4">
      <div className="flex justify-between items-center w-full max-w-2xl">
        <span className="text-xs sm:text-lg font-black text-slate-300 uppercase tracking-widest">{currentIndex + 1} / {items.length}</span>
        <button onClick={() => onClose(successCount, items.length)} className="text-slate-400 font-bold hover:text-slate-600 text-sm sm:text-base">Kapat ✖</button>
      </div>

      <div className="bg-white p-6 sm:p-12 rounded-[2rem] sm:rounded-[4rem] shadow-2xl border-4 border-white text-center w-full max-w-2xl overflow-hidden flex flex-col items-center relative">
        <div className="mb-4 flex flex-col items-center">
          <span className="text-[10px] sm:text-sm font-black text-indigo-400 uppercase tracking-widest bg-indigo-50 px-3 sm:px-4 py-1 rounded-full mb-2">TÜRKÇE ANLAMI</span>
          {current.wordTypeTr && (
            <span className="text-[10px] sm:text-xs font-black text-slate-300 uppercase tracking-widest italic">({current.wordTypeTr})</span>
          )}
        </div>
        <h2 className="text-2xl sm:text-5xl font-black text-slate-800 mb-6 sm:mb-12 tracking-tight break-words w-full">
          {current.meaning}
        </h2>

        <div className="flex flex-wrap justify-center gap-1 sm:gap-2 mb-4 w-full px-2">
          {userInput.map((letter, idx) => (
            <div 
              key={idx} 
              className={`${boxSizeClass} rounded-lg sm:rounded-2xl border-2 sm:border-4 flex items-center justify-center font-black transition-all ${
                isCorrect ? 'bg-green-100 border-green-500 text-green-700' : 
                letter ? 'bg-white border-blue-400 text-blue-500' : 'bg-slate-50 border-slate-100'
              }`}
            >
              {letter}
            </div>
          ))}
        </div>

        {isCorrect && current.wordTypeEn && (
          <span className="mb-6 sm:mb-8 text-[10px] sm:text-xs font-black text-indigo-400 uppercase tracking-widest italic">
            ({current.wordTypeEn})
          </span>
        )}

        {!isCorrect ? (
          <div className="flex flex-wrap justify-center gap-2 sm:gap-3 mb-8 sm:mb-10 w-full">
            {scrambled.map((letter, idx) => (
              <button
                key={idx}
                disabled={usedIndices.includes(idx) || isCorrect}
                onClick={() => handleLetterClick(letter, idx)}
                className={`w-9 h-9 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl flex items-center justify-center text-base sm:text-2xl font-black transition-all transform active:scale-95 ${
                  usedIndices.includes(idx) 
                  ? 'bg-slate-100 text-slate-200 cursor-not-allowed border-none shadow-none' 
                  : 'bg-blue-50 text-blue-500 hover:bg-blue-100 hover:scale-110 shadow-lg shadow-blue-100/50 border-2 border-blue-100'
                }`}
              >
                {letter}
              </button>
            ))}
          </div>
        ) : (
          <div className="flex justify-center items-center space-x-8 sm:space-x-12 mb-8 sm:mb-10 animate-in zoom-in-95 duration-500">
            <div className="flex flex-col items-center space-y-2">
              <button 
                onClick={() => speak(current.word, 'en-GB')}
                className="w-12 h-12 sm:w-16 sm:h-16 bg-blue-50 text-blue-500 rounded-xl sm:rounded-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all shadow-lg shadow-blue-100/50 border-2 border-blue-100"
              >
                <img src="https://flagcdn.com/w40/gb.png" className="w-5 sm:w-6 rounded-sm" />
              </button>
            </div>
            <div className="flex flex-col items-center space-y-2">
              <button 
                onClick={() => speak(current.word, 'en-US')}
                className="w-12 h-12 sm:w-16 sm:h-16 bg-red-50 text-red-500 rounded-xl sm:rounded-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all shadow-lg shadow-red-100/50 border-2 border-red-100"
              >
                <img src="https://flagcdn.com/w40/us.png" className="w-5 sm:w-6 rounded-sm" />
              </button>
            </div>
          </div>
        )}

        <div className="flex flex-col items-center space-y-4 sm:space-y-6 w-full">
          {!isCorrect && (
            <button 
              onClick={clearLast}
              className="text-slate-400 font-bold hover:text-red-400 transition-colors flex items-center space-x-2 bg-slate-50 px-4 py-2 rounded-full text-xs sm:text-base"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4 sm:w-5 sm:h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9.75L14.25 12m0 0l2.25 2.25M14.25 12l2.25-2.25M14.25 12L12 14.25m-2.58 4.92l-6.375-6.375a1.125 1.125 0 010-1.59L9.42 4.83c.211-.211.498-.33.796-.33H19.5a2.25 2.25 0 012.25 2.25v10.5a2.25 2.25 0 01-2.25 2.25h-9.284c-.298 0-.585-.119-.796-.33z" />
              </svg>
              <span>Harf Sil</span>
            </button>
          )}

          {!isCorrect && timerSeconds >= 20 && (
            <button 
              onClick={revealAnswer} 
              className="px-6 py-3 sm:px-8 sm:py-4 bg-orange-400 text-white rounded-xl sm:rounded-2xl font-black shadow-xl shadow-orange-200 animate-bounce hover:animate-none transition-all text-sm sm:text-base"
            >
              Cevabı Gör ✨
            </button>
          )}
        </div>
      </div>

      {isCorrect && (
        <button onClick={nextWord} className="w-full max-w-2xl py-4 sm:py-6 bg-orange-400 text-white rounded-2xl sm:rounded-[2.5rem] font-black text-xl sm:text-2xl shadow-xl">
          {currentIndex === items.length - 1 ? 'Kampı Bitir ✨' : 'Sıradaki Kelime 🚀'}
        </button>
      )}
    </div>
  );
};

export default WordWriting;
