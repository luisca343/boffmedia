import { Video } from "../types";

export interface HistoryItem extends Omit<Video, 'etag'> {
  timestamp: number; // when the video was watched
}

const HISTORY_KEY = 'youtube-history';
const MAX_HISTORY_ITEMS = 50; // Limit history size

/**
 * Add a video to watch history
 */
export const addToHistory = (video: Video): void => {
    try {
      const currentHistory = getHistory();
      
      // Extract the video ID consistently
      const videoId = typeof video.id === 'string' 
        ? video.id 
        : video.id?.videoId || video.snippet.resourceId?.videoId;
      
      if (!videoId) {
        console.error("Cannot add video to history: missing ID", video);
        return;
      }
      
      // Create history item with timestamp and consistent ID
      const historyItem: HistoryItem = {
        ...video,
        id: videoId, // Store ID consistently as a string
        timestamp: Date.now()
      };
      
      // Remove if already exists (to move it to the top)
      const filteredHistory = currentHistory.filter(item => {
        // Get ID consistently
        const existingId = typeof item.id === 'string' 
          ? item.id 
          : item.id?.videoId || item.snippet.resourceId?.videoId;
        
        return existingId !== videoId;
      });
      
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
 * Remove a specific video from history
 */
export const removeFromHistory = (videoId: string): void => {
  try {
    const currentHistory = getHistory();
    const newHistory = currentHistory.filter(item => {
      const id = typeof item.id === 'string' ? item.id : item.id?.videoId || item.snippet.resourceId?.videoId;
      return id !== videoId;
    });
    localStorage.setItem(HISTORY_KEY, JSON.stringify(newHistory));
  } catch (error) {
    console.error('Error removing from history:', error);
  }
};

/**
 * Check if a video exists in history
 */
export const isInHistory = (videoId: string): boolean => {
  try {
    const history = getHistory();
    return history.some(item => {
      const id = typeof item.id === 'string' ? item.id : item.id?.videoId || item.snippet.resourceId?.videoId;
      return id === videoId;
    });
  } catch (error) {
    console.error('Error checking history:', error);
    return false;
  }
};