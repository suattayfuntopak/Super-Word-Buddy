
export interface VocabularyItem {
  id: string;
  word: string; // maps to 'english'
  meaning: string; // maps to 'turkish'
  wordTypeEn: string; // maps to 'word_type_en' (noun, verb, etc.)
  wordTypeTr: string; // maps to 'word_type_tr' (isim, fiil, vb.)
  exampleSentence: string; // maps to 'example_sentence_en'
  exampleSentenceTurkish: string; // maps to 'example_sentence_tr'
  userId?: string; // maps to 'user_id', used for ownership checks
}

export interface User {
  id: string;
  email: string;
  password?: string;
  name: string;
  avatarUrl?: string;
}

export type AppState = 'home' | 'login' | 'signup' | 'upload' | 'analyzing' | 'selection' | 'learning' | 'quiz' | 'list' | 'writing' | 'stats' | 'tutor' | 'games';

export interface QuizOption {
  text: string;
  meaning: string;
  wordTypeEn: string;
  wordTypeTr: string;
}

export interface QuizQuestion {
  question: string;
  options: QuizOption[];
  correctAnswer: string;
  word: string;
}

export interface TutorMaterial {
  summary: string;
  keyVocabulary: {
    word: string;
    meaning: string;
    synonym: string;
    antonym: string;
  }[];
  questions: {
    question: string;
    options: string[];
    answer: string;
    explanation: string;
  }[];
}

export interface StudyFilterConfig {
  wordTypes: string[];
  tags: string[];
  favoritesOnly: boolean;
  searchTerm: string;
}

export interface SavedStudyFilter {
  id?: string;
  name: string;
  config: StudyFilterConfig;
}

