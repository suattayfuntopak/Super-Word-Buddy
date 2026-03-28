
import React, { useState } from 'react';
import { QuizQuestion, QuizOption } from '../types';

interface QuizProps {
  questions: QuizQuestion[];
  onClose: (score: number, total: number) => void;
}

const Quiz: React.FC<QuizProps> = ({ questions, onClose }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [activeMeaningIdx, setActiveMeaningIdx] = useState<number | null>(null);

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

  const isCorrectAnswer = (optionText: string, correct: string) => {
    return optionText.trim().toLowerCase() === correct.trim().toLowerCase();
  };

  const handleAnswer = (option: QuizOption) => {
    if (isAnswered) return;
    setSelectedOption(option.text);
    setIsAnswered(true);
    
    const correct = questions[currentIndex].correctAnswer;
    if (isCorrectAnswer(option.text, correct)) {
      setScore(s => s + 1);
    }
  };

  const nextQuestion = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setSelectedOption(null);
      setIsAnswered(false);
      setActiveMeaningIdx(null);
    } else {
      setShowResult(true);
    }
  };

  const speakQuestion = (lang: 'en-GB' | 'en-US') => {
    const questionText = questions[currentIndex].question;
    const readableText = questionText.replace(/_+/g, "bla bla");
    speak(readableText, lang);
  };

  if (questions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-8 animate-in fade-in duration-700">
        <div className="relative">
          <div className="w-24 h-24 sm:w-32 sm:h-32 border-8 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center text-3xl sm:text-4xl">🧠</div>
        </div>
        <div className="text-center space-y-2">
          <h2 className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tight">Sorular Hazırlanıyor...</h2>
          <p className="text-slate-400 font-bold uppercase tracking-widest text-xs sm:text-sm italic">Yapay zeka senin için en iyi testi oluşturuyor</p>
        </div>
      </div>
    );
  }

  if (showResult) {
    const percentage = Math.round((score / questions.length) * 100);
    let message = "Harika gidiyorsun! 🎉";
    let icon = "🌟";
    if (percentage === 100) { message = "Mükemmelsin! Şampiyon! 🏆"; icon = "🦁"; }
    else if (percentage < 50) { message = "Biraz daha çalışalım mı? 🧸"; icon = "📚"; }

    return (
      <div className="bg-white p-8 sm:p-16 rounded-[2.5rem] sm:rounded-[4rem] shadow-2xl text-center max-w-lg mx-auto border-4 border-indigo-50 animate-in zoom-in-95 duration-500">
        <div className="text-5xl sm:text-7xl mb-6 sm:mb-8">{icon}</div>
        <h2 className="text-2xl sm:text-4xl font-black text-slate-800 mb-4 tracking-tight">{message}</h2>
        <p className="text-slate-400 text-base sm:text-xl font-medium mb-8 sm:mb-10">Havuzdaki kelimeleri iyice kavramışsın!</p>
        <div className="bg-indigo-50 p-6 sm:p-10 rounded-[2rem] sm:rounded-[3rem] mb-8 sm:mb-12">
          <span className="text-5xl sm:text-7xl font-black text-indigo-500">%{percentage}</span>
          <p className="text-indigo-400 font-bold mt-2 uppercase tracking-widest text-sm sm:text-base">Başarı Oranın</p>
        </div>
        <button 
          onClick={() => onClose(score, questions.length)}
          className="w-full py-4 sm:py-6 bg-indigo-600 text-white rounded-2xl sm:rounded-[2rem] font-black text-lg sm:text-xl hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100"
        >
          Havuz Seçimine Dön
        </button>
      </div>
    );
  }

  const current = questions[currentIndex];
  const labels = ['A', 'B', 'C', 'D', 'E'];

  return (
    <div className={`w-full max-w-3xl mx-auto space-y-6 sm:space-y-10 animate-in fade-in slide-in-from-bottom-8 relative ${isAnswered ? 'pb-28' : ''}`} onClick={() => setActiveMeaningIdx(null)}>
      <div className="flex justify-between items-center mb-4 px-4 sm:px-6">
        <span className="text-sm sm:text-lg font-black text-slate-300 uppercase tracking-widest">SORU {currentIndex + 1} / {questions.length}</span>
        <div className="flex items-center space-x-2 bg-yellow-50 px-3 sm:px-5 py-1.5 sm:py-2 rounded-full">
           <span className="text-base sm:text-lg">💎</span>
           <span className="text-sm sm:text-yellow-600 font-black">SKOR: {score * 10}</span>
        </div>
      </div>
      
      <div className="bg-white p-6 sm:p-10 md:p-14 rounded-[2.5rem] sm:rounded-[4rem] shadow-2xl border-4 border-white" onClick={(e) => e.stopPropagation()}>
        <div className="text-center mb-6 sm:mb-8">
          <h3 className="text-xl sm:text-2xl md:text-4xl font-black text-slate-800 mb-4 sm:mb-6 leading-tight break-words">
            {current.question}
          </h3>
          
          <div className="flex justify-center space-x-3 sm:space-x-4">
             <button 
               onClick={() => speakQuestion('en-GB')}
               className="flex items-center space-x-2 bg-blue-50 hover:bg-blue-100 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl transition-all border border-blue-100"
               title="Listen Question (Male)"
             >
               <img src="https://flagcdn.com/w40/gb.png" className="w-5 sm:w-6 h-auto rounded-sm" alt="UK" />
               <span className="text-[10px] sm:text-xs font-black text-blue-600 uppercase tracking-tighter">Listen (UK)</span>
             </button>
             <button 
               onClick={() => speakQuestion('en-US')}
               className="flex items-center space-x-2 bg-red-50 hover:bg-red-100 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl transition-all border border-red-100"
               title="Listen Question (Female)"
             >
               <img src="https://flagcdn.com/w40/us.png" className="w-5 sm:w-6 h-auto rounded-sm" alt="US" />
               <span className="text-[10px] sm:text-xs font-black text-red-600 uppercase tracking-tighter">Listen (US)</span>
             </button>
          </div>
        </div>
        
        <div className="grid gap-3 sm:gap-4">
          {current.options.map((option, idx) => {
            const isCorrect = isCorrectAnswer(option.text, current.correctAnswer);
            const isSelected = option.text === selectedOption;
            
            let bgColor = 'bg-slate-50 border-slate-100 hover:border-indigo-400 hover:bg-indigo-50/30';
            
            if (isAnswered) {
              if (isCorrect) {
                bgColor = 'bg-green-100 border-green-500 text-green-700 ring-4 ring-green-50 z-10';
              } else if (isSelected) {
                bgColor = 'bg-red-100 border-red-500 text-red-700';
              } else {
                bgColor = 'bg-slate-50 border-slate-100 opacity-40';
              }
            }

            return (
              <div key={idx} className="relative group">
                <button
                  disabled={isAnswered}
                  onClick={() => handleAnswer(option)}
                  className={`w-full text-left p-4 sm:p-5 border-2 sm:border-4 rounded-[1.5rem] sm:rounded-[2rem] text-base sm:text-lg font-bold transition-all flex items-center space-x-3 sm:space-x-4 ${!isAnswered ? 'hover:scale-[1.01] active:scale-95 shadow-sm' : ''} ${bgColor}`}
                >
                  <span className={`w-8 h-8 sm:w-10 sm:h-10 shrink-0 rounded-lg sm:rounded-xl flex items-center justify-center text-xs sm:text-base font-black transition-colors ${isAnswered && isCorrect ? 'bg-green-500 text-white' : isAnswered && isSelected && !isCorrect ? 'bg-red-500 text-white' : 'bg-white text-slate-400 border border-slate-100'}`}>
                    {labels[idx]}
                  </span>
                  <div className="flex-1 pr-16 sm:pr-32 break-words leading-tight flex flex-col">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs sm:text-lg">{option.text}</span>
                    </div>
                  </div>
                  {isAnswered && isCorrect && <span className="text-xl sm:text-2xl animate-bounce">✓</span>}
                  {isAnswered && isSelected && !isCorrect && <span className="text-xl sm:text-2xl">✕</span>}
                </button>
                
                <div className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 flex items-center space-x-2">
                   {!isAnswered && (
                     <div className="relative">
                        <button 
                          onClick={(e) => { 
                            e.stopPropagation(); 
                            setActiveMeaningIdx(activeMeaningIdx === idx ? null : idx); 
                          }}
                          className="px-2 py-1.5 sm:px-3 sm:py-2 bg-indigo-50 text-indigo-400 border border-indigo-100 rounded-lg sm:rounded-xl text-[8px] sm:text-[10px] font-black uppercase tracking-tighter hover:bg-indigo-100 transition-all"
                        >
                          Anlamı
                        </button>
                        
                        {activeMeaningIdx === idx && (
                          <div className="absolute right-0 bottom-full mb-4 z-[110] animate-in zoom-in-90 duration-300 origin-bottom-right">
                             <div className="bg-white p-4 sm:p-6 rounded-[1.5rem] sm:rounded-[2rem] shadow-2xl border-4 border-indigo-50 w-48 sm:w-56 text-center relative shadow-indigo-200/50">
                                <p className="text-lg sm:text-xl font-black text-slate-800 leading-tight mb-1">{option.meaning}</p>
                                {option.wordTypeTr && (
                                  <span className="text-[8px] sm:text-[10px] font-black text-slate-300 italic">({option.wordTypeTr})</span>
                                )}
                                
                                <button 
                                  onClick={(e) => { e.stopPropagation(); setActiveMeaningIdx(null); }}
                                  className="mt-3 sm:mt-4 w-full py-1.5 sm:py-2 bg-slate-50 hover:bg-slate-100 text-slate-400 text-[8px] sm:text-[10px] font-black uppercase rounded-lg sm:rounded-xl transition-colors border border-slate-100"
                                >
                                  Kapat ✕
                                </button>

                                <div className="absolute -bottom-3 right-6 sm:right-8 w-5 h-5 sm:w-6 sm:h-6 bg-white border-b-4 border-r-4 border-indigo-50 rotate-45"></div>
                             </div>
                          </div>
                        )}
                     </div>
                   )}
                   
                   <div className="flex flex-col space-y-1">
                      <button 
                        onClick={(e) => { e.stopPropagation(); speak(option.text, 'en-GB'); }}
                        className="w-6 h-6 sm:w-8 sm:h-8 rounded-md sm:rounded-lg overflow-hidden border border-slate-200 shadow-sm hover:scale-110 transition-transform"
                        title="Listen UK"
                      >
                        <img src="https://flagcdn.com/w40/gb.png" className="w-full h-full object-cover" alt="UK" />
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); speak(option.text, 'en-US'); }}
                        className="w-6 h-6 sm:w-8 sm:h-8 rounded-md sm:rounded-lg overflow-hidden border border-slate-200 shadow-sm hover:scale-110 transition-transform"
                        title="Listen US"
                      >
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
        <div className="fixed bottom-0 inset-x-0 z-50 p-4 bg-white/90 backdrop-blur-sm border-t border-slate-100">
          <div className="max-w-3xl mx-auto">
            <button
              onClick={nextQuestion}
              className="w-full py-4 sm:py-6 bg-orange-400 text-white rounded-[1.5rem] sm:rounded-[2.5rem] font-black text-xl sm:text-2xl hover:bg-orange-500 transition-all transform hover:scale-[1.02] shadow-2xl shadow-orange-100 animate-in slide-in-from-bottom-4"
            >
              {currentIndex === questions.length - 1 ? 'Sonucu Gör ✨' : 'Sıradaki Soru 🚀'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Quiz;
