
import React, { useState, useEffect, useRef } from 'react';
import { AppState, VocabularyItem, QuizQuestion, QuizOption, User, StudyFilterConfig } from './types';
import { analyzeVocabulary } from './services/geminiService';
import { supabase } from './services/supabaseClient';
import { speak } from './utils/speak';
import { getWordDifficulty, updateWordDifficulty } from './utils/wordDifficulty';
import { getFavoriteIds, loadFavoritesFromDB, toggleFavoriteDB } from './utils/favorites';
import { Theme, getStoredTheme, storeTheme, applyTheme } from './utils/theme';
import { Lang, getStoredLang, storeLang, translations } from './utils/i18n';
import { getTagsMap, setWordTagsDB, getAllUserTags, loadTagsFromDB } from './utils/wordTags';
import { getDailyGoal, setDailyGoal, sendGoalNotification, sendStreakNotification, checkAndSendReminderIfDue } from './utils/dailyGoal';
import { logWordResults } from './utils/wordStats';
import { getTodayGoal, isRestDay } from './utils/weeklySchedule';
import { getStoredActiveFilter, storeActiveFilter } from './utils/studyFilters';
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
import UserMenu from './components/UserMenu';
import StudyFilterModal from './components/StudyFilterModal';
import { drainOfflineQueue } from './utils/offlineSync';

const PERSISTABLE_STATES: AppState[] = ['selection', 'list', 'learning', 'writing', 'stats', 'tutor', 'games', 'quiz'];
const HISTORY_STATES: AppState[] = ['selection', 'list', 'learning', 'writing', 'stats', 'tutor', 'games', 'quiz'];
const ACTIVITY_STATES: AppState[] = ['learning', 'quiz', 'writing', 'games', 'tutor'];
const PRESET_TAGS = ['IELTS', 'TOEFL', 'Academic', 'Business', 'Chapter 1', 'Chapter 2', 'Daily', 'Advanced'];

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

const App: React.FC = () => {
  const [state, setState] = useState<AppState>('home');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [vocabItems, setVocabItems] = useState<VocabularyItem[]>([]);
  const [totalPoolCount, setTotalPoolCount] = useState<number>(0);
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  const [flashcardsItems, setFlashcardsItems] = useState<VocabularyItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<VocabularyItem | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [listDisplayLimit, setListDisplayLimit] = useState(30);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  // Theme, language, daily goal
  const [theme, setTheme] = useState<Theme>(getStoredTheme());
  const [lang, setLang] = useState<Lang>(getStoredLang());
  const [dailyGoalValue, setDailyGoalValue] = useState<number>(getDailyGoal());
  const [goalReached, setGoalReached] = useState(false);

  // Word tags
  const [wordTagsMap, setWordTagsMap] = useState<Record<string, string[]>>({});
  const [activeTagFilter, setActiveTagFilter] = useState('');
  const [activeTagEditId, setActiveTagEditId] = useState<string | null>(null);
  const [customTagInput, setCustomTagInput] = useState('');

  // Favorites mode modal
  const [showFavoritesModeModal, setShowFavoritesModeModal] = useState(false);

  // Tag share
  const [shareTagCopied, setShareTagCopied] = useState(false);



  // Study filter states
  const [activeStudyFilter, setActiveStudyFilter] = useState<StudyFilterConfig | null>(null);
  const [isStudyFilterModalOpen, setIsStudyFilterModalOpen] = useState(false);

  // Header/footer visibility (hide on scroll down / activity states)
  const [headerVisible, setHeaderVisible] = useState(true);
  const lastScrollYRef = useRef(0);

  const t = translations[lang];

  // Browser history: track if state change originated from popstate (to avoid double-push)
  const isPopStateNav = useRef(false);

  // Apply theme on load + listen for system changes
  useEffect(() => {
    applyTheme(theme);
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => { if (theme === 'system') applyTheme('system'); };
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [theme]);

  useEffect(() => {
    if (!import.meta.env.VITE_GEMINI_API_KEY && !process.env.API_KEY) {
      setError("Sistem yapılandırması eksik (API Key bulunamadı).");
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        const user: User = {
          id: session.user.id,
          email: session.user.email!,
          name: session.user.user_metadata.name || 'Öğrenci',
          avatarUrl: session.user.user_metadata.avatar_url || undefined,
        };
        setCurrentUser(user);
        fetchAllWords();
        const saved = localStorage.getItem(`swb_state_${user.id}`) as AppState | null;
        setState(saved && PERSISTABLE_STATES.includes(saved) ? saved : 'selection');
        const savedFilter = getStoredActiveFilter(user.id);
        setActiveStudyFilter(savedFilter);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        const user: User = {
          id: session.user.id,
          email: session.user.email!,
          name: session.user.user_metadata.name || 'Öğrenci',
          avatarUrl: session.user.user_metadata.avatar_url || undefined,
        };
        setCurrentUser(user);
        fetchAllWords();
        const saved = localStorage.getItem(`swb_state_${user.id}`) as AppState | null;
        setState(saved && PERSISTABLE_STATES.includes(saved) ? saved : 'selection');
        const savedFilter = getStoredActiveFilter(user.id);
        setActiveStudyFilter(savedFilter);
      } else {
        setCurrentUser(null);
        setVocabItems([]);
        setTotalPoolCount(0);
        setActiveStudyFilter(null);
        setState('home');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Navigate to stats when user clicks a push notification
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;
    const handler = (event: MessageEvent) => {
      if (event.data?.type === 'NOTIFICATION_CLICK') setState('stats');
    };
    navigator.serviceWorker.addEventListener('message', handler);
    return () => navigator.serviceWorker.removeEventListener('message', handler);
  }, []);

  // Drain offline queue when returning online
  useEffect(() => {
    if (!currentUser) return;
    const handleOnline = () => {
      drainOfflineQueue(currentUser.id);
    };
    window.addEventListener('online', handleOnline);
    if (navigator.onLine) {
      drainOfflineQueue(currentUser.id);
    }
    return () => window.removeEventListener('online', handleOnline);
  }, [currentUser?.id]);

  // Daily reminder check — runs every minute when app is open
  useEffect(() => {
    const check = () => checkAndSendReminderIfDue(lang);
    check();
    const id = setInterval(check, 60_000);
    return () => clearInterval(id);
  }, [lang]);

  useEffect(() => {
    window.scrollTo(0, 0);
    setHeaderVisible(!ACTIVITY_STATES.includes(state));
    lastScrollYRef.current = 0;
  }, [state]);

  // Hide header+footer on scroll down, reveal on scroll up
  useEffect(() => {
    const handleScroll = () => {
      const currentY = window.scrollY;
      const diff = currentY - lastScrollYRef.current;
      if (Math.abs(diff) < 5) return;
      if (currentY <= 10) {
        setHeaderVisible(true);
      } else if (diff > 0 && currentY > 80) {
        setHeaderVisible(false);
      } else if (diff < 0) {
        setHeaderVisible(true);
      }
      lastScrollYRef.current = currentY;
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Push state to browser history for back/forward button support
  useEffect(() => {
    if (!isPopStateNav.current && HISTORY_STATES.includes(state)) {
      window.history.pushState({ appState: state }, '', '/');
    }
    isPopStateNav.current = false;
  }, [state]);

  // Handle browser back/forward buttons
  useEffect(() => {
    const handlePopState = (e: PopStateEvent) => {
      const prev = e.state?.appState as AppState | undefined;
      isPopStateNav.current = true;
      if (prev && HISTORY_STATES.includes(prev)) {
        setState(prev);
      } else {
        setState(currentUser ? 'selection' : 'home');
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [currentUser]);

  useEffect(() => {
    if (currentUser && PERSISTABLE_STATES.includes(state)) {
      localStorage.setItem(`swb_state_${currentUser.id}`, state);
    }
  }, [state, currentUser]);

  // Auto-generate quiz when returning to quiz state with empty questions (quiz was persisted)
  useEffect(() => {
    if (state === 'quiz' && quizQuestions.length === 0 && vocabItems.length >= 5) {
      const questions = generateLocalQuiz(vocabItems, currentUser?.id || '');
      setQuizQuestions(questions);
    }
  }, [state, vocabItems.length]);

  useEffect(() => {
    if (currentUser) {
      loadFavoritesFromDB(currentUser.id).then(ids => setFavoriteIds(ids));
    } else {
      setFavoriteIds(new Set());
    }
  }, [currentUser?.id]);

  useEffect(() => {
    if (currentUser) {
      loadTagsFromDB(currentUser.id).then(map => setWordTagsMap(map));
    } else {
      setWordTagsMap({});
    }
  }, [currentUser?.id]);

  const fetchAllWords = async () => {
    try {
      const { count, error: countError } = await supabase
        .from('vocabulary')
        .select('*', { count: 'exact', head: true });

      if (!countError && count !== null) setTotalPoolCount(count);

      let allData: any[] = [];
      let from = 0, to = 999, finished = false;

      while (!finished) {
        const { data, error: fetchError } = await supabase
          .from('vocabulary')
          .select('id, english, turkish, word_type_en, word_type_tr, example_sentence_en, example_sentence_tr, created_at, user_id')
          .order('created_at', { ascending: false })
          .range(from, to);

        if (fetchError) throw fetchError;

        if (data && data.length > 0) {
          allData = [...allData, ...data];
          if (data.length < 1000) finished = true;
          else { from += 1000; to += 1000; }
        } else {
          finished = true;
        }
      }

      const uniqueData = Array.from(new Map(allData.map(item => [String(item.id), item])).values());
      setVocabItems(uniqueData.map(item => ({
        id: String(item.id),
        word: item.english || '',
        meaning: item.turkish || '',
        wordTypeEn: item.word_type_en || '',
        wordTypeTr: item.word_type_tr || '',
        exampleSentence: item.example_sentence_en || '',
        exampleSentenceTurkish: item.example_sentence_tr || '',
        userId: item.user_id || ''
      })));
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
        score,
        total_items: total
      }]);
      if (error) {
        if (error.code === '42P01') {
          setError(lang === 'tr'
            ? 'user_activities tablosu bulunamadı — İstatistikler sayfasını açıp kurulum SQL\'ini çalıştırın.'
            : 'user_activities table missing — open Statistics and run the setup SQL.');
        }
        throw error;
      }
      await checkDailyGoal();
    } catch (e: any) {
      console.error('Aktivite kaydedilemedi:', e?.message || e);
    }
  };

  const STREAK_MILESTONES = [3, 7, 14, 30, 60, 100];

  const checkDailyGoal = async () => {
    if (!currentUser) return;
    const goalForToday = getTodayGoal(currentUser.id, dailyGoalValue);
    if (goalForToday === 0 || isRestDay(currentUser.id)) return;
    const today = new Date().toISOString().split('T')[0];
    const { count } = await supabase
      .from('user_activities')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', currentUser.id)
      .gte('created_at', `${today}T00:00:00`);

    if (count === goalForToday) {
      await sendGoalNotification(goalForToday, lang);
      setGoalReached(true);
      setTimeout(() => setGoalReached(false), 6000);

      // Check streak milestone for special notification
      const { data: recent } = await supabase
        .from('user_activities')
        .select('created_at')
        .eq('user_id', currentUser.id)
        .order('created_at', { ascending: false })
        .limit(200);
      if (recent) {
        const activeDays = new Set(recent.map((r: any) => r.created_at.split('T')[0]));
        let streak = 0;
        const d = new Date();
        while (activeDays.has(d.toISOString().split('T')[0])) {
          streak++;
          d.setDate(d.getDate() - 1);
        }
        if (STREAK_MILESTONES.includes(streak)) {
          await sendStreakNotification(streak, lang);
        }
      }
    }
  };



  const generateLocalQuiz = (items: VocabularyItem[], userId: string = ''): QuizQuestion[] => {
    const pool: VocabularyItem[] = [];
    items.forEach(item => {
      const diff = getWordDifficulty(userId, item.id);
      for (let i = 0; i < diff; i++) pool.push(item);
    });
    const shuffledPool = [...pool].sort(() => Math.random() - 0.5);
    const seen = new Set<string>();
    const selected: VocabularyItem[] = [];
    for (const item of shuffledPool) {
      if (!seen.has(item.id) && selected.length < 20) { seen.add(item.id); selected.push(item); }
    }
    items.filter(i => !seen.has(i.id)).sort(() => Math.random() - 0.5)
      .slice(0, 20 - selected.length).forEach(i => selected.push(i));

    const shuffledAll = [...items].sort(() => Math.random() - 0.5);
    return selected.map(item => {
      const others = shuffledAll.filter(w => w.id !== item.id).slice(0, 4);
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

  const getFilteredStudyWords = (): VocabularyItem[] => {
    if (!activeStudyFilter) return vocabItems;
    return vocabItems.filter(item => {
      // 1. Word types
      if (activeStudyFilter.wordTypes.length > 0) {
        const itemType = item.wordTypeEn?.trim().toLowerCase();
        const matchesType = activeStudyFilter.wordTypes.some(
          t => t.toLowerCase() === itemType
        );
        if (!matchesType) return false;
      }
      // 2. Tags
      if (activeStudyFilter.tags.length > 0) {
        const itemTags = wordTagsMap[item.id] || [];
        const matchesTag = activeStudyFilter.tags.some(t => itemTags.includes(t));
        if (!matchesTag) return false;
      }
      // 3. Favorites Only
      if (activeStudyFilter.favoritesOnly) {
        if (!favoriteIds.has(item.id)) return false;
      }
      // 4. Search Term
      if (activeStudyFilter.searchTerm) {
        const s = activeStudyFilter.searchTerm.toLowerCase().trim();
        const matchesSearch = item.word.toLowerCase().includes(s) || item.meaning.toLowerCase().includes(s);
        if (!matchesSearch) return false;
      }
      return true;
    });
  };

  const startFlashcards = (items: VocabularyItem[]) => {
    setFlashcardsItems(items);
    setState('learning');
  };

  const startRegularFlashcards = () => {
    const uid = currentUser?.id || '';
    const filtered = getFilteredStudyWords();
    if (filtered.length === 0) {
      setError(lang === 'tr' ? 'Seçili filtreye uygun kelime bulunamadı!' : 'No words match the selected filter!');
      return;
    }
    const items = shuffleArray(filtered)
      .slice(0, 40)
      .sort((a, b) => getWordDifficulty(uid, b.id) - getWordDifficulty(uid, a.id));
    startFlashcards(items);
  };

  const startFavoritesFlashcards = () => {
    const favorites = vocabItems.filter(v => favoriteIds.has(v.id));
    if (favorites.length === 0) { setError(t.noFavorites); return; }
    const uid = currentUser?.id || '';
    const items = shuffleArray<VocabularyItem>(favorites)
      .sort((a, b) => getWordDifficulty(uid, b.id) - getWordDifficulty(uid, a.id));
    startFlashcards(items);
    setShowFavoritesModeModal(false);
  };

  const startRegularQuiz = () => {
    const filtered = getFilteredStudyWords();
    if (filtered.length < 5) {
      setError(t.notEnoughFilteredWords(5, filtered.length));
      return;
    }
    const questions = generateLocalQuiz(filtered, currentUser?.id || '');
    setQuizQuestions(questions);
    setState('quiz');
  };

  const startFavoritesQuiz = () => {
    const favorites = vocabItems.filter(v => favoriteIds.has(v.id));
    if (favorites.length < 5) { setError(t.noFavorites5); return; }
    const questions = generateLocalQuiz(favorites, currentUser?.id || '');
    setQuizQuestions(questions);
    setState('quiz');
    setShowFavoritesModeModal(false);
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
        english: item.word, turkish: item.meaning,
        word_type_en: item.wordTypeEn, word_type_tr: item.wordTypeTr,
        example_sentence_en: item.exampleSentence, example_sentence_tr: item.exampleSentenceTurkish,
        user_id: currentUser.id
      };
      let opError;
      if (item.id) {
        const { error } = await supabase.from('vocabulary').update(payload).eq('id', item.id).eq('user_id', currentUser.id);
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

  const toggleFavoriteWord = async (wordId: string) => {
    if (!currentUser) return;
    await toggleFavoriteDB(currentUser.id, wordId);
    setFavoriteIds(getFavoriteIds(currentUser.id));
  };

  const deleteWord = async (item: VocabularyItem) => {
    if (!currentUser || item.userId !== currentUser.id) return;
    try {
      const { error } = await supabase.from('vocabulary').delete().eq('id', item.id).eq('user_id', currentUser.id);
      if (error) throw error;
      setPendingDeleteId(null);
      await fetchAllWords();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const addTagToWord = async (wordId: string, tag: string) => {
    if (!currentUser || !tag.trim()) return;
    const currTags = wordTagsMap[wordId] || [];
    if (currTags.includes(tag)) return;
    const updated = [...currTags, tag];
    await setWordTagsDB(currentUser.id, wordId, updated);
    setWordTagsMap(getTagsMap(currentUser.id));
  };

  const removeTagFromWord = async (wordId: string, tag: string) => {
    if (!currentUser) return;
    const updated = (wordTagsMap[wordId] || []).filter(tg => tg !== tag);
    await setWordTagsDB(currentUser.id, wordId, updated);
    setWordTagsMap(getTagsMap(currentUser.id));
  };

  const handleThemeChange = (t: Theme) => {
    setTheme(t);
    storeTheme(t);
    applyTheme(t);
  };

  const handleLangChange = (l: Lang) => {
    setLang(l);
    storeLang(l);
  };

  const handleDailyGoalChange = (n: number) => {
    const clamped = Math.max(1, Math.min(20, n));
    setDailyGoalValue(clamped);
    setDailyGoal(clamped);
  };

  const shareTagWords = () => {
    if (!activeTagFilter || filteredVocab.length === 0) return;
    const header = lang === 'tr'
      ? `📚 "${activeTagFilter}" Kelime Listesi — Super Word Buddy\n\n`
      : `📚 "${activeTagFilter}" Word List — Super Word Buddy\n\n`;
    const list = filteredVocab.map((w, i) => `${i + 1}. ${w.word} — ${w.meaning}`).join('\n');
    navigator.clipboard.writeText(header + list).then(() => {
      setShareTagCopied(true);
      setTimeout(() => setShareTagCopied(false), 2500);
    });
  };

  const filteredVocab = (() => {
    let list = searchTerm.trim() === ''
      ? vocabItems
      : vocabItems.filter(item =>
          item.word.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.meaning.toLowerCase().includes(searchTerm.toLowerCase())
        );
    if (showFavoritesOnly) list = list.filter(item => favoriteIds.has(item.id));
    if (activeTagFilter) list = list.filter(item => (wordTagsMap[item.id] || []).includes(activeTagFilter));
    return list;
  })();

  const allTags = getAllUserTags(currentUser?.id || '');

  return (
    <div className="min-h-screen flex flex-col bg-[#fdfbf7]">
      {/* Header */}
      <header className={`bg-white/95 backdrop-blur-md sticky top-0 z-20 py-3 sm:py-5 border-b border-slate-200 shadow-sm transition-transform duration-300 ease-in-out ${headerVisible ? 'translate-y-0' : '-translate-y-full'}`}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex justify-between items-center">
          <div className="flex items-center space-x-2 sm:space-x-3 cursor-pointer" onClick={() => currentUser ? setState('selection') : setState('home')}>
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-indigo-600 rounded-lg sm:rounded-xl flex items-center justify-center text-white text-lg sm:text-xl shadow-lg">🚀</div>
            <div className="flex flex-col">
              <h1 className="text-base sm:text-xl font-black text-slate-800 leading-none">Super Word Buddy</h1>
              <span className="text-[8px] sm:text-[10px] font-black text-indigo-500 uppercase tracking-tighter">{t.subtitle}</span>
            </div>
          </div>
          <nav className="flex items-center space-x-2 sm:space-x-4">
            {currentUser ? (
              <div className="flex items-center space-x-2 sm:space-x-3">
                <div className="hidden lg:flex flex-col items-end mr-2">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">{t.poolLabel}</span>
                  <span className="text-sm font-black text-indigo-600">{totalPoolCount.toLocaleString('tr-TR')} {t.words}</span>
                </div>
                <button
                  onClick={() => { setState('selection'); setSearchTerm(''); }}
                  className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center rounded-full bg-slate-50 hover:bg-indigo-50 text-xl sm:text-2xl transition-all shadow-inner border border-slate-100"
                  title={t.homeMenu}
                >🏠</button>
                <button onClick={() => setState('upload')} className="bg-indigo-600 text-white px-3 sm:px-5 py-1.5 sm:py-2 rounded-lg sm:rounded-xl text-xs sm:text-sm font-black shadow-lg hover:bg-indigo-700 transition-all whitespace-nowrap">
                  {t.uploadBtn}
                </button>
                <UserMenu
                  userName={currentUser.name}
                  userEmail={currentUser.email}
                  userId={currentUser.id}
                  avatarUrl={currentUser.avatarUrl}
                  theme={theme}
                  lang={lang}
                  onThemeChange={handleThemeChange}
                  onLangChange={handleLangChange}
                  onAvatarChange={(url) => setCurrentUser(prev => prev ? { ...prev, avatarUrl: url } : null)}
                  onLogout={handleLogout}
                />
              </div>
            ) : (
              <button onClick={() => setState('login')} className="bg-slate-800 text-white px-4 sm:px-5 py-2 rounded-lg sm:rounded-xl text-xs sm:text-sm font-black">{t.loginBtn}</button>
            )}
          </nav>
        </div>
      </header>

      {/* Daily goal reached toast */}
      {goalReached && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[200] animate-in slide-in-from-top-4 duration-500 pointer-events-none">
          <div className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-8 py-4 rounded-2xl shadow-2xl font-black text-center">
            <div className="text-2xl mb-1">🏆</div>
            <p className="text-sm">{t.goalReached(dailyGoalValue)}</p>
          </div>
        </div>
      )}

      <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 pt-2 sm:pt-4 pb-0">
        {error && (
          <div className="mb-8 p-6 bg-red-50 border-2 border-red-100 text-red-600 rounded-[2rem] text-center font-bold animate-in slide-in-from-top-4 duration-300 shadow-lg shadow-red-50">
            <div className="flex items-center justify-center space-x-3">
              <span className="text-2xl">🚨</span>
              <p>{error}</p>
            </div>
            <button onClick={() => setError(null)} className="mt-4 text-xs font-black uppercase tracking-widest bg-white px-4 py-2 rounded-full border border-red-100 hover:bg-red-100 transition-colors">{t.understood}</button>
          </div>
        )}

        {/* Home */}
        {state === 'home' && (
          <div className="flex flex-col items-center justify-center space-y-6 sm:space-y-10 py-8 sm:py-16 text-center">
            <div className="w-24 h-24 sm:w-32 sm:h-32 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-[2rem] sm:rounded-[2.5rem] shadow-2xl flex items-center justify-center text-5xl sm:text-6xl">🎓</div>
            <div className="space-y-4">
              <h2 className="text-3xl sm:text-5xl md:text-6xl font-black text-slate-900 tracking-tighter leading-tight px-2">
                {t.tagline1} <br/><span className="text-indigo-600">{t.tagline2}</span>
              </h2>
              <p className="text-base sm:text-lg text-slate-500 max-w-xl mx-auto font-medium leading-relaxed px-4">{t.homeBody}</p>
            </div>
            <button onClick={() => setState('signup')} className="bg-indigo-600 text-white px-6 sm:px-10 py-3 sm:py-4 rounded-xl sm:rounded-2xl text-base sm:text-lg font-black shadow-xl hover:scale-105 transition-all">
              {t.joinBtn}
            </button>
          </div>
        )}

        {(state === 'login' || state === 'signup') && (
          <AuthForm mode={state} onAuthSuccess={(user) => { setCurrentUser(user); setState('selection'); }} onToggleMode={(newMode) => setState(newMode)} />
        )}

        {state === 'upload' && <FileUpload onFileSelect={handleFileSelect} />}

        {state === 'analyzing' && (
          <div className="flex flex-col items-center justify-center py-24 space-y-6 text-center">
            <div className="w-20 h-20 border-8 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
            <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tighter">{t.processing}</h3>
            <p className="text-slate-400 font-medium max-w-sm">{t.processingDesc}</p>
          </div>
        )}

        {/* Selection Grid */}
        {state === 'selection' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-6 duration-500">
            <div className="text-center space-y-2">
              <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight italic whitespace-nowrap">{t.homeTitle}</h2>
              <p className="text-slate-400 text-base sm:text-lg font-medium">{t.poolDesc(totalPoolCount)}</p>
            </div>

            {/* Active study filter bar */}
            {activeStudyFilter && (
              <div className="bg-indigo-50/70 border border-indigo-100/50 rounded-3xl p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4 animate-in slide-in-from-top-4 duration-300">
                <div className="flex items-center gap-3">
                  <span className="text-2xl sm:text-3xl">🔍</span>
                  <div className="text-left">
                    <h4 className="text-sm font-black text-indigo-900 leading-none">{t.activeFilterAlert}</h4>
                    <p className="text-xs font-bold text-indigo-500 mt-1 max-w-md">
                      {t.activeFilterGenericDesc(getFilteredStudyWords().length)}: <span className="text-indigo-700 italic">
                        {(() => {
                          const parts: string[] = [];
                          if (activeStudyFilter.wordTypes.length > 0) parts.push(activeStudyFilter.wordTypes.join(', '));
                          if (activeStudyFilter.tags.length > 0) parts.push(activeStudyFilter.tags.map(tg => `#${tg}`).join(', '));
                          if (activeStudyFilter.favoritesOnly) parts.push(lang === 'tr' ? 'Favoriler' : 'Favorites');
                          if (activeStudyFilter.searchTerm) parts.push(`"${activeStudyFilter.searchTerm}"`);
                          return parts.join(' · ') || (lang === 'tr' ? 'Özel Filtre' : 'Custom Filter');
                        })()}
                      </span>
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => setIsStudyFilterModalOpen(true)}
                    className="px-4 py-2 bg-indigo-100 hover:bg-indigo-200 text-indigo-700 rounded-xl text-xs font-black transition-colors"
                  >
                    ✏️ {lang === 'tr' ? 'Düzenle' : 'Edit'}
                  </button>
                  <button
                    onClick={() => {
                      setActiveStudyFilter(null);
                      storeActiveFilter(currentUser?.id || '', null);
                    }}
                    className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-500 rounded-xl text-xs font-black border border-slate-200 transition-colors"
                  >
                    ✕ {lang === 'tr' ? 'Temizle' : 'Clear'}
                  </button>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              <div onClick={startRegularFlashcards} className="bg-gradient-to-br from-blue-400 to-cyan-500 p-8 rounded-[2.5rem] shadow-xl hover:scale-[1.03] transition-all cursor-pointer text-center group text-white">
                <div className="text-5xl mb-4 group-hover:animate-bounce">📚</div>
                <h3 className="text-2xl font-black text-slate-100">{t.flashcards}</h3>
                <p className="text-sm text-white/70 mt-2 font-bold">{t.flashcardsSub}</p>
              </div>
              <div onClick={startRegularQuiz} className="bg-gradient-to-br from-amber-400 to-orange-500 p-8 rounded-[2.5rem] shadow-xl hover:scale-[1.03] transition-all cursor-pointer text-center group text-white">
                <div className="text-5xl mb-4 group-hover:animate-bounce">🎓</div>
                <h3 className="text-2xl font-black text-slate-100">{t.quiz}</h3>
                <p className="text-sm text-white/70 mt-2 font-bold">{t.quizSub}</p>
              </div>
              <div onClick={() => {
                const count = getFilteredStudyWords().length;
                if (count === 0) {
                  setError(lang === 'tr' ? 'Filtrenizle eşleşen kelime bulunamadı!' : 'No words match your filter!');
                } else {
                  setState('writing');
                }
              }} className="bg-gradient-to-br from-emerald-400 to-teal-500 p-8 rounded-[2.5rem] shadow-xl hover:scale-[1.03] transition-all cursor-pointer text-center group text-white">
                <div className="text-5xl mb-4 group-hover:animate-bounce">✍️</div>
                <h3 className="text-2xl font-black text-slate-100">{t.writing}</h3>
                <p className="text-sm text-white/70 mt-2 font-bold">{t.writingSub}</p>
              </div>
              <div onClick={() => { setListDisplayLimit(30); setState('list'); }} className="bg-gradient-to-br from-rose-400 to-pink-500 p-8 rounded-[2.5rem] shadow-xl hover:scale-[1.03] transition-all cursor-pointer text-center group text-white">
                <div className="text-5xl mb-4 group-hover:animate-bounce">🌍</div>
                <h3 className="text-2xl font-black text-slate-100">{t.pool}</h3>
                <p className="text-sm text-white/70 mt-2 font-bold">{t.poolSub}</p>
              </div>
              <div onClick={() => setState('tutor')} className="bg-gradient-to-br from-indigo-500 to-purple-600 p-8 rounded-[2.5rem] shadow-xl hover:scale-[1.03] transition-all cursor-pointer text-center group text-white">
                <div className="text-5xl mb-4 group-hover:animate-bounce">🧠</div>
                <h3 className="text-2xl font-black text-slate-100">{t.tutor}</h3>
                <p className="text-sm text-white/70 mt-2 font-bold">{t.tutorSub}</p>
              </div>
              <div onClick={() => {
                const count = getFilteredStudyWords().length;
                if (count < 6) {
                  setError(t.notEnoughFilteredWords(6, count));
                } else {
                  setState('games');
                }
              }} className="bg-gradient-to-br from-orange-400 to-pink-500 p-8 rounded-[2.5rem] shadow-xl hover:scale-[1.03] transition-all cursor-pointer text-center group text-white">
                <div className="text-5xl mb-4 group-hover:animate-bounce">🎮</div>
                <h3 className="text-2xl font-black text-slate-100">{t.games}</h3>
                <p className="text-sm text-white/70 mt-2 font-bold">{t.gamesSub}</p>
              </div>

              {/* Favorites Card */}
              <div
                onClick={() => favoriteIds.size > 0 ? setShowFavoritesModeModal(true) : setError(t.noFavorites)}
                className="bg-gradient-to-br from-pink-500 to-rose-600 p-8 rounded-[2.5rem] shadow-xl hover:scale-[1.03] transition-all cursor-pointer text-center group text-white"
              >
                <div className="text-5xl mb-4 group-hover:animate-bounce">❤️</div>
                <h3 className="text-2xl font-black text-slate-100">{t.favoritesCard}</h3>
                <p className="text-sm text-white/70 mt-2 font-bold">{t.favoritesSub} ({favoriteIds.size})</p>
              </div>

              {/* Study Filter Card */}
              <div
                onClick={() => setIsStudyFilterModalOpen(true)}
                className="bg-gradient-to-br from-emerald-400 to-teal-500 p-8 rounded-[2.5rem] shadow-xl hover:scale-[1.03] transition-all cursor-pointer text-center group text-white"
              >
                <div className="text-5xl mb-4 group-hover:animate-bounce">🔍</div>
                <h3 className="text-2xl font-black text-slate-100">{t.studyFilterCard}</h3>
                <p className="text-sm text-white/70 mt-2 font-bold">
                  {activeStudyFilter ? `${getFilteredStudyWords().length} ${lang === 'tr' ? 'Seçili' : 'Selected'}` : (lang === 'tr' ? 'Tümü' : 'All')}
                </p>
              </div>

              {/* Statistics Card */}
              <div
                onClick={() => setState('stats')}
                className="bg-gradient-to-br from-blue-400 to-cyan-500 p-8 rounded-[2.5rem] shadow-xl hover:scale-[1.03] transition-all cursor-pointer text-center group text-white"
              >
                <div className="text-5xl mb-4 group-hover:animate-bounce">📊</div>
                <h3 className="text-2xl font-black text-slate-100">{t.statsTitle}</h3>
                <p className="text-sm text-white/70 mt-2 font-bold">{lang === 'tr' ? 'İlerlemeni Gör' : 'Track Progress'}</p>
              </div>
            </div>

            <div className="flex flex-col items-center pt-4 border-t border-slate-100">
              <button onClick={() => { setEditingItem(null); setIsModalOpen(true); }} className="bg-violet-50 border-2 border-violet-100 px-10 py-3 rounded-2xl font-black text-violet-500 hover:border-violet-400 hover:text-violet-700 hover:bg-violet-100 transition-all shadow-sm">
                {t.addWordBtn}
              </button>
            </div>
          </div>
        )}

        {/* Word List */}
        {state === 'list' && (
          <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <h2 className="text-2xl sm:text-3xl font-black text-slate-800">{t.listTitle}</h2>
              <div className="flex items-center gap-2 w-full md:w-auto">
                <div className="relative flex-1 md:w-96">
                  <input
                    type="text"
                    placeholder={t.searchPlaceholder}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-white border-2 border-slate-100 rounded-xl sm:rounded-2xl px-4 sm:px-6 py-2.5 sm:py-3 pl-10 sm:pl-12 pr-10 sm:pr-12 text-sm sm:text-base font-bold focus:border-indigo-500 outline-none transition-all shadow-sm"
                  />
                  <span className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-lg sm:text-xl">🔍</span>
                  {searchTerm && (
                    <button onClick={() => setSearchTerm('')} className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 transition-colors">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-3 h-3 sm:w-4 sm:h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  )}
                </div>
                <button
                  onClick={() => setShowFavoritesOnly(v => !v)}
                  className={`flex items-center space-x-1.5 px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl font-black text-xs sm:text-sm transition-all border-2 whitespace-nowrap ${showFavoritesOnly ? 'bg-red-50 border-red-200 text-red-500' : 'bg-white border-slate-100 text-slate-400 hover:border-red-200 hover:text-red-400'}`}
                >
                  <span>{showFavoritesOnly ? '❤️' : '🤍'}</span>
                  <span className="hidden sm:inline">{t.favoritesFilter}</span>
                </button>
                <button
                  onClick={() => { setState('selection'); setListDisplayLimit(30); setPendingDeleteId(null); setActiveTagEditId(null); setActiveTagFilter(''); }}
                  className="flex items-center justify-center px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl font-black text-xs sm:text-sm transition-all border-2 bg-white border-slate-100 text-slate-400 hover:border-red-200 hover:text-red-500 shadow-sm"
                  title={lang === 'tr' ? 'Kapat' : 'Close'}
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Tag filter bar */}
            {allTags.length > 0 && (
              <div className="flex items-center gap-2 overflow-x-auto pb-1 -mx-1 px-1">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest shrink-0">{t.tagFilter}:</span>
                <button
                  onClick={() => setActiveTagFilter('')}
                  className={`shrink-0 px-3 py-1 rounded-full text-xs font-black transition-all border ${!activeTagFilter ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white border-slate-200 text-slate-500 hover:border-indigo-300'}`}
                >
                  {t.clearTagFilter}
                </button>
                {allTags.map(tag => (
                  <button
                    key={tag}
                    onClick={() => setActiveTagFilter(activeTagFilter === tag ? '' : tag)}
                    className={`shrink-0 px-3 py-1 rounded-full text-xs font-black transition-all border ${activeTagFilter === tag ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white border-slate-200 text-slate-500 hover:border-indigo-300'}`}
                  >
                    🏷️ {tag}
                  </button>
                ))}
                {activeTagFilter && (
                  <button
                    onClick={shareTagWords}
                    className={`shrink-0 px-3 py-1 rounded-full text-xs font-black transition-all border ${shareTagCopied ? 'bg-green-500 text-white border-green-500' : 'bg-white border-indigo-200 text-indigo-500 hover:bg-indigo-50 hover:border-indigo-400'}`}
                  >
                    {shareTagCopied ? `✓ ${lang === 'tr' ? 'Kopyalandı!' : 'Copied!'}` : `📤 ${lang === 'tr' ? 'Paylaş' : 'Share'}`}
                  </button>
                )}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {filteredVocab.length > 0 ? (
                filteredVocab.slice(0, listDisplayLimit).map((item) => {
                  return (
                  <div
                    key={item.id}
                    className="bg-white p-5 sm:p-6 rounded-[1.5rem] sm:rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-md transition-all group relative overflow-hidden"
                  >
                    <div className="flex justify-between items-start mb-3 sm:mb-4">
                      <div className="flex flex-col">
                        <h4 className="text-xl sm:text-2xl font-black text-slate-800">{item.word}</h4>
                        {item.wordTypeEn && (
                          <span className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-tighter italic">({item.wordTypeEn})</span>
                        )}
                      </div>
                      <div className="flex items-center space-x-1">
                        {/* Tag button */}
                        <button
                          onClick={() => { setActiveTagEditId(activeTagEditId === item.id ? null : item.id); setCustomTagInput(''); }}
                          className="w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center rounded-lg bg-slate-50 hover:bg-amber-50 transition-colors border border-slate-100"
                          title={lang === 'tr' ? 'Etiketle' : 'Tag'}
                        >
                          <span className="text-sm leading-none">🏷️</span>
                        </button>
                        {/* Favorite */}
                        <button
                          onClick={() => toggleFavoriteWord(item.id)}
                          className="w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center rounded-lg bg-slate-50 hover:bg-red-50 transition-colors border border-slate-100"
                          title={favoriteIds.has(item.id) ? (lang === 'tr' ? 'Favorilerden Çıkar' : 'Remove from Favorites') : (lang === 'tr' ? 'Favorilere Ekle' : 'Add to Favorites')}
                        >
                          <span className="text-sm leading-none">{favoriteIds.has(item.id) ? '❤️' : '🤍'}</span>
                        </button>
                        {/* Edit/Delete — only for owner */}
                        {currentUser && item.userId === currentUser.id && (
                          <div className="flex items-center space-x-1 mr-1">
                            <button
                              onClick={() => { setEditingItem(item); setIsModalOpen(true); }}
                              className="w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center rounded-lg bg-slate-50 hover:bg-indigo-50 text-slate-400 hover:text-indigo-500 transition-colors border border-slate-100"
                              title="Düzenle"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3 h-3 sm:w-3.5 sm:h-3.5"><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" /></svg>
                            </button>
                            {pendingDeleteId === item.id ? (
                              <div className="flex items-center space-x-1">
                                <button onClick={() => deleteWord(item)} className="px-2 py-0.5 bg-red-500 text-white rounded-lg text-[9px] sm:text-[10px] font-black hover:bg-red-600 transition-colors">{t.deleteBtn}</button>
                                <button onClick={() => setPendingDeleteId(null)} className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded-lg text-[9px] sm:text-[10px] font-black hover:bg-slate-200 transition-colors">{t.cancelBtn}</button>
                              </div>
                            ) : (
                              <button onClick={() => setPendingDeleteId(item.id)} className="w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center rounded-lg bg-slate-50 hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors border border-slate-100" title="Sil">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3 h-3 sm:w-3.5 sm:h-3.5"><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>
                              </button>
                            )}
                          </div>
                        )}
                        <button onClick={() => speak(item.word, 'en-GB')} className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg overflow-hidden border border-slate-200 shadow-sm hover:scale-110 transition-transform" title="Listen UK">
                          <img src="https://flagcdn.com/w40/gb.png" className="w-full h-full object-cover" alt="UK" />
                        </button>
                        <button onClick={() => speak(item.word, 'en-US')} className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg overflow-hidden border border-slate-200 shadow-sm hover:scale-110 transition-transform" title="Listen US">
                          <img src="https://flagcdn.com/w40/us.png" className="w-full h-full object-cover" alt="US" />
                        </button>
                      </div>
                    </div>
                    <p className="text-indigo-600 font-black text-base sm:text-lg mb-2 sm:mb-3">{item.meaning}</p>
                    <div className="space-y-1.5 sm:space-y-2 pt-2 sm:pt-3 border-t border-slate-50">
                      <p className="text-[11px] sm:text-xs text-slate-700 font-bold italic leading-relaxed">"{item.exampleSentence}"</p>
                      <p className="text-[9px] sm:text-[10px] text-slate-500 font-medium">{item.exampleSentenceTurkish}</p>
                    </div>

                    {/* Tag chips */}
                    {(wordTagsMap[item.id] || []).length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2 pt-2 border-t border-slate-50">
                        {(wordTagsMap[item.id] || []).map(tag => (
                          <span key={tag} className="inline-flex items-center px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded-lg text-[10px] font-black border border-indigo-100">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Inline tag editor */}
                    {activeTagEditId === item.id && (
                      <div className="mt-3 p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-2">
                        {/* Current tags with remove */}
                        {(wordTagsMap[item.id] || []).length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {(wordTagsMap[item.id] || []).map(tag => (
                              <span key={tag} className="inline-flex items-center px-2 py-0.5 bg-indigo-100 text-indigo-600 rounded-lg text-[10px] font-black">
                                {tag}
                                <button onClick={() => removeTagFromWord(item.id, tag)} className="ml-1 text-indigo-400 hover:text-red-500 font-black leading-none">×</button>
                              </span>
                            ))}
                          </div>
                        )}
                        {/* Preset tag quick-add */}
                        <div className="flex flex-wrap gap-1">
                          {PRESET_TAGS.filter(pt => !(wordTagsMap[item.id] || []).includes(pt)).map(pt => (
                            <button key={pt} onClick={() => addTagToWord(item.id, pt)} className="px-2 py-0.5 bg-white border border-slate-200 text-slate-500 rounded-lg text-[10px] font-bold hover:bg-indigo-50 hover:text-indigo-500 hover:border-indigo-200 transition-colors">
                              +{pt}
                            </button>
                          ))}
                        </div>
                        {/* Custom tag input */}
                        <input
                          type="text"
                          placeholder={t.addTag}
                          value={customTagInput}
                          onChange={e => setCustomTagInput(e.target.value)}
                          onKeyDown={e => {
                            if (e.key === 'Enter' && customTagInput.trim()) {
                              addTagToWord(item.id, customTagInput.trim());
                              setCustomTagInput('');
                            }
                          }}
                          className="w-full text-[11px] px-3 py-1.5 bg-white border border-slate-200 rounded-lg font-medium focus:border-indigo-400 outline-none"
                        />
                        <button onClick={() => setActiveTagEditId(null)} className="w-full text-[10px] text-slate-400 font-bold hover:text-slate-600 text-center py-0.5">
                          {t.closeTag}
                        </button>
                      </div>
                    )}
                  </div>
                  );
                })
              ) : (
                <div className="col-span-full py-16 sm:py-20 text-center space-y-4 animate-in fade-in">
                  <div className="text-5xl sm:text-6xl">🏜️</div>
                  <p className="text-slate-500 text-base sm:text-lg font-black max-w-sm mx-auto px-4">{t.notFound}</p>
                </div>
              )}
            </div>

            {filteredVocab.length > listDisplayLimit && (
              <div className="flex justify-center pt-4">
                <button onClick={() => setListDisplayLimit(prev => prev + 30)} className="bg-indigo-50 text-indigo-600 px-8 py-3 rounded-2xl font-black hover:bg-indigo-100 transition-all shadow-sm">
                  {t.loadMore}
                </button>
              </div>
            )}

            <div className="flex justify-center pt-6 sm:pt-8 pb-4">
              <button onClick={() => { setState('selection'); setListDisplayLimit(30); setPendingDeleteId(null); setActiveTagEditId(null); setActiveTagFilter(''); }} className="text-slate-400 font-bold hover:text-slate-600 uppercase tracking-widest text-xs sm:text-sm">
                {t.backToMenu}
              </button>
            </div>


          </div>
        )}

        {state === 'learning' && <Flashcards
          items={flashcardsItems}
          lang={lang}
          onCancel={() => setState('selection')}
          onComplete={async (total) => { await logActivity('flashcards', total, total); setState('selection'); }}
        />}
        {state === 'quiz' && <Quiz questions={quizQuestions} lang={lang}
          onCancel={() => setState('selection')}
          onClose={async (score, total, wrongWordStrings) => {
            await logActivity('quiz', score, total);
            if (currentUser) {
              const wordResults = quizQuestions.map(q => {
                const item = vocabItems.find(v => v.word === q.word);
                if (!item) return null;
                const isWrong = wrongWordStrings.includes(q.word);
                updateWordDifficulty(currentUser.id, item.id, !isWrong);
                return { wordId: item.id, correct: isWrong ? 0 : 1, wrong: isWrong ? 1 : 0 };
              }).filter(Boolean) as { wordId: string; correct: number; wrong: number }[];
              logWordResults(currentUser.id, wordResults);
            }
            setState('selection');
          }}
          onPracticeWrong={async (score, total, wrongWordStrings) => {
            await logActivity('quiz', score, total);
            if (currentUser) {
              const wordResults = quizQuestions.map(q => {
                const item = vocabItems.find(v => v.word === q.word);
                if (!item) return null;
                const isWrong = wrongWordStrings.includes(q.word);
                updateWordDifficulty(currentUser.id, item.id, !isWrong);
                return { wordId: item.id, correct: isWrong ? 0 : 1, wrong: isWrong ? 1 : 0 };
              }).filter(Boolean) as { wordId: string; correct: number; wrong: number }[];
              logWordResults(currentUser.id, wordResults);
            }
            const wrongItems = vocabItems.filter(v => wrongWordStrings.includes(v.word));
            if (wrongItems.length > 0) {
              startFlashcards(wrongItems);
            } else {
              setState('selection');
            }
          }}
        />}
        {state === 'writing' && <WordWriting items={shuffleArray(getFilteredStudyWords())} lang={lang} onClose={async (score, total, wordResults) => {
          await logActivity('writing', score, total);
          if (currentUser && wordResults && wordResults.length > 0) {
            logWordResults(currentUser.id, wordResults);
          }
          setState('selection');
        }} />}
        {state === 'stats' && <Statistics userId={currentUser?.id || ''} vocabItems={vocabItems} onBack={() => setState('selection')} dailyGoal={getTodayGoal(currentUser?.id || '', dailyGoalValue)} lang={lang} />}
        {state === 'tutor' && <TutorView onBack={() => setState('selection')} />}
        {state === 'games' && <GamesHub vocabItems={getFilteredStudyWords()} lang={lang} onBack={() => setState('selection')} />}
      </main>

      <footer className={`pt-1 pb-2 bg-white border-t border-slate-100 flex justify-center transition-all duration-300 ease-in-out ${headerVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        <p className="text-[9px] sm:text-[10px] text-slate-300 font-black uppercase tracking-[0.2em]">{t.designedBy} <span className="text-slate-400">SUAT TAYFUN TOPAK</span></p>
      </footer>
      <CookieConsent />
      {isModalOpen && <AddWordModal onAdd={addOrUpdateWord} onClose={() => { setIsModalOpen(false); setEditingItem(null); }} initialData={editingItem} />}

      {/* Favorites mode modal */}
      {showFavoritesModeModal && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4" onClick={() => setShowFavoritesModeModal(false)}>
          <div className="bg-white rounded-[2rem] p-6 max-w-xs w-full shadow-2xl animate-in zoom-in-95 duration-300" onClick={e => e.stopPropagation()}>
            <h3 className="text-xl font-black text-slate-800 mb-1 text-center">{t.favModeTitle}</h3>
            <p className="text-xs text-slate-400 font-bold text-center mb-5">{t.favModeCount(favoriteIds.size)}</p>
            <div className="grid grid-cols-2 gap-3">
              <button onClick={startFavoritesFlashcards} className="bg-gradient-to-br from-blue-400 to-cyan-500 text-white p-5 rounded-[1.5rem] font-black text-sm flex flex-col items-center space-y-2 hover:scale-105 transition-all shadow-lg">
                <span className="text-3xl">📚</span>
                <span>Flashcards</span>
              </button>
              <button onClick={startFavoritesQuiz} className="bg-gradient-to-br from-amber-400 to-orange-500 text-white p-5 rounded-[1.5rem] font-black text-sm flex flex-col items-center space-y-2 hover:scale-105 transition-all shadow-lg">
                <span className="text-3xl">🎓</span>
                <span>Quiz</span>
              </button>
            </div>
            <button onClick={() => setShowFavoritesModeModal(false)} className="w-full mt-3 py-2 text-slate-400 font-bold text-sm hover:text-slate-600 transition-colors">
              {t.favModeCancel}
            </button>
          </div>
        </div>
      )}



      {/* Study filter modal */}
      <StudyFilterModal
        isOpen={isStudyFilterModalOpen}
        onClose={() => setIsStudyFilterModalOpen(false)}
        vocabItems={vocabItems}
        wordTagsMap={wordTagsMap}
        favoriteIds={favoriteIds}
        lang={lang}
        userId={currentUser?.id || ''}
        activeFilter={activeStudyFilter}
        onApply={(filter) => {
          setActiveStudyFilter(filter);
          storeActiveFilter(currentUser?.id || '', filter);
        }}
      />
    </div>
  );
};

export default App;
