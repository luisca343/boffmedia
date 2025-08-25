import { TwitchStream, TwitchVideo, TwitchClip } from "../types";

export interface HistoryItem {
  id: string;
  type: 'stream' | 'video' | 'clip';
  title: string;
  streamer_name: string;
  thumbnail_url: string;
  created_at?: string;
  timestamp: number; // when the item was watched
  duration?: string; // for videos and clips
  view_count?: number;
}

const HISTORY_KEY = 'twitch-history';
const MAX_HISTORY_ITEMS = 50; // Limit history size

/**
 * Add a stream/video/clip to watch history
 */
export const addToHistory = (item: TwitchStream | TwitchVideo | TwitchClip, type: 'stream' | 'video' | 'clip'): void => {
  try {
    const currentHistory = getHistory();
    
    // Create history item with timestamp
    const historyItem: HistoryItem = {
      id: item.id,
      type,
      title: item.title,
      streamer_name: type === 'stream' ? (item as TwitchStream).user_name : 
                     type === 'video' ? (item as TwitchVideo).user_name :
                     (item as TwitchClip).broadcaster_name,
      thumbnail_url: item.thumbnail_url,
      created_at: type === 'stream' ? (item as TwitchStream).started_at :
                   type === 'video' ? (item as TwitchVideo).created_at :
                   (item as TwitchClip).created_at,
      timestamp: Date.now(),
      duration: type === 'video' ? (item as TwitchVideo).duration :
                type === 'clip' ? `${(item as TwitchClip).duration}s` : undefined,
      view_count: type === 'stream' ? (item as TwitchStream).viewer_count :
                  type === 'video' ? (item as TwitchVideo).view_count :
                  (item as TwitchClip).view_count
    };
    
    // Remove if already exists (to move it to the top)
    const filteredHistory = currentHistory.filter(historyItem => 
      !(historyItem.id === item.id && historyItem.type === type)
    );
    
    // Add to top of list (most recent first)
    const newHistory = [historyItem, ...filteredHistory].slice(0, MAX_HISTORY_ITEMS);
    
    localStorage.setItem(HISTORY_KEY, JSON.stringify(newHistory));
  } catch (error) {
    console.error('Error adding to history:', error);
  }
};

/**
 * Get the watch history
 */
export const getHistory = (): HistoryItem[] => {
  try {
    const historyJSON = localStorage.getItem(HISTORY_KEY);
    return historyJSON ? JSON.parse(historyJSON) : [];
  } catch (error) {
    console.error('Error retrieving history:', error);
    return [];
  }
};

/**
 * Clear watch history
 */
export const clearHistory = (): void => {
  try {
    localStorage.removeItem(HISTORY_KEY);
  } catch (error) {
    console.error('Error clearing history:', error);
  }
};

/**
 * Remove a specific item from history
 */
export const removeFromHistory = (id: string, type: 'stream' | 'video' | 'clip'): void => {
  try {
    const currentHistory = getHistory();
    const newHistory = currentHistory.filter(item => 
      !(item.id === id && item.type === type)
    );
    localStorage.setItem(HISTORY_KEY, JSON.stringify(newHistory));
  } catch (error) {
    console.error('Error removing from history:', error);
  }
};

/**
 * Check if an item exists in history
 */
export const isInHistory = (id: string, type: 'stream' | 'video' | 'clip'): boolean => {
  try {
    const history = getHistory();
    return history.some(item => item.id === id && item.type === type);
  } catch (error) {
    console.error('Error checking history:', error);
    return false;
  }
};
