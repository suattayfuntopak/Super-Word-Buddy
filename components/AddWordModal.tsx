
import React, { useState, useEffect } from 'react';
import { VocabularyItem } from '../types';

interface AddWordModalProps {
  onAdd: (item: VocabularyItem) => void;
  onClose: () => void;
  initialData?: VocabularyItem | null;
}

const AddWordModal: React.FC<AddWordModalProps> = ({ onAdd, onClose, initialData }) => {
  const [formData, setFormData] = useState<Partial<VocabularyItem>>({
    word: '',
    meaning: '',
    wordTypeEn: '',
    wordTypeTr: '',
    exampleSentence: '',
    exampleSentenceTurkish: ''
  });

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    }
  }, [initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.word || !formData.meaning) return;
    onAdd(formData as VocabularyItem);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-xl rounded-[2.5rem] sm:rounded-[4rem] shadow-3xl p-6 sm:p-10 border-4 border-white relative overflow-hidden h-[90vh] overflow-y-auto">
        <div className="relative z-10">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl sm:text-4xl font-black text-slate-800 tracking-tight">
              {initialData ? 'Düzenle ✏️' : 'Yeni Kelime 🎨'}
            </h2>
            <button onClick={onClose} className="bg-slate-50 text-slate-400 hover:text-slate-600 p-2 sm:p-3 rounded-full">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-5 h-5 sm:w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 pb-8">
            <div className="space-y-1 sm:space-y-2">
              <label className="text-[10px] sm:text-xs font-black text-slate-400 uppercase tracking-widest ml-4">İngilizcesi (english)</label>
              <input 
                required
                className="w-full bg-slate-50 border-4 border-transparent rounded-2xl sm:rounded-[2rem] p-3 sm:p-4 focus:border-blue-100 focus:bg-white outline-none text-lg sm:text-xl font-bold text-slate-700 transition-all"
                value={formData.word}
                onChange={e => setFormData({...formData, word: e.target.value})}
                placeholder="Örn: Resilience"
              />
            </div>

            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <div className="space-y-1 sm:space-y-2">
                <label className="text-[10px] sm:text-xs font-black text-slate-400 uppercase tracking-widest ml-4">İng. Tür</label>
                <input 
                  className="w-full bg-slate-50 border-4 border-transparent rounded-2xl sm:rounded-[2rem] p-3 sm:p-4 focus:border-blue-100 focus:bg-white outline-none text-base sm:text-lg font-bold text-slate-700 transition-all"
                  value={formData.wordTypeEn}
                  onChange={e => setFormData({...formData, wordTypeEn: e.target.value})}
                  placeholder="noun"
                />
              </div>
              <div className="space-y-1 sm:space-y-2">
                <label className="text-[10px] sm:text-xs font-black text-slate-400 uppercase tracking-widest ml-4">Tr. Tür</label>
                <input 
                  className="w-full bg-slate-50 border-4 border-transparent rounded-2xl sm:rounded-[2rem] p-3 sm:p-4 focus:border-blue-100 focus:bg-white outline-none text-base sm:text-lg font-bold text-slate-700 transition-all"
                  value={formData.wordTypeTr}
                  onChange={e => setFormData({...formData, wordTypeTr: e.target.value})}
                  placeholder="isim"
                />
              </div>
            </div>

            <div className="space-y-1 sm:space-y-2">
              <label className="text-[10px] sm:text-xs font-black text-slate-400 uppercase tracking-widest ml-4">Türkçe Anlamı (turkish)</label>
              <input 
                required
                className="w-full bg-slate-50 border-4 border-transparent rounded-2xl sm:rounded-[2rem] p-3 sm:p-4 focus:border-blue-100 focus:bg-white outline-none text-lg sm:text-xl font-bold text-slate-700 transition-all"
                value={formData.meaning}
                onChange={e => setFormData({...formData, meaning: e.target.value})}
                placeholder="Örn: Dayanıklılık"
              />
            </div>

            <div className="space-y-1 sm:space-y-2">
              <label className="text-[10px] sm:text-xs font-black text-slate-400 uppercase tracking-widest ml-4">Örnek Cümle (İngilizce)</label>
              <input 
                className="w-full bg-slate-50 border-4 border-transparent rounded-2xl sm:rounded-[2rem] p-3 sm:p-4 focus:border-blue-100 focus:bg-white outline-none text-base sm:text-lg font-medium text-slate-700 transition-all"
                value={formData.exampleSentence}
                onChange={e => setFormData({...formData, exampleSentence: e.target.value})}
                placeholder="Example sentence..."
              />
            </div>

            <div className="space-y-1 sm:space-y-2">
              <label className="text-[10px] sm:text-xs font-black text-slate-400 uppercase tracking-widest ml-4">Cümle Çevirisi (Türkçe)</label>
              <input 
                className="w-full bg-slate-50 border-4 border-transparent rounded-2xl sm:rounded-[2rem] p-3 sm:p-4 focus:border-blue-100 focus:bg-white outline-none text-base sm:text-lg font-medium text-slate-700 transition-all"
                value={formData.exampleSentenceTurkish}
                onChange={e => setFormData({...formData, exampleSentenceTurkish: e.target.value})}
                placeholder="Cümle çevirisi..."
              />
            </div>

            <button 
              type="submit"
              className="w-full py-4 sm:py-5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl sm:rounded-[2.5rem] font-black text-xl sm:text-2xl shadow-2xl shadow-indigo-100 transition-all mt-4 active:scale-95"
            >
              {initialData ? 'Güncelle ✨' : 'Listeme Ekle! 🌈'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddWordModal;
