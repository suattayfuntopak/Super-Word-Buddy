import { supabase } from '../services/supabaseClient';

export interface WordStat {
  word_id: string;
  correct: number;
  wrong: number;
  last_seen: string;
}

export const logWordResults = async (
  userId: string,
  results: Array<{ wordId: string; correct: number; wrong: number }>
): Promise<void> => {
  if (!results.length) return;
  try {
    await Promise.all(
      results.map(r =>
        supabase.rpc('upsert_word_stat', {
          p_user_id: userId,
          p_word_id: r.wordId,
          p_correct: r.correct,
          p_wrong:   r.wrong,
        })
      )
    );
  } catch (e) {
    console.error('Word stats sync failed:', e);
  }
};

export const loadWordStats = async (userId: string): Promise<WordStat[]> => {
  try {
    const { data, error } = await supabase
      .from('user_word_stats')
      .select('word_id, correct, wrong, last_seen')
      .eq('user_id', userId)
      .order('wrong', { ascending: false })
      .limit(10);
    if (error) throw error;
    return data || [];
  } catch {
    return [];
  }
};
