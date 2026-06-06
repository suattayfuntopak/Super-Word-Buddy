
import React, { useState, useEffect, useRef } from 'react';
import { VocabularyItem } from '../types';

interface GamesHubProps {
  vocabItems: VocabularyItem[];
  lang?: 'tr' | 'en';
  onBack: () => void;
}

type GameMode = 'menu' | 'shooter' | 'match' | 'cloze';

const T = {
  tr: {
    menuTitle: 'Play Game 🎮',
    menuSub: 'Eğlenerek Zirveye Çık',
    backToMain: '← Ana Menüye Dön',
    game1: 'Kelime Avcısı',
    game1sub: 'İnen Kelimeleri Yakala',
    game2: 'Kelime Eşleştir',
    game2sub: 'Kelime & Anlam Eşleştir',
    game3: 'Cümle Tamamlama',
    game3sub: 'Boşlukları Doldur',
    scoreLabel: 'SKOR',
    questionLabel: 'SORU',
    complete: 'Oyun Tamamlandı! 🎯',
    totalScore: 'Toplam Skor:',
    questionsCount: 'Soru',
    mistakesCount: 'Hata',
    newGame: 'Yeni Oyun ✨',
    backMenu: 'Menüye Dön',
    targetHint: 'Vurman Gereken Kelime Anlamı:',
    matchTitle: 'Kelime Eşleştir 🧩',
    congrats: 'Tebrikler! 🎉',
    matchDesc: 'Hafızan süper, tüm kelimeleri eşleştirdin!',
    giveUp: '← Vazgeç ve Dön',
    clozeTitle: 'Cümle Tamamlama 📝',
    congrats2: 'Tebrikler! ✨',
    clozeDesc: 'Tüm cümleleri başarıyla tamamladın!',
    sentencesCount: 'Cümle',
    wrongCount: 'Yanlış Deneme',
    quitGame: '← Oyunun Bırak',
    noSentences: 'Cümle içeren yeterli kelime bulunamadı. Havuza daha fazla kelime ekleyin.',
  },
  en: {
    menuTitle: 'Play Game 🎮',
    menuSub: 'Rise to the Top, Have Fun!',
    backToMain: '← Back to Menu',
    game1: 'Word Hunter',
    game1sub: 'Catch the Falling Words',
    game2: 'Word Match',
    game2sub: 'Match Words & Meanings',
    game3: 'Sentence Fill',
    game3sub: 'Fill in the Blanks',
    scoreLabel: 'SCORE',
    questionLabel: 'QUESTION',
    complete: 'Game Complete! 🎯',
    totalScore: 'Total Score:',
    questionsCount: 'Questions',
    mistakesCount: 'Mistakes',
    newGame: 'New Game ✨',
    backMenu: 'Back to Menu',
    targetHint: 'Find the word for:',
    matchTitle: 'Word Match 🧩',
    congrats: 'Congratulations! 🎉',
    matchDesc: 'Amazing memory, you matched all the words!',
    giveUp: '← Give Up',
    clozeTitle: 'Sentence Fill 📝',
    congrats2: 'Congratulations! ✨',
    clozeDesc: 'You completed all sentences successfully!',
    sentencesCount: 'Sentences',
    wrongCount: 'Wrong Attempts',
    quitGame: '← Quit Game',
    noSentences: 'Not enough words with example sentences. Add more words to the pool.',
  },
};

const GamesHub: React.FC<GamesHubProps> = ({ vocabItems, lang = 'tr', onBack }) => {
  const [mode, setMode] = useState<GameMode>('menu');
  const t = T[lang];

  if (mode === 'menu') {
    return (
      <div className="max-w-4xl mx-auto space-y-8 sm:space-y-12 animate-in fade-in duration-500 px-4">
        <div className="text-center space-y-2 sm:space-y-4">
          <h2 className="text-3xl sm:text-5xl font-black text-slate-800 tracking-tight">{t.menuTitle}</h2>
          <p className="text-slate-400 font-bold uppercase tracking-[0.2em] sm:tracking-[0.3em] text-xs sm:text-sm">{t.menuSub}</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-8">
          <div onClick={() => setMode('shooter')} className="bg-white p-6 sm:p-10 rounded-[2rem] sm:rounded-[3rem] shadow-xl border-4 border-orange-50 hover:scale-105 transition-all cursor-pointer text-center group">
            <div className="text-4xl sm:text-6xl mb-4 sm:mb-6 group-hover:animate-ping transition-all">🎯</div>
            <h3 className="text-lg sm:text-xl font-black text-slate-800">{t.game1}</h3>
            <p className="text-[10px] sm:text-xs text-slate-400 mt-1 sm:mt-2 font-bold uppercase tracking-tighter">{t.game1sub}</p>
          </div>
          <div onClick={() => setMode('match')} className="bg-white p-6 sm:p-10 rounded-[2rem] sm:rounded-[3rem] shadow-xl border-4 border-indigo-50 hover:scale-105 transition-all cursor-pointer text-center group">
            <div className="text-4xl sm:text-6xl mb-4 sm:mb-6 group-hover:rotate-12 transition-all">🧩</div>
            <h3 className="text-lg sm:text-xl font-black text-slate-800">{t.game2}</h3>
            <p className="text-[10px] sm:text-xs text-slate-400 mt-1 sm:mt-2 font-bold uppercase tracking-tighter">{t.game2sub}</p>
          </div>
          <div onClick={() => setMode('cloze')} className="bg-white p-6 sm:p-10 rounded-[2rem] sm:rounded-[3rem] shadow-xl border-4 border-green-50 hover:scale-105 transition-all cursor-pointer text-center group">
            <div className="text-4xl sm:text-6xl mb-4 sm:mb-6 group-hover:scale-110 transition-all">📝</div>
            <h3 className="text-lg sm:text-xl font-black text-slate-800">{t.game3}</h3>
            <p className="text-[10px] sm:text-xs text-slate-400 mt-1 sm:mt-2 font-bold uppercase tracking-tighter">{t.game3sub}</p>
          </div>
        </div>

        <div className="flex justify-center pt-4 sm:pt-8">
          <button onClick={onBack} className="text-slate-400 font-bold hover:text-slate-600 transition-colors uppercase tracking-widest text-[10px] sm:text-sm">{t.backToMain}</button>
        </div>
      </div>
    );
  }

  if (mode === 'shooter') return <WordShooterGame vocabItems={vocabItems} lang={lang} onBack={() => setMode('menu')} />;
  if (mode === 'match') return <MatchGame vocabItems={vocabItems} lang={lang} onBack={() => setMode('menu')} />;
  if (mode === 'cloze') return <ClozeGame vocabItems={vocabItems} lang={lang} onBack={() => setMode('menu')} />;

  return null;
};

// --- GAME 1: WORD SHOOTER ---
const WordShooterGame: React.FC<{ vocabItems: VocabularyItem[]; lang: 'tr' | 'en'; onBack: () => void }> = ({ vocabItems, lang, onBack }) => {
  const t = T[lang];
  const [targetWord, setTargetWord] = useState<VocabularyItem | null>(null);
  const [fallingWords, setFallingWords] = useState<{ id: number; item: VocabularyItem; x: number; y: number }[]>([]);
  const [score, setScore] = useState(0);
  const [questionCount, setQuestionCount] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [mistakes, setMistakes] = useState(0);

  const questionCountRef = useRef(0);
  const targetWordRef = useRef<VocabularyItem | null>(null);

  const nextLevel = () => {
    if (questionCountRef.current >= 20) {
      setGameOver(true);
      return;
    }
    const subset = [...vocabItems].sort(() => Math.random() - 0.5).slice(0, 4);
    const target = subset[Math.floor(Math.random() * subset.length)];
    targetWordRef.current = target;
    setTargetWord(target);
    questionCountRef.current += 1;
    setQuestionCount(questionCountRef.current);

    setFallingWords(subset.map((item, i) => ({
      id: Math.random() + i + Date.now(),
      item,
      x: 5 + (i * 22),
      y: -(Math.random() * 50 + 10)
    })));
  };

  useEffect(() => {
    if (vocabItems.length === 0) return;
    nextLevel();
    const interval = setInterval(() => {
      setFallingWords(old => {
        const updated = old.map(w => ({ ...w, y: w.y + 0.75 }));
        if (updated.some(w => w.y > 85)) setGameOver(true);
        return updated;
      });
    }, 50);
    return () => clearInterval(interval);
  }, [vocabItems]);

  const handleShoot = (id: number, word: string) => {
    if (word === targetWordRef.current?.word) {
      setScore(s => s + 10);
      nextLevel();
    } else {
      setScore(s => Math.max(0, s - 5));
      setMistakes(m => m + 1);
    }
  };

  const restartGame = () => {
    questionCountRef.current = 0;
    targetWordRef.current = null;
    setScore(0);
    setMistakes(0);
    setQuestionCount(0);
    setGameOver(false);
    nextLevel();
  };

  if (gameOver) {
    return (
      <div className="text-center space-y-6 sm:space-y-8 animate-in zoom-in-95 bg-white p-8 sm:p-16 rounded-[2.5rem] sm:rounded-[4rem] shadow-2xl max-w-xl mx-auto border-4 border-orange-50 px-6">
        <h2 className="text-3xl sm:text-6xl font-black text-orange-500 leading-tight">{t.complete}</h2>
        <div className="space-y-4">
          <p className="text-xl sm:text-3xl font-black text-slate-800">{t.totalScore} {score}</p>
          <div className="grid grid-cols-2 gap-3 sm:gap-4 text-slate-400 font-bold uppercase text-[10px] sm:text-sm">
            <div className="bg-slate-50 p-3 sm:p-4 rounded-xl sm:rounded-2xl">
              <span className="block text-xl sm:text-2xl text-orange-400">{questionCount}</span>
              {t.questionsCount}
            </div>
            <div className="bg-slate-50 p-3 sm:p-4 rounded-xl sm:rounded-2xl">
              <span className="block text-xl sm:text-2xl text-red-400">{mistakes}</span>
              {t.mistakesCount}
            </div>
          </div>
        </div>
        <div className="flex flex-col space-y-3 sm:space-y-4 pt-4 sm:pt-6">
          <button onClick={restartGame} className="px-6 sm:px-10 py-4 sm:py-5 bg-orange-400 text-white rounded-2xl sm:rounded-[2rem] font-black text-lg sm:text-xl shadow-xl hover:scale-105 transition-all">{t.newGame}</button>
          <button onClick={onBack} className="text-slate-400 font-bold uppercase tracking-widest text-[10px] sm:text-sm">{t.backMenu}</button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full max-w-2xl mx-auto h-[500px] sm:h-[600px] bg-slate-900 rounded-[2rem] sm:rounded-[3rem] overflow-hidden border-4 sm:border-8 border-slate-800 shadow-2xl">
      <div className="absolute top-4 sm:top-6 left-4 sm:left-6 text-white font-black z-10 flex flex-col">
        <span className="text-[10px] sm:text-xs text-white/50 uppercase tracking-widest">{t.scoreLabel}</span>
        <span className="text-lg sm:text-2xl">{score}</span>
      </div>
      <div className="absolute top-4 sm:top-6 right-4 sm:right-6 text-white font-black z-10 text-right">
        <span className="text-[10px] sm:text-xs text-white/50 uppercase tracking-widest">{t.questionLabel}</span>
        <span className="text-lg sm:text-2xl">{questionCount}/20</span>
      </div>

      {fallingWords.map(w => (
        <button
          key={w.id}
          onClick={() => handleShoot(w.id, w.item.word)}
          className="absolute bg-white text-slate-800 px-3 sm:px-5 py-2 sm:py-3 rounded-xl sm:rounded-2xl font-black shadow-lg transition-transform hover:scale-110 active:scale-95 border-b-4 border-slate-200 text-xs sm:text-base whitespace-nowrap"
          style={{ left: `${w.x}%`, top: `${w.y}%` }}
        >
          {w.item.word}
        </button>
      ))}

      <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-10 bg-indigo-600 text-white text-center shadow-[0_-20px_50px_rgba(0,0,0,0.3)]">
        <p className="text-[10px] sm:text-xs uppercase tracking-[0.15em] sm:tracking-[0.2em] font-black opacity-60 mb-1 sm:mb-2">{t.targetHint}</p>
        <h3 className="text-2xl sm:text-4xl font-black break-words">{targetWord?.meaning}</h3>
      </div>
    </div>
  );
};

// --- GAME 2: PAIR MATCH ---
type MatchCard = { id: number; text: string; matchId: string; type: 'en' | 'tr'; isFlipped: boolean; isMatched: boolean };

const MatchGame: React.FC<{ vocabItems: VocabularyItem[]; lang: 'tr' | 'en'; onBack: () => void }> = ({ vocabItems, lang, onBack }) => {
  const t = T[lang];
  const [cards, setCards] = useState<MatchCard[]>([]);
  const [selected, setSelected] = useState<number[]>([]);
  const [score, setScore] = useState(0);
  const [gameFinished, setGameFinished] = useState(false);

  useEffect(() => {
    initGame();
  }, []);

  const initGame = () => {
    const subset = [...vocabItems].sort(() => Math.random() - 0.5).slice(0, 6);
    const pairs: MatchCard[] = [];
    subset.forEach((item, i) => {
      pairs.push({ id: i * 2, text: item.word, matchId: item.id, type: 'en', isFlipped: false, isMatched: false });
      pairs.push({ id: i * 2 + 1, text: item.meaning, matchId: item.id, type: 'tr', isFlipped: false, isMatched: false });
    });
    setCards(pairs.sort(() => Math.random() - 0.5));
    setGameFinished(false);
    setSelected([]);
    setScore(0);
  };

  const handleCardClick = (idx: number) => {
    if (selected.length === 2 || cards[idx].isFlipped || cards[idx].isMatched) return;

    const newSelected = [...selected, idx];
    setCards(prev => prev.map((c, i) => i === idx ? { ...c, isFlipped: true } : c));
    setSelected(newSelected);

    if (newSelected.length === 2) {
      const [firstIdx, secondIdx] = newSelected;
      const firstMatchId = cards[firstIdx].matchId;
      const secondMatchId = cards[secondIdx].matchId;

      if (firstMatchId === secondMatchId) {
        setScore(s => s + 20);
        setTimeout(() => {
          setCards(prev => {
            const updated = prev.map((c, i) =>
              (i === firstIdx || i === secondIdx) ? { ...c, isMatched: true } : c
            );
            if (updated.every(c => c.isMatched)) setGameFinished(true);
            return updated;
          });
          setSelected([]);
        }, 600);
      } else {
        setTimeout(() => {
          setCards(prev => prev.map((c, i) =>
            (i === firstIdx || i === secondIdx) ? { ...c, isFlipped: false } : c
          ));
          setSelected([]);
        }, 800);
      }
    }
  };

  if (gameFinished) {
    return (
      <div className="text-center space-y-6 sm:space-y-8 animate-in zoom-in-95 bg-white p-8 sm:p-16 rounded-[2.5rem] sm:rounded-[4rem] shadow-2xl max-w-xl mx-auto border-4 border-indigo-50 px-6">
        <h2 className="text-4xl sm:text-6xl font-black text-indigo-500">{t.congrats}</h2>
        <p className="text-lg sm:text-2xl font-bold text-slate-600">{t.matchDesc}</p>
        <div className="flex flex-col space-y-3 sm:space-y-4 pt-4 sm:pt-6">
          <button onClick={initGame} className="px-6 sm:px-10 py-4 sm:py-5 bg-indigo-600 text-white rounded-2xl sm:rounded-[2rem] font-black text-lg sm:text-xl shadow-xl hover:scale-105 transition-all">{t.newGame}</button>
          <button onClick={onBack} className="text-slate-400 font-bold uppercase tracking-widest text-[10px] sm:text-sm">{t.backMenu}</button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 sm:space-y-10 animate-in fade-in px-4">
      <div className="flex justify-between items-center bg-white p-4 sm:p-6 rounded-[1.5rem] sm:rounded-[2rem] shadow-sm">
        <h3 className="text-xl sm:text-3xl font-black text-slate-800">{t.matchTitle}</h3>
        <span className="bg-indigo-600 text-white px-4 sm:px-6 py-1.5 sm:py-2 rounded-full font-black shadow-lg text-xs sm:text-base">{t.scoreLabel}: {score}</span>
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 sm:gap-4">
        {cards.map((card, i) => (
          <div
            key={card.id}
            onClick={() => handleCardClick(i)}
            className={`h-20 sm:h-32 rounded-[1.5rem] sm:rounded-[2rem] flex items-center justify-center p-2 sm:p-3 text-center text-xs sm:text-base font-black cursor-pointer transition-all border-2 sm:border-4 ${
              card.isMatched ? 'opacity-0 scale-90 pointer-events-none' :
              card.isFlipped ? 'bg-indigo-50 dark:bg-indigo-900/40 border-indigo-200 dark:border-indigo-700 text-indigo-600 dark:text-white shadow-inner' : 'bg-white dark:bg-slate-700 border-slate-100 dark:border-slate-600 text-transparent shadow-xl hover:border-indigo-100 dark:hover:border-indigo-500'
            }`}
          >
            {card.isFlipped ? card.text : ''}
          </div>
        ))}
      </div>

      <div className="text-center">
        <button onClick={onBack} className="text-slate-400 font-bold hover:text-slate-600 transition-colors uppercase tracking-widest text-[10px]">{t.giveUp}</button>
      </div>
    </div>
  );
};

// --- GAME 3: CLOZE (SENTENCE) ---
const ClozeGame: React.FC<{ vocabItems: VocabularyItem[]; lang: 'tr' | 'en'; onBack: () => void }> = ({ vocabItems, lang, onBack }) => {
  const t = T[lang];
  const [currentIdx, setCurrentIdx] = useState(0);
  const [items, setItems] = useState<VocabularyItem[]>([]);
  const [options, setOptions] = useState<string[]>([]);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [wrongSelections, setWrongSelections] = useState<string[]>([]);
  const [mistakeCount, setMistakeCount] = useState(0);
  const [gameOver, setGameOver] = useState(false);

  useEffect(() => {
    const shuffled = [...vocabItems]
      .filter(v => v.exampleSentence.includes(v.word))
      .sort(() => Math.random() - 0.5)
      .slice(0, 20);
    setItems(shuffled);
    if (shuffled.length > 0) setupOptions(shuffled[0], shuffled);
  }, [vocabItems]);

  const setupOptions = (item: VocabularyItem, pool: VocabularyItem[] = vocabItems) => {
    const others = pool.filter(v => v.id !== item.id).sort(() => Math.random() - 0.5).slice(0, 3).map(v => v.word);
    setOptions([...others, item.word].sort(() => Math.random() - 0.5));
    setWrongSelections([]);
  };

  const handleSelect = (opt: string) => {
    if (feedback === 'correct' || wrongSelections.includes(opt)) return;

    if (opt === items[currentIdx].word) {
      setFeedback('correct');
      setTimeout(() => {
        const nextIdx = currentIdx + 1;
        if (nextIdx < items.length && nextIdx < 20) {
          setCurrentIdx(nextIdx);
          setupOptions(items[nextIdx]);
          setFeedback(null);
        } else {
          setGameOver(true);
        }
      }, 1200);
    } else {
      setFeedback('wrong');
      setMistakeCount(m => m + 1);
      setWrongSelections(prev => [...prev, opt]);
      setTimeout(() => setFeedback(null), 800);
    }
  };

  const resetGame = () => {
    const shuffled = [...vocabItems]
      .filter(v => v.exampleSentence.includes(v.word))
      .sort(() => Math.random() - 0.5)
      .slice(0, 20);
    setItems(shuffled);
    setCurrentIdx(0);
    setMistakeCount(0);
    setGameOver(false);
    setFeedback(null);
    if (shuffled.length > 0) setupOptions(shuffled[0], shuffled);
  };

  if (items.length === 0) return (
    <div className="text-center p-20 font-black text-slate-400">
      {t.noSentences}
    </div>
  );

  if (gameOver) {
    return (
      <div className="text-center space-y-6 sm:space-y-8 animate-in zoom-in-95 bg-white p-8 sm:p-16 rounded-[2.5rem] sm:rounded-[4rem] shadow-2xl max-w-xl mx-auto border-4 border-green-50 px-6">
        <h2 className="text-4xl sm:text-6xl font-black text-green-500">{t.congrats2}</h2>
        <div className="space-y-4">
          <p className="text-lg sm:text-2xl font-bold text-slate-700">{t.clozeDesc}</p>
          <div className="grid grid-cols-2 gap-3 sm:gap-4 text-slate-400 font-bold uppercase text-[10px] sm:text-sm">
            <div className="bg-slate-50 p-3 sm:p-4 rounded-xl sm:rounded-2xl">
              <span className="block text-xl sm:text-2xl text-green-500">{currentIdx + 1}</span>
              {t.sentencesCount}
            </div>
            <div className="bg-slate-50 p-3 sm:p-4 rounded-xl sm:rounded-2xl">
              <span className="block text-xl sm:text-2xl text-red-400">{mistakeCount}</span>
              {t.wrongCount}
            </div>
          </div>
        </div>
        <div className="flex flex-col space-y-3 sm:space-y-4 pt-4 sm:pt-6">
          <button onClick={resetGame} className="px-6 sm:px-10 py-4 sm:py-5 bg-green-500 text-white rounded-2xl sm:rounded-[2rem] font-black text-lg sm:text-xl shadow-xl hover:scale-105 transition-all">{t.newGame}</button>
          <button onClick={onBack} className="text-slate-400 font-bold uppercase tracking-widest text-[10px] sm:text-sm">{t.backMenu}</button>
        </div>
      </div>
    );
  }

  const current = items[currentIdx];
  const displaySentence = current.exampleSentence.replace(new RegExp(current.word, 'gi'), '__________');

  return (
    <div className="max-w-2xl mx-auto space-y-8 sm:space-y-12 animate-in fade-in px-4">
      <div className="flex justify-between items-center">
        <h3 className="text-xl sm:text-3xl font-black text-slate-800">{t.clozeTitle}</h3>
        <span className="bg-green-500 text-white px-3 sm:px-5 py-1.5 sm:py-2 rounded-full font-black text-xs sm:text-sm uppercase tracking-widest">{currentIdx + 1} / {Math.min(items.length, 20)}</span>
      </div>

      <div className="text-center">
        <p className="text-indigo-600 font-bold italic text-lg sm:text-xl">"{current.exampleSentenceTurkish}"</p>
      </div>

      <div className="bg-white p-8 sm:p-12 rounded-[2.5rem] sm:rounded-[4rem] border-4 border-green-50 shadow-2xl text-center relative overflow-hidden">
        <h4 className="text-xl md:text-3xl font-medium leading-relaxed text-slate-700 break-words">
          {displaySentence}
        </h4>
        {feedback === 'correct' && <div className="absolute inset-0 bg-green-500/10 flex items-center justify-center animate-in fade-in"><span className="text-4xl sm:text-6xl animate-bounce">🎯</span></div>}
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        {options.map((opt, i) => {
          const isWrong = wrongSelections.includes(opt);
          const isCorrect = feedback === 'correct' && opt === current.word;

          let btnClass = "py-4 sm:py-6 rounded-[1.5rem] sm:rounded-[2.5rem] font-black text-base sm:text-xl transition-all shadow-md border-2 sm:border-4 ";
          if (isCorrect) btnClass += "bg-green-500 border-green-300 text-white scale-105";
          else if (isWrong) btnClass += "bg-red-50 border-red-100 text-red-300 pointer-events-none";
          else btnClass += "bg-white border-slate-50 hover:border-green-200 hover:bg-green-50/30";

          return (
            <button key={i} onClick={() => handleSelect(opt)} className={btnClass}>
              {opt}
            </button>
          );
        })}
      </div>

      <div className="text-center">
        <button onClick={onBack} className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">{t.quitGame}</button>
      </div>
    </div>
  );
};

export default GamesHub;
