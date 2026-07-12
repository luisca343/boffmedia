export interface Video {
    etag?: string;
    id: {
      kind?: string;
      videoId?: string;
    } | string;
    snippet: {
      resourceId?: {
        videoId: string;
        kind?: string;
      };
      title: string;
      channelTitle: string;
      channelId: string;
      publishedAt: string;
      description?: string;
      thumbnails: {
        medium?: {
          url: string;
        };
        high?: {
          url: string;
        };
        default?: {
          url: string;
        };
      };
    };
    statistics?: {
      viewCount: string;
      likeCount?: string;
      commentCount?: string;
    };
    timestamp?: number;
  }
  
  export interface ChannelInfo {
    snippet: {
      title: string;
      description: string;
      thumbnails: {
        medium: {
          url: string;
          width: number;
          height: number;
        };
        high: {
          url: string;
        };
        default: {
          url: string;
        };
      };
      customUrl: string;
      publishedAt: string;
    };
    statistics: {
      subscriberCount: string;
      videoCount: string;
      viewCount: string;
    };
    brandingSettings?: {
      image?: {
        bannerExternalUrl?: string;
      };
    };
  }
  
  export interface VideoDetails {
    snippet: {
      title: string;
      description: string;
      channelTitle: string;
      channelId: string;
      publishedAt: string;
    };
    statistics: {
      viewCount: string;
      likeCount: string;
      commentCount: string;
    };
  }
  
  // Utility functions for formatting
  export const formatNumber = (num: string): string => {
    const n = parseInt(num);
    if (n >= 1000000) {
      return (n / 1000000).toFixed(1) + 'M';
    } else if (n >= 1000) {
      return (n / 1000).toFixed(1) + 'K';
    }
    return n.toLocaleString();
  };
  
  export const formatDate = (dateString: string): string => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };
  
  export const formatLongDate = (dateString: string): string => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // YouTube calls now go through the server proxy (/api/youtube), which injects
  // YOUTUBE_API_KEY server-side — the key is never shipped to the browser.