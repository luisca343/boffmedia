export interface StreamNotification {
  stream: {
    id: string;
    user_name: string;
    title: string;
    game_name: string;
    viewer_count: number;
    started_at: string;
    thumbnail_url: string;
    tags: string[];
  };
  isLive: boolean;
  isNewStream: boolean;
  timestamp: Date;
}

export interface NotificationTarget {
  type: 'discord' | 'webhook' | 'database';
  config: {
    // Discord specific
    channelId?: string;
    botToken?: string;
    
    // Webhook specific
    url?: string;
    headers?: Record<string, string>;
    
    // Database specific
    table?: string;
    
    // Common
    message?: string;
    template?: string;
  };
}
