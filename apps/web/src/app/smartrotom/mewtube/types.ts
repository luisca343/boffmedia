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
  
  // YouTube calls now go through the server proxy (/api/youtube), which injects
  // YOUTUBE_API_KEY server-side — the key is never shipped to the browser.