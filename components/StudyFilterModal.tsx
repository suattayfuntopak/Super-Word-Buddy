import React, { useState, useEffect } from 'react';
import { VocabularyItem, StudyFilterConfig, SavedStudyFilter } from '../types';
import { Lang, translations } from '../utils/i18n';
import { getAllUserTags } from '../utils/wordTags';
import {
  getStoredSavedFilters,
  saveFilterDB,
  deleteFilterDB,
  loadSavedFiltersFromDB
} from '../utils/studyFilters';

interface StudyFilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  vocabItems: VocabularyItem[];
  wordTagsMap: Record<string, string[]>;
  favoriteIds: Set<string>;
  lang: Lang;
  userId: string;
  activeFilter: StudyFilterConfig | null;
  onApply: (filter: StudyFilterConfig | null) => void;
}

const StudyFilterModal: React.FC<StudyFilterModalProps> = ({
  isOpen,
  onClose,
  vocabItems,
  wordTagsMap,
  favoriteIds,
  lang,
  userId,
  activeFilter,
  onApply
}) => {
  const t = translations[lang];

  // Temporary filter configurations inside modal
  const [tempFilter, setTempFilter] = useState<StudyFilterConfig>({
    wordTypes: [],
    tags: [],
    favoritesOnly: false,
    searchTerm: ''
  });

  const [savedFilters, setSavedFilters] = useState<SavedStudyFilter[]>([]);
  const [newFilterName, setNewFilterName] = useState('');
  const [saveError, setSaveError] = useState<string | null>(null);

  // Load active filter values on open
  useEffect(() => {
    if (isOpen) {
      if (activeFilter) {
        setTempFilter(activeFilter);
      } else {
        setTempFilter({
          wordTypes: [],
          tags: [],
          favoritesOnly: false,
          searchTerm: ''
        });
      }
      setNewFilterName('');
      setSaveError(null);
    }
  }, [isOpen, activeFilter]);

  // Load saved filters list
  useEffect(() => {
    if (isOpen && userId) {
      loadSavedFiltersFromDB(userId).then(list => setSavedFilters(list));
    } else if (isOpen) {
      setSavedFilters(getStoredSavedFilters(''));
    }
  }, [isOpen, userId]);

  if (!isOpen) return null;

  // Extract unique word types dynamically from vocabulary
  const uniqueWordTypes: string[] = Array.from(
    new Set<string>(
      vocabItems
        .map(item => item.wordTypeEn?.trim().toLowerCase())
        .filter(Boolean) as string[]
    )
  ).sort();

  // Get user tags
  const allTags = getAllUserTags(userId);

  // Dynamic helper to check counts
  const getWordTypeCount = (type: string) => {
    return vocabItems.filter(
      item => item.wordTypeEn?.trim().toLowerCase() === type.toLowerCase()
    ).length;
  };

  const getTagCount = (tag: string) => {
    return vocabItems.filter(item => (wordTagsMap[item.id] || []).includes(tag)).length;
  };

  // Helper to determine the number of matching items in real-time
  const getMatchingCount = (config: StudyFilterConfig) => {
    return vocabItems.filter(item => {
      // 1. Word Types
      if (config.wordTypes.length > 0) {
        const itemType = item.wordTypeEn?.trim().toLowerCase();
        const matchesType = config.wordTypes.some(t => t.toLowerCase() === itemType);
        if (!matchesType) return false;
      }
      // 2. Tags
      if (config.tags.length > 0) {
        const itemTags = wordTagsMap[item.id] || [];
        const matchesTag = config.tags.some(t => itemTags.includes(t));
        if (!matchesTag) return false;
      }
      // 3. Favorites Only
      if (config.favoritesOnly) {
        if (!favoriteIds.has(item.id)) return false;
      }
      // 4. Search Term
      if (config.searchTerm) {
        const s = config.searchTerm.toLowerCase().trim();
        const matchesSearch =
          item.word.toLowerCase().includes(s) || item.meaning.toLowerCase().includes(s);
        if (!matchesSearch) return false;
      }
      return true;
    }).length;
  };

  const matchingCount = getMatchingCount(tempFilter);

  // Handlers for chip selections
  const toggleWordType = (type: string) => {
    setTempFilter(prev => {
      const isSelected = prev.wordTypes.includes(type);
      return {
        ...prev,
        wordTypes: isSelected
          ? prev.wordTypes.filter(t => t !== type)
          : [...prev.wordTypes, type]
      };
    });
  };

  const toggleTag = (tag: string) => {
    setTempFilter(prev => {
      const isSelected = prev.tags.includes(tag);
      return {
        ...prev,
        tags: isSelected ? prev.tags.filter(t => t !== tag) : [...prev.tags, tag]
      };
    });
  };

  const handleApply = () => {
    // If filter is empty, treat it as null (default all)
    const isEmpty =
      tempFilter.wordTypes.length === 0 &&
      tempFilter.tags.length === 0 &&
      !tempFilter.favoritesOnly &&
      tempFilter.searchTerm.trim() === '';
    onApply(isEmpty ? null : tempFilter);
    onClose();
  };

  const handleReset = () => {
    onApply(null);
    onClose();
  };

  const handleSaveFilter = async () => {
    if (!newFilterName.trim()) return;
    setSaveError(null);
    try {
      const updated = await saveFilterDB(userId, newFilterName.trim(), tempFilter);
      setSavedFilters(updated);
      setNewFilterName('');
    } catch (err: any) {
      setSaveError(err.message || 'Error saving filter');
    }
  };

  const handleDeleteFilter = async (name: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Avoid loading the filter
    try {
      const updated = await deleteFilterDB(userId, name);
      setSavedFilters(updated);
    } catch (err: any) {
      console.error('Failed to delete saved filter:', err);
    }
  };

  const handleLoadFilter = (config: StudyFilterConfig) => {
    setTempFilter(config);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-xl rounded-[2.5rem] sm:rounded-[4rem] shadow-3xl p-6 sm:p-10 border-4 border-white relative overflow-hidden h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center mb-4 shrink-0">
          <div>
            <h2 className="text-xl sm:text-3xl font-black text-slate-800 tracking-tight leading-none">
              {t.studyFilterTitle}
            </h2>
            <p className="text-xs text-slate-400 font-bold mt-1">{t.studyFilterSub}</p>
          </div>
          <button
            onClick={onClose}
            className="bg-slate-50 text-slate-400 hover:text-slate-600 p-2 sm:p-3 rounded-full transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={3}
              stroke="currentColor"
              className="w-5 h-5 sm:w-6 h-6"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content Area with scroll */}
        <div className="flex-1 overflow-y-auto space-y-6 pr-1 pb-6 scrollbar-thin">
          {/* 1. Word Types Group */}
          {uniqueWordTypes.length > 0 && (
            <div className="space-y-2">
              <label className="text-[10px] sm:text-xs font-black text-slate-400 uppercase tracking-widest ml-1">
                {t.wordTypesLabel}
              </label>
              <div className="flex flex-wrap gap-2">
                {uniqueWordTypes.map(type => {
                  const isSelected = tempFilter.wordTypes.includes(type);
                  const count = getWordTypeCount(type);
                  return (
                    <button
                      key={type}
                      type="button"
                      onClick={() => toggleWordType(type)}
                      className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-2xl text-xs sm:text-sm font-black transition-all border-2 flex items-center gap-1.5 ${
                        isSelected
                          ? 'bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-100 scale-105'
                          : 'bg-slate-50 hover:bg-indigo-50 border-transparent text-slate-600 hover:text-indigo-600 hover:border-indigo-100'
                      }`}
                    >
                      <span>{type}</span>
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                          isSelected
                            ? 'bg-indigo-700 text-indigo-100'
                            : 'bg-slate-200/60 text-slate-400'
                        }`}
                      >
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* 2. User Tags Group */}
          {allTags.length > 0 && (
            <div className="space-y-2">
              <label className="text-[10px] sm:text-xs font-black text-slate-400 uppercase tracking-widest ml-1">
                {t.tagsLabel}
              </label>
              <div className="flex flex-wrap gap-2">
                {allTags.map(tag => {
                  const isSelected = tempFilter.tags.includes(tag);
                  const count = getTagCount(tag);
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggleTag(tag)}
                      className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-2xl text-xs sm:text-sm font-black transition-all border-2 flex items-center gap-1.5 ${
                        isSelected
                          ? 'bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-100 scale-105'
                          : 'bg-slate-50 hover:bg-indigo-50 border-transparent text-slate-600 hover:text-indigo-600 hover:border-indigo-100'
                      }`}
                    >
                      <span>🏷️ {tag}</span>
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                          isSelected
                            ? 'bg-indigo-700 text-indigo-100'
                            : 'bg-slate-200/60 text-slate-400'
                        }`}
                      >
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* 3. Favorites & Search Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] sm:text-xs font-black text-slate-400 uppercase tracking-widest ml-1">
                {t.favsLabel}
              </label>
              <button
                type="button"
                onClick={() =>
                  setTempFilter(prev => ({ ...prev, favoritesOnly: !prev.favoritesOnly }))
                }
                className={`w-full px-4 py-3 sm:py-4 rounded-2xl font-black text-sm transition-all border-2 flex items-center justify-between ${
                  tempFilter.favoritesOnly
                    ? 'bg-red-50 border-red-200 text-red-500 shadow-md shadow-red-50'
                    : 'bg-slate-50 border-transparent text-slate-500 hover:bg-red-50/20 hover:border-red-100 hover:text-red-400'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span>❤️</span>
                  <span>{t.favoritesFilter}</span>
                </div>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                    tempFilter.favoritesOnly ? 'bg-red-200 text-red-700' : 'bg-slate-200 text-slate-400'
                  }`}
                >
                  {favoriteIds.size}
                </span>
              </button>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] sm:text-xs font-black text-slate-400 uppercase tracking-widest ml-1">
                {t.searchLabel}
              </label>
              <input
                type="text"
                value={tempFilter.searchTerm}
                onChange={e => setTempFilter(prev => ({ ...prev, searchTerm: e.target.value }))}
                placeholder={t.searchPlaceholder}
                className="w-full bg-slate-50 border-2 border-transparent rounded-2xl px-4 py-3 text-sm font-bold focus:border-indigo-100 focus:bg-white outline-none text-slate-700 transition-all"
              />
            </div>
          </div>

          {/* 4. Save Current Filter */}
          {userId && (
            <div className="p-4 bg-indigo-50/50 rounded-3xl border border-indigo-100/50 space-y-3">
              <h4 className="text-xs font-black text-indigo-500 uppercase tracking-wider">
                💾 {t.saveFilterPrompt}
              </h4>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newFilterName}
                  onChange={e => setNewFilterName(e.target.value)}
                  placeholder={t.saveFilterNamePlaceholder}
                  className="flex-1 bg-white border border-indigo-100 rounded-xl px-3 py-2 text-xs font-bold focus:border-indigo-400 outline-none text-slate-700"
                />
                <button
                  type="button"
                  onClick={handleSaveFilter}
                  disabled={!newFilterName.trim()}
                  className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white font-black text-xs px-4 py-2 rounded-xl transition-all shadow-md active:scale-95"
                >
                  {t.saveBtn}
                </button>
              </div>
              {saveError && <p className="text-[10px] text-red-500 font-bold">{saveError}</p>}
            </div>
          )}

          {/* 5. Saved Filters List */}
          {userId && (
            <div className="space-y-2">
              <label className="text-[10px] sm:text-xs font-black text-slate-400 uppercase tracking-widest ml-1">
                📂 {t.savedFiltersLabel}
              </label>
              {savedFilters.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {savedFilters.map(sf => {
                    // Check if current config matches this saved filter configuration
                    const matchesConfig =
                      JSON.stringify(sf.config.wordTypes.sort()) ===
                        JSON.stringify(tempFilter.wordTypes.sort()) &&
                      JSON.stringify(sf.config.tags.sort()) ===
                        JSON.stringify(tempFilter.tags.sort()) &&
                      sf.config.favoritesOnly === tempFilter.favoritesOnly &&
                      sf.config.searchTerm === tempFilter.searchTerm;

                    return (
                      <div
                        key={sf.name}
                        onClick={() => handleLoadFilter(sf.config)}
                        className={`p-3 rounded-2xl border-2 flex items-center justify-between cursor-pointer transition-all ${
                          matchesConfig
                            ? 'bg-indigo-50 border-indigo-200 text-indigo-700 font-black'
                            : 'bg-slate-50 border-transparent text-slate-600 font-bold hover:bg-slate-100'
                        }`}
                      >
                        <span className="text-xs truncate mr-2">{sf.name}</span>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] text-slate-400">
                            ({getMatchingCount(sf.config)})
                          </span>
                          <button
                            type="button"
                            onClick={e => handleDeleteFilter(sf.name, e)}
                            className="text-slate-300 hover:text-red-500 transition-colors p-1"
                            title="Delete"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic pl-1">{t.noSavedFilters}</p>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="border-t border-slate-100 pt-4 shrink-0 space-y-3">
          {/* Matched Count Counter */}
          <div className="text-center font-black text-sm text-slate-700 flex justify-center items-center gap-2">
            <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping"></span>
            <span>{t.matchCountText(matchingCount)}</span>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleApply}
              className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black text-sm sm:text-base shadow-xl shadow-indigo-100 transition-all text-center active:scale-95"
            >
              {t.applyFilterBtn}
            </button>
            <button
              onClick={handleReset}
              className="py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-2xl font-black text-xs sm:text-sm transition-all"
            >
              {t.resetFilterBtn}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudyFilterModal;
