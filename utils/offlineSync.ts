import { supabase } from '../services/supabaseClient';

export interface OfflineOp {
  id: string;
  type: 'favorite' | 'tag';
  action: 'add' | 'remove' | 'set';
  wordId: string;
  value?: any; // holds tags string array for tags
  timestamp: number;
}

const queueKey = (userId: string) => `swb_offline_queue_${userId}`;

export const getOfflineQueue = (userId: string): OfflineOp[] => {
  if (!userId) return [];
  try {
    const raw = localStorage.getItem(queueKey(userId));
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

export const saveOfflineQueue = (userId: string, queue: OfflineOp[]): void => {
  if (!userId) return;
  localStorage.setItem(queueKey(userId), JSON.stringify(queue));
};

export const queueOfflineOp = (
  userId: string,
  op: Omit<OfflineOp, 'id' | 'timestamp'>
): void => {
  if (!userId) return;
  const queue = getOfflineQueue(userId);
  
  // Clean up existing operations for the same word and type to prevent redundant runs
  const filtered = queue.filter(item => !(item.wordId === op.wordId && item.type === op.type));
  
  const newOp: OfflineOp = {
    ...op,
    id: Math.random().toString(36).substring(2) + Date.now().toString(36),
    timestamp: Date.now()
  };
  
  filtered.push(newOp);
  saveOfflineQueue(userId, filtered);
  console.log('Queued offline operation:', newOp);
};

export const drainOfflineQueue = async (userId: string): Promise<void> => {
  if (!userId || !navigator.onLine) return;
  const queue = getOfflineQueue(userId);
  if (queue.length === 0) return;

  console.log(`Draining offline queue with ${queue.length} operations...`);
  const failedOps: OfflineOp[] = [];

  for (const op of queue) {
    try {
      if (op.type === 'favorite') {
        if (op.action === 'add') {
          const { error } = await supabase
            .from('user_favorites')
            .upsert({ user_id: userId, word_id: op.wordId }, { onConflict: 'user_id,word_id', ignoreDuplicates: true });
          if (error) throw error;
        } else if (op.action === 'remove') {
          const { error } = await supabase
            .from('user_favorites')
            .delete()
            .eq('user_id', userId)
            .eq('word_id', op.wordId);
          if (error) throw error;
        }
      } else if (op.type === 'tag') {
        const tags = op.value || [];
        if (tags.length === 0) {
          const { error } = await supabase
            .from('user_word_tags')
            .delete()
            .eq('user_id', userId)
            .eq('word_id', op.wordId);
          if (error) throw error;
        } else {
          const { error } = await supabase
            .from('user_word_tags')
            .upsert(
              { user_id: userId, word_id: op.wordId, tags, updated_at: new Date().toISOString() },
              { onConflict: 'user_id,word_id' }
            );
          if (error) throw error;
        }
      }
      console.log(`Successfully synced offline operation: ${op.type} - ${op.action} for ${op.wordId}`);
    } catch (err) {
      console.error(`Failed to sync offline operation ${op.id}:`, err);
      failedOps.push(op); // Keep failed operations to retry later
    }
  }

  saveOfflineQueue(userId, failedOps);
  if (failedOps.length === 0) {
    console.log('Offline queue drained successfully!');
  } else {
    console.log(`Offline queue drained, but ${failedOps.length} operations failed and will retry later.`);
  }
};
