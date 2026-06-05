
import React, { useState, useEffect } from 'react';
import { AppState, VocabularyItem, QuizQuestion, QuizOption, User } from './types';
import { analyzeVocabulary } from './services/geminiService';
import { supabase } from './services/supabaseClient';
import { speak } from './utils/speak';
import FileUpload from './components/FileUpload';
import Flashcards from './components/Flashcards';
import Quiz from './components/Quiz';
import AddWordModal from './components/AddWordModal';
import WordWriting from './components/WordWriting';
import AuthForm from './components/AuthForm';
import Statistics from './components/Statistics';
import CookieConsent from './components/CookieConsent';
import TutorView from './components/TutorView';
import GamesHub from './components/GamesHub';

const App: React.FC = () => {
  const [state, setState] = useState<AppState>('home');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [vocabItems, setVocabItems] = useState<VocabularyItem[]>([]);
  const [totalPoolCount, setTotalPoolCount] = useState<number>(0);
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<VocabularyItem | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [listDisplayLimit, setListDisplayLimit] = useState(30);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  useEffect(() => {
    if (!import.meta.env.VITE_GEMINI_API_KEY && !process.env.API_KEY) {
      setError("Sistem yapılandırması eksik (API Key bulunamadı).");
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        const user: User = {
          id: session.user.id,
          email: session.user.email!,
          name: session.user.user_metadata.name || 'Öğrenci'
        };
        setCurrentUser(user);
        fetchAllWords();
        setState('selection');
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        const user: User = {
          id: session.user.id,
          email: session.user.email!,
          name: session.user.user_metadata.name || 'Öğrenci'
        };
        setCurrentUser(user);
        fetchAllWords();
        setState('selection');
      } else {
        setCurrentUser(null);
        setVocabItems([]);
        setTotalPoolCount(0);
        setState('home');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [state]);

  const fetchAllWords = async () => {
    try {
      const { count, error: countError } = await supabase
        .from('vocabulary')
        .select('*', { count: 'exact', head: true });

      if (!countError && count !== null) {
        setTotalPoolCount(count);
      }

      let allData: any[] = [];
      let from = 0;
      let to = 999;
      let finished = false;

      while (!finished) {
        const { data, error: fetchError } = await supabase
          .from('vocabulary')
          .select('id, english, turkish, word_type_en, word_type_tr, example_sentence_en, example_sentence_tr, created_at, user_id')
          .order('created_at', { ascending: false })
          .range(from, to);

        if (fetchError) throw fetchError;

        if (data && data.length > 0) {
          allData = [...allData, ...data];
          if (data.length < 1000) {
            finished = true;
          } else {
            from += 1000;
            to += 1000;
          }
        } else {
          finished = true;
        }
      }

      const uniqueData = Array.from(new Map(allData.map(item => [String(item.id), item])).values());

      const mapped = uniqueData.map(item => ({
        id: String(item.id),
        word: item.english || '',
        meaning: item.turkish || '',
        wordTypeEn: item.word_type_en || '',
        wordTypeTr: item.word_type_tr || '',
        exampleSentence: item.example_sentence_en || '',
        exampleSentenceTurkish: item.example_sentence_tr || '',
        userId: item.user_id || ''
      }));
      setVocabItems(mapped);
    } catch (err: any) {
      console.error('Veri çekme hatası:', err);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const logActivity = async (type: string, score: number, total: number) => {
    if (!currentUser) return;
    try {
      const { error } = await supabase.from('user_activities').insert([{
        user_id: currentUser.id,
        activity_type: type,
        score: score,
        total_items: total
      }]);
      if (error) throw error;
    } catch (e) {
      console.error("Aktivite kaydedilemedi", e);
    }
  };

  const shuffleArray = <T,>(array: T[]): T[] => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  const generateLocalQuiz = (items: VocabularyItem[]): QuizQuestion[] => {
    const shuffled = [...items].sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, Math.min(20, shuffled.length));
    return selected.map(item => {
      const others = shuffled.filter(w => w.id !== item.id).slice(0, 4);
      const correctOpt: QuizOption = { text: item.word, meaning: item.meaning, wordTypeEn: item.wordTypeEn, wordTypeTr: item.wordTypeTr };
      const wrongOpts: QuizOption[] = others.map(w => ({ text: w.word, meaning: w.meaning, wordTypeEn: w.wordTypeEn, wordTypeTr: w.wordTypeTr }));
      const options = [correctOpt, ...wrongOpts].sort(() => Math.random() - 0.5);
      let question: string;
      if (item.exampleSentence) {
        const escaped = item.word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const cloze = item.exampleSentence.replace(new RegExp(`\\b${escaped}\\b`, 'gi'), '______');
        question = cloze !== item.exampleSentence ? cloze : `"${item.meaning}" anlamına gelen İngilizce kelime?`;
      } else {
        question = `"${item.meaning}" anlamına gelen İngilizce kelime?`;
      }
      return { question, options, correctAnswer: item.word, word: item.word };
    });
  };

  const startQuiz = () => {
    if (vocabItems.length < 5) {
      setError("Test için havuzda en az 5 kelime olmalı!");
      return;
    }
    const questions = generateLocalQuiz(vocabItems);
    setQuizQuestions(questions);
    setState('quiz');
  };

  const handleFileSelect = async (base64: string, mimeType: string) => {
    setState('analyzing');
    try {
      const newWords = await analyzeVocabulary(base64, mimeType);
      if (currentUser && newWords.length > 0) {
        const existingWords = new Set(vocabItems.map(v => v.word.toLowerCase().trim()));
        const toInsert = newWords.filter(w => !existingWords.has(w.word.toLowerCase().trim()));

        for (const item of toInsert) {
          await supabase.from('vocabulary').insert([{
            english: item.word,
            turkish: item.meaning,
            word_type_en: item.wordTypeEn,
            word_type_tr: item.wordTypeTr,
            example_sentence_en: item.exampleSentence,
            example_sentence_tr: item.exampleSentenceTurkish,
            user_id: currentUser.id
          }]);
        }
        await fetchAllWords();
      }
      setState('selection');
    } catch (err: any) {
      setError(err.message || 'Analiz sırasında bir hata oluştu.');
      setState('upload');
    }
  };

  const addOrUpdateWord = async (item: VocabularyItem) => {
    if (!currentUser) return;
    if (!item.id && vocabItems.some(v => v.word.toLowerCase().trim() === item.word.toLowerCase().trim())) {
      setError("Bu kelime zaten ortak havuzda var! 🌟");
      setIsModalOpen(false);
      return;
    }

    try {
      const payload = {
        english: item.word,
        turkish: item.meaning,
        word_type_en: item.wordTypeEn,
        word_type_tr: item.wordTypeTr,
        example_sentence_en: item.exampleSentence,
        example_sentence_tr: item.exampleSentenceTurkish,
        user_id: currentUser.id
      };

      let opError;
      if (item.id) {
        // Ownership check: only allow editing your own words
        const { error } = await supabase
          .from('vocabulary')
          .update(payload)
          .eq('id', item.id)
          .eq('user_id', currentUser.id);
        opError = error;
      } else {
        const { error } = await supabase.from('vocabulary').insert([payload]);
        opError = error;
      }

      if (opError) throw opError;

      await fetchAllWords();
      setEditingItem(null);
      setIsModalOpen(false);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const deleteWord = async (item: VocabularyItem) => {
    if (!currentUser || item.userId !== currentUser.id) return;
    try {
      const { error } = await supabase
        .from('vocabulary')
        .delete()
        .eq('id', item.id)
        .eq('user_id', currentUser.id);
      if (error) throw error;
      setPendingDeleteId(null);
      await fetchAllWords();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const filteredVocab = searchTerm.trim() === ''
    ? vocabItems
    : vocabItems.filter(item =>
        item.word.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.meaning.toLowerCase().includes(searchTerm.toLowerCase())
      );

  return (
    <div className="min-h-screen flex flex-col bg-[#fdfbf7]">
      <header className="bg-white/95 backdrop-blur-md sticky top-0 z-20 py-3 sm:py-5 border-b border-slate-200 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex justify-between items-center">
          <div className="flex items-center space-x-2 sm:space-x-3 cursor-pointer" onClick={() => currentUser ? setState('selection') : setState('home')}>
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-indigo-600 rounded-lg sm:rounded-xl flex items-center justify-center text-white text-lg sm:text-xl shadow-lg">🚀</div>
            <div className="flex flex-col">
              <h1 className="text-base sm:text-xl font-black text-slate-800 leading-none">Super Word Buddy</h1>
              <span className="text-[8px] sm:text-[10px] font-black text-indigo-500 uppercase tracking-tighter">Academic Global Pool</span>
            </div>
          </div>
          <nav className="flex items-center space-x-2 sm:space-x-4">
            {currentUser ? (
              <div className="flex items-center space-x-2 sm:space-x-4">
                <div className="hidden lg:flex flex-col items-end mr-2">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Global Havuz</span>
                  <span className="text-sm font-black text-indigo-600">{totalPoolCount.toLocaleString('tr-TR')} Kelime</span>
                </div>
                <button
                  onClick={() => { setState('selection'); setSearchTerm(''); }}
                  className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center rounded-full bg-slate-50 hover:bg-indigo-50 text-xl sm:text-2xl transition-all shadow-inner border border-slate-100"
                  title="Ana Menü"
                >🏠</button>
                <button
                  onClick={() => setState('stats')}
                  className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center rounded-full bg-slate-50 hover:bg-violet-50 text-xl sm:text-2xl transition-all shadow-inner border border-slate-100"
                  title="İstatistikler"
                >📊</button>
                <button onClick={() => setState('upload')} className="bg-indigo-600 text-white px-3 sm:px-5 py-1.5 sm:py-2 rounded-lg sm:rounded-xl text-xs sm:text-sm font-black shadow-lg hover:bg-indigo-700 transition-all whitespace-nowrap">Yükle</button>
                <span className="hidden md:inline-block text-sm font-bold text-slate-600 italic">
                  <span className="text-[#FF0000] font-black">{currentUser.name}</span>
                </span>
                <button onClick={handleLogout} className="text-slate-400 hover:text-red-500 font-bold text-xs sm:text-sm">Çıkış</button>
              </div>
            ) : (
              <button onClick={() => setState('login')} className="bg-slate-800 text-white px-4 sm:px-5 py-2 rounded-lg sm:rounded-xl text-xs sm:text-sm font-black">Giriş</button>
            )}
          </nav>
        </div>
      </header>

      <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 pt-2 sm:pt-4 pb-0">
        {error && (
          <div className="mb-8 p-6 bg-red-50 border-2 border-red-100 text-red-600 rounded-[2rem] text-center font-bold animate-in slide-in-from-top-4 duration-300 shadow-lg shadow-red-50">
            <div className="flex items-center justify-center space-x-3">
              <span className="text-2xl">🚨</span>
              <p>{error}</p>
            </div>
            <button onClick={() => setError(null)} className="mt-4 text-xs font-black uppercase tracking-widest bg-white px-4 py-2 rounded-full border border-red-100 hover:bg-red-100 transition-colors">Anladım</button>
          </div>
        )}

        {state === 'home' && (
          <div className="flex flex-col items-center justify-center space-y-6 sm:space-y-10 py-8 sm:py-16 text-center">
            <div className="w-24 h-24 sm:w-32 sm:h-32 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-[2rem] sm:rounded-[2.5rem] shadow-2xl flex items-center justify-center text-5xl sm:text-6xl">🎓</div>
            <div className="space-y-4">
              <h2 className="text-3xl sm:text-5xl md:text-6xl font-black text-slate-900 tracking-tighter leading-tight px-2">
                Üniversite Arkadaşlarınla Birlikte <br/><span className="text-indigo-600">Kelime Dağarcığını Genişlet!</span>
              </h2>
              <p className="text-base sm:text-lg text-slate-500 max-w-xl mx-auto font-medium leading-relaxed px-4">
                Bu uygulama akademik gelişim için tasarlanmıştır. Ortak kütüphane sayesinde yeni kelimeleri keşfedin ve birlikte öğrenin.
              </p>
            </div>
            <button onClick={() => setState('signup')} className="bg-indigo-600 text-white px-6 sm:px-10 py-3 sm:py-4 rounded-xl sm:rounded-2xl text-base sm:text-lg font-black shadow-xl hover:scale-105 transition-all">
              Topluluğa Katılmak İçin Kayıt Ol! 🚀
            </button>
          </div>
        )}

        {(state === 'login' || state === 'signup') && (
          <AuthForm mode={state} onAuthSuccess={(user) => { setCurrentUser(user); setState('selection'); }} onToggleMode={(newMode) => setState(newMode)} />
        )}

        {state === 'upload' && (
          <FileUpload onFileSelect={handleFileSelect} />
        )}

        {state === 'analyzing' && (
          <div className="flex flex-col items-center justify-center py-24 space-y-6 text-center">
            <div className="w-20 h-20 border-8 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
            <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tighter">VERİLER İŞLENİYOR...</h3>
            <p className="text-slate-400 font-medium max-w-sm">Hazırlanıyor... Ders çalışmanın keyfine varmak üzeresin! ✨</p>
          </div>
        )}

        {state === 'selection' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-6 duration-500">
            <div className="text-center space-y-2">
              <h2 className="text-4xl font-black text-slate-900 tracking-tight italic">Common Academic Knowledge</h2>
              <p className="text-slate-400 text-lg font-medium">Toplam <span className="text-indigo-600 font-black">{totalPoolCount.toLocaleString('tr-TR')}</span> kelimelik devasa bir kaynağımız var.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              <div onClick={() => setState('learning')} className="bg-gradient-to-br from-blue-400 to-cyan-500 p-8 rounded-[2.5rem] shadow-xl hover:scale-[1.03] transition-all cursor-pointer text-center group text-white">
                <div className="text-5xl mb-4 group-hover:animate-bounce transition-all">📚</div>
                <h3 className="text-2xl font-black text-slate-100">Flashcards</h3>
                <p className="text-sm text-white/70 mt-2 font-bold">Kelime Kartları</p>
              </div>
              <div onClick={() => vocabItems.length >= 5 ? startQuiz() : setError("En az 5 kelime lazım!")} className="bg-gradient-to-br from-amber-400 to-orange-500 p-8 rounded-[2.5rem] shadow-xl hover:scale-[1.03] transition-all cursor-pointer text-center group text-white">
                <div className="text-5xl mb-4 group-hover:animate-bounce transition-all">🎓</div>
                <h3 className="text-2xl font-black text-slate-100">Kendini Test Et</h3>
                <p className="text-sm text-white/70 mt-2 font-bold">Gerçek Sınav Modu</p>
              </div>
              <div onClick={() => setState('writing')} className="bg-gradient-to-br from-emerald-400 to-teal-500 p-8 rounded-[2.5rem] shadow-xl hover:scale-[1.03] transition-all cursor-pointer text-center group text-white">
                <div className="text-5xl mb-4 group-hover:animate-bounce transition-all">✍️</div>
                <h3 className="text-2xl font-black text-slate-100">Yazma Kampı</h3>
                <p className="text-sm text-white/70 mt-2 font-bold">Spelling Pratiği</p>
              </div>
              <div onClick={() => { setListDisplayLimit(30); setState('list'); }} className="bg-gradient-to-br from-rose-400 to-pink-500 p-8 rounded-[2.5rem] shadow-xl hover:scale-[1.03] transition-all cursor-pointer text-center group text-white">
                <div className="text-5xl mb-4 group-hover:animate-bounce transition-all">🌍</div>
                <h3 className="text-2xl font-black text-slate-100">Global Kelime Havuzu</h3>
                <p className="text-sm text-white/70 mt-2 font-bold">Tüm Liste</p>
              </div>
              <div onClick={() => setState('tutor')} className="bg-gradient-to-br from-indigo-500 to-purple-600 p-8 rounded-[2.5rem] shadow-xl hover:scale-[1.03] transition-all cursor-pointer text-center group text-white">
                <div className="text-5xl mb-4 group-hover:animate-bounce transition-all">🧠</div>
                <h3 className="text-2xl font-black text-slate-100">Auto Word Trainer</h3>
                <p className="text-sm text-white/70 mt-2 font-bold">Her 15 Dakikada Bir Kelime</p>
              </div>
              <div onClick={() => setState('games')} className="bg-gradient-to-br from-orange-400 to-pink-500 p-8 rounded-[2.5rem] shadow-xl hover:scale-[1.03] transition-all cursor-pointer text-center group text-white">
                <div className="text-5xl mb-4 group-hover:animate-bounce transition-all">🎮</div>
                <h3 className="text-2xl font-black text-slate-100">Play Game</h3>
                <p className="text-sm text-white/70 mt-2 font-bold">Eğlenerek Öğren</p>
              </div>
            </div>

            <div className="flex flex-col items-center pt-2 border-t border-slate-100">
              <p className="text-slate-400 text-sm mb-2 font-bold uppercase tracking-widest">Havuzda Eksik Bir Şey mi Gördün?</p>
              <button onClick={() => { setEditingItem(null); setIsModalOpen(true); }} className="bg-white border-2 border-slate-100 px-10 py-3 rounded-2xl font-black text-slate-600 hover:border-indigo-600 hover:text-indigo-600 transition-all shadow-sm">
                + Manuel Kelime Ekle
              </button>
            </div>
          </div>
        )}

        {state === 'list' && (
          <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <h2 className="text-2xl sm:text-3xl font-black text-slate-800">Global Kelime Havuzu</h2>
              <div className="relative w-full md:w-96">
                <input
                  type="text"
                  placeholder="Kelime veya anlam ara..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-white border-2 border-slate-100 rounded-xl sm:rounded-2xl px-4 sm:px-6 py-2.5 sm:py-3 pl-10 sm:pl-12 pr-10 sm:pr-12 text-sm sm:text-base font-bold focus:border-indigo-500 outline-none transition-all shadow-sm"
                />
                <span className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-lg sm:text-xl">🔍</span>
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 transition-colors"
                    title="Temizle"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-3 h-3 sm:w-4 sm:h-4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {filteredVocab.length > 0 ? (
                filteredVocab.slice(0, listDisplayLimit).map((item) => (
                  <div key={item.id} className="bg-white p-5 sm:p-6 rounded-[1.5rem] sm:rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-md transition-all group relative overflow-hidden">
                    <div className="flex justify-between items-start mb-3 sm:mb-4">
                      <div className="flex flex-col">
                        <h4 className="text-xl sm:text-2xl font-black text-slate-800">{item.word}</h4>
                        {item.wordTypeEn && (
                          <span className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-tighter italic">({item.wordTypeEn})</span>
                        )}
                      </div>
                      <div className="flex items-center space-x-1">
                        {/* Edit/Delete — only for word owner */}
                        {currentUser && item.userId === currentUser.id && (
                          <div className="flex items-center space-x-1 mr-1">
                            <button
                              onClick={() => { setEditingItem(item); setIsModalOpen(true); }}
                              className="w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center rounded-lg bg-slate-50 hover:bg-indigo-50 text-slate-400 hover:text-indigo-500 transition-colors border border-slate-100"
                              title="Düzenle"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3 h-3 sm:w-3.5 sm:h-3.5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                              </svg>
                            </button>
                            {pendingDeleteId === item.id ? (
                              <div className="flex items-center space-x-1">
                                <button
                                  onClick={() => deleteWord(item)}
                                  className="px-2 py-0.5 bg-red-500 text-white rounded-lg text-[9px] sm:text-[10px] font-black hover:bg-red-600 transition-colors"
                                >
                                  Sil?
                                </button>
                                <button
                                  onClick={() => setPendingDeleteId(null)}
                                  className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded-lg text-[9px] sm:text-[10px] font-black hover:bg-slate-200 transition-colors"
                                >
                                  Hayır
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => setPendingDeleteId(item.id)}
                                className="w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center rounded-lg bg-slate-50 hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors border border-slate-100"
                                title="Sil"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3 h-3 sm:w-3.5 sm:h-3.5">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                                </svg>
                              </button>
                            )}
                          </div>
                        )}
                        <button
                          onClick={() => speak(item.word, 'en-GB')}
                          className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg overflow-hidden border border-slate-200 shadow-sm hover:scale-110 transition-transform"
                          title="Listen UK"
                        >
                          <img src="https://flagcdn.com/w40/gb.png" className="w-full h-full object-cover" alt="UK" />
                        </button>
                        <button
                          onClick={() => speak(item.word, 'en-US')}
                          className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg overflow-hidden border border-slate-200 shadow-sm hover:scale-110 transition-transform"
                          title="Listen US"
                        >
                          <img src="https://flagcdn.com/w40/us.png" className="w-full h-full object-cover" alt="US" />
                        </button>
                      </div>
                    </div>
                    <p className="text-indigo-600 font-black text-base sm:text-lg mb-2 sm:mb-3">{item.meaning}</p>
                    <div className="space-y-1.5 sm:space-y-2 pt-2 sm:pt-3 border-t border-slate-50">
                      <p className="text-[11px] sm:text-xs text-slate-700 font-bold italic leading-relaxed">"{item.exampleSentence}"</p>
                      <p className="text-[9px] sm:text-[10px] text-slate-500 font-medium">{item.exampleSentenceTurkish}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-full py-16 sm:py-20 text-center space-y-4 animate-in fade-in">
                  <div className="text-5xl sm:text-6xl">🏜️</div>
                  <p className="text-slate-500 text-base sm:text-lg font-black max-w-sm mx-auto px-4">
                    Aradığınız kelime henüz kelime havuzuna eklenmemiş
                  </p>
                </div>
              )}
            </div>

            {filteredVocab.length > listDisplayLimit && (
              <div className="flex justify-center pt-4">
                <button
                  onClick={() => setListDisplayLimit(prev => prev + 30)}
                  className="bg-indigo-50 text-indigo-600 px-8 py-3 rounded-2xl font-black hover:bg-indigo-100 transition-all shadow-sm"
                >
                  Daha Fazla Kelime Yükle... ⬇️
                </button>
              </div>
            )}

            <div className="flex justify-center pt-6 sm:pt-8">
              <button onClick={() => { setState('selection'); setListDisplayLimit(30); setPendingDeleteId(null); }} className="text-slate-400 font-bold hover:text-slate-600 uppercase tracking-widest text-xs sm:text-sm">← Ana Menüye Dön</button>
            </div>
          </div>
        )}

        {state === 'learning' && <Flashcards items={shuffleArray(vocabItems).slice(0, 40)} onComplete={async (total) => { await logActivity('flashcards', total, total); setState('selection'); }} />}
        {state === 'quiz' && <Quiz questions={quizQuestions} onClose={async (score, total) => { await logActivity('quiz', score, total); setState('selection'); }} />}
        {state === 'writing' && <WordWriting items={shuffleArray(vocabItems)} onClose={async (score, total) => { await logActivity('writing', score, total); setState('selection'); }} />}
        {state === 'stats' && <Statistics userId={currentUser?.id || ''} vocabItems={vocabItems} onBack={() => setState('selection')} />}
        {state === 'tutor' && <TutorView onBack={() => setState('selection')} />}
        {state === 'games' && <GamesHub vocabItems={vocabItems} onBack={() => setState('selection')} />}
      </main>

      <footer className="mt-4 pt-0 pb-2 bg-white border-t border-slate-100 flex flex-col items-center space-y-1">
        <div className="flex items-center justify-center space-x-4 px-6 text-center">
          <p className="text-indigo-600 font-bold italic text-sm sm:text-base">Beğendiysen belki bana bir kahve ısmarlarsın ;)</p>
          <a href="https://buymeacoffee.com/suattayfuntopak" target="_blank" rel="noopener noreferrer" className="flex items-center space-x-2 bg-[#FFDD00] text-black px-4 py-2 rounded-xl font-bold hover:scale-105 transition-all shadow-lg hover:shadow-yellow-100">
            <span className="text-xl">☕</span>
            <span className="font-black text-sm" style={{ fontFamily: "'Cookie', cursive" }}>Buy me a coffee</span>
          </a>
        </div>
        <div className="border-t border-slate-50 w-full pt-1 flex justify-center">
          <p className="text-[10px] sm:text-xs text-slate-300 font-black uppercase tracking-[0.2em]">DESIGNED BY <span className="text-slate-400">SUAT TAYFUN TOPAK</span></p>
        </div>
      </footer>

      <CookieConsent />
      {isModalOpen && <AddWordModal onAdd={addOrUpdateWord} onClose={() => { setIsModalOpen(false); setEditingItem(null); }} initialData={editingItem} />}
    </div>
  );
};

export default App;
